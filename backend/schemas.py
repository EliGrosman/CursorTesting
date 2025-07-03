from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class PostCreate(BaseModel):
    title: str
    description: str
    hashtags: str
    video_path: str
    platforms: List[str]

class PostResponse(BaseModel):
    id: int
    title: str
    description: str
    hashtags: str
    video_path: str
    platforms: List[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class ScheduledPostCreate(BaseModel):
    post_id: int
    scheduled_time: datetime

class ScheduledPostResponse(BaseModel):
    id: int
    post_id: int
    scheduled_time: datetime
    status: str
    error_message: Optional[str] = None
    posted_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class SocialMediaConfigCreate(BaseModel):
    platform: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    is_active: bool = False

class SocialMediaConfigResponse(BaseModel):
    id: int
    platform: str
    is_active: bool
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True