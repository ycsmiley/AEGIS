# 🏆 Aegis Finance - Hackathon Setup Guide

> Quick setup guide for hackathon judges and reviewers

## 🚀 Quick Demo (No Setup Required)

If you want to quickly test the platform, we have a **live demo environment** ready:

### Deployed Smart Contract
- **Contract Address**: `0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C`
- **Network**: Arc Testnet
- **Explorer**: [View Contract](https://explorer.testnet.arc.network/address/0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C)

### Live Demo Environment
- **Frontend**: [Coming Soon - Deploy URL]
- **Backend API**: [Coming Soon - Deploy URL]
- **API Docs**: [Coming Soon - API URL/api]

## ⚡ 5-Minute Local Setup

### Prerequisites
- Node.js 18+ and npm
- MetaMask wallet
- Arc Testnet USDC ([Get from faucet](https://faucet.testnet.arc.network))

### Step 1: Clone and Install
```bash
git clone https://github.com/ycsmiley/new_arc_project.git
cd new_arc_project
npm run setup
```

### Step 2: Configure Environment

**Frontend** (`frontend/.env.local`):
```bash
cp frontend/env.example frontend/.env.local
```

Edit `frontend/.env.local`:
```env
# Supabase - Get from https://supabase.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# WalletConnect - Get from https://cloud.walletconnect.com
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# Contract (Already deployed - use as is)
NEXT_PUBLIC_ARC_CONTRACT_ADDRESS=0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend** (`backend/.env`):
```bash
cp backend/env.example backend/.env
```

Edit `backend/.env`:
```env
# Supabase (same as frontend)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# JWT Secret (generate random string)
JWT_SECRET=any_random_string_here

# Aegis Server Wallet (create a test wallet)
SERVER_WALLET_PRIVATE_KEY=your_test_wallet_private_key
AEGIS_SERVER_WALLET=your_test_wallet_address

# Contract (Already deployed - use as is)
ARC_CONTRACT_ADDRESS=0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_CHAIN_ID=5042002

# Mistral AI (Optional - for AI features)
# Get free API key from https://console.mistral.ai/
MISTRAL_API_KEY=your_mistral_api_key

FRONTEND_URL=http://localhost:3000
```

### Step 3: Database Setup

1. Create a free Supabase account at https://supabase.com
2. Copy the schema from `database/schema.sql`
3. Paste and run it in Supabase SQL Editor

### Step 4: Start the Application

```bash
# Start both frontend and backend
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api

## 🎯 Testing the Platform

### Setup MetaMask for Arc Testnet

Add this network to your MetaMask:
- **Network Name**: Arc Testnet
- **RPC URL**: https://rpc.testnet.arc.network
- **Chain ID**: 5042002
- **Currency Symbol**: USDC
- **Block Explorer**: https://explorer.testnet.arc.network

### Get Test USDC

Visit the [Arc Testnet Faucet](https://faucet.testnet.arc.network) to get free test USDC.

### Complete User Flow Test (5 minutes)

Follow the testing guide in [`TESTING_CHECKLIST.md`](./TESTING_CHECKLIST.md):

1. **LP deposits liquidity** (1 USDC)
2. **Supplier creates invoice** (0.5 USDC)
3. **Buyer approves invoice**
4. **AI generates pricing** (automatic)
5. **Supplier withdraws financing** (~0.49 USDC)
6. **Buyer repays invoice** (0.5 USDC)
7. **LP withdraws with interest** (~1.009 USDC)

## 🔍 What to Look For

### Key Features Demonstrated

1. **Arc-Native USDC Experience**
   - Single currency for gas and transactions
   - No token approvals needed
   - Simple user experience

2. **AI-Powered Dynamic Pricing**
   - Mistral AI risk assessment
   - Real-time discount rate calculation
   - EIP-712 signed pricing offers

3. **Multi-Role Platform**
   - Buyer portal for invoice approval
   - Supplier portal for financing requests
   - LP portal for liquidity provision

4. **Real-Time Updates**
   - Supabase Realtime notifications
   - Live pool status updates
   - Instant pricing offers

## 📊 Project Highlights

### Smart Contracts
- Deployed on Arc Testnet
- Full test coverage (see `contracts/test/`)
- Gas-optimized for USDC-native transactions

### Backend
- NestJS with TypeScript
- Mistral AI integration
- EIP-712 signature generation
- Blockchain event monitoring

### Frontend
- Next.js 14 with App Router
- Wagmi + RainbowKit for Web3
- Supabase Realtime
- Responsive UI with Tailwind CSS

## 🛠️ Alternative: Using Our Deployed Contract

If you don't want to set up the full backend, you can:

1. Just run the frontend
2. Use the deployed contract directly
3. Note: AI pricing won't work without backend, but you can still test:
   - LP deposits/withdrawals
   - Direct contract interactions
   - Wallet connections

## 📞 Support

Having issues? Check:
- [README.md](./README.md) - Full documentation
- [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) - Detailed testing guide
- [GitHub Issues](https://github.com/ycsmiley/new_arc_project/issues) - Report problems

## 🎥 Demo Video

[Coming Soon - Add your demo video link here]

## 🔗 Important Links

- **Live Demo**: [Coming Soon]
- **Contract Explorer**: https://explorer.testnet.arc.network/address/0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C
- **Arc Testnet Faucet**: https://faucet.testnet.arc.network
- **Documentation**: See `/doc` folder

---

**Built for Arc Blockchain Hackathon** 🚀

*Note: This is a testnet demo. Do not use with real funds.*
