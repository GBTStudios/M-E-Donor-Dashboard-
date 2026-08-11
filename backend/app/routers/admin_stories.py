import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status

from app.core.deps import get_current_admin_user
from app.db.supabase_client import supabase
from app.models.story_schemas import AdminStoryOut, StoryActionResponse

router = APIRouter(prefix="/admin/stories", tags=["admin-stories"])

MAX_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def _upload_image(image: UploadFile) -> str:
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Image must be JPEG, PNG, or WEBP.")

    contents = await image.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Image must be under 5MB.")

    ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
    path = f"{uuid.uuid4()}.{ext}"

    supabase.storage.from_("story-images").upload(path, contents, {"content-type": image.content_type})
    public_url = supabase.storage.from_("story-images").get_public_url(path)
    return public_url


@router.get("", response_model=List[AdminStoryOut])
async def list_all_stories(
    admin: dict = Depends(get_current_admin_user),
    cohort_id: Optional[str] = Query(default=None),
):
    query = supabase.table("stories").select("*").order("created_at", desc=True)
    if cohort_id:
        query = query.eq("cohort_id", cohort_id)
    result = query.execute()
    return result.data


@router.post("", response_model=AdminStoryOut, status_code=status.HTTP_201_CREATED)
async def create_story(
    name: str = Form(...),
    title: str = Form(...),
    body: str = Form(...),
    featured: bool = Form(default=False),
    cohort_id: Optional[str] = Form(default=None),
    image: Optional[UploadFile] = File(default=None),
    admin: dict = Depends(get_current_admin_user),
):
    if not name.strip() or not title.strip() or not body.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="name, title, and body are all required.")

    if cohort_id:
        cohort_check = supabase.table("cohorts").select("id").eq("id", cohort_id).execute()
        if not cohort_check.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cohort not found.")

    image_url = await _upload_image(image) if image else None

    result = (
        supabase.table("stories")
        .insert({
            "name": name.strip(),
            "title": title.strip(),
            "body": body.strip(),
            "image_url": image_url,
            "featured": featured,
            "cohort_id": cohort_id,
        })
        .execute()
    )
    return result.data[0]


@router.put("/{story_id}", response_model=AdminStoryOut)
async def update_story(
    story_id: str,
    name: Optional[str] = Form(default=None),
    title: Optional[str] = Form(default=None),
    body: Optional[str] = Form(default=None),
    featured: Optional[bool] = Form(default=None),
    cohort_id: Optional[str] = Form(default=None),
    image: Optional[UploadFile] = File(default=None),
    admin: dict = Depends(get_current_admin_user),
):
    existing = supabase.table("stories").select("id").eq("id", story_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found.")

    updates = {}
    if name is not None:
        updates["name"] = name.strip()
    if title is not None:
        updates["title"] = title.strip()
    if body is not None:
        updates["body"] = body.strip()
    if featured is not None:
        updates["featured"] = featured
    if cohort_id is not None:
        updates["cohort_id"] = cohort_id
    if image is not None:
        updates["image_url"] = await _upload_image(image)

    if not updates:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No fields provided to update.")

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = supabase.table("stories").update(updates).eq("id", story_id).execute()
    return result.data[0]


@router.delete("/{story_id}", response_model=StoryActionResponse)
async def delete_story(story_id: str, admin: dict = Depends(get_current_admin_user)):
    existing = supabase.table("stories").select("image_url").eq("id", story_id).execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found.")

    image_url = existing.data[0].get("image_url")
    if image_url:
        try:
            path = image_url.split("/story-images/")[-1]
            supabase.storage.from_("story-images").remove([path])
        except Exception:
            pass

    supabase.table("stories").delete().eq("id", story_id).execute()
    return StoryActionResponse(message="Story deleted.", id=story_id)
