import { Injectable, NotFoundException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AssistantMessageRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AssistantToolsService } from './tools/assistant-tools.service';

const MAX_TOOL_ITERATIONS = 6;
const MAX_TOKENS = 2000;

const SYSTEM_PROMPT = `Você é o assistente de vendas B2B da Comitai, integrado ao Dialer.
Ajude o BDR a encontrar informações sobre empresas, contatos, histórico de ligações e
créditos de enriquecimento/prospecção usando as ferramentas disponíveis. Responda sempre
em português, de forma direta e curta. Nunca invente dados — se uma ferramenta não
encontrar algo, diga isso claramente em vez de supor.`;

function toDisplayText(
  content: string | Anthropic.ContentBlockParam[],
): string {
  if (typeof content === 'string') return content;
  return content
    .map((block) => {
      if (block.type === 'text') return block.text;
      if (block.type === 'tool_use') return `🔧 ${block.name}`;
      return null;
    })
    .filter((text): text is string => !!text)
    .join('\n');
}

@Injectable()
export class AssistantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly tools: AssistantToolsService,
  ) {}

  async listConversations(tenantId: string, userId: string) {
    return this.prisma.assistantConversation.findMany({
      where: { tenantId, userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true, createdAt: true },
    });
  }

  async getConversation(id: string, tenantId: string, userId: string) {
    const conversation = await this.prisma.assistantConversation.findFirst({
      where: { id, tenantId, userId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found.');

    const messages = await this.prisma.assistantMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      id: conversation.id,
      title: conversation.title,
      messages: messages
        .map((m) => ({
          role: m.role,
          text: toDisplayText(
            m.content as string | Anthropic.ContentBlockParam[],
          ),
          createdAt: m.createdAt,
        }))
        .filter((m) => m.text.length > 0),
    };
  }

  async sendMessage(
    tenantId: string,
    userId: string,
    conversationId: string | undefined,
    userText: string,
  ): Promise<{ conversationId: string; reply: string }> {
    const conversation = conversationId
      ? await this.prisma.assistantConversation.findFirst({
          where: { id: conversationId, tenantId, userId },
        })
      : null;
    if (conversationId && !conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    const activeConversation =
      conversation ??
      (await this.prisma.assistantConversation.create({
        data: { tenantId, userId, title: userText.slice(0, 80) },
      }));

    const priorMessages = await this.prisma.assistantMessage.findMany({
      where: { conversationId: activeConversation.id },
      orderBy: { createdAt: 'asc' },
    });

    const history: Anthropic.MessageParam[] = priorMessages.map((m) => ({
      role: m.role === AssistantMessageRole.USER ? 'user' : 'assistant',
      content: m.content as string | Anthropic.ContentBlockParam[],
    }));

    history.push({ role: 'user', content: userText });
    await this.persistMessage(
      activeConversation.id,
      AssistantMessageRole.USER,
      userText,
    );

    const toolDefinitions = this.tools.getReadOnlyTools();
    const toolSpecs = toolDefinitions.map((t) => t.spec);

    let replyText = '';
    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      const response = await this.ai.createMessage({
        system: SYSTEM_PROMPT,
        messages: history,
        tools: toolSpecs,
        maxTokens: MAX_TOKENS,
      });

      await this.persistMessage(
        activeConversation.id,
        AssistantMessageRole.ASSISTANT,
        response.content,
      );
      history.push({ role: 'assistant', content: response.content });

      if (response.stop_reason !== 'tool_use') {
        replyText = toDisplayText(response.content);
        break;
      }

      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        const tool = toolDefinitions.find((t) => t.spec.name === block.name);
        try {
          const result = tool
            ? await tool.execute(block.input, { tenantId })
            : { error: `Unknown tool: ${block.name}` };
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        } catch (err) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify({
              error: err instanceof Error ? err.message : String(err),
            }),
            is_error: true,
          });
        }
      }

      history.push({ role: 'user', content: toolResults });
      await this.persistMessage(
        activeConversation.id,
        AssistantMessageRole.USER,
        toolResults,
      );
    }

    await this.prisma.assistantConversation.update({
      where: { id: activeConversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId: activeConversation.id,
      reply: replyText || 'Não consegui gerar uma resposta — tente reformular.',
    };
  }

  private persistMessage(
    conversationId: string,
    role: AssistantMessageRole,
    content: string | Anthropic.ContentBlockParam[] | Anthropic.ContentBlock[],
  ) {
    return this.prisma.assistantMessage.create({
      data: {
        conversationId,
        role,
        content: content as Prisma.InputJsonValue,
      },
    });
  }
}
