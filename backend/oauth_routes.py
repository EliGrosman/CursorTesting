from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import requests
import os
import secrets
from urllib.parse import urlencode
from typing import Dict, Any

from database import get_db
from models import SocialMediaConfig
from social_media import SocialMediaManager
from schemas import SocialMediaConfigCreate

router = APIRouter()

# OAuth state storage (in production, use Redis or database)
oauth_states = {}

@router.get("/auth/{platform}/login")
async def oauth_login(platform: str, request: Request):
    """Initiate OAuth flow for a platform"""
    
    if platform not in ["instagram", "tiktok", "youtube"]:
        raise HTTPException(status_code=400, detail="Unsupported platform")
    
    state = secrets.token_urlsafe(32)
    oauth_states[state] = {"platform": platform}
    
    base_url = str(request.base_url).rstrip('/')
    redirect_uri = f"{base_url}/auth/{platform}/callback"
    
    if platform == "instagram":
        # Instagram uses Facebook OAuth
        client_id = os.getenv("INSTAGRAM_CLIENT_ID")
        auth_url = f"https://www.facebook.com/v18.0/dialog/oauth"
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": "instagram_basic,pages_show_list,instagram_content_publish",
            "response_type": "code",
            "state": state
        }
        
    elif platform == "tiktok":
        client_id = os.getenv("TIKTOK_CLIENT_ID")
        auth_url = "https://www.tiktok.com/v2/auth/authorize/"
        params = {
            "client_key": client_id,
            "scope": "user.info.basic,video.upload",
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "state": state
        }
        
    elif platform == "youtube":
        client_id = os.getenv("YOUTUBE_CLIENT_ID")
        auth_url = "https://accounts.google.com/o/oauth2/auth"
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": "https://www.googleapis.com/auth/youtube.upload",
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent",
            "state": state
        }
    
    return RedirectResponse(f"{auth_url}?{urlencode(params)}")

@router.get("/auth/{platform}/callback")
async def oauth_callback(platform: str, code: str, state: str, db: Session = Depends(get_db)):
    """Handle OAuth callback and store tokens"""
    
    if state not in oauth_states or oauth_states[state]["platform"] != platform:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    # Remove used state
    del oauth_states[state]
    
    try:
        if platform == "instagram":
            # Exchange code for access token
            client_id = os.getenv("INSTAGRAM_CLIENT_ID")
            client_secret = os.getenv("INSTAGRAM_CLIENT_SECRET")
            redirect_uri = f"{os.getenv('BASE_URL', 'http://localhost:8000')}/auth/instagram/callback"
            
            token_url = "https://graph.facebook.com/v18.0/oauth/access_token"
            data = {
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "code": code
            }
            
            response = requests.post(token_url, data=data)
            if not response.ok:
                raise HTTPException(status_code=400, detail=f"Token exchange failed: {response.text}")
            
            token_data = response.json()
            access_token = token_data["access_token"]
            
            # Exchange for long-lived token
            long_lived_url = "https://graph.facebook.com/v18.0/oauth/access_token"
            params = {
                "grant_type": "fb_exchange_token",
                "client_id": client_id,
                "client_secret": client_secret,
                "fb_exchange_token": access_token
            }
            
            ll_response = requests.get(long_lived_url, params=params)
            if ll_response.ok:
                ll_data = ll_response.json()
                access_token = ll_data["access_token"]
            
            # Get user's pages and Instagram accounts
            pages_url = f"https://graph.facebook.com/v18.0/me/accounts?access_token={access_token}"
            pages_response = requests.get(pages_url)
            
            if not pages_response.ok:
                raise HTTPException(status_code=400, detail="Failed to get user pages")
            
            pages_data = pages_response.json()
            instagram_account_id = None
            
            # Find Instagram business account
            for page in pages_data.get("data", []):
                ig_url = f"https://graph.facebook.com/v18.0/{page['id']}?fields=instagram_business_account&access_token={access_token}"
                ig_response = requests.get(ig_url)
                if ig_response.ok:
                    ig_data = ig_response.json()
                    if "instagram_business_account" in ig_data:
                        instagram_account_id = ig_data["instagram_business_account"]["id"]
                        break
            
            if not instagram_account_id:
                raise HTTPException(status_code=400, detail="No Instagram business account found")
            
            # Store or update configuration
            config = db.query(SocialMediaConfig).filter(SocialMediaConfig.platform == "instagram").first()
            if not config:
                config = SocialMediaConfig(platform="instagram")
                db.add(config)
            
            config.client_id = instagram_account_id
            config.client_secret = client_secret
            config.access_token = access_token
            config.is_active = True
            
        elif platform == "tiktok":
            client_id = os.getenv("TIKTOK_CLIENT_ID")
            client_secret = os.getenv("TIKTOK_CLIENT_SECRET")
            redirect_uri = f"{os.getenv('BASE_URL', 'http://localhost:8000')}/auth/tiktok/callback"
            
            token_url = "https://open.tiktokapis.com/v2/oauth/token/"
            data = {
                "client_key": client_id,
                "client_secret": client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri
            }
            
            response = requests.post(token_url, data=data)
            if not response.ok:
                raise HTTPException(status_code=400, detail=f"Token exchange failed: {response.text}")
            
            token_data = response.json()
            access_token = token_data["access_token"]
            refresh_token = token_data.get("refresh_token")
            
            # Store or update configuration
            config = db.query(SocialMediaConfig).filter(SocialMediaConfig.platform == "tiktok").first()
            if not config:
                config = SocialMediaConfig(platform="tiktok")
                db.add(config)
            
            config.client_id = client_id
            config.client_secret = client_secret
            config.access_token = access_token
            config.refresh_token = refresh_token
            config.is_active = True
            
        elif platform == "youtube":
            client_id = os.getenv("YOUTUBE_CLIENT_ID")
            client_secret = os.getenv("YOUTUBE_CLIENT_SECRET")
            redirect_uri = f"{os.getenv('BASE_URL', 'http://localhost:8000')}/auth/youtube/callback"
            
            token_url = "https://oauth2.googleapis.com/token"
            data = {
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri
            }
            
            response = requests.post(token_url, data=data)
            if not response.ok:
                raise HTTPException(status_code=400, detail=f"Token exchange failed: {response.text}")
            
            token_data = response.json()
            access_token = token_data["access_token"]
            refresh_token = token_data.get("refresh_token")
            
            # Store or update configuration
            config = db.query(SocialMediaConfig).filter(SocialMediaConfig.platform == "youtube").first()
            if not config:
                config = SocialMediaConfig(platform="youtube")
                db.add(config)
            
            config.client_id = client_id
            config.client_secret = client_secret
            config.access_token = access_token
            config.refresh_token = refresh_token
            config.is_active = True
        
        db.commit()
        return {"message": f"{platform.title()} connected successfully!"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth callback error: {str(e)}")

@router.post("/test/{platform}")
async def test_platform(platform: str, test_data: dict, db: Session = Depends(get_db)):
    """Test posting to a specific platform"""
    
    if platform not in ["instagram", "tiktok", "youtube"]:
        raise HTTPException(status_code=400, detail="Unsupported platform")
    
    social_manager = SocialMediaManager(db)
    
    # Create a test video file if needed
    test_video_path = "test_video.mp4"
    if not os.path.exists(test_video_path):
        return {"error": "Test video file not found. Please add a test_video.mp4 file to test posting."}
    
    if platform == "instagram":
        result = social_manager.post_to_instagram(
            video_path=test_video_path,
            caption=test_data.get("caption", "Test post from Social Media Scheduler"),
            hashtags=test_data.get("hashtags", "#test")
        )
    elif platform == "tiktok":
        result = social_manager.post_to_tiktok(
            video_path=test_video_path,
            caption=test_data.get("caption", "Test post from Social Media Scheduler"),
            hashtags=test_data.get("hashtags", "#test")
        )
    elif platform == "youtube":
        result = social_manager.post_to_youtube(
            video_path=test_video_path,
            title=test_data.get("title", "Test Video"),
            description=test_data.get("description", "Test post from Social Media Scheduler"),
            hashtags=test_data.get("hashtags", "#test #shorts")
        )
    
    return result

@router.get("/platforms/status")
async def get_platforms_status(db: Session = Depends(get_db)):
    """Get the status of all configured platforms"""
    
    platforms = ["instagram", "tiktok", "youtube"]
    status = {}
    
    for platform in platforms:
        config = db.query(SocialMediaConfig).filter(
            SocialMediaConfig.platform == platform,
            SocialMediaConfig.is_active == True
        ).first()
        
        if config and config.access_token:
            status[platform] = {
                "configured": True,
                "has_access_token": True,
                "has_refresh_token": bool(config.refresh_token)
            }
        else:
            status[platform] = {
                "configured": False,
                "has_access_token": False,
                "has_refresh_token": False
            }
    
    return status

@router.post("/platforms/{platform}/refresh")
async def refresh_platform_token(platform: str, db: Session = Depends(get_db)):
    """Refresh access token for a platform"""
    
    if platform not in ["instagram", "tiktok", "youtube"]:
        raise HTTPException(status_code=400, detail="Unsupported platform")
    
    social_manager = SocialMediaManager(db)
    result = social_manager.refresh_access_token(platform)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.delete("/platforms/{platform}/disconnect")
async def disconnect_platform(platform: str, db: Session = Depends(get_db)):
    """Disconnect a platform by deactivating its configuration"""
    
    if platform not in ["instagram", "tiktok", "youtube"]:
        raise HTTPException(status_code=400, detail="Unsupported platform")
    
    config = db.query(SocialMediaConfig).filter(SocialMediaConfig.platform == platform).first()
    
    if not config:
        raise HTTPException(status_code=404, detail=f"{platform.title()} not configured")
    
    config.is_active = False
    config.access_token = None
    config.refresh_token = None
    db.commit()
    
    return {"message": f"{platform.title()} disconnected successfully"}