import { AIRouter } from '../ai/ai-router.js';
import { getSystemPrompt } from '../ai/system-prompt.js';
import { ToolRegistry } from '../ai/tools/tool-registry.js';
import { chatMemory } from './chat-memory.js';
import { satelliteLookupTool, getSatellitePositionTool, predictPassesTool, getOverheadSatellitesTool, getSatelliteInfoTool, countSatellitesTool } from '../ai/tools/orbital-tools.js';
import { geocodeLocationTool } from '../ai/tools/web-tools.js';
import { getSkyObjectsOverheadTool, getPlanetPositionTool } from '../ai/tools/astronomy-tools.js';
export class AIService {
    router;
    toolRegistry;
    constructor() {
        this.router = new AIRouter();
        this.toolRegistry = new ToolRegistry();
        // Register tools
        this.toolRegistry.register(satelliteLookupTool);
        this.toolRegistry.register(getSatellitePositionTool);
        this.toolRegistry.register(predictPassesTool);
        this.toolRegistry.register(getOverheadSatellitesTool);
        this.toolRegistry.register(getSatelliteInfoTool);
        this.toolRegistry.register(countSatellitesTool);
        this.toolRegistry.register(geocodeLocationTool);
        // Project Zenith celestial-body tools
        this.toolRegistry.register(getSkyObjectsOverheadTool);
        this.toolRegistry.register(getPlanetPositionTool);
    }
    getHealth() {
        const provider = this.router.getActiveProvider();
        return {
            status: provider ? 'ready' : 'unavailable',
            provider: provider?.providerName() || 'none',
            model: provider?.modelId() || 'none'
        };
    }
    async chat(sessionId, userMessage, location) {
        if (userMessage.length > 1000) {
            throw new Error('Message too long (max 1000 chars)');
        }
        if (chatMemory.isSessionExpired(sessionId)) {
            throw new Error('Session limit reached. Please reload to start a new conversation.');
        }
        const provider = this.router.getActiveProvider();
        if (!provider) {
            throw new Error('AI is temporarily unavailable');
        }
        // Load history and add new user message
        let history = chatMemory.getHistory(sessionId);
        const userChatMsg = { role: 'user', content: userMessage };
        chatMemory.addMessage(sessionId, userChatMsg);
        history = chatMemory.getHistory(sessionId); // reload history
        // Construct full messages array with system prompt
        const messages = [
            { role: 'system', content: getSystemPrompt(location) },
            ...history
        ];
        let toolsUsed = [];
        let globeAction = undefined;
        let loopCount = 0;
        const MAX_TOOL_LOOPS = 5;
        while (loopCount < MAX_TOOL_LOOPS) {
            loopCount++;
            const response = await this.router.chat(messages, this.toolRegistry.getDefinitions(), { maxTokens: 1000, enableWebSearch: true });
            if (response.toolCalls) {
                for (const tc of response.toolCalls) {
                    // Auto-fix hallucinated LLaMA tool names like: get_satellite_position({"catalogNumber": 25544})
                    const match = tc.name.match(/^([a-zA-Z0-9_]+)\((.*)\)$/);
                    if (match) {
                        tc.name = match[1];
                        if (!tc.arguments || tc.arguments === '' || tc.arguments === '{}') {
                            tc.arguments = match[2];
                        }
                    }
                }
            }
            // Save assistant message to memory
            const assistantMsg = {
                role: 'assistant',
                content: response.content || '',
                tool_calls: response.toolCalls
            };
            chatMemory.addMessage(sessionId, assistantMsg);
            messages.push(assistantMsg);
            if (!response.toolCalls || response.toolCalls.length === 0) {
                // No more tool calls, return final response
                return {
                    reply: response.content,
                    sessionId,
                    toolsUsed,
                    turnsRemaining: chatMemory.getTurnsRemaining(sessionId),
                    globeAction
                };
            }
            // Execute tools
            for (const toolCall of response.toolCalls) {
                if (!toolsUsed.includes(toolCall.name)) {
                    toolsUsed.push(toolCall.name);
                }
                try {
                    const args = typeof toolCall.arguments === 'string' ? JSON.parse(toolCall.arguments) : toolCall.arguments;
                    if (toolCall.name === 'get_satellite_position' || toolCall.name === 'get_satellite_info') {
                        if (args && args.catalogNumber) {
                            globeAction = { type: 'FLY_TO', catalogNumber: args.catalogNumber };
                        }
                    }
                    else if (toolCall.name === 'satellite_lookup' || toolCall.name === 'count_satellites') {
                        if (args && args.assetClass) {
                            globeAction = { type: 'FILTER_CATEGORY', assetClass: args.assetClass };
                        }
                    }
                    else if (toolCall.name === 'get_planet_position') {
                        if (args && args.body) {
                            globeAction = { type: 'FLY_TO_PLANET', body: String(args.body) };
                        }
                    }
                }
                catch (e) {
                    // ignore parsing error for globeAction
                }
                const toolResult = await this.toolRegistry.executeTool(toolCall);
                const toolResultMsg = {
                    role: 'tool',
                    name: toolCall.name,
                    tool_call_id: toolCall.id,
                    content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
                };
                chatMemory.addMessage(sessionId, toolResultMsg);
                messages.push(toolResultMsg);
            }
        }
        return {
            reply: "I needed to process too much information and had to stop. Please ask a more specific question.",
            sessionId,
            toolsUsed,
            turnsRemaining: chatMemory.getTurnsRemaining(sessionId),
            globeAction
        };
    }
}
export const aiService = new AIService();
