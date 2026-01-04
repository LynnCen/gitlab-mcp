# 测试文档

## 目录结构

```
tests-v2/
├── README.md              # 本文档
├── unit/                  # 单元测试
├── integration/           # 集成测试
│   └── baseline.test.ts   # 基线集成测试（功能基准）
└── benchmarks/            # 性能基准测试
    └── performance-baseline.ts  # 性能基准测试脚本
```

## 测试类型

### 单元测试
- 位置：`tests-v2/unit/`
- 用途：测试单个模块的功能
- 工具：Vitest
- 覆盖率目标：80%+

### 集成测试
- 位置：`tests-v2/integration/`
- 用途：测试模块间的协作
- 工具：Vitest
- 特殊测试：`baseline.test.ts` - 作为功能基准，确保重构后功能不变

### 性能基准测试
- 位置：`tests-v2/benchmarks/`
- 用途：收集性能基准数据
- 工具：自定义脚本
- 输出：`docs/benchmarks/baseline-data.json` 和 `baseline.md`

## 运行测试

### 运行所有测试
```bash
pnpm test:v2
```

### 运行单元测试
```bash
pnpm test:v2 -- tests-v2/unit
```

### 运行集成测试
```bash
pnpm test:v2 -- tests-v2/integration
```

### 运行性能基准测试
```bash
tsx tests-v2/benchmarks/performance-baseline.ts
```

### 查看测试覆盖率
```bash
pnpm test:v2:coverage
```

## 基线测试说明

`baseline.test.ts` 是重构前的功能基准测试，用于：

1. **功能验证**：确保所有工具正常工作
2. **输出对比**：重构后对比输出格式是否一致
3. **回归测试**：确保重构不破坏现有功能

**重要**：这些测试的结果将作为重构后的对比基准。

## 性能基准说明

`performance-baseline.ts` 收集以下性能数据：

1. **工具响应时间**：P50、P95、P99
2. **内存使用**：启动时、空闲时、峰值
3. **并发能力**：不同并发级别的成功率

**使用方法**：
```bash
# 设置测试环境变量
export GITLAB_HOST=https://gitlab.com
export GITLAB_TOKEN=your-token
export TEST_PROJECT_PATH=owner/repo
export TEST_MR_IID=123

# 运行基准测试
tsx tests-v2/benchmarks/performance-baseline.ts
```

测试结果将保存到：
- `docs/benchmarks/baseline-data.json`（JSON 格式）
- `docs/benchmarks/baseline.md`（Markdown 格式）

