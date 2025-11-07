import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { BlockchainService } from '../blockchain/blockchain.service';

interface PricingRules {
  baseDiscountRate: number;
  fedRate: number;
  riskMultiplier: number;
  liquidityThreshold: number;
}

interface PricingResult {
  payoutAmount: number;
  discountRate: number;
  riskScore: number;
  explanation: string;
}

interface SignatureData {
  signature: string;
  nonce: number;
  deadline: number;
}

@Injectable()
export class AegisService {
  private readonly logger = new Logger(AegisService.name);
  private readonly rules: PricingRules = {
    baseDiscountRate: 0.02, // 2% base discount
    fedRate: 0.05, // 5% Fed rate
    riskMultiplier: 1.2,
    liquidityThreshold: 1000000, // 1M USDC
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly blockchainService: BlockchainService,
  ) {}

  /**
   * Calculate dynamic pricing for invoice financing
   */
  async calculateDynamicPricing(
    invoiceAmount: number,
    dueDate: Date,
    buyerRating: number,
    supplierRating: number,
  ): Promise<PricingResult> {
    this.logger.log(`Calculating pricing for invoice amount: ${invoiceAmount}`);

    // 1. Fetch on-chain liquidity status
    const poolStatus = await this.blockchainService.getPoolStatus();
    const availableLiquidity = poolStatus.available;

    this.logger.debug(`Available liquidity: ${availableLiquidity}`);

    // 2. Calculate days until due
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    // 3. Calculate dynamic discount rate
    let discountRate = this.rules.baseDiscountRate;

    // Time-based adjustment
    discountRate += (daysUntilDue / 365) * this.rules.fedRate;

    // Liquidity-based adjustment
    const liquidityRatio =
      Number(availableLiquidity) / this.rules.liquidityThreshold;
    if (liquidityRatio < 0.3) {
      discountRate *= 1.5; // Tight liquidity, increase discount
      this.logger.warn('Tight liquidity detected, increasing discount rate');
    } else if (liquidityRatio > 0.7) {
      discountRate *= 0.8; // Abundant liquidity, decrease discount
      this.logger.debug('Abundant liquidity, decreasing discount rate');
    }

    // Credit rating adjustment
    const avgRating = (buyerRating + supplierRating) / 2;
    const riskFactor = (100 - avgRating) / 100;
    discountRate += discountRate * riskFactor * 0.5;

    // 4. Calculate payout amount
    const payoutAmount = invoiceAmount * (1 - discountRate);

    // 5. Calculate risk score
    const riskScore = this.calculateRiskScore(
      buyerRating,
      supplierRating,
      daysUntilDue,
      liquidityRatio,
    );

    // 6. Generate explanation
    const explanation = this.generateExplanation(
      discountRate,
      daysUntilDue,
      liquidityRatio,
      avgRating,
      riskScore,
    );

    this.logger.log(
      `Pricing calculated: Payout ${payoutAmount}, Discount ${(discountRate * 100).toFixed(2)}%, Risk Score ${riskScore}`,
    );

    return {
      payoutAmount: Math.floor(payoutAmount),
      discountRate: Number(discountRate.toFixed(4)),
      riskScore: Number(riskScore.toFixed(2)),
      explanation,
    };
  }

  /**
   * Calculate risk score (0-100, higher is better)
   */
  private calculateRiskScore(
    buyerRating: number,
    supplierRating: number,
    daysUntilDue: number,
    liquidityRatio: number,
  ): number {
    let score = 100;

    // Credit risk (40% weight)
    score -= (100 - buyerRating) * 0.2;
    score -= (100 - supplierRating) * 0.2;

    // Term risk (30% weight)
    if (daysUntilDue > 90) score -= 15;
    else if (daysUntilDue > 60) score -= 10;
    else if (daysUntilDue > 30) score -= 5;

    // Liquidity risk (30% weight)
    if (liquidityRatio < 0.2) score -= 20;
    else if (liquidityRatio < 0.4) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate human-readable pricing explanation
   */
  private generateExplanation(
    discountRate: number,
    daysUntilDue: number,
    liquidityRatio: number,
    avgRating: number,
    riskScore: number,
  ): string {
    const parts: string[] = [];

    parts.push(
      `Applied ${(discountRate * 100).toFixed(2)}% discount rate based on:`,
    );
    parts.push(`• Payment term: ${daysUntilDue} days`);
    parts.push(
      `• Pool liquidity: ${liquidityRatio > 0.7 ? 'Abundant' : liquidityRatio > 0.3 ? 'Moderate' : 'Tight'}`,
    );
    parts.push(`• Average credit rating: ${avgRating.toFixed(0)}/100`);
    parts.push(`• Overall risk score: ${riskScore.toFixed(0)}/100`);

    return parts.join('\n');
  }

  /**
   * Generate EIP-712 signature for financing withdrawal
   */
  async generateFinancingSignature(
    invoiceId: string,
    supplierAddress: string,
    payoutAmount: number,
  ): Promise<SignatureData> {
    const nonce = Date.now();
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry

    const contractAddress = this.configService.get<string>(
      'ARC_CONTRACT_ADDRESS',
    );
    const chainId =
      this.configService.get<number>('ARC_CHAIN_ID') || 421614;

    // EIP-712 Domain
    const domain = {
      name: 'ArcPool',
      version: '1',
      chainId: chainId,
      verifyingContract: contractAddress,
    };

    // EIP-712 Types
    const types = {
      FinancingRequest: [
        { name: 'invoiceId', type: 'bytes32' },
        { name: 'supplier', type: 'address' },
        { name: 'payoutAmount', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    // Convert payout amount to Wei (6 decimals for USDC)
    const payoutAmountWei = ethers.parseUnits(
      payoutAmount.toString(),
      6,
    );

    // Values
    const values = {
      invoiceId: ethers.id(invoiceId),
      supplier: supplierAddress,
      payoutAmount: payoutAmountWei,
      nonce: nonce,
      deadline: deadline,
    };

    // Sign with server wallet
    const privateKey = this.configService.get<string>(
      'SERVER_WALLET_PRIVATE_KEY',
    );
    if (!privateKey) {
      throw new Error('Server wallet private key not configured');
    }

    const wallet = new ethers.Wallet(privateKey);
    const signature = await wallet.signTypedData(domain, types, values);

    this.logger.log(`Generated signature for invoice ${invoiceId}`);

    return {
      signature,
      nonce,
      deadline,
    };
  }

  /**
   * Verify a financing signature (for testing/validation)
   */
  async verifyFinancingSignature(
    invoiceId: string,
    supplierAddress: string,
    payoutAmount: number,
    signatureData: SignatureData,
  ): Promise<boolean> {
    const contractAddress = this.configService.get<string>(
      'ARC_CONTRACT_ADDRESS',
    );
    const chainId = this.configService.get<number>('ARC_CHAIN_ID') || 421614;

    const domain = {
      name: 'ArcPool',
      version: '1',
      chainId: chainId,
      verifyingContract: contractAddress,
    };

    const types = {
      FinancingRequest: [
        { name: 'invoiceId', type: 'bytes32' },
        { name: 'supplier', type: 'address' },
        { name: 'payoutAmount', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    const payoutAmountWei = ethers.parseUnits(
      payoutAmount.toString(),
      6,
    );

    const values = {
      invoiceId: ethers.id(invoiceId),
      supplier: supplierAddress,
      payoutAmount: payoutAmountWei,
      nonce: signatureData.nonce,
      deadline: signatureData.deadline,
    };

    const recoveredAddress = ethers.verifyTypedData(
      domain,
      types,
      values,
      signatureData.signature,
    );

    const serverWalletAddress = this.configService.get<string>(
      'AEGIS_SERVER_WALLET',
    );

    return (
      recoveredAddress.toLowerCase() === serverWalletAddress.toLowerCase()
    );
  }
}

