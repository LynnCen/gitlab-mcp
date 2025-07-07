#!/bin/bash

# GitLab MCP 服务器开发模式启动脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo "=================================================="
echo "🛠️  GitLab MCP 服务器 - 开发模式"
echo "=================================================="

# 设置开发环境变量
export DEBUG=true
export NODE_ENV=development
export SKIP_GITLAB_TEST=${SKIP_GITLAB_TEST:-true}

print_info "启用开发模式..."
print_info "调试日志: 启用"
print_info "GitLab 测试: ${SKIP_GITLAB_TEST}"

# 检查并安装依赖
if [ ! -d "node_modules" ]; then
    print_info "安装依赖..."
    if command -v pnpm &> /dev/null; then
        pnpm install
    else
        npm install
    fi
fi

# 使用 ts-node 直接运行 TypeScript
if command -v pnpm &> /dev/null && pnpm list -g ts-node &> /dev/null; then
    print_info "使用 ts-node 直接运行 TypeScript..."
    pnpm exec ts-node --esm src/index.ts
elif npm list -g ts-node &> /dev/null; then
    print_info "使用 ts-node 直接运行 TypeScript..."
    npx ts-node --esm src/index.ts
else
    print_info "ts-node 未安装，先构建后运行..."
    
    # 构建项目
    if command -v pnpm &> /dev/null; then
        pnpm run build
    else
        npm run build
    fi
    
    # 运行构建后的文件
    node dist/index.js
fi 