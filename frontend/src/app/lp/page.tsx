'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseUnits, formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Stat } from '@/components/ui/stat';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ArcPoolABI from '@/contracts/ArcPool.json';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  PieChart,
} from 'lucide-react';

export default function LPPortal() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const contractAddress = process.env.NEXT_PUBLIC_ARC_CONTRACT_ADDRESS as `0x${string}` || '0x';

  // Read LP balance
  const { data: lpBalanceData } = useReadContract({
    address: contractAddress,
    abi: ArcPoolABI,
    functionName: 'getLPBalance',
    args: address ? [address] : undefined,
  });

  // Read pool status
  const { data: poolStatusData, isLoading: isLoadingPoolStatus } = useReadContract({
    address: contractAddress,
    abi: ArcPoolABI,
    functionName: 'getPoolStatus',
  });

  // Read total interest earned
  const { data: interestEarnedData } = useReadContract({
    address: contractAddress,
    abi: ArcPoolABI,
    functionName: 'totalInterestEarned',
  });

  const lpBalance = lpBalanceData ? Number(formatUnits(lpBalanceData as bigint, 18)) : 0;

  const poolStatus = poolStatusData && Array.isArray(poolStatusData)
    ? {
        total: Number(formatUnits(poolStatusData[0] as bigint, 18)),
        available: Number(formatUnits(poolStatusData[1] as bigint, 18)),
        utilized: Number(formatUnits(poolStatusData[2] as bigint, 18)),
        financed: Number(formatUnits(poolStatusData[3] as bigint, 18)),
      }
    : null;

  const totalInterest = interestEarnedData ? Number(formatUnits(interestEarnedData as bigint, 18)) : 0;
  const lpInterest = totalInterest * 0.9;
  const utilizationRate = poolStatus && poolStatus.total > 0
    ? (poolStatus.utilized / poolStatus.total) * 100
    : 0;

  // Deposit contract write
  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositPending,
    error: depositError
  } = useWriteContract();

  // Withdraw contract write
  const {
    writeContract: writeWithdraw,
    data: withdrawHash,
    isPending: isWithdrawPending,
    error: withdrawError
  } = useWriteContract();

  // Wait for confirmations
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid deposit amount');
      return;
    }

    try {
      setError(null);
      const amountInWei = parseUnits(depositAmount, 18);

      writeDeposit({
        address: contractAddress,
        abi: ArcPoolABI,
        functionName: 'deposit',
        value: amountInWei,
      });

      setDepositAmount('');
    } catch (err) {
      console.error('Deposit error:', err);
      setError(err instanceof Error ? err.message : 'Deposit failed');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid withdrawal amount');
      return;
    }

    if (parseFloat(withdrawAmount) > lpBalance) {
      setError('Insufficient balance');
      return;
    }

    try {
      setError(null);
      const amountInWei = parseUnits(withdrawAmount, 18);

      writeWithdraw({
        address: contractAddress,
        abi: ArcPoolABI,
        functionName: 'withdraw',
        args: [amountInWei],
      });

      setWithdrawAmount('');
    } catch (err) {
      console.error('Withdraw error:', err);
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
            <p className="text-xl text-white mb-2">Wallet Not Connected</p>
            <p className="text-neutral-400 mb-6">
              Please connect your wallet to access the LP Portal
            </p>
            <Button size="lg" onClick={openConnectModal}>Connect Wallet</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Liquidity Provider Portal</h1>
          <p className="text-neutral-400">
            Deposit USDC to earn interest from supply chain financing
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Card className="mb-6 border-red-800 bg-red-900/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-400" />
                <p className="text-red-400">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {depositError && (
          <Card className="mb-6 border-red-800 bg-red-900/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-400" />
                <p className="text-red-400">Deposit error: {depositError.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {withdrawError && (
          <Card className="mb-6 border-red-800 bg-red-900/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-400" />
                <p className="text-red-400">Withdraw error: {withdrawError.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isDepositSuccess && (
          <Card className="mb-6 border-green-800 bg-green-900/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <p className="text-green-400">
                  Deposit successful! Transaction: {depositHash?.slice(0, 10)}...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isWithdrawSuccess && (
          <Card className="mb-6 border-green-800 bg-green-900/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <p className="text-green-400">
                  Withdrawal successful! Transaction: {withdrawHash?.slice(0, 10)}...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Your Position */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Your Position</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-neutral-700">
              <CardContent className="py-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-neutral-800 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Your Deposit</p>
                    <p className="text-3xl font-bold text-white">
                      ${lpBalance.toLocaleString()} <span className="text-lg text-neutral-400">USDC</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-700">
              <CardContent className="py-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-900/30 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Your Interest Earned</p>
                    <p className="text-3xl font-bold text-green-400">
                      ${(lpBalance > 0 ? lpInterest : 0).toLocaleString()} <span className="text-lg text-neutral-500">USDC</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Deposit/Withdraw Controls */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Manage Position</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ArrowDownToLine className="h-5 w-5 text-green-400" />
                  <CardTitle>Deposit USDC</CardTitle>
                </div>
                <CardDescription>Add liquidity to earn interest</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount" className="text-neutral-300">
                    Amount (USDC)
                  </Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={isDepositPending || isDepositConfirming}
                    className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
                  />
                </div>
                <Button
                  onClick={handleDeposit}
                  disabled={
                    !depositAmount ||
                    parseFloat(depositAmount) <= 0 ||
                    isDepositPending ||
                    isDepositConfirming
                  }
                  className="w-full gap-2"
                >
                  {isDepositPending || isDepositConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="h-4 w-4" />
                      Deposit
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ArrowUpFromLine className="h-5 w-5 text-blue-400" />
                  <CardTitle>Withdraw USDC</CardTitle>
                </div>
                <CardDescription>Remove liquidity from the pool</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount" className="text-neutral-300">
                    Amount (USDC)
                  </Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={isWithdrawPending || isWithdrawConfirming}
                    className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
                  />
                  <p className="text-xs text-neutral-500">
                    Available: ${lpBalance.toLocaleString()} USDC
                  </p>
                </div>
                <Button
                  onClick={handleWithdraw}
                  disabled={
                    !withdrawAmount ||
                    parseFloat(withdrawAmount) <= 0 ||
                    isWithdrawPending ||
                    isWithdrawConfirming
                  }
                  variant="outline"
                  className="w-full gap-2"
                >
                  {isWithdrawPending || isWithdrawConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowUpFromLine className="h-4 w-4" />
                      Withdraw
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pool Overview */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Pool Overview</h2>

          {isLoadingPoolStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="py-16 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-neutral-500 mx-auto mb-4" />
                    <p className="text-neutral-400">Loading...</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Stat
                  label="Total Pool Size"
                  value={`$${poolStatus?.total.toLocaleString() || '0'}`}
                  icon={DollarSign}
                  description="Total USDC deposited"
                />
                <Stat
                  label="Available Liquidity"
                  value={`$${poolStatus?.available.toLocaleString() || '0'}`}
                  icon={Wallet}
                  description="Ready for financing"
                />
                <Stat
                  label="Currently Financed"
                  value={`$${poolStatus?.financed.toLocaleString() || '0'}`}
                  icon={PieChart}
                  description="Actively deployed"
                />
                <Stat
                  label="LP Interest Earned"
                  value={`$${lpInterest.toLocaleString()}`}
                  icon={TrendingUp}
                  description={`90% of $${totalInterest.toLocaleString()} total`}
                />
              </div>

              {/* Utilization Rate */}
              {poolStatus && poolStatus.total > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pool Utilization</CardTitle>
                    <CardDescription>
                      How much of the pool is currently being used for financing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-neutral-400">Utilization Rate</span>
                        <span className="text-2xl font-bold text-white">
                          {utilizationRate.toFixed(2)}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-neutral-500">
                        <span>${poolStatus.utilized.toLocaleString()} utilized</span>
                        <span>${poolStatus.total.toLocaleString()} total</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </section>

        {/* Info Section */}
        <Card className="border-neutral-700">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-300">
            <div>
              <p className="font-semibold text-white mb-1">💰 Earn Interest</p>
              <p className="text-neutral-400">
                Your deposited USDC is used to finance supplier invoices. When buyers repay, you earn 90% of the interest.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">💧 Liquidity</p>
              <p className="text-neutral-400">
                Withdraw your funds anytime, subject to available pool liquidity.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">📊 Interest Calculation</p>
              <p className="text-neutral-400">
                Interest is calculated based on financing rates offered by Aegis AI, factoring in buyer creditworthiness and invoice terms.
              </p>
            </div>
            <div className="pt-2 border-t border-neutral-800">
              <p className="text-xs text-neutral-500">
                ⓘ All transactions use Arc's native USDC. Gas fees are paid in USDC automatically.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Processing Indicator */}
        {(isDepositPending || isDepositConfirming || isWithdrawPending || isWithdrawConfirming) && (
          <div className="fixed bottom-4 right-4 z-50">
            <Card className="border-neutral-700">
              <CardContent className="py-4 px-6 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                <p className="text-sm font-medium text-white">
                  {(isDepositPending || isDepositConfirming) && 'Processing deposit...'}
                  {(isWithdrawPending || isWithdrawConfirming) && 'Processing withdrawal...'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
