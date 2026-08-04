import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status

from app.models.profile_schemas import (
    StaffProfileResponse, StaffProfileUpdateRequest, StaffProfileUpdateResponse
)
from app.db.supabase_client import supabase
from app.core.deps import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])

MAX_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def _upload_profile_photo(image: UploadFile) -> str:
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Image must be JPEG, PNG, or WEBP.",
        )
    contents = await image.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Image must be under 5MB.",
        )
    ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
    path = f"{uuid.uuid4()}.{ext}"
    supabase.storage.from_("profile-photos").upload(
        path, contents, {"content-type": image.content_type}
    )
    public_url = supabase.storage.from_("profile-photos").get_public_url(path)
    return public_url


def _to_profile_response(user: dict) -> StaffProfileResponse:
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


@router.get("/me", response_model=StaffProfileResponse)
async def get_my_profile(user: dict = Depends(get_current_user)):
    return _to_profile_response(user)


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

    for protected_field in ("role", "id", "email", "is_active", "first_login"):
        update_data.pop(protected_field, None)

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = supabase.table("users").update(update_data).eq("id", user["id"]).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile."
        )

    return StaffProfileUpdateResponse(profile=_to_profile_response(result.data[0]))


@router.put("/me/photo", response_model=StaffProfileUpdateResponse)
async def update_my_profile_photo(
    image: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    new_url = await _upload_profile_photo(image)

    # Best-effort cleanup of the old photo, if one existed
    old_url = user.get("profile_photo_url")
    if old_url:
        try:
            old_path = old_url.split("/profile-photos/")[-1]
            supabase.storage.from_("profile-photos").remove([old_path])
        except Exception:
            pass  # cleanup failure shouldn't block the update

    result = (
        supabase.table("users")
        .update({
            "profile_photo_url": new_url,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        .eq("id", user["id"])
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile photo."
        )

    return StaffProfileUpdateResponse(profile=_to_profile_response(result.data[0]))
