import secrets
import string

from fastapi import APIRouter, HTTPException, status, Depends

from app.models.onboarding_schemas import (
    SetFirstPasswordRequest, SetFirstPasswordResponse,
    CreateAdminRequest, CreateAdminResponse,
    DeactivateUserRequest, DeactivateUserResponse,
    AdminUserOut,
)
from app.db.supabase_client import supabase
from app.core.security import hash_password
from app.core.deps import get_current_user, get_current_superadmin_user
from app.services.notification_service import create_notification

router = APIRouter(tags=["admin-onboarding"])

SYMBOLS = "!@#$%^&*"


def generate_temp_password(length: int = 12) -> str:
    """Generates a random password guaranteed to include at least one
    uppercase letter, one lowercase letter, one digit, and one symbol,
    with all characters shuffled - not in a fixed/predictable position."""
    required = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice(SYMBOLS),
    ]
    remaining_alphabet = string.ascii_letters + string.digits + SYMBOLS
    remaining = [secrets.choice(remaining_alphabet) for _ in range(length - len(required))]
    password_chars = required + remaining
    for i in range(len(password_chars) - 1, 0, -1):
        j = secrets.randbelow(i + 1)
        password_chars[i], password_chars[j] = password_chars[j], password_chars[i]
    return "".join(password_chars)


@router.post("/auth/set-first-password", response_model=SetFirstPasswordResponse)
async def set_first_password(
    payload: SetFirstPasswordRequest,
    user: dict = Depends(get_current_user),
):
    hashed = hash_password(payload.new_password)

    supabase.table("users").update({
        "hashed_password": hashed,
        "first_login": False
    }).eq("id", user["id"]).execute()

    return SetFirstPasswordResponse()


@router.post("/admin/create-user", response_model=CreateAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_admin(
    payload: CreateAdminRequest,
    _: dict = Depends(get_current_superadmin_user),
):
    existing = supabase.table("users").select("id").eq("email", payload.email).execute()

    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    temp_password = generate_temp_password()
    hashed = hash_password(temp_password)

    result = supabase.table("users").insert({
        "email": payload.email,
        "hashed_password": hashed,
        "full_name": payload.full_name,
        "is_verified": True,
        "role": "admin",
        "first_login": True,
        "is_active": True
    }).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create admin account."
        )

    new_user = result.data[0]

    create_notification(
        "admin_created",
        f"New admin account created: {new_user['full_name']}",
        related_id=new_user["id"],
    )

    return CreateAdminResponse(
        id=new_user["id"],
        email=new_user["email"],
        full_name=new_user["full_name"],
        role=new_user["role"],
        temporary_password=temp_password
    )


@router.post("/admin/deactivate-user", response_model=DeactivateUserResponse)
async def deactivate_user(
    payload: DeactivateUserRequest,
    _: dict = Depends(get_current_superadmin_user),
):
    existing = supabase.table("users").select("id, email, full_name").eq("id", payload.user_id).execute()

    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    supabase.table("users").update({"is_active": False}).eq("id", payload.user_id).execute()

    target = existing.data[0]
    create_notification(
        "admin_deactivated",
        f"Account deactivated: {target.get('full_name') or target.get('email')}",
        related_id=payload.user_id,
    )

    return DeactivateUserResponse(message="Account deactivated.")


@router.post("/admin/reactivate-user", response_model=DeactivateUserResponse)
async def reactivate_user(
    payload: DeactivateUserRequest,
    _: dict = Depends(get_current_superadmin_user),
):
    existing = supabase.table("users").select("id, email, full_name").eq("id", payload.user_id).execute()

    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    supabase.table("users").update({"is_active": True}).eq("id", payload.user_id).execute()

    target = existing.data[0]
    create_notification(
        "admin_reactivated",
        f"Account reactivated: {target.get('full_name') or target.get('email')}",
        related_id=payload.user_id,
    )

    return DeactivateUserResponse(message="Account reactivated.")


@router.post("/admin/delete-user", response_model=DeactivateUserResponse)
async def delete_user(
    payload: DeactivateUserRequest,
    admin: dict = Depends(get_current_superadmin_user),
):
    if payload.user_id == admin["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account.",
        )

    existing = supabase.table("users").select("id, email, full_name, role").eq("id", payload.user_id).execute()

    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    target = existing.data[0]

    if target["role"] == "superadmin":
        superadmin_count = (
            supabase.table("users")
            .select("id", count="exact")
            .eq("role", "superadmin")
            .execute()
        )
        if (superadmin_count.count or 0) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last remaining superadmin account.",
            )

    supabase.table("users").delete().eq("id", payload.user_id).execute()

    create_notification(
        "admin_deleted",
        f"Account permanently deleted: {target.get('full_name') or target.get('email')}",
        related_id=payload.user_id,
    )

    return DeactivateUserResponse(message="Account permanently deleted.")


@router.get("/admin/users", response_model=list[AdminUserOut])
async def list_admin_users(_: dict = Depends(get_current_superadmin_user)):
    result = (
        supabase.table("users")
        .select("id, email, full_name, role, is_active, first_login")
        .in_("role", ["admin", "superadmin"])
        .order("created_at", desc=True)
        .execute()
    )

    return result.data or []
