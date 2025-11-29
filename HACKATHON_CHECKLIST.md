# Hackathon Checklist ✅

## Before the Hackathon Starts

### Setup (Do This First!)
- [ ] Install all dependencies: `cd backend && npm install && cd ../frontend && npm install`
- [ ] Create `backend/.env` file from `.env.example`
- [ ] Test that both apps start without errors

### Get API Keys & Wallets
- [ ] Sign up for Infura (https://infura.io) - Get Sepolia RPC URL
- [ ] Sign up for Blockfrost (https://blockfrost.io) - Get PreProd API key
- [ ] Create/import Sepolia testnet wallet in MetaMask
- [ ] Create/import PreProd wallet in Nami or Eternl
- [ ] Get testnet funds:
  - [ ] Sepolia ETH from https://sepoliafaucet.com/
  - [ ] PreProd ADA from https://docs.cardano.org/cardano-testnets/tools/faucet/

### Configure `.env`
- [ ] Add `ETH_PRIVATE_KEY` (your Sepolia wallet private key)
- [ ] Add `ETH_RPC_URL` (Infura Sepolia endpoint)
- [ ] Add `CARDANO_ADDRESS` (your PreProd address)
- [ ] Add `CARDANO_BLOCKFROST_KEY` (Blockfrost API key)

### Test Locally
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Create a test order in the UI
- [ ] Simulate deposit: `curl -X POST http://localhost:3001/api/orders/ORDER_ID/test-deposit`
- [ ] Verify order completes successfully
- [ ] Check QR code displays correctly
- [ ] Test on mobile/tablet (responsive design)

## During the Hackathon

### Hour 0-2: Planning & Customization
- [ ] Read through the codebase to understand it
- [ ] Decide what features to add/improve
- [ ] Customize branding (colors, logos, name)
- [ ] Update exchange rate if desired
- [ ] Plan your demo script

### Hour 2-8: Development
Pick features to add (in priority order):

**Priority 1 - Complete Core Functionality:**
- [ ] Implement real ADA transaction sending
- [ ] Improve deposit detection (match exact amounts)
- [ ] Add error handling and retry logic

**Priority 2 - UX Improvements:**
- [ ] Add loading spinners
- [ ] Add toast notifications
- [ ] Add order history page
- [ ] Improve error messages
- [ ] Add "swap again" button

**Priority 3 - Features:**
- [ ] Add transaction fee estimation
- [ ] Add slippage protection
- [ ] Add email notifications
- [ ] Add order cancellation
- [ ] Add refund mechanism

**Priority 4 - Security/Production:**
- [ ] Add rate limiting
- [ ] Add input validation
- [ ] Add API authentication
- [ ] Encrypt sensitive data
- [ ] Add comprehensive logging

### Hour 8-16: Testing & Polish
- [ ] Test all features thoroughly
- [ ] Fix critical bugs
- [ ] Polish UI/UX
- [ ] Test on different devices
- [ ] Prepare demo data/scenarios
- [ ] Create demo video (backup plan)

### Hour 16-20: Deployment
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway/Render
- [ ] Update environment variables in production
- [ ] Test production deployment
- [ ] Verify testnet funds available

### Hour 20-24: Demo Preparation
- [ ] Write demo script
- [ ] Practice demo (time it!)
- [ ] Prepare slides (optional)
- [ ] Take screenshots of working app
- [ ] Record backup video
- [ ] Prepare answers to expected questions
- [ ] Get some rest! 😴

## Demo Day Checklist

### Morning Of
- [ ] Verify both frontend and backend are running
- [ ] Check escrow wallets have sufficient testnet funds
- [ ] Test create order → deposit → complete flow
- [ ] Charge laptop & have charger ready
- [ ] Test internet connection
- [ ] Open all necessary tabs/windows

### 30 Min Before Demo
- [ ] Close unnecessary apps
- [ ] Clear browser cache
- [ ] Test demo flow one more time
- [ ] Have backup video ready
- [ ] Zoom display settings (for projector)
- [ ] Mute notifications

### During Demo (5-7 min typical)

**Minute 0-1: Introduction**
- [ ] Introduce yourself & team
- [ ] State the problem you're solving
- [ ] "We built a crypto swap platform for ADA and ETH"

**Minute 1-3: Show the App**
- [ ] Open the UI (have it pre-loaded)
- [ ] Show clean, simple interface
- [ ] Explain swap direction toggle
- [ ] Show exchange rate calculator
- [ ] Enter example amount and address

**Minute 3-5: Create & Track Order**
- [ ] Click "Continue" to create order
- [ ] Show QR code generation
- [ ] Show deposit address
- [ ] Show countdown timer
- [ ] Explain how user would send crypto here

**Minute 5-6: Show Completion**
- [ ] Use test endpoint OR pre-created completed order
- [ ] Show status progression
- [ ] Show completed state with transaction hashes
- [ ] Highlight automatic execution

**Minute 6-7: Explain Architecture**
- [ ] Show backend monitoring logs
- [ ] Explain chain monitoring
- [ ] Explain automatic swap execution
- [ ] Mention testnet usage (safe demo)

### Talking Points to Hit
- [ ] "Works on testnets - Sepolia and PreProd"
- [ ] "QR codes for mobile-friendly deposits"
- [ ] "Real-time status tracking with polling"
- [ ] "Automatic swap execution via chain monitoring"
- [ ] "Built in 24 hours for this hackathon"

### Questions You Might Get

**Q: How do you prevent double-spending?**
A: Orders are matched to specific amounts and marked as used once processed. In production, we'd add transaction hash verification.

**Q: What about transaction fees?**
A: Currently simplified for demo. In production, we'd calculate gas fees and include them in the exchange rate.

**Q: Is this secure for production?**
A: No, this is a hackathon prototype. For production, we'd add: multi-sig wallets, proper key management, audited smart contracts, and comprehensive security measures.

**Q: How do you handle failed transactions?**
A: Currently basic error logging. Future: automatic retry mechanism and refund system.

**Q: Why not use smart contracts?**
A: For speed and simplicity in hackathon. A production version would benefit from trustless smart contract escrow.

**Q: What if the price changes during the swap?**
A: Fixed rate for this demo. Production would include price oracles and slippage protection.

## Post-Demo

### If Judges Want to Try It
- [ ] Have demo wallet addresses ready to share
- [ ] Guide them through process
- [ ] Be ready to troubleshoot
- [ ] Show backend logs in real-time

### After Presentation
- [ ] Note any questions you couldn't answer
- [ ] Collect feedback
- [ ] Network with other teams
- [ ] Celebrate! 🎉

## Emergency Backup Plans

### If Live Demo Fails
- [ ] Have screenshots ready
- [ ] Play recorded video
- [ ] Explain verbally with diagrams
- [ ] Show code instead

### If Backend Down
- [ ] Switch to localhost
- [ ] Use test endpoint for instant demo
- [ ] Show pre-created orders

### If Frontend Down
- [ ] Use curl to demonstrate API
- [ ] Show database contents
- [ ] Walk through code

### If Internet Down
- [ ] Run everything locally
- [ ] Use recorded video
- [ ] Demonstrate with screenshots

## Judging Criteria Alignment

### Innovation
- [ ] Highlight cross-chain swap without smart contracts
- [ ] Mention QR code UX for mobile
- [ ] Emphasize simplicity for users

### Technical Complexity
- [ ] Explain blockchain monitoring
- [ ] Show database schema
- [ ] Discuss automatic execution logic
- [ ] Mention TypeScript, Next.js, ethers.js

### Design/UX
- [ ] Show clean, modern interface
- [ ] Demonstrate responsive design
- [ ] Highlight real-time status updates
- [ ] Show QR code generation

### Completeness
- [ ] Full working prototype
- [ ] Both swap directions work
- [ ] Order tracking included
- [ ] Ready for deployment

### Practicality
- [ ] Solves real problem (cross-chain swaps)
- [ ] Works on testnets (safe to demo)
- [ ] Clear path to production
- [ ] Scalable architecture

## Resources to Have Open

### During Demo
- Frontend: `http://localhost:3000` or production URL
- Backend logs: Terminal with `npm run dev` output
- Backend API: `http://localhost:3001/health`
- Database viewer: SQLite browser (optional)

### For Questions
- README.md - Architecture diagram
- PROJECT_STATUS.md - Feature list
- Code in VS Code - Show implementation

## Time Management

**Don't spend too much time on:**
- Perfect UI polish (good enough is fine)
- Complex features you might not demo
- Over-engineering
- Extensive documentation

**Do spend time on:**
- Making demo smooth
- Core functionality working
- Understanding your own code
- Preparing for questions
- Testing, testing, testing

## Final Tips

1. **Keep it simple:** Better to have 3 features working perfectly than 10 features half-working
2. **Practice demo:** Rehearse at least 3 times
3. **Know your code:** Be able to explain any part
4. **Have backups:** Video, screenshots, localhost version
5. **Stay calm:** Things go wrong, have a plan B
6. **Be enthusiastic:** Show passion for your project
7. **Network:** Talk to other teams, judges, sponsors
8. **Have fun:** Enjoy the experience!

---

## Quick Command Reference

```bash
# Start development
cd backend && npm run dev                    # Terminal 1
cd frontend && npm run dev                   # Terminal 2

# Test order creation
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"direction":"ADA_TO_ETH","amount":100,"recipientAddress":"0x123..."}'

# Simulate deposit (demo)
curl -X POST http://localhost:3001/api/orders/ORDER_ID/test-deposit

# Check order status
curl http://localhost:3001/api/orders/ORDER_ID

# View database
cd backend && sqlite3 swap.db "SELECT * FROM orders;"

# Deploy
git push                                     # Triggers Vercel deployment
railway up                                   # Deploy to Railway
```

---

**You've got this! Good luck with your hackathon! 🚀🏆**
