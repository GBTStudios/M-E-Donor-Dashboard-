import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter

from app.db.supabase_client import supabase
from app.models.chat_schemas import ChatMessageRequest, ChatMessageResponse
from app.services.chat_agent import run_chat_agent

router = APIRouter(tags=["chat"])


@router.post("/chat/message", response_model=ChatMessageResponse)
async def send_chat_message(payload: ChatMessageRequest):
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

    response_text = run_chat_agent(history, payload.message)

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

    return ChatMessageResponse(session_id=session_id, response=response_text)