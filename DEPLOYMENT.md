# Deployment Guide

Quick deployment guide for hackathon demo.

## Option 1: Deploy to Vercel (Frontend) + Railway (Backend)

### Frontend - Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/crypto-swap.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Set root directory: `frontend`
   - Click "Deploy"

3. **Update API URL:**
   After backend is deployed, update frontend to use production backend URL:

   Create `frontend/.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```

   Update API calls in frontend to use:
   ```javascript
   const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
   fetch(`${apiUrl}/api/orders`, ...)
   ```

### Backend - Railway

1. **Go to Railway:**
   - Visit https://railway.app
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Set root directory: `backend`

2. **Configure Environment Variables:**
   In Railway dashboard, add:
   ```
   ETH_PRIVATE_KEY=your_sepolia_private_key
   ETH_RPC_URL=https://sepolia.infura.io/v3/your_key
   CARDANO_ADDRESS=addr_test1...
   CARDANO_BLOCKFROST_KEY=preprod...
   ```

3. **Configure Start Command:**
   - Settings → Start Command: `npm start`
   - Or add to package.json: `"start": "tsx src/index.ts"`

4. **Get Public URL:**
   - Railway will give you a public URL like `https://crypto-swap-production.up.railway.app`
   - Copy this URL

5. **Update Vercel Frontend:**
   - In Vercel dashboard → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`
   - Redeploy frontend

## Option 2: Deploy to Render (Both)

### Backend - Render

1. **Create Web Service:**
   - Go to https://render.com
   - New → Web Service
   - Connect GitHub repo
   - Settings:
     - Name: crypto-swap-backend
     - Root Directory: `backend`
     - Build Command: `npm install`
     - Start Command: `npm start`

2. **Environment Variables:**
   Add all variables from `.env`

3. **Deploy**

### Frontend - Render

1. **Create Static Site:**
   - New → Static Site
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Publish Directory: `.next`

2. **Environment Variable:**
   - Add `NEXT_PUBLIC_API_URL` with backend URL

## Option 3: Deploy to DigitalOcean App Platform

1. **Create App:**
   - Go to DigitalOcean → Apps
   - Create App from GitHub
   - Detect both components (frontend + backend)

2. **Configure Backend:**
   - Type: Web Service
   - Run Command: `npm start`
   - Environment variables from `.env`

3. **Configure Frontend:**
   - Type: Static Site
   - Build Command: `npm run build`
   - Output Directory: `.next`

## Option 4: Quick VPS Deployment

If you have a VPS (DigitalOcean Droplet, AWS EC2, etc.):

```bash
# SSH into VPS
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone https://github.com/yourusername/crypto-swap.git
cd crypto-swap

# Setup backend
cd backend
npm install
nano .env  # Add your environment variables
npm install -g pm2
pm2 start src/index.ts --name crypto-swap-backend --interpreter tsx
pm2 save
pm2 startup

# Setup frontend
cd ../frontend
npm install
npm run build
pm2 start npm --name crypto-swap-frontend -- start
pm2 save

# Setup Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/crypto-swap
```

Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/crypto-swap /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## CORS Configuration for Production

Update `backend/src/index.ts`:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

Add to backend environment variables:
```
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## Pre-Deployment Checklist

- [ ] All environment variables documented
- [ ] `.env` added to `.gitignore` (never commit secrets!)
- [ ] Database persistence configured (SQLite file on volume)
- [ ] Error handling tested
- [ ] CORS properly configured
- [ ] API URLs point to production backend
- [ ] Escrow wallets funded with testnet tokens
- [ ] Test a full swap on production
- [ ] Monitoring/logging enabled

## Database Persistence

**Important:** SQLite database needs to persist between deployments.

### Railway:
- Add a volume mount for `backend/swap.db`
- Settings → Volumes → Mount path: `/app/backend`

### Render:
- Add disk storage
- Mount path: `/opt/render/project/src/backend`

### Alternative: Use PostgreSQL
For production, consider switching to PostgreSQL:

```bash
# Railway/Render provide free PostgreSQL
# Update db.ts to use pg instead of better-sqlite3
```

## Monitoring

### Simple Health Checks

Add to backend:
```typescript
app.get('/api/stats', (req, res) => {
  const stmt = db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status');
  const stats = stmt.all();
  res.json({ stats });
});
```

### Logging

Use a service like:
- LogTail
- Papertrail
- Datadog

Railway/Render have built-in logging.

## Cost Estimate (Free Tier)

- **Vercel:** Free (Frontend)
- **Railway:** $5/month or free trial (Backend)
- **Render:** Free tier available (slower)
- **DigitalOcean:** $5/month droplet
- **Infura:** Free (up to 100k requests/day)
- **Blockfrost:** Free tier available

**Total for hackathon:** $0-5/month

## Quick Deploy Script

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deploying to production..."

# Build frontend
cd frontend
npm run build
echo "✅ Frontend built"

# Test backend
cd ../backend
npm run start &
BACKEND_PID=$!
sleep 5

# Test health endpoint
curl http://localhost:3001/health
if [ $? -eq 0 ]; then
    echo "✅ Backend healthy"
else
    echo "❌ Backend not responding"
    kill $BACKEND_PID
    exit 1
fi

kill $BACKEND_PID

echo "✅ Ready to deploy!"
echo "Next steps:"
echo "1. Push to GitHub"
echo "2. Deploy frontend to Vercel"
echo "3. Deploy backend to Railway"
echo "4. Update environment variables"
echo "5. Test production swap"
```

## Troubleshooting Deployment

### Backend won't start
- Check build logs for missing dependencies
- Verify Node.js version (18+)
- Check environment variables are set
- Look for port conflicts

### Frontend shows API errors
- Verify `NEXT_PUBLIC_API_URL` is set
- Check CORS configuration
- Inspect network tab in browser DevTools
- Verify backend is accessible

### Database errors
- Ensure write permissions for SQLite file
- Check volume/disk is mounted
- Verify database file path in code

## Post-Deployment Testing

```bash
# Test health
curl https://your-backend.railway.app/health

# Create test order
curl -X POST https://your-backend.railway.app/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "direction": "ADA_TO_ETH",
    "amount": 10,
    "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8"
  }'

# Get order
curl https://your-backend.railway.app/api/orders/ORDER_ID
```

## For Demo Day

1. **Deploy day before:** Don't deploy right before presenting
2. **Test thoroughly:** Run full swaps on production
3. **Have fallback:** Keep localhost version ready
4. **Monitor during demo:** Watch backend logs
5. **Share URL:** Give judges/attendees the link

Good luck with your deployment! 🚀
