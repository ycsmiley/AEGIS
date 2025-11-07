<!-- # 🚀 Aegis Finance - 環境設定檢查清單

## ✅ 設定步驟（按順序執行）

### 第一步：建立 Supabase 專案

1. 前往 [Supabase](https://supabase.com/) 建立帳號
2. 建立新專案（Project Name: aegis-finance）
3. 等待專案初始化完成

---

### 第二步：設定 Supabase 資料庫

```bash
# 1. 複製資料庫架構
cat database/schema.sql

# 2. 前往 Supabase Dashboard > SQL Editor
# 3. 貼上 schema.sql 的內容並執行
```

**檢查點：** 確認以下 tables 已建立：
- ✅ `companies`
- ✅ `invoices`
- ✅ `user_profiles`

---

### 第三步：取得 Supabase 金鑰

前往 **Supabase Dashboard** > **Settings** > **API**

#### Frontend 需要（公開金鑰）：
```bash
Project URL: https://xxx.supabase.co
anon/public key: eyJhbGc...
```

#### Backend 需要（私密金鑰）：
```bash
Project URL: https://xxx.supabase.co
service_role key: eyJhbGc...  ⚠️ 保密！
```

--- -->

### 第四步：生成 JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

複製生成的字串到 `backend/.env` 的 `JWT_SECRET`

---

### 第五步：建立 Aegis Server Wallet

**選項 A：使用 MetaMask**
1. 建立新帳號（專門用於測試）
2. 匯出私鑰
3. 複製錢包地址

**選項 B：使用程式生成**
```bash
cd backend
node -e "const ethers = require('ethers'); const w = ethers.Wallet.createRandom(); console.log('Address:', w.address); console.log('Private Key:', w.privateKey);"
```

---

### 第六步：（可選）取得 WalletConnect Project ID

1. 前往 [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. 建立帳號 > Create New Project
3. 複製 Project ID

---

### 第七步：編輯環境變數

#### Frontend (`frontend/.env.local`)
```bash
# ✅ 已建立，請編輯以下欄位：
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxx  # 可選
```

#### Backend (`backend/.env`)
```bash
# ✅ 已建立，請編輯以下欄位：
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  # ⚠️ service_role key
JWT_SECRET=xxx  # 第四步生成的
SERVER_WALLET_PRIVATE_KEY=0x...  # 第五步的私鑰
AEGIS_SERVER_WALLET=0x...  # 第五步的地址
```

---

### 第八步：部署智能合約（本地測試）

```bash
cd contracts
npm install
npx hardhat node  # 啟動本地節點

# 另開終端機
npx hardhat run scripts/deploy.js --network localhost
# 複製顯示的合約地址到 .env 檔案
```

---

### 第九步：安裝依賴並啟動

#### Backend
```bash
cd backend
npm install
npm run start:dev  # 應該在 http://localhost:3001 啟動
```

#### Frontend
```bash
cd frontend
npm install
npm run dev  # 應該在 http://localhost:3000 啟動
```

---

## 🔍 驗證設定是否正確

### Backend 健康檢查
```bash
curl http://localhost:3001/health
# 應該返回: {"status":"ok"}
```

### Frontend 測試
```bash
# 1. 開啟 http://localhost:3000
# 2. 點擊 "Connect Wallet"
# 3. 應該能看到三個 Portal 連結
```

---

## 📝 環境變數摘要

| 變數名稱 | 位置 | 必須？ | 說明 |
|---------|------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | ✅ 是 | Supabase 專案 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | ✅ 是 | Supabase anon key |
| `NEXT_PUBLIC_ARC_CONTRACT_ADDRESS` | Frontend | ✅ 是 | 部署的合約地址 |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Frontend | ⚠️ 建議 | WalletConnect ID |
| `SUPABASE_URL` | Backend | ✅ 是 | 同 Frontend |
| `SUPABASE_SERVICE_KEY` | Backend | ✅ 是 | service_role key |
| `JWT_SECRET` | Backend | ✅ 是 | 隨機生成的字串 |
| `SERVER_WALLET_PRIVATE_KEY` | Backend | ✅ 是 | Aegis 錢包私鑰 |
| `AEGIS_SERVER_WALLET` | Backend | ✅ 是 | Aegis 錢包地址 |
| `ARC_CONTRACT_ADDRESS` | Backend | ✅ 是 | 同 Frontend |

---

## ⚠️ 安全提醒

- ❌ **絕對不要** commit `.env` 檔案到 git
- ❌ **絕對不要** 分享 `SUPABASE_SERVICE_KEY`
- ❌ **絕對不要** 分享 `SERVER_WALLET_PRIVATE_KEY`
- ✅ 只有 `NEXT_PUBLIC_*` 變數會暴露在瀏覽器

---

## 🆘 常見問題

### Q: Backend 啟動失敗，顯示 "Supabase connection failed"
**A:** 檢查 `SUPABASE_SERVICE_KEY` 是否正確（應該是很長的字串）

### Q: Frontend 無法連接錢包
**A:** 檢查是否設定 `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

### Q: 合約呼叫失敗 "Invalid signature"
**A:** 確認 Backend 的 `AEGIS_SERVER_WALLET` 地址與合約部署時設定的相同

### Q: 我需要真實的 Arc Testnet 嗎？
**A:** 不用！可以使用 `npx hardhat node` 本地測試網路

---

## ✅ 完成！

所有設定完成後，你應該能夠：
- ✅ 訪問 Supplier Portal 查看發票
- ✅ 訪問 Buyer Portal 管理還款
- ✅ 訪問 LP Portal 存取流動性
- ✅ Backend API 正常運作
- ✅ 智能合約互動成功

---

**需要幫助？** 檢查各檔案的註解說明或參考 `IMPLEMENTATION_SUMMARY.md`
