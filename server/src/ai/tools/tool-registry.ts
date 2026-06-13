import { ToolDefinition, ToolCall } from '../types.js';

export interface SpaceTool extends ToolDefinition {
  handler: (args: any) => Promise<any>;
}

export class ToolRegistry {
  private tools = new Map<string, SpaceTool>();

  register(tool: SpaceTool) {
    this.tools.set(tool.name, tool);
  }

  getDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }

  async executeTool(toolCall: ToolCall): Promise<any> {
    const tool = this.tools.get(toolCall.name);
    if (!tool) {
      throw new Error(`Tool ${toolCall.name} not found`);
    }

    try {
      return await tool.handler(toolCall.arguments);
    } catch (error: any) {
      console.error(`Error executing tool ${toolCall.name}:`, error);
      return { error: error.message || 'Unknown error occurred while executing tool.' };
    }
  }
}
