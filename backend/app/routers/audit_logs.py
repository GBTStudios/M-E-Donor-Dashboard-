from datetime import datetime, timezone, date
from typing import Optional
import io

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from fpdf import FPDF

from app.models.audit_log_schemas import (
    AuditLogListResponse, AuditLogItem,
    ConversationContextResponse, ConversationMessage,
    ResolveFlaggedResponse,
)
from app.db.supabase_client import supabase
from app.core.deps import get_current_admin_user

router = APIRouter(prefix="/admin/audit-logs", tags=["audit-logs"])


def _log_access(admin_id: str):
    try:
        supabase.table("audit_log_access_log").insert({"admin_id": admin_id}).execute()
    except Exception:
        pass


def _fetch_conversation_map(conversation_ids: list) -> dict:
    """Returns {conversation_id: {originating_identity, user_name}}."""
    if not conversation_ids:
        return {}

    convos = (
        supabase.table("chat_conversations")
        .select("id, originating_identity, user_id")
        .in_("id", conversation_ids)
        .execute()
    )

    user_ids = [c["user_id"] for c in convos.data if c.get("user_id")]
    name_map = {}
    if user_ids:
        users_result = supabase.table("users").select("id, full_name").in_("id", user_ids).execute()
        name_map = {u["id"]: u["full_name"] for u in users_result.data}

    return {
        c["id"]: {
            "originating_identity": c["originating_identity"],
            "user_name": name_map.get(c.get("user_id")),
        }
        for c in convos.data
    }


def _row_to_item(row: dict, convo_map: dict) -> AuditLogItem:
    convo_info = convo_map.get(row["conversation_id"], {})
    return AuditLogItem(
        id=row["id"],
        log_number=row["log_number"],
        conversation_id=row["conversation_id"],
        originating_identity=convo_info.get("originating_identity", "Unknown"),
        user_name=convo_info.get("user_name"),
        inquiry=row["inquiry"],
        response=row["response"],
        status=row["status"],
        resolved=row["resolved"],
        created_at=row["created_at"],
        reference_id=f"LOG-{row['log_number']:03d}",
    )


@router.get("", response_model=AuditLogListResponse)
async def list_audit_logs(
    admin: dict = Depends(get_current_admin_user),
    search: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    date_filter: Optional[date] = Query(default=None),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    _log_access(admin["id"])

    query = supabase.table("chat_audit_logs").select("*", count="exact").order("created_at", desc=True)

    if status_filter and status_filter.lower() != "all":
        query = query.eq("status", status_filter.lower())

    if search:
        query = query.or_(f"inquiry.ilike.%{search}%,response.ilike.%{search}%")

    if date_filter:
        start = datetime.combine(date_filter, datetime.min.time()).isoformat()
        end = datetime.combine(date_filter, datetime.max.time()).isoformat()
        query = query.gte("created_at", start).lte("created_at", end)
    elif start_date and end_date:
        start = datetime.combine(start_date, datetime.min.time()).isoformat()
        end = datetime.combine(end_date, datetime.max.time()).isoformat()
        query = query.gte("created_at", start).lte("created_at", end)

    offset = (page - 1) * page_size
    query = query.range(offset, offset + page_size - 1)

    result = query.execute()

    conversation_ids = [row["conversation_id"] for row in result.data]
    convo_map = _fetch_conversation_map(conversation_ids)

    items = [_row_to_item(row, convo_map) for row in result.data]

    return AuditLogListResponse(
        total=result.count or 0,
        page=page,
        page_size=page_size,
        items=items,
    )


@router.get("/{conversation_id}/context", response_model=ConversationContextResponse)
async def get_conversation_context(conversation_id: str, admin: dict = Depends(get_current_admin_user)):
    _log_access(admin["id"])

    convo = supabase.table("chat_conversations").select("*").eq("id", conversation_id).execute()
    if not convo.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    convo_row = convo.data[0]
    user_name = None
    if convo_row.get("user_id"):
        user_result = supabase.table("users").select("full_name").eq("id", convo_row["user_id"]).execute()
        if user_result.data:
            user_name = user_result.data[0]["full_name"]

    messages_result = (
        supabase.table("chat_audit_logs")
        .select("inquiry, response, status, created_at")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .execute()
    )

    return ConversationContextResponse(
        conversation_id=conversation_id,
        originating_identity=convo_row["originating_identity"],
        user_name=user_name,
        messages=[ConversationMessage(**m) for m in messages_result.data],
    )


@router.post("/{log_id}/resolve", response_model=ResolveFlaggedResponse)
async def resolve_flagged_log(log_id: str, admin: dict = Depends(get_current_admin_user)):
    existing = supabase.table("chat_audit_logs").select("id, status").eq("id", log_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log entry not found.")

    if existing.data[0]["status"] != "flagged":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only flagged entries can be marked as resolved.",
        )

    supabase.table("chat_audit_logs").update({"resolved": True}).eq("id", log_id).execute()

    return ResolveFlaggedResponse()


@router.get("/export/pdf")
async def export_audit_logs_pdf(
    admin: dict = Depends(get_current_admin_user),
    search: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
):
    _log_access(admin["id"])

    query = supabase.table("chat_audit_logs").select("*").order("created_at", desc=True)

    if status_filter and status_filter.lower() != "all":
        query = query.eq("status", status_filter.lower())

    if search:
        query = query.or_(f"inquiry.ilike.%{search}%,response.ilike.%{search}%")

    if start_date and end_date:
        start = datetime.combine(start_date, datetime.min.time()).isoformat()
        end = datetime.combine(end_date, datetime.max.time()).isoformat()
        query = query.gte("created_at", start).lte("created_at", end)

    result = query.execute()

    conversation_ids = [row["conversation_id"] for row in result.data]
    convo_map = _fetch_conversation_map(conversation_ids)

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Groundbreaker Studio", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Chat Audit Log Report - Exported {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", ln=True)
    pdf.cell(0, 6, f"Total records: {len(result.data)}", ln=True)
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(25, 8, "Ref ID", border=1)
    pdf.cell(35, 8, "Identity/Name", border=1)
    pdf.cell(30, 8, "Timestamp", border=1)
    pdf.cell(20, 8, "Status", border=1)
    pdf.cell(75, 8, "Inquiry", border=1)
    pdf.ln()

    pdf.set_font("Helvetica", "", 8)
    for row in result.data:
        ref_id = f"LOG-{row['log_number']:03d}"
        convo_info = convo_map.get(row["conversation_id"], {})
        display_identity = convo_info.get("user_name") or convo_info.get("originating_identity", "Unknown")
        timestamp = row["created_at"][:16].replace("T", " ")
        inquiry_short = row["inquiry"][:50] + ("..." if len(row["inquiry"]) > 50 else "")

        pdf.cell(25, 7, ref_id, border=1)
        pdf.cell(35, 7, display_identity[:22], border=1)
        pdf.cell(30, 7, timestamp, border=1)
        pdf.cell(20, 7, row["status"], border=1)
        pdf.cell(75, 7, inquiry_short, border=1)
        pdf.ln()

    pdf_bytes = bytes(pdf.output())
    filename = f"chat-audit-logs-{datetime.now(timezone.utc).strftime('%Y%m%d')}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
