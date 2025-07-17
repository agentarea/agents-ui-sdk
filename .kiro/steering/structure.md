# Project Structure

## Monorepo Organization

```
├── packages/
│   ├── core/           # Protocol-agnostic runtime library
│   └── react/          # React UI components and hooks
├── examples/           # Example implementations
├── stories/            # Storybook component documentation
└── .storybook/         # Storybook configuration
```

## Core Package (`packages/core/`)

- **Purpose**: Protocol adapters and runtime management
- **Structure**:
  - `src/runtime/` - Runtime implementations (A2A, AgentArea, Base)
  - `src/types/` - TypeScript type definitions
  - `dist/` - Compiled output (ESM modules)

## React Package (`packages/react/`)

- **Purpose**: React components, hooks, and providers
- **Structure**:
  - `src/components/` - UI components organized by category
    - `primitives/` - Core agent and task primitives
    - `providers/` - Context providers for state management
    - `artifacts/` - Content display components
    - `inputs/` - Form and interaction components
    - `ui/` - Base UI components (buttons, inputs, etc.)
    - `error-boundaries/` - Error handling components
    - `ssr-safe/` - Server-side rendering components
  - `src/hooks/` - Custom React hooks
  - `src/lib/` - Utility functions and configuration

## Component Architecture Patterns

### Primitive Components
- Follow Radix UI patterns with `.Root`, `.Input`, `.Output` structure
- Composable and unstyled by default
- Support conditional rendering with `.If` components

### Provider Pattern
- Context-based state management
- Hierarchical provider structure (Agent → Task → Input)
- Custom hooks for consuming context

### Error Boundaries
- Granular error handling at component level
- Fallback components for graceful degradation
- Separate boundaries for different component types

## File Naming Conventions

- **Components**: kebab-case (e.g., `agent-primitive.tsx`)
- **Hooks**: camelCase with `use-` prefix (e.g., `use-agent.ts`)
- **Types**: camelCase (e.g., `core.ts`, `runtime.ts`)
- **Utilities**: kebab-case (e.g., `config-manager.ts`)

## Export Strategy

- Barrel exports from `index.ts` files
- Explicit re-exports to avoid naming conflicts
- Tree-shakeable exports with side-effect declarations