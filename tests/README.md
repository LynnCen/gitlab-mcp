# GitLab MCP Testing Framework

企业级TypeScript测试框架，用于验证GitLab MCP服务器功能。

## 🏗️ 架构概览

```
tests/
├── config/                    # 配置管理
│   ├── test-config.ts        # 统一配置类 (TypeScript)
│   ├── env.example           # 环境变量模板
│   └── .env                  # 实际环境配置 (git忽略)
├── integration/              # 集成测试
│   ├── mr-changes.test.ts    # 完整集成测试 (TypeScript)
│   └── quick.test.ts         # 快速验证测试 (TypeScript)
├── utils/                    # 工具库
│   ├── test-logger.ts        # 结构化日志系统 (TypeScript)
│   └── test-runner.ts        # 测试执行引擎 (TypeScript)
├── logs/                     # 自动生成日志目录
└── README.md                 # 本文档
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm (推荐) 或 npm
- TypeScript 项目环境
- tsx 执行器（已自动安装）

### 1. 环境配置

```bash
# 复制环境变量模板
cp tests/config/env.example tests/config/.env

# 编辑配置文件
vim tests/config/.env
```

### 2. 配置环境变量

```bash
# tests/config/.env
GITLAB_HOST=https://your-gitlab.com
GITLAB_TOKEN=your-personal-access-token
PROJECT_PATH=owner/project-name
MERGE_REQUEST_IID=123
INCLUDE_CONTENT=false
LOG_LEVEL=INFO
```

### 3. 运行测试

```bash
# 快速测试 (<5秒)
pnpm test:quick

# 完整集成测试
pnpm test

# 查看帮助
pnpm test:help
```

## 🧪 测试命令

| 命令 | 描述 | 执行时间 | 用途 |
|------|------|----------|------|
| `pnpm test:quick` | 快速验证测试 | <5秒 | 开发时快速检查 |
| `pnpm test` | 完整集成测试 | 10-30秒 | CI/CD和全面验证 |
| `pnpm test:integration` | 集成测试别名 | 10-30秒 | 同上 |
| `pnpm test:logs` | 查看日志文件 | 即时 | 调试和审查 |
| `pnpm test:clean` | 清理日志文件 | 即时 | 清理环境 |
| `pnpm test:help` | 显示帮助信息 | 即时 | 查看使用说明 |

## 📊 测试类型

### 快速测试 (quick.test.ts)

**目标**: 5秒内完成基本功能验证

**测试内容**:
- ✅ GitLab连接测试
- ✅ 项目访问权限验证  
- ✅ MR Changes API基本功能

**适用场景**:
- 开发环境快速验证
- pre-commit hooks
- 故障排查

### 集成测试 (mr-changes.test.ts)

**目标**: 全面验证MR Changes功能

**测试内容**:
- ✅ 配置加载和验证
- ✅ GitLab客户端初始化
- ✅ MR Changes数据结构验证
- ✅ 变更对象字段完整性
- ✅ 内容包含选项测试
- ✅ 错误处理机制验证

**适用场景**:
- CI/CD流水线
- 发布前验证
- 完整功能测试

## 🔧 TypeScript 特性

### 类型安全

所有测试文件都使用TypeScript编写，提供：
- 🔒 **编译时类型检查**：防止运行时类型错误
- 🎯 **智能代码补全**：提升开发效率
- 📚 **接口定义**：清晰的数据结构
- 🔄 **泛型支持**：灵活的类型处理

### 主要接口

```typescript
// 配置接口
interface GitLabConfig {
    host: string;
    token: string;
    projectPath: string;
    mergeRequestIid: number;
}

// 测试结果接口
interface TestResult<T = any> {
    success: boolean;
    data?: T;
    error?: Error;
    duration: number;
    timestamp: string;
}

// MR变更接口
interface MergeRequestChange {
    old_path: string;
    new_path: string;
    new_file: boolean;
    renamed_file: boolean;
    deleted_file: boolean;
    diff: string;
}
```

### 执行方式

使用 `tsx` 执行器直接运行TypeScript文件：

```bash
# 直接执行TypeScript文件
tsx tests/integration/quick.test.ts

# 带参数执行
tsx tests/integration/mr-changes.test.ts --verbose

# 查看帮助
tsx tests/integration/quick.test.ts --help
```

## 📁 核心组件

### TestConfig (TypeScript单例)

**功能**: 统一的配置管理系统

**特性**:
- ✅ 环境变量验证
- ✅ 单例模式确保一致性
- ✅ 类型安全的配置访问
- ✅ 配置覆盖支持

**使用示例**:
```typescript
import TestConfig from '../config/test-config.js';

const config = TestConfig.getInstance();
const gitlabConfig = config.gitlab; // 类型安全访问
```

### TestLogger (TypeScript多级日志)

**功能**: 结构化日志系统

**特性**:
- 🎨 彩色控制台输出
- 📝 文件持久化存储  
- 📊 日志统计分析
- 🔍 按级别过滤

**日志级别**:
```typescript
enum LogLevel {
    INFO = 'INFO',       // 信息 (青色)
    SUCCESS = 'SUCCESS', // 成功 (绿色)
    ERROR = 'ERROR',     // 错误 (红色)
    WARN = 'WARN'        // 警告 (黄色)
}
```

**使用示例**:
```typescript
import TestLogger from '../utils/test-logger.js';

const logger = TestLogger.getInstance();
logger.info('测试开始');
logger.success('测试通过', { duration: 1500 });
logger.error('测试失败', { error: 'Connection timeout' });
```

### TestRunner (TypeScript测试引擎)

**功能**: 测试执行和管理引擎

**特性**:
- ⏱️ 测试超时控制
- 📊 详细执行统计
- 🔄 测试套件支持
- 🎯 Builder模式API

**使用示例**:
```typescript
import TestRunner from '../utils/test-runner.js';

const runner = new TestRunner();
const suite = runner
    .createTestSuite('API Tests', 'GitLab API功能测试')
    .addTest('连接测试', async () => {
        // 测试逻辑
        return { success: true };
    })
    .addTest('数据测试', async () => {
        // 测试逻辑
        return { data: 'test' };
    }, { timeout: 5000 })
    .build();

const stats = await runner.runSuite(suite);
```

## 📊 日志系统

### 日志格式

```
[2024-01-15T10:30:45.123Z] [INFO] 🔧 Loading test configuration...
[2024-01-15T10:30:45.125Z] [SUCCESS] ✅ Connection successful - User: John Doe
[2024-01-15T10:30:45.200Z] [ERROR] ❌ Project access failed: 404 Not Found
```

### 日志文件

- **位置**: `tests/logs/test-YYYY-MM-DD.log`
- **格式**: 结构化时间戳 + 级别 + 消息 + 数据
- **保留**: 手动清理 (使用 `pnpm test:clean`)

### 日志统计

```bash
📊 Log Entries: 25 (2 errors, 1 warnings)
```

## 🚨 错误处理

### 配置错误

```bash
❌ Missing required environment variables: GITLAB_TOKEN, PROJECT_PATH
```

**解决方案**: 检查 `tests/config/.env` 文件配置

### 连接错误

```bash
❌ Connection failed: Request failed with status code 401
```

**解决方案**: 验证 `GITLAB_TOKEN` 和 `GITLAB_HOST` 正确性

### API错误

```bash
❌ Project access failed: 404 Project Not Found
```

**解决方案**: 确认 `PROJECT_PATH` 格式和访问权限

## 📈 最佳实践

### 开发工作流

1. **开发时**: 使用 `pnpm test:quick` 快速验证
2. **提交前**: 运行 `pnpm test` 完整测试  
3. **调试时**: 查看 `tests/logs/` 详细日志
4. **清理时**: 使用 `pnpm test:clean` 清理日志

### TypeScript最佳实践

1. **类型定义**: 为所有接口和返回值定义类型
2. **错误处理**: 使用类型断言和try-catch
3. **模块导入**: 使用ESM的.js扩展名（兼容性）
4. **配置验证**: 运行时验证配置类型安全

### 配置管理

1. **环境隔离**: 不同环境使用不同的 `.env` 文件
2. **密钥安全**: 确保 `.env` 文件在 `.gitignore` 中
3. **配置验证**: 启动时验证所有必需配置
4. **默认值**: 为可选配置提供合理默认值

### 测试策略

1. **分层测试**: 快速测试 + 集成测试
2. **并行执行**: 独立测试并行运行
3. **失败快速**: 关键测试失败时立即停止
4. **详细报告**: 提供足够的错误信息用于调试

## 🔄 持续集成

### GitHub Actions 示例

```yaml
name: Test GitLab MCP
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: pnpm install
      - run: pnpm build
      
      # 快速测试
      - name: Quick Test
        run: pnpm test:quick
        env:
          GITLAB_HOST: ${{ secrets.GITLAB_HOST }}
          GITLAB_TOKEN: ${{ secrets.GITLAB_TOKEN }}
          PROJECT_PATH: ${{ secrets.PROJECT_PATH }}
          MERGE_REQUEST_IID: ${{ secrets.MERGE_REQUEST_IID }}
      
      # 完整测试
      - name: Integration Test  
        run: pnpm test
        if: github.ref == 'refs/heads/main'
```

## 🛠️ 故障排查

### 常见问题

**Q: tsx命令未找到**
```bash
A: pnpm install 确保tsx已安装
```

**Q: TypeScript编译错误**
```bash
A: 检查tsconfig.json配置，确保包含tests目录
```

**Q: 模块导入失败**
```bash
A: 确保使用.js扩展名进行ES模块导入
```

**Q: 环境变量未加载**
```bash
A: 检查tests/config/.env文件存在且格式正确
```

### 调试模式

启用详细日志：
```bash
LOG_LEVEL=INFO tsx tests/integration/quick.test.ts
```

查看网络请求：
```bash
DEBUG=gitlab* tsx tests/integration/mr-changes.test.ts  
```

## 📞 技术支持

- **Issues**: 在项目仓库创建issue
- **文档**: 查看项目根目录README.md
- **日志**: 检查 `tests/logs/` 目录下的详细日志

---

**版本**: TypeScript v2.0.0  
**维护者**: Lynncen  
**更新时间**: 2024-01-15 