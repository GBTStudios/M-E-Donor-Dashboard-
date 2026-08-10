from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.models.notification_schemas import (
    NotificationOut, NotificationListResponse, UnreadCountResponse,
    MarkReadResponse, MarkAllReadResponse,
)
from app.db.supabase_client import supabase
from app.core.deps import get_current_admin_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    admin: dict = Depends(get_current_admin_user),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    offset = (page - 1) * page_size

    result = (
        supabase.table("notifications")
        .select("*", count="exact")
        .order("created_at", desc=True)
        .range(offset, offset + page_size - 1)
        .execute()
    )

    unread_result = (
        supabase.table("notifications")
        .select("id", count="exact")
        .eq("is_read", False)
        .execute()
    )

    return NotificationListResponse(
        total=result.count or 0,
        unread_count=unread_result.count or 0,
        items=[NotificationOut(**n) for n in result.data],
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(admin: dict = Depends(get_current_admin_user)):
    result = (
        supabase.table("notifications")
        .select("id", count="exact")
        .eq("is_read", False)
        .execute()
    )
    return UnreadCountResponse(unread_count=result.count or 0)


@router.post("/{notification_id}/read", response_model=MarkReadResponse)
async def mark_notification_read(notification_id: str, admin: dict = Depends(get_current_admin_user)):
    existing = supabase.table("notifications").select("id").eq("id", notification_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    supabase.table("notifications").update({"is_read": True}).eq("id", notification_id).execute()

    return MarkReadResponse()


@router.post("/read-all", response_model=MarkAllReadResponse)
async def mark_all_notifications_read(admin: dict = Depends(get_current_admin_user)):
    unread = supabase.table("notifications").select("id").eq("is_read", False).execute()
    ids = [n["id"] for n in unread.data]

    if ids:
        supabase.table("notifications").update({"is_read": True}).in_("id", ids).execute()

    return MarkAllReadResponse(message=f"Marked {len(ids)} notification(s) as read.", marked_count=len(ids))
