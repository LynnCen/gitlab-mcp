#!/usr/bin/env node

/**
 * GitLab MCP Server v2.0
 * 主入口文件
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MCPServer } from './core/server/MCPServer.js';
import { ToolRegistry } from './capabilities/tools/ToolRegistry.js';
import { ResourceRegistry } from './capabilities/resources/ResourceRegistry.js';
import { PromptRegistry } from './capabilities/prompts/PromptRegistry.js';
import { ConfigManager } from './config/ConfigManager.js';
import { PinoLogger } from './logging/PinoLogger.js';
import { GitLabRepository } from './repositories/GitLabRepository.js';
import { CacheRepository } from './repositories/CacheRepository.js';
import { MergeRequestService } from './services/MergeRequestService.js';
import { FileOperationService } from './services/FileOperationService.js';
import { CodeReviewService } from './services/CodeReviewService.js';
import { ProjectService } from './services/ProjectService.js';
import { MemoryCacheProvider } from './cache/MemoryCacheProvider.js';
import { registerAllTools, registerAllResources, registerAllPrompts, type ServiceDependencies } from './bootstrap/registerTools.js';
import type { LogLevel } from './logging/types.js';

/**
 * 初始化所有服务
 */
function initializeServices(): { logger: PinoLogger; services: ServiceDependencies } {
  // 1. 初始化配置
  const configManager = new ConfigManager();
  const config = configManager.getConfig();
  const gitlabConfig = config.gitlab;

  // 2. 初始化日志
  const logLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;
  const logger = new PinoLogger({
    level: logLevel,
  });

  // 3. 初始化缓存
  const cacheProvider = new MemoryCacheProvider({
    defaultTtl: 300, // 5分钟
    checkPeriod: 60,  // 1分钟检查一次
  });
  const cacheRepository = new CacheRepository(cacheProvider);

  // 4. 初始化 GitLab Repository
  const gitlabRepository = new GitLabRepository(gitlabConfig, logger);

  // 5. 初始化服务层
  const mrService = new MergeRequestService(gitlabRepository, cacheRepository, logger);
  const projectService = new ProjectService(gitlabRepository, cacheRepository, logger);
  const fileService = new FileOperationService(gitlabRepository, cacheRepository, mrService, logger);
  const codeReviewService = new CodeReviewService(gitlabRepository, mrService, logger);

  return {
    logger,
    services: {
      mrService,
      fileService,
      codeReviewService,
      projectService,
    },
  };
}

/**
 * 主函数
 */
async function main() {
  try {
    console.error('🚀 启动 GitLab MCP Server v2.0...');

    // 1. 初始化所有服务
    const { logger, services } = initializeServices();
    logger.info('Services initialized');

    // 2. 创建注册表
    const toolRegistry = new ToolRegistry();
    const resourceRegistry = new ResourceRegistry();
    const promptRegistry = new PromptRegistry();

    // 3. 注册所有能力
    registerAllTools(toolRegistry, services);
    registerAllResources(resourceRegistry, services);
    registerAllPrompts(promptRegistry, services);

    const stats = {
      tools: toolRegistry.getToolCount(),
      resources: resourceRegistry.getResourceCount(),
      prompts: promptRegistry.getPromptCount(),
    };
    logger.info('Capabilities registered', stats);

    // 4. 创建 MCP Server
    const mcpServer = new MCPServer(
      {
        name: 'gitlab-mcp',
        version: '2.0.0',
        logger,
      },
      toolRegistry,
      resourceRegistry,
      promptRegistry
    );
    logger.info('MCP Server created');

    // 5. 连接传输层
    const transport = new StdioServerTransport();
    await mcpServer.getServer().connect(transport);

    logger.info('GitLab MCP Server v2.0 started successfully', stats);
    console.error('✅ GitLab MCP Server v2.0 已启动');
    console.error(`📊 已注册: ${stats.tools} 工具, ${stats.resources} 资源, ${stats.prompts} 提示`);
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
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

  process.on('unhandledRejection', (reason) => {
    console.error('未处理的 Promise 拒绝:', reason);
    process.exit(1);
  });
}

// 设置信号处理器
setupSignalHandlers();

// 启动服务器
main();
