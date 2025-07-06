#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { GitLabService } from './gitlab-service.js';

const server = new Server(
  {
    name: 'gitlab-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// 初始化GitLab服务
const gitlabService = new GitLabService();

// 定义工具
const tools = [
  {
    name: 'get_mr_info',
    description: '获取指定MR的基本信息',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: '项目路径，格式如: owner/repo',
        },
        mrIid: {
          type: 'number',
          description: 'MR的内部ID',
        },
      },
      required: ['projectPath', 'mrIid'],
    },
  },
  {
    name: 'get_mr_changes',
    description: '获取指定MR的变更详情',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: '项目路径，格式如: owner/repo',
        },
        mrIid: {
          type: 'number',
          description: 'MR的内部ID',
        },
      },
      required: ['projectPath', 'mrIid'],
    },
  },
  {
    name: 'generate_mr_description',
    description: '生成MR的详细描述markdown',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: '项目路径，格式如: owner/repo',
        },
        mrIid: {
          type: 'number',
          description: 'MR的内部ID',
        },
        includeFiles: {
          type: 'boolean',
          description: '是否包含文件变更列表',
          default: true,
        },
        includeDiffs: {
          type: 'boolean',
          description: '是否包含代码差异',
          default: false,
        },
      },
      required: ['projectPath', 'mrIid'],
    },
  },
  {
    name: 'list_project_mrs',
    description: '列出项目的MR列表',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: '项目路径，格式如: owner/repo',
        },
        state: {
          type: 'string',
          description: 'MR状态',
          enum: ['opened', 'closed', 'merged', 'all'],
          default: 'opened',
        },
        limit: {
          type: 'number',
          description: '返回的MR数量限制',
          default: 10,
        },
      },
      required: ['projectPath'],
    },
  },
];

// 定义资源
const resources = [
  {
    uri: 'gitlab://mr/{projectPath}/{mrIid}',
    name: 'GitLab MR资源',
    description: '访问指定的GitLab MR信息',
    mimeType: 'application/json',
  },
  {
    uri: 'gitlab://mr/{projectPath}/{mrIid}/changes',
    name: 'GitLab MR变更资源',
    description: '访问指定的GitLab MR变更详情',
    mimeType: 'application/json',
  },
];

// 定义提示模板
const prompts = [
  {
    name: 'analyze_mr_changes',
    description: '分析MR变更并生成描述',
    arguments: [
      {
        name: 'projectPath',
        description: '项目路径',
        required: true,
      },
      {
        name: 'mrIid',
        description: 'MR ID',
        required: true,
      },
    ],
  },
];

// 处理工具列表请求
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools,
  };
});

// 处理工具调用请求
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'get_mr_info':
        const mrInfo = await gitlabService.getMRInfo(args.projectPath, args.mrIid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(mrInfo, null, 2),
            },
          ],
        };

      case 'get_mr_changes':
        const changes = await gitlabService.getMRChanges(args.projectPath, args.mrIid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(changes, null, 2),
            },
          ],
        };

      case 'generate_mr_description':
        const description = await gitlabService.generateMRDescription(
          args.projectPath,
          args.mrIid,
          {
            includeFiles: args.includeFiles,
            includeDiffs: args.includeDiffs,
          }
        );
        return {
          content: [
            {
              type: 'text',
              text: description,
            },
          ],
        };

      case 'list_project_mrs':
        const mrs = await gitlabService.listProjectMRs(
          args.projectPath,
          args.state,
          args.limit
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(mrs, null, 2),
            },
          ],
        };

      default:
        throw new Error(`未知的工具: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `错误: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// 处理资源列表请求
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: resources,
  };
});

// 处理资源读取请求
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  try {
    const { uri } = request.params;
    const uriParts = uri.split('/');
    
    if (uriParts[0] !== 'gitlab:' || uriParts[1] !== '') {
      throw new Error('不支持的资源URI');
    }

    const resourceType = uriParts[2];
    const projectPath = `${uriParts[3]}/${uriParts[4]}`;
    const mrIid = parseInt(uriParts[5]);

    if (resourceType === 'mr') {
      if (uriParts[6] === 'changes') {
        const changes = await gitlabService.getMRChanges(projectPath, mrIid);
        return {
          contents: [
            {
              uri: uri,
              mimeType: 'application/json',
              text: JSON.stringify(changes, null, 2),
            },
          ],
        };
      } else {
        const mrInfo = await gitlabService.getMRInfo(projectPath, mrIid);
        return {
          contents: [
            {
              uri: uri,
              mimeType: 'application/json',
              text: JSON.stringify(mrInfo, null, 2),
            },
          ],
        };
      }
    }

    throw new Error('不支持的资源类型');
  } catch (error) {
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: 'text/plain',
          text: `错误: ${error.message}`,
        },
      ],
    };
  }
});

// 处理提示列表请求
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: prompts,
  };
});

// 处理提示获取请求
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'analyze_mr_changes') {
    const projectPath = args?.projectPath;
    const mrIid = args?.mrIid;

    if (!projectPath || !mrIid) {
      throw new Error('缺少必要参数: projectPath 和 mrIid');
    }

    const changes = await gitlabService.getMRChanges(projectPath, parseInt(mrIid));
    const mrInfo = await gitlabService.getMRInfo(projectPath, parseInt(mrIid));

    return {
      description: `分析项目 ${projectPath} 的MR #${mrIid} 变更`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `请分析以下GitLab MR的变更，并生成一份专业的中文描述：

MR信息：
- 标题: ${mrInfo.title}
- 描述: ${mrInfo.description || '无描述'}
- 作者: ${mrInfo.author?.name}
- 状态: ${mrInfo.state}
- 创建时间: ${mrInfo.created_at}
- 更新时间: ${mrInfo.updated_at}

变更文件：
${changes.changes.map((c) => `- ${c.new_path || c.old_path}`).join('\n')}

请生成一份包含以下内容的markdown描述：
1. 变更概述
2. 主要功能点
3. 技术细节
4. 影响范围
5. 测试建议

请确保描述专业、准确、易于理解。`,
          },
        },
      ],
    };
  }

  throw new Error(`未知的提示: ${name}`);
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GitLab MCP服务器已启动');
}

main().catch((error) => {
  console.error('服务器启动失败:', error);
  process.exit(1);
}); 