/**
 * MCP 工具接口
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * 工具处理器接口
 */
export interface ToolHandler {
  handle(args: Record<string, any>): Promise<any>;
}

/**
 * 工具注册表
 * 管理所有 MCP 工具的注册和调用
 */
export class ToolRegistry {
  private tools: Map<string, MCPTool> = new Map();
  private handlers: Map<string, ToolHandler> = new Map();

  /**
   * 注册工具
   */
  registerTool(tool: MCPTool, handler: ToolHandler): void {
    this.tools.set(tool.name, tool);
    this.handlers.set(tool.name, handler);
  }

  /**
   * 获取所有工具
   */
  getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取工具
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * 调用工具
   */
  async callTool(name: string, args: Record<string, any>): Promise<any> {
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new Error(`未找到工具: ${name}`);
    }

    try {
      return await handler.handle(args);
    } catch (error) {
      throw new Error(
        `工具调用失败 [${name}]: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 检查工具是否存在
   */
  hasTools(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * 获取工具数量
   */
  getToolCount(): number {
    return this.tools.size;
  }

  /**
   * 清除所有工具
   */
  clear(): void {
    this.tools.clear();
    this.handlers.clear();
  }

  /**
   * 获取工具列表（仅名称）
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
} 