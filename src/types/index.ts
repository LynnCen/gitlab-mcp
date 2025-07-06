import { z } from 'zod';

// 基础配置类型
export const ConfigSchema = z.object({
  gitlab: z.object({
    host: z.string().url(),
    token: z.string().min(1),
  }),
  server: z.object({
    name: z.string().default('gitlab-mcp-server'),
    version: z.string().default('1.0.0'),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }),
  plugins: z.record(z.string(), z.boolean()).default({}),
  cache: z.object({
    enabled: z.boolean().default(true),
    ttl: z.number().positive().default(300),
  }).default({}),
});

export type Config = z.infer<typeof ConfigSchema>;

// MCP 工具类型
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

// 插件系统类型
export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies?: string[];
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
  };
}

export interface PluginContext {
  config: Config;
  logger: Logger;
  cache?: CacheManager;
}

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export interface CacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
}

// GitLab 特定类型
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