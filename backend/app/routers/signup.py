from fastapi import APIRouter, HTTPException, status

from app.models.schemas import SignupRequest, SignupResponse
from app.db.supabase_client import supabase
from app.core.security import hash_password

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest):
    existing = supabase.table("users").select("id").eq("email", payload.email).execute()

    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    hashed = hash_password(payload.password)

    result = supabase.table("users").insert({
        "email": payload.email,
        "hashed_password": hashed,
        "full_name": payload.full_name,
        "is_verified": False,
        "role": "donor"
    }).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account."
        )

    new_user = result.data[0]

    return SignupResponse(id=new_user["id"], email=new_user["email"])
