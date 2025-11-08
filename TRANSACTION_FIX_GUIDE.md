# 🔧 交易失敗修復指南

## 問題診斷結果

經過詳細診斷，我們發現了問題：

### ❌ 主要問題
**`backend/.env` 中的 `SERVER_WALLET_PRIVATE_KEY` 格式無效！**

```
TypeError: invalid private key
```

這導致簽名生成時使用了錯誤的私鑰，所以合約驗證失敗。

---

## 📝 修復步驟

### 1. 獲取正確的私鑰

從你的錢包（例如 MetaMask）導出 **`0x782c3446aeDabdD934e97ee255D5C5c62fE289D3`** 的私鑰：

1. 打開 MetaMask
2. 點擊右上角的三個點
3. 選擇「帳戶詳情」
4. 點擊「導出私鑰」
5. 輸入密碼
6. 複製私鑰（應該是 `0x` 開頭的 64 個字符）

**正確格式範例**：
```
0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### 2. 更新 backend/.env

```env
# 必須是 0x 開頭的 66 個字符（0x + 64 hex）
SERVER_WALLET_PRIVATE_KEY=0x你的完整私鑰
AEGIS_SERVER_WALLET=0x782c3446aeDabdD934e97ee255D5C5c62fE289D3

# 其他必須的配置
ARC_CHAIN_ID=5042002
ARC_CONTRACT_ADDRESS=0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C
ARC_RPC_URL=https://rpc.testnet.arc.network

SUPABASE_URL=你的_supabase_url
SUPABASE_SERVICE_KEY=你的_service_key
```

### 3. 清除舊簽名並重新生成

執行以下 SQL 來清除所有 APPROVED 發票的舊簽名：

```sql
UPDATE invoices
SET
  aegis_signature = NULL,
  aegis_nonce = NULL,
  aegis_deadline = NULL,
  aegis_due_date = NULL
WHERE status = 'APPROVED';
```

或者在 Supabase Dashboard 中執行，或使用我們的腳本。

### 4. 重啟後端

```bash
cd backend
npm run start:dev
```

### 5. 測試

1. 在 Supplier Portal 點擊 "Accept Offer"
2. 前端會自動請求新簽名（因為舊的被清除了）
3. 後端會用正確的私鑰生成新簽名
4. 交易應該成功！

---

## 🔍 驗證步驟

### 驗證私鑰格式正確

```bash
cd backend
node -e "
const { ethers } = require('ethers');
require('dotenv').config();
const wallet = new ethers.Wallet(process.env.SERVER_WALLET_PRIVATE_KEY);
console.log('✅ 私鑰有效！');
console.log('錢包地址:', wallet.address);
console.log('應該是:', '0x782c3446aeDabdD934e97ee255D5C5c62fE289D3');
"
```

應該看到：
```
✅ 私鑰有效！
錢包地址: 0x782c3446aeDabdD934e97ee255D5C5c62fE289D3
應該是: 0x782c3446aeDabdD934e97ee255D5C5c62fE289D3
```

### 驗證簽名正確

創建新發票並 approve 後：

```bash
cd backend
node verify-signature.js INV-XXXXXX
```

應該看到：
```
✅ SIGNATURE IS VALID!
The signature was created by the correct wallet.
```

---

## ⚠️ 重要提醒

### 私鑰安全
- **永遠不要**把私鑰提交到 Git
- **永遠不要**分享私鑰給任何人
- `.env` 檔案已經在 `.gitignore` 中

### 私鑰格式
- ✅ 正確：`0x1234...` (66 characters)
- ❌ 錯誤：`1234...` (沒有 0x 前綴)
- ❌ 錯誤：引號包起來的字符串
- ❌ 錯誤：助記詞（12 或 24 個單詞）

---

## 🆘 如果還是失敗

### 檢查清單

1. ✅ `SERVER_WALLET_PRIVATE_KEY` 格式正確（0x 開頭，66 字符）
2. ✅ 私鑰對應的地址是 `0x782c3446aeDabdD934e97ee255D5C5c62fE289D3`
3. ✅ `ARC_CHAIN_ID=5042002`
4. ✅ `ARC_CONTRACT_ADDRESS=0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C`
5. ✅ 後端已重啟
6. ✅ 舊簽名已清除
7. ✅ 重新生成了新簽名

### 診斷工具

我們創建了多個診斷工具在 `backend/` 目錄：

- `quick-diagnose.js` - 快速檢查配置
- `check-invoice-status.js <INVOICE>` - 檢查發票鏈上狀態
- `verify-signature.js <INVOICE>` - 驗證簽名正確性
- `diagnose-signature.js` - 完整的簽名診斷

---

## 📚 技術細節

### EIP-712 簽名原理

1. **構建 typed data**（包含 domain, types, values）
2. **用私鑰簽名** → 產生 signature
3. **任何人都可以從 signature 恢復出簽名者地址**
4. **合約驗證**：恢復的地址 == aegisServerWallet

### 為什麼會失敗？

如果私鑰格式錯誤：
- ethers.js 可能使用**預設值**或**錯誤的密鑰**
- 導致簽名用錯誤的地址簽署
- 合約驗證時發現地址不匹配
- 交易被 revert

---

需要幫助？請分享診斷工具的輸出結果！
