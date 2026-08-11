from pydantic import BaseModel
from datetime import date
from typing import Optional


class CohortOut(BaseModel):
    id: str
    name: str
    program: Optional[str] = None
    active_participants: int
    completion_pct: float
    graduation_pct: float = 0
    employment_rate: Optional[float] = None
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class CohortDetailOut(CohortOut):
    avg_income_growth_multiplier: Optional[float] = None


class CreateCohortRequest(BaseModel):
    name: str
    program: Optional[str] = None
    active_participants: int = 0
    completion_pct: float = 0
    status: str = "in_progress"
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class UpdateCohortRequest(BaseModel):
    name: Optional[str] = None
    program: Optional[str] = None
    active_participants: Optional[int] = None
    completion_pct: Optional[float] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
