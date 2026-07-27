from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.routers import auth
from app.routers.auth import limiter

app = FastAPI(title="Groundbreaker Donor Dashboard API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
