// GitLab 相关类型
export interface GitLabMR {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  merged_at?: string;
  author: {
    id: number;
    name: string;
    username: string;
    email: string;
  };
  assignee?: {
    id: number;
    name: string;
    username: string;
    email: string;
  };
  source_branch: string;
  target_branch: string;
  web_url: string;
  changes_count: number;
  user_notes_count: number;
  upvotes: number;
  downvotes: number;
  labels: string[];
  milestone?: any;
  merge_status: string;
  has_conflicts: boolean;
  pipeline?: any;
}

export interface GitLabMRChange {
  old_path: string;
  new_path: string;
  a_mode: string;
  b_mode: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
  diff: string;
}

export interface GitLabMRChanges {
  id: number;
  iid: number;
  title: string;
  changes: GitLabMRChange[];
  overflow: boolean;
}

// 错误类型
export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class PluginError extends Error {
  constructor(
    message: string,
    public pluginName: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PluginError';
  }
}

export class ConfigError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ConfigError';
  }
} 