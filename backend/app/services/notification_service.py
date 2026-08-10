from app.db.supabase_client import supabase


def create_notification(type: str, message: str, related_id: str = None) -> None:
    """Best-effort notification insert. Never raises - a notification failure
    should never break the action that triggered it."""
    try:
        supabase.table("notifications").insert({
            "type": type,
            "message": message,
            "related_id": related_id,
            "is_read": False,
        }).execute()
    except Exception:
        pass
