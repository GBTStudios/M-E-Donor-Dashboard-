import secrets
import string

from fastapi import APIRouter, HTTPException, status, Depends

from app.models.onboarding_schemas import (
    SetFirstPasswordRequest, SetFirstPasswordResponse,
    CreateAdminRequest, CreateAdminResponse,
    DeactivateUserRequest, DeactivateUserResponse,
)
from app.db.supabase_client import supabase
from app.core.security import hash_password
from app.core.deps import get_current_user, get_current_superadmin_user

router = APIRouter(tags=["admin-onboarding"])


def generate_temp_password() -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(10)) + "#7"


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
    existing = supabase.table("users").select("id").eq("id", payload.user_id).execute()

    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    supabase.table("users").update({"is_active": False}).eq("id", payload.user_id).execute()

    return DeactivateUserResponse(message="Account deactivated.")


@router.post("/admin/reactivate-user", response_model=DeactivateUserResponse)
async def reactivate_user(
    payload: DeactivateUserRequest,
    _: dict = Depends(get_current_superadmin_user),
):
    existing = supabase.table("users").select("id").eq("id", payload.user_id).execute()

    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    supabase.table("users").update({"is_active": True}).eq("id", payload.user_id).execute()

    return DeactivateUserResponse(message="Account reactivated.")
