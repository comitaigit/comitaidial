import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

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
}
