# Testing Guide

## Quick Demo Testing (No Blockchain Required)

For quick UI testing and demo without waiting for blockchain confirmations:

### 1. Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Create a Test Order

1. Go to http://localhost:3000
2. Fill in the form:
   - Direction: ADA → ETH
   - Amount: 100
   - Recipient Address: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8` (or any ETH address)
3. Click "Continue"
4. You'll be redirected to the order page showing:
   - Deposit address
   - QR code
   - Order status: "Waiting for deposit"

### 3. Simulate a Deposit (For Testing)

Instead of sending real crypto, use the testing endpoint:

```bash
# Get the order ID from the URL (e.g., /order/abc123...)
ORDER_ID="your-order-id-here"

# Trigger a simulated deposit
curl -X POST http://localhost:3001/api/orders/$ORDER_ID/test-deposit
```

This will:
1. Mark the order as "deposited"
2. Trigger the automatic swap execution
3. Update status to "processing" → "completed"

### 4. Watch the Order Update

The order page polls every 5 seconds. You'll see:
1. Status changes to "Deposit received"
2. Then "Processing swap..."
3. Finally "Swap completed successfully" ✅

## Full End-to-End Testing (With Real Testnets)

### Prerequisites

1. **Funded Escrow Wallets:**
   - Sepolia ETH wallet with ~0.1 ETH
   - PreProd ADA wallet with ~1000 ADA

2. **Configured `.env`:**
   ```bash
   ETH_PRIVATE_KEY=your_sepolia_private_key
   ETH_RPC_URL=https://sepolia.infura.io/v3/your_key
   CARDANO_ADDRESS=addr_test1...
   CARDANO_BLOCKFROST_KEY=preprod...
   ```

### Test ADA → ETH Swap

1. **Create Order:**
   - Amount: 10 ADA
   - Direction: ADA → ETH
   - Recipient: Your Sepolia test address

2. **Send ADA:**
   - Use Nami/Eternl wallet on PreProd network
   - Send exactly 10 ADA to the deposit address shown
   - Or use cardano-cli:
   ```bash
   cardano-cli transaction build-raw ... # build transaction
   cardano-cli transaction sign ...      # sign it
   cardano-cli transaction submit ...    # submit
   ```

3. **Monitor Backend:**
   - Watch console logs in backend terminal
   - Should see: "Checking ADA deposit for order..."
   - When detected: "Executing ETH swap..."

4. **Verify Completion:**
   - Check your Sepolia address on Etherscan Sepolia
   - Should receive ~0.005 ETH (10 ADA × 0.0005)

### Test ETH → ADA Swap

1. **Create Order:**
   - Amount: 0.01 ETH
   - Direction: ETH → ADA
   - Recipient: Your PreProd ADA address

2. **Send ETH:**
   - Use MetaMask on Sepolia network
   - Send exactly 0.01 ETH to deposit address
   - Or use ethers.js:
   ```javascript
   const tx = await wallet.sendTransaction({
     to: 'deposit_address',
     value: ethers.parseEther('0.01')
   });
   ```

3. **Monitor Backend:**
   - Watch for: "Checking ETH deposit for order..."
   - Then: "Executing ADA swap..."

4. **Verify:**
   - Check PreProd explorer (cardanoscan.io/preprod)
   - Should receive ~20 ADA (0.01 ETH ÷ 0.0005)

## Testing Checklist

### UI Testing
- [ ] Swap form loads correctly
- [ ] Can switch between ADA→ETH and ETH→ADA
- [ ] Exchange rate calculates correctly
- [ ] Form validation works (required fields)
- [ ] QR code displays on order page
- [ ] Can copy deposit address
- [ ] Timer counts down correctly
- [ ] Order status updates automatically
- [ ] Completed orders show transaction hashes

### API Testing

```bash
# Health check
curl http://localhost:3001/health

# Create order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "direction": "ADA_TO_ETH",
    "amount": 100,
    "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8"
  }'

# Get order status
curl http://localhost:3001/api/orders/ORDER_ID

# Test deposit (demo mode)
curl -X POST http://localhost:3001/api/orders/ORDER_ID/test-deposit
```

### Backend Testing
- [ ] Server starts without errors
- [ ] Database file created (backend/swap.db)
- [ ] ETH wallet address displayed on startup
- [ ] Chain monitoring logs appear every 10s
- [ ] Orders expire after 30 minutes
- [ ] Expired orders marked correctly

## Database Inspection

```bash
cd backend

# View all orders
sqlite3 swap.db "SELECT id, direction, amount, status FROM orders;"

# View pending orders
sqlite3 swap.db "SELECT * FROM orders WHERE status='pending';"

# View completed orders
sqlite3 swap.db "SELECT * FROM orders WHERE status='completed';"

# Clear all orders (reset for testing)
sqlite3 swap.db "DELETE FROM orders;"
```

## Common Issues & Solutions

### Order stuck in "pending"
**Problem:** Order doesn't detect deposit
**Solutions:**
- Check backend logs for errors
- Verify deposit transaction confirmed on blockchain
- Check amount matches exactly
- Use test endpoint to simulate deposit

### "Failed to create order"
**Problem:** Frontend can't reach backend
**Solutions:**
- Verify backend running on port 3001
- Check for CORS errors in browser console
- Restart backend

### Swap execution fails
**Problem:** Backend has errors when executing swap
**Solutions:**
- Check escrow wallet has sufficient funds
- Verify private keys in `.env`
- Check RPC endpoint is responding
- Review backend error logs

### Wrong amounts received
**Problem:** Exchange rate calculation error
**Solutions:**
- Verify `exchangeRate` in config.ts is 0.0005
- Check order.output_amount in database
- Review calculation in swap form

## Performance Testing

```bash
# Create multiple orders quickly
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/orders \
    -H "Content-Type: application/json" \
    -d "{\"direction\":\"ADA_TO_ETH\",\"amount\":10,\"recipientAddress\":\"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8\"}"
  echo ""
done

# Check how many orders backend is monitoring
sqlite3 backend/swap.db "SELECT COUNT(*) FROM orders WHERE status IN ('pending','deposited','processing');"
```

## Demo Rehearsal Checklist

Before your hackathon demo:

- [ ] Both services start without errors
- [ ] UI looks good (test in different browsers)
- [ ] Can create order successfully
- [ ] QR code displays properly
- [ ] Use test endpoint to simulate quick swap
- [ ] Order completes within 15 seconds
- [ ] Transaction hashes display
- [ ] Test on mobile (responsive design)
- [ ] Prepare backup screenshots/video
- [ ] Have test wallets ready with funds
- [ ] Know your talking points

## Automated Testing Ideas (Future Enhancement)

```javascript
// Example Jest test
describe('Swap API', () => {
  test('creates order successfully', async () => {
    const response = await fetch('http://localhost:3001/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        direction: 'ADA_TO_ETH',
        amount: 100,
        recipientAddress: '0x123...'
      })
    });
    const data = await response.json();
    expect(data.orderId).toBeDefined();
  });
});
```

Good luck with testing! 🧪
