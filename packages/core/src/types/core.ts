// Core types for protocol-agnostic agent communication

export interface Message {
  role: 'user' | 'agent'
  parts: MessagePart[]
  metadata?: Record<string, unknown>
}

export interface MessagePart {
  type: 'text' | 'file' | 'data'
  content: string | object
  mimeType?: string
}

export interface TaskInput {
  message: Message
  context?: Record<string, unknown>
  capabilities?: string[]
}

export interface Task {
  id: string
  contextId?: string
  status: TaskStatus
  input: TaskInput
  artifacts?: Artifact[]
  messages?: Message[]
  progress?: TaskProgress
  error?: TaskError
  createdAt: Date
  updatedAt: Date
}

export type TaskStatus = 
  | 'submitted' 
  | 'working' 
  | 'input-required' 
  | 'completed' 
  | 'canceled' 
  | 'failed' 
  | 'rejected'

export interface TaskProgress {
  percentage?: number
  description?: string
  step?: number
  totalSteps?: number
}

export interface Artifact {
  id: string
  type: string
  content: unknown
  mimeType?: string
  metadata?: Record<string, unknown>
}

export interface TaskError {
  code: string
  message: string
  data?: unknown
}

export interface AgentCard {
  name: string
  description: string
  capabilities: Capability[]
  endpoints: Record<string, string>
  authentication?: AuthConfig
  streaming?: boolean
  pushNotifications?: boolean
}

export interface Capability {
  name: string
  description: string
  inputTypes: string[]
  outputTypes: string[]
}

export interface AuthConfig {
  type: 'bearer' | 'api-key' | 'oauth' | 'openid'
  config?: Record<string, unknown>
}

export interface TaskResponse {
  task: Task
  streaming?: boolean
}

export interface TaskUpdate {
  taskId: string
  status?: TaskStatus
  progress?: TaskProgress
  artifacts?: Artifact[]
  messages?: Message[]
  error?: TaskError
}