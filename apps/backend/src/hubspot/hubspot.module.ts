import { Module } from '@nestjs/common';
import { HubSpotController } from './hubspot.controller';
import { HubSpotService } from './hubspot.service';
import { EncryptionModule } from '../common/encryption/encryption.module';

@Module({
  imports: [EncryptionModule],
  controllers: [HubSpotController],
  providers: [HubSpotService],
  exports: [HubSpotService],
})
export class HubSpotModule {}
