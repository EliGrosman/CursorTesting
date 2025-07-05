# 🚀 Render Quick Deployment Guide

Deploy Claude Clone to Render in 5 minutes with full WebSocket support!

## Prerequisites

- GitHub account with forked/cloned repository
- Render account (free tier works)
- Anthropic API key (optional - users can add their own)

## Step 1: Deploy with Blueprint (Easiest)

1. **Push render.yaml to your repo**
   ```bash
   git add render.yaml
   git commit -m "Add Render blueprint"
   git push
   ```

2. **Create Blueprint on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repo
   - Select branch (main)
   - Click "Apply"

3. **Wait for Services to Deploy**
   - Database (5-10 minutes)
   - Backend (3-5 minutes)
   - Frontend (2-3 minutes)

## Step 2: Configure Environment

1. **Update Frontend Environment**
   - Go to Frontend service → Environment
   - Update `VITE_API_URL` with your backend URL
   - Update `VITE_WS_URL` with `wss://your-backend-url`

2. **Update Backend Environment**
   - Update `ALLOWED_ORIGINS` with your frontend URL
   - Optionally add `ANTHROPIC_API_KEY` for system-wide access

## Step 3: Run Database Migrations

1. **Connect to Database**
   ```bash
   # Get connection string from Render dashboard
   psql $DATABASE_URL < server/src/db/schema.sql
   ```

2. **Or Use Render Shell**
   - Go to Backend service → Shell
   - Run: `cd server && npm run db:migrate`

## Step 4: Test Your Deployment

1. **Visit Frontend URL**
   - Should see login page
   - Register a new account

2. **Add Your API Key**
   - Go to Settings
   - Add Anthropic API key
   - Start chatting!

## 🎯 Quick Tips

### Custom Domain
1. Go to service Settings
2. Add custom domain
3. Render handles SSL automatically

### Environment Variables
```bash
# Backend (Required)
DATABASE_URL         # Auto-set by Render
JWT_SECRET          # Auto-generated
ENCRYPTION_KEY      # Auto-generated
ALLOWED_ORIGINS     # Your frontend URL

# Frontend
VITE_API_URL        # https://your-backend.onrender.com
VITE_WS_URL         # wss://your-backend.onrender.com
```

### Monitoring
- Check service logs for errors
- Use `/api/health` endpoint
- Monitor database connections

## 🔧 Troubleshooting

### "No API Key" Error
- Users must add their own Anthropic API key
- Or set system `ANTHROPIC_API_KEY` in backend env

### CORS Errors
- Ensure `ALLOWED_ORIGINS` includes frontend URL
- Include protocol (https://)
- No trailing slash

### WebSocket Not Connecting
- Use `wss://` not `ws://` for HTTPS
- Check browser console for errors
- Verify backend is running

## 📊 Costs (Render Free Tier)

- **Database**: Free (90 days, then $7/month)
- **Backend**: Free (spins down after 15 min)
- **Frontend**: Free (unlimited)
- **Limitations**: 
  - Backend sleeps when inactive
  - First request after sleep is slow
  - Upgrade to Starter ($7/month) for always-on

## 🚀 Next Steps

1. **Set up CI/CD**
   - Add GitHub secrets
   - Enable Actions
   - Auto-deploy on push

2. **Configure Monitoring**
   - Enable Render metrics
   - Set up error alerts
   - Monitor usage

3. **Scale as Needed**
   - Upgrade to paid tier
   - Add more instances
   - Enable auto-scaling

## 📚 Resources

- [Render Docs](https://render.com/docs)
- [render.yaml Reference](https://render.com/docs/blueprint-spec)
- [PostgreSQL on Render](https://render.com/docs/databases)

---

🎉 **That's it!** You now have a fully functional Claude Clone with:
- ✅ User authentication
- ✅ Encrypted API keys
- ✅ WebSocket streaming
- ✅ Folder organization
- ✅ Claude 4 support
- ✅ PWA capabilities