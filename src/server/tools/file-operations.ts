import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { GitLabClient } from "../../gitlab/client";

/**
 * 注册文件操作相关的工具
 */
export function registerFileOperationTools(server: McpServer, gitlabClient: GitLabClient): void {
  // 获取文件内容
  server.tool(
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
} 