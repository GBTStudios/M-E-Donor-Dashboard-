from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DashboardStatsResponse(BaseModel):
    documents_uploaded: int
    pending_review: int
    published: int
    active_users: int
    questions_today: Optional[int] = None
    answered: Optional[int] = None
    declined: Optional[int] = None
    flagged: Optional[int] = None
    vector_db_connectivity_pct: Optional[float] = None
    query_latency_ms: Optional[float] = None
    conversations_ready: bool = False


class AttentionItem(BaseModel):
    id: str
    filename: str
    status: str
    uploaded_by_name: Optional[str] = None
    created_at: datetime


class NeedsAttentionResponse(BaseModel):
    count: int
    items: List[AttentionItem]


class SystemHealthResponse(BaseModel):
    api_status: str = "ok"
    database_status: str
    database_latency_ms: float
