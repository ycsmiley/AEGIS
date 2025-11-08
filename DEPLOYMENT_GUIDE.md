# 🚀 Aegis Finance Deployment Guide

Complete guide to deploy Aegis Finance platform using Vercel (frontend) + Render (backend) with **free tiers**.

---

## 📋 Prerequisites

- GitHub account with your Aegis Finance repository
- Vercel account (free): https://vercel.com/signup
- Render account (free): https://render.com/register
- Environment variables ready (see [Environment Setup](#environment-setup))

---

## 🎯 Deployment Architecture

```
┌─────────────────────────────────────┐
│  Vercel (Frontend)                  │
│  • Next.js app                      │
│  • Auto-deploy from GitHub          │
│  • Free tier: Unlimited bandwidth   │
│  • URL: *.vercel.app                │
└─────────────────────────────────────┘
              ↓ API calls
┌─────────────────────────────────────┐
│  Render (Backend)                   │
│  • NestJS API server                │
│  • Mistral AI integration           │
│  • Free tier: 750hrs/month          │
│  • URL: *.onrender.com              │
│  ⚠️  Sleeps after 15min idle        │
└─────────────────────────────────────┘
              ↓ Database
┌─────────────────────────────────────┐
│  Supabase (Database)                │
│  • PostgreSQL + Realtime            │
│  • Free tier: 500MB storage         │
│  • URL: *.supabase.co               │
└─────────────────────────────────────┘
```

---

## 🔐 Environment Setup

### 1. Prepare Environment Variables

You'll need these values ready before deploying:

#### Supabase (Get from https://supabase.com/dashboard/project/_/settings/api)
- `SUPABASE_URL`: Your project URL
- `SUPABASE_ANON_KEY`: Public anon key (frontend)
- `SUPABASE_SERVICE_KEY`: Service role key (backend only)

#### WalletConnect (Get from https://cloud.walletconnect.com/)
- `WALLET_CONNECT_PROJECT_ID`: Your project ID

#### Mistral AI (Get from https://console.mistral.ai/)
- `MISTRAL_API_KEY`: Your API key

#### Arc Blockchain (Already configured)
- Contract: `0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C`
- RPC: `https://rpc.testnet.arc.network`
- Chain ID: `5042002`

#### Aegis Server Wallet
- `SERVER_WALLET_PRIVATE_KEY`: Generate a new wallet for production
- `AEGIS_SERVER_WALLET`: The corresponding public address

---

## 🎨 Step 1: Deploy Frontend to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Click "Import Project"

2. **Connect GitHub Repository**
   - Select your `new_arc_project` repository
   - Click "Import"

3. **Configure Project Settings**
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build (auto-detected)
   Output Directory: .next (auto-detected)
   Install Command: npm install (auto-detected)
   ```

4. **Add Environment Variables**

   Click "Environment Variables" and add:

   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

   # WalletConnect
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

   # Arc Contract
   NEXT_PUBLIC_ARC_CONTRACT_ADDRESS=0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C
   NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
   NEXT_PUBLIC_ARC_CHAIN_ID=5042002

   # Backend API (will update after backend deployment)
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```

   **Note**: Leave `NEXT_PUBLIC_API_URL` as placeholder for now, we'll update it after backend deployment.

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your frontend will be live at: `https://your-project.vercel.app`

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (from project root)
cd /home/user/new_arc_project
vercel --cwd frontend

# Follow the prompts
```

---

## 🔧 Step 2: Deploy Backend to Render

### Option A: Via Render Dashboard (Recommended)

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/
   - Click "New +" → "Web Service"

2. **Connect GitHub Repository**
   - Click "Connect account" to link GitHub
   - Select your `new_arc_project` repository
   - Click "Connect"

3. **Configure Service**
   ```
   Name: aegis-finance-backend
   Region: Oregon (or closest to your users)
   Branch: main (or your deployment branch)
   Root Directory: backend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm run start:prod
   ```

4. **Select Plan**
   - Choose "Free" plan
   - Note: Service will sleep after 15 minutes of inactivity

5. **Add Environment Variables**

   Click "Environment" tab and add:

   ```bash
   # Server
   NODE_ENV=production
   PORT=3001

   # Frontend URL (your Vercel URL from Step 1)
   FRONTEND_URL=https://your-project.vercel.app

   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key

   # JWT Secret (click "Generate" button)
   JWT_SECRET=auto_generated_secure_value

   # Aegis Server Wallet
   SERVER_WALLET_PRIVATE_KEY=0x...your_private_key
   AEGIS_SERVER_WALLET=0x...your_public_address

   # Arc Blockchain
   ARC_RPC_URL=https://rpc.testnet.arc.network
   ARC_CONTRACT_ADDRESS=0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C
   ARC_CHAIN_ID=5042002

   # Mistral AI
   MISTRAL_API_KEY=your_mistral_api_key
   ```

   ⚠️ **Security**: Never commit these values to Git!

6. **Create Web Service**
   - Click "Create Web Service"
   - Wait 5-10 minutes for first deployment
   - Your backend will be live at: `https://aegis-finance-backend.onrender.com`

7. **Test Backend**
   ```bash
   curl https://aegis-finance-backend.onrender.com/api/health
   ```

   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-11-08T...",
     "service": "Aegis Finance Backend",
     "version": "1.0.0"
   }
   ```

### Option B: Using render.yaml Blueprint

1. **Push render.yaml to GitHub**
   ```bash
   git add render.yaml
   git commit -m "Add Render deployment config"
   git push
   ```

2. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/
   - Click "New +" → "Blueprint"
   - Select your repository
   - Render will auto-detect `render.yaml`
   - Review settings and click "Apply"

---

## 🔄 Step 3: Connect Frontend to Backend

1. **Get Backend URL**
   - From Render dashboard, copy your service URL
   - Example: `https://aegis-finance-backend.onrender.com`

2. **Update Vercel Environment Variable**
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Edit `NEXT_PUBLIC_API_URL` variable
   - Set value to your Render backend URL
   - Example: `https://aegis-finance-backend.onrender.com`
   - Click "Save"

3. **Redeploy Frontend**
   - Go to Deployments tab
   - Click "..." on latest deployment → "Redeploy"
   - OR: Just push to GitHub to trigger auto-deploy

4. **Test End-to-End**
   - Visit your Vercel URL
   - Try connecting wallet
   - Check browser console for API calls
   - Should see successful API responses from Render backend

---

## ⚡ Step 4: Prevent Backend Sleep (Free Tier)

Render's free tier sleeps after 15 minutes of inactivity, causing 30-60 second cold starts.

### Solution: Use a Free Ping Service

#### Option A: cron-job.org (Recommended)

1. **Create Account**
   - Go to: https://cron-job.org/en/
   - Sign up for free account

2. **Create Cronjob**
   - Click "Create cronjob"
   - Title: `Keep Aegis Backend Alive`
   - URL: `https://your-backend.onrender.com/api/health`
   - Schedule: Every 10 minutes
   - Click "Create cronjob"

3. **Verify**
   - Job will ping your backend every 10 minutes
   - Backend stays warm and responsive

#### Option B: UptimeRobot

1. **Create Account**
   - Go to: https://uptimerobot.com/
   - Sign up for free account

2. **Add Monitor**
   - Click "+ Add New Monitor"
   - Monitor Type: HTTP(s)
   - Friendly Name: `Aegis Backend`
   - URL: `https://your-backend.onrender.com/api/health`
   - Monitoring Interval: 5 minutes
   - Click "Create Monitor"

#### Option C: Self-hosted (GitHub Actions)

Create `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Backend Alive

on:
  schedule:
    # Run every 10 minutes
    - cron: '*/10 * * * *'
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping backend
        run: |
          curl https://your-backend.onrender.com/api/health
```

---

## 🧪 Step 5: Verify Deployment

### Frontend Checks

1. **Visit your Vercel URL**
   ```
   https://your-project.vercel.app
   ```

2. **Check Console (F12)**
   - No CORS errors
   - API calls succeed
   - Wallet connection works

3. **Test Pages**
   - `/` - Homepage loads
   - `/supplier` - Supplier dashboard
   - `/buyer` - Buyer dashboard
   - `/lp` - LP dashboard

### Backend Checks

1. **Health Check**
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```

2. **API Documentation**
   ```bash
   curl https://your-backend.onrender.com/api/docs
   ```

3. **Check Logs**
   - Go to Render dashboard
   - Click on your service
   - View "Logs" tab
   - Look for startup messages and errors

### End-to-End Test

1. **LP Deposits**
   - Go to `/lp`
   - Connect wallet
   - Deposit 100 USDC
   - Verify transaction on Arc Explorer

2. **Create Invoice**
   - Go to `/supplier`
   - Create test invoice
   - Check if AI pricing works
   - Verify invoice appears in list

3. **Approve Invoice**
   - Go to `/buyer`
   - See pending invoice
   - Approve it
   - Check signature generation

4. **Withdraw Financing**
   - Back to `/supplier`
   - Click withdraw
   - Verify funds received

---

## 🔍 Troubleshooting

### Frontend Issues

**Build Fails**
```bash
# Check build logs in Vercel dashboard
# Common issues:
# 1. Missing environment variables
# 2. TypeScript errors
# 3. Missing dependencies
```

**CORS Errors**
```bash
# 1. Verify FRONTEND_URL in Render matches Vercel URL exactly
# 2. Check browser console for exact error
# 3. Verify backend CORS config in backend/src/main.ts
```

**API Calls Fail**
```bash
# 1. Check NEXT_PUBLIC_API_URL is set correctly
# 2. Verify backend is running (check health endpoint)
# 3. Check network tab in browser dev tools
```

### Backend Issues

**Backend Won't Start**
```bash
# 1. Check Render logs for errors
# 2. Verify all required env vars are set
# 3. Check if build command succeeded
```

**Mistral AI Errors**
```bash
# 1. Verify MISTRAL_API_KEY is valid
# 2. Check API quota/limits
# 3. Backend should fallback to rule-based pricing if AI fails
```

**Database Errors**
```bash
# 1. Verify SUPABASE_URL and SUPABASE_SERVICE_KEY
# 2. Check Supabase dashboard for errors
# 3. Verify database tables exist (run migrations)
```

**Wallet Signing Errors**
```bash
# 1. Verify SERVER_WALLET_PRIVATE_KEY is valid
# 2. Check wallet has no leading/trailing spaces
# 3. Ensure private key starts with 0x
```

### Performance Issues

**Backend is Slow (First Request)**
```bash
# This is normal for free tier
# Solution: Set up keep-alive pings (see Step 4)
```

**High Latency**
```bash
# 1. Choose Render region closest to users
# 2. Consider upgrading to paid tier ($7/mo removes sleep)
# 3. Optimize API responses (add caching)
```

---

## 💰 Cost Breakdown

### Free Tier (Current Setup)

| Service | Cost | Limits |
|---------|------|--------|
| Vercel | $0 | 100GB bandwidth, unlimited sites |
| Render | $0 | 750hrs/month, sleeps after 15min |
| Supabase | $0 | 500MB storage, 50K MAU |
| **Total** | **$0/month** | Good for demos/testing |

### Paid Tier (Production Ready)

| Service | Cost | Benefits |
|---------|------|----------|
| Vercel Pro | $20/mo | More bandwidth, analytics |
| Render | $7/mo | No sleep, better performance |
| Supabase | $0-25/mo | More storage if needed |
| **Total** | **$27-52/month** | Production ready |

---

## 🔄 CI/CD Setup

Both Vercel and Render auto-deploy on git push:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Automatic:
# 1. Vercel rebuilds frontend (~2 min)
# 2. Render rebuilds backend (~5 min)
# 3. Both go live automatically
```

### Configure Auto-Deploy Branches

**Vercel**:
- Settings → Git → Production Branch: `main`
- Enable preview deployments for PRs

**Render**:
- Service Settings → Branch: `main`
- Enable auto-deploy on push

---

## 📊 Monitoring

### Vercel Analytics (Free)

- Dashboard → Your Project → Analytics
- See visitor stats, performance metrics

### Render Metrics (Free)

- Service → Metrics tab
- See CPU, Memory, Response times

### Custom Monitoring

Add to backend for custom alerts:

```typescript
// backend/src/main.ts
import { Logger } from '@nestjs/common';

const logger = new Logger('Bootstrap');

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  // Send to monitoring service (e.g., Sentry)
});
```

---

## 🔐 Security Checklist

Before going to production:

- [ ] Change all default secrets and keys
- [ ] Use environment variables for ALL sensitive data
- [ ] Enable HTTPS only (both platforms do this by default)
- [ ] Set up proper CORS (already configured)
- [ ] Review and limit Supabase Row Level Security policies
- [ ] Never commit `.env` files to Git
- [ ] Use separate wallets for testnet vs mainnet
- [ ] Set up monitoring and alerts
- [ ] Regular security audits of smart contracts
- [ ] Keep dependencies updated

---

## 📚 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Arc Network**: https://docs.arc.network
- **Mistral AI**: https://docs.mistral.ai

---

## 🆘 Support

If you encounter issues:

1. Check deployment logs (Vercel & Render dashboards)
2. Review this guide's Troubleshooting section
3. Test locally first: `npm run dev` (frontend) + `npm run start:dev` (backend)
4. Verify all environment variables are set correctly
5. Check service status pages:
   - https://www.vercel-status.com/
   - https://www.renderstatus.com/
   - https://status.supabase.com/

---

## ✅ Deployment Complete!

Your Aegis Finance platform is now live:

- 🎨 Frontend: `https://your-project.vercel.app`
- 🔧 Backend: `https://your-backend.onrender.com`
- 📊 Backend Health: `https://your-backend.onrender.com/api/health`
- 📖 API Docs: `https://your-backend.onrender.com/api/docs`

**Next Steps:**
1. Test all user flows (LP, Supplier, Buyer)
2. Set up keep-alive ping (Step 4)
3. Monitor logs for errors
4. Share with users and gather feedback
5. Consider upgrading to paid tiers for production

Good luck with your deployment! 🚀
