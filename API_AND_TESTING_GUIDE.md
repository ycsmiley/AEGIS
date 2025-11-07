# Aegis Finance - API 規格與測試指南

## 目錄
1. [系統架構概述](#系統架構概述)
2. [API 規格](#api-規格)
3. [智能合約接口](#智能合約接口)
4. [測試環境設置](#測試環境設置)
5. [完整測試流程](#完整測試流程)
6. [故障排除](#故障排除)

---

## 系統架構概述

Aegis Finance 是一個基於 Arc 區塊鏈的發票融資平台，包含三個主要角色：

- **供應商 (Supplier)**: 上傳發票並申請融資
- **買方 (Buyer)**: 批准發票並進行還款
- **流動性提供者 (LP)**: 提供資金並賺取利息

### 技術棧
- **前端**: Next.js 14, React, TailwindCSS, RainbowKit, Wagmi
- **後端**: NestJS, TypeScript
- **數據庫**: Supabase (PostgreSQL)
- **區塊鏈**: Arc Testnet
- **AI**: Hugging Face (Mistral-7B-Instruct)

---

## API 規格

### Base URL
```
Backend: http://localhost:3001
Frontend: http://localhost:3000
```

### 1. Health Check

#### GET `/health`
檢查後端服務狀態

**Request:**
```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-07T15:30:00.000Z",
  "service": "Aegis Finance Backend",
  "version": "1.0.0"
}
```

---

### 2. Invoice APIs

#### POST `/api/invoices`
創建新發票並獲取 AI 定價報價

**Request Body:**
```json
{
  "invoice_number": "INV-001",
  "supplier_address": "0x1234...5678",
  "buyer_address": "0xabcd...ef01",
  "amount": 10000,
  "due_date": "2024-12-31T23:59:59.000Z",
  "buyer_rating": 85,
  "supplier_rating": 90
}
```

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| invoice_number | string | Yes | - | 發票編號（唯一） |
| supplier_address | string | Yes | - | 供應商錢包地址 |
| buyer_address | string | Yes | - | 買方錢包地址 |
| amount | number | Yes | - | 發票金額（USDC，6 decimals） |
| due_date | string | Yes | - | 到期日期（ISO 8601） |
| buyer_rating | number | No | 75 | 買方信用評分（0-100） |
| supplier_rating | number | No | 75 | 供應商信用評分（0-100） |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "invoice_number": "INV-001",
    "supplier_address": "0x1234...5678",
    "buyer_address": "0xabcd...ef01",
    "amount": 10000,
    "due_date": "2024-12-31T23:59:59.000Z",
    "status": "PENDING",
    "aegis_payout_offer": 9800,
    "aegis_repayment_amount": 10000,
    "aegis_discount_rate": 0.02,
    "aegis_risk_score": 85.5,
    "aegis_pricing_explanation": "🤖 AI-Powered Pricing: Applied 2.00% discount rate based on:\n• Payment term: 60 days\n• Pool liquidity: Moderate\n• Average credit rating: 87/100\n• Rule-based risk score: 86/100\n• AI risk prediction: 85/100\n• Analysis powered by Hugging Face Mistral-7B",
    "created_at": "2024-11-07T15:30:00.000Z"
  }
}
```

**AI 定價說明:**
- `aegis_payout_offer`: AI 計算的即時支付金額（扣除折扣後）
- `aegis_repayment_amount`: 到期需還款金額（原始發票金額）
- `aegis_discount_rate`: AI 計算的折扣率（考慮風險、流動性、信用評分）
- `aegis_risk_score`: 基於規則的風險評分
- `aegis_pricing_explanation`: 包含 AI 分析的詳細定價解釋

---

#### POST `/api/invoices/:id/quote`
重新計算發票的融資報價（更新信用評分後）

**URL Parameters:**
- `id`: 發票 UUID

**Request Body:**
```json
{
  "buyer_rating": 90,
  "supplier_rating": 85
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payoutAmount": 9850,
    "repaymentAmount": 10000,
    "discountRate": 0.015,
    "riskScore": 88.2,
    "aiRiskScore": 87.5,
    "daysUntilDue": 54,
    "explanation": "🤖 AI-Powered Pricing: Applied 1.50% discount rate based on:..."
  }
}
```

---

#### POST `/api/invoices/:id/approve`
買方批准發票（自動生成 Aegis 簽名）

**URL Parameters:**
- `id`: 發票 UUID

**Request:** 無需 body

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "status": "APPROVED",
    "aegis_signature": "0x1234567890abcdef...",
    "aegis_nonce": 1699368600000,
    "aegis_deadline": 1699372200,
    "aegis_due_date": 1704067199,
    "updated_at": "2024-11-07T15:31:00.000Z"
  }
}
```

**註:** 批准後自動生成 EIP-712 簽名，供應商可使用此簽名從智能合約提取融資款項。

---

#### POST `/api/invoices/:id/sign`
手動生成 Aegis 簽名（通常不需要，批准時自動生成）

**URL Parameters:**
- `id`: 發票 UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "signature": "0x1234567890abcdef...",
    "nonce": 1699368600000,
    "deadline": 1699372200,
    "repaymentAmount": 10000,
    "dueDate": 1704067199
  }
}
```

---

#### GET `/api/invoices`
查詢發票列表（目前透過 Supabase 前端直接查詢）

**Response:**
```json
{
  "success": true,
  "message": "Use Supabase client in frontend for querying invoices"
}
```

**註:** 前端直接使用 Supabase Client 查詢，支持過濾：
```javascript
// 查詢供應商的發票
await supabase
  .from('invoices')
  .select('*')
  .eq('supplier_address', address)
  .order('created_at', { ascending: false });

// 查詢買方的發票
await supabase
  .from('invoices')
  .select('*')
  .eq('buyer_address', address)
  .order('created_at', { ascending: false });

// 按狀態過濾
await supabase
  .from('invoices')
  .select('*')
  .eq('status', 'PENDING');
```

---

## 智能合約接口

### Contract Address
```
Arc Testnet: (從環境變數獲取)
ABI: frontend/src/contracts/ArcPool.json
```

### 1. LP (流動性提供者) 函數

#### `deposit()` - payable
存入 USDC 到流動性池

**Parameters:** None (發送 USDC 金額)

**Example:**
```javascript
await writeContract({
  address: contractAddress,
  abi: ArcPoolABI,
  functionName: 'deposit',
  value: parseUnits('1000', 6) // 1000 USDC
});
```

**Event Emitted:**
```solidity
event Deposit(
  address indexed lp,
  uint256 amount,
  uint256 newTotalPoolSize
);
```

---

#### `withdraw(uint256 amount)`
從流動性池提取 USDC

**Parameters:**
- `amount`: 提取金額（USDC，6 decimals）

**Example:**
```javascript
await writeContract({
  address: contractAddress,
  abi: ArcPoolABI,
  functionName: 'withdraw',
  args: [parseUnits('500', 6)] // 提取 500 USDC
});
```

**Event Emitted:**
```solidity
event Withdrawal(
  address indexed lp,
  uint256 amount,
  uint256 newTotalPoolSize
);
```

---

#### `getLPBalance(address lp)` - view
查詢 LP 餘額

**Parameters:**
- `lp`: LP 地址

**Returns:** `uint256` - LP 存入的金額

**Example:**
```javascript
const balance = await readContract({
  address: contractAddress,
  abi: ArcPoolABI,
  functionName: 'getLPBalance',
  args: [lpAddress]
});
```

---

#### `getPoolStatus()` - view
查詢流動性池狀態

**Returns:**
- `total`: 總資金量
- `available`: 可用資金
- `utilized`: 已使用資金
- `financed`: 已融資總額

**Example:**
```javascript
const [total, available, utilized, financed] = await readContract({
  address: contractAddress,
  abi: ArcPoolABI,
  functionName: 'getPoolStatus'
});
```

---

#### `totalInterestEarned()` - view
查詢總利息收入

**Returns:** `uint256` - 總利息（90% 歸 LP，10% 歸協議）

---

### 2. Supplier (供應商) 函數

#### `withdrawFinancing(bytes32 invoiceId, uint256 payoutAmount, uint256 repaymentAmount, uint256 dueDate, uint256 nonce, uint256 deadline, bytes signature)`
提取融資款項（需要 Aegis 簽名）

**Parameters:**
- `invoiceId`: 發票 ID (keccak256 hash)
- `payoutAmount`: 支付金額（扣除折扣後）
- `repaymentAmount`: 還款金額（原始金額）
- `dueDate`: 到期日（Unix timestamp）
- `nonce`: 隨機數（防重放）
- `deadline`: 簽名過期時間
- `signature`: Aegis 伺服器的 EIP-712 簽名

**Example:**
```javascript
const invoiceIdHash = hashString(invoiceId);

await writeContract({
  address: contractAddress,
  abi: ArcPoolABI,
  functionName: 'withdrawFinancing',
  args: [
    invoiceIdHash,
    parseUnits(payoutAmount.toString(), 6),
    parseUnits(repaymentAmount.toString(), 6),
    dueDate,
    nonce,
    deadline,
    signature
  ]
});
```

**Event Emitted:**
```solidity
event FinancingWithdrawn(
  bytes32 indexed invoiceId,
  address indexed supplier,
  uint256 amount,
  uint256 timestamp
);
```

---

### 3. Buyer (買方) 函數

#### `repay(bytes32 invoiceId)` - payable
還款發票（支付本金 + 利息）

**Parameters:**
- `invoiceId`: 發票 ID (keccak256 hash)

**Example:**
```javascript
const invoiceIdHash = hashString(invoiceId);

await writeContract({
  address: contractAddress,
  abi: ArcPoolABI,
  functionName: 'repay',
  args: [invoiceIdHash],
  value: parseUnits(repaymentAmount.toString(), 6)
});
```

**Event Emitted:**
```solidity
event Repayment(
  bytes32 indexed invoiceId,
  address indexed payer,
  uint256 amount,
  uint256 interest,
  uint256 lateFee
);

event InterestDistributed(
  uint256 lpShare,      // 90%
  uint256 protocolShare // 10%
);
```

---

#### `getFinancingRecord(bytes32 invoiceId)` - view
查詢融資記錄

**Returns:**
```solidity
struct FinancingRecord {
  bytes32 invoiceId;
  address supplier;
  uint256 payoutAmount;
  uint256 repaymentAmount;
  uint256 dueDate;
  uint256 timestamp;
  bool repaid;
}
```

---

## 測試環境設置

### 1. 後端設置

#### 安裝依賴
```bash
cd backend
npm install
```

#### 配置環境變數
複製 `env.example` 到 `.env`:
```bash
cp env.example .env
```

編輯 `.env` 文件：
```env
# Server
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# JWT
JWT_SECRET=your_jwt_secret

# Aegis Server Wallet (用於簽名)
SERVER_WALLET_PRIVATE_KEY=0x...
AEGIS_SERVER_WALLET=0x...

# Arc Testnet
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_CONTRACT_ADDRESS=0x...  # 您部署的合約地址
ARC_CHAIN_ID=5042002

# Hugging Face AI (可選)
# 免費獲取: https://huggingface.co/settings/tokens
HUGGINGFACE_API_TOKEN=hf_...

# CORS
FRONTEND_URL=http://localhost:3000
```

#### 啟動後端
```bash
npm run start:dev
```

驗證後端運行：
```bash
curl http://localhost:3001/health
```

---

### 2. 前端設置

#### 安裝依賴
```bash
cd frontend
npm install
```

#### 配置環境變數
創建 `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Arc Testnet
NEXT_PUBLIC_ARC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
```

#### 啟動前端
```bash
npm run dev
```

訪問: http://localhost:3000

---

### 3. 測試帳號設置

你需要準備 **3 個測試錢包**（使用 MetaMask 或其他 Web3 錢包）：

#### Wallet 1: 供應商 (Supplier)
- 角色：上傳發票、提取融資款項
- 需要：少量 ARC 測試幣（用於 gas）

#### Wallet 2: 買方 (Buyer)
- 角色：批准發票、還款
- 需要：
  - 少量 ARC 測試幣（用於 gas）
  - USDC 測試幣（用於還款）

#### Wallet 3: 流動性提供者 (LP)
- 角色：存入資金、賺取利息
- 需要：
  - 少量 ARC 測試幣（用於 gas）
  - 大量 USDC 測試幣（用於提供流動性，例如 10,000 USDC）

---

### 4. 獲取測試幣

#### Arc 測試幣 (用於 Gas)
1. 訪問 Arc Testnet Faucet（如果有）
2. 或聯繫 Arc 團隊獲取測試幣

#### USDC 測試幣
您需要在 Arc Testnet 上部署一個測試 USDC 合約，或使用現有的測試 USDC：

**選項 A: 使用現有測試 USDC**
- 查看 Arc Testnet 文檔是否有官方測試 USDC

**選項 B: 部署自己的測試 USDC**
```solidity
// MockUSDC.sol
contract MockUSDC is ERC20 {
  constructor() ERC20("Mock USDC", "USDC") {
    _mint(msg.sender, 1000000 * 10**6); // 1M USDC
  }

  function decimals() public pure override returns (uint8) {
    return 6;
  }

  function mint(address to, uint256 amount) public {
    _mint(to, amount);
  }
}
```

---

### 5. RainbowKit 錢包連接

確保 MetaMask 已配置 Arc Testnet：

**手動添加網路:**
- Network Name: `Arc Testnet`
- RPC URL: `https://rpc.testnet.arc.network`
- Chain ID: `5042002`
- Currency Symbol: `ARC`

前端使用 RainbowKit 會自動處理連接和切換網路。

---

## 完整測試流程

### 階段 1: LP 提供流動性

**目標:** LP 存入 USDC 到流動性池

**步驟:**

1. **連接錢包**
   - 訪問 http://localhost:3000/lp
   - 點擊 "Connect Wallet"
   - 選擇 Wallet 3 (LP)
   - 授權連接並切換到 Arc Testnet

2. **查看當前池狀態**
   - 頁面應顯示：
     - Total Pool Size: 0 USDC
     - Available Liquidity: 0 USDC
     - Your LP Balance: 0 USDC
     - Utilization Rate: 0%

3. **存入資金**
   - 在 "Deposit" 區域輸入金額：`10000`
   - 點擊 "Deposit USDC"
   - MetaMask 彈出交易確認
   - 確認交易並等待完成

**預期結果:**
```
✅ Transaction successful
- Total Pool Size: 10,000 USDC
- Available Liquidity: 10,000 USDC
- Your LP Balance: 10,000 USDC
- Utilization Rate: 0%
```

**驗證 (可選):**
```bash
# 使用 curl 測試後端 (後端會從鏈上讀取)
curl http://localhost:3001/api/pool/status
```

---

### 階段 2: 供應商創建發票

**目標:** 供應商上傳發票並獲取 AI 定價報價

**步驟:**

1. **連接錢包**
   - 訪問 http://localhost:3000/supplier
   - 連接 Wallet 1 (Supplier)

2. **創建發票**
   - 點擊 "Create Invoice" 按鈕
   - 填寫表單：
     - Invoice Number: `INV-2024-001`
     - Buyer Address: `<Wallet 2 地址>`
     - Amount: `5000` USDC
     - Due Date: `2024-12-31` (選擇 60 天後的日期)
     - Buyer Credit Rating: `85`
     - Supplier Credit Rating: `90`
   - 點擊 "Create Invoice"

3. **等待 AI 分析**
   - 後端會調用 Hugging Face AI 進行風險評估
   - 大約需要 3-5 秒

**預期結果:**
```
✅ Invoice created successfully

Invoice Details:
- Invoice Number: INV-2024-001
- Status: PENDING
- Amount: 5,000 USDC
- Due Date: Dec 31, 2024

🤖 AI-Powered Pricing:
- Payout Offer: 4,900 USDC (你現在可以獲得)
- Repayment Amount: 5,000 USDC (到期需還款)
- Discount Rate: 2.00%
- Risk Score: 87/100
- AI Risk Score: 85/100

Pricing Explanation:
Applied 2.00% discount rate based on:
• Payment term: 60 days
• Pool liquidity: Abundant
• Average credit rating: 87/100
• Rule-based risk score: 88/100
• AI risk prediction: 85/100
• Analysis powered by Hugging Face Mistral-7B
```

**API 調用 (後端日誌):**
```
[AegisService] Calculating pricing for invoice amount: 5000
[AegisService] Available liquidity: 10000000000
[AegisService] Requesting AI risk prediction from Hugging Face...
[AegisService] AI risk score calculated: 85.23/100
[AegisService] AI risk score integrated: 85.23/100
[AegisService] Pricing calculated: Payout 4900, Repayment 5000, Discount 2.00%, Risk Score 87.56, AI Risk Score 85.23
[InvoiceService] Invoice created with Aegis pricing
```

**驗證:**
```bash
# 使用 curl 測試
curl -X POST http://localhost:3001/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_number": "INV-2024-002",
    "supplier_address": "0x...",
    "buyer_address": "0x...",
    "amount": 5000,
    "due_date": "2024-12-31T23:59:59.000Z",
    "buyer_rating": 85,
    "supplier_rating": 90
  }'
```

---

### 階段 3: 買方批准發票

**目標:** 買方審核並批准發票

**步驟:**

1. **切換帳號**
   - 訪問 http://localhost:3000/buyer
   - 連接 Wallet 2 (Buyer)

2. **查看待批准發票**
   - 應該看到一個 "Pending Approval" 的發票卡片
   - Invoice Number: INV-2024-001
   - Supplier: Wallet 1 地址
   - Amount: 5,000 USDC
   - Status: PENDING

3. **批准發票**
   - 點擊發票卡片上的 "Approve" 按鈕
   - 確認批准對話框

**預期結果:**
```
✅ Invoice approved successfully

- Status changed: PENDING → APPROVED
- Aegis Signature generated
- Supplier can now withdraw financing

Signature Details:
- Signature: 0x1234567890abcdef...
- Nonce: 1699368600000
- Deadline: 1 hour from now
- Due Date: Dec 31, 2024
```

**後端自動操作:**
```
[InvoiceService] Approving invoice uuid-1234
[InvoiceService] Updating invoice status to APPROVED
[AegisService] Generating Aegis signature for invoice uuid-1234
[AegisService] Signature generated successfully
```

**Supabase 數據更新:**
```sql
UPDATE invoices
SET
  status = 'APPROVED',
  aegis_signature = '0x...',
  aegis_nonce = 1699368600000,
  aegis_deadline = 1699372200,
  aegis_due_date = 1704067199,
  updated_at = NOW()
WHERE id = 'uuid-1234';
```

**驗證:**
```bash
# 檢查發票狀態
curl http://localhost:3001/api/invoices/uuid-1234
```

---

### 階段 4: 供應商提取融資

**目標:** 供應商使用 Aegis 簽名從智能合約提取融資款項

**步驟:**

1. **切換回供應商帳號**
   - 訪問 http://localhost:3000/supplier
   - 連接 Wallet 1 (Supplier)

2. **查看已批准的發票**
   - 應該看到發票狀態已變為 "APPROVED"
   - 顯示 "Withdraw Financing" 按鈕

3. **提取融資**
   - 點擊 "Withdraw Financing" 按鈕
   - 前端自動構建交易：
     ```javascript
     invoiceIdHash = keccak256(invoiceNumber)

     writeContract({
       functionName: 'withdrawFinancing',
       args: [
         invoiceIdHash,           // bytes32
         parseUnits('4900', 6),   // payoutAmount
         parseUnits('5000', 6),   // repaymentAmount
         1704067199,              // dueDate
         1699368600000,           // nonce
         1699372200,              // deadline
         '0x1234...'              // signature
       ]
     })
     ```
   - MetaMask 彈出交易確認
   - 確認並等待交易完成

**預期結果:**
```
✅ Financing withdrawn successfully

Your Wallet Received:
- 4,900 USDC (payout amount)

Pool Status Updated:
- Available Liquidity: 5,100 USDC (10,000 - 4,900)
- Utilized: 4,900 USDC
- Utilization Rate: 49%

Invoice Status:
- Status: FINANCED
- Transaction Hash: 0xabcd...
```

**智能合約事件:**
```solidity
event FinancingWithdrawn(
  invoiceId: 0x7e3c8f... (keccak256 hash),
  supplier: <Wallet 1 地址>,
  amount: 4900000000 (4900 USDC),
  timestamp: 1699368600
)
```

**Supabase 更新:**
```sql
UPDATE invoices
SET
  status = 'FINANCED',
  financing_tx_hash = '0xabcd...',
  updated_at = NOW()
WHERE id = 'uuid-1234';
```

**驗證:**
```bash
# 檢查錢包餘額
cast balance <Wallet 1 地址> --erc20 <USDC Contract> --rpc-url https://rpc.testnet.arc.network

# 檢查智能合約融資記錄
cast call <Contract Address> "getFinancingRecord(bytes32)" <invoiceIdHash> --rpc-url ...
```

---

### 階段 5: 買方還款

**目標:** 買方在到期日前還款（本金 + 利息）

**步驟:**

1. **切換到買方帳號**
   - 訪問 http://localhost:3000/buyer
   - 連接 Wallet 2 (Buyer)

2. **查看需要還款的發票**
   - 切換到 "Financed" tab
   - 看到 INV-2024-001 狀態為 "FINANCED"
   - 顯示 "Repay Invoice" 按鈕

3. **執行還款**
   - 點擊 "Repay Invoice"
   - 確認還款金額：5,000 USDC
   - MetaMask 彈出交易確認（需要支付 5,000 USDC）
   - 確認並等待交易完成

**預期結果:**
```
✅ Repayment successful

Payment Details:
- Principal: 5,000 USDC
- Interest: 100 USDC (2% for 60 days)
- Late Fee: 0 USDC (paid on time)
- Total Paid: 5,000 USDC

Interest Distribution:
- LP Share (90%): 90 USDC
- Protocol Share (10%): 10 USDC

Pool Status Updated:
- Available Liquidity: 10,090 USDC
- Utilized: 0 USDC
- Utilization Rate: 0%
- Total Interest Earned: 100 USDC

Invoice Status: PAID
```

**智能合約事件:**
```solidity
event Repayment(
  invoiceId: 0x7e3c8f...,
  payer: <Wallet 2 地址>,
  amount: 5000000000,
  interest: 100000000,
  lateFee: 0
)

event InterestDistributed(
  lpShare: 90000000,      // 90 USDC
  protocolShare: 10000000 // 10 USDC
)
```

**驗證:**
```bash
# 檢查 LP 新餘額
curl http://localhost:3001/api/lp/<Wallet 3 地址>/balance

# 檢查總利息
curl http://localhost:3001/api/pool/interest
```

---

### 階段 6: LP 提取收益

**目標:** LP 提取本金 + 利息收益

**步驟:**

1. **切換到 LP 帳號**
   - 訪問 http://localhost:3000/lp
   - 連接 Wallet 3 (LP)

2. **查看收益**
   - Your LP Balance: 10,000 USDC (原始存款)
   - Total Interest Earned: 100 USDC
   - Your Share (90%): 90 USDC
   - Available to Withdraw: 10,090 USDC

3. **提取全部資金**
   - 在 "Withdraw" 區域輸入: `10090`
   - 點擊 "Withdraw USDC"
   - 確認交易

**預期結果:**
```
✅ Withdrawal successful

Received:
- Original Deposit: 10,000 USDC
- Interest Earned: 90 USDC
- Total: 10,090 USDC

Pool Status:
- Your LP Balance: 0 USDC
- Total Pool Size: 10 USDC (Protocol's 10% share)
```

**測試完成！** 🎉

---

## 高級測試場景

### 場景 A: 多個供應商並發融資

**目標:** 測試流動性池能否處理多個融資請求

**步驟:**
1. LP 存入 20,000 USDC
2. Supplier A 創建 8,000 USDC 發票
3. Supplier B 創建 9,000 USDC 發票
4. Supplier C 創建 5,000 USDC 發票
5. 買方批准所有發票
6. 所有供應商提取融資

**預期:**
- Supplier A 成功提取（剩餘 12,000 USDC）
- Supplier B 成功提取（剩餘 3,000 USDC）
- Supplier C 失敗（流動性不足）

**錯誤訊息:**
```
❌ Transaction reverted: Insufficient liquidity
```

---

### 場景 B: 信用評分影響定價

**目標:** 驗證 AI 如何根據信用評分調整定價

**測試用例:**

| Buyer Rating | Supplier Rating | Expected Discount Rate | Risk Score |
|--------------|-----------------|------------------------|------------|
| 95 | 95 | ~1.5% | 95+ |
| 85 | 85 | ~2.0% | 85-90 |
| 70 | 70 | ~2.8% | 75-80 |
| 50 | 50 | ~4.5% | 60-70 |

**步驟:**
創建 4 個發票，分別使用不同的信用評分組合，比較定價結果。

---

### 場景 C: 逾期還款罰金

**目標:** 測試逾期還款的罰金計算

**步驟:**
1. 創建 60 天到期的發票
2. 等待 70 天（或手動調整區塊鏈時間）
3. 執行還款

**預期:**
```
Late Fee: 50 USDC (10 days overdue × 1% daily penalty)
Total Payment: 5,050 USDC
```

---

### 場景 D: 簽名過期測試

**目標:** 驗證 EIP-712 簽名過期機制

**步驟:**
1. 創建發票並獲得批准
2. 等待簽名過期（1 小時）
3. 嘗試提取融資

**預期錯誤:**
```
❌ Transaction reverted: Signature expired
```

**解決方案:**
重新生成簽名：
```bash
curl -X POST http://localhost:3001/api/invoices/uuid-1234/sign
```

---

## AI 功能測試

### 測試 Hugging Face AI 集成

**驗證 AI 是否運行:**

1. **檢查後端日誌**
   ```bash
   # 啟動後端時應看到
   [AegisService] Hugging Face AI integration enabled
   ```

2. **創建發票時查看日誌**
   ```bash
   [AegisService] Requesting AI risk prediction from Hugging Face...
   [AegisService] AI risk score calculated: 85.23/100
   [AegisService] AI risk score integrated: 85.23/100
   ```

3. **檢查定價解釋**
   - 應包含 "🤖 AI-Powered Pricing"
   - 應包含 "AI risk prediction: XX/100"
   - 應包含 "Analysis powered by Hugging Face Mistral-7B"

---

### 測試無 AI Token 的降級行為

**步驟:**
1. 移除 `HUGGINGFACE_API_TOKEN` 環境變數
2. 重啟後端
3. 創建發票

**預期:**
```bash
# 後端日誌
[AegisService] Hugging Face token not found - using rule-based risk scoring only

# 定價解釋（無 AI）
Applied 2.00% discount rate based on:
• Payment term: 60 days
• Pool liquidity: Moderate
• Average credit rating: 87/100
• Overall risk score: 86/100
```

---

## 故障排除

### 問題 1: 後端無法連接 Supabase

**錯誤:**
```
[SupabaseService] Failed to connect to Supabase
```

**解決方案:**
1. 檢查 `.env` 文件中的 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY`
2. 確認 Supabase 項目已創建
3. 確認網路連接

---

### 問題 2: Hugging Face API 超時

**錯誤:**
```
[AegisService] HF AI risk prediction failed: Request timeout
```

**解決方案:**
1. 檢查 `HUGGINGFACE_API_TOKEN` 是否有效
2. 檢查網路連接
3. Hugging Face 免費 API 可能有速率限制
4. 系統會自動降級到基於規則的評分

---

### 問題 3: MetaMask 交易失敗

**錯誤:**
```
Transaction reverted
```

**可能原因:**
1. **Gas 不足**: 確保錢包有足夠的 ARC 測試幣
2. **USDC 餘額不足**: 確保有足夠的 USDC
3. **流動性不足**: 池中沒有足夠的資金
4. **簽名過期**: EIP-712 簽名已過期（1 小時）
5. **重複提取**: 該發票已經被融資

**調試步驟:**
```bash
# 檢查錢包餘額
cast balance <address> --rpc-url https://rpc.testnet.arc.network

# 檢查 USDC 餘額
cast call <USDC_ADDRESS> "balanceOf(address)" <address> --rpc-url ...

# 檢查流動性池狀態
cast call <CONTRACT_ADDRESS> "getPoolStatus()" --rpc-url ...
```

---

### 問題 4: 前端無法讀取智能合約

**錯誤:**
```
Error: Contract not deployed on this network
```

**解決方案:**
1. 確認 `NEXT_PUBLIC_ARC_CONTRACT_ADDRESS` 正確
2. 確認 MetaMask 連接到 Arc Testnet（Chain ID: 5042002）
3. 確認合約已部署到 Arc Testnet

---

### 問題 5: 發票狀態未更新

**問題:** 批准發票後，前端狀態仍顯示 PENDING

**解決方案:**
1. **刷新頁面** - Supabase 查詢可能有緩存
2. **檢查後端日誌** - 確認批准 API 調用成功
3. **手動查詢 Supabase**:
   ```javascript
   const { data } = await supabase
     .from('invoices')
     .select('*')
     .eq('id', invoiceId)
     .single();
   console.log(data.status); // 應該是 'APPROVED'
   ```

---

## API 測試集合（Postman/cURL）

### 健康檢查
```bash
curl http://localhost:3001/health
```

### 創建發票
```bash
curl -X POST http://localhost:3001/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_number": "INV-TEST-001",
    "supplier_address": "0x1234567890123456789012345678901234567890",
    "buyer_address": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    "amount": 10000,
    "due_date": "2024-12-31T23:59:59.000Z",
    "buyer_rating": 85,
    "supplier_rating": 90
  }'
```

### 獲取報價
```bash
curl -X POST http://localhost:3001/api/invoices/<INVOICE_ID>/quote \
  -H "Content-Type: application/json" \
  -d '{
    "buyer_rating": 90,
    "supplier_rating": 85
  }'
```

### 批准發票
```bash
curl -X POST http://localhost:3001/api/invoices/<INVOICE_ID>/approve
```

### 生成簽名
```bash
curl -X POST http://localhost:3001/api/invoices/<INVOICE_ID>/sign
```

---

## 性能測試

### 負載測試（使用 Apache Bench）

```bash
# 測試健康檢查端點
ab -n 1000 -c 10 http://localhost:3001/health

# 測試發票創建（需要準備測試數據）
ab -n 100 -c 5 -p invoice-data.json -T application/json http://localhost:3001/api/invoices
```

### AI 響應時間測試

**預期響應時間:**
- 不使用 AI: 50-200ms
- 使用 Hugging Face AI: 2-5 秒（首次調用可能更長）

**測試腳本:**
```bash
#!/bin/bash
for i in {1..10}; do
  echo "Test $i"
  time curl -X POST http://localhost:3001/api/invoices \
    -H "Content-Type: application/json" \
    -d '{...}'
done
```

---

## 安全測試

### 1. EIP-712 簽名驗證

**測試無效簽名:**
```javascript
// 嘗試使用錯誤的簽名提取融資
await writeContract({
  functionName: 'withdrawFinancing',
  args: [..., '0xinvalid_signature']
});

// 預期錯誤: "Invalid signature"
```

---

### 2. 重放攻擊防護

**測試重複使用簽名:**
```javascript
// 第一次提取成功
await withdrawFinancing(...);

// 嘗試再次使用相同簽名
await withdrawFinancing(...);

// 預期錯誤: "Invoice already financed"
```

---

### 3. Nonce 驗證

**測試使用已用過的 Nonce:**
```javascript
const nonce = 123456;

// 使用 nonce 123456 提取
await withdrawFinancing(..., nonce, ...);

// 嘗試再次使用 nonce 123456
await withdrawFinancing(..., nonce, ...);

// 預期錯誤: "Nonce already used"
```

---

## 監控和日誌

### 後端日誌級別

```typescript
// development: 顯示所有日誌
LOG_LEVEL=debug

// production: 僅顯示重要日誌
LOG_LEVEL=warn
```

### 關鍵日誌監控

**成功流程:**
```
[AegisService] Hugging Face AI integration enabled
[AegisService] Calculating pricing for invoice amount: 5000
[AegisService] AI risk score calculated: 85.23/100
[InvoiceService] Invoice created with Aegis pricing
[InvoiceService] Approving invoice uuid-1234
[AegisService] Generating Aegis signature for invoice uuid-1234
[AegisService] Signature generated successfully
```

**錯誤場景:**
```
[AegisService] HF AI risk prediction failed: <error>
[AegisService] Failed to get pool status: <error>
[InvoiceService] Failed to approve invoice: <error>
```

---

## 總結

這份指南涵蓋了：

✅ **完整的 API 規格** - 所有 REST endpoints 和智能合約函數
✅ **環境設置指南** - 後端、前端、錢包配置
✅ **詳細測試流程** - 從 LP 存款到最終還款的完整循環
✅ **AI 功能測試** - Hugging Face 集成驗證
✅ **故障排除** - 常見問題和解決方案
✅ **安全測試** - EIP-712 簽名、重放攻擊防護

### 快速開始檢查清單

- [ ] 後端運行中 (`npm run start:dev`)
- [ ] 前端運行中 (`npm run dev`)
- [ ] Supabase 已配置
- [ ] 3 個測試錢包已準備（Supplier、Buyer、LP）
- [ ] Arc Testnet 已添加到 MetaMask
- [ ] 測試幣已獲取（ARC 和 USDC）
- [ ] 智能合約已部署到 Arc Testnet
- [ ] 環境變數已正確配置
- [ ] Hugging Face Token 已設置（可選）

**準備好後，開始測試！** 🚀
