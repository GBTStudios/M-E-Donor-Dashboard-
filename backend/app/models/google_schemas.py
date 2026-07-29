from pydantic import BaseModel, EmailStr


class GoogleSignupRequest(BaseModel):
    access_token: str


class GoogleSignupResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    id: str
    email: EmailStr
    full_name: str
    is_new_user: bool
