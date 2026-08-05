from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DocumentListItem(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: Optional[int] = None
    status: str
    uploaded_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None


class DocumentDetail(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: Optional[int] = None
    file_url: str
    status: str
    raw_text: Optional[str] = None
    ai_summary: Optional[str] = None
    final_content: Optional[str] = None
    uploaded_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None


class UploadResponse(BaseModel):
    id: str
    filename: str
    status: str


class UpdateContentRequest(BaseModel):
    final_content: str


class UpdateMetadataRequest(BaseModel):
    filename: Optional[str] = None


class DocumentActionResponse(BaseModel):
    message: str
    id: Optional[str] = None
