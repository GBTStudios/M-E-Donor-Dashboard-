from pydantic import BaseModel, EmailStr


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class VerifyCodeResponse(BaseModel):
    message: str = "Email verified successfully. You can now log in."


class ResendCodeRequest(BaseModel):
    email: EmailStr


class ResendCodeResponse(BaseModel):
    message: str = "A new verification code has been sent to your email."
