import uuid
from datetime import date, datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, Form, Query, status

from app.core.deps import get_current_admin_user
from app.db.supabase_client import supabase
from app.models.report_schemas import ReportListItem, ReportDetail, UploadReportResponse, ReportActionResponse, UpdateReportRequest

router = APIRouter(prefix="/admin/reports", tags=["admin-reports"])

MAX_FILE_SIZE = 45 * 1024 * 1024  # 45MB - stays under Supabase Free plan's 50MB hard cap
ALLOWED_EXTENSIONS = {"pdf", "docx", "xlsx"}
CONTENT_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


def _apply_extracted_report_data(cohort_id: str, report_id: str, filename: str, file_bytes: bytes):
    """
    Background task: reads the uploaded report and auto-populates the
    linked cohort's outcomes, tracks, and narrative. Runs after the
    upload response has already been returned, so it never slows down
    the admin's upload. Baseline/before-program data is never touched
    here - that stays computed live from real participant records.
    """
    from app.services.report_extractor import extract_report_data
    from app.services.notification_service import create_notification

    extracted = extract_report_data(filename, file_bytes)
    if not extracted:
        supabase.table("reports").update({"extraction_status": "failed"}).eq("id", report_id).execute()
        cohort_result = supabase.table("cohorts").select("name").eq("id", cohort_id).execute()
        cohort_name = cohort_result.data[0]["name"] if cohort_result.data else "a cohort"
        create_notification(
            "report_extraction_failed",
            f"Couldn't extract data from the report uploaded for {cohort_name} - please review and enter the numbers manually.",
            related_id=report_id,
        )
        return

    cohort_summary = extracted.get("cohort_summary") or {}
    cohort_update = {k: v for k, v in cohort_summary.items() if v is not None}
    if cohort_update:
        cohort_update["updated_at"] = datetime.now(timezone.utc).isoformat()
        supabase.table("cohorts").update(cohort_update).eq("id", cohort_id).execute()

    outcomes = extracted.get("outcomes") or {}
    outcomes_clean = {k: v for k, v in outcomes.items() if v is not None}
    if outcomes_clean:
        outcomes_clean["cohort_id"] = cohort_id
        outcomes_clean["updated_at"] = datetime.now(timezone.utc).isoformat()
        supabase.table("cohort_outcomes").upsert(outcomes_clean, on_conflict="cohort_id").execute()

    notable_projects = extracted.get("notable_projects") or []
    for p in notable_projects:
        if not p.get("name") or not p.get("title") or not p.get("body"):
            continue
        supabase.table("stories").insert({
            "name": p["name"][:200],
            "title": p["title"][:200],
            "body": p["body"][:1000],
            "cohort_id": cohort_id,
            "featured": False,
        }).execute()

    tracks = extracted.get("tracks") or []
    if tracks:
        supabase.table("cohort_tracks").delete().eq("cohort_id", cohort_id).execute()
        for t in tracks:
            if not t.get("name"):
                continue
            supabase.table("cohort_tracks").insert({
                "cohort_id": cohort_id,
                "name": t.get("name"),
                "participant_count": t.get("participant_count") or 0,
                "completion_pct": t.get("completion_pct") or 0,
                "status": t.get("status") or "in_progress",
            }).execute()

    narrative = extracted.get("narrative") or {}
    if narrative.get("title") and narrative.get("body"):
        supabase.table("dashboard_insights").insert({
            "title": narrative["title"],
            "body": narrative["body"],
            "cohort_id": cohort_id,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }).execute()

    supabase.table("reports").update({"extraction_status": "completed"}).eq("id", report_id).execute()


@router.post("", response_model=UploadReportResponse, status_code=status.HTTP_201_CREATED)
async def upload_report(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    report_date: date = Form(...),
    cohort_id: Optional[str] = Form(default=None),
    file: UploadFile = File(...),
    admin: dict = Depends(get_current_admin_user),
):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Report file must be PDF, DOCX, or XLSX.",
        )
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="File must be under 45MB.")
    if cohort_id:
        cohort_check = supabase.table("cohorts").select("id").eq("id", cohort_id).execute()
        if not cohort_check.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cohort not found.")
    storage_path = f"{uuid.uuid4()}.{ext}"
    try:
        supabase.storage.from_("reports-documents").upload(
            storage_path, file_bytes, {"content-type": CONTENT_TYPES[ext]}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Upload to storage failed - the file may exceed the storage provider's size limit. ({e})",
        )
    file_url = supabase.storage.from_("reports-documents").get_public_url(storage_path)
    result = supabase.table("reports").insert({
        "title": title,
        "cohort_id": cohort_id,
        "report_date": report_date.isoformat(),
        "file_url": file_url,
        "file_type": ext,
        "file_size": len(file_bytes),
        "uploaded_by": admin["id"],
        "extraction_status": "pending" if cohort_id else None,
    }).execute()
    report = result.data[0]

    if cohort_id:
        background_tasks.add_task(_apply_extracted_report_data, cohort_id, report["id"], file.filename, file_bytes)

    return UploadReportResponse(id=report["id"], title=report["title"])


@router.post("/{report_id}/reprocess", response_model=ReportActionResponse)
async def reprocess_report(report_id: str, background_tasks: BackgroundTasks, admin: dict = Depends(get_current_admin_user)):
    """
    Re-runs extraction for a report that's stuck (e.g. status still
    'pending' long after upload - usually means the background task got
    interrupted by a server restart before it could finish or record a
    failure). Re-downloads the file from storage and reprocesses it.
    """
    existing = supabase.table("reports").select("*").eq("id", report_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    report = existing.data[0]
    if not report.get("cohort_id"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="This report isn't linked to a cohort - nothing to extract into.")

    file_path = report["file_url"].split("/reports-documents/")[-1]
    file_bytes = supabase.storage.from_("reports-documents").download(file_path)

    supabase.table("reports").update({"extraction_status": "pending"}).eq("id", report_id).execute()
    background_tasks.add_task(_apply_extracted_report_data, report["cohort_id"], report_id, f"report.{report['file_type']}", file_bytes)

    return ReportActionResponse(message="Reprocessing started.", id=report_id)


@router.get("", response_model=List[ReportListItem])
async def list_reports(
    admin: dict = Depends(get_current_admin_user),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    cohort_id: Optional[str] = Query(default=None),
):
    query = supabase.table("reports").select(
        "id, title, cohort_id, report_date, file_type, file_size, extraction_status, created_at"
    ).order("report_date", desc=True)

    if start_date:
        query = query.gte("report_date", start_date.isoformat())
    if end_date:
        query = query.lte("report_date", end_date.isoformat())
    if cohort_id:
        query = query.eq("cohort_id", cohort_id)
    result = query.execute()
    return result.data


@router.get("/{report_id}", response_model=ReportDetail)
async def get_report(report_id: str, admin: dict = Depends(get_current_admin_user)):
    result = supabase.table("reports").select("*").eq("id", report_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    return result.data[0]


@router.put("/{report_id}", response_model=ReportDetail)
async def update_report(report_id: str, payload: UpdateReportRequest, admin: dict = Depends(get_current_admin_user)):
    existing = supabase.table("reports").select("*").eq("id", report_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No fields provided to update.")

    if update_data.get("cohort_id"):
        cohort_check = supabase.table("cohorts").select("id").eq("id", update_data["cohort_id"]).execute()
        if not cohort_check.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cohort not found.")

    if "report_date" in update_data:
        update_data["report_date"] = update_data["report_date"].isoformat()

    result = supabase.table("reports").update(update_data).eq("id", report_id).execute()
    return result.data[0]


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
