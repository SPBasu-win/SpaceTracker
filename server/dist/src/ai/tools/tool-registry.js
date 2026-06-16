export class ToolRegistry {
    tools = new Map();
    register(tool) {
        this.tools.set(tool.name, tool);
    }
    getDefinitions() {
        return Array.from(this.tools.values()).map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
        }));
    }
    async executeTool(toolCall) {
        const tool = this.tools.get(toolCall.name);
        if (!tool) {
            throw new Error(`Tool ${toolCall.name} not found`);
        }
        try {
            return await tool.handler(toolCall.arguments);
        }
        catch (error) {
            console.error(`Error executing tool ${toolCall.name}:`, error);
            return { error: error.message || 'Unknown error occurred while executing tool.' };
        }
    }
}
