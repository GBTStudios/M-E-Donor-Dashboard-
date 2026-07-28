from pydantic import BaseModel, EmailStr


class GoogleSignupRequest(BaseModel):
    access_token: str


class GoogleSignupResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    is_new_user: bool
