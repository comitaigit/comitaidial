import { Module } from '@nestjs/common';
import { EnrichmentController } from './enrichment.controller';
import { EnrichmentService } from './enrichment.service';
import { LushaProvider } from './providers/lusha.provider';
import { ENRICHMENT_PROVIDER } from './enrichment-provider.interface';

@Module({
  controllers: [EnrichmentController],
  providers: [
    EnrichmentService,
    LushaProvider,
    { provide: ENRICHMENT_PROVIDER, useExisting: LushaProvider },
  ],
  exports: [EnrichmentService],
})
export class EnrichmentModule {}
