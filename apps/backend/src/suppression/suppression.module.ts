import { Module } from '@nestjs/common';
import { SuppressionService } from './suppression.service';

@Module({
  providers: [SuppressionService],
  exports: [SuppressionService],
})
export class SuppressionModule {}
