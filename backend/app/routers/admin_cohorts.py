from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_admin_user
from app.db.supabase_client import supabase
from app.models.cohort_schemas import CohortOut, CreateCohortRequest, UpdateCohortRequest
from app.models.track_schemas import TrackOut, CreateTrackRequest, UpdateTrackRequest, TrackActionResponse
from app.models.outcome_schemas import CohortOutcomesUpdate, CohortOutcomesOut

router = APIRouter(prefix="/admin/cohorts", tags=["admin-cohorts"])


@router.post("", response_model=CohortOut, status_code=status.HTTP_201_CREATED)
async def create_cohort(payload: CreateCohortRequest, admin: dict = Depends(get_current_admin_user)):
    data = payload.model_dump(exclude_none=True)
    if "start_date" in data:
        data["start_date"] = data["start_date"].isoformat()
    if "end_date" in data:
        data["end_date"] = data["end_date"].isoformat()

    result = supabase.table("cohorts").insert(data).execute()
    cohort = result.data[0]
    return {**cohort, "graduation_pct": 0}


@router.put("/{cohort_id}", response_model=CohortOut)
async def update_cohort(cohort_id: str, payload: UpdateCohortRequest, admin: dict = Depends(get_current_admin_user)):
    existing = supabase.table("cohorts").select("id").eq("id", cohort_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cohort not found.")

    update_data = payload.model_dump(exclude_unset=True, exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No fields provided to update.")

    if "start_date" in update_data:
        update_data["start_date"] = update_data["start_date"].isoformat()
    if "end_date" in update_data:
        update_data["end_date"] = update_data["end_date"].isoformat()

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = supabase.table("cohorts").update(update_data).eq("id", cohort_id).execute()
    cohort = result.data[0]

    participants_result = supabase.table("participants").select("graduation_status").eq("cohort_id", cohort_id).execute()
    rows = participants_result.data
    grad_pct = round((sum(1 for r in rows if r.get("graduation_status") == "graduated") / len(rows)) * 100, 1) if rows else 0

    return {**cohort, "graduation_pct": grad_pct}


@router.post("/{cohort_id}/tracks", response_model=TrackOut, status_code=status.HTTP_201_CREATED)
async def create_track(cohort_id: str, payload: CreateTrackRequest, admin: dict = Depends(get_current_admin_user)):
    cohort_check = supabase.table("cohorts").select("id").eq("id", cohort_id).execute()
    if not cohort_check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cohort not found.")

    data = payload.model_dump()
    data["cohort_id"] = cohort_id
    result = supabase.table("cohort_tracks").insert(data).execute()
    return result.data[0]


@router.put("/{cohort_id}/tracks/{track_id}", response_model=TrackOut)
async def update_track(cohort_id: str, track_id: str, payload: UpdateTrackRequest, admin: dict = Depends(get_current_admin_user)):
    existing = supabase.table("cohort_tracks").select("id").eq("id", track_id).eq("cohort_id", cohort_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Track not found.")

    update_data = payload.model_dump(exclude_unset=True, exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No fields provided to update.")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = supabase.table("cohort_tracks").update(update_data).eq("id", track_id).execute()
    return result.data[0]


@router.delete("/{cohort_id}/tracks/{track_id}", response_model=TrackActionResponse)
async def delete_track(cohort_id: str, track_id: str, admin: dict = Depends(get_current_admin_user)):
    existing = supabase.table("cohort_tracks").select("id").eq("id", track_id).eq("cohort_id", cohort_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Track not found.")

    supabase.table("cohort_tracks").delete().eq("id", track_id).execute()
    return TrackActionResponse(message="Track deleted.", id=track_id)


@router.put("/{cohort_id}/outcomes", response_model=CohortOutcomesOut)
async def upsert_outcomes(cohort_id: str, payload: CohortOutcomesUpdate, admin: dict = Depends(get_current_admin_user)):
    cohort_check = supabase.table("cohorts").select("id").eq("id", cohort_id).execute()
    if not cohort_check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cohort not found.")

    data = payload.model_dump(exclude_unset=True)
    data["cohort_id"] = cohort_id
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    data["updated_by"] = admin["id"]

    result = supabase.table("cohort_outcomes").upsert(data, on_conflict="cohort_id").execute()
    outcome = result.data[0]

    projects_result = supabase.table("stories").select("id").eq("cohort_id", cohort_id).execute()
    notable_count = len(projects_result.data)

    return {**outcome, "notable_projects_count": notable_count}
