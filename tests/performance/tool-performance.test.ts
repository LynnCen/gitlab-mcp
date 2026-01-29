/**
 * 工具性能测试
 * 
 * 测试每个工具的响应时间（P50, P95, P99）
 * 压力测试（100+ 并发）
 * 内存泄漏测试
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ConfigManager } from '../../src-v2/config/ConfigManager.js';
import { EnvConfigProvider } from '../../src-v2/config/EnvConfigProvider.js';
import { PinoLogger } from '../../src-v2/logging/PinoLogger.js';
import { MemoryCacheProvider } from '../../src-v2/cache/MemoryCacheProvider.js';
import { GitLabRepository } from '../../src-v2/repositories/GitLabRepository.js';
import { CacheRepository } from '../../src-v2/repositories/CacheRepository.js';
import { MergeRequestService } from '../../src-v2/services/MergeRequestService.js';
import { FileOperationService } from '../../src-v2/services/FileOperationService.js';
import { ProjectService } from '../../src-v2/services/ProjectService.js';
import { ToolRegistry } from '../../src-v2/capabilities/tools/ToolRegistry.js';
import { GitLabMRPlugin } from '../../src-v2/plugins/gitlab-mr/index.js';
import { GitLabFilePlugin } from '../../src-v2/plugins/gitlab-file/index.js';
import { config } from 'dotenv';

config();

// 性能测试配置
const PERFORMANCE_CONFIG = {
  iterations: 10, // 每次测试的迭代次数
  concurrency: 100, // 并发数
  timeout: 30000, // 超时时间（毫秒）
};

// 测试项目配置（从环境变量读取）
const TEST_PROJECT_PATH = process.env.TEST_PROJECT_PATH || 'gdesign/meta';
const TEST_MR_IID = parseInt(process.env.TEST_MR_IID || '10821', 10);
const TEST_FILE_PATH = process.env.TEST_FILE_PATH || 'README.md';

/**
 * 计算百分位数
 */
function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * 计算平均值
 */
function average(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * 测量工具执行时间
 */
async function measureToolExecution(
  toolName: string,
  params: Record<string, unknown>,
  toolRegistry: ToolRegistry,
  iterations: number = 10
): Promise<{
  times: number[];
  average: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}> {
  const tool = toolRegistry.getTool(toolName);
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found`);
  }

  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const context = {
      traceId: `perf-test-${i}`,
      requestId: `perf-request-${i}`,
      startTime: Date.now(),
      metadata: new Map(),
    };

    try {
      await tool.execute(params, context);
      const end = performance.now();
      times.push(end - start);
    } catch (error) {
      // 记录错误但不中断测试
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Tool execution failed: ${errorMessage}`);
    }
  }

  return {
    times,
    average: average(times),
    p50: percentile(times, 50),
    p95: percentile(times, 95),
    p99: percentile(times, 99),
    min: Math.min(...times),
    max: Math.max(...times),
  };
}

/**
 * 并发压力测试
 */
async function stressTest(
  toolName: string,
  params: Record<string, unknown>,
  toolRegistry: ToolRegistry,
  concurrency: number
): Promise<{
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  successRate: number;
}> {
  const tool = toolRegistry.getTool(toolName);
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found`);
  }

  let successCount = 0;
  let errorCount = 0;
  const responseTimes: number[] = [];

  const promises = Array.from({ length: concurrency }, async (_, i) => {
    const start = performance.now();
    const context = {
      traceId: `stress-test-${i}`,
      requestId: `stress-request-${i}`,
      startTime: Date.now(),
      metadata: new Map(),
    };

    try {
      await tool.execute(params, context);
      const end = performance.now();
      responseTimes.push(end - start);
      successCount++;
    } catch (error) {
      errorCount++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Stress test error: ${errorMessage}`);
    }
  });

  await Promise.all(promises);

  return {
    successCount,
    errorCount,
    averageResponseTime: average(responseTimes),
    successRate: successCount / concurrency,
  };
}

describe('工具性能测试', () => {
  let toolRegistry: ToolRegistry;
  let configManager: ConfigManager;
  let logger: PinoLogger;

  beforeAll(async () => {
    // 初始化服务
    const configProvider = new EnvConfigProvider();
    configManager = new ConfigManager(configProvider);
    logger = new PinoLogger({ level: 'warn' }); // 性能测试时降低日志级别
    const cacheProvider = new MemoryCacheProvider({ defaultTtl: 300 });

    const gitlabConfig = configManager.getGitLabConfig();
    const gitlabRepo = new GitLabRepository(gitlabConfig, logger);
    const cacheRepo = new CacheRepository(cacheProvider);
    const mrService = new MergeRequestService(gitlabRepo, cacheRepo, logger);
    const fileService = new FileOperationService(
      gitlabRepo,
      cacheRepo,
      mrService,
      logger
    );
    const projectService = new ProjectService(gitlabRepo, cacheRepo, logger);

    // 初始化工具注册表
    toolRegistry = new ToolRegistry();

    // 注册插件
    const mrPlugin = new GitLabMRPlugin();
    await mrPlugin.initialize({
      mrService,
      projectService,
      logger,
      config: configManager.getConfig(),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resourceRegistry = {} as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promptRegistry = {} as any;

    mrPlugin.register({
      tools: toolRegistry,
      resources: resourceRegistry,
      prompts: promptRegistry,
    });

    const filePlugin = new GitLabFilePlugin();
    await filePlugin.initialize({
      fileService,
      logger,
      config: configManager.getConfig(),
    });
    filePlugin.register({
      tools: toolRegistry,
      resources: resourceRegistry,
      prompts: promptRegistry,
    });
  });

  describe('响应时间测试', () => {
    it('get_merge_request - 应该测量响应时间', async () => {
      if (!process.env.GITLAB_TOKEN) {
        return; // 跳过实际 API 调用
      }

      const result = await measureToolExecution(
        'get_merge_request',
        {
          projectPath: TEST_PROJECT_PATH,
          mergeRequestIid: TEST_MR_IID,
        },
        toolRegistry,
        PERFORMANCE_CONFIG.iterations
      );

      const metrics = {
        average: `${result.average.toFixed(2)}ms`,
        p50: `${result.p50.toFixed(2)}ms`,
        p95: `${result.p95.toFixed(2)}ms`,
        p99: `${result.p99.toFixed(2)}ms`,
        min: `${result.min.toFixed(2)}ms`,
        max: `${result.max.toFixed(2)}ms`,
      };
      console.log('get_merge_request 性能指标:', metrics);

      // 验证性能指标
      expect(result.average).toBeGreaterThan(0);
      expect(result.p95).toBeGreaterThanOrEqual(result.p50);
      expect(result.p99).toBeGreaterThanOrEqual(result.p95);
    });

    it('get_file_content - 应该测量响应时间', async () => {
      if (!process.env.GITLAB_TOKEN) {
        return; // 跳过实际 API 调用
      }

      const result = await measureToolExecution(
        'get_file_content',
        {
          projectPath: TEST_PROJECT_PATH,
          filePath: TEST_FILE_PATH,
          ref: 'main',
        },
        toolRegistry,
        PERFORMANCE_CONFIG.iterations
      );

      const metrics = {
        average: `${result.average.toFixed(2)}ms`,
        p50: `${result.p50.toFixed(2)}ms`,
        p95: `${result.p95.toFixed(2)}ms`,
        p99: `${result.p99.toFixed(2)}ms`,
      };
      console.log('get_file_content 性能指标:', metrics);

      expect(result.average).toBeGreaterThan(0);
    });
  });

  describe('压力测试', () => {
    it('应该能够处理高并发请求', async () => {
      if (!process.env.GITLAB_TOKEN) {
        return; // 跳过实际 API 调用
      }

      const result = await stressTest(
        'get_merge_request',
        {
          projectPath: TEST_PROJECT_PATH,
          mergeRequestIid: TEST_MR_IID,
        },
        toolRegistry,
        PERFORMANCE_CONFIG.concurrency
      );

      const stressMetrics = {
        successCount: result.successCount,
        errorCount: result.errorCount,
        successRate: `${(result.successRate * 100).toFixed(2)}%`,
        averageResponseTime: `${result.averageResponseTime.toFixed(2)}ms`,
      };
      console.log('压力测试结果:', stressMetrics);

      // 验证成功率（允许一定失败率）
      expect(result.successRate).toBeGreaterThan(0.8); // 至少 80% 成功率
    });
  });

  describe('内存泄漏测试', () => {
    it('应该不会出现内存泄漏', async () => {
      if (!process.env.GITLAB_TOKEN) {
        return; // 跳过实际 API 调用
      }

      // 记录初始内存使用
      const initialMemory = process.memoryUsage().heapUsed;

      // 执行多次操作
      for (let i = 0; i < 100; i++) {
        const tool = toolRegistry.getTool('get_merge_request');
        if (tool) {
          const context = {
            traceId: `memory-test-${i}`,
            requestId: `memory-request-${i}`,
            startTime: Date.now(),
            metadata: new Map<string, unknown>(),
          };

          try {
            await tool.execute(
              {
                projectPath: TEST_PROJECT_PATH,
                mergeRequestIid: TEST_MR_IID,
              },
              context
            );
          } catch (_error) {
            // 忽略错误
          }
        }
      }

      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }

      // 等待一段时间让内存稳定
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      const memoryMetrics = {
        initial: `${(initialMemory / 1024 / 1024).toFixed(2)}MB`,
        final: `${(finalMemory / 1024 / 1024).toFixed(2)}MB`,
        increase: `${memoryIncreaseMB.toFixed(2)}MB`,
      };
      console.log('内存使用情况:', memoryMetrics);

      // 验证内存增长不超过 50MB（允许一定增长）
      expect(memoryIncreaseMB).toBeLessThan(50);
    });
  });
});
