import { Module } from '@nestjs/common';
import { AegisModule } from '../aegis/aegis.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [AegisModule, BlockchainModule],
})
export class InvoiceModule {}

