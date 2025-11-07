# 🎨 Aegis Finance - 完整平台設計規劃

## 📋 目錄
1. [設計原則（參考 Linear）](#設計原則)
2. [完整功能地圖](#功能地圖)
3. [用戶流程](#用戶流程)
4. [設計系統](#設計系統)
5. [實施計劃](#實施計劃)

---

## 🎯 設計原則（參考 Linear）

### 核心原則

#### 1. **速度優先 (Speed First)**
- 快速加載（<100ms 響應）
- 即時反饋
- 樂觀更新（Optimistic UI）
- 預加載關鍵數據

#### 2. **極簡主義 (Minimalism)**
- 去除不必要的元素
- 大量留白
- 清晰的層級結構
- 一次只聚焦一件事

#### 3. **流暢體驗 (Fluid Experience)**
- 平滑的動畫過渡
- 手勢支持
- 鍵盤快捷鍵
- 智能搜索

#### 4. **專業感 (Professional)**
- 簡潔的排版
- 統一的色彩語言
- 精緻的細節
- 高信息密度

---

## 🗺️ 完整功能地圖

### 1. **全局功能**

```
┌─────────────────────────────────────┐
│         Aegis Finance               │
├─────────────────────────────────────┤
│  🔗 Wallet Connection               │
│  👤 User Profile                    │
│  🔔 Notifications                   │
│  ⚙️  Settings                       │
│  🌓 Theme Toggle (Light/Dark)       │
│  📊 Global Dashboard                │
└─────────────────────────────────────┘
```

---

### 2. **Supplier（供應商）功能**

```
┌─────────────────────────────────────┐
│      Supplier Dashboard             │
├─────────────────────────────────────┤
│                                     │
│  📊 Overview                        │
│  ├─ Total Invoices: 15             │
│  ├─ Financed: $125,000             │
│  ├─ Pending Approval: 3            │
│  └─ Average Rate: 8.5%             │
│                                     │
│  ➕ Upload Invoice [Quick Action]   │
│                                     │
│  📋 Invoice List                    │
│  ├─ Status Filter                  │
│  ├─ Search                         │
│  └─ Sort by: Date/Amount/Status    │
│                                     │
│  💰 Financing Offers                │
│  ├─ Active Offers (3)              │
│  ├─ Interest Rate                  │
│  └─ Quick Accept                   │
│                                     │
│  📈 Analytics                       │
│  ├─ Financing Timeline             │
│  ├─ Cost Analysis                  │
│  └─ Savings vs Traditional         │
│                                     │
└─────────────────────────────────────┘
```

#### 關鍵操作流程：

**A. 上傳發票**
```
1. Click "Upload Invoice" →
2. Modal Opens:
   ├─ Drag & Drop PDF
   ├─ OR Manual Entry Form
   │  ├─ Invoice Number
   │  ├─ Amount
   │  ├─ Buyer Name
   │  ├─ Due Date
   │  └─ Description
   └─ Submit → AI 自動驗證

3. Status: PENDING → Waiting for Buyer Approval
```

**B. 接受融資**
```
1. Dashboard shows: "New Offer Available" 💰
2. Click to view offer details:
   ├─ Payout: $9,500
   ├─ Interest: $500 (5%)
   ├─ Repayment: $10,000
   ├─ Due Date: 90 days
   └─ [Accept] [Decline]

3. Click Accept →
   ├─ Wallet confirmation
   ├─ Transaction sent
   └─ Funds received ✅
```

---

### 3. **Buyer（買家）功能**

```
┌─────────────────────────────────────┐
│       Buyer Dashboard               │
├─────────────────────────────────────┤
│                                     │
│  📊 Overview                        │
│  ├─ Pending Approvals: 3           │
│  ├─ Active Invoices: 8             │
│  ├─ Total Outstanding: $85,000     │
│  └─ Next Payment Due: 5 days       │
│                                     │
│  📋 Tabs Navigation                 │
│  ├─ 🟡 Pending Approval (3)        │
│  ├─ ✅ Approved (5)                │
│  ├─ 💸 Awaiting Repayment (8)     │
│  └─ ✔️  Paid (42)                  │
│                                     │
│  ⚡ Quick Actions                   │
│  ├─ Approve All                    │
│  └─ Bulk Repayment                 │
│                                     │
│  💳 Repayment Management            │
│  ├─ One-Click Repay                │
│  ├─ Schedule Payment               │
│  └─ Auto-Pay Settings              │
│                                     │
└─────────────────────────────────────┘
```

#### 關鍵操作流程：

**A. 審核發票**
```
1. "Pending Approval" tab shows new invoices
2. Click invoice → Detail Modal
   ├─ Invoice PDF preview
   ├─ Supplier info
   ├─ Amount & Due date
   ├─ AI Risk Assessment
   │  ├─ Confidence: 98%
   │  ├─ Fraud Risk: Low
   │  └─ Historical Payment: Good
   └─ [Approve] [Reject] [Request Info]

3. Approve →
   ├─ Confirm with 2FA (optional)
   └─ Status: APPROVED ✅
```

**B. 還款操作**
```
1. "Awaiting Repayment" shows due invoices
2. Card displays:
   ├─ Original Amount: $10,000
   ├─ Due Date: Dec 31, 2025
   ├─ Late Fee: $0 (or calculated)
   └─ Total Due: $10,000

3. Click "Repay" →
   ├─ Wallet confirmation
   ├─ Transaction sent
   └─ Status: PAID ✅
```

---

### 4. **LP（流動性提供者）功能**

```
┌─────────────────────────────────────┐
│         LP Dashboard                │
├─────────────────────────────────────┤
│                                     │
│  💰 Your Position                   │
│  ├─ Total Deposited: $50,000       │
│  ├─ Interest Earned: $2,150        │
│  ├─ APY: 12.5%                     │
│  └─ [Deposit] [Withdraw]           │
│                                     │
│  📊 Pool Overview                   │
│  ├─ Total Pool: $1,250,000         │
│  ├─ Available: $350,000 (28%)      │
│  ├─ Deployed: $900,000 (72%)       │
│  └─ Total Interest: $45,000        │
│                                     │
│  📈 Performance Chart               │
│  ├─ 7D / 30D / 90D / All Time     │
│  └─ Interactive earnings graph     │
│                                     │
│  🧮 Calculator                      │
│  ├─ Estimate Earnings              │
│  ├─ Input: Amount + Duration       │
│  └─ Output: Projected APY          │
│                                     │
│  📜 Transaction History             │
│  ├─ Deposits                       │
│  ├─ Withdrawals                    │
│  └─ Interest Payments              │
│                                     │
└─────────────────────────────────────┘
```

#### 關鍵操作流程：

**A. 存入資金**
```
1. Click "Deposit" → Modal
2. Enter amount: [$10,000]
3. See preview:
   ├─ Current APY: 12.5%
   ├─ Est. Monthly: $104
   └─ Est. Yearly: $1,250

4. Confirm → Wallet transaction
5. Success → Dashboard updates
```

**B. 提取資金**
```
1. Click "Withdraw" → Modal
2. Available: $50,000
3. Enter amount: [$5,000]
4. Warning if > available liquidity
5. Confirm → Wallet transaction
```

---

## 🎨 設計系統

### 色彩系統（參考 Linear）

#### 主色調（Primary）
```css
--primary-50:  #EEF2FF;  /* Lightest */
--primary-100: #E0E7FF;
--primary-200: #C7D2FE;
--primary-300: #A5B4FC;
--primary-400: #818CF8;
--primary-500: #6366F1;  /* Main */
--primary-600: #4F46E5;
--primary-700: #4338CA;
--primary-800: #3730A3;
--primary-900: #312E81;  /* Darkest */
```

#### 語義色彩
```css
/* Success */
--success: #10B981;
--success-bg: #ECFDF5;

/* Warning */
--warning: #F59E0B;
--warning-bg: #FEF3C7;

/* Error */
--error: #EF4444;
--error-bg: #FEE2E2;

/* Info */
--info: #3B82F6;
--info-bg: #DBEAFE;
```

#### 中性色（灰階）
```css
--gray-50:  #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;
```

#### 暗色主題
```css
--dark-bg-primary: #0F0F10;
--dark-bg-secondary: #18181B;
--dark-bg-tertiary: #27272A;
--dark-border: #3F3F46;
--dark-text-primary: #FAFAFA;
--dark-text-secondary: #A1A1AA;
```

---

### 排版系統

#### 字體
```css
--font-sans: 'Inter', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

#### 字號階梯
```css
--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
```

---

### 間距系統（8px Grid）

```css
--space-1:  0.25rem;  /* 4px */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-5:  1.25rem;  /* 20px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

---

### 圓角系統

```css
--radius-sm: 0.25rem;  /* 4px - 按鈕、輸入框 */
--radius-md: 0.5rem;   /* 8px - 卡片 */
--radius-lg: 0.75rem;  /* 12px - Modal */
--radius-xl: 1rem;     /* 16px - 大卡片 */
--radius-full: 9999px; /* 圓形 - 頭像、徽章 */
```

---

### 陰影系統

```css
/* Subtle */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Card */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Modal */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* Focus Ring */
--ring: 0 0 0 3px rgba(99, 102, 241, 0.1);
```

---

### 動畫原則

#### 時長
```css
--duration-fast:   150ms;  /* 按鈕、hover */
--duration-normal: 250ms;  /* Modal、drawer */
--duration-slow:   400ms;  /* 頁面轉場 */
```

#### 緩動函數
```css
--ease-in:     cubic-bezier(0.4, 0, 1, 1);
--ease-out:    cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## 🧩 核心組件庫

### 1. **Button**

```tsx
// 變體
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// 尺寸
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// 狀態
<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>
<Button icon={<Icon />}>With Icon</Button>
```

---

### 2. **Card**

```tsx
<Card hover>
  <CardHeader>
    <CardTitle>Invoice #INV-001</CardTitle>
    <Badge status="approved">Approved</Badge>
  </CardHeader>
  <CardContent>
    <Stat label="Amount" value="$10,000" />
    <Stat label="Due Date" value="Dec 31, 2025" />
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

---

### 3. **Modal / Dialog**

```tsx
<Modal open={isOpen} onClose={handleClose}>
  <ModalHeader>
    <ModalTitle>Accept Financing</ModalTitle>
    <ModalClose />
  </ModalHeader>
  <ModalContent>
    {/* Content */}
  </ModalContent>
  <ModalFooter>
    <Button variant="ghost" onClick={handleClose}>
      Cancel
    </Button>
    <Button onClick={handleConfirm}>
      Confirm
    </Button>
  </ModalFooter>
</Modal>
```

---

### 4. **Table**

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Amount</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {invoices.map((invoice) => (
      <TableRow key={invoice.id} hover>
        <TableCell>{invoice.number}</TableCell>
        <TableCell>{invoice.amount}</TableCell>
        <TableCell>
          <Badge>{invoice.status}</Badge>
        </TableCell>
        <TableCell>
          <IconButton icon={<MoreIcon />} />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### 5. **Stats / Metrics**

```tsx
<StatsGrid>
  <StatCard
    label="Total Financed"
    value="$125,000"
    change="+12.5%"
    trend="up"
    icon={<TrendingUpIcon />}
  />
  <StatCard
    label="Active Invoices"
    value="15"
    change="+3"
    trend="up"
  />
  <StatCard
    label="Average Rate"
    value="8.5%"
    change="-0.5%"
    trend="down"
  />
</StatsGrid>
```

---

### 6. **Toast / Notification**

```tsx
// Success
toast.success('Invoice uploaded successfully!');

// Error
toast.error('Transaction failed. Please try again.');

// Info
toast.info('New financing offer available');

// Loading
const loadingToast = toast.loading('Processing transaction...');
// Later:
toast.success('Transaction complete!', { id: loadingToast });
```

---

## 🛠️ 實施計劃

### Phase 1: 基礎設施（1-2 週）

#### Week 1: 設計系統
- [ ] 建立 Tailwind 配置（色彩、間距、字體）
- [ ] 創建基礎組件庫
  - [ ] Button
  - [ ] Card
  - [ ] Modal
  - [ ] Input / Form
  - [ ] Badge / Tag
- [ ] 設定動畫系統（Framer Motion）
- [ ] 實現暗色主題切換

#### Week 2: 佈局與導航
- [ ] 主佈局（Header + Sidebar + Content）
- [ ] 導航系統（Tab navigation）
- [ ] 錢包連接 UI
- [ ] Loading states
- [ ] Empty states

---

### Phase 2: Supplier 功能（2-3 週）

#### Week 3: 發票管理
- [ ] 發票上傳 Modal
  - [ ] 拖放上傳
  - [ ] 表單輸入
  - [ ] PDF 預覽
- [ ] 發票列表
  - [ ] 卡片視圖
  - [ ] 表格視圖
  - [ ] 篩選 & 搜索
- [ ] 發票詳情頁

#### Week 4: 融資流程
- [ ] 融資報價卡片
- [ ] 接受融資 Modal
- [ ] 交易確認流程
- [ ] 交易狀態追蹤
- [ ] 成功/失敗反饋

#### Week 5: Dashboard & Analytics
- [ ] Supplier Dashboard
- [ ] 統計卡片
- [ ] 融資歷史圖表
- [ ] 成本分析

---

### Phase 3: Buyer 功能（2 週）

#### Week 6: 審核系統
- [ ] 待審核列表
- [ ] 發票詳情 Modal
- [ ] 審核操作（批准/拒絕）
- [ ] 批量操作

#### Week 7: 還款管理
- [ ] 待還款列表
- [ ] 還款 Modal
- [ ] 逾期費用計算與顯示
- [ ] 還款歷史

---

### Phase 4: LP 功能（1-2 週）

#### Week 8: 流動性管理
- [ ] LP Dashboard
- [ ] 存入/提取 Modal
- [ ] 池狀態可視化
- [ ] 收益計算器

#### Week 9: 分析與報告
- [ ] 收益圖表
- [ ] 交易歷史
- [ ] 績效指標

---

### Phase 5: 增強功能（2 週）

#### Week 10: 用戶體驗
- [ ] 通知系統
- [ ] 搜索功能（全局）
- [ ] 鍵盤快捷鍵
- [ ] 響應式設計優化

#### Week 11: 最佳化
- [ ] 性能優化
- [ ] 動畫細節
- [ ] 錯誤處理
- [ ] Loading 優化

---

## 🎯 優先級

### P0（必須有）
1. 錢包連接
2. 基本導航
3. 發票列表
4. 融資接受
5. 還款操作
6. LP 存入/提取

### P1（重要）
1. 發票上傳
2. 審核系統
3. Dashboard 統計
4. 交易歷史
5. 通知系統

### P2（增強）
1. 高級篩選
2. 圖表分析
3. 收益計算器
4. 主題切換
5. 鍵盤快捷鍵

---

## 📱 響應式設計

### 斷點
```css
sm:  640px   /* 手機橫屏 */
md:  768px   /* 平板 */
lg:  1024px  /* 筆電 */
xl:  1280px  /* 桌面 */
2xl: 1536px  /* 大螢幕 */
```

### 佈局策略
- **Mobile First**: 從小螢幕開始設計
- **1 Column → 2 Column → 3 Column**
- **Hamburger Menu** on mobile
- **Sidebar** on desktop

---

## 🔑 關鍵決策

### 技術選型
- ✅ **Next.js 14** - App Router
- ✅ **Tailwind CSS** - 樣式
- ✅ **Framer Motion** - 動畫
- ✅ **React Hook Form** - 表單
- ✅ **Zustand** - 狀態管理（輕量）
- ✅ **React Query** - 數據獲取
- ✅ **Sonner** - Toast 通知

### 為什麼參考 Linear？
1. **極簡但功能完整** - 適合金融平台
2. **專業感強** - 建立信任
3. **性能優異** - 用戶體驗好
4. **設計一致** - 易於維護

---

## 📚 參考資源

- [Linear Design System](https://linear.app/design)
- [Tailwind UI](https://tailwindui.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

**準備開始實施了嗎？我們可以從 Phase 1 的設計系統開始！** 🚀
