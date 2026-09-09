import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { SuppressionModule } from '../suppression/suppression.module';
import { TranscriptionModule } from '../transcription/transcription.module';
import { DialerModule } from '../dialer/dialer.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [SuppressionModule, TranscriptionModule, DialerModule, AiModule],
  controllers: [CallsController],
  providers: [CallsService],
})
export class CallsModule {}
