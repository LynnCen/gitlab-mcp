#!/bin/bash

# GitLab MCP Server - MCP Inspector 测试脚本
# 用于快速测试 MCP Server 的所有功能

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
CONFIG_FILE="${1:-mcp-inspector.json}"
SERVER_NAME="${2:-gitlab-mcp}"

echo -e "${BLUE}=== GitLab MCP Inspector 测试工具 ===${NC}\n"

# 检查是否已构建
if [ ! -f "dist/src/index.js" ]; then
  echo -e "${RED}错误: 项目未构建${NC}"
  echo -e "${YELLOW}请先运行: pnpm run build${NC}"
  exit 1
fi

# 检查配置文件
if [ ! -f "$CONFIG_FILE" ]; then
  echo -e "${YELLOW}警告: 配置文件 $CONFIG_FILE 不存在${NC}"
  echo -e "${YELLOW}将使用示例配置...${NC}\n"
  
  if [ ! -f "mcp-inspector.example.json" ]; then
    echo -e "${RED}错误: 示例配置文件也不存在${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}请复制并配置您的 mcp-inspector.json:${NC}"
  echo -e "${YELLOW}  cp mcp-inspector.example.json mcp-inspector.json${NC}"
  echo -e "${YELLOW}  # 然后编辑 mcp-inspector.json，填入您的 GITLAB_TOKEN${NC}\n"
  exit 1
fi

# 显示菜单
show_menu() {
  echo -e "${GREEN}请选择测试方式:${NC}"
  echo ""
  echo "  1) Web UI 模式（推荐）- 可视化交互测试"
  echo "  2) CLI 模式 - 列出所有工具"
  echo "  3) CLI 模式 - 列出所有资源"
  echo "  4) CLI 模式 - 列出所有提示"
  echo "  5) 测试 MR 工具 - 获取 MR 信息"
  echo "  6) 测试 MR 工具 - 获取 MR 变更"
  echo "  7) 测试文件工具 - 获取文件内容"
  echo "  8) 运行完整测试套件"
  echo "  0) 退出"
  echo ""
  echo -n "请输入选项 [0-8]: "
}

# Web UI 模式
run_web_ui() {
  echo -e "\n${BLUE}=== 启动 Web UI 模式 ===${NC}\n"
  echo -e "${YELLOW}浏览器将自动打开 http://localhost:5173${NC}"
  echo -e "${YELLOW}使用 Ctrl+C 停止服务器${NC}\n"
  
  npx @modelcontextprotocol/inspector --config "$CONFIG_FILE" --server "$SERVER_NAME"
}

# 列出工具
list_tools() {
  echo -e "\n${BLUE}=== 列出所有工具 ===${NC}\n"
  
  npx @modelcontextprotocol/inspector \
    --cli node dist/src/index.js \
    --method tools/list | jq -r '.tools[] | "  - \(.name): \(.description)"'
  
  echo -e "\n${GREEN}✅ 工具列表获取成功${NC}"
}

# 列出资源
list_resources() {
  echo -e "\n${BLUE}=== 列出所有资源 ===${NC}\n"
  
  npx @modelcontextprotocol/inspector \
    --cli node dist/src/index.js \
    --method resources/list | jq -r '.resources[] | "  - \(.uri): \(.name)"'
  
  echo -e "\n${GREEN}✅ 资源列表获取成功${NC}"
}

# 列出提示
list_prompts() {
  echo -e "\n${BLUE}=== 列出所有提示 ===${NC}\n"
  
  npx @modelcontextprotocol/inspector \
    --cli node dist/src/index.js \
    --method prompts/list | jq -r '.prompts[] | "  - \(.name): \(.description)"'
  
  echo -e "\n${GREEN}✅ 提示列表获取成功${NC}"
}

# 测试 MR 工具 - 获取信息
test_get_mr() {
  echo -e "\n${BLUE}=== 测试工具: get_merge_request ===${NC}\n"
  
  echo -n "请输入项目路径 (例如: gdesign/meta): "
  read project_path
  
  echo -n "请输入 MR IID: "
  read mr_iid
  
  echo -e "\n${YELLOW}正在获取 MR 信息...${NC}\n"
  
  npx @modelcontextprotocol/inspector \
    --cli node dist/src/index.js \
    --method tools/call \
    --tool-name get_merge_request \
    --tool-arg projectPath="$project_path" \
    --tool-arg mergeRequestIid="$mr_iid" | jq
  
  echo -e "\n${GREEN}✅ MR 信息获取成功${NC}"
}

# 测试 MR 工具 - 获取变更
test_get_mr_changes() {
  echo -e "\n${BLUE}=== 测试工具: get_merge_request_changes ===${NC}\n"
  
  echo -n "请输入项目路径 (例如: gdesign/meta): "
  read project_path
  
  echo -n "请输入 MR IID: "
  read mr_iid
  
  echo -n "是否包含文件内容? (y/n, 默认 n): "
  read include_content
  
  include_content_value="false"
  if [ "$include_content" = "y" ] || [ "$include_content" = "Y" ]; then
    include_content_value="true"
  fi
  
  echo -e "\n${YELLOW}正在获取 MR 变更...${NC}\n"
  
  npx @modelcontextprotocol/inspector \
    --cli node dist/src/index.js \
    --method tools/call \
    --tool-name get_merge_request_changes \
    --tool-arg projectPath="$project_path" \
    --tool-arg mergeRequestIid="$mr_iid" \
    --tool-arg includeContent="$include_content_value" | jq
  
  echo -e "\n${GREEN}✅ MR 变更获取成功${NC}"
}

# 测试文件工具
test_get_file() {
  echo -e "\n${BLUE}=== 测试工具: get_file_content ===${NC}\n"
  
  echo -n "请输入项目路径 (例如: gdesign/meta): "
  read project_path
  
  echo -n "请输入文件路径 (例如: src/index.ts): "
  read file_path
  
  echo -n "请输入分支/标签 (默认: main): "
  read ref
  ref=${ref:-main}
  
  echo -e "\n${YELLOW}正在获取文件内容...${NC}\n"
  
  npx @modelcontextprotocol/inspector \
    --cli node dist/src/index.js \
    --method tools/call \
    --tool-name get_file_content \
    --tool-arg projectPath="$project_path" \
    --tool-arg filePath="$file_path" \
    --tool-arg ref="$ref" | jq
  
  echo -e "\n${GREEN}✅ 文件内容获取成功${NC}"
}

# 运行完整测试套件
run_full_test() {
  echo -e "\n${BLUE}=== 运行完整测试套件 ===${NC}\n"
  
  echo -e "${YELLOW}1. 列出工具...${NC}"
  list_tools
  
  echo -e "\n${YELLOW}2. 列出资源...${NC}"
  list_resources
  
  echo -e "\n${YELLOW}3. 列出提示...${NC}"
  list_prompts
  
  echo -e "\n${GREEN}✅ 完整测试套件执行完成${NC}"
  echo -e "${YELLOW}提示: 使用选项 1 启动 Web UI 进行交互式测试${NC}"
}

# 主循环
while true; do
  show_menu
  read choice
  
  case $choice in
    1)
      run_web_ui
      ;;
    2)
      list_tools
      ;;
    3)
      list_resources
      ;;
    4)
      list_prompts
      ;;
    5)
      test_get_mr
      ;;
    6)
      test_get_mr_changes
      ;;
    7)
      test_get_file
      ;;
    8)
      run_full_test
      ;;
    0)
      echo -e "\n${GREEN}感谢使用！${NC}"
      exit 0
      ;;
    *)
      echo -e "\n${RED}无效的选项，请重新选择${NC}\n"
      ;;
  esac
  
  echo -e "\n${YELLOW}按 Enter 键继续...${NC}"
  read
  echo ""
done
