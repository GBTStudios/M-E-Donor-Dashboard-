from fastapi import FastAPI

from app.routers import auth, signup

app = FastAPI(title="Groundbreaker Donor Dashboard API")

app.include_router(auth.router)
app.include_router(signup.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}