from fastapi import APIRouter, HTTPException, status

from app.models.schemas import GoogleSignupRequest, GoogleSignupResponse
from app.db.supabase_client import supabase

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/google-signup", response_model=GoogleSignupResponse, status_code=status.HTTP_200_OK)
async def google_signup(payload: GoogleSignupRequest):
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
        return GoogleSignupResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            is_new_user=False
        )

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

    new_user = result.data[0]

    return GoogleSignupResponse(
        id=new_user["id"],
        email=new_user["email"],
        full_name=new_user["full_name"],
        is_new_user=True
    )
