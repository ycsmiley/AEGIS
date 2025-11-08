# Quick Start Guide - Arc Testnet Deployment

## 🎉 Contract Successfully Deployed!

**Contract Address**: `0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C`  
**Network**: Arc Testnet (Chain ID: 5042002)  
**Deployment Date**: November 8, 2025  
**Aegis Server**: `0x782c3446aedabdd934e97ee255d5c5c62fe289d3`

---

## ⚡ Quick Setup (3 steps)

### 1️⃣ Frontend Configuration

```bash
cd frontend
cp env.example .env.local
```

**Edit `.env.local`** and fill in:

```bash
# Required for Web3 wallet connection
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Already configured (from deployment)
NEXT_PUBLIC_ARC_CONTRACT_ADDRESS=0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C

# Optional (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Get WalletConnect Project ID**: https://cloud.walletconnect.com/

---

### 2️⃣ Backend Configuration

```bash
cd backend
cp env.example .env
```

**Edit `.env`** and fill in:

```bash
# Required: Your Aegis server wallet private key
SERVER_WALLET_PRIVATE_KEY=0xyour_private_key_here

# Already configured (from deployment)
AEGIS_SERVER_WALLET=0x782c3446aedabdd934e97ee255d5c5c62fe289d3
ARC_CONTRACT_ADDRESS=0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C

# Required: JWT Secret for authentication
JWT_SECRET=your_secure_random_string_here

# Optional but recommended: AI-powered risk scoring
HUGGINGFACE_API_TOKEN=hf_your_token_here

# Optional (if using Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

**Get Hugging Face Token** (free): https://huggingface.co/settings/tokens

---

### 3️⃣ Start Development Servers

**Option A: Start All at Once** (from project root)
```bash
npm run dev
```

**Option B: Start Individually** (recommended for debugging)

Terminal 1 - Frontend:
```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

Terminal 2 - Backend:
```bash
cd backend
npm run start:dev
# API running on http://localhost:3001
```

---

## 🔗 Important Links

- **Arc Testnet Explorer**: https://testnet.arcscan.app
- **Deployed Contract**: https://testnet.arcscan.app/address/0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C
- **Arc Testnet RPC**: https://rpc.testnet.arc.network
- **Arc Faucet**: (TBD - contact Arc team for testnet USDC)

---

## 📊 Contract Information

```javascript
{
  "network": "Arc Testnet",
  "chainId": 5042002,
  "contractAddress": "0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C",
  "aegisServer": "0x782c3446aedabdd934e97ee255d5c5c62fe289d3",
  "deployer": "0xdaaBa82018dbE31D9e28726F156feE448223e1Ec",
  "initialPoolSize": "0 USDC",
  "deployedAt": "2025-11-08T23:45:00+08:00"
}
```

---

## 🧪 Testing the Deployment

### Check Contract Status

```bash
cd contracts
npx hardhat run scripts/verify-deployment.js --network arcTestnet
```

### Test Frontend Wallet Connection

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Make sure your wallet is set to **Arc Testnet**:
   - **Network Name**: Arc Testnet
   - **RPC URL**: https://rpc.testnet.arc.network
   - **Chain ID**: 5042002
   - **Currency Symbol**: USDC

### Test Backend API

```bash
curl http://localhost:3001/health
# Should return: {"status":"ok"}
```

---

## 🎯 Next Steps

### For Developers

1. ✅ **Contract deployed** - Complete!
2. ⏳ **Configure environment variables** - See steps above
3. ⏳ **Test wallet connection** - Connect to Arc Testnet
4. ⏳ **Implement business logic** - Supplier/Buyer/LP portals
5. ⏳ **UI/UX refinement** - Linear-style design

### For Testing

1. Get Arc Testnet USDC from faucet
2. Test LP deposit/withdrawal flow
3. Test invoice financing flow
4. Test repayment flow with interest calculation

---

## 🆘 Troubleshooting

### Frontend won't connect to contract
- ✅ Check `.env.local` has correct `NEXT_PUBLIC_ARC_CONTRACT_ADDRESS`
- ✅ Ensure wallet is connected to Arc Testnet (Chain ID: 5042002)
- ✅ Clear browser cache and restart dev server

### Backend can't sign transactions
- ✅ Check `SERVER_WALLET_PRIVATE_KEY` is set in backend `.env`
- ✅ Verify private key format: must start with `0x` and be 66 characters
- ✅ Ensure Aegis wallet has some USDC for gas

### "Insufficient balance" errors
- ✅ Get testnet USDC from Arc faucet
- ✅ Check balance: https://testnet.arcscan.app/address/YOUR_ADDRESS

---

## 📚 Full Documentation

For detailed setup instructions, see:
- [Complete Setup Guide](./doc/SETUP.md)
- [Deployment Guide](./doc/DEPLOYMENT_GUIDE.md)
- [Testing Guide](./doc/API_AND_TESTING_GUIDE.md)
- [Frontend Migration Guide](./doc/FRONTEND_MIGRATION_GUIDE.md)

---

**Ready to build? Let's go! 🚀**

