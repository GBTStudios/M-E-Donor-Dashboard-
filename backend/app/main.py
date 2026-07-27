from fastapi import FastAPI

from app.routers import signup

app = FastAPI(title="Groundbreaker Donor Dashboard API")

app.include_router(signup.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
