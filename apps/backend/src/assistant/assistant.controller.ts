import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { AssistantProposalsService } from './assistant-proposals.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('assistant')
export class AssistantController {
  constructor(
    private readonly assistant: AssistantService,
    private readonly proposals: AssistantProposalsService,
  ) {}

  @Get('conversations')
  listConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.assistant.listConversations(user.tenantId, user.userId);
  }

  @Get('conversations/:id')
  getConversation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assistant.getConversation(id, user.tenantId, user.userId);
  }

  @Post('messages')
  sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assistant.sendMessage(
      user.tenantId,
      user.userId,
      dto.conversationId,
      dto.message,
    );
  }

  @Get('proposals')
  listPendingProposals(@CurrentUser() user: AuthenticatedUser) {
    return this.proposals.listPending(user.tenantId, user.userId);
  }

  @Post('proposals/:id/approve')
  approveProposal(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proposals.approve(id, user.tenantId, user.userId);
  }

  @Post('proposals/:id/reject')
  rejectProposal(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proposals.reject(id, user.tenantId, user.userId);
  }
}
