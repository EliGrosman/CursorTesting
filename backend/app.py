from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import os
import shutil
import uuid
from typing import List, Optional

from database import SessionLocal, engine, Base, get_db
from models import Post, ScheduledPost
from schemas import PostCreate, PostResponse, ScheduledPostCreate, ScheduledPostResponse
from social_media import SocialMediaManager
from scheduler import schedule_post
from oauth_routes import router as oauth_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Social Media Scheduler", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include OAuth routes
app.include_router(oauth_router, prefix="/api", tags=["OAuth & Testing"])

@app.get("/")
async def root():
    return {"message": "Social Media Scheduler API"}

@app.post("/upload-video", response_model=dict)
async def upload_video(file: UploadFile = File(...)):
    # Validate file type
    allowed_types = ["video/mp4", "video/avi", "video/mov", "video/quicktime"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only video files are allowed.")
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {
        "filename": unique_filename,
        "file_path": file_path,
        "file_url": f"/uploads/{unique_filename}"
    }

@app.post("/posts", response_model=PostResponse)
async def create_post(post: PostCreate, db: Session = Depends(get_db)):
    db_post = Post(
        title=post.title,
        description=post.description,
        hashtags=post.hashtags,
        video_path=post.video_path,
        platforms=post.platforms,
        created_at=datetime.now(timezone.utc)
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@app.post("/schedule", response_model=ScheduledPostResponse)
async def schedule_post_endpoint(scheduled_post: ScheduledPostCreate, db: Session = Depends(get_db)):
    # Get the post
    post = db.query(Post).filter(Post.id == scheduled_post.post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Create scheduled post
    db_scheduled_post = ScheduledPost(
        post_id=scheduled_post.post_id,
        scheduled_time=scheduled_post.scheduled_time,
        status="pending",
        created_at=datetime.now(timezone.utc)
    )
    db.add(db_scheduled_post)
    db.commit()
    db.refresh(db_scheduled_post)
    
    # Schedule the task
    schedule_post(db_scheduled_post.id)
    
    return db_scheduled_post

@app.get("/posts", response_model=List[PostResponse])
async def get_posts(db: Session = Depends(get_db)):
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    return posts

@app.get("/scheduled-posts", response_model=List[ScheduledPostResponse])
async def get_scheduled_posts(db: Session = Depends(get_db)):
    scheduled_posts = db.query(ScheduledPost).order_by(ScheduledPost.scheduled_time.desc()).all()
    return scheduled_posts

@app.delete("/posts/{post_id}")
async def delete_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Delete associated file
    if post.video_path and os.path.exists(post.video_path):
        os.remove(post.video_path)
    
    # Delete scheduled posts
    db.query(ScheduledPost).filter(ScheduledPost.post_id == post_id).delete()
    
    # Delete post
    db.delete(post)
    db.commit()
    
    return {"message": "Post deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)