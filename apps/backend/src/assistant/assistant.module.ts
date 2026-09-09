import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { AssistantProposalsService } from './assistant-proposals.service';
import { AssistantToolsService } from './tools/assistant-tools.service';
import { AssistantProposalToolsService } from './tools/assistant-proposal-tools.service';
import { AiModule } from '../ai/ai.module';
import { EnrichmentModule } from '../enrichment/enrichment.module';
import { CadencesModule } from '../cadences/cadences.module';
import { GmailModule } from '../gmail/gmail.module';

@Module({
  imports: [AiModule, EnrichmentModule, CadencesModule, GmailModule],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    AssistantProposalsService,
    AssistantToolsService,
    AssistantProposalToolsService,
  ],
})
export class AssistantModule {}
