# Migration Guide - AgentArea UI SDK v2.0

This guide helps you migrate from AgentArea UI SDK v1.x to v2.0, which introduces significant new features and breaking changes.

## Overview of Changes

### 🎉 New Features
- **AgentUI Entry Point**: Unified component with runtime management
- **Artifact Display**: Rich rendering for code, data, files, images, and text
- **Input Collection**: Dynamic forms, approvals, selections, and file uploads
- **Communication Blocks**: Protocol messages, status updates, and metadata
- **Multi-Runtime Support**: A2A protocol and AgentArea custom protocol
- **Enhanced Error Handling**: Component-level error boundaries
- **SSR Support**: Next.js and server-side rendering compatibility

### ⚠️ Breaking Changes
- Component API changes and new prop requirements
- Provider structure modifications
- Hook signature updates
- Type definition changes
- Import path modifications

### 📦 Package Structure Changes
- Split into `@agentarea/core` and `@agentarea/react` packages
- New component organization and export structure
- Enhanced TypeScript definitions

## Installation Changes

### v1.x Installation
```bash
npm install @agentarea/ui-sdk
```

### v2.0 Installation
```bash
npm install @agentarea/core @agentarea/react
```

### Package.json Updates
```json
{
  "dependencies": {
    // Remove v1.x package
    // "@agentarea/ui-sdk": "^1.0.0",
    
    // Add v2.0 packages
    "@agentarea/core": "^2.0.0",
    "@agentarea/react": "^2.0.0"
  }
}
```

## Import Changes

### v1.x Imports
```tsx
import { 
  AgentProvider, 
  TaskPrimitive, 
  AgentPrimitive,
  useAgent,
  useTask
} from '@agentarea/ui-sdk'
```

### v2.0 Imports
```tsx
// Core runtime and types
import { 
  createA2ARuntime,
  createAgentAreaRuntime
} from '@agentarea/core'

// React components and hooks
import { 
  AgentUI,
  AgentProvider, 
  TaskPrimitive, 
  AgentPrimitive,
  Task,
  Chat,
  Artifact,
  Input,
  Block,
  useAgent,
  useTask,
  useArtifacts,
  useAgentConnection
} from '@agentarea/react'
```

## Component Migration

### AgentProvider Changes

#### v1.x Usage
```tsx
import { createA2ARuntime } from '@agentarea/ui-sdk'

const runtime = createA2ARuntime({
  agentBaseUrl: 'http://localhost:9999'
})

<AgentProvider runtime={runtime}>
  <TaskPrimitive.Root />
  <AgentPrimitive.Root />
</AgentProvider>
```

#### v2.0 Migration Options

**Option 1: Use New AgentUI Entry Point (Recommended)**
```tsx
import { AgentUI } from '@agentarea/react'

<AgentUI 
  runtime="a2a" 
  endpoint="http://localhost:9999"
  autoConnect
  debug
>
  <Task.Root />
  <AgentPrimitive.Root />
</AgentUI>
```

**Option 2: Continue with AgentProvider**
```tsx
import { createA2ARuntime } from '@agentarea/core'
import { AgentProvider } from '@agentarea/react'

const runtime = createA2ARuntime({
  agentBaseUrl: 'http://localhost:9999'
})

<AgentProvider runtime={runtime}>
  <Task.Root />
  <AgentPrimitive.Root />
</AgentProvider>
```

**Option 3: Use Compound Component Pattern**
```tsx
<AgentUI.Provider runtime="a2a" endpoint="http://localhost:9999">
  <AgentUI.Connection showStatus showActions />
  <Task.Root />
  <AgentUI.Debug showEnvironment />
</AgentUI.Provider>
```

### Task Component Changes

#### v1.x Usage
```tsx
<TaskPrimitive.Root>
  <TaskPrimitive.Input 
    value={input}
    onChange={setInput}
    onSubmit={handleSubmit}
  />
  <TaskPrimitive.Status />
  <TaskPrimitive.Output />
</TaskPrimitive.Root>
```

#### v2.0 Migration
```tsx
// Enhanced Task components with new capabilities
<Task.Root taskId="task-123">
  <Task.Status />
  <Task.Progress />
  
  {/* NEW: Input request handling */}
  <Task.InputRequest 
    requests={inputRequests}
    onResponse={handleInputResponse}
  />
  
  {/* NEW: Artifact display */}
  <Task.Artifacts 
    artifacts={artifacts}
    onDownload={handleDownload}
  />
  
  {/* Enhanced chat interface */}
  <Task.Chat />
</Task.Root>

// Or use the original primitive pattern (still supported)
<TaskPrimitive.Root>
  <TaskPrimitive.Input 
    value={input}
    onChange={setInput}
    onSubmit={handleSubmit}
  />
  <TaskPrimitive.Status />
  <TaskPrimitive.Output />
</TaskPrimitive.Root>
```

### Chat Component Changes

#### v1.x Usage
```tsx
// Chat was basic in v1.x
<div className="chat-container">
  <div className="messages">
    {messages.map(msg => <div key={msg.id}>{msg.content}</div>)}
  </div>
  <input 
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyPress={handleKeyPress}
  />
</div>
```

#### v2.0 Migration
```tsx
// Enhanced Chat components
<Chat.Root taskId="task-123">
  {messages.map(message => (
    <Chat.Message 
      key={message.id}
      message={message}
      showTimestamp
      showSender
    />
  ))}
  
  {/* NEW: Structured input forms */}
  <Chat.InputForm
    schema={{
      fields: [
        { name: 'response', type: 'textarea', label: 'Your Response' },
        { name: 'priority', type: 'select', options: priorityOptions }
      ]
    }}
    onSubmit={handleFormSubmit}
  />
  
  {/* Traditional text input still available */}
  <Chat.Input 
    value={input}
    onChange={setInput}
    onSubmit={handleSubmit}
  />
</Chat.Root>
```

## Hook Migration

### useTask Hook Changes

#### v1.x Usage
```tsx
const { task, isLoading, error, submitTask } = useTask('task-123')
```

#### v2.0 Migration
```tsx
// Enhanced with new capabilities
const { 
  task, 
  isLoading, 
  error, 
  
  // NEW: Input request handling
  inputRequests,
  respondToInput,
  
  // NEW: Artifact management
  artifacts,
  downloadArtifact,
  
  // NEW: Communication blocks
  communicationBlocks,
  
  // Existing functionality
  submitTask,
  cancelTask,
  subscribe
} = useTask('task-123')

// Handle input requests
if (inputRequests.length > 0) {
  await respondToInput(inputRequests[0].id, { value: 'approved' })
}

// Download artifacts
const blob = await downloadArtifact('artifact-123')
```

### New Hooks Available

```tsx
// NEW: Artifact management
const { 
  artifacts, 
  downloadArtifact, 
  uploadArtifact, 
  downloadProgress 
} = useArtifacts('task-123')

// NEW: Agent connection management
const { 
  connection, 
  status, 
  connect, 
  disconnect 
} = useAgentConnection('agent-123')

// NEW: Protocol message handling
const { 
  messages, 
  sendMessage, 
  markAsRead 
} = useProtocolMessages()

// NEW: Runtime environment detection
const environment = useRuntimeEnvironment()
if (environment.isNextJS) {
  // Next.js specific logic
}
```

## Type Definition Changes

### v1.x Types
```tsx
interface Task {
  id: string
  status: 'pending' | 'working' | 'completed' | 'failed'
  input: string
  output?: string
}

interface Agent {
  id: string
  name: string
  description: string
  capabilities: string[]
}
```

### v2.0 Enhanced Types
```tsx
// Enhanced task with new capabilities
interface EnhancedTask extends Task {
  inputRequests?: TaskInputRequest[]
  inputResponses?: InputResponse[]
  communicationBlocks?: CommunicationBlock[]
  enhancedArtifacts?: EnhancedArtifact[]
}

// New artifact types
interface EnhancedArtifact extends Artifact {
  displayType: 'text' | 'code' | 'file' | 'image' | 'data'
  renderOptions?: ArtifactRenderOptions
  downloadable?: boolean
  shareable?: boolean
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
```

## Runtime Configuration Changes

### v1.x Runtime Creation
```tsx
import { createA2ARuntime } from '@agentarea/ui-sdk'

const runtime = createA2ARuntime({
  agentBaseUrl: 'http://localhost:9999',
  authentication: {
    type: 'bearer',
    token: 'your-token'
  }
})
```

### v2.0 Runtime Creation
```tsx
import { createA2ARuntime, createAgentAreaRuntime } from '@agentarea/core'

// A2A Runtime
const a2aRuntime = createA2ARuntime({
  agentBaseUrl: 'http://localhost:9999',
  authentication: {
    type: 'bearer',
    token: 'your-token'
  }
})

// NEW: AgentArea Custom Runtime
const agentAreaRuntime = createAgentAreaRuntime({
  endpoint: 'wss://agentarea.example.com',
  authentication: {
    type: 'bearer',
    token: 'your-token'
  },
  features: {
    batchProcessing: true,
    analytics: true,
    templates: true
  }
})

// NEW: Runtime switching
<AgentUI runtime={selectedRuntime}>
  {/* Components adapt to runtime capabilities */}
</AgentUI>
```

## Error Handling Migration

### v1.x Error Handling
```tsx
// Basic try-catch around components
try {
  return (
    <AgentProvider runtime={runtime}>
      <TaskPrimitive.Root />
    </AgentProvider>
  )
} catch (error) {
  return <div>Error: {error.message}</div>
}
```

### v2.0 Error Handling
```tsx
// Built-in error boundaries
<AgentUI runtime="a2a" endpoint="http://localhost:9999">
  {/* Automatic error boundaries around component groups */}
  <Task.Root taskId="task-123" />
  <Chat.Root taskId="task-123" />
  <Artifact artifact={artifact} />
</AgentUI>

// Custom error boundaries for specific needs
<TaskErrorBoundary fallback={<TaskErrorFallback />}>
  <Task.Root taskId="task-123" />
</TaskErrorBoundary>

<ArtifactErrorBoundary fallback={<ArtifactErrorFallback />}>
  <Artifact artifact={artifact} />
</ArtifactErrorBoundary>
```

## SSR and Next.js Migration

### v1.x (No SSR Support)
```tsx
// Client-side only
function MyPage() {
  return (
    <AgentProvider runtime={runtime}>
      <TaskPrimitive.Root />
    </AgentProvider>
  )
}
```

### v2.0 SSR Support
```tsx
// Next.js App Router
'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamic import for client-only features
const AgentUIWithRealTime = dynamic(
  () => import('@agentarea/react').then(mod => mod.AgentUI),
  { 
    ssr: false,
    loading: () => <div>Loading agent interface...</div>
  }
)

export default function AgentsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AgentUIWithRealTime
        runtime="a2a"
        endpoint={process.env.NEXT_PUBLIC_AGENT_ENDPOINT}
        autoConnect
      >
        <Task.List />
        <Chat.Root />
      </AgentUIWithRealTime>
    </Suspense>
  )
}
```

## Styling Migration

### v1.x Styling
```css
/* Custom CSS for components */
.agent-card {
  border: 1px solid #ccc;
  padding: 1rem;
  border-radius: 8px;
}

.task-status {
  color: #28a745;
  font-weight: bold;
}
```

### v2.0 Styling
```tsx
// Built-in Tailwind CSS classes and shadcn/ui components
<AgentUI theme="dark" className="custom-theme">
  {/* Components use consistent design system */}
  <Task.Root className="custom-task-styling">
    <Task.Status /> {/* Styled with shadcn/ui variants */}
  </Task.Root>
</AgentUI>

// CSS custom properties for theming
:root {
  --primary-color: #007bff;
  --success-color: #28a745;
  --warning-color: #ffc107;
  --danger-color: #dc3545;
}
```

## Step-by-Step Migration Process

### Step 1: Update Dependencies
```bash
# Remove old package
npm uninstall @agentarea/ui-sdk

# Install new packages
npm install @agentarea/core @agentarea/react
```

### Step 2: Update Imports
Replace all imports from `@agentarea/ui-sdk` with the new package structure:

```tsx
// Before
import { AgentProvider, TaskPrimitive } from '@agentarea/ui-sdk'

// After
import { createA2ARuntime } from '@agentarea/core'
import { AgentUI, Task } from '@agentarea/react'
```

### Step 3: Choose Migration Strategy

**Strategy A: Minimal Changes (Backward Compatible)**
- Keep existing component structure
- Update imports and runtime creation
- Gradually adopt new features

**Strategy B: Full Migration (Recommended)**
- Adopt AgentUI entry point
- Use new component families
- Implement enhanced error handling
- Add SSR support if using Next.js

### Step 4: Update Component Usage

**Minimal Migration:**
```tsx
// Keep existing structure, just update imports
import { AgentProvider, TaskPrimitive } from '@agentarea/react'
import { createA2ARuntime } from '@agentarea/core'

const runtime = createA2ARuntime({ /* config */ })

<AgentProvider runtime={runtime}>
  <TaskPrimitive.Root>
    <TaskPrimitive.Input />
    <TaskPrimitive.Status />
  </TaskPrimitive.Root>
</AgentProvider>
```

**Full Migration:**
```tsx
// Adopt new AgentUI entry point and enhanced components
import { AgentUI, Task, Artifact, Input } from '@agentarea/react'

<AgentUI runtime="a2a" endpoint="http://localhost:9999" autoConnect>
  <Task.Root taskId="task-123">
    <Task.Status />
    <Task.InputRequest onResponse={handleInput} />
    <Task.Artifacts onDownload={handleDownload} />
  </Task.Root>
</AgentUI>
```

### Step 5: Update Hook Usage
```tsx
// Enhanced hook with new capabilities
const { 
  task, 
  inputRequests, 
  artifacts, 
  respondToInput, 
  downloadArtifact 
} = useTask('task-123')

// Handle new features
useEffect(() => {
  if (inputRequests.length > 0) {
    // Handle input requests
  }
}, [inputRequests])
```

### Step 6: Add Error Boundaries
```tsx
// Wrap components in error boundaries
<TaskErrorBoundary>
  <Task.Root taskId="task-123" />
</TaskErrorBoundary>

<ArtifactErrorBoundary>
  <Artifact artifact={artifact} />
</ArtifactErrorBoundary>
```

### Step 7: Test and Validate
- Test all existing functionality
- Verify new features work as expected
- Check error handling and edge cases
- Validate SSR if using Next.js
- Test performance and bundle size

## Common Migration Issues

### Issue 1: Import Errors
**Problem:** `Module not found: Can't resolve '@agentarea/ui-sdk'`

**Solution:**
```bash
# Remove old package
npm uninstall @agentarea/ui-sdk

# Install new packages
npm install @agentarea/core @agentarea/react

# Update all imports
# From: import { ... } from '@agentarea/ui-sdk'
# To: import { ... } from '@agentarea/react'
```

### Issue 2: Runtime Creation Errors
**Problem:** `createA2ARuntime is not a function`

**Solution:**
```tsx
// Import from correct package
import { createA2ARuntime } from '@agentarea/core' // Not @agentarea/react
```

### Issue 3: Component Props Changed
**Problem:** `Property 'xyz' does not exist on type`

**Solution:**
Check the [API Reference](./api-reference.md) for updated prop interfaces:
```tsx
// v1.x
<TaskPrimitive.Input value={input} onChange={setInput} />

// v2.0 - props may have changed
<Task.Input 
  value={input} 
  onChange={setInput}
  onSubmit={handleSubmit} // New required prop
/>
```

### Issue 4: TypeScript Errors
**Problem:** Type definitions don't match

**Solution:**
Update TypeScript types and ensure you're using the correct interfaces:
```tsx
// Import types from correct packages
import type { EnhancedTask, TaskInputRequest } from '@agentarea/core'
```

### Issue 5: SSR Hydration Mismatches
**Problem:** Hydration errors in Next.js

**Solution:**
Use SSR-safe patterns:
```tsx
import { useIsClient } from '@agentarea/react'

function MyComponent() {
  const isClient = useIsClient()
  
  if (!isClient) {
    return <div>Loading...</div>
  }
  
  return <AgentUI>{/* client-only content */}</AgentUI>
}
```

## Testing Migration

### Unit Tests
```tsx
// Update test imports
import { render, screen } from '@testing-library/react'
import { AgentUI, Task } from '@agentarea/react'

test('task renders correctly', () => {
  render(
    <AgentUI runtime="a2a" endpoint="http://localhost:9999">
      <Task.Root taskId="test-task" />
    </AgentUI>
  )
  
  expect(screen.getByText('Task Status')).toBeInTheDocument()
})
```

### Integration Tests
```tsx
// Test new features
test('input requests work correctly', async () => {
  const handleResponse = jest.fn()
  
  render(
    <AgentUI runtime="a2a" endpoint="http://localhost:9999">
      <Task.InputRequest 
        requests={mockInputRequests}
        onResponse={handleResponse}
      />
    </AgentUI>
  )
  
  // Test input request handling
  fireEvent.click(screen.getByText('Approve'))
  expect(handleResponse).toHaveBeenCalledWith('request-1', { approved: true })
})
```

## Performance Considerations

### Bundle Size Impact
v2.0 introduces new components but maintains tree-shaking:

```tsx
// Only import what you need
import { AgentUI, Task } from '@agentarea/react'
// Don't import: import * as AgentArea from '@agentarea/react'

// Use dynamic imports for heavy components
const Artifact = lazy(() => import('@agentarea/react').then(mod => ({ default: mod.Artifact })))
```

### Runtime Performance
- New error boundaries may add slight overhead
- Enhanced components include more features but are optimized
- Real-time features use efficient WebSocket connections
- Artifact rendering is lazy-loaded by default

## Getting Help

### Resources
- [API Reference](./api-reference.md) - Complete API documentation
- [Examples](../examples/README.md) - Working examples for all frameworks
- [Troubleshooting Guide](./troubleshooting.md) - Common issues and solutions
- [Best Practices](./best-practices.md) - Recommended patterns and practices

### Community Support
- GitHub Issues: Report bugs and request features
- Discussions: Ask questions and share experiences
- Discord: Real-time community support

### Migration Assistance
If you need help with migration:

1. Review this guide thoroughly
2. Check the examples for your framework
3. Test incrementally with small changes
4. Use TypeScript for better error detection
5. Reach out to the community for specific issues

## Conclusion

AgentArea UI SDK v2.0 brings significant enhancements while maintaining backward compatibility where possible. The migration process is designed to be incremental, allowing you to adopt new features at your own pace.

Key benefits of migrating:
- ✅ Enhanced component capabilities
- ✅ Better error handling and resilience
- ✅ SSR and Next.js support
- ✅ Multi-runtime protocol support
- ✅ Improved TypeScript definitions
- ✅ Better performance and bundle optimization

Take your time with the migration, test thoroughly, and don't hesitate to reach out for help when needed.