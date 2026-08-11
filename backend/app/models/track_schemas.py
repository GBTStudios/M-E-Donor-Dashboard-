from pydantic import BaseModel
from typing import Optional


class TrackOut(BaseModel):
    id: str
    cohort_id: str
    name: str
    participant_count: int
    completion_pct: float
    status: str


class CreateTrackRequest(BaseModel):
    name: str
    participant_count: int = 0
    completion_pct: float = 0
    status: str = "in_progress"


class UpdateTrackRequest(BaseModel):
    name: Optional[str] = None
    participant_count: Optional[int] = None
    completion_pct: Optional[float] = None
    status: Optional[str] = None


class TrackActionResponse(BaseModel):
    message: str
    id: Optional[str] = None
