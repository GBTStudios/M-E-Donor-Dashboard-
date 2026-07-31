from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import decode_access_token
from app.db.supabase_client import supabase

bearer_scheme = HTTPBearer()


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

    return user


async def get_current_admin_user(user: dict = Depends(get_current_user)) -> dict:
    """Kept for backward compatibility with existing routers (stories, stats).
    Now checks role instead of the removed is_admin column.
    Allows both 'admin' and 'superadmin' — matches prior is_admin=True behavior for both."""
    if user.get("role") not in ("admin", "superadmin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    if user.get("first_login", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must set a new password before accessing this resource."
        )
    return user


async def get_current_superadmin_user(user: dict = Depends(get_current_user)) -> dict:
    """New: for superadmin-only routes like creating/deactivating admin accounts."""
    if user.get("role") != "superadmin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superadmin access required")
    if user.get("first_login", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must set a new password before accessing this resource."
        )
    return user
