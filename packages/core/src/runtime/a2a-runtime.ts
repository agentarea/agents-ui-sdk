// A2A Protocol runtime implementation
// Uses official @a2a-js/sdk

import { A2AClient } from '@a2a-js/sdk/client'
import type { 
  AgentCard as A2AAgentCard,
  Message as A2AMessage,
  Task as A2ATask,
  MessageSendParams,
  Part as A2APart
} from '@a2a-js/sdk'
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
  AgentUpdateCallback
} from '../types'

export interface A2AConfig extends RuntimeConfig {
  agentBaseUrl: string
  authentication?: {
    type: 'bearer' | 'api-key' | 'oauth' | 'openid'
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
  
  private client: A2AClient
  private agentCard: A2AAgentCard | null = null
  private discoveredAgents: Map<string, AgentCard> = new Map()

  constructor(config: A2AConfig) {
    super(config as RuntimeConfig)
    this.client = new A2AClient(config.agentBaseUrl)
  }

  protected initializeProtocolSettings(): void {
    // A2A-specific initialization
    if (this.config?.authentication?.type === 'bearer' && this.config.authentication.token) {
      // Set up authentication headers for A2A client if needed
      // This would depend on the @a2a-js/sdk implementation
    }
  }

  // Protocol-specific connection implementation
  protected async performConnect(connection: Connection, config: ConnectionConfig): Promise<void> {
    try {
      // Test connection by fetching agent card
      this.agentCard = await this.client.getAgentCard()
      
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
    // A2A doesn't require explicit disconnection, but we can clean up resources
    if (connection.agentId === this.agentCard?.name) {
      this.agentCard = null
    }
  }

  // A2A-specific agent discovery
  async discoverAgents(endpoint: string): Promise<AgentCard[]> {
    try {
      // Create a temporary client for discovery
      const discoveryClient = new A2AClient(endpoint)
      const agentCard = await discoveryClient.getAgentCard()
      
      const mappedCard = this.mapA2AAgentCard(agentCard)
      this.discoveredAgents.set(endpoint, mappedCard)
      
      return [mappedCard]
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

    // Return intersection of requested capabilities and agent capabilities
    const agentCapabilities = agent.capabilities.map(cap => cap.name)
    return capabilities.filter(cap => agentCapabilities.includes(cap))
  }

  // A2A message handling
  async handleA2AMessage(message: ProtocolA2AMessage): Promise<void> {
    try {
      // Process A2A-specific message format
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
      const client = new A2AClient(endpoint)
      const agentCard = await client.getAgentCard()
      
      const issues: any[] = []
      const supportedFeatures: string[] = []

      // Check required A2A fields
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
      if (agentCard.capabilities) {
        if (agentCard.capabilities.streaming) {
          supportedFeatures.push('streaming')
        }
        if (agentCard.capabilities.pushNotifications) {
          supportedFeatures.push('push-notifications')
        }
      }

      // Check input/output modes
      if (agentCard.defaultInputModes && agentCard.defaultInputModes.length > 0) {
        supportedFeatures.push('input-modes')
      }
      if (agentCard.defaultOutputModes && agentCard.defaultOutputModes.length > 0) {
        supportedFeatures.push('output-modes')
      }

      return {
        compliant: issues.filter(i => i.severity === 'error').length === 0,
        version: '1.0.0', // A2A protocol version
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
    
    if (this.agentCard?.capabilities?.streaming) {
      capabilities.push('streaming')
    }
    
    if (this.agentCard?.capabilities?.pushNotifications) {
      capabilities.push('push-notifications')
    }
    
    return capabilities
  }

  // Input request handling for A2A protocol
  async handleInputRequest(taskId: string, response: InputResponse): Promise<void> {
    // A2A protocol doesn't have built-in input request handling
    // This would need to be implemented based on the specific A2A agent's capabilities
    throw new Error('Input request handling not implemented for A2A protocol')
  }

  // Real-time subscriptions
  subscribeToTask(taskId: string, callback: TaskUpdateCallback): Subscription {
    // A2A doesn't have built-in real-time subscriptions
    // This could be implemented using polling or WebSocket extensions
    const subscriptionId = `task-${taskId}-${Date.now()}`
    
    // Simple polling implementation
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
        // Ignore polling errors to avoid spam
      }
    }, 5000) // Poll every 5 seconds

    return this.createSubscription(subscriptionId, () => {
      clearInterval(pollInterval)
    })
  }

  subscribeToAgent(agentId: string, callback: AgentUpdateCallback): Subscription {
    // A2A doesn't have built-in agent subscriptions
    const subscriptionId = `agent-${agentId}-${Date.now()}`
    
    // Simple polling implementation for agent status
    const pollInterval = setInterval(async () => {
      try {
        const agentCard = await this.getAgentCard()
        callback({
          agentId,
          status: 'online', // A2A doesn't provide status, assume online if reachable
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
    }, 30000) // Poll every 30 seconds

    return this.createSubscription(subscriptionId, () => {
      clearInterval(pollInterval)
    })
  }

  // Artifact management
  async downloadArtifact(artifactId: string): Promise<Blob> {
    // A2A protocol doesn't have built-in artifact download
    // This would need to be implemented based on the artifact's URL or content
    throw new Error('Artifact download not implemented for A2A protocol')
  }

  async uploadArtifact(file: File, metadata?: ArtifactMetadata): Promise<EnhancedArtifact> {
    // A2A protocol doesn't have built-in artifact upload
    // This would need to be implemented based on the agent's capabilities
    throw new Error('Artifact upload not implemented for A2A protocol')
  }

  // Protocol message handling
  async sendMessage(message: ProtocolMessage, targetAgent: string): Promise<void> {
    // Convert protocol message to A2A message format
    const a2aMessage: A2AMessage = {
      kind: 'message',
      messageId: message.id,
      role: 'user',
      parts: [{
        text: JSON.stringify(message.payload)
      } as A2APart]
    }

    const params: MessageSendParams = {
      message: a2aMessage,
      configuration: {
        blocking: true,
        acceptedOutputModes: ['message']
      }
    }

    const response = await this.client.sendMessage(params)
    
    if ('error' in response) {
      throw new Error(`A2A Error: ${response.error.message}`)
    }
  }

  async handleProtocolMessage(message: ProtocolMessage): Promise<void> {
    // Handle incoming protocol messages
    // This is a base implementation that can be extended
    console.log('Received protocol message:', message)
    
    // Emit as a task update if it's task-related
    if (message.type === 'task-update' && message.payload) {
      const update = message.payload as TaskUpdate
      this.emitTaskUpdate(update)
    }
  }



  async sendTask(input: TaskInput): Promise<TaskResponse> {
    const params: MessageSendParams = {
      message: this.mapToA2AMessage(input.message),
      configuration: {
        blocking: true,
        acceptedOutputModes: ['message', 'task']
      }
    }

    const response = await this.client.sendMessage(params)
    
    // Handle different response types
    if ('error' in response) {
      throw new Error(`A2A Error: ${response.error.message}`)
    }

    return {
      task: this.mapA2AResponseToTask(response),
      streaming: false
    }
  }

  async *streamTask(input: TaskInput): AsyncIterable<TaskUpdate> {
    if (!this.supportsStreaming()) {
      throw new Error('Streaming not supported by this agent')
    }

    const params: MessageSendParams = {
      message: this.mapToA2AMessage(input.message),
      configuration: {
        blocking: false,
        acceptedOutputModes: ['message', 'task']
      }
    }

    const streamGenerator = this.client.sendMessageStream(params)

    try {
      for await (const eventData of streamGenerator) {
        const update = this.mapA2AEventToTaskUpdate(eventData)
        this.emitTaskUpdate(update)
        yield update
      }
    } catch (error) {
      this.emitError(error as Error)
      throw error
    }
  }

  async getTask(taskId: string): Promise<Task> {
    const response = await this.client.getTask({ taskId } as any)
    
    if ('error' in response) {
      throw new Error(`A2A Error: ${response.error.message}`)
    }

    return this.mapA2AResponseToTask(response.result)
  }

  async cancelTask(taskId: string): Promise<void> {
    const response = await this.client.cancelTask({ taskId } as any)
    
    if ('error' in response) {
      throw new Error(`A2A Error: ${response.error.message}`)
    }

  }

  async getAgentCard(): Promise<AgentCard> {
    if (!this.agentCard) {
      this.agentCard = await this.client.getAgentCard()
    }
    return this.mapA2AAgentCard(this.agentCard!)
  }

  async getCapabilities(): Promise<Capability[]> {
    const agentCard = await this.getAgentCard()
    return agentCard.capabilities
  }

  supportsStreaming(): boolean {
    return this.agentCard?.capabilities?.streaming === true
  }

  private mapToA2AMessage(message: Message): A2AMessage {
    return {
      kind: 'message',
      messageId: `msg-${Date.now()}`,
      role: message.role,
      parts: message.parts.map((part: any) => {
        if (part.type === 'text') {
          return {
            text: part.content as string
          } as A2APart
        } else if (part.type === 'file') {
          return {
            uri: part.content as string,
            mimeType: part.mimeType
          } as unknown as A2APart
        } else {
          return {
            data: part.content
          } as A2APart
        }
      })
    }
  }

  private mapA2AResponseToTask(result: any): Task {
    return {
      id: result.id || result.taskId,
      contextId: result.contextId,
      status: result.status || 'submitted',
      input: result.input || { message: { role: 'user', parts: [] } },
      artifacts: result.artifacts || [],
      messages: result.messages || [],
      progress: result.progress,
      error: result.error,
      createdAt: new Date(result.createdAt || Date.now()),
      updatedAt: new Date(result.updatedAt || Date.now())
    }
  }

  private mapA2AEventToTaskUpdate(event: any): TaskUpdate {
    return {
      taskId: event.taskId,
      status: event.status,
      progress: event.progress,
      artifacts: event.artifacts,
      messages: event.messages,
      error: event.error
    }
  }

  private mapA2AAgentCard(card: A2AAgentCard): AgentCard {
    return {
      name: card.name,
      description: card.description,
      capabilities: card.skills?.map((skill: any) => ({
        name: skill.name,
        description: skill.description,
        inputTypes: skill.defaultInputModes || card.defaultInputModes || [],
        outputTypes: skill.defaultOutputModes || card.defaultOutputModes || []
      })) || [],
      endpoints: { main: card.url },
      streaming: card.capabilities?.streaming || false,
      pushNotifications: card.capabilities?.pushNotifications || false
    }
  }
}

// Factory function for creating A2A runtime
export function createA2ARuntime(config: { agentBaseUrl: string; authentication?: any }): A2ARuntime {
  return new A2ARuntime(config as A2AConfig)
}