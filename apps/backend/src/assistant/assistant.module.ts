import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { AssistantToolsService } from './tools/assistant-tools.service';
import { AiModule } from '../ai/ai.module';
import { EnrichmentModule } from '../enrichment/enrichment.module';

@Module({
  imports: [AiModule, EnrichmentModule],
  controllers: [AssistantController],
  providers: [AssistantService, AssistantToolsService],
})
export class AssistantModule {}
