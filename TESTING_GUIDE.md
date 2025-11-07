# Aegis Finance - 測試指南

## 📋 目錄
1. [系統架構](#系統架構)
2. [整體流程](#整體流程)
3. [測試前準備](#測試前準備)
4. [完整測試流程](#完整測試流程)
5. [常見問題](#常見問題)

---

## 🏗️ 系統架構

Aegis Finance 是一個基於 Arc 區塊鏈的供應鏈金融平台，包含三個主要角色：

### 角色說明

1. **Liquidity Provider (LP)** - 流動性提供者
   - 提供 USDC 資金池
   - 賺取利息收益（90% 的融資利息）
   - 可隨時存款/提款（需扣除已使用的資金）

2. **Supplier** - 供應商
   - 上傳發票
   - 查看融資報價
   - 提前獲得資金（扣除融資費用）

3. **Buyer** - 買方
   - 審核並批准/拒絕發票
   - 在到期日還款給資金池
   - 管理應付帳款

### 技術架構

```
Frontend (Next.js 14)
    ↓
Supabase (PostgreSQL) ← 發票數據存儲
    ↓
Smart Contract (ArcPool.sol on Arc Testnet)
    ↓
Arc Network (USDC native)
```

---

## 🔄 整體流程

### 完整業務流程圖

```
1. LP 存入資金
   └─> 資金池: 10,000 USDC
        │
2. Supplier 創建發票
   └─> 發票: 1,000 USDC, 30天到期
        │
3. Buyer 批准發票
   └─> 狀態: PENDING → APPROVED
        │
4. Aegis Server 生成融資簽名
   └─> EIP-712 signature (後端自動)
        │
5. Supplier 接受融資並提取資金
   └─> 獲得: ~970 USDC (扣除 3% 融資費)
   └─> 資金池: 9,000 USDC (可用)
        │
6. Buyer 在到期日還款
   └─> 還款: 1,000 USDC → 資金池
   └─> 資金池: 10,030 USDC
        │
7. LP 提款本金+利息
   └─> 提取: 10,027 USDC (90% 利息歸 LP)
```

---

## 🛠️ 測試前準備

### 1. 部署智能合約

```bash
cd contracts
npm install

# 部署到 Arc Testnet
npx hardhat run scripts/deploy.js --network arcTestnet

# 記錄合約地址並更新 .env 文件
```

### 2. 配置環境變數

**Frontend (.env.local)**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 合約地址（從部署輸出複製）
NEXT_PUBLIC_ARC_CONTRACT_ADDRESS=0x...

# Arc Network
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_ID=5042002

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

**Backend (.env)**
```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key

# Aegis Server Wallet（用於簽署融資請求）
SERVER_WALLET_PRIVATE_KEY=0x...
AEGIS_SERVER_WALLET=0x...

# Arc Network
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_CONTRACT_ADDRESS=0x...
ARC_CHAIN_ID=5042002
```

### 3. 設置資料庫

在 Supabase 執行：

```sql
-- 創建 invoices 表
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL,
  supplier_address TEXT NOT NULL,
  buyer_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  aegis_signature TEXT,
  financing_rate NUMERIC,
  financing_amount NUMERIC,
  financing_tx_hash TEXT,
  repayment_tx_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 創建索引
CREATE INDEX idx_invoices_supplier ON invoices(supplier_address);
CREATE INDEX idx_invoices_buyer ON invoices(buyer_address);
CREATE INDEX idx_invoices_status ON invoices(status);
```

### 4. 準備測試錢包

你需要準備 **3 個不同的錢包地址**：

1. **LP 錢包** - 有足夠的 USDC（例如 10,000 USDC）
2. **Supplier 錢包** - 少量 USDC 用於 gas
3. **Buyer 錢包** - 足夠的 USDC 用於還款（例如 5,000 USDC）

⚠️ **重要**：確保你的錢包有 Arc Testnet 上的 USDC！

### 5. 授予 Aegis Server AEGIS_ROLE

```bash
cd contracts

# 使用 Hardhat console
npx hardhat console --network arcTestnet

# 在 console 中執行
const ArcPool = await ethers.getContractFactory("ArcPool");
const pool = await ArcPool.attach("0xYOUR_CONTRACT_ADDRESS");
const AEGIS_ROLE = await pool.AEGIS_ROLE();
await pool.grantRole(AEGIS_ROLE, "0xYOUR_AEGIS_SERVER_WALLET");
```

---

## 🧪 完整測試流程

### Phase 1: LP 提供流動性

**目標**: LP 存入 10,000 USDC 到資金池

1. 使用 **LP 錢包**連接
2. 前往 **LP Portal** (`/lp`)
3. 查看初始狀態：
   - Total Pool Size: 0 USDC
   - Your LP Balance: 0 USDC
   - Available Liquidity: 0 USDC

4. **存款操作**：
   - 輸入金額：`10000`
   - 點擊 "Deposit"
   - 確認錢包交易（會轉移 10,000 USDC）
   - 等待交易確認

5. **驗證結果**：
   - Total Pool Size: 10,000 USDC ✅
   - Your LP Balance: 10,000 USDC ✅
   - Available Liquidity: 10,000 USDC ✅

---

### Phase 2: Supplier 創建發票

**目標**: Supplier 創建一張 1,000 USDC 的發票

1. 切換到 **Supplier 錢包**
2. 前往 **Supplier Portal** (`/supplier`)
3. 查看初始狀態：
   - Total Invoices: 0
   - Pending Financing: 0 USDC

4. **創建發票**（需要手動在 Supabase 插入）：

```sql
INSERT INTO invoices (
  invoice_number,
  supplier_address,
  buyer_address,
  amount,
  due_date,
  status
) VALUES (
  'INV-001',
  '0xYOUR_SUPPLIER_ADDRESS',
  '0xYOUR_BUYER_ADDRESS',
  1000,
  NOW() + INTERVAL '30 days',
  'PENDING'
);
```

5. **重新整理頁面**，應該看到：
   - 新發票出現在列表中
   - Status: Pending Approval
   - Amount: 1,000 USDC
   - 無法接受融資（需要 Buyer 批准）

---

### Phase 3: Buyer 批准發票

**目標**: Buyer 審核並批准發票

1. 切換到 **Buyer 錢包**
2. 前往 **Buyer Portal** (`/buyer`)
3. 切換到 **"Pending"** tab
4. 應該看到 Supplier 創建的發票

5. **批准發票**：
   - 點擊發票卡片上的 "Approve" 按鈕
   - 確認操作
   - 等待 Supabase 更新

6. **驗證結果**：
   - 發票狀態變為 "Approved" ✅
   - 發票移動到 "Approved" tab ✅

⚠️ **注意**：在實際生產環境中，批准操作會觸發後端 API，生成 Aegis 簽名（EIP-712）。目前的實作只是簡單更新狀態。

---

### Phase 4: Supplier 接受融資

**目標**: Supplier 提取融資款項

1. 回到 **Supplier 錢包**
2. 重新整理 Supplier Portal
3. 找到已批准的發票
4. 查看融資報價：
   - Original Amount: 1,000 USDC
   - Financing Rate: 3%
   - You Receive: ~970 USDC
   - Due Date: 30 days

5. **接受融資**：
   - 點擊 "Accept Financing" 按鈕
   - 確認智能合約交易
   - 等待交易確認（約 10-30 秒）

6. **驗證結果**：
   - Supplier 錢包收到 ~970 USDC ✅
   - 發票狀態變為 "Financed" ✅
   - 資金池可用餘額: 9,000 USDC ✅
   - 交易哈希記錄在發票中 ✅

⚠️ **重要限制**：
- 目前前端實作需要 **手動輸入** Aegis 簽名參數（v, r, s）
- 生產環境應該從後端 API 獲取簽名
- 你需要實作後端 `/financing/sign` endpoint 來生成簽名

**臨時解決方案** - 在瀏覽器 Console 生成簽名：

```javascript
// 這需要 Aegis Server 的私鑰
// 在生產環境中，這應該在後端完成！
const domain = {
  name: "ArcPool",
  version: "1",
  chainId: 5042002,
  verifyingContract: "0xYOUR_CONTRACT_ADDRESS"
};

const types = {
  FinancingRequest: [
    { name: "invoiceId", type: "bytes32" },
    { name: "supplier", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "financingAmount", type: "uint256" },
    { name: "repaymentAmount", type: "uint256" },
    { name: "dueDate", type: "uint256" },
    { name: "nonce", type: "uint256" }
  ]
};

const message = {
  invoiceId: "0x...",
  supplier: "0xYOUR_SUPPLIER_ADDRESS",
  amount: "1000000000", // 1000 USDC (6 decimals)
  financingAmount: "970000000",
  repaymentAmount: "1000000000",
  dueDate: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
  nonce: 1
};

// 使用 Aegis Server 錢包簽署
const signature = await aegisWallet._signTypedData(domain, types, message);
const { v, r, s } = ethers.utils.splitSignature(signature);
```

---

### Phase 5: Buyer 還款

**目標**: Buyer 在到期日還款

1. 切換到 **Buyer 錢包**
2. 前往 Buyer Portal
3. 切換到 **"Repayment"** tab
4. 應該看到需要還款的發票

5. **執行還款**：
   - 點擊 "Repay" 按鈕
   - 確認智能合約交易（轉移 1,000 USDC 到資金池）
   - 等待交易確認

6. **驗證結果**：
   - 發票狀態變為 "Paid" ✅
   - 資金池總額: 10,030 USDC ✅
   - 資金池可用餘額: 10,030 USDC ✅
   - LP 可提取利息: ~27 USDC (30 USDC × 90%)

---

### Phase 6: LP 提取利息

**目標**: LP 提取本金和利息

1. 切換回 **LP 錢包**
2. 前往 LP Portal
3. 查看更新後的數據：
   - Total Pool Size: 10,030 USDC
   - Your LP Balance: 10,030 USDC
   - Interest Earned: ~27 USDC

4. **提款操作**：
   - 輸入提款金額：`10030`（或部分金額）
   - 點擊 "Withdraw"
   - 確認交易
   - 等待確認

5. **驗證結果**：
   - LP 錢包收到 10,030 USDC ✅
   - 總收益: 30 USDC ✅
   - 資金池清空 ✅

---

## 🎯 快速測試清單

使用此清單快速驗證所有功能：

### ✅ LP Portal
- [ ] 連接 LP 錢包
- [ ] 查看資金池狀態（初始為 0）
- [ ] 存款 10,000 USDC
- [ ] 驗證餘額更新
- [ ] 查看利息累積（在有融資後）
- [ ] 提款部分資金
- [ ] 提款全部資金

### ✅ Supplier Portal
- [ ] 連接 Supplier 錢包
- [ ] 查看發票列表（初始為空）
- [ ] 創建新發票（通過 Supabase）
- [ ] 看到 "Pending Approval" 狀態
- [ ] 等待 Buyer 批准
- [ ] 查看融資報價
- [ ] 接受融資並提取資金
- [ ] 驗證收到資金（扣除費用）
- [ ] 確認發票狀態變為 "Financed"

### ✅ Buyer Portal
- [ ] 連接 Buyer 錢包
- [ ] 查看 "Pending" tab
- [ ] 批准發票
- [ ] 查看 "Approved" tab
- [ ] 等待 Supplier 提取融資
- [ ] 查看 "Repayment" tab
- [ ] 執行還款
- [ ] 確認發票移動到 "Paid" tab

### ✅ 智能合約驗證
- [ ] 檢查資金池總額
- [ ] 檢查可用流動性
- [ ] 檢查已使用金額
- [ ] 檢查 LP 餘額
- [ ] 檢查發票是否已融資
- [ ] 檢查利息計算正確

---

## ❓ 常見問題

### Q1: 錢包連接後沒有顯示數據？

**A**: 檢查以下幾點：
1. 確保使用正確的錢包地址
2. 檢查 Supabase 中發票的 `supplier_address` 或 `buyer_address` 是否匹配
3. 重新整理頁面
4. 打開瀏覽器 Console 查看錯誤訊息

### Q2: 交易失敗 "insufficient funds"？

**A**:
- 確保錢包有足夠的 USDC
- Arc Network 使用 USDC 作為 gas，需要有額外的 USDC 支付交易費
- 建議錢包至少保留 10-20 USDC 作為 gas 費用

### Q3: "Unrecognized chain ID" 錯誤？

**A**:
- 確保 `.env.local` 中的 `NEXT_PUBLIC_ARC_CHAIN_ID=5042002`
- 確保 `wagmi/config.ts` 中的 chain ID 也是 `5042002`
- 重新啟動開發伺服器

### Q4: Aegis 簽名在哪裡生成？

**A**:
- **目前**: 需要手動生成或實作後端 API
- **計劃**: 後端應該提供 `/api/financing/sign` endpoint
- **實作**: 使用 EIP-712 簽署，包含發票詳情
- **安全**: 只有擁有 `AEGIS_ROLE` 的地址才能簽署

### Q5: 如何重置測試環境？

**A**:
```sql
-- 清空所有發票
TRUNCATE TABLE invoices;

-- 重新部署合約（可選）
cd contracts
npx hardhat run scripts/deploy.js --network arcTestnet
```

### Q6: LP 無法提款？

**A**:
- 檢查是否有資金被鎖定（已融資但未還款的發票）
- 可用流動性 = 總額 - 已使用
- 只能提取可用流動性部分

### Q7: 發票狀態沒有更新？

**A**:
- 確保 Supabase 連接正常
- 檢查瀏覽器 Network tab 是否有錯誤
- 手動重新整理頁面
- 檢查 Supabase 的 Row Level Security (RLS) 政策

### Q8: 合約調用失敗？

**A**:
- 檢查合約地址是否正確
- 確認 ARC_CONTRACT_ADDRESS 在 `.env.local` 中已設置
- 確認錢包在正確的網路（Arc Testnet, Chain ID 5042002）
- 檢查是否有足夠的 gas

---

## 🔍 除錯技巧

### 1. 檢查瀏覽器 Console

```javascript
// 查看當前連接的錢包
console.log("Connected address:", window.ethereum.selectedAddress);

// 查看當前網路
console.log("Chain ID:", await window.ethereum.request({ method: 'eth_chainId' }));

// 查看 USDC 餘額（需要合約 ABI）
const balance = await usdcContract.balanceOf(address);
console.log("USDC Balance:", ethers.utils.formatUnits(balance, 6));
```

### 2. 查看智能合約狀態

使用 Hardhat Console：

```bash
npx hardhat console --network arcTestnet

# 查看資金池狀態
const pool = await ethers.getContractAt("ArcPool", "0xYOUR_ADDRESS");
const status = await pool.getPoolStatus();
console.log("Total:", status.total.toString());
console.log("Available:", status.available.toString());
console.log("Utilized:", status.utilized.toString());

# 查看 LP 餘額
const lpBalance = await pool.getLPBalance("0xLP_ADDRESS");
console.log("LP Balance:", lpBalance.toString());

# 檢查發票是否已融資
const invoiceId = ethers.utils.id("INV-001");
const isFinanced = await pool.isInvoiceFinanced(invoiceId);
console.log("Is Financed:", isFinanced);
```

### 3. 監聽合約事件

```javascript
// 在前端監聽 Deposit 事件
pool.on("Deposit", (lp, amount, newTotal, event) => {
  console.log("Deposit Event:", {
    lp,
    amount: ethers.utils.formatUnits(amount, 6),
    newTotal: ethers.utils.formatUnits(newTotal, 6),
    txHash: event.transactionHash
  });
});

// 監聽 FinancingWithdrawn 事件
pool.on("FinancingWithdrawn", (invoiceId, supplier, amount, timestamp, event) => {
  console.log("Financing Event:", {
    invoiceId,
    supplier,
    amount: ethers.utils.formatUnits(amount, 6),
    timestamp: new Date(timestamp.toNumber() * 1000),
    txHash: event.transactionHash
  });
});
```

---

## 📊 測試數據範例

### 典型測試場景

| 角色 | 地址 | 初始 USDC | 操作 | 最終 USDC |
|------|------|-----------|------|-----------|
| LP | 0xLP... | 10,000 | 存入 10,000 → 提取 10,030 | 10,030 (+30) |
| Supplier | 0xSup... | 0 | 接受融資 | 970 |
| Buyer | 0xBuy... | 5,000 | 還款 1,000 | 4,000 (-1,000) |
| Aegis (平台) | 0xAegis... | 0 | 收取 10% 利息 | 3 |

### 多發票場景

```
LP 存入: 100,000 USDC

發票 #1: 10,000 USDC @ 3% for 30 days → 融資 9,700
發票 #2: 20,000 USDC @ 2.5% for 60 days → 融資 19,500
發票 #3: 15,000 USDC @ 3.5% for 45 days → 融資 14,475

已使用流動性: 45,000 USDC
可用流動性: 55,000 USDC

所有發票還款後:
總利息: 10,000×0.03 + 20,000×0.025 + 15,000×0.035 = 1,325 USDC
LP 收益: 1,325 × 90% = 1,192.5 USDC
平台收益: 1,325 × 10% = 132.5 USDC
```

---

## 🚀 下一步

完成基本測試後，可以考慮：

1. **實作後端 API**
   - `/api/financing/sign` - 生成 Aegis 簽名
   - `/api/invoices` - CRUD 操作
   - `/api/pricing` - 動態定價引擎

2. **增強前端功能**
   - 發票創建表單
   - 實時數據更新（WebSocket）
   - 交易歷史記錄
   - 數據圖表和分析

3. **安全加固**
   - 實作適當的 RLS 政策
   - 添加速率限制
   - 實作簽名驗證

4. **測試覆蓋**
   - 單元測試（Hardhat）
   - 整合測試（前後端）
   - E2E 測試（Cypress/Playwright）

---

## 📝 結論

Aegis Finance 提供了一個完整的供應鏈金融解決方案。通過遵循此測試指南，你可以驗證所有核心功能是否正常運作。

如果遇到問題，請查看：
- 瀏覽器 Console 的錯誤訊息
- Supabase 的日誌
- 智能合約的事件
- 錢包的交易歷史

祝測試順利！🎉
