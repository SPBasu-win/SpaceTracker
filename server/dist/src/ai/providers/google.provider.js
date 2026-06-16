import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseProvider } from './base.provider.js';
export class GoogleProvider extends BaseProvider {
    client;
    constructor(apiKey, model = 'gemini-3.5-flash') {
        super(apiKey, model);
        this.client = new GoogleGenerativeAI(this.apiKey);
    }
    providerName() {
        return 'Google';
    }
    supportsToolCalling() {
        return true;
    }
    supportsNativeWebSearch() {
        return true;
    }
    async chat(messages, tools, options) {
        if (Date.now() < this.cooldownUntil) {
            const remainingSeconds = Math.ceil((this.cooldownUntil - Date.now()) / 1000);
            const e = new Error(`AI Rate Limited: Please wait ${remainingSeconds} seconds.`);
            e.status = 429;
            e.retryAfter = remainingSeconds;
            throw e;
        }
        const systemMessages = messages.filter(m => m.role === 'system');
        const systemInstruction = systemMessages.length > 0 ? systemMessages.map(m => m.content).join('\n') : undefined;
        let geminiTools = tools && tools.length > 0 ? [{
                functionDeclarations: tools.map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters,
                }))
            }] : undefined;
        if (options?.enableWebSearch) {
            if (!geminiTools) {
                geminiTools = [{ googleSearch: {} }];
            }
            else {
                geminiTools.push({ googleSearch: {} });
            }
        }
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
            }
            else if (msg.role === 'tool') {
                let responseObj;
                try {
                    responseObj = JSON.parse(msg.content);
                }
                catch (e) {
                    responseObj = { result: msg.content };
                }
                return {
                    role: 'function',
                    parts: [{
                            functionResponse: {
                                name: msg.name,
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
        let result;
        let retries = 2;
        while (retries >= 0) {
            try {
                result = await model.generateContent({
                    contents: formattedMessages,
                    generationConfig: {
                        maxOutputTokens: options?.maxTokens,
                    }
                });
                break;
            }
            catch (error) {
                if (error.status === 429 && retries > 0) {
                    retries--;
                    let waitTime = 5000; // default 5s
                    if (error.errorDetails && Array.isArray(error.errorDetails)) {
                        const retryInfo = error.errorDetails.find((d) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
                        if (retryInfo && retryInfo.retryDelay) {
                            const seconds = parseInt(retryInfo.retryDelay.replace('s', ''));
                            if (!isNaN(seconds))
                                waitTime = seconds * 1000;
                        }
                    }
                    this.cooldownUntil = Date.now() + waitTime;
                    if (waitTime > 10000) {
                        const e = new Error(`AI Rate Limited: Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
                        e.status = 429;
                        e.retryAfter = Math.ceil(waitTime / 1000);
                        throw e;
                    }
                    console.warn(`[GoogleProvider] 429 Rate Limited. Waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
                else {
                    throw error;
                }
            }
        }
        const response = result.response;
        const functionCalls = response.functionCalls();
        let textContent = '';
        try {
            textContent = response.text() || '';
        }
        catch (e) {
            // Gemini throws if the response only contains function calls and no text
            textContent = '';
        }
        return {
            content: textContent,
            toolCalls: functionCalls ? functionCalls.map((fc) => ({
                id: Math.random().toString(36).substring(7),
                name: fc.name,
                arguments: fc.args,
            })) : undefined,
        };
    }
}
