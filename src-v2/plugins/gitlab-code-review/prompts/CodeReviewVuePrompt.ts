/**
 * CodeReviewVuePrompt
 * 
 * Vue 代码审查提示
 */

import { Prompt } from '../../../capabilities/prompts/Prompt.js';
import type { PromptArgument } from '../../../capabilities/prompts/types.js';

/**
 * CodeReviewVuePrompt 实现
 */
export class CodeReviewVuePrompt extends Prompt {
  readonly name = 'code-review-vue';
  readonly description = 'Vue 代码审查提示模板';
  readonly template = 'code-review-vue-template';
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
    super();
  }

  async render(args: Record<string, unknown>): Promise<string> {
    const { filePath, diff } = args as { filePath: string; diff: string };

    return Promise.resolve(`请对以下 Vue 文件进行代码审查：

**文件路径**: \`${filePath}\`

**代码变更**:
\`\`\`diff
${diff}
\`\`\`

**审查重点**:
1. **组件设计**
   - 检查组件的单一职责原则
   - 验证组件的可复用性
   - 检查组件的 props 定义

2. **Vue 最佳实践**
   - 检查 template 中的表达式复杂度
   - 验证 computed 和 watch 的使用
   - 检查生命周期钩子的使用

3. **性能优化**
   - 检查是否有不必要的重新渲染
   - 验证 v-if 和 v-show 的使用
   - 检查列表渲染的性能

4. **可访问性**
   - 检查 ARIA 属性
   - 验证键盘导航支持
   - 检查语义化 HTML

请提供详细的审查意见，包括：
- 🔴 Critical: 必须修复的问题
- 🟡 Warning: 建议修复的问题
- 💡 Suggestion: 可选的改进建议
`);
  }
}

