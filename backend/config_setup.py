#!/usr/bin/env python3
"""
Social Media API Configuration Setup Script

This script helps you configure API credentials for Instagram, TikTok, and YouTube.
Run this after obtaining your API keys from each platform.

Usage:
    python config_setup.py
"""

import os
import sys
from datetime import datetime, timezone
from getpass import getpass

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
from models import SocialMediaConfig

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def get_input(prompt, required=True, is_secret=False):
    """Get input from user with validation"""
    while True:
        if is_secret:
            value = getpass(f"{prompt}: ")
        else:
            value = input(f"{prompt}: ").strip()
        
        if value or not required:
            return value
        print("This field is required. Please enter a value.")

def configure_instagram():
    """Configure Instagram (Facebook) API credentials"""
    print("\n🔧 Instagram Configuration")
    print("You'll need:")
    print("- Facebook App ID")
    print("- Facebook App Secret")
    print("- Instagram Business Account ID")
    print("- Long-lived Access Token")
    print("See SOCIAL_MEDIA_SETUP.md for detailed instructions.\n")
    
    app_id = get_input("Facebook App ID")
    app_secret = get_input("Facebook App Secret", is_secret=True)
    business_account_id = get_input("Instagram Business Account ID")
    access_token = get_input("Long-lived Access Token", is_secret=True)
    
    return {
        "platform": "instagram",
        "client_id": business_account_id,
        "client_secret": app_secret,
        "access_token": access_token,
        "is_active": True
    }

def configure_tiktok():
    """Configure TikTok API credentials"""
    print("\n🔧 TikTok Configuration")
    print("You'll need:")
    print("- TikTok Client Key")
    print("- TikTok Client Secret") 
    print("- Access Token (from OAuth flow)")
    print("- Refresh Token (from OAuth flow)")
    print("See SOCIAL_MEDIA_SETUP.md for detailed instructions.\n")
    
    client_key = get_input("TikTok Client Key")
    client_secret = get_input("TikTok Client Secret", is_secret=True)
    access_token = get_input("Access Token", is_secret=True)
    refresh_token = get_input("Refresh Token (optional)", required=False, is_secret=True)
    
    return {
        "platform": "tiktok",
        "client_id": client_key,
        "client_secret": client_secret,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "is_active": True
    }

def configure_youtube():
    """Configure YouTube (Google) API credentials"""
    print("\n🔧 YouTube Configuration")
    print("You'll need:")
    print("- Google OAuth Client ID")
    print("- Google OAuth Client Secret")
    print("- Access Token (from OAuth flow)")
    print("- Refresh Token (from OAuth flow)")
    print("See SOCIAL_MEDIA_SETUP.md for detailed instructions.\n")
    
    client_id = get_input("Google OAuth Client ID")
    client_secret = get_input("Google OAuth Client Secret", is_secret=True)
    access_token = get_input("Access Token", is_secret=True)
    refresh_token = get_input("Refresh Token", is_secret=True)
    
    return {
        "platform": "youtube",
        "client_id": client_id,
        "client_secret": client_secret,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "is_active": True
    }

def save_config(config_data):
    """Save configuration to database"""
    db = SessionLocal()
    try:
        # Check if config already exists
        existing_config = db.query(SocialMediaConfig).filter(
            SocialMediaConfig.platform == config_data["platform"]
        ).first()
        
        if existing_config:
            print(f"⚠️  Configuration for {config_data['platform'].title()} already exists.")
            overwrite = input("Do you want to overwrite it? (y/N): ").lower().strip()
            if overwrite != 'y':
                print("Skipping...")
                return False
            
            # Update existing config
            for key, value in config_data.items():
                if key != "platform":
                    setattr(existing_config, key, value)
            existing_config.updated_at = datetime.now(timezone.utc)
            
        else:
            # Create new config
            config = SocialMediaConfig(**config_data)
            db.add(config)
        
        db.commit()
        print(f"✅ {config_data['platform'].title()} configuration saved successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error saving configuration: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def show_status():
    """Show current configuration status"""
    db = SessionLocal()
    try:
        print("\n📊 Current Configuration Status:")
        print("-" * 40)
        
        platforms = ["instagram", "tiktok", "youtube"]
        for platform in platforms:
            config = db.query(SocialMediaConfig).filter(
                SocialMediaConfig.platform == platform
            ).first()
            
            if config and config.is_active:
                status = "✅ Configured"
                if config.access_token:
                    status += " (with access token)"
                if config.refresh_token:
                    status += " (with refresh token)"
            else:
                status = "❌ Not configured"
            
            print(f"{platform.title():<12}: {status}")
        
        print("-" * 40)
        
    except Exception as e:
        print(f"❌ Error checking status: {e}")
    finally:
        db.close()

def main():
    """Main configuration menu"""
    print("🎬 Social Media Scheduler - API Configuration Setup")
    print("=" * 55)
    
    while True:
        print("\nWhat would you like to do?")
        print("1. Configure Instagram")
        print("2. Configure TikTok")
        print("3. Configure YouTube")
        print("4. Show configuration status")
        print("5. Exit")
        
        choice = input("\nEnter your choice (1-5): ").strip()
        
        if choice == "1":
            config_data = configure_instagram()
            save_config(config_data)
            
        elif choice == "2":
            config_data = configure_tiktok()
            save_config(config_data)
            
        elif choice == "3":
            config_data = configure_youtube()
            save_config(config_data)
            
        elif choice == "4":
            show_status()
            
        elif choice == "5":
            print("\n👋 Configuration setup complete!")
            break
            
        else:
            print("❌ Invalid choice. Please enter 1-5.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Configuration setup cancelled by user.")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        print("Please check your setup and try again.")