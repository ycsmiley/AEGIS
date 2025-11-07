import { Module } from '@nestjs/common';
import { AegisService } from './aegis.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  providers: [AegisService],
  exports: [AegisService],
})
export class AegisModule {}

