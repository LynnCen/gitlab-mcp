# 贡献指南

感谢您对 GitLab MCP Server 项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 Bug 报告
- 💡 功能建议
- 📝 文档改进
- 🔧 代码贡献
- 🧪 测试用例
- 🌍 国际化翻译

## 📋 开始之前

在开始贡献之前，请确保您已经：

1. ⭐ 给项目点了 star（这对我们很重要！）
2. 📖 阅读了 [README.md](README.md)
3. 🔍 检查了 [Issues](https://github.com/your-username/gitlab-mcp-server/issues) 确保没有重复的问题
4. 💬 加入了我们的 [Discussions](https://github.com/your-username/gitlab-mcp-server/discussions)

## 🐛 Bug 报告

如果您发现了 bug，请按照以下步骤报告：

### 报告前检查

- [ ] 确认这是一个真正的 bug，而不是使用方法问题
- [ ] 检查是否已有相关的 issue
- [ ] 尝试在最新版本中重现问题

### Bug 报告模板

```markdown
## Bug 描述
简明扼要地描述问题。

## 重现步骤
1. 执行 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## 期望行为
描述您期望发生的情况。

## 实际行为
描述实际发生的情况。

## 环境信息
- OS: [e.g. macOS 13.0]
- Node.js: [e.g. 18.17.0]
- Package Version: [e.g. 1.0.0]
- GitLab Version: [e.g. 16.5.0]

## 额外信息
添加任何其他相关信息，如截图、日志等。
```

## 💡 功能建议

我们很乐意听到您的想法！请按照以下格式提交功能建议：

### 功能建议模板

```markdown
## 功能描述
清晰地描述您希望添加的功能。

## 问题或需求
这个功能要解决什么问题？为什么需要这个功能？

## 解决方案
详细描述您期望的解决方案。

## 替代方案
描述您考虑过的任何替代解决方案或功能。

## 额外信息
添加任何其他相关信息或截图。
```

## 🔧 代码贡献

### 开发环境设置

1. **Fork 仓库**
   ```bash
   # 克隆您 fork 的仓库
   git clone https://github.com/your-username/gitlab-mcp-server.git
   cd gitlab-mcp-server
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置环境**
   ```bash
   cp env.example .env
   # 编辑 .env 文件，添加您的 GitLab token
   ```

4. **运行开发服务器**
   ```bash
   pnpm run dev
   ```

### 开发流程

1. **创建功能分支**
   ```bash
   git checkout -b feature/amazing-feature
   # 或
   git checkout -b fix/bug-description
   ```

2. **编写代码**
   - 遵循现有的代码风格
   - 添加适当的注释
   - 编写测试用例

3. **运行测试**
   ```bash
   # 运行所有测试
   pnpm test
   
   # 运行代码检查
   pnpm run lint
   
   # 修复格式问题
   pnpm run lint:fix
   ```

4. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **推送到远程**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **创建 Pull Request**
   - 使用描述性的标题
   - 详细描述更改内容
   - 关联相关的 Issues

### 代码风格

我们使用以下工具确保代码质量：

- **TypeScript** - 类型安全
- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **Jest** - 单元测试

### 提交消息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### 类型说明

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI/CD 相关
- `perf`: 性能优化
- `revert`: 回滚提交

#### 示例

```bash
feat(gitlab): add MR approval status check
fix(cache): resolve memory leak in cache cleanup
docs(readme): update installation instructions
test(plugins): add unit tests for GitLab plugin
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test -- --testPathPattern=gitlab

# 运行测试并生成覆盖率报告
pnpm test -- --coverage

# 监听模式运行测试
pnpm test:watch
```

### 编写测试

- 为新功能编写单元测试
- 确保测试覆盖率不低于现有水平
- 使用描述性的测试名称
- 遵循 AAA 模式（Arrange, Act, Assert）

```typescript
describe('GitLabPlugin', () => {
  it('should return MR info when valid project path and MR ID provided', async () => {
    // Arrange
    const plugin = new GitLabPlugin(mockContext);
    const projectPath = 'owner/repo';
    const mrIid = 1;

    // Act
    const result = await plugin.handleToolCall('gitlab_get_mr_info', {
      projectPath,
      mrIid
    });

    // Assert
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.title).toBeTruthy();
  });
});
```

## 📝 文档贡献

### 文档类型

- **README.md** - 项目主要文档
- **API 文档** - 代码中的 JSDoc 注释
- **使用示例** - 实际使用场景的代码示例
- **故障排除** - 常见问题和解决方案

### 文档规范

- 使用清晰、简洁的语言
- 提供代码示例
- 添加适当的链接
- 使用 emoji 增强可读性
- 保持中英文对照（如需要）

## 🌍 国际化

我们欢迎多语言支持的贡献：

- 翻译 README 和文档
- 本地化错误消息
- 添加多语言示例

## 📦 发布流程

项目维护者负责版本发布，但贡献者可以：

- 建议版本号升级
- 报告发布相关问题
- 协助测试预发布版本

### 版本规范

我们遵循 [Semantic Versioning](https://semver.org/)：

- `MAJOR.MINOR.PATCH`
- **MAJOR**: 不兼容的 API 更改
- **MINOR**: 向后兼容的新功能
- **PATCH**: 向后兼容的 bug 修复

## 🤝 社区准则

### 行为准则

我们致力于提供一个友好、安全和包容的环境：

- 💬 **友善交流** - 尊重不同观点和经验
- 🤝 **协作共赢** - 专注于对社区最有利的事情
- 💡 **建设性反馈** - 优雅地给予和接受建设性批评
- 🌟 **相互学习** - 承认错误并从中学习

### 沟通渠道

- **GitHub Issues** - Bug 报告和功能请求
- **GitHub Discussions** - 一般讨论和问答
- **Pull Requests** - 代码审查和讨论

## 🏆 贡献者认可

我们重视每一个贡献！贡献者将获得：

- 🎖️ **GitHub 贡献者标识**
- 📝 **CHANGELOG 中的致谢**
- 🌟 **项目 README 中的特别感谢**
- 🎁 **纪念品**（重大贡献）

## ❓ 常见问题

### Q: 我不知道从哪里开始？

A: 查看标有 `good first issue` 或 `help wanted` 的 Issues，这些通常适合新贡献者。

### Q: 我的 PR 被拒绝了怎么办？

A: 不要气馁！阅读反馈，进行必要的更改，或者询问如何改进。

### Q: 如何保持我的 fork 同步？

A: 
```bash
git remote add upstream https://github.com/original/gitlab-mcp-server.git
git fetch upstream
git checkout main
git merge upstream/main
```

### Q: 我可以贡献其他语言的插件吗？

A: 当前我们专注于 TypeScript/JavaScript，但欢迎讨论多语言支持。

## 📞 联系我们

如果您有任何问题或需要帮助：

- 📧 **Email**: [your-email@example.com](mailto:your-email@example.com)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-username/gitlab-mcp-server/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/gitlab-mcp-server/issues)

---

再次感谢您的贡献！您的参与让这个项目变得更好。💜 