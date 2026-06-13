import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base.provider.js';
import { ChatMessage, ChatResponse, ToolDefinition } from '../types.js';

export class AnthropicProvider extends BaseProvider {
  private client: Anthropic;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20240620') {
    super(apiKey, model);
    this.client = new Anthropic({ apiKey: this.apiKey });
  }

  providerName(): string {
    return 'Anthropic';
  }

  supportsToolCalling(): boolean {
    return true;
  }

  async chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    options?: { modelId?: string; maxTokens?: number }
  ): Promise<ChatResponse> {
    // Anthropic extracts system prompts from the messages array
    const systemMessages = messages.filter(m => m.role === 'system');
    const systemPrompt = systemMessages.length > 0 ? systemMessages.map(m => m.content).join('\n') : undefined;

    // Filter out system messages and format tool messages
    const formattedMessages: Anthropic.MessageParam[] = [];
    
    for (const msg of messages) {
      if (msg.role === 'system') continue;
      
      if (msg.role === 'tool') {
        formattedMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.tool_call_id!,
              content: msg.content,
            }
          ]
        });
      } else if (msg.role === 'assistant' && msg.tool_calls) {
        const content: Anthropic.ContentBlock[] = [];
        if (msg.content) {
          content.push({ type: 'text', text: msg.content });
        }
        for (const tc of msg.tool_calls) {
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input: tc.arguments,
          });
        }
        formattedMessages.push({ role: 'assistant', content });
      } else {
        formattedMessages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
      }
    }

    const requestBody: Anthropic.MessageCreateParamsNonStreaming = {
      model: options?.modelId || this.defaultModel,
      max_tokens: options?.maxTokens || 4096,
      messages: formattedMessages,
      system: systemPrompt,
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters as any,
      }));
    }

    const response = await this.client.messages.create(requestBody);

    const textContent = response.content.find(c => c.type === 'text') as Anthropic.TextBlock;
    const toolUseBlocks = response.content.filter(c => c.type === 'tool_use') as Anthropic.ToolUseBlock[];

    return {
      content: textContent?.text || '',
      toolCalls: toolUseBlocks.length > 0 ? toolUseBlocks.map(tb => ({
        id: tb.id,
        name: tb.name,
        arguments: tb.input,
      })) : undefined,
    };
  }
}
