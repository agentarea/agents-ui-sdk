# AgentArea UI SDK - API Reference

Complete API documentation for all components, hooks, and utilities in the AgentArea UI SDK.

## Table of Contents

- [AgentUI Entry Point](#agentui-entry-point)
- [Artifact Components](#artifact-components)
- [Input Components](#input-components)
- [Block Components](#block-components)
- [Enhanced Task Components](#enhanced-task-components)
- [Enhanced Chat Components](#enhanced-chat-components)
- [Hooks](#hooks)
- [Providers](#providers)
- [Types](#types)
- [Utilities](#utilities)

## AgentUI Entry Point

### AgentUI

Main entry point component that provides runtime management and context.

```tsx
interface AgentUIProps {
  // Runtime configuration
  runtime?: 'a2a' | 'agentarea' | AgentRuntime
  endpoint?: string
  authentication?: AuthConfig
  
  // Connection options
  autoConnect?: boolean
  reconnectAttempts?: number
  
  // UI configuration
  theme?: 'light' | 'dark' | 'system'
  className?: string
  
  // Development options
  debug?: boolean
  devTools?: boolean
  
  // Environment configuration
  config?: AgentUIConfig
  
  children: ReactNode
}
```

**Usage:**
```tsx
<AgentUI 
  runtime="a2a" 
  endpoint="https://api.example.com"
  autoConnect
  debug
>
  <Task id="task-1" />
  <Chat taskId="task-1" />
</AgentUI>
```

### AgentUI.Provider

Explicit provider pattern for more control over context management.

```tsx
interface AgentUIProviderProps {
  runtime?: 'a2a' | 'agentarea' | AgentRuntime
  endpoint?: string
  authentication?: AuthConfig
  config?: AgentUIConfig
  children: ReactNode
}
```

**Usage:**
```tsx
<AgentUI.Provider runtime="agentarea" endpoint="wss://api.example.com">
  <AgentUI.Connection />
  <Task.List />
</AgentUI.Provider>
```

### AgentUI.Connection

Connection status and management display component.

```tsx
interface AgentUIConnectionProps {
  showStatus?: boolean
  showLatency?: boolean
  showActions?: boolean
  className?: string
}
```

**Usage:**
```tsx
<AgentUI.Connection 
  showStatus 
  showLatency 
  showActions 
/>
```

### AgentUI.Debug

Development tools and debugging component.

```tsx
interface AgentUIDebugProps {
  showEnvironment?: boolean
  showRuntime?: boolean
  showConnections?: boolean
  showConfig?: boolean
  className?: string
}
```

**Usage:**
```tsx
<AgentUI.Debug 
  showEnvironment 
  showRuntime 
  showConnections 
/>
```

## Artifact Components

### Artifact

Auto-detecting artifact component that renders the appropriate specialized component.

```tsx
interface ArtifactProps extends React.HTMLAttributes<HTMLDivElement> {
  artifact: EnhancedArtifact
  onDownload?: (artifact: EnhancedArtifact) => void
  onShare?: (artifact: EnhancedArtifact) => void
  onPreview?: (artifact: EnhancedArtifact) => void
}
```

**Usage:**
```tsx
<Artifact 
  artifact={artifact}
  onDownload={handleDownload}
  onShare={handleShare}
  onPreview={handlePreview}
/>
```

### Artifact.Container

Base container component with consistent styling and metadata display.

```tsx
interface ArtifactContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  artifact: EnhancedArtifact
  downloadable?: boolean
  shareable?: boolean
  collapsible?: boolean
  defaultExpanded?: boolean
  onDownload?: (artifact: EnhancedArtifact) => void
  onShare?: (artifact: EnhancedArtifact) => void
  onToggle?: (expanded: boolean) => void
}
```

**Usage:**
```tsx
<Artifact.Container 
  artifact={artifact}
  downloadable
  shareable
  collapsible
>
  <CustomRenderer data={artifact.content} />
</Artifact.Container>
```

### Artifact.Code

Code artifact display with syntax highlighting and copy functionality.

```tsx
interface ArtifactCodeProps extends React.HTMLAttributes<HTMLDivElement> {
  artifact: EnhancedArtifact
  showLineNumbers?: boolean
  highlightLines?: number[]
  maxHeight?: number
  onDownload?: (artifact: EnhancedArtifact) => void
  onShare?: (artifact: EnhancedArtifact) => void
}
```

**Usage:**
```tsx
<Artifact.Code 
  artifact={codeArtifact}
  showLineNumbers
  highlightLines={[5, 10, 15]}
  maxHeight={400}
/>
```

### Artifact.Data

Data artifact display with JSON visualization and tree view.

```tsx
interface ArtifactDataProps extends React.HTMLAttributes<HTMLDivElement> {
  artifact: EnhancedArtifact
  expandable?: boolean
  searchable?: boolean
  maxDepth?: number
  onDownload?: (artifact: EnhancedArtifact) => void
  onShare?: (artifact: EnhancedArtifact) => void
}
```

**Usage:**
```tsx
<Artifact.Data 
  artifact={dataArtifact}
  expandable
  searchable
  maxDepth={3}
/>
```

### Artifact.File

File artifact display with type icons, previews, and download capabilities.

```tsx
interface ArtifactFileProps extends React.HTMLAttributes<HTMLDivElement> {
  artifact: EnhancedArtifact
  showPreview?: boolean
  previewSize?: 'small' | 'medium' | 'large'
  onDownload?: (artifact: EnhancedArtifact) => void
  onShare?: (artifact: EnhancedArtifact) => void
  onPreview?: (artifact: EnhancedArtifact) => void
}
```

**Usage:**
```tsx
<Artifact.File 
  artifact={fileArtifact}
  showPreview
  previewSize="medium"
  onPreview={handlePreview}
/>
```

### Artifact.Image

Image artifact display with proper rendering and metadata.

```tsx
interface ArtifactImageProps extends React.HTMLAttributes<HTMLDivElement> {
  artifact: EnhancedArtifact
  fit?: 'contain' | 'cover' | 'fill' | 'scale-down'
  maxWidth?: number
  maxHeight?: number
  showMetadata?: boolean
  onDownload?: (artifact: EnhancedArtifact) => void
  onShare?: (artifact: EnhancedArtifact) => void
}
```

**Usage:**
```tsx
<Artifact.Image 
  artifact={imageArtifact}
  fit="contain"
  maxWidth={800}
  showMetadata
/>
```

### Artifact.Text

Text artifact display with formatting and search capabilities.

```tsx
interface ArtifactTextProps extends React.HTMLAttributes<HTMLDivElement> {
  artifact: EnhancedArtifact
  searchable?: boolean
  selectable?: boolean
  maxHeight?: number
  onDownload?: (artifact: EnhancedArtifact) => void
  onShare?: (artifact: EnhancedArtifact) => void
}
```

**Usage:**
```tsx
<Artifact.Text 
  artifact={textArtifact}
  searchable
  selectable
  maxHeight={300}
/>
```

## Input Components

### Input.Form

Dynamic form generation component based on schema.

```tsx
interface InputFormProps extends React.HTMLAttributes<HTMLFormElement> {
  schema: FormSchema
  initialValues?: Record<string, unknown>
  onSubmit: (data: Record<string, unknown>) => void
  onValidate?: (data: Record<string, unknown>) => Record<string, string>
  onFieldChange?: (name: string, value: unknown) => void
  submitText?: string
  resetText?: string
  showReset?: boolean
  disabled?: boolean
}
```

**Usage:**
```tsx
<Input.Form
  schema={{
    fields: [
      { name: 'name', type: 'text', label: 'Name', required: true },
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'priority', type: 'select', label: 'Priority', options: priorityOptions }
    ]
  }}
  onSubmit={handleSubmit}
  onValidate={handleValidation}
/>
```

### Input.Field

Basic input field component for text and form inputs.

```tsx
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  variant?: 'default' | 'filled' | 'outlined'
}
```

**Usage:**
```tsx
<Input.Field
  label="Task Description"
  placeholder="Enter task description..."
  required
  error={validationError}
  helperText="Describe what you want the agent to do"
/>
```

### Input.Approval

Approval interface component with approve/reject controls.

```tsx
interface InputApprovalProps extends React.HTMLAttributes<HTMLDivElement> {
  request: TaskInputRequest
  context?: string
  showContext?: boolean
  approveText?: string
  rejectText?: string
  onApprove: (value: unknown, reason?: string) => void
  onReject: (reason: string) => void
  disabled?: boolean
}
```

**Usage:**
```tsx
<Input.Approval
  request={approvalRequest}
  context="This action will affect 3 active tasks"
  showContext
  onApprove={(value, reason) => handleApproval(true, value, reason)}
  onReject={(reason) => handleApproval(false, null, reason)}
/>
```

### Input.Selection

Selection component with single/multi-select and search capabilities.

```tsx
interface InputSelectionProps extends React.HTMLAttributes<HTMLDivElement> {
  request: TaskInputRequest
  multiSelect?: boolean
  searchable?: boolean
  maxSelections?: number
  defaultValues?: unknown[]
  onSelect: (values: unknown[]) => void
  disabled?: boolean
}
```

**Usage:**
```tsx
<Input.Selection
  request={selectionRequest}
  multiSelect
  searchable
  maxSelections={5}
  onSelect={handleSelection}
/>
```

### Input.Upload

File upload component with drag-and-drop and progress indication.

```tsx
interface InputUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  dragAndDrop?: boolean
  showProgress?: boolean
  onUpload: (files: File[]) => void
  onProgress?: (progress: UploadProgress) => void
  onError?: (error: Error) => void
  disabled?: boolean
}
```

**Usage:**
```tsx
<Input.Upload
  accept=".pdf,.doc,.docx"
  multiple
  maxSize={10 * 1024 * 1024} // 10MB
  dragAndDrop
  onUpload={handleFileUpload}
  onProgress={handleProgress}
/>
```

## Block Components

### Block.Message

Enhanced message display component with protocol metadata.

```tsx
interface BlockMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  message: ProtocolMessage | CommunicationBlock
  showMetadata?: boolean
  showTimestamp?: boolean
  showRouting?: boolean
  expandable?: boolean
  onExpand?: () => void
  onCollapse?: () => void
  isExpanded?: boolean
  correlatedMessage?: ProtocolMessage | CommunicationBlock
  showCorrelation?: boolean
  isError?: boolean
}
```

**Usage:**
```tsx
<Block.Message
  message={protocolMessage}
  showMetadata
  showTimestamp
  showRouting
  expandable
  correlatedMessage={relatedMessage}
/>
```

### Block.Protocol

Protocol-specific formatting and display component.

```tsx
interface BlockProtocolProps extends React.HTMLAttributes<HTMLDivElement> {
  protocol: {
    type: string
    version?: string
    features?: string[]
    compliance?: {
      level: 'full' | 'partial' | 'minimal'
      issues?: Array<{
        severity: 'error' | 'warning' | 'info'
        message: string
      }>
    }
  }
  showFeatures?: boolean
  showCompliance?: boolean
  expandable?: boolean
}
```

**Usage:**
```tsx
<Block.Protocol
  protocol={{
    type: 'A2A',
    version: '1.0.0',
    features: ['streaming', 'file-transfer'],
    compliance: { level: 'full' }
  }}
  showFeatures
  showCompliance
/>
```

### Block.Status

Real-time status updates and indicators component.

```tsx
interface BlockStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  status: {
    type: 'connection' | 'task' | 'agent' | 'system'
    state: 'online' | 'offline' | 'connecting' | 'error' | 'working' | 'idle'
    message?: string
    details?: Record<string, unknown>
    lastUpdate?: Date
    metrics?: {
      latency?: number
      uptime?: number
      errorRate?: number
    }
  }
  showMetrics?: boolean
  showDetails?: boolean
  realTime?: boolean
}
```

**Usage:**
```tsx
<Block.Status
  status={{
    type: 'connection',
    state: 'online',
    message: 'Connected to agent',
    metrics: { latency: 45, uptime: 7200 }
  }}
  showMetrics
  realTime
/>
```

### Block.Metadata

Expandable technical details and metadata component.

```tsx
interface BlockMetadataProps extends React.HTMLAttributes<HTMLDivElement> {
  metadata: Record<string, unknown>
  title?: string
  expandable?: boolean
  defaultExpanded?: boolean
  maxHeight?: number
}
```

**Usage:**
```tsx
<Block.Metadata
  metadata={executionMetadata}
  title="Execution Details"
  expandable
  defaultExpanded={false}
  maxHeight={300}
/>
```

## Enhanced Task Components

### Task.Root

Enhanced task root component with input and artifact support.

```tsx
interface TaskRootProps extends React.HTMLAttributes<HTMLDivElement> {
  taskId: string
  showStatus?: boolean
  showProgress?: boolean
  showInputRequests?: boolean
  showArtifacts?: boolean
  showChat?: boolean
  onTaskUpdate?: (task: EnhancedTask) => void
}
```

**Usage:**
```tsx
<Task.Root taskId="task-123">
  <Task.Status />
  <Task.Progress />
  <Task.InputRequest />
  <Task.Artifacts />
  <Task.Chat />
</Task.Root>
```

### Task.InputRequest

Task input request display and handling component.

```tsx
interface TaskInputRequestProps extends React.HTMLAttributes<HTMLDivElement> {
  requests: TaskInputRequest[]
  onResponse: (requestId: string, response: InputResponse) => void
  showContext?: boolean
  groupByType?: boolean
}
```

**Usage:**
```tsx
<Task.InputRequest
  requests={inputRequests}
  onResponse={handleInputResponse}
  showContext
  groupByType
/>
```

### Task.Artifacts

Task artifacts display and management component.

```tsx
interface TaskArtifactsProps extends React.HTMLAttributes<HTMLDivElement> {
  artifacts: EnhancedArtifact[]
  onDownload?: (artifact: EnhancedArtifact) => void
  onShare?: (artifact: EnhancedArtifact) => void
  onPreview?: (artifact: EnhancedArtifact) => void
  groupByType?: boolean
  showMetadata?: boolean
}
```

**Usage:**
```tsx
<Task.Artifacts
  artifacts={artifacts}
  onDownload={handleDownload}
  onShare={handleShare}
  groupByType
  showMetadata
/>
```

## Enhanced Chat Components

### Chat.Root

Enhanced chat root component with structured input support.

```tsx
interface ChatRootProps extends React.HTMLAttributes<HTMLDivElement> {
  taskId?: string
  messages?: ChatMessage[]
  onSendMessage?: (message: string) => void
  showInputForm?: boolean
  inputFormSchema?: FormSchema
}
```

**Usage:**
```tsx
<Chat.Root taskId="task-123">
  <Chat.Message message={message} />
  <Chat.InputForm schema={formSchema} />
</Chat.Root>
```

### Chat.InputForm

Chat input form component for structured input collection.

```tsx
interface ChatInputFormProps extends React.HTMLAttributes<HTMLFormElement> {
  schema: FormSchema
  onSubmit: (data: Record<string, unknown>) => void
  placeholder?: string
  submitText?: string
  showReset?: boolean
}
```

**Usage:**
```tsx
<Chat.InputForm
  schema={formSchema}
  onSubmit={handleFormSubmit}
  placeholder="Enter your response..."
  submitText="Send"
/>
```

## Hooks

### useTask

Enhanced task hook with input and artifact support.

```tsx
function useTask(taskId?: string): {
  // Existing functionality
  task: EnhancedTask | undefined
  isLoading: boolean
  error: Error | null
  
  // Enhanced capabilities
  inputRequests: TaskInputRequest[]
  artifacts: EnhancedArtifact[]
  communicationBlocks: CommunicationBlock[]
  
  // Actions
  submitTask: (input: TaskInput) => Promise<Task>
  cancelTask: () => Promise<void>
  respondToInput: (requestId: string, response: InputResponse) => Promise<void>
  downloadArtifact: (artifactId: string) => Promise<Blob>
  
  // Real-time subscriptions
  subscribe: (callback: TaskUpdateCallback) => Subscription
}
```

**Usage:**
```tsx
const { 
  task, 
  inputRequests, 
  artifacts, 
  respondToInput, 
  downloadArtifact 
} = useTask('task-123')
```

### useTaskInput

Task input handling hook.

```tsx
function useTaskInput(taskId: string): {
  activeRequests: TaskInputRequest[]
  responses: Map<string, InputResponse>
  validationErrors: Map<string, ValidationError[]>
  
  // Actions
  submitResponse: (requestId: string, value: unknown) => Promise<void>
  validateInput: (requestId: string, value: unknown) => ValidationResult
  clearValidationErrors: (requestId: string) => void
}
```

**Usage:**
```tsx
const { 
  activeRequests, 
  submitResponse, 
  validationErrors 
} = useTaskInput('task-123')
```

### useArtifacts

Artifact management hook.

```tsx
function useArtifacts(taskId?: string): {
  artifacts: EnhancedArtifact[]
  downloadProgress: Map<string, DownloadProgress>
  uploadProgress: Map<string, UploadProgress>
  
  // Actions
  downloadArtifact: (artifactId: string) => Promise<Blob>
  uploadArtifact: (file: File, metadata?: ArtifactMetadata) => Promise<Artifact>
  previewArtifact: (artifactId: string) => Promise<PreviewData>
  shareArtifact: (artifactId: string, config: ShareConfig) => Promise<string>
}
```

**Usage:**
```tsx
const { 
  artifacts, 
  downloadArtifact, 
  uploadArtifact, 
  downloadProgress 
} = useArtifacts('task-123')
```

### useArtifactPreview

Artifact preview hook.

```tsx
function useArtifactPreview(artifactId: string): {
  previewData: PreviewData | null
  isLoading: boolean
  error: Error | null
  
  // Actions
  loadPreview: () => Promise<void>
  downloadOriginal: () => Promise<Blob>
}
```

**Usage:**
```tsx
const { 
  previewData, 
  isLoading, 
  loadPreview 
} = useArtifactPreview('artifact-123')
```

### useAgentConnection

Agent connection hook.

```tsx
function useAgentConnection(agentId?: string): {
  connection: Connection | null
  status: ConnectionStatus
  latency: number | null
  
  // Actions
  connect: (config: ConnectionConfig) => Promise<void>
  disconnect: () => Promise<void>
  sendMessage: (message: ProtocolMessage) => Promise<void>
  
  // Real-time updates
  subscribe: (callback: ConnectionUpdateCallback) => Subscription
}
```

**Usage:**
```tsx
const { 
  connection, 
  status, 
  connect, 
  disconnect 
} = useAgentConnection('agent-123')
```

### useProtocolMessages

Protocol messages hook.

```tsx
function useProtocolMessages(filter?: MessageFilter): {
  messages: ProtocolMessage[]
  unreadCount: number
  
  // Actions
  sendMessage: (message: ProtocolMessage, target: string) => Promise<void>
  markAsRead: (messageId: string) => void
  clearMessages: () => void
  
  // Real-time subscription
  subscribe: (callback: MessageUpdateCallback) => Subscription
}
```

**Usage:**
```tsx
const { 
  messages, 
  unreadCount, 
  sendMessage, 
  markAsRead 
} = useProtocolMessages({ type: 'task.update' })
```

### useRuntimeEnvironment

Runtime environment detection hook.

```tsx
function useRuntimeEnvironment(): {
  isServer: boolean
  isClient: boolean
  isNextJS: boolean
  isVite: boolean
  supportsWebSockets: boolean
  supportsFileAPI: boolean
}
```

**Usage:**
```tsx
const environment = useRuntimeEnvironment()

if (environment.isNextJS) {
  // Next.js specific logic
}
```

### useAgentUI

AgentUI context hook.

```tsx
function useAgentUI(): {
  // Configuration
  config: AgentUIConfig
  environment: RuntimeEnvironment
  
  // Runtime management
  runtime: AgentRuntime | null
  connections: Connection[]
  activeConnection: Connection | null
  
  // UI state
  theme: 'light' | 'dark' | 'system'
  debug: boolean
  devTools: boolean
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleDebug: () => void
  toggleDevTools: () => void
  connectToAgent: (endpoint: string, config?: ConnectionConfig) => Promise<void>
  disconnectFromAgent: (connectionId?: string) => Promise<void>
}
```

**Usage:**
```tsx
const { 
  runtime, 
  connections, 
  debug, 
  toggleDebug, 
  connectToAgent 
} = useAgentUI()
```

## Providers

### AgentProvider

Enhanced agent provider with multi-runtime support.

```tsx
interface AgentProviderProps {
  runtime: AgentRuntime
  children: ReactNode
}
```

### ArtifactProvider

Artifact management provider.

```tsx
interface ArtifactProviderProps {
  children: ReactNode
}
```

### InputProvider

Input request and response handling provider.

```tsx
interface InputProviderProps {
  children: ReactNode
}
```

### CommunicationProvider

Protocol message management provider.

```tsx
interface CommunicationProviderProps {
  children: ReactNode
}
```

### ConfigProvider

Configuration management provider.

```tsx
interface ConfigProviderProps {
  config: AgentUIConfig
  autoOptimize?: boolean
  validateOnMount?: boolean
  children: ReactNode
}
```

## Types

### Core Types

```tsx
// Enhanced artifact types
interface EnhancedArtifact extends Artifact {
  displayType: 'text' | 'code' | 'file' | 'image' | 'data'
  renderOptions?: ArtifactRenderOptions
  downloadable?: boolean
  shareable?: boolean
}

// Input request types
interface TaskInputRequest {
  id: string
  type: 'text' | 'selection' | 'approval' | 'file' | 'form'
  prompt: string
  required: boolean
  validation?: ValidationRule[]
  options?: InputOption[]
  metadata?: Record<string, unknown>
}

// Communication block types
interface CommunicationBlock {
  id: string
  type: 'message' | 'protocol' | 'status' | 'metadata'
  timestamp: Date
  source: string
  target?: string
  content: unknown
  metadata?: Record<string, unknown>
}

// Enhanced task types
interface EnhancedTask extends Task {
  inputRequests?: TaskInputRequest[]
  inputResponses?: InputResponse[]
  communicationBlocks?: CommunicationBlock[]
  enhancedArtifacts?: EnhancedArtifact[]
}
```

### Configuration Types

```tsx
interface AgentUIConfig {
  // Development vs Production
  development?: {
    debug: boolean
    devTools: boolean
    mockData: boolean
  }
  
  // Server vs Client
  server?: {
    ssr: boolean
    preloadData: boolean
    staticGeneration: boolean
  }
  
  // Runtime-specific
  nextjs?: {
    appDir: boolean
    serverComponents: boolean
    middleware: boolean
  }
  
  vite?: {
    hmr: boolean
    fastRefresh: boolean
  }
}
```

### Runtime Types

```tsx
interface AgentRuntime {
  // Protocol identification
  readonly protocolType: 'a2a' | 'agentarea' | 'custom'
  readonly version: string
  
  // Connection management
  connect(endpoint: string, config: ConnectionConfig): Promise<Connection>
  disconnect(connectionId: string): Promise<void>
  
  // Task lifecycle
  submitTask(input: TaskInput, connectionId?: string): Promise<TaskResponse>
  handleInputRequest(taskId: string, response: InputResponse): Promise<void>
  cancelTask(taskId: string): Promise<void>
  
  // Real-time updates
  subscribeToTask(taskId: string, callback: TaskUpdateCallback): Subscription
  subscribeToAgent(agentId: string, callback: AgentUpdateCallback): Subscription
  
  // Artifact management
  downloadArtifact(artifactId: string): Promise<Blob>
  uploadArtifact(file: File, metadata?: ArtifactMetadata): Promise<Artifact>
}
```

## Utilities

### Dynamic Import

SSR-safe dynamic import utility.

```tsx
function dynamicImport<T>(
  importFn: () => Promise<T>,
  options?: {
    ssr?: boolean
    loading?: React.ComponentType
    error?: React.ComponentType<{ error: Error }>
  }
): React.ComponentType
```

**Usage:**
```tsx
const AgentUIWithRealTime = dynamicImport(
  () => import('@agentarea/react').then(mod => mod.AgentUI),
  { 
    ssr: false,
    loading: () => <div>Loading...</div>
  }
)
```

### Environment Config

Environment-specific configuration utility.

```tsx
function getEnvironmentConfig(): {
  isProduction: boolean
  isDevelopment: boolean
  isTest: boolean
  framework: 'nextjs' | 'vite' | 'cra' | 'unknown'
  features: {
    ssr: boolean
    webSockets: boolean
    fileAPI: boolean
  }
}
```

**Usage:**
```tsx
const envConfig = getEnvironmentConfig()

if (envConfig.features.webSockets) {
  // Initialize WebSocket connection
}
```

### Config Manager

Configuration management utility.

```tsx
class ConfigManager {
  static merge(base: AgentUIConfig, override: AgentUIConfig): AgentUIConfig
  static validate(config: AgentUIConfig): ValidationResult
  static getDefaults(): AgentUIConfig
  static fromEnvironment(): AgentUIConfig
}
```

**Usage:**
```tsx
const config = ConfigManager.merge(
  ConfigManager.getDefaults(),
  ConfigManager.fromEnvironment()
)
```

## Error Handling

### Error Boundaries

All components include error boundaries for graceful error handling:

```tsx
// Component-level error boundaries
<ArtifactErrorBoundary>
  <Artifact artifact={artifact} />
</ArtifactErrorBoundary>

<TaskErrorBoundary>
  <Task.Root taskId="task-123" />
</TaskErrorBoundary>

<ChatErrorBoundary>
  <Chat.Root taskId="task-123" />
</ChatErrorBoundary>
```

### Error Types

```tsx
interface ComponentError extends Error {
  component: string
  props?: Record<string, unknown>
  stack?: string
}

interface ValidationError {
  field: string
  message: string
  code: string
}

interface ConnectionError extends Error {
  endpoint: string
  status?: number
  retryable: boolean
}
```

## Best Practices

### Component Usage
- Always wrap components in appropriate error boundaries
- Use loading states for better user experience
- Handle offline scenarios gracefully
- Provide fallbacks for unsupported features

### Performance
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Cache artifacts and metadata locally
- Optimize re-renders with proper dependencies

### Accessibility
- All components follow WCAG 2.1 AA standards
- Keyboard navigation is fully supported
- Screen reader compatibility is ensured
- High contrast themes are available

### TypeScript
- All components have comprehensive type definitions
- Generic types are used where appropriate
- Strict type checking is enforced
- Type inference is optimized for developer experience