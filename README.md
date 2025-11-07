# Aegis Finance - Arc Supply Chain Finance Platform

<div align="center">
  <h3>🚀 Arc-Native Supply Chain Finance Solution</h3>
  <p>Off-Chain AI Agent + On-Chain Settlement</p>
</div>

## 📋 Project Overview

Aegis Finance is a supply chain finance platform built on **Arc Blockchain**, leveraging Arc's USDC-native features to provide seamless invoice financing experience.

### Core Features

- ✅ **Arc Native USDC** - No ETH needed for gas, USDC all the way
- 🤖 **AI Dynamic Pricing** - Aegis Agent calculates optimal financing rates in real-time
- ⚡ **Instant Settlement** - Off-chain analysis, on-chain execution
- 🔒 **EIP-712 Signatures** - Secure off-chain authorization mechanism
- 🌐 **Multi-Role Portals** - Buyer, Supplier, and Liquidity Provider interfaces

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (Next.js)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  Buyer   │  │ Supplier │  │    LP    │          │
│  │  Portal  │  │  Portal  │  │  Portal  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│         │              │              │              │
│         └──────────────┴──────────────┘              │
│                        │                              │
│                   Wagmi + RainbowKit                 │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────┐
│              Backend (Nest.js)                       │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ Aegis Agent  │  │  Blockchain  │                │
│  │ AI Pricing   │  │   Service    │                │
│  └──────────────┘  └──────────────┘                │
│         │                   │                        │
│         └───────────────────┘                        │
│                     │                                │
│              Supabase Client                         │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐     ┌─────────▼──────────┐
│   Supabase     │     │    Arc Testnet     │
│   PostgreSQL   │     │   ArcPool.sol      │
│   (Off-chain)  │     │   (On-chain)       │
└────────────────┘     └────────────────────┘
```

## 📁 Project Structure

```
aegis-finance/
├── frontend/           # Next.js Frontend Application
│   ├── app/           # App Router
│   │   ├── buyer/     # Buyer Portal
│   │   ├── supplier/  # Supplier Portal
│   │   └── lp/        # LP Portal
│   ├── components/    # React Components
│   └── lib/           # Utility Libraries
│
├── backend/           # Nest.js Backend Service
│   ├── src/
│   │   ├── auth/      # Authentication Module
│   │   ├── invoice/   # Invoice Management
│   │   ├── aegis/     # AI Agent
│   │   └── blockchain/# Blockchain Interaction
│
├── contracts/         # Solidity Smart Contracts
│   ├── contracts/
│   │   └── ArcPool.sol
│   ├── scripts/       # Deployment Scripts
│   └── test/          # Contract Tests
│
└── database/          # Supabase Schemas
    └── schema.sql
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Hardhat
- Supabase Account
- Arc Testnet USDC

### 1. Install Dependencies

```bash
# Frontend
cd frontend
pnpm install

# Backend
cd ../backend
pnpm install

# Contracts
cd ../contracts
npm install
```

### 2. Environment Setup

```bash
# Frontend (.env.local)
cp frontend/.env.example frontend/.env.local

# Backend (.env)
cp backend/.env.example backend/.env

# Contracts (.env)
cp contracts/.env.example contracts/.env
```

### 3. Deploy Smart Contracts

```bash
cd contracts
npx hardhat run scripts/deploy-arc.js --network arcTestnet
```

### 4. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
pnpm run start:dev

# Terminal 2: Frontend
cd frontend
pnpm run dev
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api

## 🔑 Arc Chain Feature Utilization

### USDC as Native Gas Token

```typescript
// Traditional EVM Chains
await usdc.approve(contract, amount);  // Needs ETH for gas
await contract.transfer(amount);        // Needs ETH for gas

// Arc Chain
await contract.deposit({ value: amount }); // Use USDC directly!
```

### Simplified User Experience

1. **Single Currency** - Users only need USDC
2. **No Approve Needed** - Native token transfers
3. **Transparent Costs** - Gas and payments both in USDC
4. **Lower Barrier** - New users don't need to acquire ETH first

## 🔄 Complete Financing Flow

```
T=0: Supplier Uploads Invoice
  │
  ├─> Invoice data saved to Supabase
  │
T=1: Buyer Approves Invoice
  │
  ├─> Triggers Aegis AI Pricing
  │
T=2: AI Analyzes Risk Factors
  │
  ├─> Fetch on-chain liquidity status
  ├─> Query company credit ratings
  ├─> Calculate dynamic discount rate
  │
T=3: Generate EIP-712 Signature
  │
  ├─> Signature includes: invoiceId, supplier, amount, deadline
  │
T=4: Real-time Quote Push to Supplier
  │
  ├─> Supabase Realtime notification
  │
T=5: Supplier Accepts Financing
  │
  ├─> Frontend calls withdrawFinancing()
  ├─> Contract verifies Aegis signature
  ├─> USDC transferred to supplier wallet
  │
✅ Financing Complete
```

## 🧪 Testing

```bash
# Contract tests
cd contracts
npx hardhat test

# Backend tests
cd backend
pnpm test

# Frontend tests
cd frontend
pnpm test
```

## 📊 Demo Data Preparation

### Test Accounts

| Role | Address | USDC Required |
|------|---------|---------------|
| LP | 0x... | 10,000 USDC |
| Buyer | 0x... | 100 USDC |
| Supplier | 0x... | 10 USDC |
| Aegis Server | 0x... | 100 USDC |

### Demo Script

1. LP deposits 500,000 USDC
2. Supplier uploads 100,000 USDC invoice
3. Buyer approves invoice
4. AI real-time pricing display
5. Supplier accepts and receives 98,000 USDC
6. Show Arc Explorer transaction records

## 🛠️ Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Wagmi
- RainbowKit
- Supabase Client

### Backend
- Nest.js
- TypeScript
- Supabase
- Ethers.js
- JWT Authentication

### Smart Contracts
- Solidity 0.8.19
- Hardhat
- OpenZeppelin
- EIP-712

### Infrastructure
- Arc Testnet
- Supabase (PostgreSQL)
- Vercel (Frontend)
- Railway (Backend)

## 📝 License

MIT

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📧 Contact

- Email: team@aegis-finance.com
- Twitter: @AegisFinance

