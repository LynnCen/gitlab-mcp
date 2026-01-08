/**
 * MergeRequestResource
 * 
 * 合并请求资源：gitlab://projects/{id}/mrs/{iid}
 */

import { Resource } from '../../../capabilities/resources/Resource.js';
import type { ResourceContent } from '../../../capabilities/resources/types.js';
import type { IMergeRequestService } from '../../../services/MergeRequestService.js';

/**
 * MergeRequestResource 实现
 */
export class MergeRequestResource extends Resource {
  readonly uri = 'gitlab://projects/{id}/mrs/{iid}';
  readonly name = 'GitLab Merge Request';
  readonly description = 'GitLab 合并请求信息';
  readonly mimeType = 'application/json';
  readonly cacheable = true;
  readonly subscribable = false;

  constructor(private mrService: IMergeRequestService) {
    super();
  }

  async getContent(): Promise<ResourceContent> {
    // 从 metadata 获取实际 URI（ResourceRegistry 会在匹配时设置）
    const actualUri = (this.metadata?.actualUri as string) || this.uri;
    
    // 解析 URI: gitlab://projects/{id}/mrs/{iid}
    const match = actualUri.match(/^gitlab:\/\/projects\/(.+)\/mrs\/(\d+)$/);
    if (!match) {
      throw new Error(`Invalid merge request URI: ${actualUri}. Expected format: gitlab://projects/{id}/mrs/{iid}`);
    }

    const projectPath = match[1];
    const mrIid = parseInt(match[2], 10);
    const mr = await this.mrService.getMergeRequest(projectPath, mrIid);

    return {
      uri: actualUri,
      mimeType: 'application/json',
      text: JSON.stringify(
        {
          id: mr.id,
          iid: mr.iid,
          title: mr.title,
          description: mr.description,
          state: mr.state,
          author: mr.author,
          source_branch: mr.source_branch,
          target_branch: mr.target_branch,
          created_at: mr.created_at,
          updated_at: mr.updated_at,
          merged_at: mr.merged_at,
          web_url: mr.web_url,
        },
        null,
        2
      ),
    };
  }
}

