# Backward-compatible re-exports.
# Login schemas now live in auth_schemas.py, signup schemas in signup_schemas.py.
# This file exists so existing `from app.models.schemas import X` imports don't break.

from app.models.auth_schemas import LoginRequest, TokenResponse, UserOut
from app.models.signup_schemas import SignupRequest, SignupResponse

__all__ = [
    "LoginRequest",
    "TokenResponse",
    "UserOut",
    "SignupRequest",
    "SignupResponse",
]