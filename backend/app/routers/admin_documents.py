import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, Query, status

from app.core.deps import get_current_admin_user
from app.db.supabase_client import supabase
from app.models.document_schemas import (
    DocumentListItem, DocumentDetail, UploadResponse,
    UpdateContentRequest, UpdateMetadataRequest, DocumentActionResponse,
)
from app.services.document_parser import extract_text
from app.services.summarizer import summarize_document

router = APIRouter(prefix="/admin/documents", tags=["admin-documents"])

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB
ALLOWED_EXTENSIONS = {"pdf", "docx", "xlsx", "csv"}


def _process_document(document_id: str, filename: str, file_bytes: bytes):
    try:
        raw_text = extract_text(filename, file_bytes)
        ai_summary = summarize_document(raw_text)

        supabase.table("documents").update({
            "raw_text": raw_text,
            "ai_summary": ai_summary,
            "final_content": ai_summary,
            "status": "pending",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", document_id).execute()

    except Exception as e:
        supabase.table("documents").update({
            "status": "pending",
            "ai_summary": f"[Processing failed: {e}]",
            "final_content": f"[Processing failed: {e}]",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", document_id).execute()


@router.post("", response_model=UploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    admin: dict = Depends(get_current_admin_user),
):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File must be PDF, DOCX, XLSX, or CSV.",
        )

    file_bytes = await file.read()
    file_size = len(file_bytes)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File must be under 25MB.",
        )

    storage_path = f"{uuid.uuid4()}.{ext}"
    supabase.storage.from_("knowledge-documents").upload(
        storage_path, file_bytes, {"content-type": file.content_type}
    )
    file_url = supabase.storage.from_("knowledge-documents").get_public_url(storage_path)

    result = (
        supabase.table("documents")
        .insert({
            "filename": file.filename,
            "file_url": file_url,
            "file_type": ext,
            "file_size": file_size,
            "status": "processing",
            "uploaded_by": admin["id"],
        })
        .execute()
    )
    document = result.data[0]

    background_tasks.add_task(_process_document, document["id"], file.filename, file_bytes)

    return UploadResponse(id=document["id"], filename=document["filename"], status=document["status"])


@router.get("", response_model=List[DocumentListItem])
async def list_documents(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    admin: dict = Depends(get_current_admin_user),
):
    query = supabase.table("documents").select(
        "id, filename, file_type, file_size, status, uploaded_by, created_at, updated_at, published_at"
    ).order("created_at", desc=True)

    if status_filter:
        query = query.eq("status", status_filter)

    result = query.execute()
    return result.data


@router.get("/{document_id}", response_model=DocumentDetail)
async def get_document(document_id: str, admin: dict = Depends(get_current_admin_user)):
    result = supabase.table("documents").select("*").eq("id", document_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return result.data[0]


@router.put("/{document_id}", response_model=DocumentDetail)
async def update_document_content(
    document_id: str,
    payload: UpdateContentRequest,
    admin: dict = Depends(get_current_admin_user),
):
    existing = supabase.table("documents").select("id").eq("id", document_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if not payload.final_content.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="final_content cannot be empty.")

    result = (
        supabase.table("documents")
        .update({
            "final_content": payload.final_content,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", document_id)
        .execute()
    )
    return result.data[0]


@router.patch("/{document_id}/metadata", response_model=DocumentDetail)
async def update_document_metadata(
    document_id: str,
    payload: UpdateMetadataRequest,
    admin: dict = Depends(get_current_admin_user),
):
    existing = supabase.table("documents").select("id").eq("id", document_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    update_data = payload.model_dump(exclude_unset=True, exclude_none=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields provided to update.",
        )

    if "filename" in update_data and not update_data["filename"].strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="filename cannot be empty.")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = (
        supabase.table("documents")
        .update(update_data)
        .eq("id", document_id)
        .execute()
    )
    return result.data[0]


@router.post("/{document_id}/publish", response_model=DocumentDetail)
async def publish_document(document_id: str, admin: dict = Depends(get_current_admin_user)):
    existing = supabase.table("documents").select("status").eq("id", document_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if existing.data[0]["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only documents in 'pending' status can be published.",
        )

    result = (
        supabase.table("documents")
        .update({
            "status": "published",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", document_id)
        .execute()
    )
    return result.data[0]


@router.post("/{document_id}/exclude", response_model=DocumentDetail)
async def exclude_document(document_id: str, admin: dict = Depends(get_current_admin_user)):
    existing = supabase.table("documents").select("id").eq("id", document_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    result = (
        supabase.table("documents")
        .update({"status": "excluded", "updated_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", document_id)
        .execute()
    )
    return result.data[0]


@router.delete("/{document_id}", response_model=DocumentActionResponse)
async def delete_document(document_id: str, admin: dict = Depends(get_current_admin_user)):
    existing = supabase.table("documents").select("file_url").eq("id", document_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    file_url = existing.data[0].get("file_url")
    if file_url:
        try:
            path = file_url.split("/knowledge-documents/")[-1]
            supabase.storage.from_("knowledge-documents").remove([path])
        except Exception:
            pass

    supabase.table("documents").delete().eq("id", document_id).execute()
    return DocumentActionResponse(message="Document deleted.", id=document_id)
