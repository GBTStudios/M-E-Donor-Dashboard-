from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class QASummary(BaseModel):
    questions_today: int
    answered: int
    declined: int
    flagged: int


class QATrendPoint(BaseModel):
    date: str
    answered: int
    declined: int
    flagged: int


class QATrends(BaseModel):
    period: str
    data: List[QATrendPoint]


class FlaggedItem(BaseModel):
    id: str
    question: str
    response: str
    flag_reason: Optional[str] = None
    donor_name: str
    created_at: datetime
    moderation_status: Optional[str] = None


class FlaggedListResponse(BaseModel):
    items: List[FlaggedItem]
    total: int
    page: int
    limit: int


class ModeratorNote(BaseModel):
    id: str
    moderator_name: Optional[str] = None
    note: str
    created_at: datetime


class FlaggedDetail(FlaggedItem):
    moderator_notes: List[ModeratorNote]


class UpdateModerationStatusRequest(BaseModel):
    moderation_status: str


class AddNoteRequest(BaseModel):
    note: str
