# Backward-compatible re-exports.
# Login schemas live in auth_schemas.py, signup schemas in signup_schemas.py,
# Google OAuth schemas in google_schemas.py.
# This file exists so existing `from app.models.schemas import X` imports don't break.

from app.models.auth_schemas import LoginRequest, TokenResponse, UserOut
from app.models.signup_schemas import SignupRequest, SignupResponse
from app.models.google_schemas import GoogleSignupRequest, GoogleSignupResponse

__all__ = [
    "LoginRequest",
    "TokenResponse",
    "UserOut",
    "SignupRequest",
    "SignupResponse",
    "GoogleSignupRequest",
    "GoogleSignupResponse",
]
