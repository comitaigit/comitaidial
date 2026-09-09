import { Module } from '@nestjs/common';
import { TranscriptionService } from './transcription.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  providers: [TranscriptionService],
  exports: [TranscriptionService],
})
export class TranscriptionModule {}
