// Runtime interface for protocol-agnostic agent communication
import type { 
  AgentCard,
  Task,
  TaskInput, 
  TaskResponse, 
  TaskUpdate, 
  Capability 
} from './core'

export interface AgentRuntime {
  // Core task methods
  sendTask(input: TaskInput): Promise<TaskResponse>
  streamTask?(input: TaskInput): AsyncIterable<TaskUpdate>
  getTask(taskId: string): Promise<Task>
  cancelTask(taskId: string): Promise<void>
  
  // Agent discovery
  getAgentCard(): Promise<AgentCard>
  getCapabilities(): Promise<Capability[]>
  
  // Connection management
  connect(config: RuntimeConfig): Promise<void>
  disconnect(): Promise<void>
  
  // Runtime state
  isConnected(): boolean
  supportsStreaming(): boolean
  supportsPushNotifications(): boolean
  
  // Event management
  addEventListener(listener: RuntimeEventListener): void
  removeEventListener(listener: RuntimeEventListener): void
  
  // Configuration access
  config: RuntimeConfig
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