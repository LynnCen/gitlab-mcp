#!/bin/bash

# GitLab MCP 服务器启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查 Node.js 版本
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装。请安装 Node.js 18+ 版本。"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -c 2-)
    REQUIRED_VERSION="18.0.0"
    
    if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
        print_warning "当前 Node.js 版本: $NODE_VERSION，建议使用 18.0.0+ 版本"
    else
        print_success "Node.js 版本检查通过: $NODE_VERSION"
    fi
}

# 加载 .env 文件
load_env() {
    if [ -f ".env" ]; then
        print_info "从 .env 文件加载环境变量..."
        export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
        print_success ".env 文件加载完成"
    else
        print_warning ".env 文件不存在，将从系统环境变量读取"
    fi
}

# 检查环境变量
check_env() {
    print_info "检查环境变量..."
    
    if [ -z "$GITLAB_HOST" ]; then
        print_error "GITLAB_HOST 环境变量未设置"
        print_info "请在 .env 文件或系统环境变量中设置"
        print_info "示例: GITLAB_HOST=https://gitlab.com"
        exit 1
    fi
    
    if [ -z "$GITLAB_TOKEN" ]; then
        print_error "GITLAB_TOKEN 环境变量未设置"
        print_info "请在 .env 文件或系统环境变量中设置"
        print_info "请在 GitLab 中创建访问令牌，权限包括: api, read_user, read_repository"
        exit 1
    fi
    
    print_success "环境变量检查通过"
    print_info "GitLab Host: $GITLAB_HOST"
    print_info "GitLab Token: ${GITLAB_TOKEN:0:8}..."
}

# 构建项目
build_project() {
    print_info "构建项目..."
    
    if [ ! -d "node_modules" ]; then
        print_info "安装依赖..."
        if command -v pnpm &> /dev/null; then
            pnpm install
        elif command -v npm &> /dev/null; then
            npm install
        else
            print_error "未找到 npm 或 pnpm"
            exit 1
        fi
    fi
    
    print_info "编译 TypeScript..."
    if command -v pnpm &> /dev/null; then
        pnpm run build
    else
        npm run build
    fi
    
    print_success "项目构建完成"
}

# 启动服务器
start_server() {
    print_info "启动 GitLab MCP 服务器..."
    
    # 设置默认值
    export PORT=${PORT:-3000}
    export HOST=${HOST:-localhost}
    export DEBUG=${DEBUG:-false}
    
    # 启动服务器
    node dist/index.js
}

# 主函数
main() {
    echo "=================================================="
    echo "🚀 GitLab MCP 服务器启动脚本"
    echo "=================================================="
    
    check_node
    load_env
    check_env
    
    if [ "$SKIP_BUILD" = "false" ]; then
        build_project
    else
        print_info "跳过构建步骤"
    fi
    
    start_server
}

# 帮助信息
show_help() {
    echo "GitLab MCP 服务器启动脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help           显示帮助信息"
    echo "  -s, --skip-build     跳过构建步骤"
    echo "  -t, --test-only      仅测试 GitLab 连接"
    echo ""
    echo "环境变量:"
    echo "  GITLAB_HOST          GitLab 服务器地址 (必需)"
    echo "  GITLAB_TOKEN         GitLab 访问令牌 (必需)"
    echo "  PORT                 服务器端口 (默认: 3000)"
    echo "  HOST                 服务器主机 (默认: localhost)"
    echo "  DEBUG                调试模式 (默认: false)"
    echo "  SKIP_GITLAB_TEST     跳过 GitLab 连接测试 (默认: false)"
    echo ""
    echo "示例:"
    echo "  export GITLAB_HOST=https://gitlab.com"
    echo "  export GITLAB_TOKEN=glpat-xxxxxxxxxxxxx"
    echo "  $0"
}

# 仅测试 GitLab 连接
test_gitlab() {
    print_info "测试 GitLab 连接..."
    load_env
    check_env
    build_project
    
    print_info "运行连接测试..."
    export SKIP_GITLAB_TEST=false
    timeout 30s node -e "
        import('./dist/gitlab/GitLabClientFactory.js').then(async ({ GitLabClientFactory }) => {
            import('./dist/config/ConfigManager.js').then(async ({ ConfigManager }) => {
                const config = ConfigManager.getInstance().getGitLabConfig();
                const factory = GitLabClientFactory.getInstance();
                const client = factory.createClient(config);
                
                try {
                    const result = await client.testConnection();
                    if (result.success) {
                        console.log('✅ GitLab 连接测试成功');
                        console.log(\`   用户: \${result.user?.name} (@\${result.user?.username})\`);
                        process.exit(0);
                    } else {
                        console.error('❌ GitLab 连接测试失败:', result.error);
                        process.exit(1);
                    }
                } catch (error) {
                    console.error('❌ GitLab 连接测试失败:', error.message);
                    process.exit(1);
                }
            });
        });
    "
}

# 解析命令行参数
SKIP_BUILD=false
TEST_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -s|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -t|--test-only)
            TEST_ONLY=true
            shift
            ;;
        *)
            print_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 执行主逻辑
if [ "$TEST_ONLY" = true ]; then
    test_gitlab
else
    main
fi 