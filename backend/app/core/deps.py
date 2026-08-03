from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import decode_access_token
from app.db.supabase_client import supabase

bearer_scheme = HTTPBearer()

SESSION_TIMEOUT_MINUTES = 30


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("sub")
    result = supabase.table("users").select("*").eq("id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    user = result.data[0]

    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    # Inactivity-based session timeout — independent of the JWT's own expiry
    last_active_raw = user.get("last_active_at")
    if last_active_raw:
        last_active = datetime.fromisoformat(last_active_raw.replace("Z", "+00:00"))
        elapsed = datetime.now(timezone.utc) - last_active
        if elapsed > timedelta(minutes=SESSION_TIMEOUT_MINUTES):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired due to inactivity. Please log in again."
            )

    # Refresh last_active_at — sliding window
    supabase.table("users").update({
        "last_active_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", user["id"]).execute()

    return user


async def get_current_admin_user(user: dict = Depends(get_current_user)) -> dict:
    """Backward compatible with stories/stats routers. Allows admin and superadmin."""
    if user.get("role") not in ("admin", "superadmin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    if user.get("first_login", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must set a new password before accessing this resource."
        )
    return user


async def get_current_superadmin_user(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "superadmin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superadmin access required")
    if user.get("first_login", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must set a new password before accessing this resource."
        )
    return user
