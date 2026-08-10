from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, status
from user_agents import parse as parse_user_agent
from app.models.google_schemas import GoogleSignupRequest, GoogleSignupResponse
from app.db.supabase_client import supabase
from app.core.security import create_access_token
from app.services.geolocation import get_location_from_ip

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google-signup", response_model=GoogleSignupResponse, status_code=status.HTTP_200_OK)
async def google_signup(payload: GoogleSignupRequest, request: Request):
    try:
        auth_response = supabase.auth.get_user(payload.access_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Google session token."
        )

    google_user = auth_response.user
    if not google_user or not google_user.email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not verify Google account."
        )

    email = google_user.email
    full_name = (
        google_user.user_metadata.get("full_name")
        or google_user.user_metadata.get("name")
        or email.split("@")[0]
    )

    existing = supabase.table("users").select("*").eq("email", email).execute()
    if existing.data:
        user = existing.data[0]
        is_new_user = False
    else:
        result = supabase.table("users").insert({
            "email": email,
            "hashed_password": None,
            "full_name": full_name,
            "is_verified": True,
            "role": "donor"
        }).execute()
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create account from Google sign-in."
            )
        user = result.data[0]
        is_new_user = True

    role = user.get("role", "donor")

    # Match the regular login path: stamp activity so the inactivity check
    # in get_current_user doesn't immediately reject the fresh token.
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

    backend_token = create_access_token(data={
        "sub": user["id"],
        "role": role,
        "sid": session_id,
    })

    return GoogleSignupResponse(
        access_token=backend_token,
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=role,
        is_new_user=is_new_user
    )