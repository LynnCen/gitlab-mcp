/**
 * 数据访问层类型定义
 */

/**
 * GitLab 用户信息
 */
export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  email?: string;
  avatar_url?: string;
  web_url?: string;
  state?: string;
  [key: string]: unknown;
}

/**
 * GitLab 项目信息
 */
export interface GitLabProject {
  id: number;
  name: string;
  path: string;
  path_with_namespace: string;
  description?: string;
  default_branch?: string;
  web_url: string;
  [key: string]: unknown;
}

/**
 * GitLab 合并请求信息
 */
export interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  description?: string;
  state: string;
  merged_at?: string;
  created_at: string;
  updated_at: string;
  author: GitLabUser;
  source_branch: string;
  target_branch: string;
  web_url?: string;
  [key: string]: unknown;
}

/**
 * GitLab 合并请求变更信息
 */
export interface GitLabMergeRequestChanges {
  changes: Array<{
    old_path: string;
    new_path: string;
    a_mode?: string;
    b_mode?: string;
    diff: string;
    new_file: boolean;
    renamed_file: boolean;
    deleted_file: boolean;
  }>;
  [key: string]: unknown;
}

/**
 * GitLab 文件内容
 */
export interface GitLabFile {
  file_name: string;
  file_path: string;
  size: number;
  encoding: string;
  content: string;
  content_sha256: string;
  ref: string;
  blob_id: string;
  commit_id: string;
  [key: string]: unknown;
}

/**
 * GitLab 评论/Note
 */
export interface GitLabNote {
  id: number;
  body: string;
  author: GitLabUser;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

/**
 * GitLab 讨论/Discussion
 */
export interface GitLabDiscussion {
  id: string;
  notes: GitLabNote[];
  [key: string]: unknown;
}

/**
 * GitLab 提交信息
 */
export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committer_name: string;
  committer_email: string;
  committed_date: string;
  [key: string]: unknown;
}

/**
 * GitLab MR 版本信息
 */
export interface GitLabMRVersion {
  id: number;
  head_commit_sha: string;
  base_commit_sha: string;
  start_commit_sha: string;
  created_at: string;
  [key: string]: unknown;
}

/**
 * 行内评论位置
 */
export interface GitLabPosition {
  base_sha: string;
  start_sha: string;
  head_sha: string;
  old_path: string;
  new_path: string;
  position_type: 'text' | 'image';
  new_line?: number;
  old_line?: number;
  [key: string]: unknown;
}

