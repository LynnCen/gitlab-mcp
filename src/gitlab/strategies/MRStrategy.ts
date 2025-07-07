import { GitLabClient } from '../GitLabClient.js';

/**
 * MR 变更文件信息
 */
export interface MRChangeFile {
  oldPath: string;
  newPath: string;
  changeType: 'added' | 'modified' | 'deleted' | 'renamed';
  diff?: string;
  content?: string;
}

/**
 * MR 变更摘要
 */
export interface MRChangesSummary {
  totalFiles: number;
  addedFiles: number;
  modifiedFiles: number;
  deletedFiles: number;
  renamedFiles: number;
}

/**
 * MR 变更结果
 */
export interface MRChangesResult {
  changes: MRChangeFile[];
  summary: MRChangesSummary;
  mr: {
    id: number;
    iid: number;
    title: string;
    state: string;
    source_branch: string;
    target_branch: string;
  };
}

/**
 * MR 策略 - 策略模式
 * 处理 MR 相关的业务逻辑
 */
export class MRStrategy {
  constructor(private gitlabClient: GitLabClient) {}

  /**
   * 获取 MR 变更文件列表
   */
  async getMRChanges(
    projectPath: string,
    mrIid: number,
    includeContent: boolean = false
  ): Promise<MRChangesResult> {
    try {
      // 获取项目信息
      const project = await this.gitlabClient.withRetry(() =>
        this.gitlabClient.getProject(projectPath)
      );

      // 获取 MR 信息
      const mr = await this.gitlabClient.withRetry(() =>
        this.gitlabClient.getMergeRequest(project.id, mrIid)
      );

      // 获取 MR 变更
      const changes = await this.gitlabClient.withRetry(() =>
        this.gitlabClient.getMergeRequestChanges(project.id, mrIid)
      );

      // 处理变更文件
      const processedChanges: MRChangeFile[] = [];
      let addedFiles = 0;
      let modifiedFiles = 0;
      let deletedFiles = 0;
      let renamedFiles = 0;

      for (const change of changes.changes) {
        // 确定变更类型
        let changeType: 'added' | 'modified' | 'deleted' | 'renamed';
        
        if (change.new_file) {
          changeType = 'added';
          addedFiles++;
        } else if (change.deleted_file) {
          changeType = 'deleted';
          deletedFiles++;
        } else if (change.renamed_file) {
          changeType = 'renamed';
          renamedFiles++;
        } else {
          changeType = 'modified';
          modifiedFiles++;
        }

        const processedChange: MRChangeFile = {
          oldPath: change.old_path,
          newPath: change.new_path,
          changeType,
        };

        // 如果需要包含 diff
        if (includeContent && change.diff) {
          processedChange.diff = change.diff;
        }

        // 如果需要包含文件内容且文件未被删除
        if (includeContent && !change.deleted_file) {
          try {
            const fileContent = await this.gitlabClient.withRetry(() =>
              this.gitlabClient.getFileContent(project.id, change.new_path, mr.sha)
            );
            
            // 解码 base64 内容
            if (fileContent.encoding === 'base64') {
              processedChange.content = Buffer.from(fileContent.content, 'base64').toString('utf-8');
            } else {
              processedChange.content = fileContent.content;
            }
          } catch (error) {
            console.warn(`无法获取文件内容: ${change.new_path}`, error);
          }
        }

        processedChanges.push(processedChange);
      }

      const summary: MRChangesSummary = {
        totalFiles: changes.changes.length,
        addedFiles,
        modifiedFiles,
        deletedFiles,
        renamedFiles,
      };

      return {
        changes: processedChanges,
        summary,
        mr: {
          id: mr.id,
          iid: mr.iid,
          title: mr.title,
          state: mr.state,
          source_branch: mr.source_branch,
          target_branch: mr.target_branch,
        },
      };
    } catch (error) {
      throw new Error(
        `获取 MR 变更失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 获取 MR 基本信息
   */
  async getMRInfo(projectPath: string, mrIid: number): Promise<any> {
    try {
      const project = await this.gitlabClient.withRetry(() =>
        this.gitlabClient.getProject(projectPath)
      );

      return await this.gitlabClient.withRetry(() =>
        this.gitlabClient.getMergeRequest(project.id, mrIid)
      );
    } catch (error) {
      throw new Error(
        `获取 MR 信息失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 获取项目 MR 列表
   */
  async listMRs(
    projectPath: string,
    options: {
      state?: 'opened' | 'closed' | 'merged' | 'all';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<any[]> {
    try {
      const project = await this.gitlabClient.withRetry(() =>
        this.gitlabClient.getProject(projectPath)
      );

      return await this.gitlabClient.withRetry(() =>
        this.gitlabClient.getMergeRequests(project.id, options)
      );
    } catch (error) {
      throw new Error(
        `获取 MR 列表失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
} 