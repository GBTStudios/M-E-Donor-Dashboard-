from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, signup

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


@app.get("/health")
def health_check():
    return {"status": "ok"}
