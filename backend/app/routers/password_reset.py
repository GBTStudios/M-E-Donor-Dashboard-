from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status

from app.models.password_reset_schemas import (
    ForgotPasswordRequest, ForgotPasswordResponse,
    VerifyResetCodeRequest, VerifyResetCodeResponse,
    ResetPasswordRequest, ResetPasswordResponse,
)
from app.db.supabase_client import supabase
from app.services.email_service import generate_verification_code
from app.core.security import hash_password

router = APIRouter(prefix="/auth", tags=["auth"])

CODE_EXPIRY_MINUTES = 30  # matches "expires in 30 minutes" on the reset page


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(payload: ForgotPasswordRequest):
    user = supabase.table("users").select("id").eq("email", payload.email).execute()

    # Always return the same generic message, whether or not the email exists —
    # prevents attackers from using this endpoint to check registered emails.
    if user.data:
        code = generate_verification_code()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRY_MINUTES)

        supabase.table("password_reset_codes").insert({
            "email": payload.email,
            "code": code,
            "expires_at": expires_at.isoformat(),
        }).execute()

        send_password_reset_email(payload.email, code)

    return ForgotPasswordResponse()


@router.post("/verify-reset-code", response_model=VerifyResetCodeResponse)
async def verify_reset_code(payload: VerifyResetCodeRequest):
    result = (
        supabase.table("password_reset_codes")
        .select("*")
        .eq("email", payload.email)
        .eq("code", payload.code)
        .eq("used", False)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid code.")

    record = result.data[0]
    expires_at = datetime.fromisoformat(record["expires_at"])

    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This code has expired. Please request a new one.",
        )

    return VerifyResetCodeResponse()


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(payload: ResetPasswordRequest):
    result = (
        supabase.table("password_reset_codes")
        .select("*")
        .eq("email", payload.email)
        .eq("code", payload.code)
        .eq("used", False)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid code.")

    record = result.data[0]
    expires_at = datetime.fromisoformat(record["expires_at"])

    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This code has expired. Please request a new one.",
        )

    new_hashed = hash_password(payload.newPassword)
    supabase.table("users").update({"hashed_password": new_hashed}).eq("email", payload.email).execute()
    supabase.table("password_reset_codes").update({"used": True}).eq("id", record["id"]).execute()

    return ResetPasswordResponse()


def send_password_reset_email(to_email: str, code: str) -> None:
    import resend
    from app.core.config import settings

    resend.api_key = settings.resend_api_key
    resend.Emails.send({
        "from": "Groundbreaker Donor Dashboard <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "Reset your password — Groundbreaker Donor Dashboard",
        "html": f"""
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>Reset your password</h2>
                <p>Use the code below to reset your password:</p>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">{code}</p>
                <p>This code expires in 30 minutes.</p>
                <p>If you didn't request this, you can safely ignore this email.</p>
            </div>
        """
    })