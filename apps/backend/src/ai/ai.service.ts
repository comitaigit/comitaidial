import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

// Every model this codebase is allowed to call — see the build-order
// decision (2026-09-08) to keep Claude-only for the MVP rather than
// supporting multiple LLM providers.
export enum AiModel {
  OPUS = 'claude-opus-5',
  HAIKU = 'claude-haiku-4-5',
}

function extractJson(text: string): Record<string, unknown> {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const candidate = fenced ? fenced[1] : text;
  try {
    const parsed: unknown = JSON.parse(candidate);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export interface AiCompleteParams {
  prompt: string;
  maxTokens: number;
  model?: AiModel;
}

// Single Anthropic client for the whole backend — replaces the 4 separate
// `new Anthropic()` instantiations that used to live in DialerService,
// CallsService, OverviewService and TranscriptionService. Every feature
// that needs an LLM call imports AiModule and injects this instead of
// constructing its own client.
@Injectable()
export class AiService {
  private readonly client: Anthropic;

  constructor(config: ConfigService) {
    this.client = new Anthropic({
      apiKey: config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async complete({
    prompt,
    maxTokens,
    model = AiModel.OPUS,
  }: AiCompleteParams): Promise<string> {
    const message = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    const textBlock = message.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );
    return textBlock?.text.trim() ?? '';
  }

  // Same call, but for prompts that ask Claude to respond with JSON —
  // strips a markdown fence if present and parses. Returns {} (never
  // throws) on malformed/empty output, matching every existing call site's
  // "fall back to defaults" handling of a bad response.
  async completeJson(
    params: AiCompleteParams,
  ): Promise<Record<string, unknown>> {
    const text = await this.complete(params);
    return extractJson(text);
  }
}
