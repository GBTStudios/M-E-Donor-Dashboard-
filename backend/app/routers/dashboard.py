import time
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends

from app.models.dashboard_schemas import (
    DashboardStatsResponse, NeedsAttentionResponse, AttentionItem, SystemHealthResponse
)
from app.db.supabase_client import supabase
from app.core.deps import get_current_admin_user

router = APIRouter(prefix="/admin/dashboard", tags=["admin-dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(_: dict = Depends(get_current_admin_user)):
    docs = supabase.table("documents").select("status").execute()
    statuses = [d["status"] for d in docs.data]

    documents_uploaded = len(statuses)
    pending_review = statuses.count("pending")
    published = statuses.count("published")

    active_cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    active_users_result = (
        supabase.table("users")
        .select("id", count="exact")
        .eq("is_active", True)
        .gte("last_active_at", active_cutoff)
        .execute()
    )
    active_users = active_users_result.count or 0

    return DashboardStatsResponse(
        documents_uploaded=documents_uploaded,
        pending_review=pending_review,
        published=published,
        active_users=active_users,
        conversations_ready=False,
    )


@router.get("/needs-attention", response_model=NeedsAttentionResponse)
async def get_needs_attention(_: dict = Depends(get_current_admin_user)):
    result = (
        supabase.table("documents")
        .select("id, filename, status, uploaded_by, created_at")
        .eq("status", "pending")
        .order("created_at", desc=False)
        .execute()
    )

    items = []
    for doc in result.data:
        uploader_name = None
        if doc.get("uploaded_by"):
            user_result = supabase.table("users").select("full_name").eq("id", doc["uploaded_by"]).execute()
            if user_result.data:
                uploader_name = user_result.data[0].get("full_name")

        items.append(AttentionItem(
            id=doc["id"],
            filename=doc["filename"],
            status=doc["status"],
            uploaded_by_name=uploader_name,
            created_at=doc["created_at"],
        ))

    return NeedsAttentionResponse(count=len(items), items=items)


@router.get("/health", response_model=SystemHealthResponse)
async def get_system_health(_: dict = Depends(get_current_admin_user)):
    start = time.perf_counter()
    try:
        supabase.table("users").select("id").limit(1).execute()
        db_status = "ok"
    except Exception:
        db_status = "error"
    latency_ms = round((time.perf_counter() - start) * 1000, 2)

    return SystemHealthResponse(
        database_status=db_status,
        database_latency_ms=latency_ms,
    )
