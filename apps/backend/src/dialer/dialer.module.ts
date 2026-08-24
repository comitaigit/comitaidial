import { Module } from '@nestjs/common';
import { DialerController } from './dialer.controller';
import { DialerService } from './dialer.service';
import { SuppressionModule } from '../suppression/suppression.module';

@Module({
  imports: [SuppressionModule],
  controllers: [DialerController],
  providers: [DialerService],
})
export class DialerModule {}
