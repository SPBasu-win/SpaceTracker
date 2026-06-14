import Groq from 'groq-sdk';
import { BaseProvider } from './base.provider.js';
import { ChatMessage, ChatResponse, ToolDefinition } from '../types.js';

export class GroqProvider extends BaseProvider {
  private client: Groq;

  constructor(apiKey: string, model: string = 'llama-3.3-70b-versatile') {
    super(apiKey, model);
    this.client = new Groq({ apiKey: this.apiKey });
  }

  providerName(): string {
    return 'Groq';
  }

  supportsToolCalling(): boolean {
    return true; // Groq supports OpenAI-compatible tool calling
  }

  supportsNativeWebSearch(): boolean {
    return true;
  }

  async chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    options?: { modelId?: string; maxTokens?: number; enableWebSearch?: boolean }
  ): Promise<ChatResponse> {
    const formattedMessages = messages.map(msg => {
      const formatted: any = { role: msg.role, content: msg.content };
      if (msg.name) formatted.name = msg.name;
      if (msg.tool_call_id) formatted.tool_call_id = msg.tool_call_id;
      if (msg.tool_calls) formatted.tool_calls = msg.tool_calls;
      return formatted;
    });

    const requestBody: Groq.Chat.ChatCompletionCreateParamsNonStreaming = {
      model: options?.enableWebSearch ? 'compound-beta' : (options?.modelId || this.defaultModel),
      messages: formattedMessages as any,
      max_tokens: options?.maxTokens,
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));
    }

    if (options?.enableWebSearch) {
      requestBody.tools = requestBody.tools || [];
      requestBody.tools.push({
        type: 'web_search' as any
      });
    }

    const response = await this.client.chat.completions.create(requestBody);
    const message = response.choices[0]?.message;

    if (!message) {
      throw new Error('Groq returned no choices');
    }

    return {
      content: message.content || '',
      toolCalls: message.tool_calls?.map(tc => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
    };
  }
}
