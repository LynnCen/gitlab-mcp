# 文档目录

本文档目录包含项目重构相关的所有文档。

## 文档结构

```
docs/
├── README.md                    # 本文档
├── api/                         # API 文档
│   ├── tools/                   # 工具 API 文档
│   ├── resources/               # 资源 API 文档
│   └── prompts/                 # 提示 API 文档
├── developers/                  # 开发者指南
│   ├── plugin-development.md    # 插件开发指南
│   └── contributing.md          # 贡献指南
├── decisions/                   # 设计决策记录
│   └── tech-stack.md            # 技术选型文档
├── design/                      # 设计文档
│   └── interfaces.md            # 核心接口设计
└── benchmarks/                  # 性能基准
    └── baseline.md              # 性能基准数据
```

## 文档说明

### API 文档
- **tools/**: 所有工具的详细 API 说明
- **resources/**: 所有资源的 URI 规范和说明
- **prompts/**: 所有提示模板的参数和使用说明

### 开发者指南
- **plugin-development.md**: 如何开发插件的详细教程
- **contributing.md**: 如何贡献代码的流程说明

### 设计决策
- **tech-stack.md**: 技术选型的详细分析和决策过程

### 设计文档
- **interfaces.md**: 所有核心接口的详细定义

### 性能基准
- **baseline.md**: 重构前的性能基准数据，用于对比

## 文档更新原则

1. **同步更新**: 代码变更时同步更新相关文档
2. **版本控制**: 重要设计决策记录版本和日期
3. **示例代码**: 文档中包含可运行的示例代码
4. **清晰易懂**: 使用图表和示例说明复杂概念

