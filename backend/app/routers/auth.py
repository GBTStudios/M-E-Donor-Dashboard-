from datetime import datetime, timezone

from fastapi import APIRouter, Request, HTTPException, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from user_agents import parse as parse_user_agent

from app.models.auth_schemas import LoginRequest, TokenResponse, UserOut
from app.db.supabase_client import supabase
from app.core.security import verify_password, create_access_token
from app.services.geolocation import get_location_from_ip

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

GENERIC_ERROR = "Invalid email or password"


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginRequest):
    result = supabase.table("users").select("*").eq("email", credentials.email).execute()

    if not result.data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=GENERIC_ERROR)

    user = result.data[0]

    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=GENERIC_ERROR)

    if not user.get("is_verified", False):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=GENERIC_ERROR)

    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=GENERIC_ERROR)

    supabase.table("users").update({
        "last_active_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", user["id"]).execute()

    ua_string = request.headers.get("user-agent", "")
    ua = parse_user_agent(ua_string)
    browser = ua.browser.family or "Unknown"
    os_name = ua.os.family or "Unknown"
    ip_address = request.client.host if request.client else None
    location = get_location_from_ip(ip_address) if ip_address else None

    session_result = supabase.table("sessions").insert({
        "user_id": user["id"],
        "browser": browser,
        "os": os_name,
        "ip_address": ip_address,
        "location": location,
    }).execute()

    session_id = session_result.data[0]["id"]

    access_token = create_access_token(data={
        "sub": user["id"],
        "role": user.get("role", "donor"),
        "sid": session_id,
    })

    return TokenResponse(
        access_token=access_token,
        first_login=user.get("first_login", False),
        user=UserOut(
            id=user["id"],
            email=user["email"],
            full_name=user.get("full_name", ""),
            role=user.get("role", "donor"),
        ),
    )
