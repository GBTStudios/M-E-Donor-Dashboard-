from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_admin_user
from app.db.supabase_client import supabase
from app.models.stats_schemas import LandingStatsOut, LandingStatsUpdate

router = APIRouter(tags=["stats"])


def _get_single_row():
    result = supabase.table("landing_stats").select("*").limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stats not yet configured.")
    return result.data[0]


@router.get("/stats/landing-summary", response_model=LandingStatsOut)
async def get_landing_summary():
    return _get_single_row()


@router.get("/admin/stats/landing-summary", response_model=LandingStatsOut)
async def get_admin_landing_summary(admin: dict = Depends(get_current_admin_user)):
    return _get_single_row()


@router.put("/admin/stats/landing-summary", response_model=LandingStatsOut)
async def update_landing_summary(
    payload: LandingStatsUpdate,
    admin: dict = Depends(get_current_admin_user),
):
    updates = payload.model_dump(exclude_none=True)

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields provided to update.",
        )

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    updates["updated_by"] = admin["id"]

    current = _get_single_row()
    result = (
        supabase.table("landing_stats")
        .update(updates)
        .eq("id", current["id"])
        .execute()
    )
    return result.data[0]
