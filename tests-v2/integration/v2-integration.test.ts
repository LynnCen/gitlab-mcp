/**
 * V2 集成测试
 * 
 * 测试 v2 架构的集成功能
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
import { PluginRegistry } from '../../src-v2/core/plugin/PluginRegistry.js';
import { GitLabMRPlugin } from '../../src-v2/plugins/gitlab-mr/index.js';
import { GitLabFilePlugin } from '../../src-v2/plugins/gitlab-file/index.js';
import { GitLabCodeReviewPlugin } from '../../src-v2/plugins/gitlab-code-review/index.js';
import { config } from 'dotenv';

config();

// 测试配置
const TEST_PROJECT_PATH = process.env.TEST_PROJECT_PATH || 'gdesign/meta';
const TEST_MR_IID = parseInt(process.env.TEST_MR_IID || '10821', 10);
const TEST_FILE_PATH = process.env.TEST_FILE_PATH || 'README.md';

describe('V2 集成测试', () => {
  let container: Container;
  let toolRegistry: ToolRegistry;
  let resourceRegistry: ResourceRegistry;
  let promptRegistry: PromptRegistry;
  let pluginRegistry: PluginRegistry;

  beforeAll(async () => {
    // 初始化 DI 容器
    container = new Container();

    // 注册核心服务
    const configProvider = new EnvConfigProvider();
    const configManager = new ConfigManager(configProvider);
    const logger = new PinoLogger({ level: 'info' });
    const cacheProvider = new MemoryCacheProvider({ stdTTL: 300 });

    container.registerSingleton('ConfigManager', configManager);
    container.registerSingleton('Logger', logger);
    container.registerSingleton('CacheProvider', cacheProvider);

    // 创建仓储
    const gitlabConfig = configManager.getGitLabConfig();
    const gitlabRepo = new GitLabRepository(gitlabConfig, logger);
    const cacheRepo = new CacheRepository(cacheProvider);
    const configRepo = new ConfigRepository(configManager);

    // 创建服务
    const mrService = new MergeRequestService(gitlabRepo, cacheRepo, logger);
    const fileService = new FileOperationService(
      gitlabRepo,
      cacheRepo,
      mrService,
      logger
    );
    const projectService = new ProjectService(gitlabRepo, cacheRepo, logger);

    // 创建能力注册表
    toolRegistry = new ToolRegistry();
    resourceRegistry = new ResourceRegistry();
    promptRegistry = new PromptRegistry();

    // 初始化插件
    pluginRegistry = new PluginRegistry();

    const mrPlugin = new GitLabMRPlugin();
    await mrPlugin.initialize({
      mrService,
      projectService,
      logger,
      config: configManager.getConfig(),
    });
    mrPlugin.register({
      tools: toolRegistry,
      resources: resourceRegistry,
      prompts: promptRegistry,
    });
    pluginRegistry.register(mrPlugin);

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
    pluginRegistry.register(filePlugin);

    const codeReviewPlugin = new GitLabCodeReviewPlugin();
    // TODO: 需要 CodeReviewService
    // await codeReviewPlugin.initialize({...});
    // pluginRegistry.register(codeReviewPlugin);
  });

  describe('工具注册', () => {
    it('应该注册所有 MR 工具', () => {
      const tools = toolRegistry.listTools({ plugin: 'gitlab-mr' });
      expect(tools.length).toBeGreaterThanOrEqual(4);
      expect(tools.some((t) => t.name === 'get_merge_request')).toBe(true);
      expect(tools.some((t) => t.name === 'get_merge_request_changes')).toBe(
        true
      );
      expect(tools.some((t) => t.name === 'list_merge_requests')).toBe(true);
      expect(
        tools.some((t) => t.name === 'update_merge_request_description')
      ).toBe(true);
    });

    it('应该注册文件工具', () => {
      const tools = toolRegistry.listTools({ plugin: 'gitlab-file' });
      expect(tools.length).toBeGreaterThanOrEqual(1);
      expect(tools.some((t) => t.name === 'get_file_content')).toBe(true);
    });
  });

  describe('资源注册', () => {
    it('应该注册所有资源', () => {
      const resources = resourceRegistry.listResources();
      expect(resources.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('提示注册', () => {
    it('应该注册所有提示', () => {
      const prompts = promptRegistry.listPrompts();
      expect(prompts.length).toBeGreaterThanOrEqual(1);
      expect(prompts.some((p) => p.name === 'mr-description')).toBe(true);
    });
  });

  describe('工具执行', () => {
    it('应该能够执行 get_merge_request 工具', async () => {
      const tool = toolRegistry.getTool('get_merge_request');
      expect(tool).toBeDefined();

      const context = {
        traceId: 'test-trace',
        requestId: 'test-request',
        startTime: Date.now(),
        metadata: new Map(),
      };

      const result = await tool!.execute(
        {
          projectPath: TEST_PROJECT_PATH,
          mergeRequestIid: TEST_MR_IID,
        },
        context
      );

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.id).toBeDefined();
      expect(data.iid).toBe(TEST_MR_IID);
    });
  });
});

