'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, id as hashString } from 'viem';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stat } from '@/components/ui/stat';
import ArcPoolABI from '@/contracts/ArcPool.json';
import {
  Plus,
  FileText,
  DollarSign,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

type Invoice = Database['public']['Tables']['invoices']['Row'];

const statusConfig = {
  PENDING: {
    label: 'Pending Approval',
    variant: 'warning' as const,
    icon: Clock,
  },
  APPROVED: {
    label: 'Approved',
    variant: 'success' as const,
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'Rejected',
    variant: 'error' as const,
    icon: XCircle,
  },
  FINANCED: {
    label: 'Financed',
    variant: 'success' as const,
    icon: DollarSign,
  },
};

export default function SupplierPortal() {
  const { address, isConnected } = useAccount();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const contractAddress = process.env.NEXT_PUBLIC_ARC_CONTRACT_ADDRESS as `0x${string}` || '0x';

  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    loadInvoices();
  }, [address]);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setInvoices(data || []);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptFinancing = async (invoice: Invoice) => {
    if (!invoice.aegis_signature || !invoice.aegis_payout_offer) {
      setError('Invalid invoice signature or payout offer');
      return;
    }

    try {
      const signatureData = JSON.parse(invoice.aegis_signature);

      await writeContract({
        address: contractAddress,
        abi: ArcPoolABI,
        functionName: 'withdrawFinancing',
        args: [
          hashString(invoice.id),
          parseUnits(invoice.aegis_payout_offer.toString(), 6),
          parseUnits(signatureData.repaymentAmount.toString(), 6),
          BigInt(signatureData.dueDate),
          BigInt(signatureData.nonce),
          BigInt(signatureData.deadline),
          signatureData.signature as `0x${string}`,
        ],
      });

      if (isSuccess) {
        await supabase
          .from('invoices')
          .update({
            status: 'FINANCED',
            blockchain_tx_hash: hash,
          })
          .eq('id', invoice.id);

        loadInvoices();
      }
    } catch (err) {
      console.error('Error accepting financing:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept financing');
    }
  };

  // Calculate stats
  const stats = {
    total: invoices.length,
    financed: invoices.filter(i => i.status === 'FINANCED').length,
    pending: invoices.filter(i => i.status === 'PENDING').length,
    totalFinanced: invoices
      .filter(i => i.status === 'FINANCED' && i.aegis_payout_offer)
      .reduce((sum, i) => sum + (i.aegis_payout_offer || 0), 0),
    averageRate: 8.5, // TODO: Calculate from actual data
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
            <p className="text-xl text-white mb-2">Wallet Not Connected</p>
            <p className="text-neutral-400 mb-6">
              Please connect your wallet to access the Supplier Portal
            </p>
            <Button size="lg">Connect Wallet</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Supplier Portal</h1>
            <p className="text-neutral-400">Upload invoices and get instant financing offers</p>
          </div>
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Upload Invoice
          </Button>
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

        {isSuccess && (
          <Card className="mb-6 border-green-800 bg-green-900/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <p className="text-green-400">
                  Financing accepted successfully! Transaction: {hash?.slice(0, 10)}...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Stat
            label="Total Invoices"
            value={stats.total}
            icon={FileText}
            description="All time"
          />
          <Stat
            label="Financed Amount"
            value={`$${stats.totalFinanced.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: 15.3, isPositive: true }}
            description="Total funded"
          />
          <Stat
            label="Pending Approval"
            value={stats.pending}
            icon={Clock}
            description="Awaiting buyer confirmation"
          />
          <Stat
            label="Average APR"
            value={`${stats.averageRate}%`}
            icon={TrendingUp}
            trend={{ value: 0.3, isPositive: false }}
            description="Across all invoices"
          />
        </div>

        {/* Active Financing Offers */}
        {invoices.filter(i => i.status === 'APPROVED').length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Active Offers</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {invoices
                .filter(i => i.status === 'APPROVED')
                .map((invoice) => (
                  <Card key={invoice.id} className="hover:border-neutral-600 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{invoice.id}</CardTitle>
                          <CardDescription>Buyer: {invoice.buyer_id}</CardDescription>
                        </div>
                        <Badge variant="success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-neutral-400 mb-1">Invoice Amount</p>
                          <p className="text-xl font-bold text-white">
                            ${invoice.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-400 mb-1">Financing Offer</p>
                          <p className="text-xl font-bold text-green-400">
                            ${invoice.aegis_payout_offer?.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                        <div>
                          <p className="text-xs text-neutral-500">Due Date</p>
                          <p className="text-sm font-semibold text-white">
                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptFinancing(invoice)}
                          disabled={isWritePending || isConfirming}
                        >
                          {(isWritePending || isConfirming) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing
                            </>
                          ) : (
                            'Accept Offer'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* Invoice List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">All Invoices</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Filter</Button>
              <Button variant="outline" size="sm">Sort</Button>
            </div>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500 mx-auto mb-4" />
                <p className="text-neutral-400">Loading invoices...</p>
              </CardContent>
            </Card>
          ) : invoices.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                <p className="text-white mb-2">No invoices yet</p>
                <p className="text-neutral-400 mb-6">
                  Upload your first invoice to get started!
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Invoice
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-neutral-800">
                  {invoices.map((invoice) => {
                    const statusInfo = statusConfig[invoice.status as keyof typeof statusConfig];
                    const StatusIcon = statusInfo?.icon || AlertCircle;

                    return (
                      <div
                        key={invoice.id}
                        className="p-6 hover:bg-neutral-900/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">
                                {invoice.id}
                              </h3>
                              <Badge variant={statusInfo?.variant || 'default'}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo?.label || invoice.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-neutral-400 mb-3">
                              Buyer: {invoice.buyer_id}
                            </p>
                            <div className="flex gap-6 text-sm">
                              <div>
                                <span className="text-neutral-500">Amount: </span>
                                <span className="text-white font-medium">
                                  ${invoice.amount.toLocaleString()}
                                </span>
                              </div>
                              {invoice.due_date && (
                                <div>
                                  <span className="text-neutral-500">Due: </span>
                                  <span className="text-white font-medium">
                                    {new Date(invoice.due_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <span className="text-neutral-500">Uploaded: </span>
                                <span className="text-white font-medium">
                                  {new Date(invoice.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {invoice.aegis_payout_offer && (
                              <div className="text-right mr-4">
                                <p className="text-xs text-neutral-500 mb-1">Offer</p>
                                <p className="text-lg font-bold text-green-400">
                                  ${invoice.aegis_payout_offer.toLocaleString()}
                                </p>
                              </div>
                            )}
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Processing Indicator */}
        {(isWritePending || isConfirming) && (
          <div className="fixed bottom-4 right-4 z-50">
            <Card className="border-neutral-700">
              <CardContent className="py-4 px-6 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                <p className="text-sm font-medium text-white">
                  {isWritePending && 'Confirming transaction...'}
                  {isConfirming && 'Waiting for confirmation...'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
