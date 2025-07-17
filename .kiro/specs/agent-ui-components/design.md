# Design Document

## Overview

This design document outlines the architecture and implementation approach for expanding the existing @agentarea/ui-sdk library with comprehensive UI components for agent-to-agent protocol interactions. The library will build upon the existing foundation of shadcn/ui patterns, Radix primitives, and Tailwind CSS to provide developers with a complete toolkit for building agent-based applications.

The design leverages the existing monorepo structure with `@agentarea/core` providing protocol-agnostic types and runtime, while `@agentarea/react` delivers the React component implementations. The expansion will focus on enhancing the current Task and Chat components while adding new specialized components for artifacts, input collection, and agent communication blocks.

## Architecture

### Package Structure

The existing monorepo structure will be maintained and enhanced:

```
packages/
├── core/                    # Protocol-agnostic types and runtime
│   ├── src/types/          # Enhanced with new artifact and input types
│   └── src/runtime/        # Enhanced with input handling capabilities
└── react/                  # React component implementations
    ├── src/components/
    │   ├── primitives/     # Enhanced agent and task primitives
    │   ├── ui/            # Extended shadcn/ui components
    │   ├── artifacts/     # New artifact display components
    │   ├── inputs/        # New input collection components
    │   ├── blocks/        # New communication block components
    │   └── providers/     # Enhanced context providers
    └── src/hooks/         # Enhanced React hooks
```

### Component Hierarchy

The component architecture follows shadcn/ui patterns with compound components and composition, centered around a main entry point component:

```
AgentUI (Main Entry Point)
├── AgentUI.Provider (Context and Runtime Management)
├── AgentUI.Connection (Connection Status and Management)
└── AgentUI.Debug (Development Tools)

Agent Communication Components
├── Task.* (Enhanced existing)
│   ├── Task.Input (Enhanced)
│   ├── Task.Status (Enhanced)
│   ├── Task.Progress (Enhanced)
│   ├── Task.Output (Enhanced)
│   ├── Task.Chat (Enhanced)
│   ├── Task.InputRequest (New)
│   └── Task.Artifacts (New)
├── Chat.* (Enhanced existing)
│   ├── Chat.Root (Enhanced)
│   ├── Chat.Message (Enhanced)
│   ├── Chat.Input (Enhanced)
│   └── Chat.InputForm (New)
├── Artifact.* (New)
│   ├── Artifact.Container
│   ├── Artifact.Text
│   ├── Artifact.Code
│   ├── Artifact.File
│   ├── Artifact.Image
│   └── Artifact.Data
├── Input.* (New)
│   ├── Input.Form
│   ├── Input.Field
│   ├── Input.Approval
│   ├── Input.Selection
│   └── Input.Upload
└── Block.* (New)
    ├── Block.Message
    ├── Block.Protocol
    ├── Block.Status
    └── Block.Metadata
```

### Entry Point Component Design

**AgentUI Main Component**
The library will provide a main `AgentUI` component that serves as the entry point and context provider:

```typescript
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
  
  children: React.ReactNode
}

// Usage examples:
<AgentUI runtime="a2a" endpoint="https://api.example.com" autoConnect>
  <Task id="task-1" />
  <Chat taskId="task-1" />
</AgentUI>

<AgentUI runtime="agentarea" authentication={{ type: 'bearer', token: 'xxx' }}>
  <Task.List filter={{ status: ['working', 'completed'] }} />
  <Artifact.Container taskId="task-1" />
</AgentUI>
```

**Compound Component Pattern**
Following React best practices, the library will support both provider pattern and compound components:

```typescript
// Option 1: All-in-one component (simpler)
<AgentUI runtime="a2a" endpoint="https://api.example.com">
  <Task id="task-1" />
</AgentUI>

// Option 2: Explicit provider pattern (more control)
<AgentUI.Provider runtime="a2a" endpoint="https://api.example.com">
  <AgentUI.Connection />
  <Task id="task-1" />
  <AgentUI.Debug />
</AgentUI.Provider>

// Option 3: Hook-only approach (maximum flexibility)
function MyComponent() {
  const { connectToAgent } = useAgentRuntime()
  const { task } = useTask('task-1')
  
  useEffect(() => {
    connectToAgent('https://api.example.com', { runtime: 'a2a' })
  }, [])
  
  return <Task.Status taskId="task-1" />
}
```

## Components and Interfaces

### Enhanced Core Types

Building on the existing core types, new interfaces will be added:

```typescript
// Enhanced artifact types
interface ArtifactContent {
  text?: string
  code?: { language: string; content: string }
  file?: { name: string; url: string; size: number; mimeType: string }
  image?: { url: string; alt?: string; width?: number; height?: number }
  data?: { schema?: object; content: unknown }
}

// New input request types
interface TaskInputRequest {
  id: string
  type: 'text' | 'selection' | 'approval' | 'file' | 'form'
  prompt: string
  required: boolean
  validation?: ValidationRule[]
  options?: InputOption[]
  metadata?: Record<string, unknown>
}

interface InputResponse {
  requestId: string
  value: unknown
  timestamp: Date
}

// Enhanced task types
interface TaskWithInputs extends Task {
  inputRequests?: TaskInputRequest[]
  inputResponses?: InputResponse[]
}
```

### Artifact Display Components

New specialized components for displaying different types of task artifacts:

**Artifact.Container**
- Wrapper component with consistent styling and metadata display
- Support for collapsible/expandable content
- Download and share actions
- Timestamp and size information

**Artifact.Code**
- Syntax highlighting using existing patterns
- Copy to clipboard functionality
- Language detection and display
- Line numbers and highlighting
- Integration with existing Chat.Markdown patterns

**Artifact.File**
- File type icons and previews
- Download functionality
- Size and type information
- Thumbnail generation for images
- Integration with existing Chat.File patterns

**Artifact.Data**
- JSON/structured data visualization
- Collapsible tree view for complex objects
- Search and filtering capabilities
- Export functionality

### Input Collection Components

New components for handling task input requests:

**Input.Form**
- Dynamic form generation based on input requests
- Validation and error handling
- Progress indication for multi-step inputs
- Integration with existing form patterns

**Input.Approval**
- Approve/reject interface with context
- Reason collection for rejections
- Batch approval for multiple items
- Integration with existing button variants

**Input.Selection**
- Single and multi-select interfaces
- Search and filtering for large option sets
- Custom option rendering
- Integration with existing UI patterns

**Input.Upload**
- File upload with drag-and-drop
- Progress indication and validation
- File type restrictions and size limits
- Integration with existing Chat.Input file handling

### Communication Block Components

New components for agent-to-agent protocol display:

**Block.Message**
- Enhanced message display with protocol metadata
- Agent identification and routing information
- Message threading and relationships
- Integration with existing Chat.Message patterns

**Block.Protocol**
- Protocol-specific formatting and display
- Request/response correlation
- Error and status indication
- Expandable technical details

**Block.Status**
- Real-time status updates and indicators
- Connection and health monitoring
- Performance metrics display
- Integration with existing status patterns

## Data Models

### Enhanced Task Model

The existing Task interface will be extended to support input requests:

```typescript
interface EnhancedTask extends Task {
  inputRequests?: TaskInputRequest[]
  inputResponses?: InputResponse[]
  communicationBlocks?: CommunicationBlock[]
  enhancedArtifacts?: EnhancedArtifact[]
}

interface EnhancedArtifact extends Artifact {
  displayType: 'text' | 'code' | 'file' | 'image' | 'data'
  renderOptions?: ArtifactRenderOptions
  downloadable?: boolean
  shareable?: boolean
}

interface CommunicationBlock {
  id: string
  type: 'message' | 'protocol' | 'status' | 'metadata'
  timestamp: Date
  source: string
  target?: string
  content: unknown
  metadata?: Record<string, unknown>
}
```

### Input Request Schema

```typescript
interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: unknown
  message: string
}

interface InputOption {
  value: unknown
  label: string
  description?: string
  disabled?: boolean
  metadata?: Record<string, unknown>
}

interface FormField {
  name: string
  type: string
  label: string
  placeholder?: string
  validation?: ValidationRule[]
  options?: InputOption[]
}
```

## Error Handling

### Component-Level Error Boundaries

Each major component group will have error boundaries:

```typescript
interface ComponentErrorBoundary {
  fallback: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  isolateErrors?: boolean
}
```

### Graceful Degradation

Components will gracefully handle missing or invalid data:

- Artifact components will show placeholder content for unsupported types
- Input components will fall back to basic text input for unknown types
- Communication blocks will display raw data when specialized rendering fails
- Progress indicators will hide when progress data is unavailable

### Error Display Patterns

Following shadcn/ui patterns for error states:

- Inline error messages with destructive variant styling
- Toast notifications for system-level errors
- Retry mechanisms with exponential backoff
- Clear error messaging with actionable guidance

## Testing Strategy

### Component Testing

Building on existing Storybook infrastructure:

**Unit Tests**
- Jest and React Testing Library for component logic
- Mock data generators for consistent testing
- Accessibility testing with jest-axe
- Visual regression testing with Chromatic

**Integration Tests**
- End-to-end component interaction testing
- Real-time update handling
- Error boundary behavior
- Performance testing for large datasets

**Storybook Stories**
- Comprehensive component documentation
- Interactive examples for all variants
- Edge case demonstrations
- Accessibility testing scenarios

### Accessibility Testing

Following WCAG 2.1 AA standards:

- Keyboard navigation testing
- Screen reader compatibility
- Color contrast validation
- Focus management verification
- ARIA label and description testing

### Performance Testing

- Bundle size analysis and optimization
- Rendering performance with large datasets
- Memory usage monitoring
- Tree-shaking verification

## Implementation Approach

### Phase 1: Core Infrastructure
1. Extend core types for artifacts and input requests
2. Enhance existing Task and Chat components
3. Create base Artifact components
4. Update providers and hooks

### Phase 2: Input Collection
1. Implement Input.* component family
2. Add form validation and error handling
3. Integrate with existing task workflow
4. Create comprehensive Storybook stories

### Phase 3: Communication Blocks
1. Implement Block.* component family
2. Add protocol-specific rendering
3. Integrate with existing chat interface
4. Add real-time update capabilities

### Phase 4: Polish and Optimization
1. Performance optimization and bundle analysis
2. Comprehensive accessibility audit
3. Documentation and example updates
4. Integration testing and bug fixes

### Styling and Theming

Following existing shadcn/ui patterns:

**CSS Variables**
- Extend existing color palette for new component states
- Add semantic color tokens for artifacts and communication blocks
- Maintain consistency with existing design system

**Tailwind Configuration**
- Extend existing configuration with new component utilities
- Add animation utilities for real-time updates
- Maintain existing responsive design patterns

**Component Variants**
- Use class-variance-authority for consistent variant handling
- Follow existing size and variant naming conventions
- Ensure proper TypeScript inference for all variants

### Integration Points

**Existing Components**
- Enhance Task.Chat with new input collection capabilities
- Extend Chat.Message with artifact rendering
- Integrate new components with existing providers

**Hook Integration**
- Extend useTask hook with input request handling
- Add new hooks for artifact management
- Maintain backward compatibility with existing APIs

**Provider Enhancements**
- Extend AgentProvider with input request management
- Add artifact caching and management
- Maintain existing context structure and patterns
#
# Runtime Architecture and A2A Integration

### Multi-Runtime Architecture

The system will support multiple runtime implementations to handle different agent communication protocols:

**Base Runtime Interface**
```typescript
interface AgentRuntime {
  // Protocol identification
  readonly protocolType: 'a2a' | 'agentarea' | 'custom'
  readonly version: string
  
  // Connection management
  connect(endpoint: string, config: ConnectionConfig): Promise<Connection>
  disconnect(connectionId: string): Promise<void>
  
  // Task lifecycle with input handling
  submitTask(input: TaskInput, connectionId?: string): Promise<TaskResponse>
  handleInputRequest(taskId: string, response: InputResponse): Promise<void>
  cancelTask(taskId: string): Promise<void>
  
  // Real-time updates
  subscribeToTask(taskId: string, callback: TaskUpdateCallback): Subscription
  subscribeToAgent(agentId: string, callback: AgentUpdateCallback): Subscription
  
  // Artifact management
  downloadArtifact(artifactId: string): Promise<Blob>
  uploadArtifact(file: File, metadata?: ArtifactMetadata): Promise<Artifact>
  
  // Communication protocol
  sendMessage(message: ProtocolMessage, targetAgent: string): Promise<void>
  handleProtocolMessage(message: ProtocolMessage): Promise<void>
  
  // Protocol-specific capabilities
  getSupportedCapabilities(): string[]
  validateConnection(config: ConnectionConfig): Promise<ValidationResult>
}
```

**A2A Protocol Runtime**
```typescript
interface A2ARuntime extends AgentRuntime {
  readonly protocolType: 'a2a'
  
  // A2A-specific methods
  discoverAgents(endpoint: string): Promise<AgentCard[]>
  negotiateCapabilities(agentId: string, capabilities: string[]): Promise<string[]>
  handleA2AMessage(message: A2AMessage): Promise<void>
  
  // A2A protocol compliance
  validateA2ACompliance(endpoint: string): Promise<ComplianceResult>
  getA2AMetadata(): A2AMetadata
}
```

**AgentArea Custom Runtime**
```typescript
interface AgentAreaRuntime extends AgentRuntime {
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
```

**Runtime Factory and Management**
```typescript
interface RuntimeFactory {
  createRuntime(protocolType: 'a2a' | 'agentarea', config: RuntimeConfig): AgentRuntime
  getSupportedProtocols(): string[]
  detectProtocol(endpoint: string): Promise<string>
}

interface RuntimeManager {
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
```

### Enhanced Context Providers

**AgentProvider Extensions**
```typescript
interface AgentContextValue {
  // Existing functionality
  agents: AgentCard[]
  selectedAgent?: AgentCard
  
  // Enhanced A2A capabilities
  connections: Connection[]
  connectionStatus: Record<string, ConnectionStatus>
  
  // Task management with input handling
  tasks: EnhancedTask[]
  activeInputRequests: TaskInputRequest[]
  
  // Real-time communication
  protocolMessages: ProtocolMessage[]
  communicationBlocks: CommunicationBlock[]
  
  // Actions
  connectToAgent: (endpoint: string, config: ConnectionConfig) => Promise<void>
  disconnectFromAgent: (connectionId: string) => Promise<void>
  submitTask: (input: TaskInput, agentId?: string) => Promise<Task>
  respondToInputRequest: (requestId: string, response: InputResponse) => Promise<void>
  sendProtocolMessage: (message: ProtocolMessage, targetAgent: string) => Promise<void>
}
```

**New Context Providers**

**ArtifactProvider**
```typescript
interface ArtifactContextValue {
  artifacts: Map<string, EnhancedArtifact>
  downloadQueue: DownloadItem[]
  uploadProgress: Map<string, UploadProgress>
  
  // Actions
  downloadArtifact: (artifactId: string) => Promise<Blob>
  uploadArtifact: (file: File, metadata?: ArtifactMetadata) => Promise<Artifact>
  previewArtifact: (artifactId: string) => Promise<PreviewData>
  shareArtifact: (artifactId: string, shareConfig: ShareConfig) => Promise<string>
}
```

**InputProvider**
```typescript
interface InputContextValue {
  activeRequests: TaskInputRequest[]
  pendingResponses: Map<string, InputResponse>
  validationErrors: Map<string, ValidationError[]>
  
  // Actions
  submitResponse: (requestId: string, value: unknown) => Promise<void>
  validateInput: (requestId: string, value: unknown) => ValidationResult
  cancelInputRequest: (requestId: string) => Promise<void>
}
```

**CommunicationProvider**
```typescript
interface CommunicationContextValue {
  connections: Connection[]
  protocolMessages: ProtocolMessage[]
  communicationBlocks: CommunicationBlock[]
  networkStatus: NetworkStatus
  
  // Actions
  establishConnection: (config: ConnectionConfig) => Promise<Connection>
  sendMessage: (message: ProtocolMessage, target: string) => Promise<void>
  subscribeToProtocol: (protocolType: string, callback: ProtocolCallback) => Subscription
}
```

### Enhanced Hook System

**Core Task Hooks**
```typescript
// Enhanced useTask hook
function useTask(taskId?: string) {
  return {
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
}

// New input handling hook
function useTaskInput(taskId: string) {
  return {
    activeRequests: TaskInputRequest[]
    responses: Map<string, InputResponse>
    validationErrors: Map<string, ValidationError[]>
    
    // Actions
    submitResponse: (requestId: string, value: unknown) => Promise<void>
    validateInput: (requestId: string, value: unknown) => ValidationResult
    clearValidationErrors: (requestId: string) => void
  }
}
```

**Artifact Management Hooks**
```typescript
function useArtifacts(taskId?: string) {
  return {
    artifacts: EnhancedArtifact[]
    downloadProgress: Map<string, DownloadProgress>
    uploadProgress: Map<string, UploadProgress>
    
    // Actions
    downloadArtifact: (artifactId: string) => Promise<Blob>
    uploadArtifact: (file: File, metadata?: ArtifactMetadata) => Promise<Artifact>
    previewArtifact: (artifactId: string) => Promise<PreviewData>
    shareArtifact: (artifactId: string, config: ShareConfig) => Promise<string>
  }
}

function useArtifactPreview(artifactId: string) {
  return {
    previewData: PreviewData | null
    isLoading: boolean
    error: Error | null
    
    // Actions
    loadPreview: () => Promise<void>
    downloadOriginal: () => Promise<Blob>
  }
}
```

**Communication Hooks**
```typescript
function useAgentConnection(agentId?: string) {
  return {
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
}

function useProtocolMessages(filter?: MessageFilter) {
  return {
    messages: ProtocolMessage[]
    unreadCount: number
    
    // Actions
    sendMessage: (message: ProtocolMessage, target: string) => Promise<void>
    markAsRead: (messageId: string) => void
    clearMessages: () => void
    
    // Real-time subscription
    subscribe: (callback: MessageUpdateCallback) => Subscription
  }
}

function useCommunicationBlocks(taskId?: string) {
  return {
    blocks: CommunicationBlock[]
    activeConnections: Connection[]
    
    // Actions
    addBlock: (block: CommunicationBlock) => void
    removeBlock: (blockId: string) => void
    updateBlock: (blockId: string, updates: Partial<CommunicationBlock>) => void
  }
}
```

**Real-time Update Hooks**
```typescript
function useRealTimeUpdates<T>(
  subscriptionType: 'task' | 'agent' | 'protocol',
  id: string,
  callback: (update: T) => void
) {
  return {
    isConnected: boolean
    lastUpdate: Date | null
    error: Error | null
    
    // Actions
    reconnect: () => Promise<void>
    disconnect: () => void
  }
}

function useWebSocketConnection(endpoint: string) {
  return {
    connection: WebSocket | null
    readyState: number
    reconnectAttempts: number
    
    // Actions
    connect: () => Promise<void>
    disconnect: () => void
    send: (data: unknown) => void
    
    // Event handlers
    onMessage: (handler: (event: MessageEvent) => void) => void
    onError: (handler: (event: Event) => void) => void
    onClose: (handler: (event: CloseEvent) => void) => void
  }
}
```

### A2A Protocol Integration

**Connection Management**
```typescript
interface ConnectionConfig {
  endpoint: string
  authentication: AuthConfig
  protocols: string[]
  options?: {
    timeout?: number
    retryAttempts?: number
    heartbeatInterval?: number
  }
}

interface Connection {
  id: string
  agentId: string
  endpoint: string
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  protocols: string[]
  metadata: Record<string, unknown>
  createdAt: Date
  lastActivity: Date
}
```

**Protocol Message Handling**
```typescript
interface ProtocolMessage {
  id: string
  type: string
  source: string
  target: string
  payload: unknown
  timestamp: Date
  metadata?: Record<string, unknown>
}

interface ProtocolHandler {
  type: string
  handler: (message: ProtocolMessage) => Promise<void>
  middleware?: ProtocolMiddleware[]
}
```

**State Management Integration**
The runtime will integrate with React's state management patterns:

- Context providers for global state management
- Optimistic updates for better UX
- Automatic retry mechanisms with exponential backoff
- Offline support with request queuing
- Real-time synchronization with WebSocket connections

**Error Handling and Resilience**
- Connection failure recovery
- Message delivery guarantees
- Timeout handling
- Circuit breaker patterns for failing services
- Graceful degradation when A2A services are unavailable

## Runtime Environment Support

### Next.js and SSR Compatibility

The library will provide full support for Next.js applications with server-side rendering:

**SSR-Safe Components**
```typescript
// All components will handle SSR gracefully
interface SSRCompatibleComponent {
  // Hydration-safe state management
  suppressHydrationWarning?: boolean
  
  // Server-side safe defaults
  fallback?: React.ReactNode
  
  // Client-only features
  clientOnly?: boolean
}

// Usage in Next.js
function MyPage() {
  return (
    <AgentUI 
      runtime="a2a" 
      endpoint={process.env.NEXT_PUBLIC_AGENT_ENDPOINT}
      clientOnly // Prevents SSR issues with WebSocket connections
    >
      <Task.List />
    </AgentUI>
  )
}
```

**Dynamic Imports for Client-Only Features**
```typescript
// Real-time features will be dynamically imported
const AgentUIWithRealTime = dynamic(
  () => import('@agentarea/react').then(mod => mod.AgentUI),
  { 
    ssr: false,
    loading: () => <AgentUI.Skeleton />
  }
)
```

**Environment Detection**
```typescript
interface RuntimeEnvironment {
  isServer: boolean
  isClient: boolean
  isNextJS: boolean
  isVite: boolean
  supportsWebSockets: boolean
  supportsFileAPI: boolean
}

// Automatic environment detection
const useRuntimeEnvironment = (): RuntimeEnvironment => {
  return {
    isServer: typeof window === 'undefined',
    isClient: typeof window !== 'undefined',
    isNextJS: typeof window !== 'undefined' && '__NEXT_DATA__' in window,
    isVite: typeof window !== 'undefined' && '__vite_plugin_react_preamble_installed__' in window,
    supportsWebSockets: typeof WebSocket !== 'undefined',
    supportsFileAPI: typeof File !== 'undefined'
  }
}
```

### Vite and Standard React Support

**Vite Optimization**
```typescript
// Vite-specific optimizations
interface ViteConfig {
  // Pre-bundled dependencies for faster dev server
  optimizeDeps: {
    include: ['@agentarea/core', '@agentarea/react']
    exclude: ['@agentarea/react/server'] // Server-only modules
  }
  
  // Code splitting configuration
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'agent-runtime': ['@agentarea/core'],
          'agent-ui': ['@agentarea/react']
        }
      }
    }
  }
}
```

**Environment-Specific Builds**
```typescript
// Different builds for different environments
interface BuildTargets {
  'esm': 'ES modules for modern bundlers'
  'cjs': 'CommonJS for Node.js compatibility'
  'umd': 'Universal module for browser scripts'
  'next': 'Next.js optimized build with SSR support'
  'vite': 'Vite optimized build with HMR support'
}
```

### Universal Component API

**Environment-Agnostic Usage**
```typescript
// Same API works across all environments
<AgentUI 
  runtime="agentarea"
  endpoint="https://api.example.com"
  authentication={{ type: 'bearer', token: process.env.AGENT_TOKEN }}
>
  <Task id="task-1" />
  <Chat taskId="task-1" />
</AgentUI>

// Automatic feature detection and graceful degradation
<AgentUI.Provider 
  runtime="a2a"
  endpoint="wss://realtime.example.com"
  fallback={<AgentUI.OfflineMode />} // Shown when WebSockets unavailable
>
  <Task.List realTime={true} />
</AgentUI.Provider>
```

**Configuration Management**
```typescript
// Environment-specific configuration
interface AgentUIConfig {
  // Development vs Production
  development?: {
    debug: true
    devTools: true
    mockData: true
  }
  
  // Server vs Client
  server?: {
    ssr: true
    preloadData: true
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