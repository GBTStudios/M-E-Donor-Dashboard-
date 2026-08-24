from pydantic import BaseModel
from typing import Optional


class ChatMessageRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    language: Optional[str] = "en"


class ChatMessageResponse(BaseModel):
    session_id: str
    response: str
