import { Module } from '@nestjs/common';
import { DialerController } from './dialer.controller';
import { DialerService } from './dialer.service';
import { SuppressionModule } from '../suppression/suppression.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [SuppressionModule, AiModule],
  controllers: [DialerController],
  providers: [DialerService],
  exports: [DialerService],
})
export class DialerModule {}
