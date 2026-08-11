from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class ReportListItem(BaseModel):
    id: str
    title: str
    cohort_id: Optional[str] = None
    report_date: date
    file_type: str
    file_size: Optional[int] = None
    created_at: datetime


class ReportDetail(ReportListItem):
    file_url: str
    uploaded_by: Optional[str] = None
    updated_at: datetime


class UploadReportResponse(BaseModel):
    id: str
    title: str
    message: str = "Report uploaded successfully."


class ReportActionResponse(BaseModel):
    message: str
    id: Optional[str] = None
