'use client';

import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, id as hashString } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ArcPoolABI from '@/contracts/ArcPool.json';

interface RepaymentProps {
  invoiceId: string;
  contractAddress: `0x${string}`;
}

export function BuyerRepayment({ invoiceId, contractAddress }: RepaymentProps) {
  const [isOverdue, setIsOverdue] = useState(false);
  const [lateFee, setLateFee] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [repaymentAmount, setRepaymentAmount] = useState(0);

  const invoiceHash = hashString(invoiceId) as `0x${string}`;

  // Read financing record from contract
  const { data: record, isLoading: isLoadingRecord } = useReadContract({
    address: contractAddress,
    abi: ArcPoolABI,
    functionName: 'financingRecords',
    args: [invoiceHash],
  });

  // Prepare repayment transaction
  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError
  } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (record && Array.isArray(record) && record.length >= 7) {
      const [_, __, payoutAmountBN, repaymentAmountBN, dueDateBN, ___, repaid] = record;

      if (repaid) return;

      const now = Math.floor(Date.now() / 1000);
      const dueDate = Number(dueDateBN);
      const repaymentAmountNum = Number(formatUnits(repaymentAmountBN as bigint, 18));

      setRepaymentAmount(repaymentAmountNum);

      if (now > dueDate) {
        // Calculate late fee (1% per day, max 30%)
        const daysLate = Math.floor((now - dueDate) / 86400);
        const calculatedLateFee = Math.min(
          repaymentAmountNum * daysLate * 0.01,
          repaymentAmountNum * 0.3
        );
        setLateFee(calculatedLateFee);
        setIsOverdue(true);
        setTotalDue(repaymentAmountNum + calculatedLateFee);
      } else {
        setLateFee(0);
        setIsOverdue(false);
        setTotalDue(repaymentAmountNum);
      }
    }
  }, [record]);

  const handleRepay = async () => {
    try {
      const totalDueBigInt = parseUnits(totalDue.toFixed(6), 18);

      writeContract({
        address: contractAddress,
        abi: ArcPoolABI,
        functionName: 'repay',
        args: [invoiceHash],
        value: totalDueBigInt,
      });
    } catch (error) {
      console.error('Repayment error:', error);
    }
  };

  if (isLoadingRecord) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading repayment details...</p>
        </CardContent>
      </Card>
    );
  }

  if (!record || !Array.isArray(record) || record.length < 7) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Invoice not found or not financed</p>
        </CardContent>
      </Card>
    );
  }

  const [_, __, ___, ____, dueDateBN, _____, repaid] = record;

  if (repaid) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-green-600 font-semibold">Invoice already repaid ✓</p>
        </CardContent>
      </Card>
    );
  }

  const dueDate = new Date(Number(dueDateBN) * 1000);

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
        {isOverdue && lateFee > 0 && (
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

        {/* Success Message */}
        {isSuccess && (
          <Alert>
            <AlertDescription>
              ✓ Repayment successful! Transaction confirmed.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {writeError && (
          <Alert variant="destructive">
            <AlertDescription>
              Error: {writeError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Repay Button */}
        <Button
          onClick={handleRepay}
          disabled={isWritePending || isConfirming || isSuccess}
          className="w-full"
          size="lg"
        >
          {isWritePending || isConfirming
            ? 'Processing...'
            : isSuccess
            ? 'Repaid ✓'
            : `Repay ${totalDue.toLocaleString()} USDC`
          }
        </Button>
      </CardContent>
    </Card>
  );
}
