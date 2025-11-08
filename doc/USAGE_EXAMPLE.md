# Aegis Service Usage Examples

## Updated API for Contract V2

This document shows how to use the updated Aegis Service with the new interest mechanism.

---

## 1. Calculate Dynamic Pricing

The pricing engine now automatically calculates both `payoutAmount` and `repaymentAmount`.

```typescript
// Example: Pricing a $100,000 invoice with 90-day term
const pricingResult = await aegisService.calculateDynamicPricing(
  100000,                           // invoiceAmount: $100,000
  new Date('2025-02-05'),          // dueDate: 90 days from now
  95,                              // buyerRating: 95/100 (excellent)
  85,                              // supplierRating: 85/100 (good)
);

// Returns:
{
  payoutAmount: 98000,              // Supplier receives $98,000 immediately
  repaymentAmount: 100000,          // Must repay $100,000 (includes $2,000 interest)
  discountRate: 0.02,               // 2% discount rate
  riskScore: 92,                    // Overall risk score
  daysUntilDue: 90,                 // Days until repayment
  explanation: "Applied 2% discount rate based on..."
}
```

**Business Logic:**
- Interest = `repaymentAmount - payoutAmount = $2,000`
- This $2,000 will be distributed:
  - 90% ($1,800) → LPs
  - 10% ($200) → Protocol

---

## 2. Generate Financing Signature

The signature function now requires 5 parameters (was 3):

```typescript
// Old API (V1) - NO LONGER WORKS ❌
await aegisService.generateFinancingSignature(
  'INV-2024-001',
  '0xSupplierAddress',
  98000,
);

// New API (V2) - REQUIRED ✅
const signatureData = await aegisService.generateFinancingSignature(
  'INV-2024-001',                   // invoiceId
  '0xSupplierAddress',              // supplierAddress
  98000,                            // payoutAmount (what supplier gets now)
  100000,                           // repaymentAmount (what must be repaid)
  90,                               // daysUntilDue (repayment period)
);

// Returns:
{
  signature: '0x...',               // EIP-712 signature
  nonce: 1762502000000,             // Unique nonce
  deadline: 1762505600,             // Signature expires in 1 hour
  repaymentAmount: 100000,          // Amount that must be repaid
  dueDate: 1770278400,              // Repayment due date (timestamp)
}
```

---

## 3. Complete Workflow Example

Here's a complete flow from pricing to signature generation:

```typescript
async handleInvoiceApproval(invoiceId: string) {
  // Step 1: Fetch invoice and company data
  const invoice = await this.getInvoice(invoiceId);
  const buyer = await this.getCompany(invoice.buyer_id);
  const supplier = await this.getCompany(invoice.supplier_id);

  // Step 2: Calculate pricing with AI
  const pricing = await this.aegisService.calculateDynamicPricing(
    invoice.amount,
    new Date(invoice.due_date),
    buyer.credit_rating,
    supplier.credit_rating,
  );

  console.log(`
    📊 Pricing Decision:
    - Invoice Amount: $${invoice.amount}
    - Payout to Supplier: $${pricing.payoutAmount}
    - Repayment Required: $${pricing.repaymentAmount}
    - Interest: $${pricing.repaymentAmount - pricing.payoutAmount}
    - Days Until Due: ${pricing.daysUntilDue}
    - Risk Score: ${pricing.riskScore}/100
  `);

  // Step 3: Generate signature (if risk score is acceptable)
  if (pricing.riskScore >= 70) {
    const signatureData = await this.aegisService.generateFinancingSignature(
      invoiceId,
      supplier.wallet_address,
      pricing.payoutAmount,
      pricing.repaymentAmount,
      pricing.daysUntilDue,
    );

    // Step 4: Save to database
    await this.updateInvoice(invoiceId, {
      status: 'APPROVED',
      aegis_payout_offer: pricing.payoutAmount,
      aegis_discount_rate: pricing.discountRate,
      aegis_signature: JSON.stringify(signatureData),
    });

    // Step 5: Notify supplier (via Supabase Realtime)
    await this.notifySupplier(supplier.id, {
      invoiceId,
      pricing,
      signatureData,
    });

    return { success: true, pricing, signatureData };
  } else {
    // Reject if risk is too high
    await this.updateInvoice(invoiceId, {
      status: 'REJECTED',
      rejection_reason: `Risk score too low: ${pricing.riskScore}`,
    });

    return { success: false, reason: 'Risk score too low' };
  }
}
```

---

## 4. Frontend Integration

The frontend now needs to pass additional parameters when calling the contract:

```typescript
// Frontend: Supplier accepts financing
async function acceptFinancing(invoice) {
  const signatureData = JSON.parse(invoice.aegis_signature);
  
  // Call withdrawFinancing with 7 parameters (was 5)
  const tx = await arcPoolContract.withdrawFinancing(
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

  await tx.wait();
  console.log('Financing successful!');
}
```

---

## 5. Repayment Flow

When it's time to repay, the buyer needs to pay the `repaymentAmount`:

```typescript
// Frontend: Buyer repays invoice
async function repayInvoice(invoiceId) {
  const record = await arcPoolContract.financingRecords(
    ethers.id(invoiceId)
  );

  // Check if overdue
  const now = Math.floor(Date.now() / 1000);
  const isOverdue = now > record.dueDate;
  
  if (isOverdue) {
    console.warn('⚠️ Payment is overdue! Late fees will apply.');
    
    // Calculate late fee (1% per day, max 30%)
    const daysLate = Math.floor((now - record.dueDate) / 86400);
    const lateFee = Math.min(
      record.repaymentAmount * daysLate * 0.01,
      record.repaymentAmount * 0.3
    );
    
    console.log(`Late fee: $${ethers.formatUnits(lateFee, 6)} USDC`);
  }

  // Call repay() with the required amount
  const tx = await arcPoolContract.repay(
    ethers.id(invoiceId),
    { value: record.repaymentAmount } // Pay in USDC (Arc native)
  );

  await tx.wait();
  console.log('Repayment successful!');
}
```

---

## 6. Interest Calculation Examples

### Example 1: Short-term (30 days)
```
Invoice: $50,000, 30 days
Discount Rate: 0.5%
Payout: $49,750
Repayment: $50,000
Interest: $250
LP Share: $225
Protocol: $25
```

### Example 2: Standard (90 days)
```
Invoice: $100,000, 90 days
Discount Rate: 2%
Payout: $98,000
Repayment: $100,000
Interest: $2,000
LP Share: $1,800
Protocol: $200
```

### Example 3: With Late Fee (120 days + 10 days late)
```
Invoice: $100,000, 120 days
Original Discount: 3%
Payout: $97,000
Original Repayment: $100,000
Late by: 10 days
Late Fee: $10,000 (10%)
Total Due: $110,000
Total Interest: $13,000
LP Share: $11,700
Protocol: $1,300
```

---

## 7. Key Changes Summary

| Feature | V1 (Old) | V2 (New) |
|---------|----------|----------|
| Signature Parameters | 3 | 5 |
| Contract Function Args | 5 | 7 |
| Interest Mechanism | ❌ None | ✅ Automated |
| Late Fees | ❌ None | ✅ 1% per day |
| Protocol Revenue | ❌ None | ✅ 10% of interest |
| LP Returns | ❌ None | ✅ 90% of interest |

---

## 8. Migration Checklist

- [x] Update `backend/src/aegis/aegis.service.ts` ✅
- [ ] Update invoice controller to use new signature format
- [ ] Update invoice service event handlers
- [ ] Update frontend contract call sites
- [ ] Update frontend to display interest and due dates
- [ ] Test complete flow: pricing → signing → financing → repayment
- [ ] Deploy new contract to testnet
- [ ] Update contract address in backend/frontend env

---

## Next Steps

1. **Test the new signature generation** in backend
2. **Update invoice approval flow** to use new parameters
3. **Update frontend** to pass correct parameters to contract
4. **Test complete financing cycle** on local network
5. **Deploy to Arc Testnet** when ready

