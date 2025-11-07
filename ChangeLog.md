# ChangeLog - Aegis Finance

## 專案變更記錄

所有重要的專案變更都會記錄在此文件中。

---

## [1.0.0] - 2025-11-07

### 🎉 初始專案建立

#### 新增功能

**專案架構**
- ✅ 建立完整的 monorepo 專案結構
- ✅ 配置 frontend（Next.js）、backend（Nest.js）、contracts（Hardhat）、database（Supabase）
- ✅ 設置 workspace 管理和統一的腳本命令

**前端 (Frontend)**
- ✅ Next.js 14 + App Router 架構設置
- ✅ TypeScript 配置完成
- ✅ Tailwind CSS + shadcn/ui 組件庫整合
- ✅ Wagmi + RainbowKit Web3 錢包連接配置
- ✅ Arc Testnet 自定義鏈配置（USDC 作為原生 Gas Token）
- ✅ Supabase 客戶端設置和類型定義
- ✅ 首頁Landing Page 建立，包含功能介紹和流程說明
- ✅ 基礎 UI 組件（Button, Card）建立
- ✅ 全域樣式和主題配置（支持深色模式）

**智能合約 (Smart Contracts)**
- ✅ ArcPool.sol 主合約實作（Arc 原生 USDC 優化版本）
  - LP 存款/提款功能
  - 供應商融資提取功能（EIP-712 簽名驗證）
  - 發票還款功能
  - 管理員功能（更新 Aegis 錢包）
  - 完整的事件記錄
- ✅ Hardhat 配置（支援 Arc Testnet）
- ✅ 部署腳本（deploy-arc.js）
  - 自動保存部署資訊
  - 支援初始流動性注入
  - 自動合約驗證
- ✅ 完整的單元測試（ArcPool.test.js）
  - LP 存款/提款測試
  - 融資流程測試
  - EIP-712 簽名驗證測試
  - 權限控制測試

**後端 (Backend)**
- ✅ Nest.js 框架設置
- ✅ TypeScript 配置和模組化架構
- ✅ Supabase 整合（服務層實作）
- ✅ Aegis AI 定價引擎模組
  - 動態折扣率計算（基於期限、流動性、信用評級）
  - 風險評分系統（0-100 分制）
  - EIP-712 簽名生成和驗證
  - 人類可讀的定價解釋生成
- ✅ Blockchain 服務模組
  - Arc 鏈連接和合約互動
  - 池狀態查詢功能
  - LP 餘額查詢
  - 發票狀態檢查
  - 事件監聽機制
- ✅ 認證模組基礎架構
- ✅ 發票管理模組基礎架構
- ✅ 健康檢查 API 端點

**資料庫 (Database)**
- ✅ 完整的 Supabase PostgreSQL Schema 設計
  - companies 表（買家和供應商公司資料）
  - user_profiles 表（用戶檔案，整合 Supabase Auth）
  - invoices 表（發票資料，包含 AI 定價和區塊鏈資訊）
  - transactions 表（交易記錄）
  - pool_status 表（池狀態監控）
  - audit_logs 表（審計日誌）
- ✅ Row Level Security (RLS) 政策設置
  - 供應商只能查看自己的發票
  - 買家只能查看自己的發票
  - LP 可以查看公開池狀態
  - 管理員可以查看審計日誌
- ✅ 資料庫索引優化
- ✅ 自動更新時間戳觸發器
- ✅ 發票狀態變更自動記錄
- ✅ 分析視圖（invoice_summary, pool_analytics）
- ✅ 輔助函數（get_invoice_details）

**專案文檔**
- ✅ README.md（英文版，完整的專案說明）
  - 專案概述和核心特色
  - 技術架構圖
  - 快速開始指南
  - Arc 鏈特性說明
  - 完整融資流程說明
  - 測試指南
  - Demo 準備清單
- ✅ .gitignore 配置
- ✅ .env.example 環境變數模板
  - 前端環境變數
  - 後端環境變數
  - 智能合約環境變數

**開發工具配置**
- ✅ ESLint 配置
- ✅ Prettier 配置
- ✅ TypeScript 嚴格模式
- ✅ Git pre-commit hooks 準備

#### Arc 鏈特性整合

**USDC 作為原生 Gas Token**
- ✅ 智能合約使用 `msg.value` 直接處理 USDC（無需 ERC20）
- ✅ 前端 Wagmi 配置適配 Arc 鏈（6 位小數）
- ✅ 簡化的用戶體驗（無需 approve，無需雙幣種）

**優勢實現**
- ✅ 單一貨幣流程（用戶只需持有 USDC）
- ✅ 透明的成本結構（Gas 和支付都是 USDC）
- ✅ 降低進入門檻（新用戶無需先獲取 ETH）

#### 技術規範

**代碼標準**
- 使用 TypeScript 嚴格模式
- 遵循 ESLint 和 Prettier 規範
- 所有智能合約函數都有完整的 NatSpec 註釋
- 後端服務使用 NestJS 裝飾器模式

**安全措施**
- 智能合約使用 ReentrancyGuard
- EIP-712 簽名驗證
- Row Level Security 資料庫政策
- 環境變數與敏感資訊分離

**測試覆蓋**
- 智能合約單元測試（Hardhat + Chai）
- 後端服務準備 Jest 測試框架
- 前端準備 E2E 測試框架

---

### 📝 備註

**時間戳記**: 2025-11-07 (當地系統時間)

**專案狀態**: 初始建置完成，核心架構已建立

**下一步計劃**:
1. 完成前端各個 Portal 頁面（Buyer, Supplier, LP）
2. 實作發票上傳和管理功能
3. 實作 AI 定價的實時推送
4. 完成買家批准流程
5. 實作供應商接受融資的完整流程
6. 整合 Linear 風格的黑白極簡設計
7. 部署到測試環境
8. 準備 Demo 演示

**技術債務**:
- 需要實作完整的錯誤處理機制
- 需要添加日誌系統
- 需要完善 API 文檔（Swagger/OpenAPI）
- 需要添加更多的集成測試

---

## 變更類型說明

- **新增**: 新功能或新文件
- **修改**: 現有功能的變更
- **修復**: Bug 修復
- **移除**: 移除的功能或文件
- **安全**: 安全相關的修復
- **效能**: 性能優化
- **重構**: 代碼重構（不影響功能）
- **文檔**: 文檔更新
- **測試**: 測試相關的變更
- **配置**: 配置文件變更

---

_所有變更皆使用當地系統時間記錄_

