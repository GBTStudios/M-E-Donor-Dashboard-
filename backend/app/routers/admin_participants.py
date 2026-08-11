import io
import csv
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, Form, status
from openpyxl import load_workbook

from app.core.deps import get_current_admin_user
from app.db.supabase_client import supabase
from app.models.participant_schemas import ImportUploadResponse, ImportDetail, ImportActionResponse

router = APIRouter(prefix="/admin/participants", tags=["admin-participants"])

MAX_FILE_SIZE = 25 * 1024 * 1024
ALLOWED_EXTENSIONS = {"xlsx", "csv", "pdf", "docx"}

EXPECTED_COLUMNS = [
    "household_size", "pre_program_income", "main_breadwinner",
    "age", "highest_education", "employed_before",
    "employed_before_type", "district", "country",
    "graduation_status",
]


def _parse_spreadsheet_rows(filename: str, file_bytes: bytes) -> List[dict]:
    ext = filename.rsplit(".", 1)[-1].lower()
    rows: List[dict] = []

    if ext == "xlsx":
        workbook = load_workbook(io.BytesIO(file_bytes), data_only=True)
        sheet = workbook.active
        header = [str(c).strip().lower().replace(" ", "_") if c else "" for c in next(sheet.iter_rows(min_row=1, max_row=1, values_only=True))]
        for row in sheet.iter_rows(min_row=2, values_only=True):
            row_dict = {header[i]: row[i] for i in range(min(len(header), len(row)))}
            rows.append({k: row_dict.get(k) for k in EXPECTED_COLUMNS})

    elif ext == "csv":
        text = file_bytes.decode("utf-8", errors="replace")
        reader = csv.DictReader(io.StringIO(text))
        for row in reader:
            normalized = {k.strip().lower().replace(" ", "_"): v for k, v in row.items()}
            rows.append({k: normalized.get(k) for k in EXPECTED_COLUMNS})

    for row in rows:
        if not row.get("graduation_status"):
            row["graduation_status"] = "enrolled"

    return rows


def _parse_via_ai(filename: str, file_bytes: bytes) -> List[dict]:
    raise NotImplementedError(
        "PDF/DOCX participant import needs an AI structuring step - not yet built. "
        "Use Excel or CSV for now."
    )


def _process_import(import_id: str, filename: str, file_bytes: bytes):
    ext = filename.rsplit(".", 1)[-1].lower()

    try:
        if ext in ("xlsx", "csv"):
            rows = _parse_spreadsheet_rows(filename, file_bytes)
        else:
            rows = _parse_via_ai(filename, file_bytes)

        preview_data = {
            "columns": EXPECTED_COLUMNS,
            "sample_rows": rows[:10],
        }

        supabase.table("participant_imports").update({
            "status": "pending_review",
            "row_count": len(rows),
            "preview_data": preview_data,
        }).eq("id", import_id).execute()

    except Exception as e:
        supabase.table("participant_imports").update({
            "status": "failed",
            "preview_data": {"error": str(e)},
        }).eq("id", import_id).execute()


@router.post("/import", response_model=ImportUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def import_participants(
    background_tasks: BackgroundTasks,
    cohort_id: str = Form(...),
    file: UploadFile = File(...),
    admin: dict = Depends(get_current_admin_user),
):
    cohort_check = supabase.table("cohorts").select("id").eq("id", cohort_id).execute()
    if not cohort_check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cohort not found.")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="File must be Excel, CSV, PDF, or DOCX.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="File must be under 25MB.")

    result = (
        supabase.table("participant_imports")
        .insert({
            "filename": file.filename,
            "file_type": ext,
            "status": "processing",
            "uploaded_by": admin["id"],
            "cohort_id": cohort_id,
        })
        .execute()
    )
    record = result.data[0]

    background_tasks.add_task(_process_import, record["id"], file.filename, file_bytes)

    return ImportUploadResponse(id=record["id"], filename=record["filename"], status=record["status"])


@router.get("/imports/{import_id}", response_model=ImportDetail)
async def get_import(import_id: str, admin: dict = Depends(get_current_admin_user)):
    result = supabase.table("participant_imports").select("*").eq("id", import_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Import not found.")
    return result.data[0]


@router.post("/imports/{import_id}/confirm", response_model=ImportActionResponse)
async def confirm_import(import_id: str, admin: dict = Depends(get_current_admin_user)):
    existing = supabase.table("participant_imports").select("*").eq("id", import_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Import not found.")

    record = existing.data[0]
    if record["status"] != "pending_review":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only imports in 'pending_review' status can be confirmed.")

    rows = record.get("preview_data", {}).get("sample_rows", [])
    for row in rows:
        row["source_import_id"] = import_id
        row["cohort_id"] = record.get("cohort_id")
        supabase.table("participants").insert(row).execute()

    supabase.table("participant_imports").update({
        "status": "confirmed",
        "confirmed_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", import_id).execute()

    return ImportActionResponse(message="Import confirmed.", id=import_id, row_count=len(rows))


@router.post("/imports/{import_id}/reject", response_model=ImportActionResponse)
async def reject_import(import_id: str, admin: dict = Depends(get_current_admin_user)):
    existing = supabase.table("participant_imports").select("id").eq("id", import_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Import not found.")

    supabase.table("participant_imports").update({"status": "rejected"}).eq("id", import_id).execute()
    return ImportActionResponse(message="Import rejected.", id=import_id)
