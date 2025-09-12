# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the **AgentArea UI SDK**, a protocol-agnostic React UI library for building sophisticated agent communication interfaces. The project is built as a modern TypeScript monorepo using pnpm workspaces.

## Architecture

### Package Structure

- **`@agentarea/core`** (`packages/core/`) - Protocol-agnostic runtime library that handles A2A, ACP, and custom agent protocols
- **`@agentarea/react`** (`packages/react/`) - React UI components and hooks for agent interfaces
- **`apps/docs/`** - Fumadocs-based Next.js documentation site with interactive MDX examples
- **`apps/storybook/`** - Storybook for component development and visual testing
- **`examples/`** - Example implementations showing usage patterns

### Component Architecture

The React library follows a **primitive-first approach** inspired by Radix UI:

```
AgentUI (Entry Point Provider)
├── Primitives (Low-level building blocks)
│   ├── AgentPrimitive - Agent display and interaction
│   └── TaskPrimitive - Task state and lifecycle management
├── Composed Components (High-level, ready-to-use)
│   ├── Task - Complete task interface
│   ├── Chat - Messaging with markdown, files, tool calls
│   ├── Artifact - Content display (code, data, images, files)
│   ├── Input - Dynamic form generation and validation
│   └── Block - Protocol communication display
└── Hooks (State management)
    ├── useTask, useAgent, useArtifacts
    ├── useConnection, useRealtime
    └── useRuntimeEnvironment
```

### Key Design Principles

- **Task-first design**: Built for structured task workflows, not just chat
- **Protocol agnostic**: Works with A2A, ACP, or custom protocols via runtime adapters
- **Compound components**: Flexible composition patterns (e.g., `Chat.Message`, `Artifact.Code`)
- **SSR support**: Works with Next.js and other SSR frameworks
- **Real-time ready**: Built-in WebSocket support with automatic reconnection

## Common Development Commands

### Building and Development

```bash
# Install dependencies
pnpm install

# Build all packages (core builds first due to dependency)
pnpm build

# Development with watch mode
pnpm dev

# Build individual packages
pnpm build:core
pnpm build:react

# Type checking
pnpm type-check
```

### Testing

```bash
# Run all tests (Vitest)
pnpm test

# Watch mode
pnpm test:watch

# With UI
pnpm test:ui

# Coverage report
pnpm test:coverage

# Test the build process
pnpm test:build
```

### Documentation and Storybook

```bash
# Start Storybook development server
pnpm storybook

# Build Storybook for deployment
pnpm build-storybook

# Start docs site (Fumadocs/Next.js)
cd apps/docs && pnpm dev

# Build docs site
cd apps/docs && pnpm build
```

### Package Management

```bash
# Clean all build artifacts
pnpm clean

# Publish packages (dry run first)
pnpm publish:dry-run
pnpm publish:packages

# Version bumping
pnpm version:patch
pnpm version:minor
pnpm version:major
```

## Development Environment

### TypeScript Configuration

- Uses TypeScript project references for efficient builds
- Root `tsconfig.json` only contains references to packages
- Each package has its own TypeScript configuration

### Testing Setup

- **Vitest** with React Testing Library for component testing
- **jsdom** environment for DOM testing
- **jest-axe** for accessibility testing
- Path aliases configured for `@agentarea/core`, `@agentarea/react`, and `@test-utils`

### Package Dependencies

- **Core package**: Minimal dependencies, includes `@a2a-js/sdk`
- **React package**: Depends on core, uses Radix UI primitives, Tailwind CSS utilities
- **Peer dependencies**: React 18+ required

## Documentation Architecture

### Fumadocs Documentation (`apps/docs/`)

- Built with Next.js 15 and Fumadocs
- Interactive MDX examples with live component demos
- Components imported directly from `@agentarea/react`
- Real React state management in documentation examples

### MDX Documentation Pattern

Each component doc follows this structure:

```mdx
---
title: Component Name
description: Brief description
---

import { Component } from "@agentarea/react";
import { useState } from "react";

// Description and code examples

export function InteractiveExample() {
  const [state, setState] = useState()
  return <Component ... />
}

<InteractiveExample />
```

### Storybook

- Stories located in `apps/storybook/stories/`
- Comprehensive examples including edge cases, accessibility, and performance scenarios
- Stories serve as both documentation and testing

## Protocol Integration

### Runtime System

The core package provides runtime implementations:

- **BaseRuntime**: Abstract base for all protocols
- **A2ARuntime**: Agent-to-Agent protocol implementation
- **AgentAreaRuntime**: Custom AgentArea protocol
- **RuntimeFactory**: Factory for creating and managing runtimes

### Usage Pattern

```tsx
// Provider wraps entire app or agent interface
<AgentProvider runtime="a2a" endpoint="wss://agent.example.com">
  <Task id="task-1" />
  <Chat taskId="task-1" />
  <Artifact.Container taskId="task-1" />
</AgentProvider>
```

## Component Development Guidelines

### Adding New Components

1. Create in `packages/react/src/components/`
2. Follow compound component pattern if applicable
3. Export from `packages/react/src/index.ts`
4. Add Storybook stories in `apps/storybook/stories/`
5. Add documentation in `apps/docs/content/docs/`

### Styling Approach

- Built on Tailwind CSS with shadcn/ui components
- Uses `class-variance-authority` for component variants
- `tailwind-merge` for className merging
- CSS custom properties for theming

### State Management

- React Context for global state (agents, tasks, artifacts)
- Custom hooks for component-specific logic
- Optimistic updates for real-time interactions

## File Testing

- Test files use `.test.ts` or `.spec.ts` extensions
- Located alongside source files in each package
- Vitest configuration includes both `packages/**` and `test/**` directories
- Mock utilities in `test/test-utils.ts`

## Important Notes for Development

### Monorepo Workspace

- Uses pnpm workspaces with `packages/*` and `apps/*`
- Workspace dependencies use `workspace:*` protocol
- Build order matters: core must build before react

### Bundle Optimization

- Tree-shakeable exports
- Lazy loading for specialized components
- No side effects declared in package.json
- ESM-only packages (type: "module")

### SSR Considerations

- SSR-safe components in `components/ssr-safe/`
- Environment detection utilities
- Graceful degradation patterns for client-only features

### Error Handling

- Comprehensive error boundaries for each component family
- Graceful fallbacks for protocol connection failures
- Development vs production error handling
