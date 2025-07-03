# Social Media API Setup Guide

This guide will walk you through setting up API access for Instagram, TikTok, and YouTube Shorts integration in the Social Media Scheduler app.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Instagram Setup](#instagram-setup)
3. [TikTok Setup](#tiktok-setup)
4. [YouTube Setup](#youtube-setup)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- A business/creator account for each platform
- Valid phone number and email for verification
- Patience (approval processes can take days or weeks)

⚠️ **Important**: All platforms require business/developer verification which can take time. Start this process early!

---

## Instagram Setup

Instagram posting requires a Facebook App with Instagram Graph API access.

### Step 1: Create a Facebook App

1. **Go to Facebook Developers**
   - Visit: https://developers.facebook.com/
   - Click "Get Started" or "My Apps"

2. **Create New App**
   - Click "Create App"
   - Select "Consumer" or "Business" (recommended: Business)
   - Fill in app details:
     - App Name: "Social Media Scheduler"
     - App Contact Email: Your email
     - App Purpose: Choose appropriate purpose

3. **Get App Credentials**
   - Go to App Dashboard → Settings → Basic
   - Note down:
     - App ID (this is your `client_id`)
     - App Secret (this is your `client_secret`)

### Step 2: Add Instagram Graph API

1. **Add Instagram Product**
   - In App Dashboard, click "Add Product"
   - Find "Instagram Graph API" and click "Set Up"

2. **Configure Instagram Graph API**
   - Go to Instagram Graph API → Settings
   - Add Instagram Test User (your Instagram business account)
   - Add required permissions:
     - `instagram_graph_user_profile`
     - `instagram_graph_user_media`
     - `pages_show_list`
     - `pages_read_engagement`

### Step 3: Convert to Business Account

1. **Instagram Business Account**
   - Your Instagram account must be a Business or Creator account
   - Go to Instagram app → Settings → Account → Switch to Professional Account

2. **Connect to Facebook Page**
   - Create a Facebook Page if you don't have one
   - Connect your Instagram account to this Facebook Page
   - Go to Facebook Page → Settings → Instagram → Connect Account

### Step 4: Get Access Token

1. **Generate Access Token**
   - Go to Graph API Explorer: https://developers.facebook.com/tools/explorer/
   - Select your app
   - Generate User Access Token with permissions:
     - `instagram_basic`
     - `pages_show_list`
     - `instagram_content_publish`

2. **Exchange for Long-lived Token**
   ```bash
   curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN"
   ```

### Step 5: Get Instagram Business Account ID

1. **Find your Instagram Account ID**
   ```bash
   curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_ACCESS_TOKEN"
   ```
   
2. **Get Instagram Account**
   ```bash
   curl -X GET "https://graph.facebook.com/v18.0/PAGE_ID?fields=instagram_business_account&access_token=YOUR_ACCESS_TOKEN"
   ```

**Instagram Configuration Summary:**
- `client_id`: Facebook App ID
- `client_secret`: Facebook App Secret  
- `access_token`: Long-lived User Access Token
- Store Instagram Business Account ID in `client_id` field

---

## TikTok Setup

TikTok requires approval for their developer program and video posting capabilities.

### Step 1: Apply for TikTok for Developers

1. **Create TikTok Developer Account**
   - Visit: https://developers.tiktok.com/
   - Click "Register" and sign up with your TikTok account
   - Provide business information and use case

2. **Wait for Approval**
   - TikTok reviews applications manually
   - Can take 1-7 business days
   - You'll receive email notification

### Step 2: Create TikTok App

1. **Create New App**
   - Go to TikTok Developer Portal
   - Click "Manage Apps" → "Create an app"
   - Fill in app details:
     - App Name: "Social Media Scheduler"
     - Category: Choose appropriate category
     - Description: Describe your use case

2. **Configure App Settings**
   - Add products: "Login Kit" and "Video Kit"
   - Set redirect URLs for OAuth:
     - `http://localhost:8000/auth/tiktok/callback` (for development)
     - Your production domain callback URL

### Step 3: Apply for Video Posting

1. **Request Video Upload Permission**
   - In your app dashboard, request "Content Posting API" access
   - Provide detailed use case explanation
   - This requires additional approval (can take weeks)

2. **Get API Credentials**
   - Once approved, go to App Dashboard
   - Note down:
     - Client Key (this is your `client_id`)
     - Client Secret (this is your `client_secret`)

### Step 4: Implement OAuth Flow

1. **Authorization URL**
   ```
   https://www.tiktok.com/v2/auth/authorize/?client_key=CLIENT_KEY&scope=user.info.basic,video.upload&response_type=code&redirect_uri=REDIRECT_URI&state=STATE
   ```

2. **Exchange Code for Token**
   ```bash
   curl -X POST "https://open.tiktokapis.com/v2/oauth/token/" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_key=CLIENT_KEY&client_secret=CLIENT_SECRET&code=AUTHORIZATION_CODE&grant_type=authorization_code&redirect_uri=REDIRECT_URI"
   ```

**TikTok Configuration Summary:**
- `client_id`: TikTok Client Key
- `client_secret`: TikTok Client Secret
- `access_token`: User Access Token (from OAuth)
- `refresh_token`: Refresh Token (from OAuth)

---

## YouTube Setup

YouTube uses Google's OAuth 2.0 and requires a Google Cloud Project.

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create new project or select existing one

2. **Enable YouTube Data API v3**
   - Go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click and enable the API

### Step 2: Create OAuth 2.0 Credentials

1. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type
   - Fill in required information:
     - App name: "Social Media Scheduler"
     - User support email: Your email
     - Developer contact information: Your email

2. **Add Scopes**
   - Add these scopes:
     - `https://www.googleapis.com/auth/youtube.upload`
     - `https://www.googleapis.com/auth/youtube`

3. **Create OAuth 2.0 Client ID**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "Social Media Scheduler"
   - Authorized redirect URIs:
     - `http://localhost:8000/auth/youtube/callback`
     - Your production domain callback URL

4. **Download Credentials**
   - Download the JSON file with your credentials
   - Note down:
     - Client ID (this is your `client_id`)
     - Client Secret (this is your `client_secret`)

### Step 3: Get Access Token

1. **Authorization URL**
   ```
   https://accounts.google.com/o/oauth2/auth?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=https://www.googleapis.com/auth/youtube.upload&response_type=code&access_type=offline&prompt=consent
   ```

2. **Exchange Code for Token**
   ```bash
   curl -X POST "https://oauth2.googleapis.com/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_id=CLIENT_ID&client_secret=CLIENT_SECRET&code=AUTHORIZATION_CODE&grant_type=authorization_code&redirect_uri=REDIRECT_URI"
   ```

**YouTube Configuration Summary:**
- `client_id`: Google OAuth Client ID
- `client_secret`: Google OAuth Client Secret
- `access_token`: User Access Token (from OAuth)
- `refresh_token`: Refresh Token (from OAuth)

---

## Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL=sqlite:///./social_scheduler.db

# Instagram (Facebook App)
INSTAGRAM_CLIENT_ID=your_facebook_app_id
INSTAGRAM_CLIENT_SECRET=your_facebook_app_secret

# TikTok
TIKTOK_CLIENT_ID=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# YouTube (Google OAuth)
YOUTUBE_CLIENT_ID=your_google_oauth_client_id
YOUTUBE_CLIENT_SECRET=your_google_oauth_client_secret

# Security
SECRET_KEY=your_secret_key_for_sessions
```

### Database Configuration

Add API credentials to the database using the admin interface or directly:

```python
from backend.models import SocialMediaConfig
from backend.database import SessionLocal

db = SessionLocal()

# Instagram
instagram_config = SocialMediaConfig(
    platform="instagram",
    client_id="your_instagram_business_account_id",  # Instagram Business Account ID
    client_secret="your_facebook_app_secret",
    access_token="your_long_lived_access_token",
    is_active=True
)

# TikTok
tiktok_config = SocialMediaConfig(
    platform="tiktok",
    client_id="your_tiktok_client_key",
    client_secret="your_tiktok_client_secret",
    access_token="your_tiktok_access_token",
    refresh_token="your_tiktok_refresh_token",
    is_active=True
)

# YouTube
youtube_config = SocialMediaConfig(
    platform="youtube",
    client_id="your_google_oauth_client_id",
    client_secret="your_google_oauth_client_secret",
    access_token="your_youtube_access_token",
    refresh_token="your_youtube_refresh_token",
    is_active=True
)

db.add_all([instagram_config, tiktok_config, youtube_config])
db.commit()
```

---

## Testing

### Test Each Platform

1. **Test Instagram**
   ```bash
   curl -X POST "http://localhost:8000/test/instagram" \
     -H "Content-Type: application/json" \
     -d '{"video_path": "test_video.mp4", "caption": "Test post", "hashtags": "#test"}'
   ```

2. **Test TikTok**
   ```bash
   curl -X POST "http://localhost:8000/test/tiktok" \
     -H "Content-Type: application/json" \
     -d '{"video_path": "test_video.mp4", "caption": "Test post", "hashtags": "#test"}'
   ```

3. **Test YouTube**
   ```bash
   curl -X POST "http://localhost:8000/test/youtube" \
     -H "Content-Type: application/json" \
     -d '{"video_path": "test_video.mp4", "title": "Test Video", "description": "Test description", "hashtags": "#test #shorts"}'
   ```

---

## Troubleshooting

### Common Issues

#### Instagram Issues

**Error: "Invalid OAuth access token"**
- Token expired: Refresh the long-lived token
- Wrong token: Ensure you're using User Access Token, not Page Access Token

**Error: "Instagram account not found"**
- Verify Instagram Business Account is connected to Facebook Page
- Check that the account ID is correct

**Error: "Permission denied"**
- Ensure app has `instagram_content_publish` permission
- Verify Instagram account is added as test user

#### TikTok Issues

**Error: "Access denied"**
- TikTok approval required: Wait for developer account approval
- Video posting not approved: Apply for Content Posting API access

**Error: "Invalid client credentials"**
- Check Client Key and Client Secret
- Ensure redirect URI matches exactly

**Error: "Quota exceeded"**
- TikTok has rate limits: Reduce posting frequency
- Contact TikTok support for quota increase

#### YouTube Issues

**Error: "Invalid credentials"**
- Token expired: Use refresh token to get new access token
- Wrong scope: Ensure `youtube.upload` scope is included

**Error: "Quota exceeded"**
- YouTube API has daily quota limits
- Optimize API calls or request quota increase

**Error: "Video rejected"**
- Video format not supported: Use MP4 with H.264 codec
- Video too large: Compress video or reduce file size

### Rate Limits

- **Instagram**: 200 requests/hour per user
- **TikTok**: 100 requests/day for video upload (varies by approval)
- **YouTube**: 10,000 quota units/day (1 upload = ~1600 units)

### Content Guidelines

- **Instagram**: Max 60 seconds for videos, various aspect ratios supported
- **TikTok**: 15 seconds to 10 minutes, vertical format preferred (9:16)
- **YouTube Shorts**: Max 60 seconds, vertical format preferred (9:16)

### Best Practices

1. **Always test with private/unlisted posts first**
2. **Implement proper error handling and retry logic**
3. **Store refresh tokens securely**
4. **Monitor API quota usage**
5. **Follow each platform's community guidelines**
6. **Keep API credentials secure and rotate them regularly**

---

## Support Resources

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api/)
- [TikTok for Developers Documentation](https://developers.tiktok.com/doc/)
- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit API keys to version control**
2. **Use environment variables for sensitive data**
3. **Implement token refresh logic**
4. **Use HTTPS in production**
5. **Regularly rotate API credentials**
6. **Implement proper access controls**
7. **Monitor API usage for unusual activity**

---

*Last updated: December 2024*