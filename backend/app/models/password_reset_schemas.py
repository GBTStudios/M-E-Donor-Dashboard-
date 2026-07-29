from pydantic import BaseModel, EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str = "If an account exists with this email, a reset code has been sent."


class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str


class VerifyResetCodeResponse(BaseModel):
    message: str = "Code verified. You may now reset your password."


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    newPassword: str


class ResetPasswordResponse(BaseModel):
    message: str = "Password reset successfully. You can now log in."