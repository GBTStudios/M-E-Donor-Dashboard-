from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.deps import get_current_admin_user
from app.db.supabase_client import supabase

router = APIRouter(prefix="/admin/insights", tags=["admin-insights"])


class CreateInsightRequest(BaseModel):
    title: str
    body: str
    cohort_id: Optional[str] = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_insight(payload: CreateInsightRequest, admin: dict = Depends(get_current_admin_user)):
    if payload.cohort_id:
        cohort_check = supabase.table("cohorts").select("id").eq("id", payload.cohort_id).execute()
        if not cohort_check.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cohort not found.")

    result = supabase.table("dashboard_insights").insert({
        "title": payload.title,
        "body": payload.body,
        "cohort_id": payload.cohort_id,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    return result.data[0]
