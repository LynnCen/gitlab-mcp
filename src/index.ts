#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { GitLabClient } from "./gitlab/client.js";
import { GitLabConfig } from "./config/types.js";

// 配置架构
const ConfigSchema = z.object({
  host: z.string().url("GitLab主机必须是有效的URL"),
  token: z.string().min(1, "GitLab token不能为空"),
  timeout: z.number().optional().default(30000),
  retries: z.number().optional().default(3)
});

// 从环境变量或命令行参数获取配置
function getConfig(): GitLabConfig {
  const config = {
    host: process.env["GITLAB_HOST"] || "https://gitlab.com",
    token: process.env["GITLAB_TOKEN"] || "",
    timeout: parseInt(process.env["GITLAB_TIMEOUT"] || "30000"),
    retries: parseInt(process.env["GITLAB_RETRIES"] || "3")
  };

  // 验证配置
  const result = ConfigSchema.safeParse(config);
  if (!result.success) {
    console.error("配置错误:");
    result.error.errors.forEach((err: any) => {
      console.error(`  ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }

  return result.data;
}

// 创建MCP服务器
async function createServer(): Promise<McpServer> {
  const config = getConfig();
  const gitlabClient = new GitLabClient(config);

  // 测试GitLab连接
  try {
    const connectionTest = await gitlabClient.testConnection();
    if (!connectionTest.success) {
      throw new Error(`GitLab连接失败: ${connectionTest.error}`);
    }
    console.error(`✅ 已连接到GitLab: ${connectionTest.user?.username} (${connectionTest.user?.name})`);
  } catch (error) {
    console.error("❌ GitLab连接测试失败:", error);
    process.exit(1);
  }

  // 创建MCP服务器
  const server = new McpServer({
    name: "gitlab-mcp",
    version: "1.0.0",
  });

  // 注册工具
  server.registerTool(
    "get_merge_request",
    {
      title: "获取合并请求",
      description: "获取指定项目的合并请求信息",
      inputSchema: {
        projectPath: z.string().describe("项目路径，格式: owner/repo"),
        mergeRequestIid: z.number().describe("合并请求的内部ID")
      }
    },
    async ({ projectPath, mergeRequestIid }) => {
      const project = await gitlabClient.getProject(projectPath);
      const mr = await gitlabClient.getMergeRequest(project.id, mergeRequestIid);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: mr.id,
              iid: mr.iid,
              title: mr.title,
              description: mr.description,
              state: mr.state,
              author: mr.author,
              source_branch: mr.source_branch,
              target_branch: mr.target_branch,
              created_at: mr.created_at,
              updated_at: mr.updated_at,
              web_url: mr.web_url
            }, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "get_merge_request_changes",
    {
      title: "获取合并请求变更",
      description: "获取合并请求的文件变更列表",
      inputSchema: {
        projectPath: z.string().describe("项目路径，格式: owner/repo"),
        mergeRequestIid: z.number().describe("合并请求的内部ID"),
        includeContent: z.boolean().optional().default(false).describe("是否包含文件内容")
      }
    },
    async ({ projectPath, mergeRequestIid, includeContent = false }) => {
      const project = await gitlabClient.getProject(projectPath);
      const changes = await gitlabClient.getMergeRequestChanges(project.id, mergeRequestIid);
      
      const result = {
        changes: changes.changes.map((change: any) => ({
          old_path: change.old_path,
          new_path: change.new_path,
          new_file: change.new_file,
          deleted_file: change.deleted_file,
          renamed_file: change.renamed_file,
          diff: includeContent ? change.diff : undefined
        })),
        summary: {
          total_files: changes.changes.length,
          additions: changes.changes.filter((c: any) => c.new_file).length,
          deletions: changes.changes.filter((c: any) => c.deleted_file).length,
          modifications: changes.changes.filter((c: any) => !c.new_file && !c.deleted_file && !c.renamed_file).length,
          renames: changes.changes.filter((c: any) => c.renamed_file).length
        }
      };
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "get_file_content",
    {
      title: "获取文件内容",
      description: "获取项目文件内容",
      inputSchema: {
        projectPath: z.string().describe("项目路径，格式: owner/repo"),
        filePath: z.string().describe("文件路径"),
        ref: z.string().optional().default("main").describe("分支、标签或commit SHA")
      }
    },
    async ({ projectPath, filePath, ref = "main" }) => {
      const project = await gitlabClient.getProject(projectPath);
      const file = await gitlabClient.getFileContent(project.id, filePath, ref);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              file_path: file.file_path,
              file_name: file.file_name,
              size: file.size,
              encoding: file.encoding,
              content: file.content,
              content_sha256: file.content_sha256,
              ref: file.ref,
              blob_id: file.blob_id,
              commit_id: file.commit_id,
              last_commit_id: file.last_commit_id
            }, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "list_merge_requests",
    {
      title: "列出合并请求",
      description: "列出项目的合并请求",
      inputSchema: {
        projectPath: z.string().describe("项目路径，格式: owner/repo"),
        state: z.enum(["opened", "closed", "merged", "all"]).optional().default("opened").describe("合并请求状态"),
        perPage: z.number().optional().default(20).describe("每页返回的数量")
      }
    },
    async ({ projectPath, state = "opened", perPage = 20 }) => {
      const project = await gitlabClient.getProject(projectPath);
      const mrs = await gitlabClient.getMergeRequests(project.id, {
        state,
        per_page: perPage
      });
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              total: mrs.length,
              merge_requests: mrs.map((mr: any) => ({
                id: mr.id,
                iid: mr.iid,
                title: mr.title,
                state: mr.state,
                author: mr.author,
                source_branch: mr.source_branch,
                target_branch: mr.target_branch,
                created_at: mr.created_at,
                updated_at: mr.updated_at,
                web_url: mr.web_url
              }))
            }, null, 2)
          }
        ]
      };
    }
  );

  return server;
}

// 主函数
async function main() {
  const server = await createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("GitLab MCP服务器已启动");
}

// 错误处理
process.on('SIGINT', async () => {
  process.exit(0);
});

process.on('SIGTERM', async () => {
  process.exit(0);
});

main().catch((error) => {
  console.error('启动失败:', error);
  process.exit(1);
}); 