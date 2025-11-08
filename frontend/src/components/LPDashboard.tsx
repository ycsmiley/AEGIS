'use client';

import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ArcPoolABI from '@/contracts/ArcPool.json';

interface LPDashboardProps {
  contractAddress: `0x${string}`;
}

export function LPDashboard({ contractAddress }: LPDashboardProps) {
  // Read pool status
  const { data: poolStatusData, isLoading: isLoadingPoolStatus } = useReadContract({
    address: contractAddress,
    abi: ArcPoolABI,
    functionName: 'getPoolStatus',
  });

  // Read total interest earned (NEW)
  const { data: interestEarnedData, isLoading: isLoadingInterest } = useReadContract({
    address: contractAddress,
    abi: ArcPoolABI,
    functionName: 'totalInterestEarned',
  });

  const poolStatus = poolStatusData && Array.isArray(poolStatusData)
    ? {
        total: Number(formatUnits(poolStatusData[0] as bigint, 18)),
        available: Number(formatUnits(poolStatusData[1] as bigint, 18)),
        utilized: Number(formatUnits(poolStatusData[2] as bigint, 18)),
        financed: Number(formatUnits(poolStatusData[3] as bigint, 18)),
      }
    : null;

  const totalInterest = interestEarnedData
    ? Number(formatUnits(interestEarnedData as bigint, 18))
    : 0;

  const lpInterest = totalInterest * 0.9; // LPs get 90%

  if (isLoadingPoolStatus || isLoadingInterest) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pool</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${poolStatus?.total.toLocaleString() || '0'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total USDC in pool
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${poolStatus?.available.toLocaleString() || '0'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for financing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Financed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              ${poolStatus?.financed.toLocaleString() || '0'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Currently deployed
            </p>
          </CardContent>
        </Card>

        {/* NEW: Interest Earned */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Interest Earned (LP Share)</CardTitle>
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

      {/* Utilization Rate */}
      {poolStatus && poolStatus.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pool Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Utilization Rate</span>
                <span className="font-medium">
                  {((poolStatus.utilized / poolStatus.total) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((poolStatus.utilized / poolStatus.total) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>${poolStatus.utilized.toLocaleString()} utilized</span>
                <span>${poolStatus.total.toLocaleString()} total</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
