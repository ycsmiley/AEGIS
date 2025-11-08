# 交易失敗問題修復指南

## 問題診斷結果 ✅

根據 debug 輸出，所有前端參數都是正確的：
- ✅ Payout Amount: 0.98 USDC
- ✅ Repayment Amount: 1.00 USDC
- ✅ Deadline 沒有過期
- ✅ Due Date 在未來
- ✅ 所有驗證都通過

**但交易還是在錢包中失敗了。**

## 根本原因 🎯

問題出在 **EIP-712 簽名驗證失敗**。

### 合約配置

根據 `contracts/deployments/arcTestnet-latest.json`:

```json
{
  "contracts": {
    "ArcPool": "0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C"
  },
  "aegisServerWallet": "0x782c3446aedabdd934e97ee255d5c5c62fe289d3"
}
```

智能合約在部署時設定了 `aegisServerWallet = 0x782c3446aedabdd934e97ee255d5c5c62fe289d3`

### 簽名驗證流程

合約的 `withdrawFinancing` 函數會驗證簽名（ArcPool.sol:161）:

```solidity
bytes32 hash = _hashTypedDataV4(structHash);
address signer = ECDSA.recover(hash, signature);
require(signer == aegisServerWallet, "Invalid signature");
```

**關鍵點：** 後端用來簽名的私鑰必須對應到 `0x782c3446aedabdd934e97ee255d5c5c62fe289d3` 這個地址，否則合約會拒絕交易！

## 解決方案

### 選項 1：使用正確的私鑰 (推薦)

如果你有 `0x782c3446aedabdd934e97ee255d5c5c62fe289d3` 的私鑰：

1. **更新後端 .env 文件：**

```bash
cd backend
nano .env  # 或使用你喜歡的編輯器
```

2. **設定正確的環境變數：**

```env
# Aegis Server Wallet (必須匹配合約設定)
SERVER_WALLET_PRIVATE_KEY=0x你的私鑰
AEGIS_SERVER_WALLET=0x782c3446aedabdd934e97ee255d5c5c62fe289d3

# Contract Info
ARC_CONTRACT_ADDRESS=0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C
ARC_CHAIN_ID=5042002
```

3. **重啟後端：**

```bash
npm run start:dev
```

4. **驗證配置：**

```bash
node diagnose-signature.js
```

應該會看到：
```
✓ MATCH: Derived address matches AEGIS_SERVER_WALLET
✓ MATCH: Matches contract's aegisServerWallet
```

### 選項 2：重新部署合約

如果你沒有 `0x782c3446aedabdd934e97ee255d5c5c62fe289d3` 的私鑰，需要重新部署合約：

1. **準備你的錢包私鑰：**

```bash
cd contracts
cp .env.example .env
nano .env
```

2. **設定環境變數：**

```env
# 使用你自己的私鑰
PRIVATE_KEY=0x你的私鑰

# 這個會自動從私鑰推導出地址
# 或者明確設定：
AEGIS_SERVER_WALLET=0x你的錢包地址

# 初始流動性（可選）
INITIAL_LIQUIDITY=10000000000000000000  # 10 USDC (18 decimals)
```

3. **重新部署：**

```bash
npx hardhat run scripts/deploy-arc.js --network arcTestnet
```

4. **更新前端配置：**

部署完成後，複製新的合約地址，更新 `frontend/.env.local`:

```env
NEXT_PUBLIC_ARC_CONTRACT_ADDRESS=0x新的合約地址
```

5. **更新後端配置：**

更新 `backend/.env`:

```env
ARC_CONTRACT_ADDRESS=0x新的合約地址
SERVER_WALLET_PRIVATE_KEY=0x你的私鑰
AEGIS_SERVER_WALLET=0x你的錢包地址
```

6. **重啟前後端：**

```bash
# 終端 1
cd frontend && npm run dev

# 終端 2
cd backend && npm run start:dev
```

## 驗證修復

1. **後端日誌檢查：**

當 buyer 批准 invoice 時，應該看到：
```
[LOG] Generated signature for invoice INV-XXX: Payout X USDC...
[LOG] Invoice XXX approved
```

2. **前端 Console 檢查：**

點擊 "Accept Offer"，檢查瀏覽器 Console (F12):
```
🔍 Transaction Parameters
  ...
  Is Expired?: ✓ No
  ✓ All validation checks pass
```

3. **交易成功：**

錢包應該顯示交易成功，供應商會收到 USDC！

## 診斷工具

### 檢查合約配置

```bash
cd backend
node check-contract-wallet.js 0x8080900fD63d6C7e4E716D1cb65F1071e98cD14C
```

### 檢查後端簽名配置

```bash
cd backend
node diagnose-signature.js
```

這會檢查：
- 私鑰是否設定
- 推導的地址是否正確
- 是否匹配合約的 aegisServerWallet

## 常見錯誤

### 錯誤 1: 私鑰不匹配

**症狀：** 交易在錢包中失敗，沒有紅色錯誤訊息

**原因：** `SERVER_WALLET_PRIVATE_KEY` 推導的地址 ≠ 合約的 `aegisServerWallet`

**解決：** 使用選項 1 或選項 2

### 錯誤 2: Signature expired

**症狀：** Console 顯示 "❌ YES - EXPIRED!"

**原因：** 簽名有 1 小時的有效期

**解決：** 刷新頁面，或讓 buyer 重新批准 invoice

### 錯誤 3: 合約地址錯誤

**症狀：** 前端顯示 "Contract not found" 或網路錯誤

**原因：** .env.local 中的合約地址不正確

**解決：** 檢查 `contracts/deployments/arcTestnet-latest.json`，更新前端 .env.local

## 額外資訊

- **Chain ID**: 5042002 (Arc Testnet)
- **RPC URL**: https://rpc.testnet.arc.network
- **Explorer**: https://explorer.testnet.arc.network
- **Native Token**: USDC (18 decimals on Arc)

---

如果問題持續，請分享：
1. `node diagnose-signature.js` 的完整輸出
2. 瀏覽器 Console 的截圖（按 F12）
3. 後端日誌中的錯誤訊息
