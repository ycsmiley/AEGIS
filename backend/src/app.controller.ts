import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Aegis Finance Backend',
      version: '1.0.0',
    };
  }

  @Get('api')
  getApiDocs() {
    return {
      service: 'Aegis Finance API',
      version: '1.0.0',
      description: 'AI-powered invoice financing platform on Arc Network',
      documentation: 'See API_AND_TESTING_GUIDE.md for complete documentation',
      baseUrl: process.env.FRONTEND_URL?.replace('3000', '3001') || 'http://localhost:3001',
      endpoints: [
        {
          category: 'System',
          routes: [
            {
              method: 'GET',
              path: '/health',
              description: 'Health check endpoint',
              response: { status: 'ok', timestamp: '...', service: '...', version: '...' }
            },
            {
              method: 'GET',
              path: '/api',
              description: 'API documentation (this page)',
            }
          ]
        },
        {
          category: 'Invoices',
          routes: [
            {
              method: 'POST',
              path: '/api/invoices',
              description: 'Create new invoice with AI-powered pricing',
              requestBody: {
                invoice_number: 'string (required)',
                supplier_address: 'string (required)',
                buyer_address: 'string (required)',
                amount: 'number (required) - USDC amount',
                due_date: 'string (required) - ISO 8601 date',
                buyer_rating: 'number (optional, default: 75) - 0-100',
                supplier_rating: 'number (optional, default: 75) - 0-100'
              },
              response: {
                success: true,
                data: {
                  id: 'uuid',
                  status: 'PENDING',
                  aegis_payout_offer: 'number - AI calculated payout',
                  aegis_discount_rate: 'number - AI calculated rate',
                  aegis_risk_score: 'number - Rule-based score',
                  aegis_pricing_explanation: 'string - Includes AI analysis'
                }
              }
            },
            {
              method: 'POST',
              path: '/api/invoices/:id/quote',
              description: 'Recalculate financing quote with updated ratings',
              requestBody: {
                buyer_rating: 'number (optional)',
                supplier_rating: 'number (optional)'
              },
              response: {
                success: true,
                data: {
                  payoutAmount: 'number',
                  discountRate: 'number',
                  riskScore: 'number',
                  aiRiskScore: 'number - From Hugging Face AI',
                  explanation: 'string'
                }
              }
            },
            {
              method: 'POST',
              path: '/api/invoices/:id/approve',
              description: 'Approve invoice (Buyer action) - Auto-generates EIP-712 signature',
              response: {
                success: true,
                data: {
                  status: 'APPROVED',
                  aegis_signature: 'string - EIP-712 signature',
                  aegis_nonce: 'number',
                  aegis_deadline: 'number - Unix timestamp'
                }
              }
            },
            {
              method: 'POST',
              path: '/api/invoices/:id/sign',
              description: 'Manually generate Aegis signature for financing withdrawal',
              response: {
                success: true,
                data: {
                  signature: 'string',
                  nonce: 'number',
                  deadline: 'number',
                  repaymentAmount: 'number',
                  dueDate: 'number'
                }
              }
            },
            {
              method: 'GET',
              path: '/api/invoices',
              description: 'Query invoices (currently via Supabase frontend)',
              note: 'Use Supabase client in frontend for filtering by supplier/buyer/status'
            }
          ]
        }
      ],
      aiFeatures: {
        provider: 'Hugging Face',
        model: 'mistralai/Mistral-7B-Instruct-v0.1',
        capabilities: [
          'AI-powered risk scoring (0-100 scale)',
          'Dynamic discount rate calculation',
          'Multi-factor analysis (credit, liquidity, term)',
          'Real-time blockchain data integration',
          'Graceful fallback to rule-based scoring'
        ],
        setup: 'Set HUGGINGFACE_API_TOKEN in .env (get free token at https://huggingface.co/settings/tokens)'
      },
      blockchain: {
        network: 'Arc Testnet',
        chainId: 5042002,
        rpcUrl: 'https://rpc.testnet.arc.network',
        contract: process.env.ARC_CONTRACT_ADDRESS || '0x...',
        signatureScheme: 'EIP-712'
      },
      testingGuide: {
        fullDocumentation: '/API_AND_TESTING_GUIDE.md',
        quickStart: [
          '1. Setup: Configure .env files (backend + frontend)',
          '2. Wallets: Prepare 3 test wallets (Supplier, Buyer, LP)',
          '3. Testnet: Get ARC and USDC test tokens',
          '4. LP: Deposit liquidity at /lp',
          '5. Supplier: Create invoice at /supplier',
          '6. Buyer: Approve invoice at /buyer',
          '7. Supplier: Withdraw financing at /supplier',
          '8. Buyer: Repay invoice at /buyer',
          '9. LP: Withdraw profit at /lp'
        ]
      },
      examples: {
        createInvoice: {
          curl: `curl -X POST http://localhost:3001/api/invoices \\
  -H "Content-Type: application/json" \\
  -d '{
    "invoice_number": "INV-001",
    "supplier_address": "0x1234...",
    "buyer_address": "0xabcd...",
    "amount": 10000,
    "due_date": "2024-12-31T23:59:59.000Z",
    "buyer_rating": 85,
    "supplier_rating": 90
  }'`
        },
        approveInvoice: {
          curl: 'curl -X POST http://localhost:3001/api/invoices/{invoice-id}/approve'
        }
      }
    };
  }
}

