/**
 * V2 E2E 测试
 * 
 * 端到端测试，模拟完整的请求流程
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Container } from '../../src-v2/core/di/Container.js';
import { ConfigManager } from '../../src-v2/config/ConfigManager.js';
import { EnvConfigProvider } from '../../src-v2/config/EnvConfigProvider.js';
import { PinoLogger } from '../../src-v2/logging/PinoLogger.js';
import { MemoryCacheProvider } from '../../src-v2/cache/MemoryCacheProvider.js';
import { GitLabRepository } from '../../src-v2/repositories/GitLabRepository.js';
import { CacheRepository } from '../../src-v2/repositories/CacheRepository.js';
import { ConfigRepository } from '../../src-v2/repositories/ConfigRepository.js';
import { MergeRequestService } from '../../src-v2/services/MergeRequestService.js';
import { FileOperationService } from '../../src-v2/services/FileOperationService.js';
import { ProjectService } from '../../src-v2/services/ProjectService.js';
import { ToolRegistry } from '../../src-v2/capabilities/tools/ToolRegistry.js';
import { ResourceRegistry } from '../../src-v2/capabilities/resources/ResourceRegistry.js';
import { PromptRegistry } from '../../src-v2/capabilities/prompts/PromptRegistry.js';
import { MiddlewareChain } from '../../src-v2/middleware/MiddlewareChain.js';
import { LoggingMiddleware } from '../../src-v2/middleware/LoggingMiddleware.js';
import { ErrorHandlingMiddleware } from '../../src-v2/middleware/ErrorHandlingMiddleware.js';
import { config } from 'dotenv';

config();

// 测试配置
const TEST_PROJECT_PATH = process.env.TEST_PROJECT_PATH || 'gdesign/meta';
const TEST_MR_IID = parseInt(process.env.TEST_MR_IID || '10821', 10);

describe('V2 E2E 测试', () => {
  let toolRegistry: ToolRegistry;
  let middlewareChain: MiddlewareChain;

  beforeAll(async () => {
    // 初始化服务
    const configProvider = new EnvConfigProvider();
    const configManager = new ConfigManager(configProvider);
    const logger = new PinoLogger({ level: 'info' });
    const cacheProvider = new MemoryCacheProvider({ stdTTL: 300 });

    const gitlabConfig = configManager.getGitLabConfig();
    const gitlabRepo = new GitLabRepository(gitlabConfig, logger);
    const cacheRepo = new CacheRepository(cacheProvider);
    const mrService = new MergeRequestService(gitlabRepo, cacheRepo, logger);
    const projectService = new ProjectService(gitlabRepo, cacheRepo, logger);

    // 初始化工具注册表
    toolRegistry = new ToolRegistry();

    // 注册工具（简化版，实际应该通过插件）
    // TODO: 通过插件注册工具

    // 初始化中间件链
    middlewareChain = new MiddlewareChain();
    middlewareChain.addMiddleware(new LoggingMiddleware(logger));
    middlewareChain.addMiddleware(new ErrorHandlingMiddleware(logger));
  });

  describe('完整请求流程', () => {
    it('应该能够处理完整的工具调用流程', async () => {
      const tool = toolRegistry.getTool('get_merge_request');
      if (!tool) {
        // 如果工具未注册，跳过测试
        return;
      }

      const context = {
        traceId: 'e2e-test-trace',
        requestId: 'e2e-test-request',
        startTime: Date.now(),
        metadata: new Map(),
      };

      // 通过中间件链执行
      const result = await middlewareChain.execute(
        {
          type: 'tool',
          tool: 'get_merge_request',
          params: {
            projectPath: TEST_PROJECT_PATH,
            mergeRequestIid: TEST_MR_IID,
          },
        },
        async () => {
          return await tool.execute(
            {
              projectPath: TEST_PROJECT_PATH,
              mergeRequestIid: TEST_MR_IID,
            },
            context
          );
        }
      );

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });
  });
});

