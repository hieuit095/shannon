// Copyright (C) 2026 Keygraph, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License version 3
// as published by the Free Software Foundation.

/**
 * Service Container
 *
 * Provides a per-workflow container for service instances.
 * Services are wired with explicit constructor injection.
 */

import type { SessionMetadata } from '../audit/utils.js';
import type { ContainerConfig } from '../types/config.js';
import { AgentExecutionService } from './agent-execution.js';
import { ConfigLoaderService } from './config-loader.js';

/**
 * Dependencies required to create a Container.
 */
export interface ContainerDependencies {
  readonly sessionMetadata: SessionMetadata;
  readonly config: ContainerConfig;
}

/**
 * Container for a single workflow.
 * Holds runtime service instances for the workflow lifecycle.
 */
export class Container {
  readonly sessionMetadata: SessionMetadata;
  readonly config: ContainerConfig;
  readonly agentExecution: AgentExecutionService;
  readonly configLoader: ConfigLoaderService;

  constructor(deps: ContainerDependencies) {
    this.sessionMetadata = deps.sessionMetadata;
    this.config = deps.config;

    this.configLoader = new ConfigLoaderService();
    this.agentExecution = new AgentExecutionService(this.configLoader);
  }
}

/**
 * Map of workflowId to Container instance.
 * Each workflow gets its own container scoped to its lifecycle.
 */
const containers = new Map<string, Container>();

/** Default container config — OSS standalone defaults */
const DEFAULT_CONFIG: ContainerConfig = {
  deliverablesSubdir: '.shannon/deliverables',
  auditDir: './workspaces',
};

/**
 * Get or create a Container for a workflow.
 */
export function getOrCreateContainer(
  workflowId: string,
  sessionMetadata: SessionMetadata,
  config: ContainerConfig = DEFAULT_CONFIG,
): Container {
  let container = containers.get(workflowId);

  if (!container) {
    container = new Container({ sessionMetadata, config });
    containers.set(workflowId, container);
  }

  return container;
}

/**
 * Remove a Container when a workflow completes.
 */
export function removeContainer(workflowId: string): void {
  containers.delete(workflowId);
}

/**
 * Get an existing Container for a workflow, if one exists.
 */
export function getContainer(workflowId: string): Container | undefined {
  return containers.get(workflowId);
}
