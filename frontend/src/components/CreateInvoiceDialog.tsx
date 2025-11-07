'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Sparkles } from 'lucide-react';

interface CreateInvoiceDialogProps {
  onInvoiceCreated: () => void;
}

export function CreateInvoiceDialog({ onInvoiceCreated }: CreateInvoiceDialogProps) {
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    invoice_number: '',
    buyer_address: '',
    amount: '',
    due_date: '',
    buyer_rating: '75',
    supplier_rating: '75',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Call backend API to create invoice with AI pricing
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          supplier_address: address,
          amount: parseFloat(formData.amount),
          buyer_rating: parseInt(formData.buyer_rating),
          supplier_rating: parseInt(formData.supplier_rating),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to create invoice');
      }

      // Reset form and close dialog
      setFormData({
        invoice_number: '',
        buyer_address: '',
        amount: '',
        due_date: '',
        buyer_rating: '75',
        supplier_rating: '75',
      });
      setOpen(false);
      onInvoiceCreated();
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Generate default invoice number
  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${timestamp}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Create Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            Create Invoice with AI Pricing
          </DialogTitle>
          <DialogDescription>
            Our AI agent will automatically calculate the optimal financing rate based on market conditions,
            credit scores, and liquidity.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Invoice Number */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoice_number" className="text-right text-neutral-300">
                Invoice #
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="invoice_number"
                  value={formData.invoice_number}
                  onChange={(e) => updateField('invoice_number', e.target.value)}
                  placeholder="INV-001"
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateField('invoice_number', generateInvoiceNumber())}
                >
                  Generate
                </Button>
              </div>
            </div>

            {/* Buyer Address */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="buyer_address" className="text-right text-neutral-300">
                Buyer
              </Label>
              <Input
                id="buyer_address"
                value={formData.buyer_address}
                onChange={(e) => updateField('buyer_address', e.target.value)}
                placeholder="0x..."
                required
                className="col-span-3"
              />
            </div>

            {/* Amount */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right text-neutral-300">
                Amount
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => updateField('amount', e.target.value)}
                  placeholder="1000"
                  required
                  min="1"
                  step="0.01"
                  className="pr-16"
                />
                <span className="absolute right-3 top-2.5 text-sm text-neutral-400">USDC</span>
              </div>
            </div>

            {/* Due Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="due_date" className="text-right text-neutral-300">
                Due Date
              </Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => updateField('due_date', e.target.value)}
                required
                className="col-span-3"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Buyer Credit Rating */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="buyer_rating" className="text-right text-neutral-300">
                Buyer Rating
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="buyer_rating"
                  type="range"
                  value={formData.buyer_rating}
                  onChange={(e) => updateField('buyer_rating', e.target.value)}
                  min="0"
                  max="100"
                  className="flex-1"
                />
                <span className="text-sm text-neutral-300 w-12 text-right">
                  {formData.buyer_rating}/100
                </span>
              </div>
            </div>

            {/* Supplier Credit Rating */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier_rating" className="text-right text-neutral-300">
                Your Rating
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="supplier_rating"
                  type="range"
                  value={formData.supplier_rating}
                  onChange={(e) => updateField('supplier_rating', e.target.value)}
                  min="0"
                  max="100"
                  className="flex-1"
                />
                <span className="text-sm text-neutral-300 w-12 text-right">
                  {formData.supplier_rating}/100
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 border border-red-800 bg-red-900/20 rounded text-sm text-red-400">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Creating...' : 'Create with AI Pricing'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
