import time
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends

from app.models.dashboard_schemas import (
    DashboardStatsResponse, NeedsAttentionResponse, AttentionItem, SystemHealthResponse
)
from app.db.supabase_client import supabase
from app.core.deps import get_current_admin_user
from app.services.embeddings import generate_embedding
from app.services.knowledge_retrieval import _format_embedding_for_pg

router = APIRouter(prefix="/admin/dashboard", tags=["admin-dashboard"])

_VECTOR_DB_HEALTH_TTL_SECONDS = 60
_vector_db_health_cache = {"checked_at": 0.0, "connectivity_pct": None, "latency_ms": None}


def _check_vector_db_health():
    """
    Runs a real, minimal vector search (match_count=1) against pgvector to
    measure actual connectivity and query latency for the Infrastructure
    Integrity card. Cached for _VECTOR_DB_HEALTH_TTL_SECONDS so repeated
    dashboard loads don't re-run embedding generation + an RPC call every
    time - only re-checks when the cache is stale.
    """
    now = time.time()
    if now - _vector_db_health_cache["checked_at"] < _VECTOR_DB_HEALTH_TTL_SECONDS:
        return _vector_db_health_cache["connectivity_pct"], _vector_db_health_cache["latency_ms"]

    start = time.perf_counter()
    try:
        test_embedding = generate_embedding("health check")
        formatted = _format_embedding_for_pg(test_embedding)
        supabase.rpc("match_document_chunks", {"query_embedding": formatted, "match_count": 1}).execute()
        latency_ms = round((time.perf_counter() - start) * 1000, 1)
        connectivity_pct = 100.0
    except Exception:
        latency_ms = None
        connectivity_pct = 0.0

    _vector_db_health_cache["checked_at"] = now
    _vector_db_health_cache["connectivity_pct"] = connectivity_pct
    _vector_db_health_cache["latency_ms"] = latency_ms
    return connectivity_pct, latency_ms


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

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    qa_today_result = supabase.table("qa_logs").select("status, response_time_ms").gte("created_at", today_start).execute()
    qa_today = qa_today_result.data

    questions_today = len(qa_today)
    answered = sum(1 for q in qa_today if q["status"] == "answered")
    declined = sum(1 for q in qa_today if q["status"] == "declined")
    flagged = sum(1 for q in qa_today if q["status"] == "flagged")

    response_times = [q["response_time_ms"] for q in qa_today if q.get("response_time_ms") is not None]
    query_latency_ms = round(sum(response_times) / len(response_times), 1) if response_times else None

    vector_db_connectivity_pct, vector_db_query_latency_ms = _check_vector_db_health()

    return DashboardStatsResponse(
        documents_uploaded=documents_uploaded,
        pending_review=pending_review,
        published=published,
        active_users=active_users,
        questions_today=questions_today,
        answered=answered,
        declined=declined,
        flagged=flagged,
        vector_db_connectivity_pct=vector_db_connectivity_pct,
        vector_db_query_latency_ms=vector_db_query_latency_ms,
        query_latency_ms=query_latency_ms,
        conversations_ready=published > 0,
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
