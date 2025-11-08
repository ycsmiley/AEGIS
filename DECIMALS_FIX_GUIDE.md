# Arc Decimals Fix Guide

## 问题说明

Arc 链虽然使用 USDC 作为原生 token，但采用 **18 位小数**（标准 native token 格式），而不是 6 位小数（ERC20 USDC 格式）。

### 症状：
- 输入 5 USDC deposit，实际扣款金额不对
- 显示的余额是实际余额的 1,000,000,000,000 倍（10^12）

### 原因：
```
用户输入 5 USDC →  前端 parseUnits("5", 6) = 5,000,000
                    ↓
                  Arc 链期待: parseUnits("5", 18) = 5,000,000,000,000,000,000
```

## 修复步骤

### 1. 前端修复

已修复：`frontend/src/lib/wagmi/config.ts`
```typescript
nativeCurrency: {
  decimals: 18, // ✅ 已改为 18
  ...
}
```

### 2. 需要手动替换所有组件中的精度

**方法 1：全局搜索替换（推荐）**

在 `frontend/src` 目录下，将所有的 `parseUnits(x, 6)` 和 `formatUnits(x, 6)` 改为 `18`：

```bash
cd frontend/src

# 查看所有需要修改的文件
grep -r "parseUnits.*6\|formatUnits.*6" . --include="*.tsx" --include="*.ts"

# 使用编辑器全局替换：
# 查找: formatUnits\((.*?), 6\)
# 替换: formatUnits($1, 18)

# 查找: parseUnits\((.*?), 6\)
# 替换: parseUnits($1, 18)
```

**需要修改的文件**：
- `src/app/lp/page.tsx` (约 3 处)
- `src/components/LPDashboard.tsx` (约 5 处)
- `src/app/supplier/page.tsx` (约 2 处)
- `src/app/buyer/page.tsx` (约 1 处)
- `src/components/BuyerRepayment.tsx` (约 2 处)

**方法 2：创建辅助常量（更安全）**

在 `frontend/src/lib/constants.ts` 创建：
```typescript
// Arc native USDC uses 18 decimals (not ERC20 6 decimals)
export const ARC_USDC_DECIMALS = 18;
```

然后在各个文件中导入使用：
```typescript
import { ARC_USDC_DECIMALS } from '@/lib/constants';

// 使用
parseUnits(amount, ARC_USDC_DECIMALS)
formatUnits(amount, ARC_USDC_DECIMALS)
```

### 3. 后端修复

**文件**: `backend/src/aegis/aegis.service.ts`

需要修改 2 处（第 326 和 327 行）：

```typescript
// 旧代码
const payoutAmountWei = ethers.parseUnits(payoutAmount.toString(), 6);
const repaymentAmountWei = ethers.parseUnits(repaymentAmount.toString(), 6);

// 新代码
const payoutAmountWei = ethers.parseUnits(payoutAmount.toString(), 18);
const repaymentAmountWei = ethers.parseUnits(repaymentAmount.toString(), 18);
```

同样在第 397-400 行也需要修改。

**建议**：在后端也创建常量：
```typescript
// backend/src/common/constants.ts
export const ARC_USDC_DECIMALS = 18;
```

### 4. 数据库注意事项

数据库中存储的金额（`amount`, `aegis_payout_offer` 等）应该是 **人类可读的数值**（例如 100.50），不是 Wei。

后端在与链交互时再转换：
```typescript
// 从数据库读取
const amount = 100.5; // USDC

// 发送到链上
const amountWei = parseUnits(amount.toString(), 18);

// 从链上读取
const amountWei = await contract.getAmount();
const amount = formatUnits(amountWei, 18); // 转回人类可读
```

## 验证步骤

修复后，测试以下场景：

### 1. LP Deposit 测试
```
输入: 1 USDC
期待: 钱包扣款 1 USDC
      LP Portal 显示 Your Deposit: $1
```

### 2. 余额显示测试
```
如果你的钱包有 100 USDC
MetaMask 应显示: 100 USDC
LP Portal 应显示: $100 (如果你全部存入)
```

### 3. Withdraw 测试
```
存入 5 USDC → Withdraw 5 USDC
应该能取回相同金额
```

## 快速参考

| 项目 | 旧值 (错误) | 新值 (正确) |
|------|------------|-------------|
| 前端 parseUnits | 6 | 18 |
| 前端 formatUnits | 6 | 18 |
| 后端 parseUnits | 6 | 18 |
| 合约内部 | 使用 msg.value (自动 18 位) | 无需改变 |
| 数据库存储 | 人类可读数值 (100.50) | 无需改变 |

## 为什么是 18 位？

虽然 Arc 使用 USDC 作为 native token，但：
- **ERC20 USDC**: 6 位小数 (1 USDC = 1,000,000 units)
- **Arc Native USDC**: 18 位小数 (1 USDC = 1,000,000,000,000,000,000 wei)

Arc 遵循以太坊的 native token 标准（18 位），而不是 ERC20 代币标准（6 位）。

## 已完成

- ✅ `frontend/src/lib/wagmi/config.ts` - decimals 改为 18
- ⏳ 其他前端组件 - 需要手动替换
- ⏳ 后端服务 - 需要手动替换

## 自动化脚本（可选）

```bash
#!/bin/bash
# fix-decimals.sh

# 前端修复
cd frontend/src
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/parseUnits(\(.*\), 6)/parseUnits(\1, 18)/g'
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/formatUnits(\(.*\), 6)/formatUnits(\1, 18)/g'

# 后端修复
cd ../../backend/src
find . -name "*.ts" | xargs sed -i 's/parseUnits(\(.*\), 6)/parseUnits(\1, 18)/g'

echo "✅ Decimals fixed! Please review changes with git diff"
```

⚠️ **注意**: 运行自动脚本前请先备份，并仔细检查更改！
