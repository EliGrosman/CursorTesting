# Social Media Post Scheduler

A modern web application for scheduling video content across Instagram, TikTok, and YouTube Shorts. Built with Python FastAPI backend and React TypeScript frontend.

## Features

- 📹 **Video Upload**: Drag-and-drop video file upload with support for MP4, AVI, MOV formats
- 📝 **Content Management**: Add titles, descriptions, and hashtags to your posts
- 🎯 **Multi-Platform**: Schedule posts to Instagram, TikTok, and YouTube Shorts
- ⏰ **Smart Scheduling**: Schedule posts for specific times or publish immediately
- 📊 **Dashboard**: Track post status and manage scheduled content
- 🎨 **Modern UI**: Professional, responsive design built with Tailwind CSS

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Database (easily configurable to PostgreSQL)
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **Heroicons** - Icon library
- **Axios** - HTTP client

## Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **npm** or **yarn**

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-media-scheduler
   ```

2. **Run the setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Start the application**
   ```bash
   chmod +x run-app.sh
   ./run-app.sh
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Manual Setup

### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## Project Structure

```
social-media-scheduler/
├── backend/
│   ├── app.py                 # Main FastAPI application
│   ├── database.py            # Database configuration
│   ├── models.py              # SQLAlchemy models
│   ├── schemas.py             # Pydantic schemas
│   ├── social_media.py        # Social media API integrations
│   ├── scheduler.py           # Post scheduling system
│   ├── requirements.txt       # Python dependencies
│   └── uploads/              # Uploaded video files
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── types/           # TypeScript type definitions
│   │   ├── api/             # API client functions
│   │   └── index.tsx        # Application entry point
│   ├── package.json
│   └── tailwind.config.js
├── setup.sh                 # Setup script
├── run-app.sh              # Run both services
├── run-backend.sh          # Run backend only
├── run-frontend.sh         # Run frontend only
└── README.md
```

## API Endpoints

### Posts
- `POST /upload-video` - Upload video file
- `POST /posts` - Create new post
- `GET /posts` - Get all posts
- `DELETE /posts/{id}` - Delete post

### Scheduling
- `POST /schedule` - Schedule a post
- `GET /scheduled-posts` - Get scheduled posts

### API Documentation
Visit http://localhost:8000/docs for interactive API documentation.

## Social Media Integration

The application provides placeholder implementations for social media APIs. To enable actual posting:

### Instagram
1. Create a Facebook App
2. Get Instagram Basic Display API access
3. Implement OAuth flow
4. Update `social_media.py` with actual API calls

### TikTok
1. Apply for TikTok for Developers access
2. Create TikTok app and get credentials
3. Implement OAuth flow
4. Update `social_media.py` with actual API calls

### YouTube
1. Create Google Cloud Project
2. Enable YouTube Data API v3
3. Set up OAuth 2.0 credentials
4. Update `social_media.py` with actual API calls

## Configuration

### Environment Variables

Create `.env` files for configuration:

**Backend (.env)**
```env
DATABASE_URL=sqlite:///./social_scheduler.db
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:8000
```

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate

# Install development dependencies
pip install black flake8 pytest

# Format code
black .

# Lint code
flake8 .

# Run tests
pytest
```

### Frontend Development

```bash
cd frontend

# Install development dependencies
npm install --save-dev @types/jest

# Run tests
npm test

# Build for production
npm run build
```

## Deployment

### Production Build

1. **Backend**: Configure production database and environment variables
2. **Frontend**: Build production bundle with `npm run build`
3. **Server**: Deploy using Docker, AWS, Heroku, or your preferred platform

### Docker (Optional)

Create `Dockerfile` for containerized deployment:

```dockerfile
# Backend Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Features Overview

### 🎬 Video Management
- Upload videos up to 100MB
- Support for MP4, AVI, MOV formats
- Drag-and-drop interface
- File validation and error handling

### 📝 Content Creation
- Rich text descriptions
- Hashtag management
- Multi-platform targeting
- Preview and validation

### ⏰ Scheduling System
- Immediate publishing
- Future scheduling
- Timezone support
- Automated execution

### 📊 Monitoring
- Real-time status tracking
- Post history
- Error reporting
- Performance metrics

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For support and questions:
- Open an issue on GitHub
- Check the API documentation at http://localhost:8000/docs
- Review the code comments and examples

---

Built with ❤️ using FastAPI and React