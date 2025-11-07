'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseUnits } from 'viem';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stat } from '@/components/ui/stat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ArcPoolABI from '@/contracts/ArcPool.json';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
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
  PAID: {
    label: 'Paid',
    variant: 'default' as const,
    icon: CheckCircle,
  },
};

export default function BuyerPortal() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const supabase = createClient();
  const contractAddress = process.env.NEXT_PUBLIC_ARC_CONTRACT_ADDRESS as `0x${string}` || '0x';

  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadInvoices();
    }
  }, [address, mounted]);

  useEffect(() => {
    if (isSuccess) {
      loadInvoices();
    }
  }, [isSuccess]);

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

  const handleApproveInvoice = async (invoiceId: string) => {
    try {
      setError(null);
      setSuccessMessage(null);

      // Call backend API to approve invoice and generate Aegis signature
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/invoices/${invoiceId}/approve`, {
        method: 'POST',
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to approve invoice');
      }

      setSuccessMessage('Invoice approved! Aegis signature generated.');
      loadInvoices();
    } catch (err) {
      console.error('Error approving invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve invoice');
    }
  };

  const handleRejectInvoice = async (invoiceId: string) => {
    try {
      setError(null);
      setSuccessMessage(null);

      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'REJECTED' })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      setSuccessMessage('Invoice rejected.');
      loadInvoices();
    } catch (err) {
      console.error('Error rejecting invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject invoice');
    }
  };

  const handleRepayInvoice = async (invoice: Invoice) => {
    try {
      setError(null);
      setSuccessMessage(null);

      if (!invoice.amount) {
        setError('Invalid invoice amount');
        return;
      }

      // Repay to the pool contract
      await writeContract({
        address: contractAddress,
        abi: ArcPoolABI,
        functionName: 'repay',
        args: [parseUnits(invoice.amount.toString(), 6)],
      });

      if (isSuccess) {
        await supabase
          .from('invoices')
          .update({
            status: 'PAID',
            repayment_tx_hash: hash,
          })
          .eq('id', invoice.id);

        setSuccessMessage('Repayment successful!');
        loadInvoices();
      }
    } catch (err) {
      console.error('Error repaying invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to repay invoice');
    }
  };

  const pendingInvoices = invoices.filter((i) => i.status === 'PENDING');
  const approvedInvoices = invoices.filter((i) => i.status === 'APPROVED');
  const financedInvoices = invoices.filter((i) => i.status === 'FINANCED');
  const paidInvoices = invoices.filter((i) => i.status === 'PAID');

  const totalRepaymentDue = financedInvoices.reduce(
    (sum, inv) => sum + (inv.amount || 0),
    0
  );

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
              Please connect your wallet to access the Buyer Portal
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
          <h1 className="text-4xl font-bold text-white mb-2">Buyer Portal</h1>
          <p className="text-neutral-400">Approve invoices and manage repayments</p>
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

        {successMessage && (
          <Card className="mb-6 border-green-800 bg-green-900/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <p className="text-green-400">{successMessage}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Stat
            label="Pending Approval"
            value={pendingInvoices.length}
            icon={Clock}
            description="Requires your action"
          />
          <Stat
            label="Approved"
            value={approvedInvoices.length}
            icon={CheckCircle}
            description="Awaiting supplier acceptance"
          />
          <Stat
            label="Awaiting Repayment"
            value={financedInvoices.length}
            icon={DollarSign}
            description={`$${totalRepaymentDue.toLocaleString()} due`}
          />
          <Stat
            label="Paid"
            value={paidInvoices.length}
            icon={CheckCircle}
            description="Completed invoices"
          />
        </div>

        {/* Tabs for different invoice states */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-neutral-900 border border-neutral-800">
            <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Pending ({pendingInvoices.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Approved ({approvedInvoices.length})
            </TabsTrigger>
            <TabsTrigger value="financed" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Repayment ({financedInvoices.length})
            </TabsTrigger>
            <TabsTrigger value="paid" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Paid ({paidInvoices.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="mt-6">
            {isLoading ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-neutral-500 mx-auto mb-4" />
                  <p className="text-neutral-400">Loading invoices...</p>
                </CardContent>
              </Card>
            ) : pendingInvoices.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Clock className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                  <p className="text-white mb-2">No pending invoices</p>
                  <p className="text-neutral-400">All caught up!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingInvoices.map((invoice) => (
                  <Card key={invoice.id} className="hover:border-neutral-600 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{invoice.id}</h3>
                            <Badge variant="warning">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending Approval
                            </Badge>
                          </div>
                          <p className="text-sm text-neutral-400">
                            Supplier: {invoice.supplier_id}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">
                            ${invoice.amount.toLocaleString()}
                          </p>
                          {invoice.due_date && (
                            <p className="text-xs text-neutral-500 mt-1">
                              Due: {new Date(invoice.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                        <div className="flex gap-3">
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleApproveInvoice(invoice.id)}
                          >
                            <ThumbsUp className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleRejectInvoice(invoice.id)}
                          >
                            <ThumbsDown className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                        <Button variant="ghost" size="sm">View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Approved Tab */}
          <TabsContent value="approved" className="mt-6">
            {approvedInvoices.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <CheckCircle className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                  <p className="text-white mb-2">No approved invoices</p>
                  <p className="text-neutral-400">Waiting for supplier acceptance</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {approvedInvoices.map((invoice) => (
                  <Card key={invoice.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{invoice.id}</h3>
                            <Badge variant="success">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          </div>
                          <p className="text-sm text-neutral-400 mb-3">
                            Supplier: {invoice.supplier_id}
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
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Financed Tab */}
          <TabsContent value="financed" className="mt-6">
            {financedInvoices.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <DollarSign className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                  <p className="text-white mb-2">No repayments due</p>
                  <p className="text-neutral-400">All invoices are up to date</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {financedInvoices.map((invoice) => (
                  <Card key={invoice.id} className="border-yellow-800/50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{invoice.id}</h3>
                            <Badge variant="warning">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Repayment Due
                            </Badge>
                          </div>
                          <p className="text-sm text-neutral-400">
                            Supplier: {invoice.supplier_id}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-neutral-500 mb-1">Amount Due</p>
                          <p className="text-2xl font-bold text-yellow-400">
                            ${invoice.amount.toLocaleString()}
                          </p>
                          {invoice.due_date && (
                            <p className="text-xs text-neutral-500 mt-1">
                              Due: {new Date(invoice.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                        <Button
                          onClick={() => handleRepayInvoice(invoice)}
                          disabled={isWritePending || isConfirming}
                          className="gap-2"
                        >
                          {(isWritePending || isConfirming) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-4 w-4" />
                              Pay Now
                            </>
                          )}
                        </Button>
                        <Button variant="ghost" size="sm">View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Paid Tab */}
          <TabsContent value="paid" className="mt-6">
            {paidInvoices.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileText className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                  <p className="text-white mb-2">No paid invoices yet</p>
                  <p className="text-neutral-400">Payment history will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {paidInvoices.map((invoice) => (
                  <Card key={invoice.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{invoice.id}</h3>
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                          </div>
                          <p className="text-sm text-neutral-400 mb-3">
                            Supplier: {invoice.supplier_id}
                          </p>
                          <div className="flex gap-6 text-sm">
                            <div>
                              <span className="text-neutral-500">Amount: </span>
                              <span className="text-white font-medium">
                                ${invoice.amount.toLocaleString()}
                              </span>
                            </div>
                            {invoice.repayment_tx_hash && (
                              <div>
                                <span className="text-neutral-500">Tx: </span>
                                <span className="text-white font-medium">
                                  {invoice.repayment_tx_hash.slice(0, 10)}...
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

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
