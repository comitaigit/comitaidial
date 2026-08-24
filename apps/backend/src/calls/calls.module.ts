import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { SuppressionModule } from '../suppression/suppression.module';

@Module({
  imports: [SuppressionModule],
  controllers: [CallsController],
  providers: [CallsService],
})
export class CallsModule {}
