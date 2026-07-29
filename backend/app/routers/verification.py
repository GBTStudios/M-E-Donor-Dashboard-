from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status

from app.models.verification_schemas import (
    VerifyCodeRequest, VerifyCodeResponse,
    ResendCodeRequest, ResendCodeResponse
)
from app.db.supabase_client import supabase
from app.services.email_service import generate_verification_code, send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/verify-email", response_model=VerifyCodeResponse)
async def verify_email(payload: VerifyCodeRequest):
    result = (
        supabase.table("verification_codes")
        .select("*")
        .eq("email", payload.email)
        .eq("code", payload.code)
        .eq("used", False)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )

    record = result.data[0]
    expires_at = datetime.fromisoformat(record["expires_at"])

    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one."
        )

    # Mark code as used
    supabase.table("verification_codes").update({"used": True}).eq("id", record["id"]).execute()

    # Mark user as verified
    supabase.table("users").update({"is_verified": True}).eq("email", payload.email).execute()

    return VerifyCodeResponse()


@router.post("/resend-code", response_model=ResendCodeResponse)
async def resend_code(payload: ResendCodeRequest):
    user = supabase.table("users").select("id, is_verified").eq("email", payload.email).execute()

    if not user.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email."
        )

    if user.data[0]["is_verified"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account is already verified."
        )

    code = generate_verification_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    supabase.table("verification_codes").insert({
        "email": payload.email,
        "code": code,
        "expires_at": expires_at.isoformat()
    }).execute()

    send_verification_email(payload.email, code)

    return ResendCodeResponse()
