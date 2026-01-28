# 核心接口设计文档

> **创建日期**: 2025-12-30  
> **状态**: 设计阶段

本文档定义了新架构中所有核心接口的设计，这些接口是系统的基础抽象层。

---

## 一、依赖注入接口

### 1.1 Container（DI 容器）

```typescript
interface Container {
  // 注册服务
  register<T>(token: Token<T>, factory: Factory<T>, options?: RegistrationOptions): void;
  
  // 解析服务
  resolve<T>(token: Token<T>): T;
  
  // 检查是否已注册
  isRegistered<T>(token: Token<T>): boolean;
  
  // 清除所有注册
  clear(): void;
}

interface RegistrationOptions {
  lifecycle?: 'singleton' | 'transient';
  scope?: string;
}
```

### 1.2 Token（服务标识）

```typescript
type Token<T> = string | symbol | Class<T>;

interface Class<T> {
  new (...args: any[]): T;
}
```

---

## 二、传输层接口

### 2.1 Transport（传输接口）

```typescript
interface Transport {
  readonly type: 'stdio' | 'http' | 'websocket';
  readonly name: string;
  
  // 启动传输
  start(): Promise<void>;
  
  // 停止传输
  stop(): Promise<void>;
  
  // 发送消息
  send(message: JsonRpcMessage): Promise<void>;
  
  // 接收消息事件
  onMessage(handler: (message: JsonRpcMessage) => void): void;
  
  // 错误事件
  onError(handler: (error: Error) => void): void;
  
  // 关闭事件
  onClose(handler: () => void): void;
  
  // 健康检查
  isHealthy(): boolean;
}

interface JsonRpcMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: JsonRpcError;
}

interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}
```

### 2.2 TransportManager（传输管理器）

```typescript
interface TransportManager {
  // 注册传输
  registerTransport(transport: Transport): void;
  
  // 启动所有传输
  startAll(): Promise<void>;
  
  // 停止所有传输
  stopAll(): Promise<void>;
  
  // 获取指定传输
  getTransport(type: string): Transport | undefined;
  
  // 获取所有传输
  getAllTransports(): Transport[];
}
```

---

## 三、能力层接口

### 3.1 Tool（工具接口）

```typescript
interface Tool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: ZodSchema;
  readonly outputSchema?: ZodSchema;
  readonly metadata?: ToolMetadata;
  
  // 执行工具
  execute(params: any, context: ExecutionContext): Promise<ToolResult>;
}

interface ToolMetadata {
  category?: string;
  tags?: string[];
  examples?: ToolExample[];
  deprecated?: boolean;
  version?: string;
  plugin?: string;
}

interface ToolExample {
  input: any;
  output: any;
  description?: string;
}

interface ExecutionContext {
  traceId: string;
  userId?: string;
  requestId: string;
  startTime: number;
  metadata: Map<string, any>;
}

interface ToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    uri?: string;
  }>;
  isError?: boolean;
}
```

### 3.2 ToolRegistry（工具注册表）

```typescript
interface ToolRegistry {
  // 注册工具
  registerTool(tool: Tool): void;
  
  // 注销工具
  unregisterTool(name: string): void;
  
  // 获取工具
  getTool(name: string): Tool | undefined;
  
  // 列出所有工具
  listTools(filter?: ToolFilter): ToolInfo[];
  
  // 执行工具
  executeTool(name: string, params: any, context: ExecutionContext): Promise<ToolResult>;
}

interface ToolFilter {
  category?: string;
  tags?: string[];
  plugin?: string;
  deprecated?: boolean;
}

interface ToolInfo {
  name: string;
  description: string;
  category?: string;
  tags?: string[];
  plugin?: string;
  deprecated?: boolean;
}
```

### 3.3 Resource（资源接口）

```typescript
interface Resource {
  readonly uri: string;
  readonly name: string;
  readonly description: string;
  readonly mimeType: string;
  readonly size?: number;
  readonly metadata?: Record<string, any>;
  readonly cacheable: boolean;
  readonly subscribable: boolean;
  
  // 获取资源内容
  getContent(): Promise<ResourceContent>;
  
  // 订阅变更（如果支持）
  subscribe?(callback: (content: ResourceContent) => void): () => void;
}

interface ResourceContent {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: Blob;
  size?: number;
  metadata?: Record<string, any>;
}
```

### 3.4 ResourceRegistry（资源注册表）

```typescript
interface ResourceRegistry {
  // 注册资源
  registerResource(resource: Resource): void;
  
  // 注销资源
  unregisterResource(uri: string): void;
  
  // 获取资源
  getResource(uri: string): Resource | undefined;
  
  // 列出所有资源
  listResources(filter?: ResourceFilter): ResourceInfo[];
  
  // 解析 URI
  resolveUri(uri: string): Resource | undefined;
}

interface ResourceFilter {
  scheme?: string;
  mimeType?: string;
  cacheable?: boolean;
}

interface ResourceInfo {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}
```

### 3.5 Prompt（提示接口）

```typescript
interface Prompt {
  readonly name: string;
  readonly description: string;
  readonly arguments: PromptArgument[];
  readonly template: string;
  readonly version: string;
  readonly examples?: PromptExample[];
  
  // 渲染提示
  render(args: Record<string, any>): Promise<string>;
}

interface PromptArgument {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  default?: any;
}

interface PromptExample {
  arguments: Record<string, any>;
  output: string;
  description?: string;
}
```

### 3.6 PromptRegistry（提示注册表）

```typescript
interface PromptRegistry {
  // 注册提示
  registerPrompt(prompt: Prompt): void;
  
  // 注销提示
  unregisterPrompt(name: string): void;
  
  // 获取提示
  getPrompt(name: string): Prompt | undefined;
  
  // 列出所有提示
  listPrompts(filter?: PromptFilter): PromptInfo[];
  
  // 渲染提示
  renderPrompt(name: string, args: Record<string, any>): Promise<string>;
}

interface PromptFilter {
  version?: string;
  tags?: string[];
}

interface PromptInfo {
  name: string;
  description: string;
  arguments: PromptArgument[];
  version: string;
}
```

---

## 四、中间件接口

### 4.1 Middleware（中间件接口）

```typescript
interface Middleware {
  readonly name: string;
  readonly priority: number;
  
  // 执行中间件
  execute(
    context: MiddlewareContext,
    next: () => Promise<any>
  ): Promise<any>;
}

interface MiddlewareContext {
  request: ToolRequest | ResourceRequest | PromptRequest;
  response?: any;
  metadata: Map<string, any>;
  startTime: number;
  traceId: string;
  userId?: string;
}

interface ToolRequest {
  type: 'tool';
  toolName: string;
  params: any;
}

interface ResourceRequest {
  type: 'resource';
  uri: string;
}

interface PromptRequest {
  type: 'prompt';
  promptName: string;
  args: Record<string, any>;
}
```

### 4.2 MiddlewareChain（中间件链）

```typescript
interface MiddlewareChain {
  // 添加中间件
  use(middleware: Middleware): void;
  
  // 执行中间件链
  execute(context: MiddlewareContext, handler: () => Promise<any>): Promise<any>;
  
  // 清除所有中间件
  clear(): void;
}
```

---

## 五、日志接口

### 5.1 Logger（日志接口）

```typescript
interface Logger {
  // 日志级别方法
  trace(message: string, context?: object): void;
  debug(message: string, context?: object): void;
  info(message: string, context?: object): void;
  warn(message: string, context?: object): void;
  error(message: string, error?: Error, context?: object): void;
  fatal(message: string, error?: Error, context?: object): void;
  
  // 创建子 logger（带上下文）
  child(context: object): Logger;
  
  // 设置日志级别
  setLevel(level: LogLevel): void;
  
  // 获取日志级别
  getLevel(): LogLevel;
}

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
```

---

## 六、错误处理接口

### 6.1 BaseError（错误基类）

```typescript
abstract class BaseError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BusinessError extends BaseError {
  constructor(code: string, message: string, details?: any) {
    super(code, message, details);
  }
}

class SystemError extends BaseError {
  constructor(code: string, message: string, details?: any) {
    super(code, message, details);
  }
}

class GitLabApiError extends BaseError {
  constructor(
    public readonly statusCode: number,
    code: string,
    message: string,
    details?: any
  ) {
    super(code, message, details);
  }
}
```

### 6.2 ErrorHandler（错误处理器）

```typescript
interface ErrorHandler {
  // 处理错误
  handle(error: Error, context?: ErrorContext): Promise<ErrorResponse>;
  
  // 转换为 MCP 错误格式
  toMcpError(error: Error): JsonRpcError;
}

interface ErrorContext {
  traceId?: string;
  userId?: string;
  request?: any;
}

interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  traceId?: string;
}
```

---

## 七、配置管理接口

### 7.1 ConfigProvider（配置提供者）

```typescript
interface ConfigProvider {
  // 获取配置值
  get<T = any>(key: string, defaultValue?: T): T;
  
  // 检查配置是否存在
  has(key: string): boolean;
  
  // 获取所有配置
  getAll(): Record<string, any>;
  
  // 重新加载配置
  reload(): Promise<void>;
}
```

### 7.2 ConfigManager（配置管理器）

```typescript
interface ConfigManager {
  // 获取配置
  getConfig(): ServerConfig;
  
  // 获取 GitLab 配置
  getGitLabConfig(): GitLabConfig;
  
  // 获取服务器配置
  getServerConfig(): ServerConfig;
  
  // 获取中间件配置
  getMiddlewareConfig(): MiddlewareConfig;
  
  // 获取插件配置
  getPluginsConfig(): PluginsConfig;
  
  // 重新加载配置
  reload(): Promise<void>;
}
```

---

## 八、缓存接口

### 8.1 CacheProvider（缓存提供者）

```typescript
interface CacheProvider {
  // 获取缓存
  get<T>(key: string): Promise<T | null>;
  
  // 设置缓存
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  
  // 删除缓存
  delete(key: string): Promise<void>;
  
  // 清除所有缓存
  clear(pattern?: string): Promise<void>;
  
  // 检查缓存是否存在
  exists(key: string): Promise<boolean>;
  
  // 获取剩余 TTL
  getTtl(key: string): Promise<number | null>;
}
```

---

## 九、插件接口

### 9.1 Plugin（插件接口）

```typescript
interface Plugin {
  readonly metadata: PluginMetadata;
  
  // 初始化插件
  initialize(context: PluginContext): Promise<void>;
  
  // 注册能力
  register(registry: CapabilityRegistry): void;
  
  // 启动插件
  start(): Promise<void>;
  
  // 停止插件
  stop(): Promise<void>;
  
  // 销毁插件
  destroy(): Promise<void>;
}

interface PluginMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
  homepage?: string;
  dependencies?: string[];
  mcpVersion: string;
}

interface PluginContext {
  container: Container;
  logger: Logger;
  config: ConfigProvider;
}

interface CapabilityRegistry {
  tools: ToolRegistry;
  resources: ResourceRegistry;
  prompts: PromptRegistry;
}
```

### 9.2 PluginRegistry（插件注册表）

```typescript
interface PluginRegistry {
  // 注册插件
  registerPlugin(plugin: Plugin): void;
  
  // 注销插件
  unregisterPlugin(name: string): void;
  
  // 获取插件
  getPlugin(name: string): Plugin | undefined;
  
  // 列出所有插件
  listPlugins(): PluginInfo[];
  
  // 加载插件
  loadPlugin(path: string): Promise<Plugin>;
  
  // 初始化所有插件
  initializeAll(): Promise<void>;
  
  // 启动所有插件
  startAll(): Promise<void>;
  
  // 停止所有插件
  stopAll(): Promise<void>;
}

interface PluginInfo {
  name: string;
  version: string;
  author: string;
  description: string;
  status: 'initialized' | 'started' | 'stopped' | 'error';
}
```

---

## 十、数据访问层接口

### 10.1 GitLabRepository（GitLab 仓储）

```typescript
interface GitLabRepository {
  // 项目相关
  getProject(projectId: string | number): Promise<Project>;
  
  // MR 相关
  getMergeRequest(projectId: string | number, mrIid: number): Promise<MergeRequest>;
  getMergeRequestChanges(projectId: string | number, mrIid: number): Promise<MRChanges>;
  getMergeRequestVersions(projectId: string | number, mrIid: number): Promise<MRVersion[]>;
  getMergeRequestCommits(projectId: string | number, mrIid: number): Promise<Commit[]>;
  listMergeRequests(projectId: string | number, options?: MRListOptions): Promise<MergeRequest[]>;
  
  // 文件相关
  getFile(projectId: string | number, filePath: string, ref: string): Promise<File>;
  
  // 评论相关
  createNote(projectId: string | number, mrIid: number, body: string): Promise<Note>;
  createDiscussion(projectId: string | number, mrIid: number, body: string, position?: Position): Promise<Discussion>;
  
  // 更新操作
  updateMergeRequest(projectId: string | number, mrIid: number, updates: MRUpdates): Promise<MergeRequest>;
  
  // 测试连接
  testConnection(): Promise<{ success: boolean; user?: any; error?: string }>;
}
```

---

## 十一、业务服务接口

### 11.1 MergeRequestService（MR 服务）

```typescript
interface MergeRequestService {
  // 获取 MR 详情
  getMergeRequest(projectPath: string, mrIid: number): Promise<MergeRequest>;
  
  // 获取 MR 变更
  getMergeRequestChanges(
    projectPath: string,
    mrIid: number,
    options?: MRChangesOptions
  ): Promise<MergeRequestChanges>;
  
  // 更新 MR 描述
  updateMergeRequestDescription(
    projectPath: string,
    mrIid: number,
    description: string,
    userId?: string
  ): Promise<MergeRequest>;
  
  // 列出 MR
  listMergeRequests(projectPath: string, filter: MRFilter): Promise<MergeRequest[]>;
}
```

### 11.2 CodeReviewService（代码审查服务）

```typescript
interface CodeReviewService {
  // 分析 MR 变更
  analyzeMergeRequest(
    projectPath: string,
    mrIid: number,
    options?: AnalyzeOptions
  ): Promise<AnalysisResult>;
  
  // 应用审查规则
  applyReviewRules(
    analysis: AnalysisResult,
    rules?: CustomRules
  ): Promise<ReviewComment[]>;
  
  // 推送审查评论
  pushReviewComments(
    projectPath: string,
    mrIid: number,
    comments: ReviewComment[],
    options?: PushOptions
  ): Promise<PushResult>;
  
  // 完整审查流程
  reviewMergeRequest(
    projectPath: string,
    mrIid: number,
    options?: ReviewOptions
  ): Promise<ReviewReport>;
}
```

---

## 十二、类型定义

### 12.1 通用类型

```typescript
// 项目类型
interface Project {
  id: number;
  name: string;
  path: string;
  path_with_namespace: string;
  description: string;
  web_url: string;
  default_branch: string;
}

// MR 类型
interface MergeRequest {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: 'opened' | 'closed' | 'merged';
  author: User;
  source_branch: string;
  target_branch: string;
  created_at: string;
  updated_at: string;
  web_url: string;
}

// 用户类型
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar_url: string;
}
```

---

## 十三、接口设计原则

### 13.1 单一职责原则
- 每个接口只负责一个明确的功能
- 接口方法应该高度内聚

### 13.2 依赖倒置原则
- 高层模块不依赖低层模块，都依赖抽象
- 通过接口定义依赖关系

### 13.3 接口隔离原则
- 接口应该小而专一
- 客户端不应该依赖它不需要的接口

### 13.4 开闭原则
- 对扩展开放，对修改关闭
- 通过接口扩展功能，而不是修改现有接口

---

## 十四、下一步

1. 确认接口设计
2. 开始实现核心接口
3. 编写接口的单元测试
4. 实现具体类

