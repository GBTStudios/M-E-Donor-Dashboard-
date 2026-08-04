from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.profile_schemas import (
    StaffProfileResponse, StaffProfileUpdateRequest, StaffProfileUpdateResponse
)
from app.db.supabase_client import supabase
from app.core.deps import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=StaffProfileResponse)
async def get_my_profile(user: dict = Depends(get_current_user)):
    return StaffProfileResponse(
        id=user["id"],
        email=user["email"],
        full_name=user.get("full_name", ""),
        phone=user.get("phone"),
        role=user["role"],
        department=user.get("department"),
        profile_photo_url=user.get("profile_photo_url"),
        bio=user.get("bio"),
        updated_at=user.get("updated_at"),
    )


@router.put("/me", response_model=StaffProfileUpdateResponse)
async def update_my_profile(
    payload: StaffProfileUpdateRequest,
    user: dict = Depends(get_current_user),
):
    update_data = payload.model_dump(exclude_unset=True, exclude_none=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields provided to update."
        )

    # Extra safety: strip anything that could touch role/permissions,
    # even though the schema itself already excludes these fields.
    for protected_field in ("role", "id", "email", "is_active", "first_login"):
        update_data.pop(protected_field, None)

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = (
        supabase.table("users")
        .update(update_data)
        .eq("id", user["id"])
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile."
        )

    updated_user = result.data[0]

    return StaffProfileUpdateResponse(
        profile=StaffProfileResponse(
            id=updated_user["id"],
            email=updated_user["email"],
            full_name=updated_user.get("full_name", ""),
            phone=updated_user.get("phone"),
            role=updated_user["role"],
            department=updated_user.get("department"),
            profile_photo_url=updated_user.get("profile_photo_url"),
            bio=updated_user.get("bio"),
            updated_at=updated_user.get("updated_at"),
        )
    )
