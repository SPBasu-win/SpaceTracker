import Groq from 'groq-sdk';
import { BaseProvider } from './base.provider.js';
export class GroqProvider extends BaseProvider {
    client;
    constructor(apiKey, model = 'llama-3.3-70b-versatile') {
        super(apiKey, model);
        this.client = new Groq({ apiKey: this.apiKey });
    }
    providerName() {
        return 'Groq';
    }
    supportsToolCalling() {
        return true; // Groq supports OpenAI-compatible tool calling
    }
    supportsNativeWebSearch() {
        return false; // Groq does not support combining custom tools with native web search
    }
    async chat(messages, tools, options) {
        const formattedMessages = messages.map(msg => {
            const formatted = { role: msg.role, content: msg.content };
            if (msg.name)
                formatted.name = msg.name;
            if (msg.tool_call_id)
                formatted.tool_call_id = msg.tool_call_id;
            if (msg.tool_calls) {
                formatted.tool_calls = msg.tool_calls.map((tc) => ({
                    id: tc.id,
                    type: 'function',
                    function: {
                        name: tc.name,
                        arguments: typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments)
                    }
                }));
            }
            return formatted;
        });
        const requestBody = {
            model: options?.modelId || this.defaultModel,
            messages: formattedMessages,
            max_tokens: options?.maxTokens,
            temperature: 0,
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
        try {
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
        catch (error) {
            let errBody = error.error?.error || error.error || error;
            if (error.status === 400 && errBody?.code === 'tool_use_failed' && errBody?.failed_generation) {
                // Recover from Groq LLaMA hallucinated tool syntax
                const failedGen = errBody.failed_generation;
                const match = failedGen.match(/<function=([a-zA-Z0-9_]+)(?:\((.*)\))?>(.*)<\/function>/s);
                if (match) {
                    return {
                        content: '',
                        toolCalls: [{
                                id: 'call_' + Date.now().toString(),
                                name: match[1],
                                arguments: JSON.parse(match[2] || match[3] || '{}'),
                            }]
                    };
                }
            }
            throw error;
        }
    }
}
