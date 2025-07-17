// Runtime interface for protocol-agnostic agent communication
import type { 
  AgentCard,
  Task,
  TaskInput, 
  TaskResponse, 
  TaskUpdate, 
  Capability,
  TaskInputRequest,
  InputResponse,
  EnhancedArtifact,
  CommunicationBlock,
  AuthConfig
} from './core'

// Base AgentRuntime interface with protocol identification
export interface AgentRuntime {
  // Protocol identification
  readonly protocolType: 'a2a' | 'agentarea' | 'custom'
  readonly version: string
  
  // Connection management
  connect(endpoint: string, config: ConnectionConfig): Promise<Connection>
  disconnect(connectionId?: string): Promise<void>
  
  // Task lifecycle with input handling
  submitTask(input: TaskInput, connectionId?: string): Promise<TaskResponse>
  handleInputRequest(taskId: string, response: InputResponse): Promise<void>
  cancelTask(taskId: string): Promise<void>
  getTask(taskId: string): Promise<Task>
  
  // Real-time updates
  subscribeToTask(taskId: string, callback: TaskUpdateCallback): Subscription
  subscribeToAgent(agentId: string, callback: AgentUpdateCallback): Subscription
  
  // Artifact management
  downloadArtifact(artifactId: string): Promise<Blob>
  uploadArtifact(file: File, metadata?: ArtifactMetadata): Promise<EnhancedArtifact>
  
  // Communication protocol
  sendMessage(message: ProtocolMessage, targetAgent: string): Promise<void>
  handleProtocolMessage(message: ProtocolMessage): Promise<void>
  
  // Protocol-specific capabilities
  getSupportedCapabilities(): string[]
  validateConnection(config: ConnectionConfig): Promise<ValidationResult>
  
  // Legacy compatibility
  sendTask?(input: TaskInput): Promise<TaskResponse>
  streamTask?(input: TaskInput): AsyncIterable<TaskUpdate>
  getAgentCard?(): Promise<AgentCard>
  getCapabilities?(): Promise<Capability[]>
  isConnected?(): boolean
  supportsStreaming?(): boolean
  supportsPushNotifications?(): boolean
  addEventListener?(listener: RuntimeEventListener): void
  removeEventListener?(listener: RuntimeEventListener): void
  config?: RuntimeConfig
}

export interface RuntimeConfig {
  endpoint?: string
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

export interface RuntimeFactory<T extends RuntimeConfig = RuntimeConfig> {
  (config: T): AgentRuntime
}

// Runtime events
export type RuntimeEvent = 
  | { type: 'connected'; runtime: AgentRuntime }
  | { type: 'disconnected'; runtime: AgentRuntime }
  | { type: 'error'; error: Error; runtime: AgentRuntime }
  | { type: 'task-update'; update: TaskUpdate; runtime: AgentRuntime }

export interface RuntimeEventListener {
  (event: RuntimeEvent): void
}

// Connection and configuration interfaces
export interface Connection {
  id: string
  agentId: string
  endpoint: string
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  protocols: string[]
  metadata: Record<string, unknown>
  createdAt: Date
  lastActivity: Date
}

export interface ConnectionConfig {
  endpoint: string
  authentication: AuthConfig
  protocols: string[]
  options?: {
    timeout?: number
    retryAttempts?: number
    heartbeatInterval?: number
  }
}

// Subscription and callback interfaces
export interface Subscription {
  unsubscribe(): void
  isActive(): boolean
}

export interface TaskUpdateCallback {
  (update: TaskUpdate): void
}

export interface AgentUpdateCallback {
  (update: AgentUpdate): void
}

export interface AgentUpdate {
  agentId: string
  status: 'online' | 'offline' | 'busy' | 'error'
  capabilities?: Capability[]
  metadata?: Record<string, unknown>
  timestamp: Date
}

// Protocol message interfaces
export interface ProtocolMessage {
  id: string
  type: string
  source: string
  target: string
  payload: unknown
  timestamp: Date
  metadata?: Record<string, unknown>
}

// Artifact metadata interface
export interface ArtifactMetadata {
  name?: string
  description?: string
  tags?: string[]
  category?: string
  [key: string]: unknown
}

// Validation result interface
export interface ValidationResult {
  valid: boolean
  errors?: ValidationError[]
  warnings?: ValidationWarning[]
}

export interface ValidationError {
  code: string
  message: string
  field?: string
  data?: unknown
}

export interface ValidationWarning {
  code: string
  message: string
  field?: string
  data?: unknown
}

// A2A Protocol Runtime interface
export interface A2ARuntimeInterface extends AgentRuntime {
  readonly protocolType: 'a2a'
  
  // A2A-specific methods
  discoverAgents(endpoint: string): Promise<AgentCard[]>
  negotiateCapabilities(agentId: string, capabilities: string[]): Promise<string[]>
  handleA2AMessage(message: A2AMessage): Promise<void>
  
  // A2A protocol compliance
  validateA2ACompliance(endpoint: string): Promise<ComplianceResult>
  getA2AMetadata(): A2AMetadata
}

// AgentArea Custom Runtime interface
export interface AgentAreaRuntimeInterface extends AgentRuntime {
  readonly protocolType: 'agentarea'
  
  // Custom protocol methods
  authenticateWithToken(token: string): Promise<AuthResult>
  streamTaskUpdates(taskId: string): AsyncIterable<TaskUpdate>
  batchSubmitTasks(tasks: TaskInput[]): Promise<TaskResponse[]>
  
  // Enhanced features specific to AgentArea protocol
  createTaskTemplate(template: TaskTemplate): Promise<string>
  scheduleTask(taskId: string, schedule: TaskSchedule): Promise<void>
  getTaskAnalytics(taskId: string): Promise<TaskAnalytics>
}

// A2A-specific interfaces
export interface A2AMessage extends ProtocolMessage {
  protocolVersion: string
  messageType: 'request' | 'response' | 'notification'
  correlationId?: string
}

export interface ComplianceResult {
  compliant: boolean
  version: string
  supportedFeatures: string[]
  issues?: ComplianceIssue[]
}

export interface ComplianceIssue {
  severity: 'error' | 'warning' | 'info'
  code: string
  message: string
  recommendation?: string
}

export interface A2AMetadata {
  version: string
  supportedMessageTypes: string[]
  capabilities: string[]
  extensions?: Record<string, unknown>
}

// AgentArea-specific interfaces
export interface AuthResult {
  success: boolean
  token?: string
  expiresAt?: Date
  permissions?: string[]
  error?: string
}

export interface TaskTemplate {
  id?: string
  name: string
  description: string
  inputSchema: object
  defaultValues?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface TaskSchedule {
  type: 'immediate' | 'delayed' | 'recurring'
  startTime?: Date
  delay?: number
  interval?: number
  endTime?: Date
  timezone?: string
}

export interface TaskAnalytics {
  taskId: string
  executionTime: number
  resourceUsage: ResourceUsage
  performance: PerformanceMetrics
  errors?: AnalyticsError[]
}

export interface ResourceUsage {
  cpu?: number
  memory?: number
  network?: number
  storage?: number
}

export interface PerformanceMetrics {
  responseTime: number
  throughput: number
  errorRate: number
  availability: number
}

export interface AnalyticsError {
  timestamp: Date
  code: string
  message: string
  count: number
}

// Runtime Factory and Management interfaces
export interface RuntimeFactory {
  createRuntime(protocolType: 'a2a' | 'agentarea', config: RuntimeConfig): AgentRuntime
  getSupportedProtocols(): string[]
  detectProtocol(endpoint: string): Promise<string>
}

export interface RuntimeManager {
  runtimes: Map<string, AgentRuntime>
  activeRuntime?: AgentRuntime
  
  // Runtime management
  registerRuntime(id: string, runtime: AgentRuntime): void
  switchRuntime(runtimeId: string): Promise<void>
  getRuntime(protocolType: string): AgentRuntime | undefined
  
  // Multi-protocol operations
  submitTaskToAnyRuntime(input: TaskInput, preferredProtocol?: string): Promise<TaskResponse>
  broadcastMessage(message: ProtocolMessage, protocols?: string[]): Promise<void>
}