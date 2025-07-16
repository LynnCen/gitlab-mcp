import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GitLabClient } from "../../gitlab/client";

/**
 * 注册合并请求相关的工具
 */
export function registerMergeRequestTools(server: McpServer, gitlabClient: GitLabClient): void {
  // 获取合并请求信息
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

  // 获取合并请求变更
  server.tool(
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

  // 列出合并请求
  server.tool(
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
        state: state as 'opened' | 'closed' | 'locked' | 'merged',
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

  // 更新合并请求描述
  server.tool(
    "update_merge_request_description",
    {
      title: "更新合并请求描述",
      description: "更新指定合并请求的描述信息，支持Markdown格式",
      inputSchema: {
        projectPath: z.string().describe("项目路径，格式: owner/repo"),
        mergeRequestIid: z.number().describe("合并请求的内部ID"),
        description: z.string().describe("新的描述内容，支持Markdown格式")
      }
    },
    async ({ projectPath, mergeRequestIid, description }) => {
      const project = await gitlabClient.getProject(projectPath);
      const updatedMr = await gitlabClient.updateMergeRequestDescription(project.id, mergeRequestIid, description);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "合并请求描述更新成功",
              merge_request: {
                id: updatedMr.id,
                iid: updatedMr.iid,
                title: updatedMr.title,
                description: updatedMr.description,
                state: updatedMr.state,
                author: updatedMr.author,
                source_branch: updatedMr.source_branch,
                target_branch: updatedMr.target_branch,
                created_at: updatedMr.created_at,
                updated_at: updatedMr.updated_at,
                web_url: updatedMr.web_url,
                description_length: updatedMr.description ? updatedMr.description.length : 0
              }
            }, null, 2)
          }
        ]
      };
    }
  );
} 