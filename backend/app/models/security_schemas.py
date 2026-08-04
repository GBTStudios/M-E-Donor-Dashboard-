from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        if not any(not c.isalnum() for c in v):
            raise ValueError("Password must contain at least one special symbol")
        return v


class ChangePasswordResponse(BaseModel):
    message: str = "Password changed successfully."


class SessionOut(BaseModel):
    id: str
    browser: Optional[str] = None
    os: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime
    last_active_at: datetime
    is_current: bool


class RevokeSessionResponse(BaseModel):
    message: str = "Device signed out."


class RevokeOthersResponse(BaseModel):
    message: str
    revoked_count: int
