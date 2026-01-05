/**
 * 资源类型定义
 */

/**
 * 资源内容
 */
export interface ResourceContent {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: Blob;
  size?: number;
  metadata?: Record<string, any>;
}

/**
 * 资源过滤器
 */
export interface ResourceFilter {
  scheme?: string;
  mimeType?: string;
  cacheable?: boolean;
}

/**
 * 资源信息
 */
export interface ResourceInfo {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

