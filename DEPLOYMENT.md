# DigitalOcean Deployment Guide

Complete guide to deploy the ADA ⇄ ETH swap platform to DigitalOcean.

## 📋 Prerequisites

- DigitalOcean account
- Domain name (optional but recommended)
- Your `.env` variables ready
- GitHub account (for code deployment)

## 🚀 Step 1: Create Droplet

1. **Go to DigitalOcean Dashboard**
   - https://cloud.digitalocean.com/

2. **Create → Droplets**

3. **Choose Configuration:**
   - **Image:** Ubuntu 24.04 LTS
   - **Plan:** Basic
   - **CPU Options:** Regular (1GB RAM / $6/mo)
   - **Datacenter:** Choose closest to your users
   - **Authentication:** SSH key (recommended) or Password
   - **Hostname:** `crypto-swap` or your choice

4. **Create Droplet** and wait ~60 seconds

5. **Note your Droplet IP:** `165.227.xxx.xxx`

## 🔧 Step 2: Initial Server Setup

SSH into your droplet:

```bash
ssh root@YOUR_DROPLET_IP
```

### Update System

```bash
apt update && apt upgrade -y
```

### Install Node.js 18+

```bash
# Install Node.js 24.x LTS
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v24.x
npm --version
```

### Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### Install Nginx (Reverse Proxy)

```bash
apt install -y nginx
```

### Setup Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## 📦 Step 3: Deploy Your Code

### Option A: Deploy from GitHub (Recommended)

1. **Push your code to GitHub** (on your local machine):

```bash
# Initialize git if not done
cd /home/os11k/crypto-swap
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/crypto-swap.git
git push -u origin main
```

2. **Clone on server:**

```bash
cd /home
git clone https://github.com/YOUR_USERNAME/crypto-swap.git
cd crypto-swap
```

### Option B: Upload via SCP (Quick method)

On your local machine:

```bash
# Compress the project
cd /home/os11k
tar -czf crypto-swap.tar.gz crypto-swap/ \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='*.db' \
  --exclude='.git'

# Upload to server
scp crypto-swap.tar.gz root@YOUR_DROPLET_IP:/home/

# On server, extract:
ssh root@YOUR_DROPLET_IP
cd /home
tar -xzf crypto-swap.tar.gz
```

## 🔐 Step 4: Configure Environment Variables

```bash
cd /home/crypto-swap/backend

# Create .env file
nano .env
```

Paste your environment variables:

```env
# Ethereum (Sepolia Testnet)
ETH_RPC_URL=https://eth-sepolia.api.onfinality.io/rpc?apikey=YOUR_KEY
ETH_PRIVATE_KEY=0xYOUR_ETHEREUM_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# Cardano (PreProd Testnet)
CARDANO_BLOCKFROST_KEY=preprodYOUR_KEY
CARDANO_ADDRESS=addr_test1...
CARDANO_PRIVATE_KEY=ed25519e_sk1...
```

Save with `Ctrl+X`, `Y`, `Enter`

## 📦 Step 5: Install Dependencies & Build

### Backend

```bash
cd /home/crypto-swap/backend
npm install --production
```

### Frontend

```bash
cd /home/crypto-swap/frontend
npm install
npm run build  # This creates optimized production build
```

## 🚀 Step 6: Start Services with PM2

### Start Backend

```bash
cd /home/crypto-swap/backend

# Start with PM2
pm2 start npm --name "crypto-swap-backend" -- start

# Or if using tsx:
pm2 start "npx tsx src/index.ts" --name "crypto-swap-backend"
```

### Start Frontend

```bash
cd /home/crypto-swap/frontend

# Start Next.js in production mode
pm2 start npm --name "crypto-swap-frontend" -- start
```

### Configure PM2 to start on reboot

```bash
pm2 startup systemd
pm2 save
```

### Check services are running

```bash
pm2 list
pm2 logs
```

## 🌐 Step 7: Configure Nginx Reverse Proxy

```bash
nano /etc/nginx/sites-available/crypto-swap
```

Paste this configuration:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;  # or use IP: YOUR_DROPLET_IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # or YOUR_DROPLET_IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**If you don't have a domain**, use just the IP:

```nginx
server {
    listen 80;
    server_name YOUR_DROPLET_IP;

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
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/crypto-swap /etc/nginx/sites-enabled/
nginx -t  # Test configuration
systemctl restart nginx
```

## 🔒 Step 8: SSL Certificate (Optional - for domains)

If you have a domain:

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
```

## 🎯 Step 9: Update Frontend API URL

Since frontend is now on a different server, update the API URL:

```bash
cd /home/crypto-swap/frontend

# Create production environment variable
nano .env.production.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://YOUR_DROPLET_IP:3001
# Or if using domain: https://api.yourdomain.com
```

Rebuild and restart:

```bash
npm run build
pm2 restart crypto-swap-frontend
```

**OR** update the code to use relative paths if using single domain setup.

## ✅ Step 10: Verify Deployment

1. **Check services:**
```bash
pm2 list
pm2 logs crypto-swap-backend
pm2 logs crypto-swap-frontend
```

2. **Test backend:**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok"}
```

3. **Test frontend:**
```bash
curl http://localhost:3000
# Should return HTML
```

4. **Access from browser:**
   - Frontend: `http://YOUR_DROPLET_IP`
   - Backend: `http://YOUR_DROPLET_IP/api/exchange-rate`

## 🔍 Troubleshooting

### Check logs

```bash
# PM2 logs
pm2 logs

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# System logs
journalctl -u nginx -f
```

### Service not starting

```bash
# Check if ports are in use
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# Restart services
pm2 restart all
systemctl restart nginx
```

### Out of memory

```bash
# Check memory
free -h

# If needed, create swap
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Frontend can't reach backend

Update frontend code to use environment variable:

```typescript
// Instead of: http://localhost:3001
// Use:
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
fetch(`${API_URL}/api/orders`, ...)
```

## 🔄 Updating Your Code

When you make changes:

```bash
# On server
cd /home/crypto-swap
git pull origin main

# Rebuild frontend
cd frontend
npm run build
pm2 restart crypto-swap-frontend

# Restart backend (if changed)
pm2 restart crypto-swap-backend
```

## 📊 Monitoring

```bash
# PM2 monitoring
pm2 monit

# Check resource usage
htop

# Setup monitoring dashboard (optional)
pm2 install pm2-server-monit
```

## 🎉 Done!

Your swap platform is now live at:
- **Frontend:** `http://YOUR_DROPLET_IP`
- **Backend API:** `http://YOUR_DROPLET_IP:3001` (or `/api` if using nginx routing)

## 📝 Quick Reference Commands

```bash
# Start services
pm2 start all

# Stop services
pm2 stop all

# Restart services
pm2 restart all

# View logs
pm2 logs

# Check status
pm2 list

# Restart Nginx
systemctl restart nginx

# Check Nginx status
systemctl status nginx
```

## 🆘 Emergency Commands

```bash
# Kill all Node processes
pkill -9 node

# Restart everything
pm2 delete all
cd /home/crypto-swap/backend && pm2 start "npx tsx src/index.ts" --name backend
cd /home/crypto-swap/frontend && pm2 start npm --name frontend -- start
systemctl restart nginx
```

---

**Need help?** Check logs with `pm2 logs` and `tail -f /var/log/nginx/error.log`
