from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class StoryOut(BaseModel):
    id: str
    name: str
    title: str
    body: str
    image_url: Optional[str] = None
    featured: bool
    created_at: datetime


class AdminStoryOut(BaseModel):
    id: str
    name: str
    title: str
    body: str
    image_url: Optional[str] = None
    featured: bool
    cohort_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class StoryActionResponse(BaseModel):
    message: str
    id: Optional[str] = None
