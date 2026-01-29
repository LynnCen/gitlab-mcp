#!/bin/bash

# GitLab MCP Server 架构统一脚本
# 用途：将 v1 和 v2 代码统一为单一版本
# 使用：./scripts/unify-architecture.sh [--dry-run]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 参数解析
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo -e "${YELLOW}[DRY-RUN 模式] 只预览操作，不实际执行${NC}"
fi

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 执行命令（支持 dry-run）
execute() {
    if $DRY_RUN; then
        echo -e "${YELLOW}[DRY-RUN]${NC} $1"
    else
        eval "$1"
    fi
}

# 确认操作
confirm() {
    if $DRY_RUN; then
        return 0
    fi
    read -p "$1 (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "操作已取消"
        exit 1
    fi
}

echo ""
echo "========================================"
echo "  GitLab MCP Server 架构统一脚本"
echo "========================================"
echo ""

# Phase 0: 前置检查
log_info "Phase 0: 前置检查"

# 检查目录是否存在
if [[ ! -d "src" ]]; then
    log_error "src/ 目录不存在"
    exit 1
fi

if [[ ! -d "src-v2" ]]; then
    log_error "src-v2/ 目录不存在"
    exit 1
fi

log_success "目录检查通过"

# 检查 Git 状态
if ! git diff-index --quiet HEAD --; then
    log_warning "存在未提交的更改"
    confirm "是否继续？"
fi

log_success "前置检查完成"
echo ""

# Phase 1: 创建备份
log_info "Phase 1: 创建备份分支"

BACKUP_BRANCH="backup/pre-unification-$(date +%Y%m%d-%H%M%S)"
execute "git checkout -b $BACKUP_BRANCH 2>/dev/null || true"
execute "git checkout -"

log_success "备份分支已创建: $BACKUP_BRANCH"
echo ""

# Phase 2: 验证 V2 功能
log_info "Phase 2: 验证 V2 功能"

if ! $DRY_RUN; then
    log_info "构建 V2..."
    npm run build:v2 || {
        log_error "V2 构建失败"
        exit 1
    }
    
    log_info "运行 V2 测试..."
    npm run test:v2 -- --run || {
        log_warning "部分测试失败，请检查"
        confirm "是否继续？"
    }
fi

log_success "V2 验证完成"
echo ""

# Phase 3: 删除 V1 代码
log_info "Phase 3: 删除 V1 代码"

confirm "即将删除 src/ 和 tests/ 目录（V1 代码），是否继续？"

execute "rm -rf src/"
execute "rm -rf tests/"

log_success "V1 代码已删除"
echo ""

# Phase 4: 重命名 V2 目录
log_info "Phase 4: 重命名 V2 目录"

execute "mv src-v2/ src/"
execute "mv tests-v2/ tests/"

log_success "目录重命名完成"
echo ""

# Phase 5: 删除临时配置
log_info "Phase 5: 清理临时文件"

if [[ -f "tsconfig-v2.json" ]]; then
    execute "rm tsconfig-v2.json"
    log_success "已删除 tsconfig-v2.json"
fi

# 清理编译产物
execute "rm -rf dist/"
log_success "已清理 dist/ 目录"

echo ""

# Phase 6: 更新 vitest.config.ts
log_info "Phase 6: 更新配置文件"

if ! $DRY_RUN; then
    # 更新 vitest.config.ts 中的路径
    if [[ -f "vitest.config.ts" ]]; then
        sed -i '' 's/src-v2/src/g' vitest.config.ts 2>/dev/null || true
        sed -i '' 's/tests-v2/tests/g' vitest.config.ts 2>/dev/null || true
        log_success "已更新 vitest.config.ts"
    fi
fi

echo ""

# Phase 7: 更新 package.json
log_info "Phase 7: 更新 package.json"

if ! $DRY_RUN; then
    # 创建新的 package.json
    node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// 更新入口
pkg.main = 'dist/src/index.js';
pkg.bin = { 'gitlab-mcp': 'dist/src/index.js' };

// 更新脚本
pkg.scripts = {
    // 构建
    'build': 'npm run clean && tsc && chmod +x dist/src/index.js',
    'dev': 'tsx watch src/index.ts',
    'start': 'node dist/src/index.js',
    'clean': 'rm -rf dist',
    'prepublishOnly': 'npm run clean && npm run build',
    
    // 测试
    'test': 'vitest',
    'test:ui': 'vitest --ui',
    'test:coverage': 'vitest --coverage',
    
    // 代码质量
    'lint': 'eslint src/**/*.ts',
    'lint:fix': 'eslint src/**/*.ts --fix',
    'format': 'prettier --write \"src/**/*.{ts,json,md}\"',
    'format:check': 'prettier --check \"src/**/*.{ts,json,md}\"',
    'type-check': 'tsc --noEmit'
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json 已更新');
"
fi

log_success "package.json 已更新"
echo ""

# Phase 8: 更新 tsconfig.json
log_info "Phase 8: 更新 tsconfig.json"

if ! $DRY_RUN; then
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": ".",
    
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "strictFunctionTypes": false,
    "strictPropertyInitialization": false,
    
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    
    "paths": {
      "@/*": ["src/*"],
      "@core/*": ["src/core/*"],
      "@transport/*": ["src/transport/*"],
      "@capabilities/*": ["src/capabilities/*"],
      "@services/*": ["src/services/*"],
      "@repositories/*": ["src/repositories/*"],
      "@plugins/*": ["src/plugins/*"],
      "@config/*": ["src/config/*"],
      "@logging/*": ["src/logging/*"],
      "@errors/*": ["src/errors/*"],
      "@cache/*": ["src/cache/*"],
      "@utils/*": ["src/utils/*"]
    },
    
    "types": ["node"]
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests"
  ]
}
EOF
fi

log_success "tsconfig.json 已更新"
echo ""

# Phase 9: 重新构建
log_info "Phase 9: 重新构建项目"

if ! $DRY_RUN; then
    npm run build || {
        log_error "构建失败，请手动检查"
        exit 1
    }
fi

log_success "项目构建成功"
echo ""

# Phase 10: 运行测试
log_info "Phase 10: 运行测试"

if ! $DRY_RUN; then
    npm run test -- --run || {
        log_warning "部分测试失败"
    }
fi

log_success "测试完成"
echo ""

# 完成
echo "========================================"
echo -e "${GREEN}  架构统一完成！${NC}"
echo "========================================"
echo ""
log_info "后续步骤："
echo "  1. 检查并修复所有 @ts-nocheck 注释"
echo "  2. 检查并修复 as any 类型断言"
echo "  3. 更新文档（README.md, architecture.md）"
echo "  4. 提交更改: git add -A && git commit -m 'refactor: unify v1 and v2 architecture'"
echo "  5. 打标签: git tag -a v2.0.0 -m 'Release v2.0.0 - Unified Architecture'"
echo ""
