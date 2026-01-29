# Configuration Guide

This guide covers all configuration options for GitLab MCP Server.

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GITLAB_HOST` | GitLab instance URL | `https://gitlab.com` | ✅ |
| `GITLAB_TOKEN` | Personal access token | - | ✅ |
| `GITLAB_TIMEOUT` | Request timeout (ms) | `30000` | ❌ |
| `GITLAB_RETRIES` | Retry attempts | `3` | ❌ |
| `LOG_LEVEL` | Log level | `info` | ❌ |

### Setting Environment Variables

**Linux/macOS**:
```bash
export GITLAB_HOST="https://gitlab.com"
export GITLAB_TOKEN="glpat-xxxxxxxxxxxxx"
```

**Windows PowerShell**:
```powershell
$env:GITLAB_HOST = "https://gitlab.com"
$env:GITLAB_TOKEN = "glpat-xxxxxxxxxxxxx"
```

## GitLab Token Setup

### Creating a Personal Access Token

1. Log in to GitLab
2. Go to **Settings** → **Access Tokens**
3. Create a new token with:
   - **Name**: `mcp-server-token`
   - **Expiration**: Set as needed
   - **Scopes**:
     - ✅ `api` - Full API access
     - ✅ `read_user` - Read user information
     - ✅ `read_repository` - Read repository content
     - ✅ `write_repository` - Write repository (for comments)

4. Click **Create personal access token**
5. Copy and save the token (shown only once)

### Token Permissions

| Scope | Purpose | Required |
|-------|---------|----------|
| `api` | Access GitLab REST API | ✅ |
| `read_user` | Get user info and verify connection | ✅ |
| `read_repository` | Read project files and MR info | ✅ |
| `write_repository` | Update MR description, push comments | ✅ |

## Cursor Integration

### Basic Configuration

Add to your Cursor MCP settings (`~/.cursor/mcp.json` or Cursor Settings):

```json
{
  "mcpServers": {
    "gitlab-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/gitlab-mcp/dist/src/index.js"],
      "env": {
        "GITLAB_HOST": "https://gitlab.com",
        "GITLAB_TOKEN": "your-token-here"
      }
    }
  }
}
```

### Configuration Tips

1. **Use absolute paths** for the `args` value
2. **Get the path**: Run `pwd` in the project directory
3. **Restart Cursor** after configuration changes

### Multiple GitLab Instances

```json
{
  "mcpServers": {
    "gitlab-public": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/gitlab-mcp/dist/src/index.js"],
      "env": {
        "GITLAB_HOST": "https://gitlab.com",
        "GITLAB_TOKEN": "public-token"
      }
    },
    "gitlab-private": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/gitlab-mcp/dist/src/index.js"],
      "env": {
        "GITLAB_HOST": "https://gitlab.company.com",
        "GITLAB_TOKEN": "private-token"
      }
    }
  }
}
```

## Cursor Rules (Optional)

For enhanced AI assistance, add these rule files to your Cursor rules:

### MR Description Generator

Create `.cursor/rules/mr-description-generator.mdc`:
```markdown
When generating MR descriptions:
- Use structured format with sections
- Include change summary
- Add test cases if applicable
- Use markdown formatting
```

### Code Review Rules

Create `.cursor/rules/code-review.mdc`:
```markdown
When performing code reviews:
- Check for security vulnerabilities
- Verify type safety
- Review error handling
- Suggest performance improvements
```

## Verification

### Test the Connection

```bash
# Build the project
pnpm build

# Test the server
node dist/src/index.js
```

If configured correctly, you should see a connection success message.

### Test in Cursor

After restarting Cursor, try:
```text
Get the details of MR #1 in project your-group/your-project
```

## Troubleshooting

### Connection Issues

**Problem**: "GitLab connection failed"

**Solution**:
```bash
# Verify environment variables
echo $GITLAB_HOST
echo $GITLAB_TOKEN

# Test API access
curl -H "Authorization: Bearer $GITLAB_TOKEN" "$GITLAB_HOST/api/v4/user"
```

### Permission Errors

**Problem**: "403 Forbidden"

**Solution**:
- Verify token has required scopes
- Check project access permissions
- Ensure token hasn't expired

### Cursor Not Detecting Server

**Problem**: MCP tools not available in Cursor

**Solution**:
1. Check file path is absolute and correct
2. Verify the built file exists: `ls dist/src/index.js`
3. Restart Cursor completely
4. Check Cursor's MCP logs for errors

---

**Related Documentation**:
- [User Guide](./user-guide.md)
- [API Reference](./api-reference.md)
- [Development Guide](./development/README.md)
