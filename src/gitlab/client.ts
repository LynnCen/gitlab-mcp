import { Gitlab } from '@gitbeaker/rest';
import { GitLabConfig} from '../config/types.js';

export class GitLabClient {
  private gitlab: InstanceType<typeof Gitlab>;
  private config: GitLabConfig;

  constructor(config: GitLabConfig) {
    this.config = config;
    this.gitlab = new Gitlab({
      host: config.host,
      token: config.token,
    });
  }

  async testConnection(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 获取当前认证用户的详细信息
   * 对应 GitLab API: GET /user
   */
  async getCurrentUser(): Promise<any> {
    return await this.withRetry(async () => {
      // 使用GitLab API的 /user 端点获取当前用户信息
      const response = await this.gitlab.requester.get('user');
      return response;
    });
  }

  async getProject(projectId: string | number) {
    return await this.withRetry(() => this.gitlab.Projects.show(projectId));
  }

  async getMergeRequest(projectId: string | number, mrIid: number) {
    return await this.withRetry(() => this.gitlab.MergeRequests.show(projectId, mrIid));
  }

  /**
   * 获取合并请求的变更信息
   * 对应 GitLab API: GET /projects/:id/merge_requests/:merge_request_iid/changes
   * @param projectId 项目ID或路径
   * @param mrIid 合并请求的内部ID
   * @returns 合并请求的变更信息
   */

  async getMergeRequestChanges(projectId: string | number, mrIid: number): Promise<any> {
    try {
      const mr = await this.withRetry(() => 
        this.gitlab.MergeRequests.showChanges(projectId, mrIid,{
          accessRawDiffs: true
        })
      );
      return mr;


    } catch (error) {
      console.error(`Error getting merge request changes for project ${projectId}, MR ${mrIid}:`, error);
      throw new Error(`Failed to get merge request changes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 更新合并请求的描述信息
   * 对应 GitLab API: PUT /projects/:id/merge_requests/:merge_request_iid
   * @param projectId 项目ID或路径
   * @param mrIid 合并请求的内部ID
   * @param description 新的描述内容（支持Markdown格式）
   * @returns 更新后的合并请求信息
   */
  async updateMergeRequestDescription(
    projectId: string | number, 
    mrIid: number, 
    description: string
  ): Promise<any> {
    return await this.withRetry(() => 
      this.gitlab.MergeRequests.edit(projectId, mrIid, {
        description: description
      })
    );
  }

  async getFileContent(
    projectId: string | number,
    filePath: string,
    ref: string = 'main'
  ) {
    return await this.withRetry(() => this.gitlab.RepositoryFiles.show(projectId, filePath, ref));
  }

  async getMergeRequests(
    projectId: string | number,
    options: {
      state?: 'opened' | 'closed' | 'locked' | 'merged';
      per_page?: number;
      page?: number;
    } = {}
  ) {
    return await this.withRetry(() => this.gitlab.MergeRequests.all({
      projectId,
      ...options,
    }));
  }

  /**
   * 添加合并请求普通评论
   * 对应 GitLab API: POST /projects/:id/merge_requests/:merge_request_iid/notes
   * @param projectId 项目ID或路径
   * @param mrIid 合并请求的内部ID
   * @param body 评论内容（支持Markdown格式）
   * @returns 创建的评论信息
   */
  async addMergeRequestNote(
    projectId: string | number,
    mrIid: number,
    body: string
  ): Promise<any> {
    return await this.withRetry(() => 
      this.gitlab.MergeRequestNotes.create(projectId, mrIid, body)
    );
  }

  /**
   * 获取合并请求的所有评论
   * 对应 GitLab API: GET /projects/:id/merge_requests/:merge_request_iid/notes
   * @param projectId 项目ID或路径
   * @param mrIid 合并请求的内部ID
   * @returns 评论列表
   */
  async getMergeRequestNotes(
    projectId: string | number,
    mrIid: number
  ): Promise<any> {
    return await this.withRetry(() => 
      this.gitlab.MergeRequestNotes.all(projectId, mrIid)
    );
  }

  /**
   * 创建合并请求讨论（支持行内评论）
   * 对应 GitLab API: POST /projects/:id/merge_requests/:merge_request_iid/discussions
   * @param projectId 项目ID或路径
   * @param mrIid 合并请求的内部ID
   * @param body 评论内容
   * @param position 位置信息（用于行内评论）
   * @returns 创建的讨论信息
   */
  async createMergeRequestDiscussion(
    projectId: string | number,
    mrIid: number,
    body: string,
    position?: {
      base_sha: string;
      start_sha: string;
      head_sha: string;
      position_type: 'text';
      new_path: string;
      new_line?: number;
      old_path: string;
      old_line?: number;
    } 
  ): Promise<any> {
    
    return await this.withRetry(() => 
      this.gitlab.MergeRequestDiscussions.create(projectId, mrIid, body, {
          position: position as any
      })
    );
  }

  /**
   * 获取合并请求的commits信息
   * 对应 GitLab API: GET /projects/:id/merge_requests/:merge_request_iid/commits
   * @param projectId 项目ID或路径
   * @param mrIid 合并请求的内部ID
   * @returns commits信息
   */
  async getMergeRequestCommits(
    projectId: string | number,
    mrIid: number
  ): Promise<any> {
    return await this.withRetry(() => 
      this.gitlab.MergeRequests.allCommits(projectId, mrIid)
    );
  }

  /**
   * 获取合并请求的版本信息
   * 对应 GitLab API: GET /projects/:id/merge_requests/:merge_request_iid/versions
   * @param projectId 项目ID或路径
   * @param mrIid 合并请求的内部ID
   * @returns 版本信息，包含正确的SHA值
   */
  async getMergeRequestVersions(
    projectId: string | number,
    mrIid: number
  ): Promise<any> {
    return await this.withRetry(() => 
      this.gitlab.requester.get(`projects/${projectId}/merge_requests/${mrIid}/versions`)
    );
  }

  /**
   * 创建针对特定文件行的精确评论
   * 对应 GitLab API: POST /projects/:id/merge_requests/:merge_request_iid/discussions
   * @param projectId 项目ID或路径
   * @param mrIid 合并请求的内部ID
   * @param filePath 文件路径
   * @param lineNumber 行号
   * @param body 评论内容
   * @returns 创建的讨论信息
   */
  async createFileLineComment(
    projectId: string | number,
    mrIid: number,
    filePath: string,
    lineNumber: number,
    body: string
  ): Promise<any> {
    try {
      // 方法1：尝试获取MR的版本信息
      let position;
      
      try {
        console.log(`🔍 获取MR版本信息: ${projectId}/${mrIid}`);
        const versions = await this.getMergeRequestVersions(projectId, mrIid);
        console.log(`📋 版本信息响应:`, JSON.stringify(versions, null, 2));
        
        if (!versions || !Array.isArray(versions) || versions.length === 0) {
          throw new Error('版本信息为空或格式不正确');
        }

        const latestVersion = versions[0];
        console.log(`📌 最新版本数据:`, JSON.stringify(latestVersion, null, 2));
        
        // 检查字段是否存在
        const base_sha = latestVersion.base_commit_sha || latestVersion.base_sha;
        const start_sha = latestVersion.start_commit_sha || latestVersion.start_sha;
        const head_sha = latestVersion.head_commit_sha || latestVersion.head_sha;
        
        if (!base_sha || !start_sha || !head_sha) {
          throw new Error(`缺少必要的SHA字段: base=${base_sha}, start=${start_sha}, head=${head_sha}`);
        }

        position = {
          base_sha,
          start_sha,
          head_sha,
          position_type: 'text' as const,
          new_path: filePath,
          new_line: lineNumber,
          old_path: filePath,
        };

        console.log(`✅ 使用版本API构建position:`, {
          base_sha: position.base_sha?.substring(0, 8),
          head_sha: position.head_sha?.substring(0, 8),
          start_sha: position.start_sha?.substring(0, 8)
        });

      } catch (versionError) {
        console.warn(`⚠️  版本API失败，尝试备用方案:`, versionError);
        
        // 方法2：备用方案 - 使用MR基本信息中的SHA
        const mr = await this.getMergeRequest(projectId, mrIid);
        console.log(`📋 MR基本信息:`, {
          sha: (mr as any).sha?.substring(0, 8),
          diff_refs: (mr as any).diff_refs
        });
        
        const diff_refs = (mr as any).diff_refs;
        if (diff_refs && diff_refs.base_sha && diff_refs.head_sha && diff_refs.start_sha) {
          position = {
            base_sha: diff_refs.base_sha,
            start_sha: diff_refs.start_sha,
            head_sha: diff_refs.head_sha,
            position_type: 'text' as const,
            new_path: filePath,
            new_line: lineNumber,
            old_path: filePath,
          };
          
          console.log(`✅ 使用MR diff_refs构建position:`, {
            base_sha: position.base_sha?.substring(0, 8),
            head_sha: position.head_sha?.substring(0, 8),
            start_sha: position.start_sha?.substring(0, 8)
          });
        } else {
          // 方法3：最后备用方案 - 使用commits
          console.warn(`⚠️  diff_refs不可用，使用commits作为最后备用方案`);
          const commits = await this.getMergeRequestCommits(projectId, mrIid);
          
          if (!commits || commits.length === 0) {
            throw new Error('无法获取任何SHA信息用于创建行内评论');
          }
          
          position = {
            base_sha: commits[0]?.id || commits[0]?.sha,
            start_sha: commits[0]?.id || commits[0]?.sha,
            head_sha: commits[commits.length - 1]?.id || commits[commits.length - 1]?.sha,
            position_type: 'text' as const,
            new_path: filePath,
            new_line: lineNumber,
            old_path: filePath,
          };
          
          console.log(`✅ 使用commits构建position (备用方案):`, {
            base_sha: position.base_sha?.substring(0, 8),
            head_sha: position.head_sha?.substring(0, 8),
            start_sha: position.start_sha?.substring(0, 8)
          });
        }
      }

      if (!position || !position.base_sha || !position.head_sha || !position.start_sha) {
        throw new Error('无法构建有效的position参数，所有获取SHA的方法都失败了');
      }

      console.log(`🔧 创建行内评论 ${filePath}:${lineNumber}`);
      
      return await this.createMergeRequestDiscussion(
        projectId,
        mrIid,
        body,
        position
      );
      
    } catch (error) {
      console.error(`❌ 创建行内评论失败 ${filePath}:${lineNumber}:`, error);
      throw new Error(`创建行内评论失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 批量创建代码审查评论
   * @param projectId 项目ID或路径
   * @param mrIid 合并请求的内部ID
   * @param comments 评论列表
   * @returns 创建结果
   */
  async batchCreateReviewComments(
    projectId: string | number,
    mrIid: number,
    comments: Array<{
      filePath: string;
      lineNumber?: number;
      body: string;
      severity: 'critical' | 'warning' | 'suggestion';
    }>
  ): Promise<any[]> {
    const results = [];
    
    // 按有无行号分组处理
    const inlineComments = comments.filter(c => c.lineNumber);
    const fileComments = comments.filter(c => !c.lineNumber);
    
    // 处理行内评论
    for (const comment of inlineComments) {
      try {
        const result = await this.createFileLineComment(
          projectId,
          mrIid,
          comment.filePath,
          comment.lineNumber!,
          comment.body
        );
        results.push({ ...comment, success: true, id: result.id, type: 'inline' });
      } catch (error) {
        console.warn(`创建行内评论失败 ${comment.filePath}:${comment.lineNumber}:`, error);
        results.push({ 
          ...comment, 
          success: false, 
          type: 'inline',
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      // 添加延迟避免触发速率限制
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 处理文件级评论
    for (const comment of fileComments) {
      try {
        const result = await this.addMergeRequestNote(
          projectId,
          mrIid,
          `**📁 ${comment.filePath}**\n\n${comment.body}`
        );
        results.push({ ...comment, success: true, id: result.id, type: 'file' });
      } catch (error) {
        console.warn(`创建文件评论失败 ${comment.filePath}:`, error);
        results.push({ 
          ...comment, 
          success: false, 
          type: 'file',
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      // 添加延迟避免触发速率限制
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return results;
  }

  private async withRetry<T>(operation: () => Promise<T>, retries: number = this.config.retries || 3): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= retries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (i === retries) {
          throw lastError;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
} 