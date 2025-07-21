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

// AI代码审查相关类型定义
export interface AICodeReviewConfig {
  enabled: boolean;
  llmProvider: 'openai' | 'claude' | 'gemini' | 'local';
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  autoComment: boolean;
  reviewDepth: 'quick' | 'standard' | 'thorough';
}

export interface CodeReviewIssue {
  line_number?: number;
  severity: 'critical' | 'warning' | 'suggestion';
  category: string;
  title: string;
  description: string;
  suggestion: string;
  auto_fixable: boolean;
  rule_source: string;
}

export interface AICodeReviewResult {
  file_path: string;
  overall_score: number;
  issues: CodeReviewIssue[];
  suggestions: string[];
  compliance_status: 'PASS' | 'WARNING' | 'CRITICAL';
}

export interface CodeReviewRules {
  focus_areas: string[];
  specific_rules: string[];
  ignore_patterns: string[];
  severity_mapping: {
    [rule: string]: 'critical' | 'warning' | 'suggestion';
  };
}

export interface FileFilterConfig {
  includedExtensions: string[];
  excludePatterns: RegExp[];
  maxFileSize: number;
  maxDiffLines: number;
}

export interface CodeReviewReport {
  summary: {
    files_reviewed: number;
    total_issues: number;
    critical_issues: number;
    warnings: number;
    suggestions: number;
    average_score: number;
    overall_status: 'PASS' | 'WARNING' | 'CRITICAL';
  };
  recommendations: string[];
  review_metadata: {
    reviewed_by: string;
    review_time: string;
    mr_info: {
      title: string;
      author: string;
      changes_count: number;
    };
  };
} 