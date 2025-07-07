import express, { Request, Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { ConfigManager } from '../config/ConfigManager.js';
import { GitLabClientFactory } from '../gitlab/GitLabClientFactory.js';
import { MRStrategy } from '../gitlab/strategies/MRStrategy.js';
import { FileStrategy } from '../gitlab/strategies/FileStrategy.js';
import { ToolRegistry } from '../mcp/tools/ToolRegistry.js';
import { GetMRChangesTool } from '../mcp/tools/GetMRChangesTool.js';
import { GetFileContentTool, GetMultipleFileContentsTool } from '../mcp/tools/GetFileContentTool.js';
import { SSETransportAdapter } from '../mcp/transport/SSETransportAdapter.js';
import { ConnectionManager, DefaultConnectionListener } from './ConnectionManager.js';

/**
 * Express 服务器类
 * 整合所有组件，提供完整的 GitLab MCP 服务
 */
export class ExpressServer {
  private app: express.Application;
  private configManager: ConfigManager;
  private gitlabClientFactory: GitLabClientFactory;
  private toolRegistry: ToolRegistry;
  private sseAdapter: SSETransportAdapter;
  private connectionManager: ConnectionManager;
  private mcpServer!: Server;

  constructor() {
    this.app = express();
    this.configManager = ConfigManager.getInstance();
    this.gitlabClientFactory = GitLabClientFactory.getInstance();
    this.toolRegistry = new ToolRegistry();
    this.sseAdapter = new SSETransportAdapter();
    this.connectionManager = new ConnectionManager(this.sseAdapter);

    this.setupMiddleware();
    this.setupComponents();
    this.setupMCPServer();
    this.setupRoutes();
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS 设置
    this.app.use((req, res, next) => {
      const corsOrigins = this.configManager.getServerConfig().corsOrigins || ['*'];
      const origin = req.headers.origin;

      if (corsOrigins.includes('*') || (origin && corsOrigins.includes(origin))) {
        res.header('Access-Control-Allow-Origin', origin || '*');
      }

      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // 请求日志
    if (this.configManager.isDebug()) {
      this.app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
        next();
      });
    }
  }

  /**
   * 设置组件
   */
  private setupComponents(): void {
    // 添加连接监听器
    this.connectionManager.addListener(new DefaultConnectionListener());

    // 创建 GitLab 客户端
    const gitlabConfig = this.configManager.getGitLabConfig();
    const gitlabClient = this.gitlabClientFactory.createClient(gitlabConfig);

    // 创建策略
    const mrStrategy = new MRStrategy(gitlabClient);
    const fileStrategy = new FileStrategy(gitlabClient);

    // 注册工具
    this.toolRegistry.registerTool(
      GetMRChangesTool.getToolDefinition(),
      new GetMRChangesTool(mrStrategy)
    );

    this.toolRegistry.registerTool(
      GetFileContentTool.getToolDefinition(),
      new GetFileContentTool(fileStrategy)
    );

    this.toolRegistry.registerTool(
      GetMultipleFileContentsTool.getToolDefinition(),
      new GetMultipleFileContentsTool(fileStrategy)
    );
  }

  /**
   * 设置 MCP 服务器
   */
  private setupMCPServer(): void {
    this.mcpServer = new Server(
      {
        name: 'gitlab-mcp-server',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    // 工具列表处理器
    this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.toolRegistry.getAllTools(),
      };
    });

    // 工具调用处理器
    this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (!args) {
          throw new Error('缺少参数');
        }

        const result = await this.toolRegistry.callTool(name, args);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`工具调用失败 [${name}]:`, error);
        
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });

    // 资源处理器（暂时为空）
    this.mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
      return { resources: [] };
    });

    this.mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: 'text/plain',
            text: '暂不支持资源读取',
          },
        ],
      };
    });
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // SSE 端点
    this.app.get('/sse', async (req: Request, res: Response) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      const connection = this.connectionManager.createConnection(res);
      
      try {
        await this.mcpServer.connect(connection.transport);
      } catch (error) {
        console.error('MCP 服务器连接失败:', error);
        this.connectionManager.handleConnectionError(connection.id, error);
      }
    });

    // 消息端点
    this.app.post('/message', async (req: Request, res: Response) => {
      const sessionId = req.query['sessionId'] as string;
      
      if (!sessionId) {
        return res.status(400).json({ error: '缺少 sessionId 参数' });
      }

      const connection = this.connectionManager.getConnection(sessionId);
      
      if (!connection) {
        return res.status(400).json({ error: '无效的会话 ID' });
      }

             try {
         await connection.transport.handlePostMessage(req, res);
         this.connectionManager.handleConnectionMessage(sessionId, req.body);
         return;
       } catch (error) {
         console.error('处理消息失败:', error);
         this.connectionManager.handleConnectionError(sessionId, error);
         
         if (!res.headersSent) {
           return res.status(500).json({ error: '处理消息失败' });
         }
         return;
       }
    });

    // 健康检查端点
    this.app.get('/health', (req: Request, res: Response) => {
      const stats = this.connectionManager.getStats();
      const config = this.configManager.getConfigSummary();
      
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        connections: stats,
        tools: this.toolRegistry.getToolCount(),
        config,
      });
    });

    // GitLab 连接测试端点
    this.app.get('/test-gitlab', async (req: Request, res: Response) => {
      try {
        const gitlabConfig = this.configManager.getGitLabConfig();
        const gitlabClient = this.gitlabClientFactory.createClient(gitlabConfig);
        const result = await gitlabClient.testConnection();
        
        if (result.success) {
          res.json({
            success: true,
            message: 'GitLab 连接测试成功',
            user: result.user,
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'GitLab 连接测试失败',
            error: result.error,
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'GitLab 连接测试失败',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // 工具列表端点
    this.app.get('/tools', (req: Request, res: Response) => {
      res.json({
        tools: this.toolRegistry.getAllTools(),
        count: this.toolRegistry.getToolCount(),
      });
    });

    // 连接统计端点
    this.app.get('/connections', (req: Request, res: Response) => {
      const connections = this.connectionManager.getAllConnections();
      const stats = this.connectionManager.getStats();

      res.json({
        stats,
        connections: connections.map(conn => ({
          id: conn.id,
          connectedAt: conn.connectedAt,
          lastActivity: conn.lastActivity,
          isActive: !conn.response.destroyed,
        })),
      });
    });

    // 404 处理
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: '路由未找到' });
    });

    // 错误处理
    this.app.use((error: any, req: Request, res: Response, next: any) => {
      console.error('Express 错误:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          error: '服务器内部错误',
          message: this.configManager.isDebug() ? error.message : undefined,
        });
      }
    });
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    const serverConfig = this.configManager.getServerConfig();
    
         // 测试 GitLab 连接（可选）
     if (process.env['SKIP_GITLAB_TEST'] !== 'true') {
       console.log('正在测试 GitLab 连接...');
       const gitlabConfig = this.configManager.getGitLabConfig();
       const gitlabClient = this.gitlabClientFactory.createClient(gitlabConfig);
       
       try {
         const connectionTest = await gitlabClient.testConnection();
         
         if (connectionTest.success) {
           console.log('✅ GitLab 连接测试成功');
           console.log(`   用户: ${connectionTest.user?.name} (@${connectionTest.user?.username})`);
         } else {
           console.warn('⚠️ GitLab 连接测试失败，但继续启动服务器');
           console.warn(`   错误: ${connectionTest.error}`);
         }
       } catch (error) {
         console.warn('⚠️ GitLab 连接测试失败，但继续启动服务器');
         console.warn(`   错误: ${error instanceof Error ? error.message : String(error)}`);
       }
     } else {
       console.log('⏭️ 跳过 GitLab 连接测试');
     }

    return new Promise((resolve, reject) => {
      this.app.listen(serverConfig.port, serverConfig.host, () => {
        console.log('🚀 GitLab MCP 服务器已启动:');
        console.log(`   地址: http://${serverConfig.host}:${serverConfig.port}`);
        console.log(`   SSE 端点: http://${serverConfig.host}:${serverConfig.port}/sse`);
        console.log(`   健康检查: http://${serverConfig.host}:${serverConfig.port}/health`);
        console.log(`   GitLab 测试: http://${serverConfig.host}:${serverConfig.port}/test-gitlab`);
        console.log(`   工具列表: http://${serverConfig.host}:${serverConfig.port}/tools`);
        console.log(`   连接统计: http://${serverConfig.host}:${serverConfig.port}/connections`);
        console.log(`   工具数量: ${this.toolRegistry.getToolCount()}`);
        resolve();
      }).on('error', reject);
    });
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    console.log('正在关闭服务器...');
    this.connectionManager.closeAllConnections();
    console.log('服务器已关闭');
  }

  /**
   * 获取 Express 应用实例
   */
  getApp(): express.Application {
    return this.app;
  }
} 