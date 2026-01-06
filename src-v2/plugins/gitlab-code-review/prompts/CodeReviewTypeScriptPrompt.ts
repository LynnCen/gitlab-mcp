/**
 * CodeReviewTypeScriptPrompt
 * 
 * TypeScript 代码审查提示
 */

import { Prompt } from '../../../capabilities/prompts/Prompt.js';
import type { PromptArgument } from '../../../capabilities/prompts/types.js';

/**
 * CodeReviewTypeScriptPrompt 实现
 */
export class CodeReviewTypeScriptPrompt extends Prompt {
  readonly name = 'code-review-typescript';
  readonly description = 'TypeScript 代码审查提示模板';
  readonly template = 'code-review-typescript-template';
  readonly version = '1.0.0';
  readonly arguments: PromptArgument[] = [
    {
      name: 'filePath',
      description: '文件路径',
      required: true,
      type: 'string',
    },
    {
      name: 'diff',
      description: '代码差异',
      required: true,
      type: 'string',
    },
  ];

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super();
  }

  async render(args: Record<string, unknown>): Promise<string> {
    const { filePath, diff } = args as { filePath: string; diff: string };

    return Promise.resolve(`请对以下 TypeScript 文件进行代码审查：

**文件路径**: \`${filePath}\`

**代码变更**:
\`\`\`diff
${diff}
\`\`\`

**审查重点**:
1. **类型安全**
   - 检查是否使用了 \`any\` 类型
   - 确保函数有明确的返回类型
   - 验证类型推断是否正确

2. **代码规范**
   - 检查命名规范（PascalCase/camelCase）
   - 验证代码格式和缩进
   - 检查是否有未使用的导入

3. **错误处理**
   - 验证异步函数的错误处理
   - 检查 Promise 是否正确处理
   - 确保异常情况被妥善处理

4. **性能优化**
   - 检查是否有不必要的循环
   - 验证是否有内存泄漏风险
   - 检查是否有性能瓶颈

请提供详细的审查意见，包括：
- 🔴 Critical: 必须修复的问题
- 🟡 Warning: 建议修复的问题
- 💡 Suggestion: 可选的改进建议
`);
  }
}

