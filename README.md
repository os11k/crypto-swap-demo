# ADA ⇄ ETH Crypto Swap Platform

A fully functional cryptocurrency swap platform for exchanging PreProd ADA and Sepolia ETH testnets. Built for hackathon demonstration with **real blockchain transactions** on both chains.

## 🎯 Features

- 🔄 **Bidirectional Swaps:** ADA→ETH and ETH→ADA
- 💱 **Fixed Exchange Rate:** 1 ADA = 0.0005 ETH
- 🔗 **Real Blockchain Transactions:** Actual on-chain swaps on Cardano PreProd and Ethereum Sepolia
- 📱 **QR Code Generation:** Easy deposits via wallet scanning
- ⏱️ **30-Minute Order Expiry:** Automatic cleanup of stale orders
- 📊 **Real-Time Tracking:** Live order status updates every 5 seconds
- 🔒 **Race Condition Protection:** Atomic database locks prevent double payments
- 🎨 **Modern UI:** Clean Next.js interface with Tailwind CSS
- 🚀 **Automatic Execution:** Backend monitors chains and executes swaps automatically

## 🏗️ Architecture

**Frontend:** Next.js 15 + TypeScript + Tailwind CSS
**Backend:** Node.js (ESM) + Express + TypeScript
**Database:** SQLite with atomic transaction locks
**Ethereum:** Ethers.js v6 for Sepolia testnet
**Cardano:** Lucid library for PreProd testnet
**Monitoring:** Blockfrost API for Cardano, Etherscan API V2 for Ethereum

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Sepolia ETH testnet funds
- PreProd ADA testnet funds
- Blockfrost API key (free tier - for Cardano)
- Etherscan API key (free tier - for Ethereum)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from example and fill in your keys)
cp .env.example .env
# Edit .env with your actual API keys and private keys

# Start the backend
npm run dev
```

The backend will run on `http://localhost:3001`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🔧 Configuration Guide

### Get Testnet Funds

**Sepolia ETH:**
- Faucet 1: https://sepoliafaucet.com/
- Faucet 2: https://www.infura.io/faucet/sepolia
- Faucet 3: https://faucet.quicknode.com/ethereum/sepolia

**PreProd ADA:**
- Official Faucet: https://docs.cardano.org/cardano-testnets/tools/faucet/
- Alternative: https://testnets.cardano.org/en/testnets/cardano/tools/faucet/
- Get 10,000 test ADA per request

### Get API Keys

**Blockfrost (for Cardano - Required):**
1. Sign up at https://blockfrost.io/
2. Create a new project
3. Select **"PreProd"** network
4. Copy the API key (starts with `preprod...`)
5. **Note:** Free tier gives 50,000 requests/day (more than enough for hackathon)

**Etherscan (for Ethereum - Required):**
1. Sign up at https://etherscan.io/register
2. Go to API Keys section
3. Create a new API key
4. Copy the API key
5. **Note:** Free tier gives 5 calls/second, 100,000 calls/day (perfect for hackathon)

**OnFinality (for Ethereum RPC - Optional but Recommended):**
1. Sign up at https://onfinality.io/
2. Create a new Ethereum Sepolia endpoint
3. Copy the RPC URL with API key
4. **Note:** Better reliability than public RPC endpoints

### Generate Wallets

**Ethereum Wallet (Sepolia):**

```bash
# Method 1: Using Node.js
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey);"

# Method 2: Using MetaMask
# 1. Install MetaMask browser extension
# 2. Create new wallet or import existing
# 3. Switch to Sepolia testnet
# 4. Export private key (Settings > Security & Privacy > Show Private Key)
```

**Cardano Wallet (PreProd):**

```bash
# Using Eternl Wallet (Recommended):
# 1. Install Eternl browser extension
# 2. Create new wallet (save your 24-word recovery phrase!)
# 3. Switch to PreProd testnet (Settings > Network > PreProd)
# 4. Copy your address from wallet dashboard
# 5. Export private key:
#    - Settings > Wallet > Advanced
#    - Export Wallet > Select JSON format
#    - Find the "cborHex" field for the private key
#
# Alternatively, use the provided derivation script:
cd backend
node derive-cardano-key.js "your 24 word mnemonic phrase here"
```

## 📖 How It Works

### User Flow

1. **Create Order:**
   - User visits the swap interface at `http://localhost:3000`
   - Selects swap direction (ADA→ETH or ETH→ADA)
   - Enters amount to swap (e.g., 100 ADA or 0.05 ETH)
   - Enters recipient address where they want to receive funds
   - Clicks "Create Swap Order"

2. **Deposit Funds:**
   - System generates unique deposit address and QR code
   - User has 30 minutes to send funds to the deposit address
   - User sends exact amount from their wallet
   - Can scan QR code with mobile wallet for easy payment

3. **Automatic Execution:**
   - Backend monitors blockchain every 10 seconds
   - Detects incoming transaction when it appears on-chain
   - Validates amount matches order (±0.1 ADA or ±0.001 ETH tolerance)
   - Validates transaction timestamp (must be after order creation)
   - Atomically marks order as "processing" to prevent double execution
   - Sends output cryptocurrency to recipient address
   - Marks order as "completed" with both transaction hashes

4. **Track Status:**
   - Order page updates every 5 seconds
   - Shows current status: pending → deposited → processing → completed
   - Displays both deposit and output transaction hashes
   - Links to block explorers for verification

### Backend Architecture

```
┌─────────────────┐
│   Frontend      │  Next.js app
│   localhost:3000│  - Swap form UI
└────────┬────────┘  - Order tracking page
         │ HTTP API
┌────────▼────────────────────┐
│   Express Backend           │
│   localhost:3001            │
│                             │
│  ┌─────────────────────┐   │
│  │  API Routes         │   │
│  │  POST /api/orders   │   │
│  │  GET  /api/orders/:id│  │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │  SQLite Database    │   │
│  │  - orders table     │   │
│  │  - Atomic locks     │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │  Chain Monitor      │   │
│  │  (Every 10 seconds) │   │
│  │  1. Expire old orders│  │
│  │  2. Check deposits  │   │
│  │  3. Execute swaps   │   │
│  └─────────────────────┘   │
└─────────┬───────────────────┘
          │
    ┌─────┴──────┐
    │            │
┌───▼────┐  ┌───▼─────┐
│Ethereum│  │ Cardano │
│Sepolia │  │ PreProd │
│        │  │         │
│Ethers.js│ │  Lucid  │
│  RPC   │  │Blockfrost│
└────────┘  └─────────┘
```

### Chain Monitoring Details

The backend runs a monitoring loop every 10 seconds:

**For ADA→ETH Orders:**
1. Queries Blockfrost API for last 10 transactions to ADA escrow address
2. For each transaction:
   - Parses UTXOs to find lovelace amount
   - Converts lovelace to ADA (÷ 1,000,000)
   - Checks if amount matches order (±0.1 ADA tolerance)
   - Validates transaction timestamp > order creation time
   - If match found: marks order as "deposited" using atomic DB lock
3. For orders in "deposited" status:
   - Atomically marks as "processing" (prevents duplicate execution)
   - Sends ETH to recipient using ethers.js
   - Waits for transaction confirmation
   - Marks as "completed" with both tx hashes

**For ETH→ADA Orders:**
1. Queries Etherscan API V2 for all transactions to ETH escrow address (single efficient API call)
2. For each transaction:
   - Checks transaction timestamp > order creation time
   - Checks if destination is ETH escrow address
   - Checks if amount matches order (±0.001 ETH tolerance)
   - If match found: marks order as "deposited" using atomic DB lock
3. For orders in "deposited" status:
   - Atomically marks as "processing" (prevents duplicate execution)
   - Builds Cardano transaction using Lucid
   - Signs with ed25519 private key
   - Submits to Blockfrost
   - Marks as "completed" with both tx hashes

### Race Condition Prevention

The system uses **atomic database operations** to prevent double payments:

```typescript
// Atomic lock when deposit detected
export const markAsDepositedIfPending = (id: string, txHash: string): boolean => {
  const stmt = db.prepare(`
    UPDATE orders SET status = 'deposited', deposit_tx_hash = ?
    WHERE id = ? AND status = 'pending'
  `);
  const result = stmt.run(txHash, id);
  return result.changes > 0; // Only true if row actually updated
};

// Atomic lock when executing swap
export const markAsProcessingIfDeposited = (id: string): boolean => {
  const stmt = db.prepare(`
    UPDATE orders SET status = 'processing'
    WHERE id = ? AND status = 'deposited'
  `);
  return stmt.run(id).changes > 0;
};
```

This ensures:
- Only ONE process can mark order as "deposited"
- Only ONE process can mark order as "processing"
- No double payments even if multiple monitoring loops run concurrently

## 🔌 API Endpoints

### POST `/api/orders`
Create a new swap order

**Request:**
```json
{
  "direction": "ADA_TO_ETH" | "ETH_TO_ADA",
  "amount": 100,
  "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
}
```

**Response:**
```json
{
  "orderId": "ea4d059f-0914-4213-991d-07f00b303992",
  "depositAddress": "addr_test1qqf6m8mxy96nwlnmw5njx5tj27zx4f2vtrxxp4w4n7clvsvht839hxqr0ggl3uw8w690qt380akusdlfgnez8zatm59sr8cpuv",
  "outputAmount": 0.05,
  "expiresAt": 1764427953372
}
```

### GET `/api/orders/:id`
Get order details and current status

**Response:**
```json
{
  "id": "ea4d059f-0914-4213-991d-07f00b303992",
  "direction": "ADA_TO_ETH",
  "amount": 100,
  "recipient_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  "deposit_address": "addr_test1qqf6m8...",
  "status": "completed",
  "output_amount": 0.05,
  "expires_at": 1764427953372,
  "deposit_tx_hash": "afcf8497561065afe1ca623823508753cc580eb575ac8f1d6cfaa18c3ceeac01",
  "output_tx_hash": "0xaa61f3f64aba4cdc8968d5f2ab313a25734eb22e45271c2bc838b038e2467547",
  "created_at": 1764426153372
}
```

**Status Values:**
- `pending` - Waiting for user to send deposit
- `deposited` - Deposit detected, queued for processing
- `processing` - Currently sending output transaction
- `completed` - Swap completed successfully
- `expired` - Order expired (30 minutes passed)
- `failed` - Swap failed (rare, usually due to network issues)

## 🗂️ Project Structure

```
crypto-swap/
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Main swap form UI
│   │   ├── order/[id]/
│   │   │   └── page.tsx          # Order tracking page
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── package.json
│   └── next.config.ts
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server + monitoring loop
│   │   ├── db.ts                 # SQLite database operations
│   │   ├── config.ts             # Configuration loader
│   │   ├── cardano-lucid.ts      # Cardano transaction logic (Lucid)
│   │   ├── cardano.ts            # Old CSL implementation (deprecated)
│   │   ├── cardano-mock.ts       # Mock implementation for testing
│   │   └── cardano-mesh.ts       # Mesh SDK attempt (not used)
│   ├── .env                      # Environment variables (DO NOT COMMIT!)
│   ├── .env.example              # Example env file
│   ├── package.json              # ESM module ("type": "module")
│   ├── swap.db                   # SQLite database file
│   ├── test-send-ada.ts          # Test script for ADA sending
│   └── derive-cardano-key.js     # Utility to derive keys from mnemonic
└── README.md
```

## 🔒 Security & Environment Variables

**IMPORTANT: Never commit your `.env` file to git!**

The `.gitignore` file already includes `.env` to prevent accidental commits.

**Environment Variables (.env):**
- All private keys and API keys are stored in `backend/.env`
- This file is **NOT tracked by git**
- A template is provided in `backend/.env.example`
- Copy `.env.example` to `.env` and fill in your actual keys

**What's Protected:**
- ✅ `ETH_PRIVATE_KEY` - Your Ethereum wallet private key
- ✅ `CARDANO_PRIVATE_KEY` - Your Cardano wallet private key
- ✅ `ETHERSCAN_API_KEY` - Your Etherscan API key
- ✅ `CARDANO_BLOCKFROST_KEY` - Your Blockfrost API key
- ✅ `swap.db` - Database file (also in .gitignore)

**Before Committing:**
```bash
# Verify .env is not staged
git status

# Should NOT see backend/.env in the list
# If you see it, run:
git reset backend/.env
```

## 🧪 Testing

### Manual Testing Flow

1. **Start both services:**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

2. **Test ADA→ETH Swap:**
```bash
# Open browser to http://localhost:3000
# - Select "ADA to ETH"
# - Enter amount: 100
# - Enter your Sepolia ETH address
# - Click "Create Swap Order"
# - Copy the deposit address
# - Send 100 ADA from your PreProd wallet
# - Watch order page for status updates
# - Verify ETH received on Sepolia block explorer
```

3. **Test ETH→ADA Swap:**
```bash
# Open browser to http://localhost:3000
# - Select "ETH to ADA"
# - Enter amount: 0.05
# - Enter your PreProd ADA address
# - Click "Create Swap Order"
# - Send 0.05 ETH from your Sepolia wallet
# - Watch order page for status updates
# - Verify ADA received on Cardano PreProd explorer
```

### Test ADA Sending Directly

```bash
cd backend
npx tsx test-send-ada.ts

# This sends 2 ADA to the configured test address
# Check the transaction on: https://preprod.cardanoscan.io/
```

### Check Database

```bash
cd backend

# View all orders
sqlite3 swap.db "SELECT * FROM orders;"

# View specific order
sqlite3 swap.db "SELECT * FROM orders WHERE id LIKE '377a7fa3%';"

# Count orders by status
sqlite3 swap.db "SELECT status, COUNT(*) FROM orders GROUP BY status;"
```

### Monitor Backend Logs

The backend logs important events:

```
🚀 Crypto Swap Backend running on port 3001
📡 ETH Escrow: 0x3f23Dca25375b682bc9C72156a81B27d94d6DAF7
📡 ADA Escrow: addr_test1qqf6m8mxy96nwlnmw5njx5tj27zx4f2vtrxxp4w4n7clvsvht839hxqr0ggl3uw8w690qt380akusdlfgnez8zatm59sr8cpuv

Checking ADA deposit for order 377a7fa3...
✅ Order marked as deposited
Executing ETH swap for order 377a7fa3...
Sending 0.05 ETH to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0...
✅ ETH swap completed for order 377a7fa3
   Transaction hash: 0xaa61f3f64aba4cdc8968d5f2ab313a25734eb22e45271c2bc838b038e2467547
```

## 🔍 Debugging Guide

### Common Issues

**Backend won't start:**
```bash
# Check if .env file exists
ls -la backend/.env

# Verify .env contents
cat backend/.env

# Check Node version (needs 18+)
node --version

# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
```

**"Invalid secret key" error:**
```bash
# Your Cardano private key format is wrong
# Should be bech32 format starting with: ed25519e_sk1...
# Use the derive-cardano-key.js script to get correct format
```

**Deposits not detected:**
```bash
# Check backend logs for errors
# Verify Blockfrost API key is correct
# Check if transaction timestamp is AFTER order creation
# Verify sent amount matches order amount (within tolerance)

# Test Blockfrost connection:
curl -H "project_id: YOUR_KEY" \
  https://cardano-preprod.blockfrost.io/api/v0/addresses/YOUR_ADDRESS
```

**Double payment issue:**
```bash
# Check database for duplicate transactions
sqlite3 swap.db "SELECT id, status, deposit_tx_hash, output_tx_hash FROM orders WHERE status='completed';"

# Restart backend to reset any stuck processes
pkill -f "npm run dev"
cd backend && npm run dev
```

## ⚠️ Known Limitations (Hackathon Shortcuts)

**This is NOT production-ready code.** Built for hackathon demo purposes with intentional shortcuts:

### Security Issues
- ❌ Private keys stored in plain text `.env` file
- ❌ No encryption at rest or in transit
- ❌ No HSM or secure key management
- ❌ Single-key escrow (should use multi-sig)
- ❌ No rate limiting or DDoS protection
- ❌ No user authentication or authorization

### Transaction Handling
- ❌ Fixed exchange rate (no price oracle integration)
- ❌ No slippage protection
- ❌ Simplified amount matching (uses tolerance instead of exact match)
- ❌ No refund mechanism for failed swaps
- ❌ No partial fill support
- ❌ Deposit and recipient addresses not unique per order (reuses escrow address)

### Scalability
- ❌ SQLite database (single file, no replication)
- ❌ No horizontal scaling support
- ❌ Blocking I/O in monitoring loop
- ❌ No queue system for transaction processing
- ❌ Public RPC for Ethereum (rate limited)

### Monitoring
- ❌ 10-second polling interval (inefficient)
- ❌ No webhook support from Blockfrost
- ❌ Doesn't handle blockchain reorganizations
- ❌ No confirmations count check
- ❌ Timestamp validation only (not block height)

### Error Handling
- ❌ Minimal error recovery
- ❌ No retry logic for failed transactions
- ❌ Orders can get stuck in "processing" on errors
- ❌ No admin interface to manually resolve issues
- ❌ No alerting or monitoring system

## 🎬 Demo Script

For hackathon presentation:

1. **Show the landing page** - Clean UI, swap direction toggle
2. **Create an order** - Enter amount, show QR code generation
3. **Send small test amount** - 2 ADA or 0.01 ETH
4. **Show real-time updates** - Status changes, block explorer links
5. **Show transaction on block explorer** - Prove it's real on-chain
6. **Explain the tech stack** - "Built with Next.js, Lucid, Ethers.js..."
7. **Show backend logs** - Monitoring loop, automatic execution
8. **Emphasize what works** - "Real blockchain transactions, both chains!"

## 📦 Deployment

### Frontend (Vercel - Recommended)

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod

# Set environment variable (if needed)
# Usually frontend only needs NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://your-backend.railway.app
```

### Backend (Railway - Recommended)

```bash
# 1. Push code to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/crypto-swap.git
git push -u origin main

# 2. Go to https://railway.app/
# 3. Click "New Project" > "Deploy from GitHub"
# 4. Select your repo
# 5. Add environment variables:
#    - ETH_RPC_URL
#    - ETH_PRIVATE_KEY
#    - CARDANO_BLOCKFROST_KEY
#    - CARDANO_ADDRESS
#    - CARDANO_PRIVATE_KEY
# 6. Deploy!

# Railway will auto-deploy on git push
```

### Alternative: Docker Deployment

```bash
# Backend Dockerfile (create this)
cd backend
cat > Dockerfile << EOF
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
EOF

# Build and run
docker build -t crypto-swap-backend .
docker run -p 3001:3001 --env-file .env crypto-swap-backend
```

## 🔐 Security Best Practices (For Production)

If you want to make this production-ready:

1. **Key Management:**
   - Use AWS KMS, Google Cloud KMS, or Azure Key Vault
   - Implement multi-sig wallets for escrow
   - Rotate keys regularly
   - Use hardware security modules (HSM)

2. **Transaction Security:**
   - Integrate price oracle (Chainlink, Band Protocol)
   - Implement slippage limits
   - Add transaction confirmation count requirements
   - Build refund mechanism for failed swaps
   - Use unique deposit addresses per order

3. **Infrastructure:**
   - Use PostgreSQL with replication
   - Implement Redis for caching and queuing
   - Add WebSocket support for real-time updates
   - Set up monitoring (Datadog, New Relic)
   - Implement circuit breakers and retries

4. **Access Control:**
   - Add user authentication (OAuth, JWT)
   - Implement role-based access control
   - Rate limit API endpoints
   - Add CAPTCHA for order creation
   - Implement IP whitelisting for admin endpoints

## 📚 Technical Details

### Why Lucid for Cardano?

We initially tried using `@emurgo/cardano-serialization-lib-nodejs` (the low-level Cardano library), but encountered **InvalidWitnessesUTXOW** errors - the transaction witness/signature was rejected by the blockchain. This is because:

1. Manual transaction building is complex in Conway era
2. Blake2b-256 hashing must be done exactly right
3. Witness format has specific requirements

**Lucid solves this** by:
- Abstracting away low-level details
- Handling witness creation automatically
- Supporting Conway era out of the box
- Accepting bech32 private keys directly

**Trade-off:** Added dependency, but saved hours of debugging.

### Why Etherscan API for Ethereum?

Originally, the code used **block-polling** (fetching last 20 blocks and checking each transaction). This had major issues:

**Problems with block-polling:**
- 500+ RPC calls per order check (very slow)
- OnFinality/Infura rate limits and timeouts
- 20-block window too small (missed deposits if delayed)
- Silent failures when RPC times out

**Etherscan API V2 solves this:**
- **1 API call** instead of 500+ (1000x faster!)
- Gets all transactions to address instantly
- No block window limitations
- Free tier: 5 calls/sec, 100k calls/day
- More reliable than RPC polling

This change made ETH deposit detection **instant and reliable**.

### ESM vs CommonJS

The backend uses **ES Modules** (`"type": "module"` in package.json) because:
- Lucid is ESM-only
- Modern Node.js standard
- Better tree-shaking
- Native `async/await` support

**Requirement:** All imports must use `.js` extensions:
```typescript
import config from './config.js';  // ✅ Correct
import config from './config';    // ❌ Fails in ESM
```

### Atomic Database Operations

Race conditions are prevented using SQL-level atomicity:

```typescript
// Bad (race condition):
const order = getOrder(id);
if (order.status === 'deposited') {
  updateStatus(id, 'processing');
  sendAda(order.recipient_address, order.amount);
}
// Problem: Multiple processes can pass the `if` check!

// Good (atomic):
const updated = markAsProcessingIfDeposited(id);
if (updated) {
  // Only ONE process reaches here
  sendAda(order.recipient_address, order.amount);
}
```

The `WHERE status = 'deposited'` clause in the UPDATE statement ensures only one process can transition the status.

## 🎓 Learning Resources

**Cardano Development:**
- Lucid Documentation: https://lucid.spacebudz.io/
- Cardano Serialization Lib: https://docs.cardano.org/cardano-components/cardano-serialization-lib/
- Blockfrost API: https://docs.blockfrost.io/
- CIP-30 Wallet Standard: https://cips.cardano.org/cips/cip30/

**Ethereum Development:**
- Ethers.js Docs: https://docs.ethers.org/v6/
- Sepolia Testnet: https://sepolia.dev/
- Ethereum JSON-RPC: https://ethereum.org/en/developers/docs/apis/json-rpc/

**Next.js:**
- Next.js 15 Docs: https://nextjs.org/docs
- App Router Guide: https://nextjs.org/docs/app

## 🤝 Contributing

This is a hackathon project, but contributions are welcome!

```bash
# Fork the repo
git clone https://github.com/yourusername/crypto-swap.git
cd crypto-swap

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "Add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Disclaimer:** Built for hackathon/educational purposes. This is testnet-only code. Use at your own risk.

## 🙏 Acknowledgments

- **Cardano Foundation** - For PreProd testnet and Blockfrost API
- **Ethereum Foundation** - For Sepolia testnet
- **Lucid Team** - For the excellent Cardano library
- **Next.js Team** - For the amazing React framework

## 📞 Support

**Issues:** Check the console logs or open a GitHub issue

**Block Explorers:**
- Cardano PreProd: https://preprod.cardanoscan.io/
- Ethereum Sepolia: https://sepolia.etherscan.io/

**Example Transactions:**
- ADA Send: https://preprod.cardanoscan.io/transaction/ffa28fed2e5b257ef16a1922eeacbbd3bee6f8e7057b073c28b2ad0d6dcce527
- ETH Send: https://sepolia.etherscan.io/tx/0xaa61f3f64aba4cdc8968d5f2ab313a25734eb22e45271c2bc838b038e2467547

---

**Built with ❤️ for Cardano & Ethereum Hackathon**

*Last updated: 2025-11-29*
