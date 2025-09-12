// A2A Protocol runtime implementation
// Refactored to use transport abstraction and agent-card resolver system

// Removed direct dependency on @a2a-js/sdk
// import { A2AClient } from '@a2a-js/sdk/client'
// import type { 
//   AgentCard as A2AAgentCard,
//   Message as A2AMessage,
//   Task as A2ATask,
//   MessageSendParams,
//   Part as A2APart
// } from '@a2a-js/sdk'
import { BaseRuntime } from './base-runtime'
import type { 
  RuntimeConfig,
  Task,
  TaskInput,
  TaskResponse,
  TaskUpdate,
  AgentCard,
  Capability,
  Message,
  Connection,
  ConnectionConfig,
  A2ARuntimeInterface,
  A2AMessage as ProtocolA2AMessage,
  ComplianceResult,
  A2AMetadata,
  TaskInputRequest,
  InputResponse,
  EnhancedArtifact,
  ArtifactMetadata,
  ProtocolMessage,
  Subscription,
  TaskUpdateCallback,
  AgentUpdateCallback,
  TaskNode,
  SubTask,
  DelegationConfig,
  DelegationDetails
} from '../types'
import type { Transport } from '../transport'
import { createTransportFactory } from '../transport'
import type { AgentCardResolver } from '../agent-card'
import { createAgentCardResolverFactory, createDefaultAgentCardResolver } from '../agent-card'

export interface A2AConfig extends RuntimeConfig {
  agentBaseUrl: string
  authentication?: {
    type: 'bearer' | 'api-key' | 'oauth' | 'openid' | 'none'
    token?: string
    apiKey?: string
    config?: Record<string, unknown>
  }
  timeout?: number
  retries?: number
  [key: string]: unknown
}

export class A2ARuntime extends BaseRuntime implements A2ARuntimeInterface {
  readonly protocolType = 'a2a' as const
  readonly version = '1.0.0'
  
  private transport!: Transport
  private agentCard: AgentCard | null = null
  private discoveredAgents: Map<string, AgentCard> = new Map()
  private agentCardResolver!: AgentCardResolver

  constructor(config: A2AConfig) {
    super(config as RuntimeConfig)

    // Initialize transport from config
    const tf = createTransportFactory()
    const transportType = config.transport?.type || 'json-rest'
    const baseURLCandidate = (config.agentBaseUrl || (config as any).endpoint) as string | undefined
    if (!baseURLCandidate) {
      throw new Error('A2ARuntime requires either config.agentBaseUrl or config.endpoint to be provided')
    }
    const baseURL = baseURLCandidate
    const transportConfig = config.transport?.config || {
      baseURL,
      timeout: config.timeout,
      headers: undefined,
      authentication: config.authentication?.type === 'bearer' && config.authentication.token
        ? { type: 'bearer', token: config.authentication.token }
        : config.authentication?.type === 'none'
        ? { type: 'none' }
        : undefined
    }

    this.transport = tf.createTransport(
      transportType,
      { ...transportConfig, baseURL: transportConfig.baseURL || baseURL },
      config.transport?.endpointMapping
    )

    // Initialize agent card resolver
    const resolverFactory = createAgentCardResolverFactory()
    this.agentCardResolver = config.agentCardResolver
      ? resolverFactory.createResolver(config.agentCardResolver)
      : createDefaultAgentCardResolver({ type: 'well-known' })
  }

  protected initializeProtocolSettings(): void {
    // No-op for transport-based implementation; configs handled in constructor
  }

  // Protocol-specific connection implementation
  protected async performConnect(connection: Connection, config: ConnectionConfig): Promise<void> {
    try {
      // Test connection by fetching agent card via resolver
      const endpoint = (this.config?.endpoint as string) || (this.config as A2AConfig).agentBaseUrl
      this.agentCard = await this.agentCardResolver.resolve(endpoint)
      
      // Update connection with agent information
      connection.agentId = this.agentCard?.name || 'unknown'
      connection.metadata = {
        agentCard: this.agentCard,
        capabilities: this.agentCard?.capabilities || {},
        supportedProtocols: ['a2a']
      }
    } catch (error) {
      throw new Error(`Failed to connect to A2A agent: ${(error as Error).message}`)
    }
  }

  protected async performDisconnect(connection: Connection): Promise<void> {
    if (connection.agentId === this.agentCard?.name) {
      this.agentCard = null
    }
  }

  // A2A-specific agent discovery
  async discoverAgents(endpoint: string): Promise<AgentCard[]> {
    try {
      const card = await this.agentCardResolver.resolve(endpoint)
      this.discoveredAgents.set(endpoint, card)
      return [card]
    } catch (error) {
      throw new Error(`Failed to discover agents at ${endpoint}: ${(error as Error).message}`)
    }
  }

  // A2A capability negotiation
  async negotiateCapabilities(agentId: string, capabilities: string[]): Promise<string[]> {
    const agent = this.discoveredAgents.get(agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in discovered agents`)
    }

    const agentCapabilities = agent.capabilities.map(cap => cap.name)
    return capabilities.filter(cap => agentCapabilities.includes(cap))
  }

  // A2A message handling
  async handleA2AMessage(message: ProtocolA2AMessage): Promise<void> {
    try {
      const processedMessage: ProtocolMessage = {
        id: message.correlationId || message.id,
        type: message.messageType,
        source: message.source,
        target: message.target,
        payload: message.payload,
        timestamp: message.timestamp,
        metadata: {
          protocolVersion: message.protocolVersion,
          correlationId: message.correlationId
        }
      }

      await this.handleProtocolMessage(processedMessage)
    } catch (error) {
      this.emitError(new Error(`Failed to handle A2A message: ${(error as Error).message}`))
    }
  }

  // A2A protocol compliance validation
  async validateA2ACompliance(endpoint: string): Promise<ComplianceResult> {
    try {
      const agentCard = await this.agentCardResolver.resolve(endpoint)
      
      const issues: any[] = []
      const supportedFeatures: string[] = []

      if (!agentCard.name) {
        issues.push({
          severity: 'error',
          code: 'MISSING_NAME',
          message: 'Agent card must have a name',
          recommendation: 'Add a name field to the agent card'
        })
      }

      if (!agentCard.description) {
        issues.push({
          severity: 'warning',
          code: 'MISSING_DESCRIPTION',
          message: 'Agent card should have a description',
          recommendation: 'Add a description field to the agent card'
        })
      }

      // Check capabilities
      if (agentCard.streaming) {
        supportedFeatures.push('streaming')
      }
      if (agentCard.pushNotifications) {
        supportedFeatures.push('push-notifications')
      }

      // Check input/output modes from capabilities
      if (agentCard.capabilities?.some(c => (c.inputTypes?.length || 0) > 0)) {
        supportedFeatures.push('input-modes')
      }
      if (agentCard.capabilities?.some(c => (c.outputTypes?.length || 0) > 0)) {
        supportedFeatures.push('output-modes')
      }

      return {
        compliant: issues.filter(i => i.severity === 'error').length === 0,
        version: '1.0.0',
        supportedFeatures,
        issues: issues.length > 0 ? issues : undefined
      }
    } catch (error) {
      return {
        compliant: false,
        version: 'unknown',
        supportedFeatures: [],
        issues: [{
          severity: 'error',
          code: 'CONNECTION_FAILED',
          message: `Failed to connect to agent: ${(error as Error).message}`,
          recommendation: 'Check endpoint URL and network connectivity'
        }]
      }
    }
  }

  // A2A metadata
  getA2AMetadata(): A2AMetadata {
    return {
      version: this.version,
      supportedMessageTypes: ['request', 'response', 'notification'],
      capabilities: this.getSupportedCapabilities(),
      extensions: {
        streaming: this.supportsStreaming(),
        pushNotifications: this.supportsPushNotifications()
      }
    }
  }

  // Enhanced capabilities
  getSupportedCapabilities(): string[] {
    const capabilities = ['message-sending', 'task-submission']
    
    if (this.agentCard?.streaming) {
      capabilities.push('streaming')
    }
    
    if (this.agentCard?.pushNotifications) {
      capabilities.push('push-notifications')
    }
    
    return capabilities
  }

  // Input request handling for A2A protocol
  async handleInputRequest(taskId: string, response: InputResponse): Promise<void> {
    throw new Error('Input request handling not implemented for A2A protocol')
  }

  // Real-time subscriptions
  subscribeToTask(taskId: string, callback: TaskUpdateCallback): Subscription {
    const subscriptionId = `task-${taskId}-${Date.now()}`
    
    const pollInterval = setInterval(async () => {
      try {
        const task = await this.getTask(taskId)
        callback({
          taskId,
          status: task.status,
          progress: task.progress,
          artifacts: task.artifacts,
          messages: task.messages,
          error: task.error
        })
      } catch (error) {
        // ignore
      }
    }, 5000)

    return this.createSubscription(subscriptionId, () => {
      clearInterval(pollInterval)
    })
  }

  subscribeToAgent(agentId: string, callback: AgentUpdateCallback): Subscription {
    const subscriptionId = `agent-${agentId}-${Date.now()}`
    
    const pollInterval = setInterval(async () => {
      try {
        const agentCard = await this.getAgentCard()
        callback({
          agentId,
          status: 'online',
          capabilities: agentCard.capabilities,
          metadata: { agentCard },
          timestamp: new Date()
        })
      } catch (error) {
        callback({
          agentId,
          status: 'error',
          timestamp: new Date()
        })
      }
    }, 30000)

    return this.createSubscription(subscriptionId, () => {
      clearInterval(pollInterval)
    })
  }

  // Artifact management
  async downloadArtifact(artifactId: string): Promise<Blob> {
    throw new Error('Artifact download not implemented for A2A protocol')
  }

  async uploadArtifact(file: File, metadata?: ArtifactMetadata): Promise<EnhancedArtifact> {
    throw new Error('Artifact upload not implemented for A2A protocol')
  }

  // Protocol message handling
  async sendMessage(message: ProtocolMessage, targetAgent: string): Promise<void> {
    // For transport abstraction, map to a2a sendMessage RPC or REST endpoint
    const req = {
      method: 'message.send',
      params: {
        kind: 'message',
        messageId: message.id,
        role: 'user',
        parts: [{ text: JSON.stringify(message.payload) }]
      }
    }

    const res = await this.transport.request(req)
    if (!res.success) {
      throw new Error(`A2A Error: ${res.error?.message || 'Unknown error'}`)
    }
  }

  async handleProtocolMessage(message: ProtocolMessage): Promise<void> {
    console.log('Received protocol message:', message)
    
    if (message.type === 'task-update' && message.payload) {
      const update = message.payload as TaskUpdate
      this.emitTaskUpdate(update)
    }
  }

  async sendTask(input: TaskInput): Promise<TaskResponse> {
    const req = {
      method: 'message.send',
      params: {
        kind: 'message',
        messageId: `msg-${Date.now()}`,
        role: input.message.role,
        parts: input.message.parts?.map(p => p.type === 'text' ? { text: p.content } : { data: p.content })
      }
    }

    const res = await this.transport.request<any>(req)
    if (!res.success) {
      throw new Error(`A2A Error: ${res.error?.message || 'Unknown error'}`)
    }

    return {
      task: this.mapA2AResponseToTask(res.data),
      streaming: false
    }
  }

  async *streamTask(input: TaskInput): AsyncIterable<TaskUpdate> {
    if (!this.supportsStreaming()) {
      throw new Error('Streaming not supported by this agent')
    }
    // Streaming not supported by transports in this implementation - could be implemented via SSE/WS later
    throw new Error('Streaming not supported in current transport implementation')
  }

  async getTask(taskId: string): Promise<Task> {
    const req = {
      method: 'task.get',
      params: { taskId }
    }

    const res = await this.transport.request<any>(req)
    if (!res.success) {
      throw new Error(`A2A Error: ${res.error?.message || 'Unknown error'}`)
    }

    return this.mapA2AResponseToTask(res.data)
  }

  async cancelTask(taskId: string): Promise<void> {
    const req = {
      method: 'task.cancel',
      params: { taskId }
    }

    const res = await this.transport.request(req)
    if (!res.success) {
      throw new Error(`A2A Error: ${res.error?.message || 'Unknown error'}`)
    }
  }

  async getAgentCard(): Promise<AgentCard> {
    if (this.agentCard) return this.agentCard

    const endpoint = (this.config?.endpoint as string) || (this.config as A2AConfig).agentBaseUrl
    this.agentCard = await this.agentCardResolver.resolve(endpoint)
    return this.agentCard
  }

  async getCapabilities(): Promise<Capability[]> {
    const agentCard = await this.getAgentCard()
    return agentCard.capabilities
  }

  supportsStreaming(): boolean {
    return this.agentCard?.streaming === true
  }

  private mapA2AResponseToTask(result: any): Task {
    const core = (result?.result) ? result.result : result
    return {
      id: core?.id || core?.taskId || `task-${Date.now()}`,
      contextId: core?.contextId,
      status: core?.status || 'submitted',
      input: core?.input || { message: { role: 'user', parts: [] } },
      artifacts: core?.artifacts || [],
      messages: core?.messages || [],
      progress: core?.progress,
      error: core?.error,
      createdAt: new Date(core?.createdAt || Date.now()),
      updatedAt: new Date(core?.updatedAt || Date.now())
    }
  }

  async delegateSubTask(
    parentTaskId: string,
    subTasks: SubTask[],
    config?: DelegationConfig
  ): Promise<DelegationDetails> {
    const delegationId = `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const parallel = config?.parallel ?? true;
    const maxDepth = config?.maxDepth ?? 5;
    const includeLog = config?.contextPassing?.includeLog ?? 5;
    const artifacts = config?.contextPassing?.artifacts ?? [];

    if (maxDepth <= 0) {
      throw new Error("Maximum delegation depth exceeded");
    }

    const details: DelegationDetails = {
      delegationId,
      parentTaskId,
      subTasks: [...subTasks],
      status: 'pending' as const,
      config,
      timestamp: new Date(),
    };

    this.emit({ type: 'delegation', details, runtime: this });

    try {
      const parentTask = await this.getTask(parentTaskId);
      const logSnippet: string[] = []; // Placeholder: recent events as strings

      const subTaskPromises = subTasks.map(async (subTask) => {
        const baseInput = subTask.input || { message: { role: 'agent' as const, parts: [] } };
        const enhancedInput: TaskInput = {
          ...baseInput,
          metadata: {
            ...(baseInput.metadata || {}),
            parentTaskId,
            delegationId,
            logContext: logSnippet.slice(-includeLog),
            artifacts,
          },
        };

        this.emit({ type: 'sub-task-started', subTask, delegationId, runtime: this });

        const response = await this.submitTask(enhancedInput);

        this.emit({ type: 'sub-task-completed', subTask, delegationId, runtime: this });

        return { ...subTask, response };
      });

      if (parallel) {
        await Promise.all(subTaskPromises);
      } else {
        for (const promise of subTaskPromises) {
          await promise;
        }
      }

      details.status = 'completed';
      details.subTasks = subTasks.map((st) => ({ ...st, status: 'completed' as const }));

      return details;
    } catch (error) {
      details.status = 'failed';
      this.emit({ type: 'delegation-failed', delegationId, error: error as Error, runtime: this });
      throw error;
    }
  }

  async getDelegationTree(taskId: string): Promise<TaskNode> {
    const rootTask = await this.getTask(taskId);
    const rootNode: TaskNode = {
      id: rootTask.id,
      description: rootTask.description || rootTask.input?.prompt || 'Root Task',
      agentId: rootTask.agentId || 'primary',
      status: rootTask.status as any, // Map to TaskNode status
      input: rootTask.input,
      response: rootTask.response,
      children: [],
      logSnippet: [], // Fetch from events
      createdAt: rootTask.createdAt || new Date(),
      updatedAt: new Date(),
    };

    const delegations: DelegationDetails[] = []; // Placeholder: fetch from runtime
    for (const del of delegations) {
      for (const sub of del.subTasks) {
        const childNode = await this.getDelegationTree(sub.id);
        rootNode.children.push(childNode);
      }
    }

    return rootNode;
  }
}

// Factory function for creating A2A runtime
export function createA2ARuntime(config: { agentBaseUrl: string; authentication?: any }): A2ARuntime {
  return new A2ARuntime(config as A2AConfig)
}
