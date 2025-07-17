// Base runtime implementation with common functionality

import type { 
  AgentRuntime, 
  RuntimeConfig, 
  RuntimeEvent, 
  RuntimeEventListener,
  Task,
  TaskInput,
  TaskResponse,
  TaskUpdate,
  AgentCard,
  Capability,
  Connection,
  ConnectionConfig,
  TaskInputRequest,
  InputResponse,
  EnhancedArtifact,
  ArtifactMetadata,
  ProtocolMessage,
  Subscription,
  TaskUpdateCallback,
  AgentUpdateCallback,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '../types'

export abstract class BaseRuntime implements AgentRuntime {
  public config?: RuntimeConfig
  protected connections: Map<string, Connection> = new Map()
  protected activeSubscriptions: Map<string, Subscription> = new Map()
  protected listeners: Set<RuntimeEventListener> = new Set()
  protected initialized = false

  // Protocol identification - must be implemented by subclasses
  abstract readonly protocolType: 'a2a' | 'agentarea' | 'custom'
  abstract readonly version: string

  constructor(config?: RuntimeConfig) {
    this.config = config
    this.initialize()
  }

  // Initialization logic
  protected initialize(): void {
    if (this.initialized) return
    
    // Validate configuration
    this.validateRuntimeConfig()
    
    // Set up default connection options
    this.setupDefaultOptions()
    
    // Initialize protocol-specific settings
    this.initializeProtocolSettings()
    
    this.initialized = true
  }

  protected validateRuntimeConfig(): void {
    // Configuration is optional for backward compatibility
    if (!this.config) {
      return
    }
    
    // Validate endpoint if provided
    if (this.config.endpoint && !this.isValidEndpoint(this.config.endpoint)) {
      throw new Error(`Invalid endpoint: ${this.config.endpoint}`)
    }
    
    // Validate authentication if provided
    if (this.config.authentication) {
      this.validateAuthConfig(this.config.authentication)
    }
  }

  protected setupDefaultOptions(): void {
    if (!this.config) return
    
    // Set default timeout
    this.config.timeout = this.config.timeout || 30000
    
    // Set default retry attempts
    this.config.retries = this.config.retries || 3
  }

  protected abstract initializeProtocolSettings(): void

  // Protocol detection utilities
  protected isValidEndpoint(endpoint: string): boolean {
    try {
      const url = new URL(endpoint)
      return ['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)
    } catch {
      return false
    }
  }

  protected validateAuthConfig(auth: any): void {
    if (!auth.type) {
      throw new Error('Authentication type is required')
    }
    
    const validTypes = ['bearer', 'api-key', 'oauth', 'openid']
    if (!validTypes.includes(auth.type)) {
      throw new Error(`Invalid authentication type: ${auth.type}`)
    }
    
    // Type-specific validation
    switch (auth.type) {
      case 'bearer':
        if (!auth.token) {
          throw new Error('Bearer token is required for bearer authentication')
        }
        break
      case 'api-key':
        if (!auth.apiKey) {
          throw new Error('API key is required for api-key authentication')
        }
        break
    }
  }

  // Connection management with shared functionality
  protected generateConnectionId(): string {
    return `conn-${this.protocolType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  protected createConnection(endpoint: string, config: ConnectionConfig): Connection {
    const connection: Connection = {
      id: this.generateConnectionId(),
      agentId: config.endpoint, // Will be updated after successful connection
      endpoint,
      status: 'connecting',
      protocols: config.protocols,
      metadata: {},
      createdAt: new Date(),
      lastActivity: new Date()
    }
    
    this.connections.set(connection.id, connection)
    return connection
  }

  protected updateConnectionStatus(connectionId: string, status: Connection['status']): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.status = status
      connection.lastActivity = new Date()
      
      // Emit connection events
      if (status === 'connected') {
        this.emit({ type: 'connected', runtime: this })
      } else if (status === 'disconnected') {
        this.emit({ type: 'disconnected', runtime: this })
      }
    }
  }

  protected removeConnection(connectionId: string): void {
    this.connections.delete(connectionId)
  }

  // Shared validation utilities
  protected async validateConnectionConfig(config: ConnectionConfig): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    // Validate endpoint
    if (!config.endpoint) {
      errors.push({
        code: 'MISSING_ENDPOINT',
        message: 'Endpoint is required',
        field: 'endpoint'
      })
    } else if (!this.isValidEndpoint(config.endpoint)) {
      errors.push({
        code: 'INVALID_ENDPOINT',
        message: 'Invalid endpoint URL format',
        field: 'endpoint',
        data: { endpoint: config.endpoint }
      })
    }
    
    // Validate authentication
    if (!config.authentication) {
      warnings.push({
        code: 'NO_AUTHENTICATION',
        message: 'No authentication provided - connection may fail',
        field: 'authentication'
      })
    } else {
      try {
        this.validateAuthConfig(config.authentication)
      } catch (error) {
        errors.push({
          code: 'INVALID_AUTHENTICATION',
          message: (error as Error).message,
          field: 'authentication'
        })
      }
    }
    
    // Validate protocols
    if (!config.protocols || config.protocols.length === 0) {
      warnings.push({
        code: 'NO_PROTOCOLS',
        message: 'No protocols specified - using defaults',
        field: 'protocols'
      })
    }
    
    // Validate options
    if (config.options) {
      if (config.options.timeout && config.options.timeout < 1000) {
        warnings.push({
          code: 'LOW_TIMEOUT',
          message: 'Timeout is very low and may cause connection issues',
          field: 'options.timeout',
          data: { timeout: config.options.timeout }
        })
      }
      
      if (config.options.retryAttempts && config.options.retryAttempts > 10) {
        warnings.push({
          code: 'HIGH_RETRY_ATTEMPTS',
          message: 'High retry attempts may cause long delays',
          field: 'options.retryAttempts',
          data: { retryAttempts: config.options.retryAttempts }
        })
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  // Subscription management
  protected createSubscription(
    id: string,
    cleanup: () => void
  ): Subscription {
    const subscription: Subscription = {
      unsubscribe: () => {
        cleanup()
        this.activeSubscriptions.delete(id)
      },
      isActive: () => this.activeSubscriptions.has(id)
    }
    
    this.activeSubscriptions.set(id, subscription)
    return subscription
  }

  protected cleanupAllSubscriptions(): void {
    this.activeSubscriptions.forEach(subscription => {
      if (subscription.isActive()) {
        subscription.unsubscribe()
      }
    })
    this.activeSubscriptions.clear()
  }

  // Connection state management
  isConnected(): boolean {
    return Array.from(this.connections.values()).some(conn => conn.status === 'connected')
  }

  getConnections(): Connection[] {
    return Array.from(this.connections.values())
  }

  getConnection(connectionId: string): Connection | undefined {
    return this.connections.get(connectionId)
  }

  getActiveConnections(): Connection[] {
    return Array.from(this.connections.values()).filter(conn => conn.status === 'connected')
  }

  // New methods for multi-runtime architecture (with default implementations for compatibility)
  async connect(endpoint: string, config: ConnectionConfig): Promise<Connection> {
    // Validate connection configuration
    const validation = await this.validateConnectionConfig(config)
    if (!validation.valid) {
      const errorMessages = validation.errors?.map(e => e.message).join(', ') || 'Invalid configuration'
      throw new Error(`Connection validation failed: ${errorMessages}`)
    }

    // Create connection object
    const connection = this.createConnection(endpoint, config)
    
    try {
      // Delegate to protocol-specific implementation
      await this.performConnect(connection, config)
      this.updateConnectionStatus(connection.id, 'connected')
      return connection
    } catch (error) {
      this.updateConnectionStatus(connection.id, 'error')
      this.removeConnection(connection.id)
      throw error
    }
  }
  
  async disconnect(connectionId?: string): Promise<void> {
    if (connectionId) {
      // Disconnect specific connection
      const connection = this.connections.get(connectionId)
      if (connection) {
        await this.performDisconnect(connection)
        this.updateConnectionStatus(connectionId, 'disconnected')
        this.removeConnection(connectionId)
      }
    } else {
      // Disconnect all connections
      const connections = Array.from(this.connections.values())
      await Promise.all(connections.map(conn => this.performDisconnect(conn)))
      this.connections.clear()
    }
    
    // Clean up subscriptions
    this.cleanupAllSubscriptions()
  }
  
  submitTask(input: TaskInput, connectionId?: string): Promise<TaskResponse> {
    // Default implementation delegates to legacy sendTask if available
    if (this.sendTask) {
      return this.sendTask(input)
    }
    throw new Error('submitTask method not implemented')
  }
  
  handleInputRequest(taskId: string, response: InputResponse): Promise<void> {
    // Default implementation for backward compatibility
    throw new Error('handleInputRequest method not implemented')
  }
  
  abstract cancelTask(taskId: string): Promise<void>
  abstract getTask(taskId: string): Promise<Task>
  
  subscribeToTask(taskId: string, callback: TaskUpdateCallback): Subscription {
    // Default implementation for backward compatibility
    throw new Error('subscribeToTask method not implemented')
  }
  
  subscribeToAgent(agentId: string, callback: AgentUpdateCallback): Subscription {
    // Default implementation for backward compatibility
    throw new Error('subscribeToAgent method not implemented')
  }
  
  downloadArtifact(artifactId: string): Promise<Blob> {
    // Default implementation for backward compatibility
    throw new Error('downloadArtifact method not implemented')
  }
  
  uploadArtifact(file: File, metadata?: ArtifactMetadata): Promise<EnhancedArtifact> {
    // Default implementation for backward compatibility
    throw new Error('uploadArtifact method not implemented')
  }
  
  sendMessage(message: ProtocolMessage, targetAgent: string): Promise<void> {
    // Default implementation for backward compatibility
    throw new Error('sendMessage method not implemented')
  }
  
  handleProtocolMessage(message: ProtocolMessage): Promise<void> {
    // Default implementation for backward compatibility
    throw new Error('handleProtocolMessage method not implemented')
  }
  
  getSupportedCapabilities(): string[] {
    // Default implementation for backward compatibility
    return []
  }
  
  async validateConnection(config: ConnectionConfig): Promise<ValidationResult> {
    return this.validateConnectionConfig(config)
  }

  // Protocol-specific connection methods (to be implemented by subclasses)
  protected abstract performConnect(connection: Connection, config: ConnectionConfig): Promise<void>
  protected abstract performDisconnect(connection: Connection): Promise<void>

  // Legacy compatibility methods (optional)
  sendTask?(input: TaskInput): Promise<TaskResponse>
  streamTask?(input: TaskInput): AsyncIterable<TaskUpdate>
  getAgentCard?(): Promise<AgentCard>
  getCapabilities?(): Promise<Capability[]>

  // Feature support (override in subclasses)
  supportsStreaming(): boolean {
    return typeof this.streamTask === 'function'
  }

  supportsPushNotifications(): boolean {
    return false // Override in subclasses that support push notifications
  }

  // Event management
  addEventListener(listener: RuntimeEventListener): void {
    this.listeners.add(listener)
  }

  removeEventListener(listener: RuntimeEventListener): void {
    this.listeners.delete(listener)
  }

  protected emit(event: RuntimeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in runtime event listener:', error)
      }
    })
  }

  protected setConnected(connected: boolean): void {
    const wasConnected = this.isConnected()
    if (wasConnected !== connected) {
      this.emit({
        type: connected ? 'connected' : 'disconnected',
        runtime: this
      })
    }
  }

  protected emitError(error: Error): void {
    this.emit({
      type: 'error',
      error,
      runtime: this
    })
  }

  protected emitTaskUpdate(update: TaskUpdate): void {
    this.emit({
      type: 'task-update',
      update,
      runtime: this
    })
  }
}