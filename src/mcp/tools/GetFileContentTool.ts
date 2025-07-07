import { MCPTool, ToolHandler } from './ToolRegistry.js';
import { FileStrategy } from '../../gitlab/strategies/FileStrategy.js';

/**
 * 获取文件内容工具
 */
export class GetFileContentTool implements ToolHandler {
  constructor(private fileStrategy: FileStrategy) {}

  /**
   * 处理工具调用
   */
  async handle(args: Record<string, any>): Promise<any> {
    const { projectPath, filePath, ref = 'main' } = args;

    // 验证参数
    if (!projectPath || typeof projectPath !== 'string') {
      throw new Error('projectPath 参数是必需的且必须是字符串');
    }

    if (!filePath || typeof filePath !== 'string') {
      throw new Error('filePath 参数是必需的且必须是字符串');
    }

    // 调用策略处理
    return await this.fileStrategy.getFileContent(projectPath, filePath, ref);
  }

  /**
   * 获取工具定义
   */
  static getToolDefinition(): MCPTool {
    return {
      name: 'get_file_content',
      description: '获取 GitLab 项目中指定文件的内容',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: '项目路径，格式如: owner/repo 或 group/subgroup/project',
          },
          filePath: {
            type: 'string',
            description: '文件在项目中的路径，如: src/main.ts',
          },
          ref: {
            type: 'string',
            description: '分支名、标签名或 commit SHA，默认为 main',
            default: 'main',
          },
        },
        required: ['projectPath', 'filePath'],
      },
    };
  }
}

/**
 * 获取多个文件内容工具
 */
export class GetMultipleFileContentsTool implements ToolHandler {
  constructor(private fileStrategy: FileStrategy) {}

  /**
   * 处理工具调用
   */
  async handle(args: Record<string, any>): Promise<any> {
    const { projectPath, filePaths, ref = 'main' } = args;

    // 验证参数
    if (!projectPath || typeof projectPath !== 'string') {
      throw new Error('projectPath 参数是必需的且必须是字符串');
    }

    if (!Array.isArray(filePaths)) {
      throw new Error('filePaths 参数是必需的且必须是数组');
    }

    if (filePaths.length === 0) {
      throw new Error('filePaths 数组不能为空');
    }

    // 验证每个文件路径
    for (const filePath of filePaths) {
      if (typeof filePath !== 'string') {
        throw new Error('filePaths 数组中的每个元素都必须是字符串');
      }
    }

    // 调用策略处理
    return await this.fileStrategy.getMultipleFileContents(projectPath, filePaths, ref);
  }

  /**
   * 获取工具定义
   */
  static getToolDefinition(): MCPTool {
    return {
      name: 'get_multiple_file_contents',
      description: '批量获取 GitLab 项目中多个文件的内容',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: '项目路径，格式如: owner/repo 或 group/subgroup/project',
          },
          filePaths: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: '文件路径数组，如: ["src/main.ts", "src/utils.ts"]',
          },
          ref: {
            type: 'string',
            description: '分支名、标签名或 commit SHA，默认为 main',
            default: 'main',
          },
        },
        required: ['projectPath', 'filePaths'],
      },
    };
  }
} 