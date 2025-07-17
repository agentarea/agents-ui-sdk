# AgentArea UI SDK

<div align="center">

[![CI](https://github.com/agentarea-hq/agentarea-ui-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/agentarea-hq/agentarea-ui-sdk/actions/workflows/ci.yml)
[![Release](https://github.com/agentarea-hq/agentarea-ui-sdk/actions/workflows/release.yml/badge.svg)](https://github.com/agentarea-hq/agentarea-ui-sdk/actions/workflows/release.yml)
[![Storybook](https://github.com/agentarea-hq/agentarea-ui-sdk/actions/workflows/storybook.yml/badge.svg)](https://github.com/agentarea-hq/agentarea-ui-sdk/actions/workflows/storybook.yml)
[![npm version](https://badge.fury.io/js/@agentarea%2Freact.svg)](https://badge.fury.io/js/@agentarea%2Freact)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A modern, protocol-agnostic React UI library for building sophisticated agent communication interfaces**

[📚 Documentation](https://agentarea-hq.github.io/agentarea-ui-sdk/) • [🚀 Quick Start](#-quick-start) • [🎨 Components](#-component-library) • [💡 Examples](./examples)

</div>

---

Build beautiful, accessible, and performant agent interfaces with our comprehensive UI toolkit. Designed for task-oriented agent interactions across multiple protocols (A2A, ACP, custom) with zero protocol-specific code.

## ✨ What Makes This Special?

- 🎯 **Task-First Design**: Unlike traditional chat interfaces, our components are built around structured task workflows
- 🔌 **Protocol Agnostic**: Write once, work with any agent protocol - A2A, ACP, or your custom implementation
- 🚀 **Real-Time Ready**: Built-in WebSocket support with automatic reconnection and optimistic updates
- 🎨 **Radix-Inspired**: Composable primitives that give you full control over styling and behavior
- ♿ **Accessibility First**: WCAG 2.1 AA compliant out of the box with comprehensive keyboard and screen reader support
- 📱 **Framework Flexible**: Works seamlessly with Next.js, Vite, CRA, and any React setup

## 🚀 Features

- **Task-first architecture**: Built for structured task delegation rather than chat-based interactions
- **Protocol agnostic**: Supports multiple agent communication protocols through runtime adapters
- **Real-time by default**: Streaming support with live progress updates and automatic reconnection
- **Composable primitives**: Radix-style component architecture for flexible UI composition
- **Production ready**: TypeScript throughout, SSR support, tree-shakeable, comprehensive error boundaries
- **Accessibility first**: WCAG 2.1 AA compliant with full keyboard navigation and screen reader support

## 📦 Packages

This monorepo contains two main packages:

- **[@agentarea/core](./packages/core)** - Protocol-agnostic runtime library
- **[@agentarea/react](./packages/react)** - React UI components and hooks

## 🛠️ Installation

```bash
# Install both packages
npm install @agentarea/core @agentarea/react

# Or with pnpm
pnpm add @agentarea/core @agentarea/react

# Or with yarn
yarn add @agentarea/core @agentarea/react
```

## 🏃‍♂️ Quick Start

### Basic Setup

```tsx
import { AgentUI, Task, Chat, Artifact } from "@agentarea/react";

function App() {
  return (
    <AgentUI
      runtime="a2a"
      endpoint="https://your-agent-endpoint.com"
      authentication={{ type: "bearer", token: "your-token" }}
      autoConnect
    >
      {/* Task-oriented interface */}
      <Task id="task-1" />

      {/* Chat interface */}
      <Chat taskId="task-1" />

      {/* Artifact display */}
      <Artifact.Container taskId="task-1" />
    </AgentUI>
  );
}
```

### Advanced Usage with Primitives

```tsx
import {
  AgentUI,
  TaskPrimitive,
  Input,
  Block,
  useTask,
  useAgent,
} from "@agentarea/react";

function TaskInterface() {
  const { task, submitTask, respondToInput } = useTask("task-1");
  const { selectedAgent, connectionStatus } = useAgent();

  return (
    <div className="space-y-4">
      {/* Task Status Display */}
      <TaskPrimitive.Root task={task}>
        <TaskPrimitive.Title className="text-xl font-semibold" />
        <TaskPrimitive.Description className="text-gray-600" />
        <TaskPrimitive.Progress className="w-full" />

        <TaskPrimitive.If condition="working">
          <div className="animate-pulse">Task in progress...</div>
        </TaskPrimitive.If>

        <TaskPrimitive.If condition={(task) => task.inputRequests?.length > 0}>
          <Input.Form
            inputRequests={task.inputRequests}
            onSubmit={respondToInput}
          />
        </TaskPrimitive.If>
      </TaskPrimitive.Root>

      {/* Connection Status */}
      <Block.Status
        status={{
          type: "connection",
          state: connectionStatus[selectedAgent?.id] || "disconnected",
          agent: selectedAgent?.name,
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AgentUI runtime="a2a" endpoint="wss://agent.example.com" autoConnect>
      <TaskInterface />
    </AgentUI>
  );
}
```

### Multi-Runtime Support

```tsx
import { AgentUI } from "@agentarea/react";

function MultiAgentApp() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* A2A Protocol Agent */}
      <AgentUI runtime="a2a" endpoint="https://a2a-agent.com">
        <Task id="a2a-task" />
      </AgentUI>

      {/* Custom Protocol Agent */}
      <AgentUI runtime="agentarea" endpoint="https://custom-agent.com">
        <Task id="custom-task" />
      </AgentUI>
    </div>
  );
}
```

## 🎨 Component Library

### 🏗️ Architecture Overview

Our component library follows a **primitive-first approach** inspired by Radix UI, providing maximum flexibility while maintaining consistency:

```
AgentUI (Entry Point)
├── Primitives (Low-level building blocks)
│   ├── AgentPrimitive - Agent display and interaction
│   └── TaskPrimitive - Task state and lifecycle management
├── Composed Components (High-level, ready-to-use)
│   ├── Task - Complete task interface
│   ├── Chat - Messaging and communication
│   ├── Artifact - Content display and management
│   ├── Input - User input collection
│   └── Block - Protocol communication display
└── Hooks (State management and logic)
    ├── useTask, useAgent, useArtifacts
    ├── useConnection, useRealtime
    └── useRuntimeEnvironment
```

### 🧩 Component Families

#### **Task Components** - Task-oriented interfaces

```tsx
import { Task, TaskPrimitive } from '@agentarea/react'

// High-level composed component
<Task id="task-1" showProgress showArtifacts />

// Or build custom interfaces with primitives
<TaskPrimitive.Root task={task}>
  <TaskPrimitive.Title />
  <TaskPrimitive.Progress />
  <TaskPrimitive.If condition="completed">
    <TaskPrimitive.Output />
  </TaskPrimitive.If>
</TaskPrimitive.Root>
```

#### **Artifact Components** - Rich content display

```tsx
import { Artifact } from '@agentarea/react'

// Container with metadata and actions
<Artifact.Container
  artifact={artifact}
  onDownload={handleDownload}
  onShare={handleShare}
  collapsible
/>

// Specialized content renderers
<Artifact.Code
  artifact={codeArtifact}
  showLineNumbers
  highlightLines={[1, 5, 10]}
  onCopy={handleCopy}
/>

<Artifact.Data
  artifact={dataArtifact}
  expandable
  searchable
/>
```

#### **Input Components** - Dynamic user input collection

```tsx
import { Input } from '@agentarea/react'

// Dynamic form generation
<Input.Form
  inputRequests={task.inputRequests}
  onSubmit={handleSubmit}
  showProgress
/>

// Individual input types
<Input.Approval
  request={approvalRequest}
  onApprove={handleApprove}
  onReject={handleReject}
  showContext
/>

<Input.Selection
  request={selectionRequest}
  onSelect={handleSelect}
  searchable
  multiSelect
/>
```

#### **Block Components** - Protocol communication display

```tsx
import { Block } from '@agentarea/react'

// Enhanced message display with correlation
<Block.Message
  message={protocolMessage}
  showCorrelation
  expandable
  onCorrelate={handleCorrelation}
/>

// Real-time status with metrics
<Block.Status
  status={{
    type: 'connection',
    state: 'online',
    metrics: { latency: 45, uptime: 86400 },
    agent: 'GPT-4 Assistant'
  }}
  showMetrics
  realTime
/>

// Protocol information with compliance
<Block.Protocol
  protocol={{
    type: 'A2A',
    version: '1.2.0',
    features: ['task_delegation', 'real_time_updates'],
    compliance: { level: 'full', certifications: ['SOC2', 'GDPR'] }
  }}
  showCompliance
/>
```

### 🎯 Framework Integration

#### **Next.js** - Full SSR support

```tsx
// pages/_app.tsx
import { AgentUI } from "@agentarea/react";

export default function App({ Component, pageProps }) {
  return (
    <AgentUI
      runtime="a2a"
      endpoint={process.env.NEXT_PUBLIC_AGENT_ENDPOINT}
      // SSR-safe configuration
      clientOnly={false}
      fallback={<AgentUI.Skeleton />}
    >
      <Component {...pageProps} />
    </AgentUI>
  );
}

// pages/agent/[id].tsx - Dynamic agent pages
import { useRouter } from "next/router";
import { Task, Chat } from "@agentarea/react";

export default function AgentPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="container mx-auto p-4">
      <Task id={id as string} />
      <Chat taskId={id as string} />
    </div>
  );
}
```

#### **Vite** - Lightning-fast development

```tsx
// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AgentUI } from "@agentarea/react";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AgentUI
      runtime="agentarea"
      endpoint={import.meta.env.VITE_AGENT_ENDPOINT}
      debug={import.meta.env.DEV}
      devTools={import.meta.env.DEV}
    >
      <App />
    </AgentUI>
  </StrictMode>
);
```

### 🎨 Styling & Theming

Built on **Tailwind CSS** with **shadcn/ui** components for consistent, customizable styling:

```tsx
// Custom theme configuration
<AgentUI
  theme="dark"
  className="min-h-screen bg-background text-foreground"
>
  <Task
    id="task-1"
    className="rounded-lg border bg-card p-6"
  />
</AgentUI>

// CSS custom properties for deep customization
:root {
  --agent-primary: 210 40% 98%;
  --agent-secondary: 210 40% 96%;
  --agent-accent: 210 40% 90%;
  --agent-destructive: 0 84% 60%;
}
```

## 🧪 Testing

We maintain comprehensive test coverage with multiple testing strategies:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

### Testing Features

- **Unit Tests**: Jest + React Testing Library for component logic
- **Integration Tests**: Multi-runtime functionality and real-time updates
- **Accessibility Tests**: Automated a11y testing with jest-axe
- **Visual Regression**: Chromatic integration for UI consistency
- **Performance Tests**: Bundle size and rendering performance monitoring

### Writing Tests

```tsx
import { render, screen } from "@test-utils";
import { Task } from "@agentarea/react";
import { mockTask } from "@test-utils";

test("displays task progress correctly", () => {
  const task = mockTask({ progress: 75, status: "working" });

  render(<Task id={task.id} />, {
    wrapperProps: { tasks: [task] },
  });

  expect(screen.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "75"
  );
  expect(screen.getByText("working")).toBeInTheDocument();
});
```

## ⚡ Performance

### Bundle Size Optimization

- **Tree-shakeable**: Import only what you need
- **Code splitting**: Automatic splitting for different runtimes
- **Lazy loading**: Dynamic imports for specialized components

```tsx
// Only imports the specific components you use
import { Task, useTask } from "@agentarea/react";

// Lazy load specialized components
const ArtifactCode = lazy(() =>
  import("@agentarea/react").then((m) => ({ default: m.Artifact.Code }))
);
```

### Runtime Performance

- **Optimistic updates**: Immediate UI feedback
- **Efficient re-renders**: Memoized components and selective updates
- **Connection pooling**: Reuse connections across components
- **Automatic cleanup**: Memory leak prevention

### Performance Monitoring

```tsx
import { AgentUI } from "@agentarea/react";

<AgentUI
  runtime="a2a"
  endpoint="https://agent.example.com"
  // Performance monitoring
  onPerformanceMetric={(metric) => {
    console.log(`${metric.name}: ${metric.value}ms`);
  }}
  // Memory management
  maxConnections={5}
  connectionTimeout={30000}
>
  <YourApp />
</AgentUI>;
```

## 🔧 Development

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup

```bash
# Clone the repository
git clone https://github.com/agentarea-hq/agentarea-ui-sdk.git
cd agentarea-ui-sdk

# Install dependencies
pnpm install

# Build packages
pnpm build

# Start development
pnpm dev
```

### Available Scripts

```bash
# Development
pnpm dev                    # Start development with watch mode
pnpm build                  # Build all packages
pnpm build:core            # Build core package only
pnpm build:react           # Build React package only

# Quality Assurance
pnpm type-check            # TypeScript type checking
pnpm test                  # Run test suite
pnpm test:watch            # Run tests in watch mode
pnpm test:coverage         # Generate coverage report

# Documentation
pnpm storybook             # Start Storybook development server
pnpm build-storybook       # Build Storybook for deployment

# Maintenance
pnpm clean                 # Clean build artifacts
pnpm test:build           # Test build process
```

### Publishing

```bash
# Dry run to test publishing
pnpm publish:dry-run

# Publish packages to npm
pnpm publish:packages

# Version bumping
pnpm version:patch  # 0.1.0 -> 0.1.1
pnpm version:minor  # 0.1.0 -> 0.2.0
pnpm version:major  # 0.1.0 -> 1.0.0
```

## 🚀 CI/CD

This project uses GitHub Actions for continuous integration and deployment:

### Workflows

- **CI** (`ci.yml`): Runs on every push and PR

  - Tests on Node.js 18.x and 20.x
  - Type checking and building
  - Storybook build verification
  - Publish dry-run testing

- **Release** (`release.yml`): Automated releases

  - Triggered by version tags or manual dispatch
  - Publishes to npm
  - Creates GitHub releases
  - Deploys Storybook to GitHub Pages

- **Storybook** (`storybook.yml`): Documentation deployment

  - Deploys Storybook on every main branch push
  - Available at GitHub Pages

- **Security** (`security.yml`): Security and dependency monitoring
  - Weekly dependency audits
  - Security scorecard checks
  - Dependency review on PRs

### Deployment

The project automatically deploys:

1. **NPM Packages**: Published on tagged releases
2. **Storybook Documentation**: Deployed to GitHub Pages on main branch updates
3. **GitHub Releases**: Created automatically for version tags

## 📚 Documentation

- **[Storybook](https://agentarea-hq.github.io/agentarea-ui-sdk/)** - Interactive component documentation
- **[API Reference](./docs/api-reference.md)** - Detailed API documentation
- **[Migration Guide](./docs/migration-guide.md)** - Upgrading between versions
- **[Best Practices](./docs/best-practices.md)** - Usage recommendations

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the build: `pnpm build`
5. Run type checking: `pnpm type-check`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🏢 About AgentArea

AgentArea is building the future of agent-to-agent communication. This UI SDK is part of our mission to make agent interactions more accessible and developer-friendly.

- **Website**: [agentarea.com](https://agentarea.com)
- **Documentation**: [docs.agentarea.com](https://docs.agentarea.com)
- **Community**: [Discord](https://discord.gg/agentarea)

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/agentarea-hq/agentarea-ui-sdk/issues)
- **Discussions**: [GitHub Discussions](https://github.com/agentarea-hq/agentarea-ui-sdk/discussions)
- **Email**: support@agentarea.com
