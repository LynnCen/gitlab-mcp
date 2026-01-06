/**
 * ProjectResource
 * 
 * 项目资源：gitlab://projects/{id}
 */

import { Resource } from '../../../capabilities/resources/Resource.js';
import type { ResourceContent } from '../../../capabilities/resources/types.js';
import type { IProjectService } from '../../../services/ProjectService.js';

/**
 * ProjectResource 实现
 * 
 * 支持 URI 模板：gitlab://projects/{id}
 * 实际使用时，ResourceRegistry 会通过 resolveUri 匹配 URI 模式
 */
export class ProjectResource extends Resource {
  readonly uri = 'gitlab://projects/';
  readonly name = 'GitLab Project';
  readonly description = 'GitLab 项目信息';
  readonly mimeType = 'application/json';
  readonly cacheable = true;
  readonly subscribable = false;

  constructor(private projectService: IProjectService) {
    super();
  }

  async getContent(): Promise<ResourceContent> {
    // 注意：由于接口限制，getContent() 不接受参数
    // 实际使用时，ResourceRegistry 会通过 resolveUri 匹配 URI
    // 然后创建对应的 Resource 实例，此时 URI 已经确定
    // 这里我们需要从 this.uri 中解析项目路径
    // 但由于 URI 是模板，我们需要在注册时使用具体 URI 或通过其他方式传递
    
    // 临时方案：从 metadata 中获取实际 URI（如果 ResourceRegistry 支持）
    const actualUri = (this.metadata?.actualUri as string) || this.uri;
    
    // 解析 URI: gitlab://projects/{id}
    const match = actualUri.match(/^gitlab:\/\/projects\/(.+)$/);
    if (!match) {
      throw new Error(`Invalid project URI: ${actualUri}. Expected format: gitlab://projects/{id}`);
    }

    const projectPath = match[1];
    const project = await this.projectService.getProject(projectPath);

    return {
      uri: actualUri,
      mimeType: 'application/json',
      text: JSON.stringify(
        {
          id: project.id,
          name: project.name,
          path: project.path,
          path_with_namespace: project.path_with_namespace,
          description: project.description,
          default_branch: project.default_branch,
          web_url: project.web_url,
        },
        null,
        2
      ),
    };
  }
}

