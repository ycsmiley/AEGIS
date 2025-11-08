# 🧪 測試前檢查清單與快速測試指南

## ✅ 測試前檢查

### 1. 後端檢查

```bash
# 啟動後端
cd backend
npm run start:dev

# 在新終端檢查健康狀態
curl http://localhost:3001/api/health

# 預期輸出：
# {"status":"ok","timestamp":"...","service":"Aegis Finance Backend","version":"1.0.0"}
```

**檢查後端日誌應該看到：**
```
[NestApplication] Nest application successfully started
[BlockchainService] Blockchain service initialized successfully
[AegisService] Hugging Face AI integration enabled  (如果有設置 HF token)
🚀 Aegis Finance Backend running on: http://localhost:3001
```

**常見問題：**
- ❌ "Cannot find module" → 運行 `npm install`
- ❌ "Blockchain service not initialized" → 檢查 `ARC_CONTRACT_ADDRESS` 是否正確
- ❌ "Supabase connection failed" → 檢查 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY`

---

### 2. 前端檢查

```bash
# 啟動前端
cd frontend
npm run dev

# 訪問
# http://localhost:3000
```

**檢查前端應該能訪問：**
- ✅ http://localhost:3000 (首頁)
- ✅ http://localhost:3000/lp (LP 頁面)
- ✅ http://localhost:3000/supplier (供應商頁面)
- ✅ http://localhost:3000/buyer (買方頁面)

**常見問題：**
- ❌ 白屏或錯誤 → 檢查瀏覽器 Console (F12)
- ❌ "Cannot connect to wallet" → 確認 RainbowKit 配置
- ❌ "Cannot read pool status" → 檢查 `NEXT_PUBLIC_ARC_CONTRACT_ADDRESS`

---

### 3. 環境變數檢查

#### Backend `.env` 必須有：
```env
✅ SUPABASE_URL=https://...
✅ SUPABASE_SERVICE_KEY=eyJ...
✅ SERVER_WALLET_PRIVATE_KEY=0x...
✅ AEGIS_SERVER_WALLET=0x...
✅ ARC_CONTRACT_ADDRESS=0x...  (你剛部署的合約地址)
✅ ARC_RPC_URL=https://rpc.testnet.arc.network
✅ ARC_CHAIN_ID=5042002
```

#### Frontend `.env.local` 必須有：
```env
✅ NEXT_PUBLIC_SUPABASE_URL=https://...
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
✅ NEXT_PUBLIC_ARC_CONTRACT_ADDRESS=0x...  (你剛部署的合約地址)
✅ NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
✅ NEXT_PUBLIC_ARC_CHAIN_ID=5042002
```

---

### 4. Supabase 檢查

訪問你的 Supabase Dashboard，確認：
- ✅ `invoices` 表已創建
- ✅ 表有以下欄位：
  - id, invoice_number, supplier_address, buyer_address, amount, due_date, status
  - aegis_signature, aegis_payout_offer, aegis_repayment_amount, aegis_discount_rate
  - aegis_risk_score, aegis_pricing_explanation
  - created_at, updated_at

---

### 5. 錢包檢查

確保你有 **3 個測試錢包**：

| 錢包 | 需要 | 用途 |
|------|------|------|
| **LP** | ARC gas + 一些 USDC/原生幣 | 提供流動性 |
| **Supplier** | ARC gas | 創建發票、提取融資 |
| **Buyer** | ARC gas + USDC | 批准發票、還款 |

**MetaMask 設置：**
- Network Name: Arc Testnet
- RPC URL: https://rpc.testnet.arc.network
- Chain ID: 5042002
- Currency Symbol: ARC

---

## 🚀 5 分鐘快速測試流程

### 準備階段 (1 分鐘)

1. **確認服務運行中**
   ```bash
   # 終端 1: 後端
   cd backend && npm run start:dev

   # 終端 2: 前端
   cd frontend && npm run dev
   ```

2. **打開瀏覽器**
   - http://localhost:3000

3. **準備 3 個錢包**
   - 在 MetaMask 中切換到 Arc Testnet

---

### 測試 1: LP 存入流動性 (1 分鐘)

**目標：** LP 存入 1 USDC（或等值的原生幣）

1. 訪問 http://localhost:3000/lp
2. 點擊 "Connect Wallet"，選擇 LP 錢包
3. 應該看到：
   ```
   Total Pool Size: 0 USDC
   Available Liquidity: 0 USDC
   Your LP Balance: 0 USDC
   ```
4. 在 "Deposit" 區域輸入：`1`
5. 點擊 "Deposit USDC"
6. MetaMask 彈出 → 確認交易
7. 等待確認（約 10-30 秒）

**✅ 成功標誌：**
```
Total Pool Size: 1.0 USDC
Available Liquidity: 1.0 USDC
Your LP Balance: 1.0 USDC
```

**❌ 如果失敗：**
- "Insufficient funds" → LP 錢包沒有足夠的 USDC
- "Transaction reverted" → 檢查合約地址是否正確
- "Network error" → 檢查 RPC URL

---

### 測試 2: 供應商創建發票 (1 分鐘)

**目標：** 創建 0.5 USDC 的發票，獲取 AI 定價

1. 訪問 http://localhost:3000/supplier
2. 連接 Supplier 錢包
3. 點擊 "Create Invoice"
4. 填寫表單：
   ```
   Invoice Number: TEST-001
   Buyer Address: <你的 Buyer 錢包地址>
   Amount: 0.5
   Due Date: <選擇 60 天後>
   Buyer Rating: 85
   Supplier Rating: 90
   ```
5. 點擊 "Create Invoice"
6. 等待 AI 分析（3-5 秒）

**✅ 成功標誌：**
```
✅ Invoice created successfully

Invoice Details:
- Invoice Number: TEST-001
- Status: PENDING
- Amount: 0.5 USDC
- Payout Offer: ~0.49 USDC
- Discount Rate: ~2%
- Risk Score: 87/100

🤖 AI-Powered Pricing:
Applied 2.00% discount rate based on:
• Payment term: 60 days
• Pool liquidity: Abundant
• Average credit rating: 87/100
• Rule-based risk score: 88/100
```

**❌ 如果失敗：**
- "Backend error" → 檢查後端是否運行 (`curl http://localhost:3001/api/health`)
- "Supabase error" → 檢查 Supabase 配置
- AI 分析很慢 → 正常，HF API 可能需要 5-10 秒

---

### 測試 3: 買方批准發票 (30 秒)

**目標：** 買方批准發票，生成 Aegis 簽名

1. 訪問 http://localhost:3000/buyer
2. 連接 Buyer 錢包
3. 應該看到 "TEST-001" 發票，狀態 "PENDING"
4. 點擊 "Approve"
5. 確認批准

**✅ 成功標誌：**
```
✅ Invoice approved

Status: APPROVED
Aegis Signature: 0x1234...
Supplier can now withdraw financing
```

**檢查後端日誌應該看到：**
```
[InvoiceService] Approving invoice <uuid>
[AegisService] Generating Aegis signature for invoice <uuid>
[AegisService] Signature generated successfully
```

---

### 測試 4: 供應商提取融資 (30 秒)

**目標：** 供應商使用 Aegis 簽名提取 0.49 USDC

1. 回到 http://localhost:3000/supplier
2. 連接 Supplier 錢包
3. 看到 "TEST-001" 狀態變為 "APPROVED"
4. 點擊 "Withdraw Financing"
5. MetaMask 彈出 → 確認交易
6. 等待確認

**✅ 成功標誌：**
```
✅ Financing withdrawn successfully

You received: 0.49 USDC

Pool Status:
- Available Liquidity: 0.51 USDC (1.0 - 0.49)
- Utilized: 0.49 USDC
- Utilization Rate: 49%

Invoice Status: FINANCED
```

**檢查 Supplier 錢包：**
- USDC 餘額應該增加 ~0.49

---

### 測試 5: 買方還款 (30 秒)

**目標：** 買方還款 0.5 USDC

1. 訪問 http://localhost:3000/buyer
2. 連接 Buyer 錢包
3. 切換到 "Financed" tab
4. 看到 "TEST-001"
5. 點擊 "Repay Invoice"
6. 確認支付 0.5 USDC

**✅ 成功標誌：**
```
✅ Repayment successful

Payment Details:
- Principal: 0.5 USDC
- Interest: 0.01 USDC (2%)
- Total Paid: 0.5 USDC

Interest Distribution:
- LP Share (90%): 0.009 USDC
- Protocol Share (10%): 0.001 USDC

Pool Status:
- Available Liquidity: 1.009 USDC
```

---

### 測試 6: LP 提取收益 (30 秒)

**目標：** LP 提取本金 + 利息

1. 訪問 http://localhost:3000/lp
2. 連接 LP 錢包
3. 應該看到：
   ```
   Your LP Balance: 1.009 USDC
   Total Interest Earned: 0.01 USDC
   Your Share: 0.009 USDC
   ```
4. 在 "Withdraw" 輸入：`1.009`
5. 點擊 "Withdraw USDC"
6. 確認交易

**✅ 成功標誌：**
```
✅ Withdrawal successful

Received:
- Original: 1.0 USDC
- Profit: 0.009 USDC
- Total: 1.009 USDC
- ROI: 0.9%
```

---

## 🎉 測試完成！

如果所有 6 個測試都成功，恭喜你！系統完全正常運行。

你已經成功測試了：
- ✅ LP 流動性管理
- ✅ AI 動態定價
- ✅ 發票審批流程
- ✅ EIP-712 簽名驗證
- ✅ 智能合約互動
- ✅ 利息分配機制

---

## 🐛 故障排除快速參考

### Backend 相關

**問題：** Backend 無法啟動
```bash
# 重新安裝依賴
cd backend
rm -rf node_modules package-lock.json
npm install

# 檢查環境變數
cat .env | grep -E "SUPABASE|ARC_CONTRACT|AEGIS"
```

**問題：** "Blockchain service not initialized"
```bash
# 檢查合約地址
echo $ARC_CONTRACT_ADDRESS

# 測試 RPC 連接
cast block latest --rpc-url https://rpc.testnet.arc.network
```

---

### Frontend 相關

**問題：** 前端無法連接錢包
```bash
# 檢查環境變數
cat frontend/.env.local | grep NEXT_PUBLIC

# 確認 RainbowKit 配置
# 檢查 frontend/src/app/providers.tsx
```

**問題：** "Cannot read pool status"
```bash
# 直接查詢合約
cast call $CONTRACT_ADDRESS "getPoolStatus()" \
  --rpc-url https://rpc.testnet.arc.network

# 應該返回 4 個 uint256
```

---

### 智能合約相關

**問題：** 交易失敗
```bash
# 檢查錢包餘額
cast balance $YOUR_ADDRESS --rpc-url https://rpc.testnet.arc.network

# 檢查合約狀態
cast call $CONTRACT_ADDRESS "getPoolStatus()" \
  --rpc-url https://rpc.testnet.arc.network
```

---

## 📊 監控儀表板

### 後端健康檢查
```bash
# 健康狀態
curl http://localhost:3001/api/health

# API 文檔
curl http://localhost:3001/api/docs | jq '.'

# 查看日誌
# 在運行 npm run start:dev 的終端查看
```

### 區塊鏈查詢
```bash
# 池狀態
cast call $CONTRACT_ADDRESS "getPoolStatus()" \
  --rpc-url https://rpc.testnet.arc.network

# LP 餘額
cast call $CONTRACT_ADDRESS "getLPBalance(address)" $LP_ADDRESS \
  --rpc-url https://rpc.testnet.arc.network

# 發票是否已融資
cast call $CONTRACT_ADDRESS "isInvoiceFinanced(bytes32)" $INVOICE_ID_HASH \
  --rpc-url https://rpc.testnet.arc.network
```

---

## 🎯 下一步

測試成功後，你可以：

1. **準備 Demo**
   - 錄製測試流程視頻
   - 準備 Pitch Deck
   - 準備 README 和文檔

2. **優化體驗**
   - 調整 UI/UX
   - 添加加載動畫
   - 改進錯誤提示

3. **安全審查**
   - 檢查私鑰是否安全存儲
   - 確認沒有私鑰提交到 Git
   - 測試異常情況處理

4. **性能測試**
   - 測試並發融資請求
   - 測試流動性不足情況
   - 測試簽名過期處理

祝你 Hackathon 順利！🚀
