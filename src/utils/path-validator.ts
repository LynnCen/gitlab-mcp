/**
 * 路径验证工具
 * 
 * 防止路径遍历攻击和其他路径相关安全问题
 */

/**
 * 路径验证选项
 */
export interface PathValidationOptions {
  /**
   * 允许的根目录（绝对路径）
   */
  root?: string;

  /**
   * 是否允许相对路径
   */
  allowRelative?: boolean;

  /**
   * 是否允许路径遍历（..）
   */
  allowTraversal?: boolean;

  /**
   * 最大路径长度
   */
  maxLength?: number;
}

/**
 * 路径验证结果
 */
export interface PathValidationResult {
  /**
   * 是否有效
   */
  valid: boolean;

  /**
   * 错误信息
   */
  error?: string;

  /**
   * 规范化后的路径
   */
  normalized?: string;
}

/**
 * 验证文件路径
 */
export function validateFilePath(
  filePath: string,
  options: PathValidationOptions = {}
): PathValidationResult {
  const {
    allowRelative = false,
    allowTraversal = false,
    maxLength = 4096,
  } = options;

  // 检查长度
  if (filePath.length > maxLength) {
    return {
      valid: false,
      error: `Path exceeds maximum length of ${maxLength} characters`,
    };
  }

  // 检查空路径
  if (!filePath || filePath.trim().length === 0) {
    return {
      valid: false,
      error: 'Path cannot be empty',
    };
  }

  // 检查路径遍历（..）
  if (!allowTraversal && (filePath.includes('..') || filePath.includes('../'))) {
    return {
      valid: false,
      error: 'Path traversal (..) is not allowed',
    };
  }

  // 检查绝对路径
  if (!allowRelative && (filePath.startsWith('/') || /^[A-Za-z]:/.test(filePath))) {
    return {
      valid: false,
      error: 'Absolute paths are not allowed',
    };
  }

  // 规范化路径
  const normalized = normalizePath(filePath);

  // 检查根目录（如果提供）
  if (options.root) {
    const resolved = resolvePath(options.root, normalized);
    if (!resolved.startsWith(options.root)) {
      return {
        valid: false,
        error: 'Path is outside allowed root directory',
      };
    }
  }

  return {
    valid: true,
    normalized,
  };
}

/**
 * 规范化路径
 */
function normalizePath(path: string): string {
  // 移除多余的斜杠
  let normalized = path.replace(/\/+/g, '/');

  // 移除前导和尾随斜杠（保留根路径的斜杠）
  if (normalized.length > 1) {
    normalized = normalized.replace(/^\/+|\/+$/g, '');
  }

  return normalized;
}

/**
 * 解析路径（相对于根目录）
 */
function resolvePath(root: string, path: string): string {
  // 简化实现：实际应该使用 path.resolve
  if (path.startsWith('/')) {
    return path;
  }
  return `${root}/${path}`;
}

/**
 * 验证 GitLab 项目路径
 */
export function validateProjectPath(projectPath: string): PathValidationResult {
  // GitLab 项目路径格式：owner/repo 或 group/subgroup/repo
  const projectPathPattern = /^[a-zA-Z0-9._-]+(\/[a-zA-Z0-9._-]+)*$/;

  if (!projectPath || projectPath.trim().length === 0) {
    return {
      valid: false,
      error: 'Project path cannot be empty',
    };
  }

  if (projectPath.length > 255) {
    return {
      valid: false,
      error: 'Project path exceeds maximum length of 255 characters',
    };
  }

  if (!projectPathPattern.test(projectPath)) {
    return {
      valid: false,
      error: 'Invalid project path format. Expected format: owner/repo or group/subgroup/repo',
    };
  }

  // 检查路径遍历
  if (projectPath.includes('..')) {
    return {
      valid: false,
      error: 'Path traversal (..) is not allowed in project path',
    };
  }

  return {
    valid: true,
    normalized: projectPath,
  };
}

/**
 * 验证 URI
 */
export function validateUri(uri: string): PathValidationResult {
  try {
    const url = new URL(uri);

    // 只允许特定协议
    const allowedSchemes = ['gitlab:', 'https:', 'http:'];
    if (!allowedSchemes.includes(url.protocol)) {
      return {
        valid: false,
        error: `URI scheme '${url.protocol}' is not allowed. Allowed schemes: ${allowedSchemes.join(', ')}`,
      };
    }

    // 验证路径
    if (url.pathname) {
      const pathValidation = validateFilePath(url.pathname, {
        allowTraversal: false,
        maxLength: 2048,
      });

      if (!pathValidation.valid) {
        return pathValidation;
      }
    }

    return {
      valid: true,
      normalized: uri,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid URI format: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

