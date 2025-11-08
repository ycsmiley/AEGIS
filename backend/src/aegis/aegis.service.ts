import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { HfInference } from '@huggingface/inference';
import { BlockchainService } from '../blockchain/blockchain.service';

interface PricingRules {
  baseDiscountRate: number;
  fedRate: number;
  riskMultiplier: number;
  liquidityThreshold: number;
}

interface PricingResult {
  payoutAmount: number;
  repaymentAmount: number;
  discountRate: number;
  riskScore: number;
  aiRiskScore?: number;
  daysUntilDue: number;
  explanation: string;
}

interface SignatureData {
  signature: string;
  nonce: number;
  deadline: number;
  repaymentAmount: number;
  dueDate: number;
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
  private hf: HfInference | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly blockchainService: BlockchainService,
  ) {
    // Initialize Hugging Face client if token is provided
    const hfToken = this.configService.get<string>('HUGGINGFACE_API_TOKEN');
    if (hfToken) {
      this.hf = new HfInference(hfToken);
      this.logger.log('Hugging Face AI integration enabled');
    } else {
      this.logger.warn('Hugging Face token not found - using rule-based risk scoring only');
    }
  }

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

    // 3. Calculate liquidity ratio for risk assessment
    const liquidityRatio =
      Number(availableLiquidity) / this.rules.liquidityThreshold;

    // 4. Get AI-powered risk prediction (if available)
    const aiRiskScore = await this.calculateAIRiskScore(
      invoiceAmount,
      daysUntilDue,
      buyerRating,
      supplierRating,
      liquidityRatio,
    );

    // 5. Calculate dynamic discount rate
    let discountRate = this.rules.baseDiscountRate;

    // Time-based adjustment
    discountRate += (daysUntilDue / 365) * this.rules.fedRate;

    // Liquidity-based adjustment
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

    // AI-based adjustment (if available)
    if (aiRiskScore !== null) {
      const aiRiskFactor = (100 - aiRiskScore) / 100;
      discountRate += discountRate * aiRiskFactor * 0.3; // 30% weight to AI prediction
      this.logger.log(`AI risk score integrated: ${aiRiskScore}/100`);
    }

    // 6. Calculate payout amount
    const payoutAmount = invoiceAmount * (1 - discountRate);

    // 7. Calculate rule-based risk score
    const riskScore = this.calculateRiskScore(
      buyerRating,
      supplierRating,
      daysUntilDue,
      liquidityRatio,
    );

    // 8. Generate explanation
    const explanation = this.generateExplanation(
      discountRate,
      daysUntilDue,
      liquidityRatio,
      avgRating,
      riskScore,
      aiRiskScore,
    );

    // Calculate repayment amount (invoice amount without discount)
    const repaymentAmount = invoiceAmount;

    this.logger.log(
      `Pricing calculated: Payout ${payoutAmount.toFixed(2)}, Repayment ${repaymentAmount.toFixed(2)}, Discount ${(discountRate * 100).toFixed(2)}%, Risk Score ${riskScore}${aiRiskScore !== null ? `, AI Risk Score ${aiRiskScore}` : ''}`,
    );

    return {
      payoutAmount: Number(payoutAmount.toFixed(2)), // Keep decimals for accurate amounts
      repaymentAmount: Number(repaymentAmount.toFixed(2)),
      discountRate: Number(discountRate.toFixed(4)),
      riskScore: Number(riskScore.toFixed(2)),
      aiRiskScore: aiRiskScore !== null ? Number(aiRiskScore.toFixed(2)) : undefined,
      daysUntilDue: daysUntilDue,
      explanation,
    };
  }

  /**
   * Calculate AI-powered risk score using Hugging Face
   * Returns a score from 0-100 (higher is better/lower risk)
   */
  private async calculateAIRiskScore(
    invoiceAmount: number,
    daysUntilDue: number,
    buyerRating: number,
    supplierRating: number,
    liquidityRatio: number,
  ): Promise<number | null> {
    if (!this.hf) {
      return null; // No HF token, skip AI scoring
    }

    try {
      this.logger.debug('Requesting AI risk prediction from Hugging Face...');

      const prompt = `As a financial risk analyst, predict the creditworthiness score (0-100, where 100 is lowest risk) for this invoice financing scenario:
- Invoice Amount: $${invoiceAmount.toLocaleString()} USDC
- Payment Term: ${daysUntilDue} days
- Buyer Credit Rating: ${buyerRating}/100
- Supplier Credit Rating: ${supplierRating}/100
- Market Liquidity Ratio: ${(liquidityRatio * 100).toFixed(1)}%

Respond with only a single number between 0-100 representing the creditworthiness score.`;

      // Try multiple models in order of preference (fallback if one fails)
      const models = [
        'meta-llama/Llama-3.2-1B-Instruct', // Small, fast, free
        'mistralai/Mistral-7B-Instruct-v0.3', // Newer Mistral version
        'HuggingFaceH4/zephyr-7b-beta', // Alternative open model
      ];

      let result;
      let lastError;

      for (const model of models) {
        try {
          this.logger.debug(`Trying model: ${model}`);
          result = await this.hf.textGeneration({
            model,
            inputs: prompt,
            parameters: {
              max_new_tokens: 10,
              temperature: 0.3,
              return_full_text: false,
            },
          });
          this.logger.log(`Successfully used model: ${model}`);
          break; // Success, exit loop
        } catch (err) {
          this.logger.debug(`Model ${model} failed: ${err.message}`);
          lastError = err;
          continue; // Try next model
        }
      }

      if (!result) {
        throw lastError || new Error('All models failed');
      }

      const scoreText = result.generated_text.trim();
      const score = parseFloat(scoreText);

      if (isNaN(score)) {
        this.logger.warn(`AI returned non-numeric score: ${scoreText}`);
        return null;
      }

      const normalizedScore = Math.max(0, Math.min(100, score));
      this.logger.log(`AI risk score calculated: ${normalizedScore}/100`);
      return normalizedScore;
    } catch (error) {
      this.logger.error('HF AI risk prediction failed:', error.message);
      return null;
    }
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
    aiRiskScore: number | null,
  ): string {
    const parts: string[] = [];

    if (aiRiskScore !== null) {
      parts.push(
        `🤖 AI-Powered Pricing: Applied ${(discountRate * 100).toFixed(2)}% discount rate based on:`,
      );
    } else {
      parts.push(
        `Applied ${(discountRate * 100).toFixed(2)}% discount rate based on:`,
      );
    }

    parts.push(`• Payment term: ${daysUntilDue} days`);
    parts.push(
      `• Pool liquidity: ${liquidityRatio > 0.7 ? 'Abundant' : liquidityRatio > 0.3 ? 'Moderate' : 'Tight'}`,
    );
    parts.push(`• Average credit rating: ${avgRating.toFixed(0)}/100`);
    parts.push(`• Rule-based risk score: ${riskScore.toFixed(0)}/100`);

    if (aiRiskScore !== null) {
      parts.push(`• AI risk prediction: ${aiRiskScore.toFixed(0)}/100`);
      parts.push(
        `• Analysis powered by Hugging Face Mistral-7B`,
      );
    }

    return parts.join('\n');
  }

  /**
   * Generate EIP-712 signature for financing withdrawal
   * @param invoiceId Unique invoice identifier
   * @param supplierAddress Supplier's wallet address
   * @param payoutAmount Amount to pay out immediately (in USDC)
   * @param repaymentAmount Amount that must be repaid (includes interest, in USDC)
   * @param daysUntilDue Number of days until repayment is due
   */
  async generateFinancingSignature(
    invoiceId: string,
    supplierAddress: string,
    payoutAmount: number,
    repaymentAmount: number,
    daysUntilDue: number,
  ): Promise<SignatureData> {
    const nonce = Date.now();
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry for signature
    const dueDate = Math.floor(Date.now() / 1000) + (daysUntilDue * 24 * 60 * 60); // Convert days to seconds

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

    // EIP-712 Types (Updated to match new contract)
    const types = {
      FinancingRequest: [
        { name: 'invoiceId', type: 'bytes32' },
        { name: 'supplier', type: 'address' },
        { name: 'payoutAmount', type: 'uint256' },
        { name: 'repaymentAmount', type: 'uint256' },
        { name: 'dueDate', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    // Convert amounts to Wei (6 decimals for USDC)
    const payoutAmountWei = ethers.parseUnits(payoutAmount.toString(), 18);
    const repaymentAmountWei = ethers.parseUnits(repaymentAmount.toString(), 18);

    // Values
    const values = {
      invoiceId: ethers.id(invoiceId),
      supplier: supplierAddress,
      payoutAmount: payoutAmountWei,
      repaymentAmount: repaymentAmountWei,
      dueDate: dueDate,
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

    this.logger.log(
      `Generated signature for invoice ${invoiceId}: Payout ${payoutAmount} USDC, Repayment ${repaymentAmount} USDC, Due in ${daysUntilDue} days`,
    );

    return {
      signature,
      nonce,
      deadline,
      repaymentAmount,
      dueDate,
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
        { name: 'repaymentAmount', type: 'uint256' },
        { name: 'dueDate', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    const payoutAmountWei = ethers.parseUnits(payoutAmount.toString(), 18);
    const repaymentAmountWei = ethers.parseUnits(
      signatureData.repaymentAmount.toString(),
      6,
    );

    const values = {
      invoiceId: ethers.id(invoiceId),
      supplier: supplierAddress,
      payoutAmount: payoutAmountWei,
      repaymentAmount: repaymentAmountWei,
      dueDate: signatureData.dueDate,
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

