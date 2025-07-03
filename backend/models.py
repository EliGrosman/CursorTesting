from sqlalchemy import Boolean, Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    hashtags = Column(Text)  # Store as comma-separated string
    video_path = Column(String(500), nullable=False)
    platforms = Column(JSON)  # Store as JSON array: ["instagram", "tiktok", "youtube"]
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationship
    scheduled_posts = relationship("ScheduledPost", back_populates="post", cascade="all, delete-orphan")

class ScheduledPost(Base):
    __tablename__ = "scheduled_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    scheduled_time = Column(DateTime, nullable=False)
    status = Column(String(50), default="pending")  # pending, posted, failed
    error_message = Column(Text)
    posted_at = Column(DateTime)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationship
    post = relationship("Post", back_populates="scheduled_posts")

class SocialMediaConfig(Base):
    __tablename__ = "social_media_config"
    
    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(50), nullable=False, unique=True)  # instagram, tiktok, youtube
    access_token = Column(Text)
    refresh_token = Column(Text)
    client_id = Column(String(255))
    client_secret = Column(String(255))
    is_active = Column(Boolean, default=False)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))