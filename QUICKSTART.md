# Quick Start Guide

## For Hackathon Demo - Get Running in 10 Minutes

### Step 1: Install Dependencies (2 min)

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Wallets (3 min)

#### Option A: Use Your Existing Testnet Wallets

Edit `backend/.env`:

```bash
# Your Sepolia wallet private key (will be the escrow wallet)
ETH_PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# Infura or Alchemy Sepolia RPC
ETH_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Your PreProd ADA address (escrow address)
CARDANO_ADDRESS=addr_test1...

# Blockfrost PreProd API key
CARDANO_BLOCKFROST_KEY=preprodXXXXXXXX
```

#### Option B: Quick Test Setup (No Real Blockchain)

For testing the UI only without blockchain integration:

Edit `backend/.env`:
```bash
ETH_PRIVATE_KEY=0x1234567890123456789012345678901234567890123456789012345678901234
ETH_RPC_URL=https://sepolia.infura.io/v3/demo
CARDANO_ADDRESS=addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer
CARDANO_BLOCKFROST_KEY=demo
```

The UI will work but swaps won't execute on real blockchains.

### Step 3: Get Testnet Funds (5 min)

**Sepolia ETH:**
- https://sepoliafaucet.com/
- https://www.infura.io/faucet/sepolia

**PreProd ADA:**
- https://docs.cardano.org/cardano-testnets/tools/faucet/

Fund the addresses you configured in `.env`

### Step 4: Run the App

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Open Browser:**
```bash
open http://localhost:3000
```

## Testing the Swap

### Test ADA → ETH Swap

1. Select "ADA to ETH" direction
2. Enter amount: `100` ADA
3. Enter your Sepolia ETH address (where you want to receive)
4. Click "Continue"
5. You'll see a QR code and PreProd ADA address
6. Send 100 ADA to that address
7. Wait for confirmation (~20 seconds on PreProd)
8. ETH will be automatically sent to your address

### Test ETH → ADA Swap

1. Select "ETH to ADA" direction
2. Enter amount: `0.05` ETH
3. Enter your PreProd ADA address
4. Click "Continue"
5. Send 0.05 ETH to the shown Sepolia address
6. Wait for confirmation (~12 seconds on Sepolia)
7. ADA will be sent to your address

## Troubleshooting

### Backend not starting?
- Check if port 3001 is available
- Verify `.env` file exists in `backend/`
- Check Node.js version: `node --version` (needs 18+)

### Frontend not starting?
- Check if port 3000 is available
- Try deleting `frontend/.next` and restart

### Orders stuck in "pending"?
- Backend may not have funds to complete swaps
- Check backend console logs for errors
- Verify RPC URLs are correct

### "Failed to create order"?
- Ensure backend is running on port 3001
- Check browser console for CORS errors

## Demo Tips

1. **Pre-create wallets**: Have testnet wallets ready before demo
2. **Pre-fund escrow**: Make sure your escrow addresses have funds
3. **Test beforehand**: Do a full swap test before presenting
4. **Show QR codes**: Use phone to scan QR codes in demo
5. **Monitor logs**: Keep backend terminal visible to show real-time processing

## Architecture Overview

```
User Browser
    ↓
Next.js Frontend (localhost:3000)
    ↓ HTTP
Express Backend (localhost:3001)
    ↓
SQLite Database
    ↓
Chain Monitors → Sepolia + PreProd
    ↓
Execute Swaps
```

## Key Files

- `frontend/app/page.tsx` - Main swap form
- `frontend/app/order/[id]/page.tsx` - Order tracking page
- `backend/src/index.ts` - API server & chain monitoring
- `backend/src/db.ts` - Database operations
- `backend/.env` - Configuration (private keys, etc.)

## For Presentation

**Talking Points:**
- Simple fixed-rate swap (no complex AMM math)
- QR codes for mobile-friendly deposits
- Real-time status tracking
- Automatic execution via chain monitoring
- Works on testnets for safe demo

**What to Show:**
1. Clean, simple UI
2. Instant QR code generation
3. Real-time order status updates
4. Actual blockchain transactions (if time permits)
5. Both swap directions working

Good luck with your hackathon! 🚀
