# Authentication Setup Guide

## Overview
The authentication system has been successfully implemented with login and register functionality. Here's what has been set up:

### ✅ What's Complete

1. **Backend Authentication**:
   - Login endpoint: `POST /api/auth/login`
   - Register endpoint: `POST /api/auth/register`
   - User profile endpoint: `GET /api/auth/me`
   - JWT token-based authentication
   - Password hashing with bcrypt
   - Complete user management system

2. **Frontend Authentication**:
   - Login page: `/login`
   - Register page: `/register`
   - Protected routes system
   - Authentication service with proper error handling
   - Token management (localStorage)
   - Auto-redirect to login when not authenticated

3. **Database Schema**:
   - `users` table with email, password, and profile fields
   - `user_preferences` table for user settings
   - Proper indexes and constraints

### 🔧 Setup Instructions

#### 1. Database Setup
The system uses PostgreSQL. You have two options:

**Option A: Local PostgreSQL**
1. Install PostgreSQL locally
2. Create database: `createdb claude_clone`
3. Update `.env` file with your database credentials

**Option B: Use a Cloud Database**
1. Set up a PostgreSQL database (e.g., Supabase, Heroku, Railway)
2. Update `DATABASE_URL` in `.env` file

#### 2. Environment Variables
Update `server/.env` with your actual values:

```bash
# Database - Update these with your actual database credentials
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/claude_clone

# JWT Secret - Change this to a secure random string
JWT_SECRET=your_secure_jwt_secret_here

# API Keys - Add your actual API keys
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
```

#### 3. Database Migration
Run the database migration to create tables:

```bash
cd server
npx tsx src/db/migrate.ts
```

#### 4. Start the Application

**Development Mode:**
```bash
# Terminal 1 - Start server
cd server
npm run dev

# Terminal 2 - Start client
cd client
npm run dev
```

**Production Mode:**
```bash
# Use the existing start script
./start.sh
```

### 🎯 How to Use

1. **Access the Application**:
   - Open browser to `http://localhost:5173`
   - You'll be redirected to `/login` if not authenticated

2. **Create an Account**:
   - Click "Sign up for free" on login page
   - Fill in name, email, and password
   - You'll be automatically logged in and redirected to the main app

3. **Login**:
   - Use your email and password
   - You'll be redirected to the main chat interface

4. **Logout**:
   - Click the "Logout" button in the sidebar
   - You'll be redirected back to the login page

### 🔐 Security Features

- **Password Security**: Passwords are hashed using bcrypt
- **JWT Tokens**: Secure token-based authentication with 7-day expiration
- **Protected Routes**: All main app routes require authentication
- **Input Validation**: Zod schemas validate all user inputs
- **CORS Protection**: Configured for secure cross-origin requests

### 🚀 Authentication Flow

1. **Registration**:
   - User submits name, email, password
   - Password is hashed and stored
   - JWT token is generated and returned
   - User is automatically logged in

2. **Login**:
   - User submits email and password
   - Password is verified against hash
   - JWT token is generated and returned
   - Token is stored in localStorage

3. **Protected Access**:
   - All API requests include JWT token in Authorization header
   - Token is verified on each request
   - User information is attached to request object

### 📝 API Endpoints

- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PATCH /api/auth/me` - Update user profile
- `POST /api/auth/change-password` - Change user password
- `PATCH /api/auth/preferences` - Update user preferences

### 🎨 Pages Available

- `/login` - Login page
- `/register` - Registration page
- `/` - Main chat interface (protected)
- `/chat/:id` - Specific conversation (protected)
- `/settings` - User settings (protected)

### 🔧 Troubleshooting

1. **Database Connection Issues**:
   - Check DATABASE_URL in `.env`
   - Ensure PostgreSQL is running
   - Run migration script

2. **Authentication Not Working**:
   - Check JWT_SECRET in `.env`
   - Clear browser localStorage
   - Check browser console for errors

3. **Pages Not Loading**:
   - Ensure both client and server are running
   - Check CORS settings in server
   - Verify API endpoints are accessible

### 📊 What's Next

The authentication system is now fully functional. Users can:
- Register new accounts
- Login and logout
- Access protected routes
- Have their sessions persist across browser sessions
- Update their profiles and preferences

All authentication features are now up to date and working properly!