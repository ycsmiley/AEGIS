# Arc Testnet 部署指南

## 📋 部署前準備清單

### 1. 準備錢包地址

你需要準備 **2 個錢包地址**：

| 錢包 | 用途 | 需求 |
|------|------|------|
| **部署錢包** | 部署智能合約 | 需要 ARC 測試幣（用於 gas） |
| **Aegis Server 錢包** | 簽署融資請求 | 私鑰需配置在後端 |

#### 建議方式：

**方式 A：使用同一個錢包（簡單，適合測試）**
- 創建一個新的測試錢包
- 同時用作部署錢包和 Aegis Server 錢包
- 優點：只需管理一個私鑰
- 缺點：安全性較低（僅適合測試）

**方式 B：使用兩個不同錢包（安全，適合生產）**
- 創建兩個獨立錢包
- 部署錢包：用於一次性部署
- Aegis Server 錢包：長期運行在後端伺服器
- 優點：更安全，職責分離
- 缺點：需要管理兩個私鑰

---

### 2. 獲取 Arc 測試幣

部署錢包需要 Arc 測試幣來支付 gas。

#### Arc Testnet 信息：
- **Network Name**: Arc Testnet
- **RPC URL**: `https://rpc.testnet.arc.network`
- **Chain ID**: `5042002`
- **Currency Symbol**: ARC
- **Block Explorer**: `https://testnet.arcscan.app` (如果有的話)

#### 獲取測試幣：
1. 訪問 Arc Testnet Faucet（請查看 Arc 官方文檔）
2. 或聯繫 Arc 團隊獲取測試幣
3. 建議至少獲取 **0.1 ARC** 用於部署

---

### 3. 配置環境變數

#### Step 1: 創建合約環境變數

```bash
cd contracts
cp .env.example .env
```

編輯 `contracts/.env`：

```env
# 1. 部署錢包私鑰
PRIVATE_KEY=0xYourPrivateKeyHere

# 2. Aegis Server 錢包地址
AEGIS_SERVER_WALLET=0xYourAegisServerWalletAddress

# 3. Arc RPC URL (選填，有預設值)
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network

# 4. 初始流動性 (選填)
INITIAL_LIQUIDITY=0
```

#### Step 2: 檢查後端環境變數

確保 `backend/.env` 已配置：

```env
# Aegis Server Wallet (與合約配置對應)
SERVER_WALLET_PRIVATE_KEY=0xYourAegisServerPrivateKey
AEGIS_SERVER_WALLET=0xYourAegisServerWalletAddress

# Arc Testnet
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_CONTRACT_ADDRESS=0x...  # 部署後會獲得
ARC_CHAIN_ID=5042002
```

#### Step 3: 前端環境變數

確保 `frontend/.env.local` 已配置：

```env
# Supabase (必須先配置)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Arc Contract (部署後更新)
NEXT_PUBLIC_ARC_CONTRACT_ADDRESS=0x...

# Arc Testnet
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
```

---

## 🚀 部署步驟

### 步驟 1: 檢查配置

```bash
cd contracts

# 檢查部署錢包地址和餘額
npx hardhat run scripts/check-deployment.js --network arcTestnet
```

預期輸出：
```
📍 Deployer Address: 0x1234...
💰 Balance: 0.5 ARC
🤖 Aegis Server Wallet: 0xabcd...
✅ Ready to deploy!
```

如果沒有這個腳本，我可以幫你創建一個。

---

### 步驟 2: 部署 ArcPool 合約

```bash
npx hardhat run scripts/deploy-arc.js --network arcTestnet
```

部署過程（約 30-60 秒）：
```
🚀 Deploying ArcPool to Arc Testnet...

📝 Deploying contracts with account: 0x1234...
💰 Account balance: 0.5 ARC

🤖 Aegis Server Wallet: 0xabcd...
💧 Initial Liquidity: 0 USDC

⏳ Deploying ArcPool contract...
✅ ArcPool deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

📊 Initial Pool Status:
   Total Pool Size: 0 USDC
   Available Liquidity: 0 USDC
   Utilized: 0 USDC
   Total Financed: 0 USDC

💾 Deployment info saved to: arcTestnet-1699368600000.json

🎉 Deployment complete!

📋 Next Steps:
1. Update frontend .env.local:
   NEXT_PUBLIC_ARC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

2. Update backend .env:
   ARC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**重要：複製合約地址 `0x5FbDB...`，稍後需要更新到環境變數！**

---

### 步驟 3: 驗證部署成功

```bash
# 使用 cast 查詢合約
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "getPoolStatus()" --rpc-url https://rpc.testnet.arc.network

# 預期輸出 (4 個 uint256 值)
# 0x0000000000000000000000000000000000000000000000000000000000000000  # total
# 0x0000000000000000000000000000000000000000000000000000000000000000  # available
# 0x0000000000000000000000000000000000000000000000000000000000000000  # utilized
# 0x0000000000000000000000000000000000000000000000000000000000000000  # financed
```

如果能正常返回數據，表示部署成功！

---

### 步驟 4: 更新環境變數

#### 更新後端

編輯 `backend/.env`：
```env
ARC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

重啟後端：
```bash
cd backend
npm run start:dev
```

#### 更新前端

編輯 `frontend/.env.local`：
```env
NEXT_PUBLIC_ARC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

重啟前端：
```bash
cd frontend
npm run dev
```

---

### 步驟 5: 測試合約連接

#### 測試後端連接

```bash
curl http://localhost:3001/api/health

# 檢查日誌是否有錯誤
# 應該看到: [BlockchainService] Blockchain service initialized successfully
```

#### 測試前端連接

1. 打開瀏覽器訪問 `http://localhost:3000/lp`
2. 連接 MetaMask
3. 確保 MetaMask 切換到 Arc Testnet
4. 應該能看到池狀態：
   ```
   Total Pool Size: 0 USDC
   Available Liquidity: 0 USDC
   ```

如果顯示 "Cannot read pool status" 或類似錯誤，檢查：
- 合約地址是否正確
- MetaMask 是否在 Arc Testnet
- RPC URL 是否正確

---

## 🧪 測試部署

### 測試 1: LP 存款

1. 確保你的錢包有 Arc Testnet 上的 USDC（或原生代幣）
2. 訪問 `http://localhost:3000/lp`
3. 嘗試存入少量 USDC（例如 0.1 USDC）
4. 檢查交易是否成功

### 測試 2: 查詢池狀態

```bash
# 使用 backend API
curl http://localhost:3001/api/pool/status

# 或直接查詢合約
cast call $CONTRACT_ADDRESS "getPoolStatus()" --rpc-url https://rpc.testnet.arc.network
```

---

## ❌ 常見問題排除

### 問題 1: "Could not decode result data"

**原因：** 合約地址不正確或合約未部署

**解決方案：**
1. 檢查 `.env.local` 中的 `NEXT_PUBLIC_ARC_CONTRACT_ADDRESS`
2. 使用 cast 驗證合約是否存在：
   ```bash
   cast code $CONTRACT_ADDRESS --rpc-url https://rpc.testnet.arc.network
   ```
   如果返回 `0x`，表示合約不存在

---

### 問題 2: "Insufficient funds for gas"

**原因：** 部署錢包沒有足夠的 ARC 測試幣

**解決方案：**
1. 從 Arc Faucet 獲取更多測試幣
2. 或使用不同的錢包

---

### 問題 3: "Invalid signature"

**原因：** Aegis Server 錢包地址與後端私鑰不匹配

**解決方案：**
1. 檢查後端 `.env` 中的 `SERVER_WALLET_PRIVATE_KEY`
2. 確認對應的地址是否與合約中的 `AEGIS_SERVER_WALLET` 一致
3. 使用以下命令驗證：
   ```bash
   # 從私鑰獲取地址
   cast wallet address --private-key $SERVER_WALLET_PRIVATE_KEY
   ```

---

### 問題 4: "Network mismatch"

**原因：** MetaMask 連接的網路與合約不同

**解決方案：**
1. 打開 MetaMask
2. 切換到 Arc Testnet
3. 如果沒有 Arc Testnet，手動添加：
   - Network Name: Arc Testnet
   - RPC URL: https://rpc.testnet.arc.network
   - Chain ID: 5042002
   - Currency Symbol: ARC

---

## 📝 部署檢查清單

部署前確認：
- [ ] 創建了部署錢包（有私鑰）
- [ ] 創建了 Aegis Server 錢包（有私鑰和地址）
- [ ] 部署錢包有足夠的 ARC 測試幣（≥0.1 ARC）
- [ ] `contracts/.env` 已配置 `PRIVATE_KEY` 和 `AEGIS_SERVER_WALLET`
- [ ] `backend/.env` 已配置 `SERVER_WALLET_PRIVATE_KEY` 和 `AEGIS_SERVER_WALLET`
- [ ] Supabase 已設置並配置在前端

部署後確認：
- [ ] 合約部署成功（有合約地址）
- [ ] `frontend/.env.local` 已更新合約地址
- [ ] `backend/.env` 已更新合約地址
- [ ] 後端能成功連接到合約（檢查日誌）
- [ ] 前端能讀取池狀態（訪問 /lp 頁面）
- [ ] 測試 LP 存款功能正常

---

## 🔐 安全提醒

⚠️ **重要安全事項：**

1. **永遠不要提交私鑰到 Git**
   - `.env` 文件已在 `.gitignore` 中
   - 仔細檢查 `git status` 確保沒有意外提交

2. **測試錢包與主錢包分離**
   - 使用獨立的測試錢包
   - 不要在測試網使用真實資金的錢包

3. **私鑰備份**
   - 將私鑰安全保存在密碼管理器
   - 不要以明文方式分享私鑰

4. **Aegis Server 錢包保護**
   - 後端伺服器應在安全環境運行
   - 考慮使用環境變數注入而非 `.env` 文件

---

## 📚 參考資料

- Arc Network 文檔: [Arc 官方網站]
- Hardhat 文檔: https://hardhat.org/
- EIP-712 簽名: https://eips.ethereum.org/EIPS/eip-712

---

## 🆘 需要幫助？

如果遇到問題：

1. 檢查後端日誌：`npm run start:dev` 的輸出
2. 檢查瀏覽器 Console（F12）
3. 使用 `cast` 命令直接查詢合約
4. 參考 `API_AND_TESTING_GUIDE.md` 中的故障排除部分

**部署成功後，你就可以開始完整的測試流程了！** 🎉
