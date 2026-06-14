import { ChatMessage, ChatResponse, ToolDefinition } from '../types.js';

export abstract class BaseProvider {
  protected apiKey: string;
  protected defaultModel: string;
  public cooldownUntil: number = 0;

  constructor(apiKey: string, defaultModel: string) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  /**
   * Send a chat request to the provider
   */
  abstract chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    options?: { modelId?: string; maxTokens?: number }
  ): Promise<ChatResponse>;

  /**
   * Check if this provider supports tool calling
   */
  abstract supportsToolCalling(): boolean;

  /**
   * Get the current model ID
   */
  modelId(): string {
    return this.defaultModel;
  }

  /**
   * Get the provider's name
   */
  abstract providerName(): string;
}
