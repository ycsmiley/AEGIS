import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';

@Controller('api/invoices')
export class InvoiceController {
  private readonly logger = new Logger(InvoiceController.name);

  constructor(private readonly invoiceService: InvoiceService) {}

  /**
   * Create a new invoice and get AI-powered financing quote
   * POST /api/invoices
   */
  @Post()
  async createInvoice(
    @Body()
    body: {
      invoice_number: string;
      supplier_address: string;
      buyer_address: string;
      amount: number;
      due_date: string;
      buyer_rating?: number;
      supplier_rating?: number;
    },
  ) {
    try {
      this.logger.log(
        `Creating invoice ${body.invoice_number} for ${body.amount} USDC`,
      );

      const invoice = await this.invoiceService.createInvoice(
        body.invoice_number,
        body.supplier_address,
        body.buyer_address,
        body.amount,
        new Date(body.due_date),
        body.buyer_rating || 75, // Default rating
        body.supplier_rating || 75,
      );

      return {
        success: true,
        data: invoice,
      };
    } catch (error) {
      this.logger.error('Failed to create invoice', error);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to create invoice',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get financing quote for an existing invoice
   * POST /api/invoices/:id/quote
   */
  @Post(':id/quote')
  async getFinancingQuote(
    @Param('id') invoiceId: string,
    @Body()
    body: {
      buyer_rating?: number;
      supplier_rating?: number;
    },
  ) {
    try {
      const quote = await this.invoiceService.getFinancingQuote(
        invoiceId,
        body.buyer_rating || 75,
        body.supplier_rating || 75,
      );

      return {
        success: true,
        data: quote,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get quote for invoice ${invoiceId}`,
        error,
      );
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to get financing quote',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate Aegis signature for financing withdrawal
   * POST /api/invoices/:id/sign
   */
  @Post(':id/sign')
  async generateSignature(@Param('id') invoiceId: string) {
    try {
      this.logger.log(
        `Generating Aegis signature for invoice ${invoiceId}`,
      );

      const signatureData =
        await this.invoiceService.generateFinancingSignature(invoiceId);

      return {
        success: true,
        data: signatureData,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate signature for invoice ${invoiceId}`,
        error,
      );
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to generate signature',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Approve an invoice (Buyer action)
   * POST /api/invoices/:id/approve
   */
  @Post(':id/approve')
  async approveInvoice(@Param('id') invoiceId: string) {
    try {
      this.logger.log(`Approving invoice ${invoiceId}`);

      const invoice = await this.invoiceService.approveInvoice(invoiceId);

      return {
        success: true,
        data: invoice,
      };
    } catch (error) {
      this.logger.error(`Failed to approve invoice ${invoiceId}`, error);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to approve invoice',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all invoices (with optional filters)
   * GET /api/invoices?supplier=0x...&buyer=0x...&status=PENDING
   */
  @Get()
  async getInvoices() {
    // This endpoint will be implemented when we integrate with Supabase on backend
    // For now, frontend queries Supabase directly
    return {
      success: true,
      message: 'Use Supabase client in frontend for querying invoices',
    };
  }
}
