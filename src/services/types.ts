/**
 * 业务服务层类型定义
 */

import type { GitLabMergeRequestChanges } from '../repositories/types.js';
import type { MergeRequestService } from './MergeRequestService.js';
import type { FileOperationService } from './FileOperationService.js';
import type { CodeReviewService } from './CodeReviewService.js';
import type { ProjectService } from './ProjectService.js';

// 服务接口类型别名
export type IMergeRequestService = MergeRequestService;
export type IFileOperationService = FileOperationService;
export type ICodeReviewService = CodeReviewService;
export type IProjectService = ProjectService;

/**
 * 合并请求变更选项
 */
export interface MergeRequestChangesOptions {
  /**
   * 是否包含文件内容
   */
  includeContent?: boolean;

  /**
   * 重点关注的文件列表
   */
  focusFiles?: string[];
}

/**
 * 合并请求变更结果
 */
export interface MergeRequestChangesResult {
  changes: GitLabMergeRequestChanges['changes'];
  summary: {
    totalFiles: number;
    additions: number;
    deletions: number;
    modifiedFiles: string[];
    newFiles: string[];
    deletedFiles: string[];
  };
}

/**
 * 文件操作选项
 */
export interface FileOperationOptions {
  /**
   * 分支或标签
   */
  ref?: string;

  /**
   * 是否包含内容
   */
  includeContent?: boolean;
}

