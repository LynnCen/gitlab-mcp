export interface GitLabConfig {
  host: string;
  token: string;
  timeout?: number;
  retries?: number;
}

export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar_url: string;
}

export interface GitLabProject {
  id: number;
  name: string;
  path: string;
  path_with_namespace: string;
  description: string;
  web_url: string;
  default_branch: string;
}

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: 'opened' | 'closed' | 'merged';
  author: GitLabUser;
  source_branch: string;
  target_branch: string;
  created_at: string;
  updated_at: string;
  web_url: string;
}

export interface GitLabFileChange {
  old_path: string;
  new_path: string;
  new_file: boolean;
  deleted_file: boolean;
  renamed_file: boolean;
  diff?: string;
}

export interface GitLabFile {
  file_path: string;
  file_name: string;
  size: number;
  encoding: string;
  content: string;
  content_sha256: string;
  ref: string;
  blob_id: string;
  commit_id: string;
  last_commit_id: string;
} 