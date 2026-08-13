from pydantic import BaseModel
from typing import Optional, Literal


class UserSettingsResponse(BaseModel):
    email_alerts: Optional[bool] = None
    in_app_alerts: Optional[bool] = None
    security_alerts: Optional[bool] = None
    theme: Optional[Literal["light", "dark", "system"]] = None
    quarterly_report_ready: Optional[bool] = None
    new_cohort_milestones: Optional[bool] = None
    answer_corrections: Optional[bool] = None
    language: Optional[Literal["English", "German"]] = None
    timezone: Optional[str] = None
    updated_at: Optional[str] = None


class UpdateNotificationPreferencesRequest(BaseModel):
    email_alerts: Optional[bool] = None
    in_app_alerts: Optional[bool] = None
    security_alerts: Optional[bool] = None
    quarterly_report_ready: Optional[bool] = None
    new_cohort_milestones: Optional[bool] = None
    answer_corrections: Optional[bool] = None


class UpdateThemeRequest(BaseModel):
    theme: Literal["light", "dark", "system"]


class UpdateRegionalPreferencesRequest(BaseModel):
    language: Optional[Literal["English", "German"]] = None
    timezone: Optional[str] = None


class SettingsUpdateResponse(BaseModel):
    message: str
    settings: UserSettingsResponse
