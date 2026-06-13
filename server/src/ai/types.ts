export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>; // JSON Schema
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: any; // Object parsed from JSON
}

export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
}

export interface ProviderConfig {
  apiKey: string;
  modelId?: string;
  maxTokens?: number;
}
