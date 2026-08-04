from fastapi import APIRouter, Depends, HTTPException, status

from app.models.security_schemas import (
    ChangePasswordRequest, ChangePasswordResponse,
    SessionOut, RevokeSessionResponse, RevokeOthersResponse,
)
from app.db.supabase_client import supabase
from app.core.security import verify_password, hash_password
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["security"])


@router.post("/change-password", response_model=ChangePasswordResponse)
async def change_password(
    payload: ChangePasswordRequest,
    user: dict = Depends(get_current_user),
):
    if not verify_password(payload.current_password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect."
        )

    if verify_password(payload.new_password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your current password."
        )

    new_hashed = hash_password(payload.new_password)
    supabase.table("users").update({"hashed_password": new_hashed}).eq("id", user["id"]).execute()

    return ChangePasswordResponse()


@router.get("/sessions", response_model=list[SessionOut])
async def list_sessions(user: dict = Depends(get_current_user)):
    current_session_id = user.get("_session_id")

    result = (
        supabase.table("sessions")
        .select("*")
        .eq("user_id", user["id"])
        .eq("is_revoked", False)
        .order("last_active_at", desc=True)
        .execute()
    )

    sessions = []
    for s in result.data:
        sessions.append(SessionOut(
            id=s["id"],
            browser=s.get("browser"),
            os=s.get("os"),
            ip_address=s.get("ip_address"),
            location=s.get("location"),
            created_at=s["created_at"],
            last_active_at=s["last_active_at"],
            is_current=(s["id"] == current_session_id),
        ))

    return sessions


@router.delete("/sessions/{session_id}", response_model=RevokeSessionResponse)
async def revoke_session(session_id: str, user: dict = Depends(get_current_user)):
    existing = (
        supabase.table("sessions")
        .select("id")
        .eq("id", session_id)
        .eq("user_id", user["id"])
        .execute()
    )

    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    supabase.table("sessions").update({"is_revoked": True}).eq("id", session_id).execute()

    return RevokeSessionResponse()


@router.post("/sessions/revoke-others", response_model=RevokeOthersResponse)
async def revoke_other_sessions(user: dict = Depends(get_current_user)):
    current_session_id = user.get("_session_id")

    result = (
        supabase.table("sessions")
        .select("id")
        .eq("user_id", user["id"])
        .eq("is_revoked", False)
        .neq("id", current_session_id)
        .execute()
    )

    session_ids = [s["id"] for s in result.data]

    if session_ids:
        supabase.table("sessions").update({"is_revoked": True}).in_("id", session_ids).execute()

    return RevokeOthersResponse(
        message=f"Signed out of {len(session_ids)} other device(s).",
        revoked_count=len(session_ids),
    )
