# Frontend Migration Guide for V2 Contract

## 🎯 Overview

The V2 contract adds **interest mechanism** and **late fees**. This requires updates to:
1. Contract call parameters (5 → 7 parameters)
2. Signature data structure
3. Display new fields (interest, due date, etc.)
4. Handle repayment logic

---

## 📝 Required Changes

### 1. Update Contract ABI Import

First, ensure you're using the latest compiled ABI:

```bash
# The ABI is automatically updated when you compile
# Location: contracts/artifacts/contracts/ArcPool.sol/ArcPool.json
```

### 2. Update `withdrawFinancing()` Function Call

#### ❌ Old Code (V1)
```typescript
// frontend/src/components/SupplierPortal.tsx
const signatureData = JSON.parse(invoice.aegis_signature);

await arcPoolContract.withdrawFinancing(
  ethers.id(invoice.id),              // invoiceId
  ethers.parseUnits(
    invoice.aegis_payout_offer.toString(), 6
  ),                                   // payoutAmount
  signatureData.nonce,                 // nonce
  signatureData.deadline,              // deadline
  signatureData.signature,             // signature
);
```

#### ✅ New Code (V2)
```typescript
// frontend/src/components/SupplierPortal.tsx
const signatureData = JSON.parse(invoice.aegis_signature);

await arcPoolContract.withdrawFinancing(
  ethers.id(invoice.id),              // invoiceId
  ethers.parseUnits(
    invoice.aegis_payout_offer.toString(), 6
  ),                                   // payoutAmount
  ethers.parseUnits(
    signatureData.repaymentAmount.toString(), 6
  ),                                   // repaymentAmount ← NEW
  signatureData.dueDate,               // dueDate ← NEW
  signatureData.nonce,                 // nonce
  signatureData.deadline,              // deadline
  signatureData.signature,             // signature
);
```

---

### 3. Display Interest Information

Add interest calculation and display in the supplier dashboard:

```typescript
// frontend/src/components/InvoiceCard.tsx
interface InvoiceCardProps {
  invoice: {
    amount: number;
    aegis_payout_offer: number;
    aegis_signature: string;
    status: string;
  };
}

export function InvoiceCard({ invoice }: InvoiceCardProps) {
  const signatureData = invoice.aegis_signature 
    ? JSON.parse(invoice.aegis_signature) 
    : null;

  // Calculate interest
  const interest = signatureData 
    ? signatureData.repaymentAmount - invoice.aegis_payout_offer 
    : 0;
  
  const interestRate = signatureData
    ? ((interest / invoice.aegis_payout_offer) * 100).toFixed(2)
    : 0;

  // Calculate due date
  const dueDate = signatureData 
    ? new Date(signatureData.dueDate * 1000) 
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice #{invoice.invoice_number}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Invoice Amount */}
          <div className="flex justify-between">
            <span>Invoice Amount:</span>
            <span className="font-semibold">
              ${invoice.amount.toLocaleString()} USDC
            </span>
          </div>

          {/* You Receive (Payout) */}
          <div className="flex justify-between">
            <span>You Receive Now:</span>
            <span className="font-semibold text-green-600">
              ${invoice.aegis_payout_offer.toLocaleString()} USDC
            </span>
          </div>

          {/* Interest (NEW) */}
          {interest > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Interest Cost:</span>
              <span>
                ${interest.toLocaleString()} USDC ({interestRate}%)
              </span>
            </div>
          )}

          {/* Due Date (NEW) */}
          {dueDate && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Repayment Due:</span>
              <span>{dueDate.toLocaleDateString()}</span>
            </div>
          )}

          {/* Repayment Amount (NEW) */}
          {signatureData && (
            <div className="flex justify-between text-sm">
              <span>Total Repayment:</span>
              <span className="font-medium">
                ${signatureData.repaymentAmount.toLocaleString()} USDC
              </span>
            </div>
          )}

          {/* Action Button */}
          {invoice.status === 'APPROVED' && (
            <Button 
              onClick={() => handleAcceptFinancing(invoice)}
              className="w-full mt-4"
            >
              Accept Financing & Receive ${invoice.aegis_payout_offer.toLocaleString()} Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 4. Add Repayment Functionality (Buyer Portal)

Create a repayment component for buyers:

```typescript
// frontend/src/components/BuyerRepayment.tsx
import { useState, useEffect } from 'react';
import { useContractWrite, useContractRead } from 'wagmi';
import { ethers } from 'ethers';
import ArcPoolABI from '@/contracts/ArcPool.json';

interface RepaymentProps {
  invoiceId: string;
}

export function RepaymentComponent({ invoiceId }: RepaymentProps) {
  const [isOverdue, setIsOverdue] = useState(false);
  const [lateFee, setLateFee] = useState(0);
  const [totalDue, setTotalDue] = useState(0);

  // Read financing record from contract
  const { data: record } = useContractRead({
    address: process.env.NEXT_PUBLIC_ARC_CONTRACT_ADDRESS as `0x${string}`,
    abi: ArcPoolABI,
    functionName: 'financingRecords',
    args: [ethers.id(invoiceId)],
  });

  useEffect(() => {
    if (record) {
      const now = Math.floor(Date.now() / 1000);
      const dueDate = Number(record.dueDate);
      const repaymentAmount = Number(ethers.formatUnits(record.repaymentAmount, 6));
      
      if (now > dueDate) {
        // Calculate late fee (1% per day, max 30%)
        const daysLate = Math.floor((now - dueDate) / 86400);
        const calculatedLateFee = Math.min(
          repaymentAmount * daysLate * 0.01,
          repaymentAmount * 0.3
        );
        setLateFee(calculatedLateFee);
        setIsOverdue(true);
        setTotalDue(repaymentAmount + calculatedLateFee);
      } else {
        setLateFee(0);
        setIsOverdue(false);
        setTotalDue(repaymentAmount);
      }
    }
  }, [record]);

  // Prepare repayment transaction
  const { write: repay, isLoading } = useContractWrite({
    address: process.env.NEXT_PUBLIC_ARC_CONTRACT_ADDRESS as `0x${string}`,
    abi: ArcPoolABI,
    functionName: 'repay',
    args: [ethers.id(invoiceId)],
    value: ethers.parseUnits(totalDue.toString(), 6),
  });

  if (!record || record.repaid) {
    return <div>Invoice already repaid or not found</div>;
  }

  const dueDate = new Date(Number(record.dueDate) * 1000);
  const repaymentAmount = Number(ethers.formatUnits(record.repaymentAmount, 6));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repayment Required</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Original Repayment Amount */}
        <div className="flex justify-between">
          <span>Original Amount:</span>
          <span className="font-semibold">
            ${repaymentAmount.toLocaleString()} USDC
          </span>
        </div>

        {/* Due Date */}
        <div className="flex justify-between">
          <span>Due Date:</span>
          <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
            {dueDate.toLocaleDateString()}
            {isOverdue && ' (OVERDUE)'}
          </span>
        </div>

        {/* Late Fee (if applicable) */}
        {isOverdue && (
          <div className="flex justify-between text-red-600">
            <span>Late Fee:</span>
            <span className="font-semibold">
              ${lateFee.toLocaleString()} USDC
            </span>
          </div>
        )}

        {/* Total Due */}
        <div className="flex justify-between text-lg border-t pt-2">
          <span className="font-semibold">Total Due:</span>
          <span className="font-bold">
            ${totalDue.toLocaleString()} USDC
          </span>
        </div>

        {/* Warning Banner */}
        {isOverdue && (
          <Alert variant="destructive">
            <AlertDescription>
              ⚠️ This invoice is overdue. A late fee of ${lateFee.toLocaleString()} USDC has been applied.
              Late fees increase by 1% per day (maximum 30%).
            </AlertDescription>
          </Alert>
        )}

        {/* Repay Button */}
        <Button
          onClick={() => repay?.()}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? 'Processing...' : `Repay ${totalDue.toLocaleString()} USDC`}
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

### 5. Update LP Dashboard (Show Interest Earnings)

```typescript
// frontend/src/components/LPDashboard.tsx
export function LPDashboard() {
  const [poolStatus, setPoolStatus] = useState(null);

  // Read pool status
  const { data } = useContractRead({
    address: process.env.NEXT_PUBLIC_ARC_CONTRACT_ADDRESS as `0x${string}`,
    abi: ArcPoolABI,
    functionName: 'getPoolStatus',
  });

  useEffect(() => {
    if (data) {
      setPoolStatus({
        total: Number(ethers.formatUnits(data[0], 6)),
        available: Number(ethers.formatUnits(data[1], 6)),
        utilized: Number(ethers.formatUnits(data[2], 6)),
        financed: Number(ethers.formatUnits(data[3], 6)),
      });
    }
  }, [data]);

  // Read total interest earned (NEW)
  const { data: interestEarned } = useContractRead({
    address: process.env.NEXT_PUBLIC_ARC_CONTRACT_ADDRESS as `0x${string}`,
    abi: ArcPoolABI,
    functionName: 'totalInterestEarned',
  });

  const totalInterest = interestEarned 
    ? Number(ethers.formatUnits(interestEarned, 6)) 
    : 0;

  const lpInterest = totalInterest * 0.9; // LPs get 90%

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Pool</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            ${poolStatus?.total.toLocaleString() || 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">
            ${poolStatus?.available.toLocaleString() || 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-600">
            ${poolStatus?.financed.toLocaleString() || 0}
          </p>
        </CardContent>
      </Card>

      {/* NEW: Interest Earned */}
      <Card>
        <CardHeader>
          <CardTitle>Interest Earned (LP Share)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-purple-600">
            ${lpInterest.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            90% of ${totalInterest.toLocaleString()} total
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 📊 Summary of Changes

| Component | File | Changes Required |
|-----------|------|------------------|
| Contract Call | `SupplierPortal.tsx` | Add 2 parameters to `withdrawFinancing()` |
| Invoice Display | `InvoiceCard.tsx` | Show interest, due date, repayment amount |
| Buyer Repayment | `BuyerRepayment.tsx` | Create new component |
| LP Dashboard | `LPDashboard.tsx` | Display total interest earned |
| Contract ABI | Import statements | Use latest compiled ABI |

---

## ✅ Testing Checklist

- [ ] Supplier can see interest and due date
- [ ] Supplier can withdraw financing with new parameters
- [ ] Buyer can see repayment amount
- [ ] Buyer can repay invoice (on time)
- [ ] Buyer sees late fee warning (if overdue)
- [ ] LP can see total interest earned
- [ ] All contract calls use correct parameter order

---

## 🚀 Quick Start

1. **Update contract address** in `.env.local`:
   ```bash
   NEXT_PUBLIC_ARC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```

2. **Copy latest ABI** (if needed):
   ```bash
   cp ../contracts/artifacts/contracts/ArcPool.sol/ArcPool.json ./src/contracts/
   ```

3. **Update all contract call sites** with new parameters

4. **Add new UI components** for displaying interest/due dates

5. **Test locally** with Hardhat node running

---

## 💡 Pro Tips

### Calculating APY for LPs

```typescript
// Calculate annualized return
function calculateAPY(
  totalInterest: number,
  totalDeposited: number,
  daysFinanced: number
): number {
  const dailyReturn = totalInterest / totalDeposited;
  const apy = ((1 + dailyReturn) ** 365 - 1) * 100;
  return apy;
}
```

### Formatting Dates

```typescript
// Show relative time until due
import { formatDistanceToNow } from 'date-fns';

const dueDate = new Date(signatureData.dueDate * 1000);
const timeUntilDue = formatDistanceToNow(dueDate, { addSuffix: true });
// "in 90 days"
```

### Real-time Updates

```typescript
// Listen to Repayment events
arcPoolContract.on('Repayment', (invoiceId, payer, amount, interest, lateFee) => {
  console.log(`Invoice repaid! Interest: ${ethers.formatUnits(interest, 6)} USDC`);
  // Update UI
});
```

---

## 🆘 Common Issues

### Issue: "Invalid signature"
**Cause**: Using old signature format (5 fields instead of 7)
**Fix**: Ensure backend generates signatures with `repaymentAmount` and `dueDate`

### Issue: "Repayment must be greater than payout"
**Cause**: Contract validation failed
**Fix**: Ensure `repaymentAmount > payoutAmount` in backend pricing

### Issue: Transaction fails with no error
**Cause**: Insufficient USDC for repayment
**Fix**: Ensure buyer has enough USDC + gas

---

**Need help? Check `backend/USAGE_EXAMPLE.md` for backend integration details.**

