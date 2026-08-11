from pydantic import BaseModel
from typing import Optional


class CohortOutcomesUpdate(BaseModel):
    employment_rate: Optional[float] = None
    avg_income_growth_multiplier: Optional[float] = None
    post_avg_monthly_income: Optional[float] = None
    african_companies_pct: Optional[float] = None
    global_companies_pct: Optional[float] = None


class CohortOutcomesOut(BaseModel):
    employment_rate: Optional[float] = None
    avg_income_growth_multiplier: Optional[float] = None
    post_avg_monthly_income: Optional[float] = None
    african_companies_pct: Optional[float] = None
    global_companies_pct: Optional[float] = None
    notable_projects_count: int = 0
