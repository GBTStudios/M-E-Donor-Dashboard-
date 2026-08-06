from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, signup, google_signup, verification, password_reset, stories, admin_stories, stats, admin_onboarding, admin_documents_audit, admin_documents, profile, security, dashboard, settings, chat

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
app.include_router(admin_onboarding.router)
app.include_router(admin_documents_audit.router)
app.include_router(admin_documents.router)
app.include_router(profile.router)
app.include_router(security.router)
app.include_router(dashboard.router)
app.include_router(settings.router)
app.include_router(chat.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
