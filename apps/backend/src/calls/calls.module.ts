import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { SuppressionModule } from '../suppression/suppression.module';
import { TranscriptionModule } from '../transcription/transcription.module';

@Module({
  imports: [SuppressionModule, TranscriptionModule],
  controllers: [CallsController],
  providers: [CallsService],
})
export class CallsModule {}
