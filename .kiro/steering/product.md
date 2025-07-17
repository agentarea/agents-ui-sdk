# Product Overview

AgentArea UI SDK is a protocol-agnostic React UI library for building agent communication interfaces. The SDK enables developers to create task-oriented agent UIs that work across different agent protocols (A2A, ACP, custom) without protocol-specific implementation details.

## Core Value Proposition

- **Task-first architecture**: Built for structured task delegation rather than chat-based interactions
- **Protocol agnostic**: Supports multiple agent communication protocols through runtime adapters
- **Real-time by default**: Streaming support with live progress updates and automatic reconnection
- **Composable primitives**: Radix-style component architecture for flexible UI composition
- **Production ready**: TypeScript throughout, SSR support, tree-shakeable, comprehensive error boundaries

## Key Components

- **Agent primitives**: Display agent information, status, and capabilities
- **Task primitives**: Handle task input, execution, progress tracking, and results
- **Runtime system**: Protocol adapters for A2A (Google), ACP (IBM), and custom implementations
- **Provider architecture**: Context-based state management for agents, tasks, and communication

## Target Use Cases

- Enterprise agent integration dashboards
- AI startup MVP development
- Research team agent workflow tools
- Custom agent protocol implementations