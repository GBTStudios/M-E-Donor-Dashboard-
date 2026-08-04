from pydantic import BaseModel, EmailStr
from typing import Optional


class StaffProfileResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str
    department: Optional[str] = None
    location: Optional[str] = None
    profile_photo_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class StaffProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    profile_photo_url: Optional[str] = None
    bio: Optional[str] = None


class StaffProfileUpdateResponse(BaseModel):
    message: str = "Profile updated successfully."
    profile: StaffProfileResponse
