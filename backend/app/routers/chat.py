import asyncio
import time
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Header

from app.core.security import decode_access_token
from app.db.supabase_client import supabase
from app.models.chat_schemas import ChatMessageRequest, ChatMessageResponse
from app.services.chat_agent import run_chat_agent
from app.services.qa_classifier import classify_qa_exchange
from app.services.notification_service import create_notification

router = APIRouter(tags=["chat"])


def _get_optional_user(authorization: Optional[str]) -> Optional[dict]:
    """Best-effort auth check. Never raises - returns None for missing/invalid tokens
    rather than blocking the request, since /chat/message must work for anonymous visitors."""
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = decode_access_token(token)
    except ValueError:
        return None

    user_id = payload.get("sub")
    result = supabase.table("users").select("id, full_name").eq("id", user_id).execute()
    if not result.data:
        return None

    return result.data[0]


def _log_qa_exchange(question: str, response_text: str, session_id: str, donor_name: str, user_id: Optional[str], response_time_ms: int):
    """Runs in the background after the donor already has their answer."""
    classification = classify_qa_exchange(question, response_text)

    log_result = supabase.table("qa_logs").insert({
        "session_id": session_id,
        "question": question,
        "response": response_text,
        "status": classification["status"],
        "flag_reason": classification["reason"],
        "donor_name": donor_name,
        "user_id": user_id,
        "response_time_ms": response_time_ms,
        "moderation_status": "pending" if classification["status"] == "flagged" else None,
    }).execute()

    if classification["status"] == "flagged":
        log_id = log_result.data[0]["id"] if log_result.data else None
        create_notification(
            "conversation_flagged",
            f"Conversation flagged: {donor_name} — {classification['reason'] or 'sensitive topic'}",
            related_id=log_id,
        )


@router.post("/chat/message", response_model=ChatMessageResponse)
async def send_chat_message(
    payload: ChatMessageRequest,
    background_tasks: BackgroundTasks,
    authorization: Optional[str] = Header(default=None),
):
    t0 = time.time()

    user = _get_optional_user(authorization)
    donor_name = user["full_name"] if user else "Anonymous donor"
    user_id = user["id"] if user else None

    if payload.session_id:
        session_id = payload.session_id
        history_result = (
            supabase.table("chat_messages")
            .select("role, content")
            .eq("session_id", session_id)
            .order("created_at")
            .execute()
        )
        history = history_result.data
    else:
        new_session = supabase.table("chat_sessions").insert({}).execute()
        session_id = new_session.data[0]["id"]
        history = []

    supabase.table("chat_messages").insert({
        "session_id": session_id,
        "role": "user",
        "content": payload.message,
    }).execute()

    response_text = run_chat_agent(history, payload.message, payload.language or "en")

    def _insert_assistant_message():
        supabase.table("chat_messages").insert({
            "session_id": session_id,
            "role": "assistant",
            "content": response_text,
        }).execute()

    def _update_session_timestamp():
        supabase.table("chat_sessions").update({
            "last_active_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", session_id).execute()

    await asyncio.gather(
        asyncio.to_thread(_insert_assistant_message),
        asyncio.to_thread(_update_session_timestamp),
    )

    response_time_ms = int((time.time() - t0) * 1000)

    background_tasks.add_task(
        _log_qa_exchange, payload.message, response_text, session_id, donor_name, user_id, response_time_ms
    )

    return ChatMessageResponse(session_id=session_id, response=response_text)
