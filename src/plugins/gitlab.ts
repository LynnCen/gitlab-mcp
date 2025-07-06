import { Gitlab } from '@gitbeaker/node';
import { BasePlugin } from '../core/plugin.js';
import {
  MCPTool,
  MCPResource,
  MCPPrompt,
  PluginManifest,
  PluginContext,
  GitLabMR,
  GitLabMRChanges,
  GitLabMRChange,
  PluginError,
} from '../types/index.js';

/**
 * GitLab插件
 */
export class GitLabPlugin extends BasePlugin {
  private gitlab: any;

  constructor(context: PluginContext) {
    super(context);
    this.gitlab = new Gitlab({
      host: context.config.gitlab.host,
      token: context.config.gitlab.token,
    });
  }

  getManifest(): PluginManifest {
    return {
      name: 'gitlab',
      version: '1.0.0',
      description: 'GitLab MCP插件，支持MR管理和代码分析',
      author: 'GitLab MCP Team',
      dependencies: ['@gitbeaker/node'],
      capabilities: {
        tools: true,
        resources: true,
        prompts: true,
      },
    };
  }

  async initialize(): Promise<void> {
    this.log('info', 'GitLab插件初始化中...');
    
    try {
      // 测试连接
      await this.gitlab.Users.current();
      this.log('info', 'GitLab连接测试成功');
    } catch (error) {
      throw new PluginError('GitLab连接测试失败', this.name, error);
    }
  }

  getTools(): MCPTool[] {
    return [
      {
        name: 'gitlab_get_mr_info',
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
        name: 'gitlab_get_mr_changes',
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
        name: 'gitlab_generate_mr_description',
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
        name: 'gitlab_list_project_mrs',
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
      {
        name: 'gitlab_get_project_info',
        description: '获取项目基本信息',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: '项目路径，格式如: owner/repo',
            },
          },
          required: ['projectPath'],
        },
      },
      {
        name: 'gitlab_list_branches',
        description: '列出项目分支',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: '项目路径，格式如: owner/repo',
            },
            limit: {
              type: 'number',
              description: '返回的分支数量限制',
              default: 20,
            },
          },
          required: ['projectPath'],
        },
      },
      {
        name: 'gitlab_get_file_content',
        description: '获取文件内容',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: '项目路径，格式如: owner/repo',
            },
            filePath: {
              type: 'string',
              description: '文件路径',
            },
            ref: {
              type: 'string',
              description: '分支或commit引用',
              default: 'main',
            },
          },
          required: ['projectPath', 'filePath'],
        },
      },
    ];
  }

  getResources(): MCPResource[] {
    return [
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
      {
        uri: 'gitlab://project/{projectPath}',
        name: 'GitLab项目资源',
        description: '访问指定的GitLab项目信息',
        mimeType: 'application/json',
      },
    ];
  }

  getPrompts(): MCPPrompt[] {
    return [
      {
        name: 'gitlab_analyze_mr_changes',
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
      {
        name: 'gitlab_review_mr_checklist',
        description: '生成MR代码审查清单',
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
  }

  async handleToolCall(name: string, args: any): Promise<any> {
    this.log('debug', `调用工具: ${name}`, args);

    switch (name) {
      case 'gitlab_get_mr_info':
        return await this.getMRInfo(args.projectPath, args.mrIid);
      
      case 'gitlab_get_mr_changes':
        return await this.getMRChanges(args.projectPath, args.mrIid);
      
      case 'gitlab_generate_mr_description':
        return await this.generateMRDescription(
          args.projectPath,
          args.mrIid,
          {
            includeFiles: args.includeFiles ?? true,
            includeDiffs: args.includeDiffs ?? false,
          }
        );
      
      case 'gitlab_list_project_mrs':
        return await this.listProjectMRs(
          args.projectPath,
          args.state ?? 'opened',
          args.limit ?? 10
        );
      
      case 'gitlab_get_project_info':
        return await this.getProjectInfo(args.projectPath);
      
      case 'gitlab_list_branches':
        return await this.listBranches(args.projectPath, args.limit ?? 20);
      
      case 'gitlab_get_file_content':
        return await this.getFileContent(
          args.projectPath,
          args.filePath,
          args.ref ?? 'main'
        );
      
      default:
        throw new PluginError(`未知的工具: ${name}`, this.name);
    }
  }

  async handleResourceRead(uri: string): Promise<any> {
    this.log('debug', `读取资源: ${uri}`);
    
    const uriParts = uri.split('/');
    
    if (uriParts[0] !== 'gitlab:' || uriParts[1] !== '') {
      throw new PluginError('不支持的资源URI', this.name);
    }

    const resourceType = uriParts[2];
    
    if (resourceType === 'mr') {
      const projectPath = `${uriParts[3]}/${uriParts[4]}`;
      const mrIid = parseInt(uriParts[5] || '0');
      
      if (uriParts[6] === 'changes') {
        return await this.getMRChanges(projectPath, mrIid);
      } else {
        return await this.getMRInfo(projectPath, mrIid);
      }
    }
    
    if (resourceType === 'project') {
      const projectPath = `${uriParts[3]}/${uriParts[4]}`;
      return await this.getProjectInfo(projectPath);
    }

    throw new PluginError(`不支持的资源类型: ${resourceType}`, this.name);
  }

  async handlePromptGet(name: string, args: any): Promise<any> {
    this.log('debug', `获取提示: ${name}`, args);
    
    // 先检查提示是否存在
    if (name !== 'gitlab_analyze_mr_changes' && name !== 'gitlab_review_mr_checklist') {
      throw new PluginError(`未知的提示: ${name}`, this.name);
    }
    
    const projectPath = args?.projectPath;
    const mrIid = args?.mrIid;

    if (!projectPath || !mrIid) {
      throw new PluginError('缺少必要参数: projectPath 和 mrIid', this.name);
    }

    if (name === 'gitlab_analyze_mr_changes') {
      const [mrInfo, changes] = await Promise.all([
        this.getMRInfo(projectPath, parseInt(mrIid)),
        this.getMRChanges(projectPath, parseInt(mrIid)),
      ]);

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

    if (name === 'gitlab_review_mr_checklist') {
      const [mrInfo, changes] = await Promise.all([
        this.getMRInfo(projectPath, parseInt(mrIid)),
        this.getMRChanges(projectPath, parseInt(mrIid)),
      ]);

      return {
        description: `生成项目 ${projectPath} 的MR #${mrIid} 代码审查清单`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请为以下GitLab MR生成一份详细的代码审查清单：

MR信息：
- 标题: ${mrInfo.title}
- 描述: ${mrInfo.description || '无描述'}
- 作者: ${mrInfo.author?.name}
- 变更文件数: ${changes.changes.length}

请生成一份包含以下内容的审查清单：
1. 代码质量检查要点
2. 安全性检查事项
3. 性能影响评估
4. 测试覆盖率确认
5. 文档更新检查
6. 依赖变更审查

请确保清单具体、可操作、全面。`,
            },
          },
        ],
      };
    }
  }

  async destroy(): Promise<void> {
    this.log('info', 'GitLab插件销毁中...');
    // 清理资源
  }

  // GitLab API 方法
  
  private async getMRInfo(projectPath: string, mrIid: number): Promise<GitLabMR> {
    const cacheKey = `mr-info-${projectPath}-${mrIid}`;
    const cached = await this.getCache<GitLabMR>(cacheKey);
    
    if (cached) {
      this.log('debug', '从缓存获取MR信息');
      return cached;
    }

    try {
      const mr = await this.gitlab.MergeRequests.show(projectPath, mrIid);
      const result: GitLabMR = {
        id: mr.id,
        iid: mr.iid,
        title: mr.title,
        description: mr.description || '',
        state: mr.state,
        created_at: mr.created_at,
        updated_at: mr.updated_at,
        merged_at: mr.merged_at,
        author: mr.author,
        assignee: mr.assignee,
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

      await this.setCache(cacheKey, result, 300);
      return result;
    } catch (error) {
      throw new PluginError(`获取MR信息失败: ${error}`, this.name, error);
    }
  }

  private async getMRChanges(projectPath: string, mrIid: number): Promise<GitLabMRChanges> {
    const cacheKey = `mr-changes-${projectPath}-${mrIid}`;
    const cached = await this.getCache<GitLabMRChanges>(cacheKey);
    
    if (cached) {
      this.log('debug', '从缓存获取MR变更');
      return cached;
    }

    try {
      const changes = await this.gitlab.MergeRequests.changes(projectPath, mrIid);
      const result: GitLabMRChanges = {
        id: changes.id,
        iid: changes.iid,
        title: changes.title,
        changes: changes.changes.map((change: any): GitLabMRChange => ({
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

      await this.setCache(cacheKey, result, 300);
      return result;
    } catch (error) {
      throw new PluginError(`获取MR变更失败: ${error}`, this.name, error);
    }
  }

  private async generateMRDescription(
    projectPath: string,
    mrIid: number,
    options: { includeFiles: boolean; includeDiffs: boolean }
  ): Promise<string> {
    try {
      const { includeFiles, includeDiffs } = options;
      
      const [mrInfo, changes] = await Promise.all([
        this.getMRInfo(projectPath, mrIid),
        this.getMRChanges(projectPath, mrIid),
      ]);

      return this.createMarkdownDescription(mrInfo, changes, {
        includeFiles,
        includeDiffs,
      });
    } catch (error) {
      throw new PluginError(`生成MR描述失败: ${error}`, this.name, error);
    }
  }

  private createMarkdownDescription(
    mrInfo: GitLabMR,
    changes: GitLabMRChanges,
    options: { includeFiles: boolean; includeDiffs: boolean }
  ): string {
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

    return markdown;
  }

  private categorizeFiles(changes: GitLabMRChange[]): {
    added: GitLabMRChange[];
    modified: GitLabMRChange[];
    deleted: GitLabMRChange[];
    renamed: GitLabMRChange[];
  } {
    const result = {
      added: [] as GitLabMRChange[],
      modified: [] as GitLabMRChange[],
      deleted: [] as GitLabMRChange[],
      renamed: [] as GitLabMRChange[],
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

  private calculateStats(changes: GitLabMRChange[]): {
    totalFiles: number;
    addedFiles: number;
    modifiedFiles: number;
    deletedFiles: number;
    renamedFiles: number;
  } {
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

  private getStateEmoji(state: string): string {
    const emojis: Record<string, string> = {
      opened: '🔓',
      closed: '🔒',
      merged: '✅',
      locked: '🔒',
    };
    return emojis[state] || '❓';
  }

  private async getProjectInfo(projectPath: string): Promise<any> {
    try {
      const project = await this.gitlab.Projects.show(projectPath);
      return {
        id: project.id,
        name: project.name,
        path: project.path,
        description: project.description,
        default_branch: project.default_branch,
        visibility: project.visibility,
        web_url: project.web_url,
        created_at: project.created_at,
        updated_at: project.updated_at,
      };
    } catch (error) {
      throw new PluginError(`获取项目信息失败: ${error}`, this.name, error);
    }
  }

  private async listProjectMRs(projectPath: string, state: string, limit: number): Promise<any[]> {
    try {
      const mrs = await this.gitlab.MergeRequests.all({
        projectId: projectPath,
        state: state,
        per_page: limit,
        order_by: 'updated_at',
        sort: 'desc',
      });

      return mrs.map((mr: any) => ({
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
      throw new PluginError(`获取项目MR列表失败: ${error}`, this.name, error);
    }
  }

  private async listBranches(projectPath: string, limit: number): Promise<any[]> {
    try {
      const branches = await this.gitlab.Branches.all(projectPath, {
        per_page: limit,
      });

      return branches.map((branch: any) => ({
        name: branch.name,
        merged: branch.merged,
        protected: branch.protected,
        default: branch.default,
        can_push: branch.can_push,
        web_url: branch.web_url,
        commit: {
          id: branch.commit.id,
          short_id: branch.commit.short_id,
          title: branch.commit.title,
          author_name: branch.commit.author_name,
          author_email: branch.commit.author_email,
          created_at: branch.commit.created_at,
        },
      }));
    } catch (error) {
      throw new PluginError(`获取分支列表失败: ${error}`, this.name, error);
    }
  }

  private async getFileContent(projectPath: string, filePath: string, ref: string): Promise<any> {
    try {
      const file = await this.gitlab.RepositoryFiles.show(projectPath, filePath, ref);
      return {
        file_name: file.file_name,
        file_path: file.file_path,
        size: file.size,
        encoding: file.encoding,
        content: file.content,
        content_sha256: file.content_sha256,
        ref: file.ref,
        blob_id: file.blob_id,
        commit_id: file.commit_id,
        last_commit_id: file.last_commit_id,
      };
    } catch (error) {
      throw new PluginError(`获取文件内容失败: ${error}`, this.name, error);
    }
  }
}

/**
 * GitLab插件工厂
 */
export const gitlabPluginFactory = {
  create: (context: PluginContext) => new GitLabPlugin(context),
}; 