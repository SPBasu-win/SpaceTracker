import { GoogleGenerativeAI, FunctionDeclaration, Tool } from '@google/generative-ai';
import { BaseProvider } from './base.provider.js';
import { ChatMessage, ChatResponse, ToolDefinition } from '../types.js';

export class GoogleProvider extends BaseProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string, model: string = 'gemini-2.5-flash') {
    super(apiKey, model);
    this.client = new GoogleGenerativeAI(this.apiKey);
  }

  providerName(): string {
    return 'Google';
  }

  supportsToolCalling(): boolean {
    return true;
  }

  async chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    options?: { modelId?: string; maxTokens?: number }
  ): Promise<ChatResponse> {
    const systemMessages = messages.filter(m => m.role === 'system');
    const systemInstruction = systemMessages.length > 0 ? systemMessages.map(m => m.content).join('\n') : undefined;

    const geminiTools: Tool[] | undefined = tools && tools.length > 0 ? [{
      functionDeclarations: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters as any,
      }))
    }] : undefined;

    const model = this.client.getGenerativeModel({
      model: options?.modelId || this.defaultModel,
      systemInstruction: systemInstruction,
      tools: geminiTools,
    });

    const formattedMessages = messages
      .filter(m => m.role !== 'system')
      .map(msg => {
        if (msg.role === 'assistant' && msg.tool_calls) {
          return {
            role: 'model',
            parts: msg.tool_calls.map(tc => ({
              functionCall: {
                name: tc.name,
                args: tc.arguments,
              }
            }))
          };
        } else if (msg.role === 'tool') {
          let responseObj;
          try {
            responseObj = JSON.parse(msg.content);
          } catch (e) {
            responseObj = { result: msg.content };
          }
          return {
            role: 'function',
            parts: [{
              functionResponse: {
                name: msg.name!,
                response: responseObj
              }
            }]
          };
        }
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content || '' }],
        };
      });

    const result = await model.generateContent({
      contents: formattedMessages as any,
      generationConfig: {
        maxOutputTokens: options?.maxTokens,
      }
    });

    const response = result.response;

    const functionCalls = response.functionCalls();
    
    let textContent = '';
    try {
      textContent = response.text() || '';
    } catch (e) {
      // Gemini throws if the response only contains function calls and no text
      textContent = '';
    }

    return {
      content: textContent,
      toolCalls: functionCalls ? functionCalls.map(fc => ({
        id: Math.random().toString(36).substring(7),
        name: fc.name,
        arguments: fc.args,
      })) : undefined,
    };
  }
}
