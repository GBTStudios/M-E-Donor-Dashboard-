from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import get_current_admin_user
from app.db.supabase_client import supabase
from app.models.qa_analytics_schemas import (
    QASummary, QATrends, QATrendPoint,
    FlaggedListResponse, FlaggedItem, FlaggedDetail, ModeratorNote,
    UpdateModerationStatusRequest, AddNoteRequest,
)

router = APIRouter(prefix="/admin/qa-analytics", tags=["admin-qa-analytics"])


@router.get("/summary", response_model=QASummary)
async def get_summary(admin: dict = Depends(get_current_admin_user)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    result = (
        supabase.table("qa_logs")
        .select("status")
        .gte("created_at", today_start.isoformat())
        .execute()
    )

    rows = result.data
    return QASummary(
        questions_today=len(rows),
        answered=sum(1 for r in rows if r["status"] == "answered"),
        declined=sum(1 for r in rows if r["status"] == "declined"),
        flagged=sum(1 for r in rows if r["status"] == "flagged"),
    )


@router.get("/trends", response_model=QATrends)
async def get_trends(
    period: str = Query(default="daily"),
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
    admin: dict = Depends(get_current_admin_user),
):
    if not end:
        end_dt = datetime.now(timezone.utc)
    else:
        end_dt = datetime.fromisoformat(end)

    if not start:
        start_dt = end_dt - timedelta(days=30)
    else:
        start_dt = datetime.fromisoformat(start)

    result = (
        supabase.table("qa_logs")
        .select("status, created_at")
        .gte("created_at", start_dt.isoformat())
        .lte("created_at", end_dt.isoformat())
        .execute()
    )

    buckets: dict[str, dict[str, int]] = {}
    for row in result.data:
        created = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
        key = created.strftime("%Y-%m-%d")
        if key not in buckets:
            buckets[key] = {"answered": 0, "declined": 0, "flagged": 0}
        buckets[key][row["status"]] = buckets[key].get(row["status"], 0) + 1

    data = [
        QATrendPoint(date=date, answered=counts["answered"], declined=counts["declined"], flagged=counts["flagged"])
        for date, counts in sorted(buckets.items())
    ]

    return QATrends(period=period, data=data)


@router.get("/flagged", response_model=FlaggedListResponse)
async def list_flagged(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    moderation_status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    admin: dict = Depends(get_current_admin_user),
):
    offset = (page - 1) * limit

    query = supabase.table("qa_logs").select(
        "id, question, response, flag_reason, donor_name, created_at, moderation_status",
        count="exact",
    ).eq("status", "flagged")

    if moderation_status:
        query = query.eq("moderation_status", moderation_status)

    if search:
        query = query.or_(f"question.ilike.%{search}%,donor_name.ilike.%{search}%")

    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
    result = query.execute()

    return FlaggedListResponse(
        items=result.data,
        total=result.count or 0,
        page=page,
        limit=limit,
    )


@router.get("/flagged/{qa_log_id}", response_model=FlaggedDetail)
async def get_flagged_detail(qa_log_id: str, admin: dict = Depends(get_current_admin_user)):
    result = supabase.table("qa_logs").select("*").eq("id", qa_log_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

    row = result.data[0]

    notes_result = (
        supabase.table("qa_log_moderator_notes")
        .select("id, note, created_at, moderator:users(full_name)")
        .eq("qa_log_id", qa_log_id)
        .order("created_at")
        .execute()
    )

    notes = [
        ModeratorNote(
            id=n["id"],
            moderator_name=(n.get("moderator") or {}).get("full_name"),
            note=n["note"],
            created_at=n["created_at"],
        )
        for n in notes_result.data
    ]

    return FlaggedDetail(**row, moderator_notes=notes)


@router.put("/flagged/{qa_log_id}/status", response_model=FlaggedDetail)
async def update_moderation_status(
    qa_log_id: str,
    payload: UpdateModerationStatusRequest,
    admin: dict = Depends(get_current_admin_user),
):
    existing = supabase.table("qa_logs").select("id").eq("id", qa_log_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

    supabase.table("qa_logs").update({
        "moderation_status": payload.moderation_status,
    }).eq("id", qa_log_id).execute()

    return await get_flagged_detail(qa_log_id, admin)


@router.post("/flagged/{qa_log_id}/notes", response_model=FlaggedDetail)
async def add_moderator_note(
    qa_log_id: str,
    payload: AddNoteRequest,
    admin: dict = Depends(get_current_admin_user),
):
    existing = supabase.table("qa_logs").select("id").eq("id", qa_log_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

    supabase.table("qa_log_moderator_notes").insert({
        "qa_log_id": qa_log_id,
        "moderator_id": admin["id"],
        "note": payload.note,
    }).execute()

    return await get_flagged_detail(qa_log_id, admin)
