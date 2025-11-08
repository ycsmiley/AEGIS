import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

interface PoolStatus {
  total: bigint;
  available: bigint;
  utilized: bigint;
  financed: bigint;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private readonly contractABI = [
    'function getPoolStatus() external view returns (uint256 total, uint256 available, uint256 utilized, uint256 financed)',
    'function getLPBalance(address lp) external view returns (uint256)',
    'function isInvoiceFinanced(bytes32 invoiceId) external view returns (bool)',
    'event Deposit(address indexed lp, uint256 amount, uint256 newTotalPoolSize)',
    'event Withdrawal(address indexed lp, uint256 amount, uint256 newTotalPoolSize)',
    'event FinancingWithdrawn(bytes32 indexed invoiceId, address indexed supplier, uint256 amount, uint256 timestamp)',
  ];

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const rpcUrl = this.configService.get<string>('ARC_RPC_URL');
    const contractAddress = this.configService.get<string>(
      'ARC_CONTRACT_ADDRESS',
    );

    if (!rpcUrl || !contractAddress) {
      this.logger.warn(
        'Blockchain configuration missing, service will run in limited mode',
      );
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.contract = new ethers.Contract(
        contractAddress,
        this.contractABI,
        this.provider,
      );
      this.logger.log('Blockchain service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize blockchain service', error);
    }
  }

  /**
   * Get Arc pool status from smart contract
   */
  async getPoolStatus(): Promise<PoolStatus> {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const [total, available, utilized, financed] =
        await this.contract.getPoolStatus();

      return {
        total,
        available,
        utilized,
        financed,
      };
    } catch (error) {
      this.logger.error('Failed to get pool status', error);
      throw error;
    }
  }

  /**
   * Get LP balance
   */
  async getLPBalance(lpAddress: string): Promise<bigint> {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const balance = await this.contract.getLPBalance(lpAddress);
      return balance;
    } catch (error) {
      this.logger.error(`Failed to get LP balance for ${lpAddress}`, error);
      throw error;
    }
  }

  /**
   * Check if invoice is already financed
   */
  async isInvoiceFinanced(invoiceId: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const invoiceIdHash = ethers.id(invoiceId);
      const isFinanced =
        await this.contract.isInvoiceFinanced(invoiceIdHash);
      return isFinanced;
    } catch (error) {
      this.logger.error(
        `Failed to check invoice status for ${invoiceId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Listen to contract events
   */
  async listenToEvents(callback: (event: any) => void) {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }

    // Listen to Deposit events
    this.contract.on('Deposit', (lp, amount, newTotal, event) => {
      this.logger.log(
        `Deposit event: LP ${lp}, Amount ${ethers.formatUnits(amount, 18)} USDC`,
      );
      callback({
        type: 'DEPOSIT',
        lp,
        amount: ethers.formatUnits(amount, 18),
        newTotal: ethers.formatUnits(newTotal, 18),
        transactionHash: event.log.transactionHash,
      });
    });

    // Listen to FinancingWithdrawn events
    this.contract.on(
      'FinancingWithdrawn',
      (invoiceId, supplier, amount, timestamp, event) => {
        this.logger.log(
          `Financing event: Invoice ${invoiceId}, Supplier ${supplier}, Amount ${ethers.formatUnits(amount, 18)} USDC`,
        );
        callback({
          type: 'FINANCING',
          invoiceId,
          supplier,
          amount: ethers.formatUnits(amount, 18),
          timestamp,
          transactionHash: event.log.transactionHash,
        });
      },
    );

    this.logger.log('Started listening to contract events');
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(
    txHash: string,
  ): Promise<ethers.TransactionReceipt | null> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      this.logger.error(`Failed to get transaction receipt ${txHash}`, error);
      return null;
    }
  }

  /**
   * Format USDC amount (6 decimals)
   */
  formatUSDC(amount: bigint): string {
    return ethers.formatUnits(amount, 18);
  }

  /**
   * Parse USDC amount (6 decimals)
   */
  parseUSDC(amount: string): bigint {
    return ethers.parseUnits(amount, 18);
  }
}

