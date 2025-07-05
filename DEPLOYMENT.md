# 🚀 Deployment Guide

This guide covers deploying Claude Clone with CI/CD to Vercel (backend) and Render (frontend), with enhanced security features.

## 📋 Overview

- **Backend**: Deployed to Vercel (serverless) or Render (traditional server)
- **Frontend**: Deployed to Render as a static site
- **Database**: PostgreSQL on Render or external provider
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

### Step 2: Vercel Backend Setup

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Link Project**
   ```bash
   cd server
   vercel link
   ```

3. **Configure Environment Variables**
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   vercel env add ENCRYPTION_KEY
   vercel env add ALLOWED_ORIGINS
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Step 3: Render Frontend Setup

1. **Create New Static Site on Render**
   - Connect GitHub repository
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/dist`

2. **Environment Variables**
   ```
   VITE_API_URL=https://your-api.vercel.app
   VITE_WS_URL=wss://your-api.vercel.app
   ```

### Step 4: GitHub Actions Setup

1. **Add Secrets to GitHub**
   ```
   VERCEL_TOKEN
   VERCEL_ORG_ID
   VERCEL_PROJECT_ID_BACKEND
   RENDER_API_KEY
   RENDER_SERVICE_ID
   PRODUCTION_API_URL
   STAGING_API_URL
   PRODUCTION_DATABASE_URL
   STAGING_DATABASE_URL
   ```

2. **Enable Actions**
   - Push to `main` deploys to staging
   - Push to `production` deploys to production

## 🔄 Alternative: Full Render Deployment

If you prefer not to use Vercel (for WebSocket support):

### Backend on Render

1. **Create Web Service**
   ```yaml
   # render.yaml backend section
   - type: web
     name: claude-clone-api
     env: node
     buildCommand: cd server && npm install && npm run build
     startCommand: cd server && npm start
   ```

2. **Configure for WebSockets**
   - Render supports WebSockets natively
   - No serverless limitations

### Database on Render

1. **Create PostgreSQL Database**
   - Automatic backups
   - Connection pooling included

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
1. Vercel doesn't support WebSockets
2. Use polling fallback or Render
3. Check `VITE_WS_URL` configuration

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