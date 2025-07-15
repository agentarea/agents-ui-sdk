# AgentArea UI SDK

**The React UI library that makes agent integration effortless.**

Stop wrestling with WebSocket connections, protocol differences, and complex state management. AgentArea UI SDK provides everything you need to build beautiful, responsive agent interfaces in minutes, not months.

## Why AgentArea UI SDK?

### 🚀 **Ship Agent UIs 10x Faster**
```tsx
// Before: 500+ lines of WebSocket boilerplate
// After: 5 lines to get started
const runtime = createA2ARuntime({ endpoint: 'http://localhost:9999' })
return (
  <AgentProvider runtime={runtime}>
    <TaskPrimitive.Root>
      <TaskPrimitive.Input onSubmit={handleTask} />
      <TaskPrimitive.Output />
    </TaskPrimitive.Root>
  </AgentProvider>
)
```

### 🌐 **Works with Any Agent Protocol**
- **A2A (Google)** - JSON-RPC with real-time streaming
- **ACP (IBM)** - REST-based enterprise protocol  
- **Custom protocols** - Bring your own adapter
- **Future-proof** - New protocols added automatically

### 🎯 **Task-First Architecture**
Unlike chat-based libraries, we're built for **task delegation**:
```tsx
// Chat libraries force you into message patterns
sendMessage("Analyze this data and create a report")

// AgentArea is designed for structured task workflows
createTask({
  type: "data_analysis",
  input: { dataset: data },
  onProgress: (update) => showProgress(update),
  onComplete: (result) => displayReport(result)
})
```

### ⚡ **Real-Time by Default**
- **Live progress updates** as agents work
- **Streaming support** for long-running tasks
- **Automatic reconnection** when connections drop
- **Optimistic updates** for instant feedback

### 🎨 **Radix-Style Components**
Composable primitives that adapt to any design system:
```tsx
<TaskPrimitive.Root>
  <TaskPrimitive.Input placeholder="What should the agent do?" />
  <TaskPrimitive.Send>Execute Task</TaskPrimitive.Send>
  
  <TaskPrimitive.If status="working">
    <TaskPrimitive.Progress />
    <TaskPrimitive.Cancel>Stop Task</TaskPrimitive.Cancel>
  </TaskPrimitive.If>
  
  <TaskPrimitive.If status="completed">
    <TaskPrimitive.Output />
  </TaskPrimitive.If>
</TaskPrimitive.Root>
```

### 🔥 **Production-Ready**
- **TypeScript** throughout for bulletproof development
- **SSR support** for Next.js applications
- **Vite compatible** for lightning-fast builds
- **Tree-shakeable** - only bundle what you use
- **Tested** with comprehensive test coverage

## Installation

```bash
npm install @agentarea/core @agentarea/react
```

## Quick Start

Get a working agent interface in under 2 minutes:

```tsx
import { createA2ARuntime } from '@agentarea/core'
import { 
  AgentProvider, 
  TaskPrimitive, 
  AgentPrimitive 
} from '@agentarea/react'

function App() {
  const runtime = createA2ARuntime({
    agentBaseUrl: 'http://localhost:9999',
    authentication: {
      type: 'bearer',
      token: 'your-token'
    }
  })

  return (
    <AgentProvider runtime={runtime}>
      <div className="max-w-2xl mx-auto p-6">
        {/* Agent Status */}
        <AgentPrimitive.Root className="mb-6">
          <h1><AgentPrimitive.Name /></h1>
          <p><AgentPrimitive.Description /></p>
          <AgentPrimitive.Status />
        </AgentPrimitive.Root>

        {/* Task Interface */}
        <TaskPrimitive.Root>
          <TaskPrimitive.Input 
            placeholder="What should the agent do?"
            onSubmit={(task) => console.log('Task created:', task)}
          />
          <TaskPrimitive.Send>Execute Task</TaskPrimitive.Send>
          
          <TaskPrimitive.If status="working">
            <TaskPrimitive.Progress />
          </TaskPrimitive.If>
          
          <TaskPrimitive.If status="completed">
            <TaskPrimitive.Output />
          </TaskPrimitive.If>
        </TaskPrimitive.Root>
      </div>
    </AgentProvider>
  )
}
```

That's it! You now have a fully functional agent interface with:
- ✅ Real-time connection status
- ✅ Task input and submission
- ✅ Progress tracking
- ✅ Results display
- ✅ Error handling

## Who Uses AgentArea UI SDK?

### 🏢 **Enterprise Teams**
"*We replaced 3 months of custom agent integration work with AgentArea. Now our developers can focus on business logic instead of WebSocket plumbing.*" - **Senior Engineering Manager, Fortune 500**

### 🚀 **AI Startups**
"*AgentArea SDK let us ship our MVP 5x faster. The protocol-agnostic design means we can easily switch between different AI providers.*" - **CTO, AI Startup**

### 🔬 **Research Teams**
"*The task-centric approach perfectly matches how we think about agent workflows. Real-time progress updates keep our researchers engaged.*" - **Research Lead, University Lab**

---

## Core Concepts

### 1. **Protocol Runtimes**
Switch between agent protocols without changing your UI:

```tsx
// A2A Protocol (Google)
const a2aRuntime = createA2ARuntime({
  agentBaseUrl: 'http://agent:9999',
  authentication: { type: 'bearer', token: 'token' }
})

// ACP Protocol (IBM) - Coming Soon
const acpRuntime = createACPRuntime({
  endpoint: 'http://agent:8080'
})

// Custom Protocol
const customRuntime = createCustomRuntime({
  adapter: myProtocolAdapter
})
```

### 2. **Task-Centric Workflows**
Purpose-built for task delegation, not chat:

```tsx
const { createTask } = useTaskCreation()

// Structured task creation
await createTask({
  type: 'data_analysis',
  input: { 
    dataset: csvData,
    analysisType: 'regression' 
  },
  onProgress: (update) => {
    setProgress(update.percentComplete)
    setStatus(update.message)
  },
  onComplete: (result) => {
    displayChart(result.visualization)
    downloadReport(result.report)
  }
})
```

### 3. **Composable Primitives**
Build any UI with our Radix-style components:

```tsx
<TaskPrimitive.Root>
  <TaskPrimitive.Input 
    placeholder="Describe your task..."
    onSubmit={handleSubmit}
  />
  
  <TaskPrimitive.If status="working">
    <div className="flex items-center gap-2">
      <TaskPrimitive.Progress />
      <TaskPrimitive.Cancel>Cancel</TaskPrimitive.Cancel>
    </div>
  </TaskPrimitive.If>
  
  <TaskPrimitive.If status="completed">
    <TaskPrimitive.Output className="border rounded-lg p-4" />
  </TaskPrimitive.If>
</TaskPrimitive.Root>
```

### 4. **Real-Time Everything**
Built-in support for streaming and live updates:

```tsx
// Automatic streaming detection
const { supportsStreaming } = useAgent()

// Live progress updates
const { progress, status } = useTask(taskId)
console.log(`${status}: ${progress}% complete`)

// Stream results as they arrive
const { streamingResults } = useTaskStream(taskId)
streamingResults.forEach(chunk => processChunk(chunk))
```

## Framework Support

### ⚡ **Next.js (SSR Ready)**
```tsx
'use client'
import { useIsClient } from '@agentarea/react'

export default function AgentPage() {
  const isClient = useIsClient()
  
  if (!isClient) return <div>Loading...</div>
  
  return <AgentInterface />
}
```

### 🔥 **Vite (Lightning Fast)**
```tsx
// Works out of the box
import { AgentProvider } from '@agentarea/react'
import { createA2ARuntime } from '@agentarea/core'

function App() {
  const runtime = createA2ARuntime({ /* config */ })
  return <AgentProvider runtime={runtime}>...</AgentProvider>
}
```

### 🏗️ **Any React Framework**
- Create React App
- Remix
- Gatsby
- Custom bundlers

---

## API Reference

### 🤖 **Agent Components**

| Component | Purpose | Props |
|-----------|---------|-------|
| `AgentPrimitive.Root` | Agent container | `className?` |
| `AgentPrimitive.Name` | Display agent name | `className?` |
| `AgentPrimitive.Description` | Agent description | `className?` |
| `AgentPrimitive.Status` | Connection status | `className?` |
| `AgentPrimitive.Capabilities` | List capabilities | `renderCapability?` |
| `AgentPrimitive.Features` | Feature indicators | `className?` |
| `AgentPrimitive.If` | Conditional render | `connected?`, `supportsStreaming?` |

### 📋 **Task Components**

| Component | Purpose | Props |
|-----------|---------|-------|
| `TaskPrimitive.Root` | Task container | `className?` |
| `TaskPrimitive.Input` | Task input field | `onSubmit`, `placeholder?` |
| `TaskPrimitive.Send` | Submit button | `taskInput`, `disabled?` |
| `TaskPrimitive.Progress` | Progress indicator | `className?` |
| `TaskPrimitive.Output` | Results display | `className?` |
| `TaskPrimitive.Cancel` | Cancel button | `taskId`, `className?` |
| `TaskPrimitive.If` | Conditional render | `status?` |

### 🪝 **Hooks**

| Hook | Returns | Purpose |
|------|---------|---------|
| `useAgent()` | Agent state | Get agent info & status |
| `useTask(id)` | Task state | Track individual task |
| `useTaskList()` | Task array | List all tasks |
| `useTaskCreation()` | Create functions | Submit new tasks |
| `useConnection()` | Connection state | Monitor connectivity |
| `useIsClient()` | Boolean | SSR-safe client detection |

### 🔧 **Runtimes**

| Runtime | Protocol | Status |
|---------|----------|--------|
| `createA2ARuntime()` | A2A (Google) | ✅ Available |
| `createACPRuntime()` | ACP (IBM) | 🚧 Coming Soon |
| `createCustomRuntime()` | Custom | ✅ Available |

## Examples & Resources

### 🎯 **Live Examples**
Try AgentArea UI SDK in your browser:
- [**Next.js Demo**](https://agentarea-nextjs-demo.vercel.app) - SSR-ready implementation
- [**Vite Demo**](https://agentarea-vite-demo.vercel.app) - Lightning-fast development  
- [**Storybook**](https://agentarea-hq.github.io/agentarea-ui-sdk/) - Interactive component docs

### 📚 **Learning Resources**
- [**Quick Start Guide**](https://docs.agentarea.com/quickstart) - 5-minute setup
- [**API Reference**](https://docs.agentarea.com/api) - Complete documentation
- [**Protocol Guide**](https://docs.agentarea.com/protocols) - A2A, ACP, and custom protocols
- [**Example Gallery**](https://docs.agentarea.com/examples) - Real-world use cases

### 🛠️ **Development**

```bash
# Clone and install
git clone https://github.com/agentarea-hq/agentarea-ui-sdk.git
cd agentarea-ui-sdk && pnpm install

# Start development with live reload
pnpm dev

# Run examples
cd examples/react-example && pnpm dev      # Vite example
cd examples/react-nextjs-example && pnpm dev  # Next.js example

# Build and test
pnpm build && pnpm type-check
```

### 🚀 **Production Deployment**

```bash
# Install production dependencies
npm install @agentarea/core @agentarea/react

# Build optimized bundle
npm run build

# Deploy to Vercel, Netlify, or any hosting platform
```

---

## Community & Support

### 💬 **Get Help**
- [**GitHub Discussions**](https://github.com/agentarea-hq/agentarea-ui-sdk/discussions) - Community Q&A
- [**Discord Server**](https://discord.gg/agentarea) - Real-time chat
- [**GitHub Issues**](https://github.com/agentarea-hq/agentarea-ui-sdk/issues) - Bug reports & feature requests

### 📈 **Roadmap**
- ✅ A2A Protocol Support
- ✅ Next.js SSR Support  
- ✅ Vite Compatibility
- 🚧 ACP Protocol Support
- 🚧 GraphQL Subscriptions
- 🚧 WebSocket Fallback
- 🚧 Offline Support
- 🚧 React Native Support

### 🤝 **Contributing**
We welcome contributions! See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for:
- Development setup
- Code style guidelines
- Pull request process
- Community guidelines

---

## License

MIT © 2024 AgentArea Team - see [LICENSE](LICENSE) file for details.

**Built with ❤️ by the AgentArea team**