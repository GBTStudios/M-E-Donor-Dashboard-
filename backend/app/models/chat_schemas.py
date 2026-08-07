from pydantic import BaseModel
from typing import Optional


class ChatMessageRequest(BaseModel):
    session_id: Optional[str] = None
    message: str


class ChatMessageResponse(BaseModel):
    session_id: str
    response: str
