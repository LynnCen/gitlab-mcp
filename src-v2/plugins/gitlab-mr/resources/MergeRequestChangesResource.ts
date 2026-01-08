/**
 * MergeRequestChangesResource
 * 
 * 合并请求变更资源：gitlab://projects/{id}/mrs/{iid}/changes
 */

import { Resource } from '../../../capabilities/resources/Resource.js';
import type { ResourceContent } from '../../../capabilities/resources/types.js';
import type { IMergeRequestService } from '../../../services/MergeRequestService.js';

/**
 * MergeRequestChangesResource 实现
 */
export class MergeRequestChangesResource extends Resource {
  readonly uri = 'gitlab://projects/{id}/mrs/{iid}/changes';
  readonly name = 'GitLab Merge Request Changes';
  readonly description = 'GitLab 合并请求变更信息';
  readonly mimeType = 'application/json';
  readonly cacheable = true;
  readonly subscribable = false;

  constructor(private mrService: IMergeRequestService) {
    super();
  }

  async getContent(): Promise<ResourceContent> {
    // 从 metadata 获取实际 URI
    const actualUri = (this.metadata?.actualUri as string) || this.uri;
    
    // 解析 URI: gitlab://projects/{id}/mrs/{iid}/changes
    const match = actualUri.match(/^gitlab:\/\/projects\/(.+)\/mrs\/(\d+)\/changes$/);
    if (!match) {
      throw new Error(`Invalid merge request changes URI: ${actualUri}. Expected format: gitlab://projects/{id}/mrs/{iid}/changes`);
    }

    const projectPath = match[1];
    const mrIid = parseInt(match[2], 10);
    const changes = await this.mrService.getMergeRequestChanges(projectPath, mrIid, {
      includeContent: true,
    });

    return {
      uri: actualUri,
      mimeType: 'application/json',
      text: JSON.stringify(
        {
          summary: changes.summary,
          changes: changes.changes.map((change) => ({
            old_path: change.old_path,
            new_path: change.new_path,
            new_file: change.new_file,
            deleted_file: change.deleted_file,
            renamed_file: change.renamed_file,
            diff: change.diff,
          })),
        },
        null,
        2
      ),
    };
  }
}

