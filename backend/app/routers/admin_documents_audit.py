import csv
import io

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from app.core.deps import get_current_admin_user
from app.db.supabase_client import supabase
from app.models.document_schemas import AuditDocumentsResponse, AuditDocumentItem

router = APIRouter(prefix="/admin/documents/audit", tags=["admin-documents-audit"])


def _build_query(search: str | None, status_filter: str | None):
    query = supabase.table("documents").select(
        "id, doc_number, filename, file_size, status, uploaded_by, created_at, updated_at, published_at, uploader:users(full_name)",
        count="exact",
    )

    if status_filter and status_filter != "all":
        query = query.eq("status", status_filter)

    if search:
        query = query.ilike("filename", f"%{search}%")

    return query


def _to_audit_item(row: dict) -> dict:
    uploader = row.pop("uploader", None) or {}
    row["uploaded_by_name"] = uploader.get("full_name")
    row["display_id"] = f"DOC-{row.pop('doc_number')}"
    return row


@router.get("", response_model=AuditDocumentsResponse)
async def list_documents_audit(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    admin: dict = Depends(get_current_admin_user),
):
    offset = (page - 1) * limit
    query = _build_query(search, status).order("created_at", desc=True).range(offset, offset + limit - 1)
    result = query.execute()

    documents = [_to_audit_item(row) for row in result.data]

    return AuditDocumentsResponse(
        documents=documents,
        total=result.count or 0,
        page=page,
        limit=limit,
    )


@router.get("/export")
async def export_documents_csv(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    admin: dict = Depends(get_current_admin_user),
):
    query = _build_query(search, status).order("created_at", desc=True)
    result = query.execute()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Document ID", "Filename", "File Size (bytes)", "Status", "Uploaded By", "Uploaded At", "Last Updated", "Published At"])

    for row in result.data:
        item = _to_audit_item(row)
        writer.writerow([
            item["display_id"],
            item["filename"],
            item.get("file_size") or "",
            item["status"],
            item.get("uploaded_by_name") or "",
            item["created_at"],
            item["updated_at"],
            item.get("published_at") or "",
        ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=document_history.csv"},
    )
