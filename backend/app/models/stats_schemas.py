from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class LandingStatsOut(BaseModel):
    id: str
    participants: int
    graduation_rate: float
    employment_rate: float
    income_growth_multiplier: float
    cohorts: int
    refugee_participants_pct: float
    updated_at: datetime
    updated_by: Optional[str] = None


class LandingStatsUpdate(BaseModel):
    participants: Optional[int] = Field(default=None, ge=0)
    graduation_rate: Optional[float] = Field(default=None, ge=0, le=100)
    employment_rate: Optional[float] = Field(default=None, ge=0, le=100)
    income_growth_multiplier: Optional[float] = Field(default=None, ge=0)
    cohorts: Optional[int] = Field(default=None, ge=0)
    refugee_participants_pct: Optional[float] = Field(default=None, ge=0, le=100)
