/**
 * 工具注册逻辑
 * 
 * 负责将所有工具、资源、提示注册到对应的注册表
 */

import type { ToolRegistry } from '../capabilities/tools/ToolRegistry.js';
import type { ResourceRegistry } from '../capabilities/resources/ResourceRegistry.js';
import type { PromptRegistry } from '../capabilities/prompts/PromptRegistry.js';
import type { IMergeRequestService } from '../services/MergeRequestService.js';
import type { IFileOperationService } from '../services/FileOperationService.js';
import type { ICodeReviewService } from '../services/CodeReviewService.js';
import type { IProjectService } from '../services/ProjectService.js';

// MR 工具
import { GetMergeRequestTool } from '../plugins/gitlab-mr/tools/GetMergeRequestTool.js';
import { GetMergeRequestChangesTool } from '../plugins/gitlab-mr/tools/GetMergeRequestChangesTool.js';
import { ListMergeRequestsTool } from '../plugins/gitlab-mr/tools/ListMergeRequestsTool.js';
import { UpdateMergeRequestDescriptionTool } from '../plugins/gitlab-mr/tools/UpdateMergeRequestDescriptionTool.js';

// 文件工具
import { GetFileContentTool } from '../plugins/gitlab-file/tools/GetFileContentTool.js';

// 代码审查工具
import { AnalyzeMRChangesTool } from '../plugins/gitlab-code-review/tools/AnalyzeMRChangesTool.js';
import { PushCodeReviewCommentsTool } from '../plugins/gitlab-code-review/tools/PushCodeReviewCommentsTool.js';
import { GetFileCodeReviewRulesTool } from '../plugins/gitlab-code-review/tools/GetFileCodeReviewRulesTool.js';

// MR 资源
import { ProjectResource } from '../plugins/gitlab-mr/resources/ProjectResource.js';
import { MergeRequestResource } from '../plugins/gitlab-mr/resources/MergeRequestResource.js';
import { MergeRequestChangesResource } from '../plugins/gitlab-mr/resources/MergeRequestChangesResource.js';

// 文件资源
import { FileResource } from '../plugins/gitlab-file/resources/FileResource.js';

// 代码审查资源
import { CodeReviewRulesResource } from '../plugins/gitlab-code-review/resources/CodeReviewRulesResource.js';

// 提示
import { MRDescriptionPrompt } from '../plugins/gitlab-mr/prompts/MRDescriptionPrompt.js';
import { CodeReviewTypeScriptPrompt } from '../plugins/gitlab-code-review/prompts/CodeReviewTypeScriptPrompt.js';
import { CodeReviewVuePrompt } from '../plugins/gitlab-code-review/prompts/CodeReviewVuePrompt.js';

/**
 * 服务依赖
 */
export interface ServiceDependencies {
  mrService: IMergeRequestService;
  fileService: IFileOperationService;
  codeReviewService: ICodeReviewService;
  projectService: IProjectService;
}

/**
 * 注册所有工具
 */
export function registerAllTools(
  toolRegistry: ToolRegistry,
  services: ServiceDependencies
): void {
  // 注册 MR 工具
  toolRegistry.registerTool(new GetMergeRequestTool(services.mrService, services.projectService));
  toolRegistry.registerTool(new GetMergeRequestChangesTool(services.mrService));
  toolRegistry.registerTool(new ListMergeRequestsTool(services.mrService));
  toolRegistry.registerTool(new UpdateMergeRequestDescriptionTool(services.mrService));

  // 注册文件工具
  toolRegistry.registerTool(new GetFileContentTool(services.fileService));

  // 注册代码审查工具
  toolRegistry.registerTool(new AnalyzeMRChangesTool(services.codeReviewService));
  toolRegistry.registerTool(new PushCodeReviewCommentsTool(services.codeReviewService));
  toolRegistry.registerTool(new GetFileCodeReviewRulesTool());
}

/**
 * 注册所有资源
 */
export function registerAllResources(
  resourceRegistry: ResourceRegistry,
  services: ServiceDependencies
): void {
  // 注册 MR 资源
  resourceRegistry.registerResource(new ProjectResource(services.projectService));
  resourceRegistry.registerResource(new MergeRequestResource(services.mrService));
  resourceRegistry.registerResource(new MergeRequestChangesResource(services.mrService));

  // 注册文件资源
  resourceRegistry.registerResource(new FileResource(services.fileService));

  // 注册代码审查资源
  resourceRegistry.registerResource(new CodeReviewRulesResource());
}

/**
 * 注册所有提示
 */
export function registerAllPrompts(
  promptRegistry: PromptRegistry,
  services: ServiceDependencies
): void {
  // 注册 MR 提示
  promptRegistry.registerPrompt(new MRDescriptionPrompt(services.mrService));

  // 注册代码审查提示
  promptRegistry.registerPrompt(new CodeReviewTypeScriptPrompt());
  promptRegistry.registerPrompt(new CodeReviewVuePrompt());
}

