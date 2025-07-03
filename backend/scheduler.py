import asyncio
from datetime import datetime, timezone
from typing import Dict, Any
import threading
import time
from sqlalchemy.orm import Session
from database import SessionLocal
from models import ScheduledPost, Post
from social_media import SocialMediaManager

class PostScheduler:
    """Handles scheduling and execution of social media posts"""
    
    def __init__(self):
        self.scheduled_tasks = {}
        self.running = True
        self.scheduler_thread = None
        self.start_scheduler()
    
    def start_scheduler(self):
        """Start the background scheduler thread"""
        if self.scheduler_thread is None or not self.scheduler_thread.is_alive():
            self.scheduler_thread = threading.Thread(target=self._scheduler_loop, daemon=True)
            self.scheduler_thread.start()
    
    def _scheduler_loop(self):
        """Main scheduler loop that runs in background"""
        while self.running:
            try:
                self._check_and_execute_posts()
                time.sleep(60)  # Check every minute
            except Exception as e:
                print(f"Scheduler error: {e}")
                time.sleep(60)
    
    def _check_and_execute_posts(self):
        """Check for posts that need to be executed and run them"""
        db = SessionLocal()
        try:
            now = datetime.now(timezone.utc)
            
            # Get pending posts that are due
            due_posts = db.query(ScheduledPost).filter(
                ScheduledPost.status == "pending",
                ScheduledPost.scheduled_time <= now
            ).all()
            
            for scheduled_post in due_posts:
                self._execute_post(db, scheduled_post)
                
        finally:
            db.close()
    
    def _execute_post(self, db: Session, scheduled_post: ScheduledPost):
        """Execute a scheduled post"""
        try:
            # Update status to processing
            scheduled_post.status = "processing"
            db.commit()
            
            # Get the post details
            post = db.query(Post).filter(Post.id == scheduled_post.post_id).first()
            if not post:
                scheduled_post.status = "failed"
                scheduled_post.error_message = "Post not found"
                db.commit()
                return
            
            # Create social media manager
            social_manager = SocialMediaManager(db)
            
            # Post to all platforms
            results = social_manager.post_to_multiple_platforms(
                platforms=post.platforms,
                video_path=post.video_path,
                title=post.title,
                description=post.description,
                hashtags=post.hashtags
            )
            
            # Check if all posts succeeded
            all_success = all(result.get("success", False) for result in results.values())
            
            if all_success:
                scheduled_post.status = "posted"
                scheduled_post.posted_at = datetime.now(timezone.utc)
            else:
                scheduled_post.status = "failed"
                failed_platforms = [platform for platform, result in results.items() 
                                  if not result.get("success", False)]
                scheduled_post.error_message = f"Failed to post to: {', '.join(failed_platforms)}"
            
            db.commit()
            
        except Exception as e:
            scheduled_post.status = "failed"
            scheduled_post.error_message = str(e)
            db.commit()
    
    def add_scheduled_post(self, scheduled_post_id: int):
        """Add a post to the scheduler (called when a post is scheduled)"""
        # The scheduler will pick it up in the next check cycle
        pass
    
    def stop_scheduler(self):
        """Stop the scheduler"""
        self.running = False
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)

# Global scheduler instance
_scheduler = None

def get_scheduler():
    """Get the global scheduler instance"""
    global _scheduler
    if _scheduler is None:
        _scheduler = PostScheduler()
    return _scheduler

def schedule_post(scheduled_post_id: int):
    """Schedule a post for execution"""
    scheduler = get_scheduler()
    scheduler.add_scheduled_post(scheduled_post_id)

# Cleanup function for graceful shutdown
def cleanup_scheduler():
    """Clean up scheduler on app shutdown"""
    global _scheduler
    if _scheduler:
        _scheduler.stop_scheduler()