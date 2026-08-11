import uuid
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status

from app.core.deps import get_current_admin_user
from app.db.supabase_client import supabase
from app.models.report_schemas import ReportListItem, UploadReportResponse, ReportActionResponse

router = APIRouter(prefix="/admin/reports", tags=["admin-reports"])

MAX_FILE_SIZE = 25 * 1024 * 1024


@router.post("", response_model=UploadReportResponse, status_code=status.HTTP_201_CREATED)
async def upload_report(
    title: str = Form(...),
    report_date: date = Form(...),
    cohort_id: Optional[str] = Form(default=None),
    file: UploadFile = File(...),
    admin: dict = Depends(get_current_admin_user),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Report file must be a PDF.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="File must be under 25MB.")

    if cohort_id:
        cohort_check = supabase.table("cohorts").select("id").eq("id", cohort_id).execute()
        if not cohort_check.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cohort not found.")

    storage_path = f"{uuid.uuid4()}.pdf"
    supabase.storage.from_("reports-documents").upload(storage_path, file_bytes, {"content-type": "application/pdf"})
    file_url = supabase.storage.from_("reports-documents").get_public_url(storage_path)

    result = supabase.table("reports").insert({
        "title": title,
        "cohort_id": cohort_id,
        "report_date": report_date.isoformat(),
        "file_url": file_url,
        "file_type": "pdf",
        "file_size": len(file_bytes),
        "uploaded_by": admin["id"],
    }).execute()

    report = result.data[0]
    return UploadReportResponse(id=report["id"], title=report["title"])


@router.get("", response_model=List[ReportListItem])
async def list_reports(
    admin: dict = Depends(get_current_admin_user),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    cohort_id: Optional[str] = Query(default=None),
):
    query = supabase.table("reports").select(
        "id, title, cohort_id, report_date, file_type, file_size, created_at"
    ).order("report_date", desc=True)

    if start_date:
        query = query.gte("report_date", start_date.isoformat())
    if end_date:
        query = query.lte("report_date", end_date.isoformat())
    if cohort_id:
        query = query.eq("cohort_id", cohort_id)

    result = query.execute()
    return result.data


@router.delete("/{report_id}", response_model=ReportActionResponse)
async def delete_report(report_id: str, admin: dict = Depends(get_current_admin_user)):
    existing = supabase.table("reports").select("file_url").eq("id", report_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    file_url = existing.data[0].get("file_url")
    if file_url:
        try:
            path = file_url.split("/reports-documents/")[-1]
            supabase.storage.from_("reports-documents").remove([path])
        except Exception:
            pass

    supabase.table("reports").delete().eq("id", report_id).execute()
    return ReportActionResponse(message="Report deleted.", id=report_id)
