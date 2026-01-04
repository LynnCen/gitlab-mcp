/**
 * 基线集成测试
 * 
 * 这些测试作为功能基准，确保重构后所有工具功能保持一致。
 * 测试结果将用于对比重构后的版本。
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { GitLabMcpServer } from '../../src/server/mcp-server/index.js';
import { GitLabConfig } from '../../src/config/types.js';
import { config } from 'dotenv';

config();

// 测试配置（从环境变量读取）
const TEST_CONFIG: GitLabConfig = {
  host: process.env.GITLAB_HOST || 'https://gitlab.com',
  token: process.env.GITLAB_TOKEN || '',
  timeout: 30000,
  retries: 3,
};

// 测试项目配置（需要根据实际情况修改）
const TEST_PROJECT_PATH = process.env.TEST_PROJECT_PATH || 'gdesign/meta';
const TEST_MR_IID = parseInt(process.env.TEST_MR_IID || '10821', 10);
const TEST_FILE_PATH = process.env.TEST_FILE_PATH || 'README.md';

describe('基线集成测试 - GitLab MCP Server v1.1.0', () => {
  let server: GitLabMcpServer;
  let mcpServer: any;

  beforeAll(async () => {
    server = new GitLabMcpServer(TEST_CONFIG);
    await server.initialize();
    mcpServer = server.getServer();
  });

  describe('连接测试', () => {
    it('应该成功连接到 GitLab', async () => {
      const client = server.getGitLabClient();
      const result = await client.testConnection();
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.username).toBeDefined();
    });
  });

  describe('合并请求工具', () => {
    it('get_merge_request - 应该成功获取 MR 信息', async () => {
      const result = await mcpServer.callTool('get_merge_request', {
        projectPath: TEST_PROJECT_PATH,
        mergeRequestIid: TEST_MR_IID,
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      
      const data = JSON.parse(result.content[0].text);
      expect(data.id).toBeDefined();
      expect(data.iid).toBe(TEST_MR_IID);
      expect(data.title).toBeDefined();
      expect(data.state).toBeDefined();
    });

    it('get_merge_request_changes - 应该成功获取 MR 变更', async () => {
      const result = await mcpServer.callTool('get_merge_request_changes', {
        projectPath: TEST_PROJECT_PATH,
        mergeRequestIid: TEST_MR_IID,
        includeContent: false,
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      
      const data = JSON.parse(result.content[0].text);
      expect(data.changes).toBeDefined();
      expect(Array.isArray(data.changes)).toBe(true);
      expect(data.summary).toBeDefined();
      expect(data.summary.total_files).toBeGreaterThanOrEqual(0);
    });

    it('list_merge_requests - 应该成功列出 MR', async () => {
      const result = await mcpServer.callTool('list_merge_requests', {
        projectPath: TEST_PROJECT_PATH,
        state: 'opened',
        perPage: 10,
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      
      const data = JSON.parse(result.content[0].text);
      expect(data.total).toBeGreaterThanOrEqual(0);
      expect(data.merge_requests).toBeDefined();
      expect(Array.isArray(data.merge_requests)).toBe(true);
    });
  });

  describe('文件操作工具', () => {
    it('get_file_content - 应该成功获取文件内容', async () => {
      const result = await mcpServer.callTool('get_file_content', {
        projectPath: TEST_PROJECT_PATH,
        filePath: TEST_FILE_PATH,
        ref: 'main',
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      
      const data = JSON.parse(result.content[0].text);
      expect(data.file_path).toBe(TEST_FILE_PATH);
      expect(data.content).toBeDefined();
    });
  });

  describe('代码审查工具', () => {
    it('get_file_code_review_rules - 应该成功获取审查规则', async () => {
      const result = await mcpServer.callTool('get_file_code_review_rules', {
        filePath: 'src/index.ts',
        fileExtension: '.ts',
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      
      const data = JSON.parse(result.content[0].text);
      expect(data.file_path).toBeDefined();
      expect(data.rules).toBeDefined();
    });

    it('analyze_mr_changes - 应该成功分析 MR 变更', async () => {
      const result = await mcpServer.callTool('analyze_mr_changes', {
        projectPath: TEST_PROJECT_PATH,
        mergeRequestIid: TEST_MR_IID,
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      
      const data = JSON.parse(result.content[0].text);
      expect(data.merge_request).toBeDefined();
      expect(data.analysis_summary).toBeDefined();
      expect(data.file_analysis).toBeDefined();
    });

    it('filter_reviewable_files - 应该成功过滤可审查文件', async () => {
      const result = await mcpServer.callTool('filter_reviewable_files', {
        projectPath: TEST_PROJECT_PATH,
        mergeRequestIid: TEST_MR_IID,
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      
      const data = JSON.parse(result.content[0].text);
      expect(data.total_files).toBeGreaterThanOrEqual(0);
      expect(data.reviewable_files).toBeGreaterThanOrEqual(0);
    });
  });

  describe('工具列表', () => {
    it('应该注册所有预期的工具', async () => {
      const tools = await mcpServer.listTools();
      
      const expectedTools = [
        'get_merge_request',
        'get_merge_request_changes',
        'list_merge_requests',
        'update_merge_request_description',
        'get_file_content',
        'get_file_code_review_rules',
        'analyze_mr_changes',
        'push_code_review_comments',
        'filter_reviewable_files',
      ];

      const toolNames = tools.tools.map((t: any) => t.name);
      
      for (const expectedTool of expectedTools) {
        expect(toolNames).toContain(expectedTool);
      }
    });
  });
});

