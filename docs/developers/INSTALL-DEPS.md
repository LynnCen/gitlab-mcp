# 依赖安装说明

由于网络限制，依赖需要手动安装。请按照以下步骤操作：

## 一、安装生产依赖

```bash
pnpm add tsyringe reflect-metadata pino pino-pretty node-cache fastify @fastify/cors
```

## 二、安装开发依赖

```bash
pnpm install
```

这将安装所有在 `package.json` 中定义的开发依赖。

## 三、初始化 Husky

```bash
npx husky install
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

## 四、验证安装

```bash
# 检查依赖
pnpm list --depth=0

# 类型检查
pnpm type-check:v2

# 运行测试（应该会失败，因为还没有测试代码）
pnpm test:v2
```

## 五、如果遇到问题

### 问题 1: pnpm 版本不匹配

```bash
# 更新 pnpm
corepack use pnpm@latest

# 重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 问题 2: 网络问题

如果无法访问 npm registry，可以：

1. 使用国内镜像：
```bash
pnpm config set registry https://registry.npmmirror.com
```

2. 或使用代理

### 问题 3: 权限问题

```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

