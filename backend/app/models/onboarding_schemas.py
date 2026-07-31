from pydantic import BaseModel, field_validator


class SetFirstPasswordRequest(BaseModel):
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


class SetFirstPasswordResponse(BaseModel):
    message: str = "Password set successfully."


class CreateAdminRequest(BaseModel):
    email: str
    full_name: str


class CreateAdminResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    temporary_password: str
    message: str = "Admin account created. They must change their password on first login."


class DeactivateUserRequest(BaseModel):
    user_id: str


class DeactivateUserResponse(BaseModel):
    message: str
