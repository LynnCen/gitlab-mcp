/**
 * GetFileCodeReviewRulesTool
 * 
 * 获取文件代码审查规则的工具
 */

import { Tool } from '../../../capabilities/tools/Tool.js';
import { z } from 'zod';
import type { ExecutionContext, ToolResult } from '../../../capabilities/tools/types.js';

// TODO: 需要将 CODE_REVIEW_RULES 和 FILE_FILTER_CONFIG 迁移到 v2
// 临时使用内联定义
const CODE_REVIEW_RULES: Record<string, {
  focus_areas: string[];
  specific_rules: string[];
  ignore_patterns: string[];
  severity_mapping: Record<string, string>;
}> = {
  '.ts': {
    focus_areas: ['类型安全', '性能优化', '代码规范', '错误处理'],
    specific_rules: [
      '确保所有函数都有明确的返回类型',
      '避免使用 any 类型，使用具体类型或泛型',
      '异步函数必须正确处理错误',
    ],
    ignore_patterns: ['*.d.ts', '*.test.ts', '*.spec.ts'],
    severity_mapping: {},
  },
};

const FILE_FILTER_CONFIG = {
  includedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.py', '.java', '.cs', '.go', '.rs'],
  excludePatterns: [
    /node_modules/,
    /dist/,
    /build/,
    /\.git/,
  ],
};

/**
 * 获取文件扩展名
 */
function getFileExtension(filePath: string): string {
  const match = filePath.match(/\.([^.]+)$/);
  return match ? `.${match[1]}` : '';
}

/**
 * 判断文件是否需要审查
 */
function shouldReviewFile(filePath: string, extension: string): boolean {
  // 检查扩展名
  if (!FILE_FILTER_CONFIG.includedExtensions.includes(extension)) {
    return false;
  }

  // 检查排除模式
  for (const pattern of FILE_FILTER_CONFIG.excludePatterns) {
    if (pattern.test(filePath)) {
      return false;
    }
  }

  return true;
}

/**
 * GetFileCodeReviewRulesTool 实现
 */
export class GetFileCodeReviewRulesTool extends Tool {
  readonly name = 'get_file_code_review_rules';
  readonly description = '根据文件类型和路径获取相应的代码审查规则';
  readonly inputSchema = z.object({
    filePath: z.string().describe('文件路径'),
    fileExtension: z.string().optional().describe('文件扩展名'),
  });
  readonly metadata = {
    category: 'code-review',
    tags: ['gitlab', 'code-review', 'rules', 'read'],
    plugin: 'gitlab-code-review',
    version: '1.0.0',
  };

  constructor() {
    super();
  }

  async execute(params: unknown, _context: ExecutionContext): Promise<ToolResult> {
    const { filePath, fileExtension } = params as {
      filePath: string;
      fileExtension?: string;
    };

    try {
      const ext = fileExtension || getFileExtension(filePath);
      const rules = CODE_REVIEW_RULES[ext] || {
        focus_areas: ['基础代码质量', '可读性', '维护性'],
        specific_rules: [
          '确保代码逻辑清晰',
          '避免过度复杂的嵌套',
          '函数和变量命名要有意义',
          '添加必要的注释',
        ],
        ignore_patterns: [],
        severity_mapping: {},
      };
      const shouldReview = shouldReviewFile(filePath, ext);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                file_path: filePath,
                extension: ext,
                rules,
                should_review: shouldReview,
                message: shouldReview
                  ? '文件需要审查'
                  : '文件已被过滤，不需要审查',
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error: unknown) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : String(error),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
}
