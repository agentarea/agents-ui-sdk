# Technology Stack

## Build System & Package Management

- **Package Manager**: pnpm with workspace configuration
- **Monorepo Structure**: Two main packages (`@agentarea/core`, `@agentarea/react`)
- **Build Tool**: TypeScript compiler (tsc) for library builds, Vite for examples
- **Module System**: ESM modules with Node.js resolution

## Core Technologies

- **TypeScript**: Strict mode enabled, ES2018 target
- **React**: v19+ with JSX transform, hooks-based architecture
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Component Library**: Radix UI primitives for accessibility and composability
- **State Management**: React Context providers with custom hooks

## Key Dependencies

- **Core Runtime**: `@a2a-js/sdk` for A2A protocol support
- **UI Components**: `@radix-ui/react-*` for accessible primitives
- **Styling Utilities**: `clsx`, `tailwind-merge`, `class-variance-authority`
- **Development**: Storybook for component documentation and testing

## Common Commands

```bash
# Install dependencies
pnpm install

# Development with watch mode
pnpm dev

# Build all packages
pnpm build

# Type checking
pnpm type-check

# Clean build artifacts
pnpm clean

# Start Storybook
pnpm storybook

# Build Storybook for deployment
pnpm build-storybook
```

## Framework Support

- **Next.js**: SSR-ready with client-side hydration patterns
- **Vite**: Lightning-fast development with HMR
- **Any React framework**: CRA, Remix, Gatsby compatible
- **Tree-shaking**: Side-effect free exports for optimal bundling