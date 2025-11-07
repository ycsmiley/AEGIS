# 🧪 本地測試指南

## 快速開始（3 步驟）

### 步驟 1：啟動本地區塊鏈

打開**終端機 1**，執行：

```bash
cd contracts
npx hardhat node
```

你會看到：
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

**✅ 保持這個終端機執行中！**

---

### 步驟 2：部署合約

打開**終端機 2**（新的），執行：

```bash
cd contracts
npx hardhat run scripts/deploy-arc.js --network localhost
```

你會看到：
```
🚀 Deploying ArcPool to Arc Testnet...

📝 Deploying contracts with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
💰 Account balance: 10000.0 USDC

🤖 Aegis Server Wallet: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
💧 Initial Liquidity: 0.0 USDC

⏳ Deploying ArcPool contract...
✅ ArcPool deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

📊 Initial Pool Status:
   Total Pool Size: 0.0 USDC
   Available Liquidity: 0.0 USDC
   Utilized: 0.0 USDC
   Total Financed: 0.0 USDC
```

**📝 複製合約地址！** （例如：`0x5FbDB2315678afecb367f032d93F642f64180aa3`）

---

### 步驟 3：更新環境變數

#### Frontend (`frontend/.env.local`)
```bash
NEXT_PUBLIC_ARC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

#### Backend (`backend/.env`)
```bash
ARC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**注意：** 替換成你剛才複製的實際合約地址！

---

## 🎯 完整測試流程

### 1. 啟動所有服務

#### 終端機 1：Hardhat 節點
```bash
cd contracts
npx hardhat node
```

#### 終端機 2：Backend
```bash
cd backend
npm install  # 第一次執行
npm run start:dev
```

#### 終端機 3：Frontend
```bash
cd frontend
npm install  # 第一次執行
npm run dev
```

---

### 2. 在 MetaMask 連接本地網路

1. 打開 MetaMask
2. 點擊網路選擇器 → **新增網路** → **手動新增網路**
3. 輸入以下資訊：

```
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 1337
Currency Symbol: ETH
```

4. 點擊**儲存**

---

### 3. 匯入測試帳號到 MetaMask

Hardhat 節點提供了 20 個測試帳號，每個都有 10000 ETH。

**Account #0（推薦使用）：**
```
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**如何匯入：**
1. MetaMask → 點擊帳號圖示
2. **匯入帳號** (Import Account)
3. 選擇 **私鑰** (Private Key)
4. 貼上私鑰：`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
5. 點擊**匯入**

⚠️ **警告：這是公開的測試私鑰，絕對不要在主網使用！**

---

### 4. 測試功能

#### 訪問 Frontend
```
http://localhost:3000
```

#### 測試流程：

1. **連接錢包**
   - 點擊 "Connect Wallet"
   - 選擇 MetaMask
   - 確認切換到 Hardhat Local 網路

2. **LP Portal** (`http://localhost:3000/lp`)
   - 存入 USDC 到流動性池
   - 查看池狀態

3. **Supplier Portal** (`http://localhost:3000/supplier`)
   - 查看發票（需先在 Supabase 建立測試資料）
   - 接受融資

4. **Buyer Portal** (`http://localhost:3000/buyer`)
   - 查看待還款發票
   - 還款

---

## 🔧 常見問題

### Q: MetaMask 顯示 "Nonce too high" 錯誤
**A:** 重置 MetaMask 帳號：
1. MetaMask → 設定 → 進階
2. 找到 **清除活動標籤資料** (Clear activity tab data)
3. 點擊並確認

### Q: Hardhat 節點關閉後，合約地址會改變嗎？
**A:** 會！每次重啟 Hardhat 節點後，需要重新部署合約，地址會改變。

### Q: 我需要真實的測試幣嗎？
**A:** 不需要！Hardhat 本地節點的帳號都有 10000 ETH。

### Q: 可以多人同時測試嗎？
**A:** 可以！只要：
1. Hardhat 節點在執行
2. 每個人都匯入不同的測試帳號（Account #0, #1, #2...）
3. 都連接到 `http://127.0.0.1:8545`

---

## 📝 測試數據準備

### 在 Supabase 建立測試發票

前往 **Supabase Dashboard** → **Table Editor** → **invoices** → **Insert row**

範例資料：
```json
{
  "invoice_number": "INV-001",
  "amount": 10000,
  "currency": "USDC",
  "due_date": "2025-12-31",
  "supplier_id": "uuid-of-supplier",
  "buyer_id": "uuid-of-buyer",
  "status": "PENDING",
  "aegis_payout_offer": null,
  "aegis_signature": null
}
```

**或使用 Backend API：**
```bash
curl -X POST http://localhost:3001/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_number": "INV-001",
    "amount": 10000,
    "currency": "USDC",
    "due_date": "2025-12-31",
    "supplier_id": "supplier-uuid",
    "buyer_id": "buyer-uuid"
  }'
```

---

## 🎉 測試檢查清單

完成以下測試，確保所有功能正常：

- [ ] Hardhat 節點成功啟動
- [ ] 合約成功部署到本地網路
- [ ] MetaMask 成功連接到本地網路
- [ ] 測試帳號成功匯入
- [ ] Frontend 正常顯示
- [ ] Backend API 正常運作
- [ ] 可以存入 USDC 到 LP Pool
- [ ] 可以查看發票列表
- [ ] 可以接受融資（7 參數呼叫）
- [ ] 可以還款（含利息和遲延費）

---

## 🚀 下一步

測試完成後，你可以：

1. **部署到 Arc Testnet**（真實測試網）
2. **完善 UI/UX**
3. **添加更多功能**
4. **準備正式上線**

---

**需要幫助？** 參考 `SETUP_CHECKLIST.md` 或查看各組件的文檔。
