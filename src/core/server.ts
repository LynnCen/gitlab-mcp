import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { BasePlugin, PluginRegistry } from './plugin.js';
import { ConfigManager } from './config.js';
import { ConsoleLogger } from './logger.js';
import { MemoryCacheManager } from './cache.js';
import { MCPError } from '../types/index.js';

/**
 * MCP服务器
 */
export class MCPServer {
  private server: Server;
  private config: ConfigManager;
  private logger: ConsoleLogger;
  private cache?: MemoryCacheManager;
  private pluginRegistry: PluginRegistry;
  private plugins: BasePlugin[] = [];

  constructor() {
    this.config = new ConfigManager();
    this.logger = new ConsoleLogger(this.config.getServerConfig().logLevel);
    this.pluginRegistry = new PluginRegistry();
    
    // 初始化缓存
    if (this.config.getCacheConfig().enabled) {
      this.cache = new MemoryCacheManager(this.config.getCacheConfig().ttl);
    }

    // 创建服务器
    this.server = new Server(
      {
        name: this.config.getServerConfig().name,
        version: this.config.getServerConfig().version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * 设置请求处理器
   */
  private setupHandlers(): void {
    // 工具相关处理器
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = this.getAllTools();
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        const result = await this.handleToolCall(name, args);
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        this.logger.error('工具调用失败:', error);
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });

    // 资源相关处理器
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = this.getAllResources();
      return { resources };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        const { uri } = request.params;
        const result = await this.handleResourceRead(uri);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        this.logger.error('资源读取失败:', error);
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: 'text/plain',
              text: `错误: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });

    // 提示相关处理器
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts = this.getAllPrompts();
      return { prompts };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        const result = await this.handlePromptGet(name, args);
        return result;
      } catch (error) {
        this.logger.error('提示获取失败:', error);
        throw error;
      }
    });
  }

  /**
   * 注册插件
   */
  registerPlugin(name: string, factory: any): void {
    this.pluginRegistry.register(name, factory);
  }

  /**
   * 初始化插件
   */
  private async initializePlugins(): Promise<void> {
    const pluginConfig = this.config.getPluginConfig();
    
    for (const [pluginName, enabled] of Object.entries(pluginConfig)) {
      if (enabled) {
        try {
          const plugin = this.pluginRegistry.create(pluginName, {
            config: this.config.getConfig(),
            logger: this.logger,
            ...(this.cache && { cache: this.cache }),
          });
          
          await plugin.initialize();
          this.plugins.push(plugin);
          this.logger.info(`插件 ${pluginName} 初始化成功`);
        } catch (error) {
          this.logger.error(`插件 ${pluginName} 初始化失败:`, error);
        }
      }
    }
  }

  /**
   * 获取所有工具
   */
  private getAllTools(): any[] {
    const tools = [];
    for (const plugin of this.plugins) {
      if (plugin.supports('tools')) {
        tools.push(...plugin.getTools());
      }
    }
    return tools;
  }

  /**
   * 获取所有资源
   */
  private getAllResources(): any[] {
    const resources = [];
    for (const plugin of this.plugins) {
      if (plugin.supports('resources')) {
        resources.push(...plugin.getResources());
      }
    }
    return resources;
  }

  /**
   * 获取所有提示
   */
  private getAllPrompts(): any[] {
    const prompts = [];
    for (const plugin of this.plugins) {
      if (plugin.supports('prompts')) {
        prompts.push(...plugin.getPrompts());
      }
    }
    return prompts;
  }

  /**
   * 处理工具调用
   */
  private async handleToolCall(name: string, args: any): Promise<any> {
    for (const plugin of this.plugins) {
      if (plugin.supports('tools')) {
        const tools = plugin.getTools();
        if (tools.some(tool => tool.name === name)) {
          return await plugin.handleToolCall(name, args);
        }
      }
    }
    throw new MCPError(`未找到工具: ${name}`, 'TOOL_NOT_FOUND');
  }

  /**
   * 处理资源读取
   */
  private async handleResourceRead(uri: string): Promise<any> {
    for (const plugin of this.plugins) {
      if (plugin.supports('resources')) {
        const resources = plugin.getResources();
        if (resources.some(resource => this.matchesResourceUri(uri, resource.uri))) {
          return await plugin.handleResourceRead(uri);
        }
      }
    }
    throw new MCPError(`未找到资源: ${uri}`, 'RESOURCE_NOT_FOUND');
  }

  /**
   * 处理提示获取
   */
  private async handlePromptGet(name: string, args: any): Promise<any> {
    for (const plugin of this.plugins) {
      if (plugin.supports('prompts')) {
        const prompts = plugin.getPrompts();
        if (prompts.some(prompt => prompt.name === name)) {
          return await plugin.handlePromptGet(name, args);
        }
      }
    }
    throw new MCPError(`未找到提示: ${name}`, 'PROMPT_NOT_FOUND');
  }

  /**
   * 匹配资源URI
   */
  private matchesResourceUri(uri: string, pattern: string): boolean {
    // 简单的URI匹配，可以扩展为更复杂的模式匹配
    return uri.startsWith(pattern.replace(/\{[^}]+\}/g, ''));
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    try {
      // 验证配置
      this.config.validate();
      
      // 初始化插件
      await this.initializePlugins();
      
      // 连接传输层
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      this.logger.info('MCP服务器启动成功');
    } catch (error) {
      this.logger.error('服务器启动失败:', error);
      throw error;
    }
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    try {
      // 销毁所有插件
      for (const plugin of this.plugins) {
        await plugin.destroy();
      }
      
      this.logger.info('MCP服务器已停止');
    } catch (error) {
      this.logger.error('服务器停止失败:', error);
      throw error;
    }
  }
} 