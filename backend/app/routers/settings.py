from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.settings_schemas import (
    UserSettingsResponse, UpdateNotificationPreferencesRequest,
    UpdateThemeRequest, UpdateRegionalPreferencesRequest, SettingsUpdateResponse,
)
from app.db.supabase_client import supabase
from app.core.deps import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])

ALL_KEYS = [
    "email_alerts", "in_app_alerts", "security_alerts", "theme",
    "quarterly_report_ready", "new_cohort_milestones", "answer_corrections",
    "language", "timezone",
]

STAFF_ROLES = {"admin", "superadmin"}


def _defaults_for_role(role: str) -> dict:
    """Only the columns relevant to this role get a real default on first
    creation - the rest stay unset (None), so the response never shows
    irrelevant toggles for that account."""
    if role in STAFF_ROLES:
        return {
            "email_alerts": True,
            "in_app_alerts": True,
            "security_alerts": True,
            "theme": "light",
        }
    return {
        "quarterly_report_ready": False,
        "new_cohort_milestones": False,
        "answer_corrections": False,
        "language": "English",
        "timezone": "UTC",
    }


def _get_or_create_settings(user_id: str, role: str) -> dict:
    result = supabase.table("user_settings").select("*").eq("user_id", user_id).execute()

    if result.data:
        return result.data[0]

    insert_result = supabase.table("user_settings").insert({
        "user_id": user_id,
        **_defaults_for_role(role),
    }).execute()

    return insert_result.data[0]


def _to_response(settings: dict) -> UserSettingsResponse:
    return UserSettingsResponse(**{k: settings.get(k) for k in ALL_KEYS}, updated_at=settings.get("updated_at"))


@router.get("/options")
async def get_settings_options():
    """Exposes valid values for restricted settings fields, so the frontend
    doesn't need to hardcode its own copy of the list and risk drifting out
    of sync with backend validation."""
    return {"languages": ["English", "German"]}


@router.get("/me", response_model=UserSettingsResponse, response_model_exclude_none=True)
async def get_my_settings(user: dict = Depends(get_current_user)):
    settings = _get_or_create_settings(user["id"], user["role"])
    return _to_response(settings)


@router.put("/me/notifications", response_model=SettingsUpdateResponse, response_model_exclude_none=True)
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

    _get_or_create_settings(user["id"], user["role"])  # ensure a row exists first

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
        settings=_to_response(updated),
    )


@router.put("/me/theme", response_model=SettingsUpdateResponse, response_model_exclude_none=True)
async def update_theme(
    payload: UpdateThemeRequest,
    user: dict = Depends(get_current_user),
):
    _get_or_create_settings(user["id"], user["role"])

    result = (
        supabase.table("user_settings")
        .update({"theme": payload.theme, "updated_at": datetime.now(timezone.utc).isoformat()})
        .eq("user_id", user["id"])
        .execute()
    )

    updated = result.data[0]

    return SettingsUpdateResponse(
        message="Theme updated.",
        settings=_to_response(updated),
    )


@router.put("/me/regional", response_model=SettingsUpdateResponse, response_model_exclude_none=True)
async def update_regional_preferences(
    payload: UpdateRegionalPreferencesRequest,
    user: dict = Depends(get_current_user),
):
    update_data = payload.model_dump(exclude_unset=True, exclude_none=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields provided to update."
        )

    _get_or_create_settings(user["id"], user["role"])

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = (
        supabase.table("user_settings")
        .update(update_data)
        .eq("user_id", user["id"])
        .execute()
    )

    updated = result.data[0]

    return SettingsUpdateResponse(
        message="Regional preferences updated.",
        settings=_to_response(updated),
    )
