#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ConfigManager } from "./config/ConfigManager.js";
import { GitLabMcpServer } from "./server/index.js";

/**
 * 创建并初始化 GitLab MCP 服务器
 */
async function createServer(): Promise<GitLabMcpServer> {
  const configManager = ConfigManager.getInstance();
  const config = configManager.getGitLabConfig();
  
  const mcpServer = new GitLabMcpServer(config);
  await mcpServer.initialize();
  
  return mcpServer;
}

/**
 * 主函数 - 启动 GitLab MCP 服务器
 */
async function main(): Promise<void> {
  try {
    const mcpServer = await createServer();
    const transport = new StdioServerTransport();
    
    // 连接服务器和传输层
    await mcpServer.getServer().connect(transport);
    
    console.error("✅ GitLab MCP 服务器已启动");
  } catch (error) {
    console.error("❌ 服务器启动失败:", error);
    process.exit(1);
  }
}

/**
 * 进程信号处理
 */
function setupSignalHandlers(): void {
  process.on('SIGINT', () => {
    console.error('收到 SIGINT 信号，正在关闭服务器...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.error('收到 SIGTERM 信号，正在关闭服务器...');
    process.exit(0);
  });

  process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的 Promise 拒绝:', reason, 'at:', promise);
    process.exit(1);
  });
}

// 设置信号处理器
setupSignalHandlers();

// 启动服务器
main().catch((error) => {
  console.error('❌ 服务器启动失败:', error);
  process.exit(1);
}); 