/**
 * 工具注册表
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ITool } from './Tool.js';
import type { ToolFilter, ToolInfo, ExecutionContext, ToolResult } from './types.js';

/**
 * 工具注册表
 */
export class ToolRegistry {
  private tools: Map<string, ITool> = new Map();

  /**
   * 注册工具
   */
  registerTool(tool: ITool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool '${tool.name}' is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * 注销工具
   */
  unregisterTool(name: string): void {
    this.tools.delete(name);
  }

  /**
   * 获取工具
   */
  getTool(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  /**
   * 列出所有工具
   */
  listTools(filter?: ToolFilter): ToolInfo[] {
    let tools = Array.from(this.tools.values());

    // 应用过滤器
    if (filter) {
      if (filter.category) {
        tools = tools.filter((tool) => tool.metadata?.category === filter.category);
      }
      if (filter.tags && filter.tags.length > 0) {
        tools = tools.filter((tool) => {
          const toolTags = tool.metadata?.tags || [];
          return filter.tags!.some((tag) => toolTags.includes(tag));
        });
      }
      if (filter.plugin) {
        tools = tools.filter((tool) => tool.metadata?.plugin === filter.plugin);
      }
      if (filter.deprecated !== undefined) {
        tools = tools.filter((tool) => tool.metadata?.deprecated === filter.deprecated);
      }
    }

    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema),
      category: tool.metadata?.category,
      tags: tool.metadata?.tags,
      plugin: tool.metadata?.plugin,
      deprecated: tool.metadata?.deprecated,
    }));
  }

  /**
   * 执行工具
   */
  async executeTool(
    name: string,
    params: any,
    context: ExecutionContext
  ): Promise<ToolResult> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found`);
    }

    // 验证输入参数
    try {
      const validatedParams = tool.inputSchema.parse(params);
      return await tool.execute(validatedParams, context);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid parameters for tool '${name}': ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 检查工具是否存在
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * 获取工具数量
   */
  getToolCount(): number {
    return this.tools.size;
  }
}

