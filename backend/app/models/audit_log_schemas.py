from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class AuditLogItem(BaseModel):
    id: str
    log_number: int
    conversation_id: str
    originating_identity: str
    user_name: Optional[str] = None
    inquiry: str
    response: str
    status: str
    resolved: bool
    created_at: datetime
    reference_id: str


class AuditLogListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[AuditLogItem]


class ConversationMessage(BaseModel):
    inquiry: str
    response: str
    status: str
    created_at: datetime


class ConversationContextResponse(BaseModel):
    conversation_id: str
    originating_identity: str
    user_name: Optional[str] = None
    messages: List[ConversationMessage]


class ResolveFlaggedResponse(BaseModel):
    message: str = "Marked as resolved."
