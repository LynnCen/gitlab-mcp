# Changelog

## [1.1.0] - 2025-01-14

### 🔄 Changed

- **重大更新**: 迁移从 `@gitbeaker/node` 到 `@gitbeaker/rest`
  - 更新到最新版本 43.0.0
  - 支持 Node.js、浏览器和 Deno 环境
  - 更好的 TypeScript 类型支持
  - 更稳定的 API 接口

### 📦 Dependencies

- ⬆️ 升级 `@gitbeaker/node@^35.8.1` → `@gitbeaker/rest@^43.0.0`
- ✅ 保持 `@modelcontextprotocol/sdk@^1.15.1`
- ✅ 保持 `zod@^3.22.4`

### 🛠️ Technical Details

- 更新导入语句从 `@gitbeaker/node` 到 `@gitbeaker/rest`
- 调整配置参数：`requestTimeout` → `queryTimeout`
- 完全向后兼容，无需更改配置文件

### 🎯 Benefits

- 📈 更好的性能和稳定性
- 🔧 更完整的 GitLab API 支持
- 🌐 跨平台兼容性（Node.js、浏览器、Deno）
- 📚 更好的文档和类型定义

## [1.0.0] - 2025-01-13

### 🎉 Initial Release

- 基于 MCP 协议的 GitLab 服务器
- 支持 stdio 传输方式
- 提供完整的 MR 操作工具集
- 配置化的 GitLab 实例支持 