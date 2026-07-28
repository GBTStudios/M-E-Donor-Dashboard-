from fastapi import FastAPI

from app.routers import signup, google_signup

app = FastAPI(title="Groundbreaker Donor Dashboard API")

app.include_router(signup.router)
app.include_router(google_signup.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
