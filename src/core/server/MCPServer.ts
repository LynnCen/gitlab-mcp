/**
 * MCP Server 核心实现
 * 
 * 基于 @modelcontextprotocol/sdk 实现的 MCP 服务器
 * 负责处理所有 MCP 协议请求
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistry } from '../../capabilities/tools/ToolRegistry.js';
import type { ResourceRegistry } from '../../capabilities/resources/ResourceRegistry.js';
import type { PromptRegistry } from '../../capabilities/prompts/PromptRegistry.js';
import type { ILogger } from '../../logging/types.js';
import type { ExecutionContext } from '../../capabilities/tools/types.js';

/**
 * MCP Server 配置
 */
export interface MCPServerConfig {
  name: string;
  version: string;
  logger?: ILogger;
}

/**
 * MCP Server 核心类
 */
export class MCPServer {
  private server: Server;
  private toolRegistry: ToolRegistry;
  private resourceRegistry: ResourceRegistry;
  private promptRegistry: PromptRegistry;
  private logger?: ILogger;

  constructor(
    config: MCPServerConfig,
    toolRegistry: ToolRegistry,
    resourceRegistry: ResourceRegistry,
    promptRegistry: PromptRegistry
  ) {
    this.logger = config.logger;
    this.toolRegistry = toolRegistry;
    this.resourceRegistry = resourceRegistry;
    this.promptRegistry = promptRegistry;

    // 创建 MCP Server 实例
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    // 设置请求处理器
    this.setupHandlers();
  }

  /**
   * 创建执行上下文
   */
  private createExecutionContext(): ExecutionContext {
    return {
      traceId: `trace-${Date.now()}`,
      requestId: `req-${Date.now()}`,
      startTime: Date.now(),
      metadata: new Map(),
    };
  }

  /**
   * 设置所有 MCP 请求处理器
   */
  private setupHandlers(): void {
    // 工具列表请求
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger?.debug('Handling tools/list request');
      
      const tools = this.toolRegistry.listTools();
      
      this.logger?.info('Tools listed', { count: tools.length });
      
      return { tools };
    });

    // 工具调用请求
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      this.logger?.info('Handling tool call', { tool: toolName });

      const tool = this.toolRegistry.getTool(toolName);
      if (!tool) {
        const error = `Tool not found: ${toolName}`;
        this.logger?.error(error);
        throw new Error(error);
      }

      try {
        const context = this.createExecutionContext();
        const args = request.params.arguments || {};
        const result = await tool.execute(args, context);
        this.logger?.info('Tool executed successfully', { tool: toolName });
        return result;
      } catch (error) {
        this.logger?.error('Tool execution failed', {
          tool: toolName,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });

    // 资源列表请求
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.logger?.debug('Handling resources/list request');
      
      const resources = this.resourceRegistry.listResources();
      
      this.logger?.info('Resources listed', { count: resources.length });
      
      return { resources };
    });

    // 资源读取请求
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      this.logger?.info('Handling resource read', { uri });

      const resource = this.resourceRegistry.getResource(uri);
      if (!resource) {
        const error = `Resource not found: ${uri}`;
        this.logger?.error(error);
        throw new Error(error);
      }

      try {
        const content = await resource.getContent();
        this.logger?.info('Resource read successfully', { uri });
        return { contents: [content] };
      } catch (error) {
        this.logger?.error('Resource read failed', {
          uri,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });

    // 提示列表请求
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      this.logger?.debug('Handling prompts/list request');
      
      const prompts = this.promptRegistry.listPrompts();
      
      this.logger?.info('Prompts listed', { count: prompts.length });
      
      return { prompts };
    });

    // 提示获取请求
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const promptName = request.params.name;
      this.logger?.info('Handling prompt get', { prompt: promptName });

      const prompt = this.promptRegistry.getPrompt(promptName);
      if (!prompt) {
        const error = `Prompt not found: ${promptName}`;
        this.logger?.error(error);
        throw new Error(error);
      }

      try {
        const args = request.params.arguments || {};
        const result = await prompt.render(args);
        this.logger?.info('Prompt rendered successfully', { prompt: promptName });
        return {
          messages: [{
            role: 'user' as const,
            content: { type: 'text' as const, text: result },
          }],
        };
      } catch (error) {
        this.logger?.error('Prompt rendering failed', {
          prompt: promptName,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });
  }

  /**
   * 获取底层 MCP Server 实例
   */
  getServer(): Server {
    return this.server;
  }

  /**
   * 获取工具注册表
   */
  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  /**
   * 获取资源注册表
   */
  getResourceRegistry(): ResourceRegistry {
    return this.resourceRegistry;
  }

  /**
   * 获取提示注册表
   */
  getPromptRegistry(): PromptRegistry {
    return this.promptRegistry;
  }
}

