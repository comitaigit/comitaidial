import { Module } from '@nestjs/common';
import { ProspectingController } from './prospecting.controller';
import { ProspectingService } from './prospecting.service';
import { LushaProspectingProvider } from './providers/lusha-prospecting.provider';
import { PROSPECTING_PROVIDER } from './prospecting-provider.interface';
import { EnrichmentModule } from '../enrichment/enrichment.module';

@Module({
  imports: [EnrichmentModule],
  controllers: [ProspectingController],
  providers: [
    ProspectingService,
    LushaProspectingProvider,
    { provide: PROSPECTING_PROVIDER, useExisting: LushaProspectingProvider },
  ],
  exports: [ProspectingService],
})
export class ProspectingModule {}
