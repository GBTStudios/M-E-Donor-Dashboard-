from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, signup, google_signup, verification, password_reset, stories, admin_stories, stats

app = FastAPI(title="Groundbreaker Donor Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(signup.router)
app.include_router(google_signup.router)
app.include_router(verification.router)
app.include_router(password_reset.router)
app.include_router(stories.router)
app.include_router(admin_stories.router)
app.include_router(stats.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
