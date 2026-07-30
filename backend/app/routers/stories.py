from fastapi import APIRouter, Query
from typing import List

from app.models.story_schemas import StoryOut
from app.db.supabase_client import supabase

router = APIRouter(tags=["stories"])


@router.get("/stories", response_model=List[StoryOut])
async def list_stories(limit: int = Query(default=10, ge=1, le=50)):
    result = (
        supabase.table("stories")
        .select("*")
        .order("featured", desc=True)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data
