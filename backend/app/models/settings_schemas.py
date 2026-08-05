from pydantic import BaseModel
from typing import Optional, Literal


class UserSettingsResponse(BaseModel):
    email_alerts: bool
    in_app_alerts: bool
    security_alerts: bool
    theme: Literal["light", "dark", "system"]
    updated_at: Optional[str] = None


class UpdateNotificationPreferencesRequest(BaseModel):
    email_alerts: Optional[bool] = None
    in_app_alerts: Optional[bool] = None
    security_alerts: Optional[bool] = None


class UpdateThemeRequest(BaseModel):
    theme: Literal["light", "dark", "system"]


class SettingsUpdateResponse(BaseModel):
    message: str
    settings: UserSettingsResponse
