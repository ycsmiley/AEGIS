'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseUnits, keccak256, stringToHex } from 'viem';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stat } from '@/components/ui/stat';
import { Address } from '@/components/ui/address';
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
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [repayingInvoiceId, setRepayingInvoiceId] = useState<string | null>(null);

  const supabase = createClient();
  const contractAddress = process.env.NEXT_PUBLIC_ARC_CONTRACT_ADDRESS as `0x${string}` || '0x';

  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Log write errors
  useEffect(() => {
    if (writeError) {
      console.error('=== writeContract Error ===');
      console.error('Error:', writeError);
      setError(`Transaction failed: ${writeError.message}`);
      setRepayingInvoiceId(null);
    }
  }, [writeError]);

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

  // Handle successful repayment transaction
  useEffect(() => {
    const updateRepaymentStatus = async () => {
      if (isSuccess && repayingInvoiceId && hash) {
        try {
          const { error: updateError } = await supabase
            .from('invoices')
            .update({
              status: 'PAID',
              repayment_tx_hash: hash,
            })
            .eq('id', repayingInvoiceId);

          if (updateError) {
            console.error('Failed to update invoice status:', updateError);
            setError('Payment successful but failed to update database');
          } else {
            setSuccessMessage('Repayment successful!');
            setRepayingInvoiceId(null);
          }
        } catch (err) {
          console.error('Error updating invoice:', err);
          setError('Payment successful but failed to update database');
        }
      }
    };

    updateRepaymentStatus();
  }, [isSuccess, repayingInvoiceId, hash, supabase]);

  const loadInvoices = async () => {
    if (!address) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('buyer_address', address.toLowerCase())
        .order('created_at', { ascending: false});

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

      console.log('=== Pay Now Button Clicked ===');
      console.log('Invoice ID:', invoice.id);
      console.log('Contract Address:', contractAddress);
      console.log('Connected Address:', address);
      console.log('Invoice Data:', {
        amount: invoice.amount,
        aegis_repayment_amount: invoice.aegis_repayment_amount,
        due_date: invoice.due_date,
      });

      // Validate contract address
      if (!contractAddress || contractAddress === '0x') {
        setError('Contract address not configured. Please set NEXT_PUBLIC_ARC_CONTRACT_ADDRESS in .env.local');
        console.error('Contract address missing!');
        return;
      }

      // Validate wallet connection
      if (!address || !isConnected) {
        setError('Wallet not connected');
        console.error('Wallet not connected!');
        return;
      }

      // Validate invoice has required data
      if (!invoice.aegis_repayment_amount || !invoice.due_date) {
        setError('Invalid invoice data - missing repayment amount or due date');
        console.error('Missing invoice data:', {
          aegis_repayment_amount: invoice.aegis_repayment_amount,
          due_date: invoice.due_date
        });
        return;
      }

      // Calculate late fee if overdue
      const now = Math.floor(Date.now() / 1000);
      const dueDate = Math.floor(new Date(invoice.due_date).getTime() / 1000);
      let totalAmount = invoice.aegis_repayment_amount; // Use repayment amount (includes interest)
      let lateFeeAmount = 0;

      if (now > dueDate) {
        // Calculate late fee (1% per day, max 30%)
        const daysLate = Math.floor((now - dueDate) / 86400);
        lateFeeAmount = Math.min(
          invoice.aegis_repayment_amount * daysLate * 0.01,
          invoice.aegis_repayment_amount * 0.3
        );
        totalAmount = invoice.aegis_repayment_amount + lateFeeAmount;

        console.log(`Invoice is ${daysLate} days overdue. Late fee: $${lateFeeAmount.toFixed(2)}`);
        console.log(`Base repayment: $${invoice.aegis_repayment_amount}, Total with late fee: $${totalAmount.toFixed(2)}`);
      }

      // Create invoice hash for contract call
      // IMPORTANT: Must use invoice_number (not id) to match what supplier used in withdrawFinancing
      const invoiceHashInput = invoice.invoice_number || invoice.id;
      const invoiceHash = keccak256(stringToHex(invoiceHashInput));
      console.log('Invoice Number:', invoiceHashInput);
      console.log('Invoice Hash:', invoiceHash);

      // Store the invoice ID for the success handler
      setRepayingInvoiceId(invoice.id);

      const valueInWei = parseUnits(totalAmount.toFixed(6), 18);
      console.log(`Calling repay() with:`);
      console.log('  - invoiceHash:', invoiceHash);
      console.log('  - value:', totalAmount.toFixed(6), 'USDC');
      console.log('  - valueInWei:', valueInWei.toString());

      // Repay to the pool contract with correct parameters
      writeContract({
        address: contractAddress,
        abi: ArcPoolABI,
        functionName: 'repay',
        args: [invoiceHash],
        value: valueInWei, // Send payment as value (contract is payable)
      });

      console.log('writeContract called successfully');
    } catch (err) {
      console.error('=== Error in handleRepayInvoice ===');
      console.error('Error:', err);
      console.error('Error message:', err instanceof Error ? err.message : 'Unknown error');
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      setError(err instanceof Error ? err.message : 'Failed to repay invoice');
      setRepayingInvoiceId(null);
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
                {pendingInvoices.map((invoice) => {
                  const isExpanded = expandedInvoiceId === invoice.id;
                  return (
                    <Card key={invoice.id} className="hover:border-neutral-600 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{invoice.id.slice(0, 8)}...</h3>
                              <Badge variant="warning">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending Approval
                              </Badge>
                            </div>
                            <div className="text-sm text-neutral-400">
                              Supplier: {invoice.supplier_address ? <Address address={invoice.supplier_address} /> : "N/A"}
                            </div>
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

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mb-4 pt-4 border-t border-neutral-800 space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">Full ID</p>
                                <p className="text-sm text-white font-mono break-all">{invoice.id}</p>
                              </div>
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">Supplier Address</p>
                                <p className="text-sm text-white font-mono break-all">{invoice.supplier_address}</p>
                              </div>
                            </div>
                            {invoice.aegis_pricing_explanation && (
                              <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded">
                                <p className="text-xs font-semibold text-neutral-300 mb-2">AI Pricing Analysis</p>
                                <pre className="text-xs text-neutral-400 whitespace-pre-wrap font-mono">
                                  {invoice.aegis_pricing_explanation}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedInvoiceId(isExpanded ? null : invoice.id)}
                          >
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
                {approvedInvoices.map((invoice) => {
                  const isExpanded = expandedInvoiceId === invoice.id;
                  return (
                    <Card key={invoice.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{invoice.id.slice(0, 8)}...</h3>
                              <Badge variant="success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            </div>
                            <div className="text-sm text-neutral-400 mb-3">
                              Supplier: {invoice.supplier_address ? <Address address={invoice.supplier_address} /> : "N/A"}
                            </div>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedInvoiceId(isExpanded ? null : invoice.id)}
                          >
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </Button>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">Full ID</p>
                                <p className="text-sm text-white font-mono break-all">{invoice.id}</p>
                              </div>
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">Supplier Address</p>
                                <p className="text-sm text-white font-mono break-all">{invoice.supplier_address}</p>
                              </div>
                            </div>
                            {invoice.aegis_pricing_explanation && (
                              <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded">
                                <p className="text-xs font-semibold text-neutral-300 mb-2">AI Pricing Analysis</p>
                                <pre className="text-xs text-neutral-400 whitespace-pre-wrap font-mono">
                                  {invoice.aegis_pricing_explanation}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
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
                {financedInvoices.map((invoice) => {
                  // Calculate late fee for display
                  const now = Math.floor(Date.now() / 1000);
                  const dueDate = invoice.due_date ? Math.floor(new Date(invoice.due_date).getTime() / 1000) : 0;
                  const isOverdue = now > dueDate;
                  const baseRepayment = invoice.aegis_repayment_amount || invoice.amount || 0;
                  let lateFee = 0;
                  let daysLate = 0;
                  if (isOverdue && dueDate > 0) {
                    daysLate = Math.floor((now - dueDate) / 86400);
                    lateFee = Math.min(
                      baseRepayment * daysLate * 0.01,
                      baseRepayment * 0.3
                    );
                  }
                  const totalDue = baseRepayment + lateFee;

                  return (
                    <Card key={invoice.id} className={isOverdue ? "border-red-800/50" : "border-yellow-800/50"}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{invoice.id.slice(0, 12)}...</h3>
                              <Badge variant={isOverdue ? "error" : "warning"}>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {isOverdue ? 'OVERDUE' : 'Repayment Due'}
                              </Badge>
                            </div>
                            <div className="text-sm text-neutral-400">
                              Supplier: {invoice.supplier_address ? <Address address={invoice.supplier_address} /> : "N/A"}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-neutral-500 mb-1">Repayment Due</p>
                            <p className="text-xl font-semibold text-white">
                              ${baseRepayment.toLocaleString()}
                            </p>
                            <p className="text-xs text-neutral-500">
                              (Invoice: ${invoice.amount?.toLocaleString() || '0'})
                            </p>
                            {invoice.due_date && (
                              <p className={`text-xs mt-1 ${isOverdue ? 'text-red-400 font-semibold' : 'text-neutral-500'}`}>
                                Due: {new Date(invoice.due_date).toLocaleDateString()}
                                {isOverdue && ` (${daysLate} days late)`}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Late Fee Warning */}
                        {isOverdue && lateFee > 0 && (
                          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="h-4 w-4 text-red-400" />
                              <p className="text-sm font-semibold text-red-400">Late Fee Applied</p>
                            </div>
                            <div className="text-sm text-neutral-300 space-y-1">
                              <div className="flex justify-between text-xs text-neutral-400">
                                <span>Invoice Amount:</span>
                                <span>${invoice.amount?.toLocaleString() || '0'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Base Repayment:</span>
                                <span>${baseRepayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between text-red-400">
                                <span>Late Fee ({daysLate} days × 1%):</span>
                                <span>+${lateFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between font-semibold text-white pt-2 border-t border-red-800">
                                <span>Total Due:</span>
                                <span>${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                            <p className="text-xs text-neutral-400 mt-2">
                              Late fees: 1% per day (max 30%)
                            </p>
                          </div>
                        )}

                        {/* Expanded Details */}
                        {expandedInvoiceId === invoice.id && (
                          <div className="mb-4 pt-4 border-t border-neutral-800 space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">Full ID</p>
                                <p className="text-sm text-white font-mono break-all">{invoice.id}</p>
                              </div>
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">Supplier Address</p>
                                <p className="text-sm text-white font-mono break-all">{invoice.supplier_address}</p>
                              </div>
                              {invoice.financing_tx_hash && (
                                <div>
                                  <p className="text-xs text-neutral-500 mb-1">Financing Tx Hash</p>
                                  <p className="text-sm text-white font-mono break-all">{invoice.financing_tx_hash}</p>
                                </div>
                              )}
                              {invoice.aegis_payout_offer && (
                                <div>
                                  <p className="text-xs text-neutral-500 mb-1">Payout Received</p>
                                  <p className="text-sm text-white">${invoice.aegis_payout_offer.toLocaleString()}</p>
                                </div>
                              )}
                            </div>
                            {invoice.aegis_pricing_explanation && (
                              <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded">
                                <p className="text-xs font-semibold text-neutral-300 mb-2">AI Pricing Analysis</p>
                                <pre className="text-xs text-neutral-400 whitespace-pre-wrap font-mono">
                                  {invoice.aegis_pricing_explanation}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                          <Button
                            onClick={() => handleRepayInvoice(invoice)}
                            disabled={isWritePending || isConfirming}
                            className="gap-2"
                            variant={isOverdue ? "destructive" : "default"}
                          >
                            {(isWritePending || isConfirming) ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing
                              </>
                            ) : (
                              <>
                                <DollarSign className="h-4 w-4" />
                                Pay ${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedInvoiceId(expandedInvoiceId === invoice.id ? null : invoice.id)}
                          >
                            {expandedInvoiceId === invoice.id ? 'Hide Details' : 'View Details'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
                          <div className="text-sm text-neutral-400 mb-3">
                            Supplier: {invoice.supplier_address ? <Address address={invoice.supplier_address} /> : "N/A"}
                          </div>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedInvoiceId(expandedInvoiceId === invoice.id ? null : invoice.id)}
                        >
                          {expandedInvoiceId === invoice.id ? 'Hide Details' : 'View Details'}
                        </Button>
                      </div>

                      {/* Expanded Details */}
                      {expandedInvoiceId === invoice.id && (
                        <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-neutral-500 mb-1">Full ID</p>
                              <p className="text-sm text-white font-mono break-all">{invoice.id}</p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500 mb-1">Supplier Address</p>
                              <p className="text-sm text-white font-mono break-all">{invoice.supplier_address}</p>
                            </div>
                            {invoice.financing_tx_hash && (
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">Financing Tx Hash</p>
                                <p className="text-sm text-white font-mono break-all">{invoice.financing_tx_hash}</p>
                              </div>
                            )}
                            {invoice.repayment_tx_hash && (
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">Repayment Tx Hash</p>
                                <p className="text-sm text-white font-mono break-all">{invoice.repayment_tx_hash}</p>
                              </div>
                            )}
                            {invoice.aegis_payout_offer && (
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">Payout Received</p>
                                <p className="text-sm text-white">${invoice.aegis_payout_offer.toLocaleString()}</p>
                              </div>
                            )}
                            {invoice.due_date && (
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">Original Due Date</p>
                                <p className="text-sm text-white">{new Date(invoice.due_date).toLocaleDateString()}</p>
                              </div>
                            )}
                          </div>
                          {invoice.aegis_pricing_explanation && (
                            <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded">
                              <p className="text-xs font-semibold text-neutral-300 mb-2">AI Pricing Analysis</p>
                              <pre className="text-xs text-neutral-400 whitespace-pre-wrap font-mono">
                                {invoice.aegis_pricing_explanation}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
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
