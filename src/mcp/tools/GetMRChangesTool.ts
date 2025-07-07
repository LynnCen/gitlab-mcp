import { MCPTool, ToolHandler } from './ToolRegistry.js';
import { MRStrategy } from '../../gitlab/strategies/MRStrategy.js';

/**
 * 获取 MR 变更文件工具
 */
export class GetMRChangesTool implements ToolHandler {
  constructor(private mrStrategy: MRStrategy) {}

  /**
   * 处理工具调用
   */
  async handle(args: Record<string, any>): Promise<any> {
    const { projectPath, mrIid, includeContent = false } = args;

    // 验证参数
    if (!projectPath || typeof projectPath !== 'string') {
      throw new Error('projectPath 参数是必需的且必须是字符串');
    }

    if (!mrIid || typeof mrIid !== 'number') {
      throw new Error('mrIid 参数是必需的且必须是数字');
    }

    // 调用策略处理
    return await this.mrStrategy.getMRChanges(projectPath, mrIid, includeContent);
  }

  /**
   * 获取工具定义
   */
  static getToolDefinition(): MCPTool {
    return {
      name: 'get_mr_changes',
      description: '获取 GitLab MR 的变更文件列表，包含变更类型、文件路径和可选的文件内容',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: '项目路径，格式如: owner/repo 或 group/subgroup/project',
          },
          mrIid: {
            type: 'number',
            description: 'MR 的内部 ID（注意不是全局 ID）',
          },
          includeContent: {
            type: 'boolean',
            description: '是否包含文件内容和 diff 信息',
            default: false,
          },
        },
        required: ['projectPath', 'mrIid'],
      },
    };
  }
} 