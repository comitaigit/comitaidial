import Anthropic from '@anthropic-ai/sdk';

export interface ToolContext {
  tenantId: string;
  userId: string;
  conversationId: string;
}

export interface ToolDefinition {
  spec: Anthropic.Tool;
  // Anthropic's tool_use.input arrives as `unknown` (parsed JSON per the
  // model's own schema, no compile-time guarantee) — each execute() casts
  // it to the shape its own spec.input_schema declares.
  execute(input: unknown, ctx: ToolContext): Promise<unknown>;
}
