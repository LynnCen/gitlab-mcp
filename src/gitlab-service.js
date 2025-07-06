import { Gitlab } from '@gitbeaker/node';
import fs from 'fs';
import path from 'path';
import os from 'os';

export class GitLabService {
  constructor() {
    this.gitlab = null;
    this.initializeGitlab();
  }

  initializeGitlab() {
    // 从环境变量或配置文件读取GitLab配置
    const config = this.loadConfig();
    
    if (!config.token) {
      throw new Error('GitLab token未配置。请设置环境变量GITLAB_TOKEN或创建配置文件。');
    }

    this.gitlab = new Gitlab({
      host: config.host,
      token: config.token,
    });
  }

  loadConfig() {
    // 优先从环境变量读取
    const envConfig = {
      host: process.env.GITLAB_HOST || 'https://gitlab.com',
      token: process.env.GITLAB_TOKEN,
    };

    if (envConfig.token) {
      return envConfig;
    }

    // 从配置文件读取
    const configPath = path.join(os.homedir(), '.gitlab-mcp-config.json');
    if (fs.existsSync(configPath)) {
      try {
        const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return {
          host: fileConfig.host || 'https://gitlab.com',
          token: fileConfig.token,
        };
      } catch (error) {
        console.error('配置文件读取失败:', error);
      }
    }

    // 如果都没有，抛出错误
    throw new Error('GitLab配置未找到。请设置环境变量或创建配置文件。');
  }

  async getMRInfo(projectPath, mrIid) {
    try {
      const mr = await this.gitlab.MergeRequests.show(projectPath, mrIid);
      return {
        id: mr.id,
        iid: mr.iid,
        title: mr.title,
        description: mr.description,
        state: mr.state,
        created_at: mr.created_at,
        updated_at: mr.updated_at,
        merged_at: mr.merged_at,
        author: {
          id: mr.author.id,
          name: mr.author.name,
          username: mr.author.username,
          email: mr.author.email,
        },
        assignee: mr.assignee ? {
          id: mr.assignee.id,
          name: mr.assignee.name,
          username: mr.assignee.username,
          email: mr.assignee.email,
        } : null,
        source_branch: mr.source_branch,
        target_branch: mr.target_branch,
        web_url: mr.web_url,
        changes_count: mr.changes_count,
        user_notes_count: mr.user_notes_count,
        upvotes: mr.upvotes,
        downvotes: mr.downvotes,
        labels: mr.labels,
        milestone: mr.milestone,
        merge_status: mr.merge_status,
        has_conflicts: mr.has_conflicts,
        pipeline: mr.pipeline,
      };
    } catch (error) {
      throw new Error(`获取MR信息失败: ${error.message}`);
    }
  }

  async getMRChanges(projectPath, mrIid) {
    try {
      const changes = await this.gitlab.MergeRequests.changes(projectPath, mrIid);
      return {
        id: changes.id,
        iid: changes.iid,
        title: changes.title,
        changes: changes.changes.map(change => ({
          old_path: change.old_path,
          new_path: change.new_path,
          a_mode: change.a_mode,
          b_mode: change.b_mode,
          new_file: change.new_file,
          renamed_file: change.renamed_file,
          deleted_file: change.deleted_file,
          diff: change.diff,
        })),
        overflow: changes.overflow,
      };
    } catch (error) {
      throw new Error(`获取MR变更失败: ${error.message}`);
    }
  }

  async generateMRDescription(projectPath, mrIid, options = {}) {
    try {
      const { includeFiles = true, includeDiffs = false } = options;
      
      const [mrInfo, changes] = await Promise.all([
        this.getMRInfo(projectPath, mrIid),
        this.getMRChanges(projectPath, mrIid),
      ]);

      const markdown = this.createMarkdownDescription(mrInfo, changes, {
        includeFiles,
        includeDiffs,
      });

      return markdown;
    } catch (error) {
      throw new Error(`生成MR描述失败: ${error.message}`);
    }
  }

  createMarkdownDescription(mrInfo, changes, options) {
    const { includeFiles, includeDiffs } = options;
    
    let markdown = `# MR #${mrInfo.iid}: ${mrInfo.title}\n\n`;
    
    // 基本信息
    markdown += `## 📋 基本信息\n\n`;
    markdown += `- **作者**: ${mrInfo.author.name} (@${mrInfo.author.username})\n`;
    markdown += `- **状态**: ${this.getStateEmoji(mrInfo.state)} ${mrInfo.state}\n`;
    markdown += `- **分支**: \`${mrInfo.source_branch}\` → \`${mrInfo.target_branch}\`\n`;
    markdown += `- **创建时间**: ${new Date(mrInfo.created_at).toLocaleString('zh-CN')}\n`;
    markdown += `- **更新时间**: ${new Date(mrInfo.updated_at).toLocaleString('zh-CN')}\n`;
    
    if (mrInfo.merged_at) {
      markdown += `- **合并时间**: ${new Date(mrInfo.merged_at).toLocaleString('zh-CN')}\n`;
    }
    
    if (mrInfo.assignee) {
      markdown += `- **分配给**: ${mrInfo.assignee.name} (@${mrInfo.assignee.username})\n`;
    }
    
    markdown += `- **变更数量**: ${mrInfo.changes_count} 个文件\n`;
    markdown += `- **评论数**: ${mrInfo.user_notes_count}\n`;
    markdown += `- **链接**: [查看MR](${mrInfo.web_url})\n\n`;

    // 描述
    if (mrInfo.description) {
      markdown += `## 📝 描述\n\n${mrInfo.description}\n\n`;
    }

    // 标签
    if (mrInfo.labels && mrInfo.labels.length > 0) {
      markdown += `## 🏷️ 标签\n\n`;
      mrInfo.labels.forEach(label => {
        markdown += `- ${label}\n`;
      });
      markdown += `\n`;
    }

    // 变更文件列表
    if (includeFiles && changes.changes.length > 0) {
      markdown += `## 📁 变更文件 (${changes.changes.length})\n\n`;
      
      const filesByType = this.categorizeFiles(changes.changes);
      
      if (filesByType.added.length > 0) {
        markdown += `### ➕ 新增文件 (${filesByType.added.length})\n\n`;
        filesByType.added.forEach(file => {
          markdown += `- \`${file.new_path}\`\n`;
        });
        markdown += `\n`;
      }
      
      if (filesByType.modified.length > 0) {
        markdown += `### ✏️ 修改文件 (${filesByType.modified.length})\n\n`;
        filesByType.modified.forEach(file => {
          markdown += `- \`${file.new_path}\`\n`;
        });
        markdown += `\n`;
      }
      
      if (filesByType.deleted.length > 0) {
        markdown += `### ❌ 删除文件 (${filesByType.deleted.length})\n\n`;
        filesByType.deleted.forEach(file => {
          markdown += `- \`${file.old_path}\`\n`;
        });
        markdown += `\n`;
      }
      
      if (filesByType.renamed.length > 0) {
        markdown += `### 🔄 重命名文件 (${filesByType.renamed.length})\n\n`;
        filesByType.renamed.forEach(file => {
          markdown += `- \`${file.old_path}\` → \`${file.new_path}\`\n`;
        });
        markdown += `\n`;
      }
    }

    // 代码差异
    if (includeDiffs && changes.changes.length > 0) {
      markdown += `## 🔍 代码差异\n\n`;
      changes.changes.forEach(change => {
        if (change.diff) {
          markdown += `### ${change.new_path || change.old_path}\n\n`;
          markdown += `\`\`\`diff\n${change.diff}\n\`\`\`\n\n`;
        }
      });
    }

    // 统计信息
    markdown += `## 📊 统计信息\n\n`;
    const stats = this.calculateStats(changes.changes);
    markdown += `- **文件总数**: ${stats.totalFiles}\n`;
    markdown += `- **新增文件**: ${stats.addedFiles}\n`;
    markdown += `- **修改文件**: ${stats.modifiedFiles}\n`;
    markdown += `- **删除文件**: ${stats.deletedFiles}\n`;
    markdown += `- **重命名文件**: ${stats.renamedFiles}\n`;

    // 合并状态
    if (mrInfo.merge_status) {
      markdown += `\n## 🔄 合并状态\n\n`;
      markdown += `- **合并状态**: ${this.getMergeStatusEmoji(mrInfo.merge_status)} ${mrInfo.merge_status}\n`;
      if (mrInfo.has_conflicts) {
        markdown += `- **冲突**: ⚠️ 存在合并冲突\n`;
      }
    }

    // 管道状态
    if (mrInfo.pipeline) {
      markdown += `\n## 🔧 管道状态\n\n`;
      markdown += `- **管道状态**: ${this.getPipelineStatusEmoji(mrInfo.pipeline.status)} ${mrInfo.pipeline.status}\n`;
      markdown += `- **管道链接**: [查看管道](${mrInfo.pipeline.web_url})\n`;
    }

    return markdown;
  }

  categorizeFiles(changes) {
    const result = {
      added: [],
      modified: [],
      deleted: [],
      renamed: [],
    };

    changes.forEach(change => {
      if (change.new_file) {
        result.added.push(change);
      } else if (change.deleted_file) {
        result.deleted.push(change);
      } else if (change.renamed_file) {
        result.renamed.push(change);
      } else {
        result.modified.push(change);
      }
    });

    return result;
  }

  calculateStats(changes) {
    const stats = {
      totalFiles: changes.length,
      addedFiles: 0,
      modifiedFiles: 0,
      deletedFiles: 0,
      renamedFiles: 0,
    };

    changes.forEach(change => {
      if (change.new_file) {
        stats.addedFiles++;
      } else if (change.deleted_file) {
        stats.deletedFiles++;
      } else if (change.renamed_file) {
        stats.renamedFiles++;
      } else {
        stats.modifiedFiles++;
      }
    });

    return stats;
  }

  getStateEmoji(state) {
    const emojis = {
      opened: '🔓',
      closed: '🔒',
      merged: '✅',
      locked: '🔒',
    };
    return emojis[state] || '❓';
  }

  getMergeStatusEmoji(status) {
    const emojis = {
      can_be_merged: '✅',
      cannot_be_merged: '❌',
      unchecked: '❓',
    };
    return emojis[status] || '❓';
  }

  getPipelineStatusEmoji(status) {
    const emojis = {
      success: '✅',
      failed: '❌',
      running: '🔄',
      pending: '⏳',
      canceled: '🚫',
      skipped: '⏭️',
    };
    return emojis[status] || '❓';
  }

  async listProjectMRs(projectPath, state = 'opened', limit = 10) {
    try {
      const mrs = await this.gitlab.MergeRequests.all({
        projectId: projectPath,
        state: state,
        per_page: limit,
        order_by: 'updated_at',
        sort: 'desc',
      });

      return mrs.map(mr => ({
        id: mr.id,
        iid: mr.iid,
        title: mr.title,
        state: mr.state,
        created_at: mr.created_at,
        updated_at: mr.updated_at,
        merged_at: mr.merged_at,
        author: {
          name: mr.author.name,
          username: mr.author.username,
        },
        source_branch: mr.source_branch,
        target_branch: mr.target_branch,
        web_url: mr.web_url,
        labels: mr.labels,
        user_notes_count: mr.user_notes_count,
        upvotes: mr.upvotes,
        downvotes: mr.downvotes,
      }));
    } catch (error) {
      throw new Error(`获取项目MR列表失败: ${error.message}`);
    }
  }
} 