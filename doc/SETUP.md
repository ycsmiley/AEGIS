# Quick Setup Guide

## ✅ What You Actually Need

### Required (Must Have)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** - Comes with Node.js automatically

### Optional (For Later)
- Supabase account (only when you need database)
- Arc Testnet access (only when deploying to testnet)

---

## ❌ What You DON'T Need to Install Separately

### ✅ Solidity Compiler
**You DON'T need to install separately!**
- Hardhat installs and manages the Solidity compiler automatically
- When you run `npm install` in the `contracts/` folder, it's all handled for you

### ✅ Arc-specific Tools
**No special Arc SDK needed!**
- Arc is EVM-compatible (works like Ethereum)
- Uses standard tools: ethers.js, wagmi, hardhat
- Just need the correct RPC URL (already in the config)

### ✅ Hardhat
**You DON'T need global installation!**
- It's already in `package.json`
- Use `npx hardhat` to run commands

---

## 🚀 Minimal Setup (Start Coding Now)

### Step 1: Check Node.js
```bash
node --version  # Should show v18 or higher
npm --version   # Should show npm version
```

### Step 2: Install Dependencies
```bash
cd /Users/jimmmmmmmmmmyc./Desktop/ARC/new_arc_project

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Install contract dependencies
cd ../contracts
npm install
```

### Step 3: Create Environment Files (Later)
You can skip this for now if just exploring the code:
```bash
# Only create these when you're ready to run the apps
cp env.example frontend/.env.local
cp env.example backend/.env
cp env.example contracts/.env

# OR use the specific templates in each folder:
cp frontend/env.example frontend/.env.local
cp backend/env.example backend/.env
cp contracts/env.example contracts/.env
```

---

## 🎯 What Each Folder Needs

### Frontend (`frontend/`)
```json
{
  "dependencies": {
    "next": "^14.2.0",           // ✅ Included
    "wagmi": "^2.5.0",            // ✅ Arc connection (EVM-compatible)
    "ethers": "^6.11.0",          // ✅ Blockchain interaction
    "@supabase/supabase-js": "^2.39.0"  // ✅ Database client
  }
}
```
**No special Arc package needed** - wagmi + ethers work with any EVM chain!

### Backend (`backend/`)
```json
{
  "dependencies": {
    "@nestjs/core": "^10.3.0",    // ✅ Included
    "ethers": "^6.11.0",          // ✅ Smart contract interaction
    "@supabase/supabase-js": "^2.39.0"  // ✅ Database client
  }
}
```
**No Solidity tools needed** - Backend just reads/calls contracts!

### Contracts (`contracts/`)
```json
{
  "dependencies": {
    "hardhat": "^2.19.0",                    // ✅ Includes Solidity compiler
    "@openzeppelin/contracts": "^5.0.1",     // ✅ Smart contract library
    "@nomicfoundation/hardhat-toolbox": "^4.0.0"  // ✅ All tools included
  }
}
```
**Solidity compiler is bundled with Hardhat!**

---

## 💡 Understanding the Architecture

### Arc Chain = Ethereum-like
```
Traditional EVM Chain (Ethereum):
- Native token: ETH (for gas)
- USDC: ERC20 token (needs approve)

Arc Chain (Circle's L1):
- Native token: USDC (for gas) ← The only difference!
- No need for separate gas token
```

### No Special SDK Because:
1. **Arc is EVM-compatible** → Standard Ethereum tools work
2. **Same RPC interface** → ethers.js connects normally
3. **Same smart contracts** → Solidity code is identical
4. **Only difference**: USDC is native (like ETH on Ethereum)

---

## 🔧 Common Commands

### Development
```bash
# Start frontend only
cd frontend
npm run dev

# Start backend only
cd backend
npm run start:dev

# Compile contracts
cd contracts
npx hardhat compile

# Test contracts (no deployment needed)
cd contracts
npx hardhat test
```

### Testing Locally
```bash
# Run local Hardhat network (simulates Arc)
cd contracts
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy-arc.js --network localhost
```

---

## 📝 When You Actually Need Arc Testnet

You only need Arc Testnet connection when:
1. ✅ **Deploying contracts** to Arc Testnet
2. ✅ **Testing with real USDC** (from faucet)
3. ✅ **Connecting frontend** to deployed contracts

Before that, you can:
- ✅ Write all the code
- ✅ Test contracts locally with `npx hardhat test`
- ✅ Build the frontend UI
- ✅ Develop backend APIs

---

## 🎓 Summary

### Install Once:
```bash
npm install  # In each folder (frontend, backend, contracts)
```

### Everything Else is Automatic:
- ✅ Solidity compiler → Managed by Hardhat
- ✅ Arc connection → Standard ethers.js + RPC URL
- ✅ Dependencies → Listed in package.json

### No Special Tools:
- ❌ No separate Solidity installation
- ❌ No Arc CLI
- ❌ No special SDK
- ❌ No pnpm (npm works fine)

**Just Node.js + npm = You're ready to code!** 🎉

---

## 🆘 Troubleshooting

### "Cannot find module 'hardhat'"
```bash
cd contracts
npm install  # Make sure dependencies are installed
npx hardhat compile  # Use npx, not global hardhat
```

### "Solidity version not found"
```bash
cd contracts
npx hardhat clean
npx hardhat compile  # Hardhat downloads Solidity automatically
```

### "Arc RPC connection failed"
```bash
# Don't worry! You can develop without Arc Testnet
# Use local network instead:
npx hardhat node  # Runs local blockchain
```

---

**Ready to start? Just run `npm install` in each folder!**

