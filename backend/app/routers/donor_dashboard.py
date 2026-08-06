from typing import List

from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.db.supabase_client import supabase
from app.models.cohort_schemas import CohortOut

router = APIRouter(prefix="/donor/dashboard", tags=["donor-dashboard"])


@router.get("/cohorts", response_model=List[CohortOut])
async def get_cohorts(user: dict = Depends(get_current_user)):
    result = supabase.table("cohorts").select("*").order("created_at").execute()
    return result.data


@router.get("/summary")
async def get_summary(user: dict = Depends(get_current_user)):
    result = supabase.table("landing_stats").select("*").limit(1).execute()
    if not result.data:
        return {}
    return result.data[0]


@router.get("/insights")
async def get_insights(user: dict = Depends(get_current_user)):
    result = supabase.table("dashboard_insights").select("title, body").order("generated_at").execute()
    return result.data
