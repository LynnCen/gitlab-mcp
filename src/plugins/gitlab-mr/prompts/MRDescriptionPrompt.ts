/**
 * MRDescriptionPrompt
 * 
 * MR 描述生成提示
 */

import { Prompt } from '../../../capabilities/prompts/Prompt.js';
import type { PromptArgument } from '../../../capabilities/prompts/types.js';
import type { IMergeRequestService } from '../../../services/MergeRequestService.js';

/**
 * MRDescriptionPrompt 实现
 */
export class MRDescriptionPrompt extends Prompt {
  readonly name = 'mr-description';
  readonly description = '生成合并请求描述';
  readonly template = 'mr-description-template';
  readonly version = '1.0.0';
  readonly arguments: PromptArgument[] = [
    {
      name: 'projectPath',
      description: '项目路径',
      required: true,
      type: 'string',
    },
    {
      name: 'mrIid',
      description: '合并请求ID',
      required: true,
      type: 'number',
    },
    {
      name: 'style',
      description: '描述风格（detailed/summary/minimal）',
      required: false,
      type: 'string',
      default: 'detailed',
    },
  ];

  constructor(private mrService: IMergeRequestService) {
    super();
  }

  async render(args: Record<string, any>): Promise<string> {
    const { projectPath, mrIid, style = 'detailed' } = args;

    // 获取 MR 信息
    const mr = await this.mrService.getMergeRequest(projectPath, mrIid);
    const changes = await this.mrService.getMergeRequestChanges(projectPath, mrIid, {
      includeContent: false,
    });

    // 根据风格生成描述
    if (style === 'minimal') {
      return this.renderMinimal(mr, changes);
    } else if (style === 'summary') {
      return this.renderSummary(mr, changes);
    } else {
      return this.renderDetailed(mr, changes);
    }
  }

  private renderMinimal(mr: any, changes: any): string {
    return `## ${mr.title}

**变更摘要**:
- 修改文件: ${changes.summary.totalFiles} 个
- 新增: ${changes.summary.newFiles.length} 个
- 删除: ${changes.summary.deletedFiles.length} 个
- 修改: ${changes.summary.modifiedFiles.length} 个

**分支**: \`${mr.source_branch}\` → \`${mr.target_branch}\`
`;
  }

  private renderSummary(mr: any, changes: any): string {
    const modifiedFiles = changes.summary.modifiedFiles.slice(0, 10);
    const newFiles = changes.summary.newFiles.slice(0, 10);

    return `## ${mr.title}

### 变更摘要

- **总文件数**: ${changes.summary.totalFiles}
- **新增文件**: ${changes.summary.newFiles.length}
- **删除文件**: ${changes.summary.deletedFiles.length}
- **修改文件**: ${changes.summary.modifiedFiles.length}
- **代码变更**: +${changes.summary.additions} / -${changes.summary.deletions}

### 主要变更

${modifiedFiles.length > 0 ? `**修改的文件**:\n${modifiedFiles.map((f: string) => `- \`${f}\``).join('\n')}` : ''}

${newFiles.length > 0 ? `**新增的文件**:\n${newFiles.map((f: string) => `- \`${f}\``).join('\n')}` : ''}

### 分支信息

- **源分支**: \`${mr.source_branch}\`
- **目标分支**: \`${mr.target_branch}\`
`;
  }

  private renderDetailed(mr: any, changes: any): string {
    const allFiles = [
      ...changes.summary.newFiles.map((f: string) => ({ path: f, type: 'new' })),
      ...changes.summary.modifiedFiles.map((f: string) => ({ path: f, type: 'modified' })),
      ...changes.summary.deletedFiles.map((f: string) => ({ path: f, type: 'deleted' })),
    ];

    return `## ${mr.title}

### 📋 变更概览

| 类型 | 数量 |
|------|------|
| 总文件 | ${changes.summary.totalFiles} |
| 新增 | ${changes.summary.newFiles.length} |
| 修改 | ${changes.summary.modifiedFiles.length} |
| 删除 | ${changes.summary.deletedFiles.length} |
| 代码变更 | +${changes.summary.additions} / -${changes.summary.deletions} |

### 📁 文件变更列表

${allFiles.map((file: any) => {
  const icon = file.type === 'new' ? '✨' : file.type === 'deleted' ? '🗑️' : '📝';
  return `${icon} \`${file.path}\` (${file.type})`;
}).join('\n')}

### 🌿 分支信息

- **源分支**: \`${mr.source_branch}\`
- **目标分支**: \`${mr.target_branch}\`
- **作者**: ${mr.author?.username || 'Unknown'}

### 📝 说明

${mr.description || '暂无描述'}
`;
  }
}

