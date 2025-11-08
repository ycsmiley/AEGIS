import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AegisService } from '../aegis/aegis.service';

export interface Invoice {
  id: string;
  invoice_number: string;
  supplier_address: string;
  buyer_address: string;
  amount: number;
  due_date: string;
  status: string;
  aegis_signature?: string;
  aegis_payout_offer?: number;
  aegis_repayment_amount?: number;
  aegis_discount_rate?: number;
  aegis_risk_score?: number;
  aegis_pricing_explanation?: string;
  aegis_nonce?: number;
  aegis_deadline?: number;
  aegis_due_date?: number;
  financing_tx_hash?: string;
  repayment_tx_hash?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);
  private supabase: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly aegisService: AegisService,
  ) {
    // Initialize Supabase client
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase not configured, invoice service will be limited');
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase client initialized for invoice service');
    }
  }

  /**
   * Create a new invoice with AI-powered pricing
   */
  async createInvoice(
    invoiceNumber: string,
    supplierAddress: string,
    buyerAddress: string,
    amount: number,
    dueDate: Date,
    buyerRating: number,
    supplierRating: number,
  ): Promise<Invoice> {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    // 1. Calculate dynamic pricing using AI agent
    this.logger.log(`Calculating AI pricing for invoice ${invoiceNumber}`);
    const pricing = await this.aegisService.calculateDynamicPricing(
      amount,
      dueDate,
      buyerRating,
      supplierRating,
    );

    // 2. Insert invoice into database with pricing
    const { data, error } = await this.supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        supplier_address: supplierAddress.toLowerCase(),
        buyer_address: buyerAddress.toLowerCase(),
        amount: amount,
        due_date: dueDate.toISOString(),
        status: 'PENDING',
        aegis_payout_offer: pricing.payoutAmount,
        aegis_repayment_amount: pricing.repaymentAmount,
        aegis_discount_rate: pricing.discountRate,
        aegis_risk_score: pricing.riskScore,
        aegis_pricing_explanation: pricing.explanation,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create invoice in database', error);
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    this.logger.log(
      `Invoice ${invoiceNumber} created with ID ${data.id}. Payout: ${pricing.payoutAmount} USDC, Discount: ${(pricing.discountRate * 100).toFixed(2)}%`,
    );

    return data as Invoice;
  }

  /**
   * Get financing quote for an existing invoice
   */
  async getFinancingQuote(
    invoiceId: string,
    buyerRating: number,
    supplierRating: number,
  ) {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    // 1. Fetch invoice from database
    const { data: invoice, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    // 2. Calculate pricing
    const pricing = await this.aegisService.calculateDynamicPricing(
      invoice.amount,
      new Date(invoice.due_date),
      buyerRating,
      supplierRating,
    );

    // 3. Update invoice with new pricing
    const { error: updateError } = await this.supabase
      .from('invoices')
      .update({
        aegis_payout_offer: pricing.payoutAmount,
        aegis_repayment_amount: pricing.repaymentAmount,
        aegis_discount_rate: pricing.discountRate,
        aegis_risk_score: pricing.riskScore,
        aegis_pricing_explanation: pricing.explanation,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (updateError) {
      this.logger.error('Failed to update invoice with pricing', updateError);
    }

    return {
      invoice_id: invoiceId,
      invoice_number: invoice.invoice_number,
      original_amount: invoice.amount,
      ...pricing,
    };
  }

  /**
   * Generate Aegis signature for approved invoice
   */
  async generateFinancingSignature(invoiceId: string) {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    // 1. Fetch invoice
    const { data: invoice, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    // 2. Validate invoice status
    if (invoice.status !== 'APPROVED') {
      throw new Error('Invoice must be approved before generating signature');
    }

    if (!invoice.aegis_payout_offer || !invoice.aegis_repayment_amount) {
      throw new Error('Invoice pricing not calculated');
    }

    // 3. Calculate days until due
    const daysUntilDue = Math.ceil(
      (new Date(invoice.due_date).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    );

    // 4. Generate signature
    const signatureData = await this.aegisService.generateFinancingSignature(
      invoice.invoice_number,
      invoice.supplier_address,
      invoice.aegis_payout_offer,
      invoice.aegis_repayment_amount,
      daysUntilDue,
    );

    // 5. Save signature to database
    const { error: updateError } = await this.supabase
      .from('invoices')
      .update({
        aegis_signature: signatureData.signature,
        aegis_nonce: signatureData.nonce,
        aegis_deadline: signatureData.deadline,
        aegis_due_date: signatureData.dueDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (updateError) {
      this.logger.error('Failed to save signature to database', updateError);
    }

    this.logger.log(`Generated signature for invoice ${invoice.invoice_number}`);

    return {
      invoice_id: invoiceId,
      invoice_number: invoice.invoice_number,
      supplier_address: invoice.supplier_address,
      payout_amount: invoice.aegis_payout_offer,
      repayment_amount: invoice.aegis_repayment_amount,
      ...signatureData,
    };
  }

  /**
   * Approve an invoice (generates pricing and signature)
   */
  async approveInvoice(invoiceId: string): Promise<Invoice> {
    if (!this.supabase) {
      throw new Error('Supabase not configured');
    }

    // 1. Fetch invoice to check if pricing needs recalculation
    const { data: invoice, error: fetchError } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    // 2. If pricing is missing or invalid (e.g., from Math.floor bug), recalculate
    if (!invoice.aegis_payout_offer || invoice.aegis_payout_offer <= 0 ||
        !invoice.aegis_repayment_amount || invoice.aegis_repayment_amount <= 0) {
      this.logger.warn(
        `Invoice ${invoiceId} has invalid pricing (payout: ${invoice.aegis_payout_offer}, repayment: ${invoice.aegis_repayment_amount}). Recalculating...`
      );

      const pricing = await this.aegisService.calculateDynamicPricing(
        invoice.amount,
        new Date(invoice.due_date),
        75, // Default buyer rating
        75, // Default supplier rating
      );

      // Update pricing in database
      const { error: pricingError } = await this.supabase
        .from('invoices')
        .update({
          aegis_payout_offer: pricing.payoutAmount,
          aegis_repayment_amount: pricing.repaymentAmount,
          aegis_discount_rate: pricing.discountRate,
          aegis_risk_score: pricing.riskScore,
          aegis_pricing_explanation: pricing.explanation,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (pricingError) {
        this.logger.error('Failed to update pricing', pricingError);
        throw new Error(`Failed to recalculate pricing: ${pricingError.message}`);
      }

      this.logger.log(
        `Recalculated pricing for invoice ${invoiceId}: Payout ${pricing.payoutAmount} USDC, Discount ${(pricing.discountRate * 100).toFixed(2)}%`
      );
    }

    // 3. Update status to APPROVED
    const { data, error } = await this.supabase
      .from('invoices')
      .update({
        status: 'APPROVED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to approve invoice', error);
      throw new Error(`Failed to approve invoice: ${error.message}`);
    }

    // 4. Generate signature automatically
    try {
      await this.generateFinancingSignature(invoiceId);
    } catch (err) {
      this.logger.warn(
        `Failed to auto-generate signature for invoice ${invoiceId}`,
        err,
      );
      // Don't throw - approval succeeded even if signature generation failed
    }

    this.logger.log(`Invoice ${invoiceId} approved`);

    return data as Invoice;
  }
}
