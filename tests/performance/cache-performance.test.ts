/**
 * 缓存性能测试
 * 
 * 测试缓存命中率和性能提升
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { MemoryCacheProvider } from '../../src-v2/cache/MemoryCacheProvider.js';
import { CacheRepository } from '../../src-v2/repositories/CacheRepository.js';
import { ConfigManager } from '../../src-v2/config/ConfigManager.js';
import { EnvConfigProvider } from '../../src-v2/config/EnvConfigProvider.js';
import { PinoLogger } from '../../src-v2/logging/PinoLogger.js';
import { GitLabRepository } from '../../src-v2/repositories/GitLabRepository.js';
import { MergeRequestService } from '../../src-v2/services/MergeRequestService.js';
import { config } from 'dotenv';

config();

// 测试项目配置
const TEST_PROJECT_PATH = process.env.TEST_PROJECT_PATH || 'gdesign/meta';
const TEST_MR_IID = parseInt(process.env.TEST_MR_IID || '10821', 10);

/**
 * 测量执行时间
 */
async function measureTime(fn: () => Promise<void>): Promise<number> {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
}

describe('缓存性能测试', () => {
  let cacheProvider: MemoryCacheProvider;
  let cacheRepo: CacheRepository;
  let mrService: MergeRequestService;
  let logger: PinoLogger;

  beforeAll(() => {
    cacheProvider = new MemoryCacheProvider({ defaultTtl: 300 });
    cacheRepo = new CacheRepository(cacheProvider);
    logger = new PinoLogger({ level: 'warn' });

    const configProvider = new EnvConfigProvider();
    const configManager = new ConfigManager(configProvider);
    const gitlabConfig = configManager.getGitLabConfig();
    const gitlabRepo = new GitLabRepository(gitlabConfig, logger);
    mrService = new MergeRequestService(gitlabRepo, cacheRepo, logger);
  });

  describe('缓存命中率', () => {
    it('应该能够缓存数据并提高命中率', async () => {
      if (!process.env.GITLAB_TOKEN) {
        return; // 跳过实际 API 调用
      }

      // 第一次调用（缓存未命中）
      const firstCallTime = await measureTime(async () => {
        await mrService.getMergeRequest(TEST_PROJECT_PATH, TEST_MR_IID);
      });

      // 第二次调用（应该命中缓存）
      const secondCallTime = await measureTime(async () => {
        await mrService.getMergeRequest(TEST_PROJECT_PATH, TEST_MR_IID);
      });

      console.log('缓存性能对比:', {
        firstCall: `${firstCallTime.toFixed(2)}ms (缓存未命中)`,
        secondCall: `${secondCallTime.toFixed(2)}ms (缓存命中)`,
        speedup: `${(firstCallTime / secondCallTime).toFixed(2)}x`,
      });

      // 验证缓存命中后速度更快
      expect(secondCallTime).toBeLessThan(firstCallTime);
      expect(firstCallTime / secondCallTime).toBeGreaterThan(1.5); // 至少快 1.5 倍
    });
  });

  describe('缓存策略', () => {
    it('应该正确设置 TTL', async () => {
      const key = 'test-key';
      const value = { test: 'data' };

      await cacheRepo.set(key, value, 60); // 60 秒 TTL

      const exists = await cacheRepo.exists(key);
      expect(exists).toBe(true);

      const ttl = await cacheRepo.getTtl(key);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60);
    });

    it('应该在 TTL 过期后清除缓存', async () => {
      const key = 'test-key-expire';
      const value = { test: 'data' };

      await cacheRepo.set(key, value, 1); // 1 秒 TTL

      // 等待过期
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const exists = await cacheRepo.exists(key);
      expect(exists).toBe(false);
    });
  });

  describe('缓存性能提升', () => {
    it('应该显著提升重复请求的性能', async () => {
      if (!process.env.GITLAB_TOKEN) {
        return; // 跳过实际 API 调用
      }

      const iterations = 10;
      let totalTimeWithoutCache = 0;
      let totalTimeWithCache = 0;

      // 不使用缓存的测试（每次清空缓存）
      for (let i = 0; i < iterations; i++) {
        await cacheRepo.clear();
        const time = await measureTime(async () => {
          await mrService.getMergeRequest(TEST_PROJECT_PATH, TEST_MR_IID);
        });
        totalTimeWithoutCache += time;
      }

      // 使用缓存的测试（第一次后都命中缓存）
      await cacheRepo.clear();
      for (let i = 0; i < iterations; i++) {
        const time = await measureTime(async () => {
          await mrService.getMergeRequest(TEST_PROJECT_PATH, TEST_MR_IID);
        });
        totalTimeWithCache += time;
      }

      const avgWithoutCache = totalTimeWithoutCache / iterations;
      const avgWithCache = totalTimeWithCache / iterations;
      const speedup = avgWithoutCache / avgWithCache;

      console.log('缓存性能提升:', {
        avgWithoutCache: `${avgWithoutCache.toFixed(2)}ms`,
        avgWithCache: `${avgWithCache.toFixed(2)}ms`,
        speedup: `${speedup.toFixed(2)}x`,
      });

      // 验证缓存显著提升性能
      expect(speedup).toBeGreaterThan(2); // 至少快 2 倍
    });
  });
});
