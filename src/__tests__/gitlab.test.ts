import { GitLabPlugin } from '../plugins/gitlab.js';
import { Config, PluginContext } from '../types/index.js';
import { ConsoleLogger } from '../core/logger.js';

// 创建模拟的上下文
function createMockContext(): PluginContext {
  const mockConfig: Config = {
    gitlab: {
      host: 'https://gitlab.com',
      token: 'test-token',
    },
    server: {
      name: 'test-server',
      version: '1.0.0',
      logLevel: 'info',
    },
    plugins: {
      gitlab: true,
    },
    cache: {
      enabled: false,
      ttl: 300,
    },
  };

  return {
    config: mockConfig,
    logger: new ConsoleLogger('info'),
  };
}

describe('GitLabPlugin', () => {
  let plugin: GitLabPlugin;
  let mockContext: PluginContext;

  beforeEach(() => {
    mockContext = createMockContext();
    plugin = new GitLabPlugin(mockContext);
  });

  describe('Plugin Manifest', () => {
    it('should return correct plugin manifest', () => {
      const manifest = plugin.getManifest();
      
      expect(manifest.name).toBe('gitlab');
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.description).toContain('GitLab MCP插件');
      expect(manifest.capabilities.tools).toBe(true);
      expect(manifest.capabilities.resources).toBe(true);
      expect(manifest.capabilities.prompts).toBe(true);
    });
  });

  describe('Tools', () => {
    it('should return all available tools', () => {
      const tools = plugin.getTools();
      
      expect(tools).toHaveLength(7);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('gitlab_get_mr_info');
      expect(toolNames).toContain('gitlab_get_mr_changes');
      expect(toolNames).toContain('gitlab_generate_mr_description');
      expect(toolNames).toContain('gitlab_list_project_mrs');
      expect(toolNames).toContain('gitlab_get_project_info');
      expect(toolNames).toContain('gitlab_list_branches');
      expect(toolNames).toContain('gitlab_get_file_content');
    });

    it('should have proper input schema for gitlab_get_mr_info', () => {
      const tools = plugin.getTools();
      const mrInfoTool = tools.find(tool => tool.name === 'gitlab_get_mr_info');
      
      expect(mrInfoTool).toBeDefined();
      expect(mrInfoTool?.inputSchema.type).toBe('object');
      expect(mrInfoTool?.inputSchema.required).toEqual(['projectPath', 'mrIid']);
      expect(mrInfoTool?.inputSchema.properties['projectPath'].type).toBe('string');
      expect(mrInfoTool?.inputSchema.properties['mrIid'].type).toBe('number');
    });
  });

  describe('Resources', () => {
    it('should return all available resources', () => {
      const resources = plugin.getResources();
      
      expect(resources).toHaveLength(3);
      
      const resourceUris = resources.map(resource => resource.uri);
      expect(resourceUris).toContain('gitlab://mr/{projectPath}/{mrIid}');
      expect(resourceUris).toContain('gitlab://mr/{projectPath}/{mrIid}/changes');
      expect(resourceUris).toContain('gitlab://project/{projectPath}');
    });
  });

  describe('Prompts', () => {
    it('should return all available prompts', () => {
      const prompts = plugin.getPrompts();
      
      expect(prompts).toHaveLength(2);
      
      const promptNames = prompts.map(prompt => prompt.name);
      expect(promptNames).toContain('gitlab_analyze_mr_changes');
      expect(promptNames).toContain('gitlab_review_mr_checklist');
    });
  });

  describe('Tool Call Handling', () => {
    it('should throw error for unknown tool', async () => {
      await expect(
        plugin.handleToolCall('unknown_tool', {})
      ).rejects.toThrow('未知的工具: unknown_tool');
    });
  });

  describe('Resource Reading', () => {
    it('should throw error for unsupported resource URI', async () => {
      await expect(
        plugin.handleResourceRead('invalid://resource')
      ).rejects.toThrow('不支持的资源URI');
    });
  });

  describe('Prompt Handling', () => {
    it('should throw error for unknown prompt', async () => {
      await expect(
        plugin.handlePromptGet('unknown_prompt', {})
      ).rejects.toThrow('未知的提示: unknown_prompt');
    });

    it('should throw error for missing required parameters', async () => {
      await expect(
        plugin.handlePromptGet('gitlab_analyze_mr_changes', {})
      ).rejects.toThrow('缺少必要参数');
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should destroy without errors', async () => {
      await expect(plugin.destroy()).resolves.not.toThrow();
    });
  });
}); 