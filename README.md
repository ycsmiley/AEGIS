# Aegis Finance

> AI-Powered Supply Chain Finance Platform on Arc Blockchain

[![Arc Testnet](https://img.shields.io/badge/Arc-Testnet-blue)](https://testnet.arc.network)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636?logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs)](https://nestjs.com/)

## Overview

Aegis Finance is a next-generation supply chain finance platform that leverages Arc's USDC-native blockchain to provide seamless invoice financing. By combining off-chain AI-powered risk assessment with on-chain settlement, we offer suppliers instant access to liquidity without the complexity of traditional DeFi.

### Why Arc Blockchain?

Arc's USDC-native architecture eliminates the need for ETH gas tokens, creating a truly streamlined user experience:

- **Single Currency Flow** - Users only need USDC for both transactions and gas fees
- **No Token Approvals** - Direct USDC transfers without ERC20 approve/transfer patterns
- **Transparent Costs** - All fees displayed in USDC, no surprise ETH requirements
- **Lower Barrier to Entry** - New users can participate without acquiring multiple tokens

### Key Features

- **🤖 AI Dynamic Pricing** - Mistral AI-powered real-time risk assessment and optimal discount rate calculation
- **⚡ Instant Financing** - Suppliers receive funds within minutes of approval
- **🔒 EIP-712 Signatures** - Secure off-chain authorization for on-chain execution
- **🌐 Multi-Role Platform** - Dedicated interfaces for Buyers, Suppliers, and Liquidity Providers
- **📊 Real-Time Analytics** - Live pool status, utilization metrics, and interest tracking

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (Next.js 14)                   │
│                                                           │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐          │
│   │   Buyer   │  │ Supplier  │  │    LP     │          │
│   │  Portal   │  │  Portal   │  │  Portal   │          │
│   └─────┬─────┘  └─────┬─────┘  └─────┬─────┘          │
│         │              │              │                  │
│         └──────────────┴──────────────┘                  │
│                        │                                  │
│              Wagmi + RainbowKit                          │
└────────────────────────┼─────────────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────────────┐
│           Backend (NestJS) │                              │
│                            │                              │
│   ┌─────────────────┐  ┌──┴────────────────┐            │
│   │  Aegis AI Agent │  │  Blockchain       │            │
│   │  (Mistral AI)   │  │  Service          │            │
│   │  Risk Scoring   │  │  Event Listener   │            │
│   │  EIP-712 Signer │  │                   │            │
│   └────────┬────────┘  └──┬────────────────┘            │
│            │               │                              │
│            └───────┬───────┘                              │
│                    │                                      │
│           Supabase Client                                │
└────────────────────┼──────────────────────────────────────┘
                     │
        ┌────────────┴───────────┐
        │                        │
┌───────▼────────┐    ┌──────────▼─────────┐
│   Supabase     │    │   Arc Testnet      │
│   PostgreSQL   │    │   Smart Contract   │
│   (Off-chain)  │    │   (On-chain)       │
└────────────────┘    └────────────────────┘
```

## Project Structure

```
aegis-finance/
├── frontend/              # Next.js 14 App Router
│   ├── src/
│   │   ├── app/          # Route pages
│   │   │   ├── buyer/    # Buyer portal
│   │   │   ├── supplier/ # Supplier portal
│   │   │   └── lp/       # LP portal
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities & configs
│   └── package.json
│
├── backend/              # NestJS API Server
│   ├── src/
│   │   ├── aegis/       # AI pricing engine (Mistral AI)
│   │   ├── blockchain/  # Contract interactions
│   │   ├── invoice/     # Invoice management
│   │   └── auth/        # Authentication
│   └── package.json
│
├── contracts/            # Solidity Smart Contracts
│   ├── contracts/
│   │   └── ArcPool.sol  # Main pool contract
│   ├── scripts/         # Deployment scripts
│   ├── test/            # Contract tests
│   └── deployments/     # Deployment records
│
├── database/            # Supabase Schemas
│   └── schema.sql       # Complete DB schema
│
└── doc/                 # Additional Documentation
    ├── QUICK_START.md
    ├── DEPLOYMENT_GUIDE.md
    └── API_AND_TESTING_GUIDE.md
```

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MetaMask** or compatible Web3 wallet
- **Supabase** account (free tier works)
- **Arc Testnet USDC** from the [faucet](https://faucet.testnet.arc.network)
- **Mistral AI API Key** (optional, free tier available at [console.mistral.ai](https://console.mistral.ai/))

### Installation

**1. Clone and Install Dependencies**

```bash
# Install all workspace dependencies
npm run setup
```

**2. Environment Configuration**

Create environment files from templates:

```bash
# Frontend
cp frontend/env.example frontend/.env.local

# Backend
cp backend/env.example backend/.env

# Contracts
cp contracts/.env.example contracts/.env
```

**3. Configure Environment Variables**

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ARC_CONTRACT_ADDRESS=0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

**Backend** (`backend/.env`):
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SERVER_WALLET_PRIVATE_KEY=your_aegis_server_private_key
AEGIS_SERVER_WALLET=your_aegis_server_address
ARC_CONTRACT_ADDRESS=0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_CHAIN_ID=5042002
MISTRAL_API_KEY=your_mistral_api_key  # Optional - for AI-powered risk scoring
```

**4. Database Setup**

Run the schema in your Supabase SQL Editor:

```bash
cat database/schema.sql
# Copy and paste into Supabase SQL Editor and run
```

**5. Deploy Smart Contracts** (Optional - already deployed)

Our contract is already deployed to Arc Testnet. To deploy your own:

```bash
cd contracts
npx hardhat run scripts/deploy-arc.js --network arcTestnet
```

**6. Start Development Servers**

```bash
# Option 1: Start all services together
npm run dev

# Option 2: Start services separately
# Terminal 1 - Backend
cd backend && npm run start:dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api

### Configure MetaMask for Arc Testnet

Add the Arc Testnet network to your wallet:

- **Network Name**: Arc Testnet
- **RPC URL**: https://rpc.testnet.arc.network
- **Chain ID**: 5042002
- **Currency Symbol**: USDC (native)
- **Block Explorer**: https://explorer.testnet.arc.network

## Deployed Contracts

### Arc Testnet

- **ArcPool Contract**: [`0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C`](https://explorer.testnet.arc.network/address/0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C)
- **Aegis Server**: `0x782c3446aedabdd934e97ee255d5c5c62fe289d3`
- **Chain ID**: 5042002
- **Deployed**: 2025-11-08

## How It Works

### Complete Financing Flow

```
┌──────────────────────────────────────────────────────┐
│ 1. SUPPLIER UPLOADS INVOICE                          │
│    └─> Invoice saved to Supabase (status: PENDING)   │
└────────────┬─────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────┐
│ 2. BUYER APPROVES INVOICE                            │
│    └─> Triggers Aegis AI pricing analysis            │
└────────────┬─────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────┐
│ 3. MISTRAL AI CALCULATES RISK & PRICING             │
│    ├─> Analyzes: credit scores, term, liquidity     │
│    ├─> Calculates: discount rate (1-5%)             │
│    └─> Generates: EIP-712 signature                 │
└────────────┬─────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────┐
│ 4. REAL-TIME OFFER PUSHED TO SUPPLIER               │
│    └─> Supabase Realtime notification               │
└────────────┬─────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────┐
│ 5. SUPPLIER ACCEPTS & WITHDRAWS                      │
│    ├─> Frontend calls withdrawFinancing()           │
│    ├─> Contract verifies Aegis signature            │
│    └─> USDC transferred (status: FINANCED)          │
└────────────┬─────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────┐
│ 6. BUYER REPAYS AT MATURITY                          │
│    ├─> Repays principal + interest                  │
│    ├─> 90% interest to LPs, 10% to protocol         │
│    └─> Invoice marked: REPAID                       │
└──────────────────────────────────────────────────────┘
```

### Arc-Native Benefits

Traditional DeFi requires multiple transactions and token types:

```solidity
// Traditional Ethereum DeFi
await ethToken.approve(contract, amount);  // Needs ETH for gas
await usdcToken.approve(contract, amount); // Needs ETH for gas
await contract.deposit(amount);            // Needs ETH for gas
```

Arc simplifies this to a single transaction with one currency:

```solidity
// Aegis on Arc
await contract.deposit({ value: usdcAmount }); // USDC for everything!
```

## Testing

### Smart Contract Tests

```bash
cd contracts
npx hardhat test
```

### Integration Testing

We provide a comprehensive 5-minute testing guide. See [`TESTING_CHECKLIST.md`](./TESTING_CHECKLIST.md) for step-by-step instructions.

**Quick Test Flow**:
1. LP deposits liquidity (1 USDC)
2. Supplier creates invoice (0.5 USDC)
3. Buyer approves invoice
4. AI generates pricing offer
5. Supplier withdraws financing (~0.49 USDC)
6. Buyer repays (0.5 USDC)
7. LP withdraws with interest (~1.009 USDC)

### API Testing

```bash
# Health check
curl http://localhost:3001/api/health

# Pool status
curl http://localhost:3001/api/blockchain/pool/status
```

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Web3**: Wagmi v2 + RainbowKit
- **State**: Supabase Realtime

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Blockchain**: Ethers.js v6
- **AI Engine**: Mistral AI (via official API)
- **Auth**: JWT + Supabase Auth

### Smart Contracts
- **Language**: Solidity 0.8.19
- **Framework**: Hardhat
- **Libraries**: OpenZeppelin Contracts
- **Standards**: EIP-712 (Typed Signatures)

### Infrastructure
- **Blockchain**: Arc Testnet
- **Database**: Supabase
- **Frontend Hosting**: Vercel (recommended)
- **Backend Hosting**: Railway/Render (recommended)

## Documentation

- **[Quick Start Guide](./doc/QUICK_START.md)** - Get up and running in 5 minutes
- **[Testing Checklist](./TESTING_CHECKLIST.md)** - Comprehensive testing guide
- **[Deployment Guide](./doc/DEPLOYMENT_GUIDE.md)** - Production deployment steps
- **[API Documentation](./doc/API_AND_TESTING_GUIDE.md)** - API endpoints reference
- **[Platform Design](./doc/PLATFORM_DESIGN.md)** - Architecture deep dive
- **[Change Log](./doc/ChangeLog.md)** - Project history and updates

## Development Scripts

```bash
# Install all dependencies
npm run setup

# Start frontend + backend together
npm run dev

# Start services individually
npm run dev:frontend
npm run dev:backend

# Build all projects
npm run build

# Run all tests
npm run test

# Deploy contracts
npm run deploy:contracts
```

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

This project is under active development. Please DO NOT use it in production with real funds without a proper security audit.

If you discover a security vulnerability, please email security@aegis-finance.com instead of using the issue tracker.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Links & Resources

- **Arc Blockchain**: https://arc.network
- **Arc Testnet Explorer**: https://explorer.testnet.arc.network
- **Arc Testnet Faucet**: https://faucet.testnet.arc.network
- **Supabase**: https://supabase.com
- **Documentation**: See the `/doc` directory

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/aegis-finance/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/aegis-finance/discussions)
- **Email**: team@aegis-finance.com

---

Built with ❤️ for the Arc Ecosystem
