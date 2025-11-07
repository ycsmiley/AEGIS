import { Module } from '@nestjs/common';
import { AegisModule } from '../aegis/aegis.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [AegisModule, BlockchainModule],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}

