# GitLab MCP Server

<div align="center">

A Model Context Protocol (MCP) server for GitLab integration, enabling AI assistants to interact with GitLab merge requests, files, and perform intelligent code reviews.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![GitLab](https://img.shields.io/badge/GitLab-330F63?style=for-the-badge&logo=gitlab&logoColor=white)](https://gitlab.com/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-blue?style=for-the-badge)](https://modelcontextprotocol.io/)

[Documentation](./docs/README.md) • [User Guide (中文)](./docs/user-guide.md) • [API Reference](./docs/api-reference.md)

</div>

## Features

- 🔄 **MCP Protocol** - Full compliance with the official MCP TypeScript SDK
- 📡 **stdio Transport** - Compatible with Cursor, Claude Desktop, and other MCP clients
- 🛠️ **Complete MR Toolkit** - Get MR details, changes, file contents, and more
- 🤖 **AI Code Review** - Intelligent code analysis with inline comments
- 📝 **Line-level Comments** - Push precise code review feedback to GitLab
- 🔍 **Change Analysis** - Deep diff analysis for comprehensive reviews
- 📋 **Review Rules Engine** - Smart rules based on file types and paths
- 🔒 **Enterprise Ready** - Supports private GitLab instances with retry mechanisms

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended) or npm
- GitLab Personal Access Token

### Installation

   ```bash
# Clone the repository
   git clone https://github.com/LynnCen/gitlab-mcp
   cd gitlab-mcp

# Install dependencies
   pnpm install

# Build the project
pnpm build
```

### Configuration

Set your GitLab credentials:

   ```bash
export GITLAB_HOST="https://gitlab.com"
export GITLAB_TOKEN="glpat-xxxxxxxxxxxxx"
```

### Cursor Integration

Add to your Cursor MCP settings:

   ```json
   {
     "mcpServers": {
       "gitlab-mcp": {
       "type": "stdio",
       "command": "node",
      "args": ["/path/to/gitlab-mcp/dist/src/index.js"],
       "env": {
        "GITLAB_HOST": "https://gitlab.com",
        "GITLAB_TOKEN": "your-token"
       }
    }
     }
   }
   ```

## Available Tools

| Tool | Description |
|------|-------------|
| `get_merge_request` | Get merge request details |
| `get_merge_request_changes` | Get MR file changes with diffs |
| `list_merge_requests` | List project merge requests |
| `update_merge_request_description` | Update MR description |
| `get_file_content` | Get file content from repository |
| `analyze_mr_changes` | Analyze MR changes for code review |
| `push_code_review_comments` | Push review comments to GitLab |
| `get_file_code_review_rules` | Get code review rules for file types |

## Usage Examples

```text
# Get MR information
Get the details of MR #123 in project company/awesome-project

# Perform code review
Analyze all changes in MR #123 of project company/awesome-project 
and perform a comprehensive code review, then push comments to GitLab

# Update MR description
Update the description of MR #123 with the changes summary
```

## GitLab Token Setup

1. Go to GitLab → **Settings** → **Access Tokens**
2. Create a new token with these scopes:
   - `api` - Full API access
   - `read_user` - Read user info
   - `read_repository` - Read repository content
   - `write_repository` - Write repository (for comments)

## Documentation

- **[Documentation Center](./docs/README.md)** - Complete documentation index
- **[User Guide (中文)](./docs/user-guide.md)** - Detailed usage guide in Chinese
- **[API Reference](./docs/api-reference.md)** - Full API documentation
- **[Configuration Guide](./docs/configuration.md)** - Environment and setup guide
- **[Development Guide](./docs/development/README.md)** - For contributors

## Development

```bash
# Development mode
pnpm dev

# Build
pnpm build

# Run tests
pnpm test

# Start server
pnpm start
```

## Roadmap

- [x] AI-powered code review with inline comments
- [x] Multi-severity issue classification (critical/warning/suggestion)
- [x] Smart review rules engine
- [ ] Batch MR review support
- [ ] Detailed quality reports
- [ ] Performance optimizations with caching
- [ ] Project-level configuration files

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the project
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP protocol and SDK
- [@gitbeaker/rest](https://github.com/jdalrymple/gitbeaker) - GitLab API client
- [Zod](https://github.com/colinhacks/zod) - TypeScript schema validation

---

<div align="center">

**If this project helps you, please give it a ⭐**

Made with ❤️ by the GitLab MCP Team

</div> 
