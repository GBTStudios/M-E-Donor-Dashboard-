from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.settings_schemas import (
    UserSettingsResponse, UpdateNotificationPreferencesRequest,
    UpdateThemeRequest, SettingsUpdateResponse,
)
from app.db.supabase_client import supabase
from app.core.deps import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])

DEFAULTS = {
    "email_alerts": True,
    "in_app_alerts": True,
    "security_alerts": True,
    "theme": "light",
}


def _get_or_create_settings(user_id: str) -> dict:
    result = supabase.table("user_settings").select("*").eq("user_id", user_id).execute()

    if result.data:
        return result.data[0]

    insert_result = supabase.table("user_settings").insert({
        "user_id": user_id,
        **DEFAULTS,
    }).execute()

    return insert_result.data[0]


@router.get("/me", response_model=UserSettingsResponse)
async def get_my_settings(user: dict = Depends(get_current_user)):
    settings = _get_or_create_settings(user["id"])
    return UserSettingsResponse(**{k: settings[k] for k in DEFAULTS}, updated_at=settings.get("updated_at"))


@router.put("/me/notifications", response_model=SettingsUpdateResponse)
async def update_notification_preferences(
    payload: UpdateNotificationPreferencesRequest,
    user: dict = Depends(get_current_user),
):
    update_data = payload.model_dump(exclude_unset=True, exclude_none=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields provided to update."
        )

    _get_or_create_settings(user["id"])  # ensure a row exists first

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = (
        supabase.table("user_settings")
        .update(update_data)
        .eq("user_id", user["id"])
        .execute()
    )

    updated = result.data[0]

    return SettingsUpdateResponse(
        message="Notification preferences updated.",
        settings=UserSettingsResponse(**{k: updated[k] for k in DEFAULTS}, updated_at=updated.get("updated_at")),
    )


@router.put("/me/theme", response_model=SettingsUpdateResponse)
async def update_theme(
    payload: UpdateThemeRequest,
    user: dict = Depends(get_current_user),
):
    _get_or_create_settings(user["id"])

    result = (
        supabase.table("user_settings")
        .update({"theme": payload.theme, "updated_at": datetime.now(timezone.utc).isoformat()})
        .eq("user_id", user["id"])
        .execute()
    )

    updated = result.data[0]

    return SettingsUpdateResponse(
        message="Theme updated.",
        settings=UserSettingsResponse(**{k: updated[k] for k in DEFAULTS}, updated_at=updated.get("updated_at")),
    )
