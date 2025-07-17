// Core types for protocol-agnostic agent communication

// Re-export AuthConfig from runtime to avoid circular dependencies
export interface AuthConfig {
  type: 'bearer' | 'api-key' | 'oauth' | 'openid'
  config?: Record<string, unknown>
}

export interface Message {
  role: 'user' | 'agent'
  parts: MessagePart[]
  metadata?: Record<string, unknown>
}

export interface MessagePart {
  type: 'text' | 'file' | 'data' | 'tool_call'
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

// Enhanced artifact types with display metadata and rendering options
export interface EnhancedArtifact extends Artifact {
  displayType: 'text' | 'code' | 'file' | 'image' | 'data'
  renderOptions?: ArtifactRenderOptions
  downloadable?: boolean
  shareable?: boolean
  size?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface ArtifactRenderOptions {
  collapsible?: boolean
  expandable?: boolean
  showMetadata?: boolean
  showTimestamp?: boolean
  maxHeight?: number
  language?: string // for code artifacts
  theme?: 'light' | 'dark' | 'auto'
}

export interface ArtifactContent {
  text?: string
  code?: { language: string; content: string }
  file?: { name: string; url: string; size: number; mimeType: string }
  image?: { url: string; alt?: string; width?: number; height?: number }
  data?: { schema?: object; content: unknown }
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

// Task input request and response interfaces for input collection
export interface TaskInputRequest {
  id: string
  taskId: string
  type: 'text' | 'selection' | 'approval' | 'file' | 'form'
  prompt: string
  required: boolean
  validation?: ValidationRule[]
  options?: InputOption[]
  metadata?: Record<string, unknown>
  timeout?: number
  createdAt: Date
}

export interface InputResponse {
  requestId: string
  taskId: string
  value: unknown
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: unknown
  message: string
}

export interface InputOption {
  value: unknown
  label: string
  description?: string
  disabled?: boolean
  metadata?: Record<string, unknown>
}

export interface FormField {
  name: string
  type: string
  label: string
  placeholder?: string
  validation?: ValidationRule[]
  options?: InputOption[]
}

// Enhanced task with input capabilities
export interface TaskWithInputs extends Task {
  inputRequests?: TaskInputRequest[]
  inputResponses?: InputResponse[]
  communicationBlocks?: CommunicationBlock[]
  enhancedArtifacts?: EnhancedArtifact[]
}

// Communication block for agent-to-agent protocol display
export interface CommunicationBlock {
  id: string
  taskId?: string
  type: 'message' | 'protocol' | 'status' | 'metadata'
  timestamp: Date
  source: string
  target?: string
  content: unknown
  metadata?: Record<string, unknown>
}