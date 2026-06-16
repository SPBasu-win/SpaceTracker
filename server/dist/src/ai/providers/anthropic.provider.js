import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base.provider.js';
export class AnthropicProvider extends BaseProvider {
    client;
    constructor(apiKey, model = 'claude-3-5-sonnet-20240620') {
        super(apiKey, model);
        this.client = new Anthropic({ apiKey: this.apiKey });
    }
    providerName() {
        return 'Anthropic';
    }
    supportsToolCalling() {
        return true;
    }
    supportsNativeWebSearch() {
        return true;
    }
    async chat(messages, tools, options) {
        // Anthropic extracts system prompts from the messages array
        const systemMessages = messages.filter(m => m.role === 'system');
        const systemPrompt = systemMessages.length > 0 ? systemMessages.map(m => m.content).join('\n') : undefined;
        // Filter out system messages and format tool messages
        const formattedMessages = [];
        for (const msg of messages) {
            if (msg.role === 'system')
                continue;
            if (msg.role === 'tool') {
                formattedMessages.push({
                    role: 'user',
                    content: [
                        {
                            type: 'tool_result',
                            tool_use_id: msg.tool_call_id,
                            content: msg.content,
                        }
                    ]
                });
            }
            else if (msg.role === 'assistant' && msg.tool_calls) {
                const content = [];
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
            }
            else {
                formattedMessages.push({ role: msg.role, content: msg.content });
            }
        }
        const requestBody = {
            model: options?.modelId || this.defaultModel,
            max_tokens: options?.maxTokens || 4096,
            messages: formattedMessages,
            system: systemPrompt,
        };
        if (tools && tools.length > 0) {
            requestBody.tools = tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                input_schema: tool.parameters,
            }));
        }
        if (options?.enableWebSearch) {
            requestBody.tools = requestBody.tools || [];
            requestBody.tools.push({
                type: "web_search_20260209",
                name: "web_search",
            });
        }
        const response = await this.client.messages.create(requestBody);
        const textContent = response.content.find(c => c.type === 'text');
        const toolUseBlocks = response.content.filter(c => c.type === 'tool_use');
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
