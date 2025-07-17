// AgentArea Custom Protocol runtime implementation

import { BaseRuntime } from './base-runtime'
import type { 
  RuntimeConfig,
  Task,
  TaskInput,
  TaskResponse,
  TaskUpdate,
  AgentCard,
  Capability,
  Connection,
  ConnectionConfig,
  AgentAreaRuntimeInterface,
  AuthResult,
  TaskTemplate,
  TaskSchedule,
  TaskAnalytics,
  TaskInputRequest,
  InputResponse,
  EnhancedArtifact,
  ArtifactMetadata,
  ProtocolMessage,
  Subscription,
  TaskUpdateCallback,
  AgentUpdateCallback
} from '../types'

export interface AgentAreaConfig extends RuntimeConfig {
  endpoint: string
  authentication?: {
    type: 'bearer' | 'api-key' | 'oauth' | 'openid'
    token?: string
    apiKey?: string
    config?: Record<string, unknown>
  }
  timeout?: number
  retries?: number
  streaming?: boolean
  batchSize?: number
  [key: string]: unknown
}

export class AgentAreaRuntime extends BaseRuntime implements AgentAreaRuntimeInterface {
  readonly protocolType = 'agentarea' as const
  readonly version = '1.0.0'
  
  private authToken?: string
  private wsConnection?: WebSocket
  private taskTemplates: Map<string, TaskTemplate> = new Map()
  private scheduledTasks: Map<string, TaskSchedule> = new Map()

  constructor(config: AgentAreaConfig) {
    super(config as RuntimeConfig)
  }

  protected initializeProtocolSettings(): void {
    // AgentArea-specific initialization
    if (this.config?.authentication?.token) {
      this.authToken = this.config.authentication.token
    }
  }

  // Protocol-specific connection implementation
  protected async performConnect(connection: Connection, config: ConnectionConfig): Promise<void> {
    try {
      // Authenticate with the AgentArea service
      const authResult = await this.authenticateWithToken(this.authToken || '')
      if (!authResult.success) {
        throw new Error(`Authentication failed: ${authResult.error}`)
      }

      // Establish WebSocket connection for real-time updates if supported
      if (this.config?.streaming) {
        await this.establishWebSocketConnection(config.endpoint)
      }

      // Update connection with service information
      connection.agentId = 'agentarea-service'
      connection.metadata = {
        authenticated: true,
        permissions: authResult.permissions || [],
        streaming: !!this.wsConnection,
        supportedProtocols: ['agentarea']
      }
    } catch (error) {
      throw new Error(`Failed to connect to AgentArea service: ${(error as Error).message}`)
    }
  }

  protected async performDisconnect(connection: Connection): Promise<void> {
    // Close WebSocket connection if active
    if (this.wsConnection) {
      this.wsConnection.close()
      this.wsConnection = undefined
    }
    
    // Clear authentication token
    this.authToken = undefined
  }

  // AgentArea-specific authentication
  async authenticateWithToken(token: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.config?.endpoint}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token })
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Authentication failed: ${response.statusText}`
        }
      }

      const data = await response.json() as any
      this.authToken = token

      return {
        success: true,
        token,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        permissions: data.permissions || []
      }
    } catch (error) {
      return {
        success: false,
        error: `Authentication error: ${(error as Error).message}`
      }
    }
  }

  // Streaming task updates
  async *streamTaskUpdates(taskId: string): AsyncIterable<TaskUpdate> {
    if (!this.wsConnection) {
      throw new Error('WebSocket connection not established')
    }

    // Subscribe to task updates via WebSocket
    const subscribeMessage = {
      type: 'subscribe',
      taskId,
      timestamp: new Date().toISOString()
    }

    this.wsConnection.send(JSON.stringify(subscribeMessage))

    // Create async iterator for WebSocket messages
    const messageQueue: TaskUpdate[] = []
    let resolveNext: ((value: IteratorResult<TaskUpdate>) => void) | null = null

    const messageHandler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'task-update' && data.taskId === taskId) {
          const update: TaskUpdate = {
            taskId: data.taskId,
            status: data.status,
            progress: data.progress,
            artifacts: data.artifacts,
            messages: data.messages,
            error: data.error
          }

          if (resolveNext) {
            resolveNext({ value: update, done: false })
            resolveNext = null
          } else {
            messageQueue.push(update)
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    this.wsConnection.addEventListener('message', messageHandler)

    try {
      while (this.wsConnection.readyState === WebSocket.OPEN) {
        if (messageQueue.length > 0) {
          yield messageQueue.shift()!
        } else {
          await new Promise<TaskUpdate>((resolve) => {
            resolveNext = (result) => {
              if (!result.done) {
                resolve(result.value)
              }
            }
          })
        }
      }
    } finally {
      this.wsConnection.removeEventListener('message', messageHandler)
      
      // Unsubscribe from task updates
      const unsubscribeMessage = {
        type: 'unsubscribe',
        taskId,
        timestamp: new Date().toISOString()
      }
      
      if (this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify(unsubscribeMessage))
      }
    }
  }

  // Batch task submission
  async batchSubmitTasks(tasks: TaskInput[]): Promise<TaskResponse[]> {
    const batchSize = (this.config as AgentAreaConfig)?.batchSize || 10
    const results: TaskResponse[] = []

    // Process tasks in batches
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize)
      
      try {
        const response = await fetch(`${this.config?.endpoint}/tasks/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`
          },
          body: JSON.stringify({ tasks: batch })
        })

        if (!response.ok) {
          throw new Error(`Batch submission failed: ${response.statusText}`)
        }

        const batchResults = await response.json() as any
        results.push(...batchResults.tasks)
      } catch (error) {
        // Create error responses for failed batch
        const errorResponses = batch.map(task => ({
          task: {
            id: `error-${Date.now()}-${Math.random()}`,
            status: 'failed' as const,
            input: task,
            error: {
              code: 'BATCH_SUBMISSION_FAILED',
              message: (error as Error).message
            },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          streaming: false
        }))
        results.push(...errorResponses)
      }
    }

    return results
  }

  // Task template management
  async createTaskTemplate(template: TaskTemplate): Promise<string> {
    try {
      const response = await fetch(`${this.config?.endpoint}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(template)
      })

      if (!response.ok) {
        throw new Error(`Template creation failed: ${response.statusText}`)
      }

      const result = await response.json() as any
      const templateId = result.id || `template-${Date.now()}`
      
      // Cache template locally
      this.taskTemplates.set(templateId, { ...template, id: templateId })
      
      return templateId
    } catch (error) {
      throw new Error(`Failed to create task template: ${(error as Error).message}`)
    }
  }

  // Task scheduling
  async scheduleTask(taskId: string, schedule: TaskSchedule): Promise<void> {
    try {
      const response = await fetch(`${this.config?.endpoint}/tasks/${taskId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(schedule)
      })

      if (!response.ok) {
        throw new Error(`Task scheduling failed: ${response.statusText}`)
      }

      // Cache schedule locally
      this.scheduledTasks.set(taskId, schedule)
    } catch (error) {
      throw new Error(`Failed to schedule task: ${(error as Error).message}`)
    }
  }

  // Task analytics
  async getTaskAnalytics(taskId: string): Promise<TaskAnalytics> {
    try {
      const response = await fetch(`${this.config?.endpoint}/tasks/${taskId}/analytics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Analytics retrieval failed: ${response.statusText}`)
      }

      return await response.json() as TaskAnalytics
    } catch (error) {
      throw new Error(`Failed to get task analytics: ${(error as Error).message}`)
    }
  }

  // WebSocket connection establishment
  private async establishWebSocketConnection(endpoint: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = endpoint.replace(/^https?:/, 'wss:').replace(/^http:/, 'ws:') + '/ws'
      
      this.wsConnection = new WebSocket(wsUrl, ['agentarea-protocol'])
      
      this.wsConnection.onopen = () => {
        // Authenticate WebSocket connection
        const authMessage = {
          type: 'auth',
          token: this.authToken,
          timestamp: new Date().toISOString()
        }
        this.wsConnection!.send(JSON.stringify(authMessage))
        resolve()
      }

      this.wsConnection.onerror = (error) => {
        reject(new Error('WebSocket connection failed'))
      }

      this.wsConnection.onclose = () => {
        this.wsConnection = undefined
      }

      // Set connection timeout
      setTimeout(() => {
        if (this.wsConnection?.readyState !== WebSocket.OPEN) {
          this.wsConnection?.close()
          reject(new Error('WebSocket connection timeout'))
        }
      }, 10000)
    })
  } 
 // Required AgentRuntime methods implementation
  async submitTask(input: TaskInput, connectionId?: string): Promise<TaskResponse> {
    try {
      const response = await fetch(`${this.config?.endpoint}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        throw new Error(`Task submission failed: ${response.statusText}`)
      }

      const result = await response.json() as any
      return {
        task: result.task,
        streaming: !!this.wsConnection
      }
    } catch (error) {
      throw new Error(`Failed to submit task: ${(error as Error).message}`)
    }
  }

  async cancelTask(taskId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config?.endpoint}/tasks/${taskId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Task cancellation failed: ${response.statusText}`)
      }
    } catch (error) {
      throw new Error(`Failed to cancel task: ${(error as Error).message}`)
    }
  }

  async getTask(taskId: string): Promise<Task> {
    try {
      const response = await fetch(`${this.config?.endpoint}/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Task retrieval failed: ${response.statusText}`)
      }

      return await response.json() as Task
    } catch (error) {
      throw new Error(`Failed to get task: ${(error as Error).message}`)
    }
  }

  // Input request handling
  async handleInputRequest(taskId: string, response: InputResponse): Promise<void> {
    try {
      const apiResponse = await fetch(`${this.config?.endpoint}/tasks/${taskId}/input`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(response)
      })

      if (!apiResponse.ok) {
        throw new Error(`Input response submission failed: ${apiResponse.statusText}`)
      }
    } catch (error) {
      throw new Error(`Failed to handle input request: ${(error as Error).message}`)
    }
  }

  // Real-time subscriptions
  subscribeToTask(taskId: string, callback: TaskUpdateCallback): Subscription {
    const subscriptionId = `task-${taskId}-${Date.now()}`

    if (this.wsConnection) {
      // Use WebSocket for real-time updates
      const messageHandler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'task-update' && data.taskId === taskId) {
            callback(data as TaskUpdate)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.wsConnection.addEventListener('message', messageHandler)

      // Subscribe to task updates
      const subscribeMessage = {
        type: 'subscribe',
        taskId,
        timestamp: new Date().toISOString()
      }
      this.wsConnection.send(JSON.stringify(subscribeMessage))

      return this.createSubscription(subscriptionId, () => {
        if (this.wsConnection) {
          this.wsConnection.removeEventListener('message', messageHandler)
          
          // Unsubscribe from task updates
          const unsubscribeMessage = {
            type: 'unsubscribe',
            taskId,
            timestamp: new Date().toISOString()
          }
          this.wsConnection.send(JSON.stringify(unsubscribeMessage))
        }
      })
    } else {
      // Fallback to polling
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
      }, 2000) // Poll every 2 seconds

      return this.createSubscription(subscriptionId, () => {
        clearInterval(pollInterval)
      })
    }
  }

  subscribeToAgent(agentId: string, callback: AgentUpdateCallback): Subscription {
    const subscriptionId = `agent-${agentId}-${Date.now()}`

    if (this.wsConnection) {
      // Use WebSocket for real-time agent updates
      const messageHandler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'agent-update' && data.agentId === agentId) {
            callback(data as any)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.wsConnection.addEventListener('message', messageHandler)

      // Subscribe to agent updates
      const subscribeMessage = {
        type: 'subscribe-agent',
        agentId,
        timestamp: new Date().toISOString()
      }
      this.wsConnection.send(JSON.stringify(subscribeMessage))

      return this.createSubscription(subscriptionId, () => {
        if (this.wsConnection) {
          this.wsConnection.removeEventListener('message', messageHandler)
          
          // Unsubscribe from agent updates
          const unsubscribeMessage = {
            type: 'unsubscribe-agent',
            agentId,
            timestamp: new Date().toISOString()
          }
          this.wsConnection.send(JSON.stringify(unsubscribeMessage))
        }
      })
    } else {
      // Fallback to periodic status check
      const pollInterval = setInterval(async () => {
        try {
          // Check service health as proxy for agent status
          const response = await fetch(`${this.config?.endpoint}/health`, {
            headers: { 'Authorization': `Bearer ${this.authToken}` }
          })
          
          callback({
            agentId,
            status: response.ok ? 'online' : 'error',
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
  }

  // Artifact management
  async downloadArtifact(artifactId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.config?.endpoint}/artifacts/${artifactId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Artifact download failed: ${response.statusText}`)
      }

      return await response.blob()
    } catch (error) {
      throw new Error(`Failed to download artifact: ${(error as Error).message}`)
    }
  }

  async uploadArtifact(file: File, metadata?: ArtifactMetadata): Promise<EnhancedArtifact> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata))
      }

      const response = await fetch(`${this.config?.endpoint}/artifacts/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Artifact upload failed: ${response.statusText}`)
      }

      const result = await response.json() as any
      return {
        ...result,
        displayType: this.determineDisplayType(file.type),
        downloadable: true,
        shareable: true,
        size: file.size,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } catch (error) {
      throw new Error(`Failed to upload artifact: ${(error as Error).message}`)
    }
  }

  // Protocol message handling
  async sendMessage(message: ProtocolMessage, targetAgent: string): Promise<void> {
    try {
      const response = await fetch(`${this.config?.endpoint}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          ...message,
          target: targetAgent
        })
      })

      if (!response.ok) {
        throw new Error(`Message sending failed: ${response.statusText}`)
      }
    } catch (error) {
      throw new Error(`Failed to send message: ${(error as Error).message}`)
    }
  }

  async handleProtocolMessage(message: ProtocolMessage): Promise<void> {
    // Handle incoming protocol messages
    console.log('Received protocol message:', message)
    
    // Process different message types
    switch (message.type) {
      case 'task-update':
        if (message.payload) {
          const update = message.payload as TaskUpdate
          this.emitTaskUpdate(update)
        }
        break
      case 'input-request':
        // Handle input requests from agents
        // This could trigger UI components to show input forms
        break
      case 'notification':
        // Handle general notifications
        break
      default:
        console.log('Unknown message type:', message.type)
    }
  }

  // Capabilities
  getSupportedCapabilities(): string[] {
    const capabilities = [
      'task-submission',
      'task-cancellation',
      'input-handling',
      'artifact-upload',
      'artifact-download',
      'batch-processing',
      'task-templates',
      'task-scheduling',
      'analytics'
    ]

    if (this.wsConnection) {
      capabilities.push('real-time-updates', 'streaming')
    }

    return capabilities
  }

  // Feature support
  supportsStreaming(): boolean {
    return !!this.wsConnection
  }

  supportsPushNotifications(): boolean {
    return !!this.wsConnection
  }

  // Helper methods
  private determineDisplayType(mimeType: string): 'text' | 'code' | 'file' | 'image' | 'data' {
    if (mimeType.startsWith('image/')) {
      return 'image'
    } else if (mimeType.startsWith('text/')) {
      return 'text'
    } else if (mimeType.includes('json') || mimeType.includes('xml')) {
      return 'data'
    } else if (mimeType.includes('javascript') || mimeType.includes('python') || mimeType.includes('code')) {
      return 'code'
    } else {
      return 'file'
    }
  }

  // Legacy compatibility methods
  async sendTask(input: TaskInput): Promise<TaskResponse> {
    return this.submitTask(input)
  }

  async *streamTask(input: TaskInput): AsyncIterable<TaskUpdate> {
    const response = await this.submitTask(input)
    const taskId = response.task.id

    // Use the streaming capability if available
    if (this.supportsStreaming()) {
      yield* this.streamTaskUpdates(taskId)
    } else {
      // Fallback to single response
      yield {
        taskId,
        status: response.task.status,
        progress: response.task.progress,
        artifacts: response.task.artifacts,
        messages: response.task.messages,
        error: response.task.error
      }
    }
  }

  async getAgentCard(): Promise<AgentCard> {
    try {
      const response = await fetch(`${this.config?.endpoint}/agent-card`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Agent card retrieval failed: ${response.statusText}`)
      }

      return await response.json() as AgentCard
    } catch (error) {
      // Return a default agent card for AgentArea service
      return {
        name: 'AgentArea Service',
        description: 'Custom AgentArea protocol service',
        capabilities: this.getSupportedCapabilities().map(cap => ({
          name: cap,
          description: `${cap} capability`,
          inputTypes: ['message'],
          outputTypes: ['message', 'task']
        })),
        endpoints: { main: this.config?.endpoint || '' },
        streaming: this.supportsStreaming(),
        pushNotifications: this.supportsPushNotifications()
      }
    }
  }

  async getCapabilities(): Promise<Capability[]> {
    const agentCard = await this.getAgentCard()
    return agentCard.capabilities
  }
}

// Factory function for creating AgentArea runtime
export function createAgentAreaRuntime(config: AgentAreaConfig): AgentAreaRuntime {
  return new AgentAreaRuntime(config)
}