# GitLab MCP 服务器使用示例

## 快速开始

### 1. 构建项目

```bash
pnpm install
pnpm run build
```

### 2. 设置环境变量

```bash
export GITLAB_HOST="https://gitlab.com"
export GITLAB_TOKEN="your-gitlab-token"
```

### 3. 在Cursor中配置

将以下配置添加到Cursor的MCP设置中：

```json
{
  "mcpServers": {
    "gitlab-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/gitlab-mcp/dist/src/index.js"],
      "env": {
        "GITLAB_HOST": "https://gitlab.com",
        "GITLAB_TOKEN": "your-gitlab-token"
      }
    }
  }
}
```

## 使用示例

### 获取合并请求信息

```
请获取项目 owner/project 中 MR #123 的详细信息
```

### 获取合并请求变更

```
请获取项目 owner/project 中 MR #123 的文件变更列表，包含diff内容
```

### 获取文件内容

```
请获取项目 owner/project 中 src/index.ts 文件的内容
```

### 列出合并请求

```
请列出项目 owner/project 中所有打开的合并请求
```

## 工具列表

- `get_merge_request` - 获取合并请求详情
- `get_merge_request_changes` - 获取合并请求变更
- `get_file_content` - 获取文件内容
- `list_merge_requests` - 列出合并请求

## 故障排除

如果遇到问题，请检查：

1. GitLab token是否有效且有足够权限
2. 项目路径格式是否正确 (owner/project)
3. 环境变量是否正确设置
4. GitLab服务器是否可以访问

## 开发建议

- 使用`pnpm run dev`进行开发时自动编译
- 修改代码后需要重新构建：`pnpm run build`
- 在Cursor中重新加载MCP配置以获取最新版本 