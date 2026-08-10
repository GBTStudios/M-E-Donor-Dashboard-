from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class ImportUploadResponse(BaseModel):
    id: str
    filename: str
    status: str


class ImportDetail(BaseModel):
    id: str
    filename: str
    file_type: str
    status: str
    row_count: Optional[int] = None
    preview_data: Optional[Any] = None
    uploaded_by: str
    created_at: datetime
    confirmed_at: Optional[datetime] = None


class ImportActionResponse(BaseModel):
    message: str
    id: str
    row_count: Optional[int] = None
