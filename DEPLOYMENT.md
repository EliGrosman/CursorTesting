# 🚀 Deployment Guide - Render Only

This guide covers deploying Claude Clone entirely on Render with CI/CD, WebSocket support, and enhanced security features.

## 📋 Overview

- **Backend**: Deployed to Render (with full WebSocket support)
- **Frontend**: Deployed to Render as a static site
- **Database**: PostgreSQL on Render
- **CI/CD**: GitHub Actions for automated deployment
- **Security**: Encrypted API keys, JWT auth, CORS protection

## 🔐 Security Features

### 1. API Key Encryption
- User API keys are encrypted at rest using AES-256-GCM
- Each user can store multiple API keys
- Keys are never exposed in logs or responses
- Password verification required to decrypt keys

### 2. Enhanced CORS
```javascript
// Dynamic origin validation
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 3. Environment-based Security
- Different secrets for staging/production
- Automated secret rotation support
- Secure headers configured

## 🛠️ Setup Instructions

### Prerequisites
1. GitHub repository
2. Vercel account
3. Render account
4. PostgreSQL database

### Step 1: Database Setup

1. **Create PostgreSQL Database**
   - Use Render PostgreSQL or external provider
   - Note the connection string

2. **Run Migrations**
   ```bash
   psql $DATABASE_URL < server/src/db/schema.sql
   ```

### Step 2: Create Render Services

1. **Use render.yaml Blueprint**
   - Go to Render Dashboard
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml`

2. **Or Manual Setup - Backend**
   - Create new Web Service
   - Connect GitHub repository
   - Build Command: `cd server && npm install && npm run build`
   - Start Command: `cd server && npm start`
   - Environment: Node
   - Add environment variables:
     ```
     DATABASE_URL (from database)
     JWT_SECRET (generate)
     ENCRYPTION_KEY (generate)
     ALLOWED_ORIGINS=https://your-frontend.onrender.com
     ```

3. **Manual Setup - Frontend**
   - Create new Static Site
   - Connect GitHub repository
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/dist`
   - Add environment variables:
     ```
     VITE_API_URL=https://your-backend.onrender.com
     VITE_WS_URL=wss://your-backend.onrender.com
     ```

### Step 3: GitHub Actions Setup

1. **Add Secrets to GitHub**
   ```
   RENDER_API_KEY
   RENDER_BACKEND_SERVICE_ID
   RENDER_FRONTEND_SERVICE_ID
   PRODUCTION_DATABASE_URL
   STAGING_DATABASE_URL
   ```

2. **Get Render API Key**
   - Go to Account Settings in Render
   - Generate API Key
   - Add to GitHub Secrets

3. **Get Service IDs**
   - Find in Render dashboard URL: `https://dashboard.render.com/web/srv-XXXX`
   - The `srv-XXXX` part is your service ID

4. **Enable Actions**
   - Push to `main` deploys to staging
   - Push to `production` deploys to production

## � Key Benefits of Render

1. **Full WebSocket Support**
   - Native WebSocket support for real-time streaming
   - No serverless limitations
   - Persistent connections

2. **Integrated PostgreSQL**
   - Automatic backups
   - Connection pooling included
   - Easy scaling

3. **Simple Deployment**
   - Blueprint deployment with `render.yaml`
   - Automatic HTTPS
   - Preview environments

## 📊 Environment Variables Reference

### Backend (Required)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=random-32-char-string
ENCRYPTION_KEY=random-32-char-string
ALLOWED_ORIGINS=https://frontend.com
```

### Backend (Optional)
```env
ANTHROPIC_API_KEY=sk-ant-...  # System fallback
SEARCH_API_KEY=...
SENTRY_DSN=...
```

### Frontend
```env
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

## 🔒 Secure API Key Management

### For Users

1. **Add API Key**
   ```javascript
   POST /api/apikeys
   {
     "name": "Production Key",
     "anthropicKey": "sk-ant-...",
     "expiresIn": 30  // days
   }
   ```

2. **Keys are Encrypted**
   - Stored encrypted in database
   - Decrypted only when needed
   - Never logged or exposed

3. **Retrieve Key (Requires Password)**
   ```javascript
   POST /api/apikeys/:id/decrypt
   {
     "password": "user-password"
   }
   ```

### For Admins

1. **System API Key (Optional)**
   - Set `ANTHROPIC_API_KEY` in environment
   - Used as fallback if user has no keys
   - Allows demo/trial functionality

2. **Encryption Key Rotation**
   ```bash
   # Generate new key
   openssl rand -base64 32
   
   # Update in environment
   vercel env add ENCRYPTION_KEY
   ```

## 🚦 Deployment Workflow

### Development
1. Work on feature branch
2. Open PR to `main`
3. Tests run automatically
4. Preview deployment created

### Staging
1. Merge PR to `main`
2. Automatic deployment to staging
3. Run integration tests
4. Verify functionality

### Production
1. Create PR from `main` to `production`
2. Review and approve
3. Merge triggers production deployment
4. Monitor for issues

## 📈 Monitoring

### Health Checks
- Backend: `/api/health`
- Frontend: Static site monitoring
- Database: Connection pool monitoring

### Error Tracking
1. **Sentry Integration**
   ```env
   SENTRY_DSN=https://...@sentry.io/...
   ```

2. **Custom Logging**
   ```javascript
   // Structured logging
   console.log({
     level: 'error',
     message: 'API key decrypt failed',
     userId: req.user.id,
     timestamp: new Date()
   });
   ```

### Performance Monitoring
- Vercel Analytics (automatic)
- Render Metrics dashboard
- Custom APM integration

## 🔧 Troubleshooting

### CORS Issues
1. Check `ALLOWED_ORIGINS` includes frontend URL
2. Verify protocol (http vs https)
3. Check trailing slashes

### Database Connection
1. Verify `DATABASE_URL` format
2. Check SSL requirements
3. Confirm IP allowlist

### API Key Issues
1. Ensure `ENCRYPTION_KEY` is set
2. Check key expiration
3. Verify user has active key

### WebSocket Connection
1. Ensure `VITE_WS_URL` uses `wss://` for HTTPS
2. Check backend logs for connection errors
3. Verify CORS allows WebSocket upgrade

## 🎯 Best Practices

1. **Security**
   - Rotate secrets regularly
   - Use strong encryption keys
   - Enable 2FA on deployment accounts

2. **Performance**
   - Enable CDN for static assets
   - Use connection pooling
   - Implement caching strategies

3. **Reliability**
   - Set up automated backups
   - Configure health checks
   - Use preview deployments

4. **Cost Optimization**
   - Monitor usage metrics
   - Set spending alerts
   - Use appropriate service tiers

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Main_Page)
- [Security Headers Reference](https://securityheaders.com/)

## 🆘 Support

For deployment issues:
1. Check deployment logs
2. Verify environment variables
3. Test health endpoints
4. Review error tracking

Remember: Never commit secrets to version control!