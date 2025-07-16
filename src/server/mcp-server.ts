import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GitLabClient } from "../gitlab/client.js";
import { GitLabConfig } from "../config/types.js";
import { registerMergeRequestTools, registerFileOperationTools } from "./tools/index.js";

export class GitLabMcpServer {
  private server: McpServer;
  private gitlabClient: GitLabClient;

  constructor(config: GitLabConfig) {
    this.gitlabClient = new GitLabClient(config);
    this.server = new McpServer({
      name: "gitlab-mcp",
      version: "1.0.0",
    });
  }

  /**
   * 测试 GitLab 连接
   */
  async testConnection(): Promise<void> {
    try {
      const connectionTest = await this.gitlabClient.testConnection();
      if (!connectionTest.success) {
        throw new Error(`GitLab连接失败: ${connectionTest.error}`);
      }
      console.error(`✅ 已连接到GitLab: ${connectionTest.user?.username} (${connectionTest.user?.name})`);
    } catch (error) {
      console.error("❌ GitLab连接测试失败:", error);
      throw error;
    }
  }

  /**
   * 初始化服务器，注册所有工具
   */
  async initialize(): Promise<void> {
    await this.testConnection();
    this.registerTools();
  }

  /**
   * 注册所有工具
   */
  private registerTools(): void {
    // 注册合并请求相关工具
    registerMergeRequestTools(this.server, this.gitlabClient);
    
    // 注册文件操作相关工具
    registerFileOperationTools(this.server, this.gitlabClient);
  }

  /**
   * 获取 MCP 服务器实例
   */
  getServer(): McpServer {
    return this.server;
  }

  /**
   * 获取 GitLab 客户端实例
   */
  getGitLabClient(): GitLabClient {
    return this.gitlabClient;
  }
} 