# AgentArea UI SDK Examples

This directory contains comprehensive example applications demonstrating the full capabilities of the AgentArea UI SDK, including all new components and features.

## Available Examples

### 🎨 React Example - Comprehensive Component Showcase
A complete React application with Vite showcasing all SDK capabilities:

```bash
cd react-example
pnpm install
pnpm dev
```

**Features demonstrated:**
- **AgentUI Entry Point**: Unified component with runtime management
- **Artifact Display**: Rich rendering for code, data, files, images, and text
- **Input Collection**: Dynamic forms, approvals, selections, and file uploads
- **Communication Blocks**: Protocol messages, status updates, and metadata
- **Enhanced Task Management**: Input requests and artifact integration
- **Debug Tools**: Comprehensive development and debugging features

### 🚀 Next.js Example - Server-Side Rendering
Next.js application demonstrating SSR integration and production patterns:

```bash
cd react-nextjs-example
pnpm install
pnpm dev
```

**Features demonstrated:**
- **SSR-Safe Components**: Hydration-aware initialization and state management
- **Performance Optimizations**: Code splitting, lazy loading, and caching
- **Production Features**: Error boundaries, loading states, and SEO optimization
- **Environment Detection**: Automatic Next.js environment adaptation
- **Streaming Support**: Progressive loading with React Suspense

### 🔄 Multi-Runtime Example - Protocol Integration
Comprehensive example showcasing multiple agent communication protocols:

```bash
cd multi-runtime-example
pnpm install
pnpm dev
```

**Features demonstrated:**
- **A2A Protocol**: Google's Agent-to-Agent communication standard
- **AgentArea Custom**: Enhanced custom protocol with additional features
- **Runtime Switching**: Dynamic switching between different protocols
- **Protocol Comparison**: Side-by-side feature comparison and capabilities
- **Environment Support**: Vite integration with performance monitoring

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Running Any Example

1. **Build the SDK first** (from repository root):
   ```bash
   pnpm build
   ```

2. **Navigate to example directory**:
   ```bash
   cd examples/[example-name]
   ```

3. **Install dependencies**:
   ```bash
   pnpm install
   ```

4. **Start development server**:
   ```bash
   pnpm dev
   ```

5. **Build for production**:
   ```bash
   pnpm build
   ```

## Component Showcase

### AgentUI Entry Point
```tsx
// All-in-one component
<AgentUI 
  runtime="a2a" 
  endpoint="https://api.example.com"
  autoConnect
  debug
>
  <Task id="task-1" />
  <Chat taskId="task-1" />
</AgentUI>

// Compound component pattern
<AgentUI.Provider runtime="agentarea">
  <AgentUI.Connection showLatency showActions />
  <Task.List />
  <AgentUI.Debug showEnvironment />
</AgentUI.Provider>
```

### New Component Families

**Artifact Display**
```tsx
<Artifact artifact={artifact} onDownload={handleDownload} />
<Artifact.Code artifact={codeArtifact} />
<Artifact.Data artifact={dataArtifact} />
<Artifact.File artifact={fileArtifact} />
```

**Input Collection**
```tsx
<Input.Approval request={approvalRequest} onApprove={handleApprove} />
<Input.Selection request={selectionRequest} multiSelect />
<Input.Upload onUpload={handleUpload} dragAndDrop />
<Input.Form schema={formSchema} onSubmit={handleSubmit} />
```

**Communication Blocks**
```tsx
<Block.Message message={protocolMessage} expandable />
<Block.Protocol protocol={protocolInfo} showFeatures />
<Block.Status status={connectionStatus} realTime />
<Block.Metadata metadata={executionData} expandable />
```

## Framework Integration

### React with Vite
- ⚡ Lightning-fast HMR and development
- 📦 Optimized bundling and tree-shaking
- 🔧 TypeScript support out of the box
- 🎯 Modern browser targeting

### Next.js with SSR
- 🚀 Server-side rendering and static generation
- ⚡ Automatic code splitting and optimization
- 📱 Progressive web app capabilities
- 🔍 SEO-friendly with proper meta tags

### Multi-Runtime Support
- 🔗 A2A protocol integration
- ⚡ AgentArea custom protocol
- 🔄 Dynamic runtime switching
- 📊 Protocol comparison and analytics

## Development Features

### Debug Tools
All examples include comprehensive debugging:
```tsx
<AgentUI.Debug 
  showEnvironment    // Runtime environment info
  showRuntime       // Active runtime details
  showConnections   // Connection status
  showConfig        // Configuration dump
/>
```

### Error Boundaries
- Component-level error isolation
- Graceful degradation for unsupported features
- Retry mechanisms with exponential backoff
- Clear error messaging with actionable guidance

### Performance Monitoring
- Bundle size analysis and optimization
- Runtime performance metrics
- Memory usage tracking
- Connection latency monitoring

## Production Deployment

### Environment Variables
```bash
# Common environment variables
NEXT_PUBLIC_AGENT_ENDPOINT=https://your-agent-api.com
NEXT_PUBLIC_DEBUG_MODE=false
AGENT_API_KEY=your-secret-key
```

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Vercel Deployment
```bash
# Deploy to Vercel
vercel

# Automatic deployments with GitHub integration
# Environment variables configured in Vercel dashboard
```

## SDK Usage Patterns

### Package Installation
Examples use local SDK builds for development:

```json
{
  "dependencies": {
    "@agentarea/core": "file:../../packages/core",
    "@agentarea/react": "file:../../packages/react"
  }
}
```

In production, install from npm:
```bash
npm install @agentarea/core @agentarea/react
```

### Import Patterns
```tsx
// Main components and hooks
import { 
  AgentUI,
  Task,
  Chat,
  Artifact,
  Input,
  Block,
  useTask,
  useArtifacts,
  useAgentConnection
} from '@agentarea/react'

// Core runtime and types
import { 
  createA2ARuntime,
  createAgentAreaRuntime
} from '@agentarea/core'
```

## Best Practices

### Component Usage
- Use error boundaries around component groups
- Implement loading states for better UX
- Handle offline scenarios gracefully
- Provide fallbacks for unsupported features

### Performance
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Cache artifacts and metadata locally
- Optimize re-renders with proper dependencies

### Accessibility
- All components follow WCAG 2.1 AA standards
- Keyboard navigation support
- Screen reader compatibility
- High contrast theme support

### Security
- Validate all inputs on both client and server
- Use environment variables for sensitive configuration
- Implement proper CORS policies
- Sanitize user-generated content

## Troubleshooting

### Common Issues

**Build Errors**
- Ensure SDK is built first: `pnpm build` from root
- Check TypeScript configuration and imports
- Verify all dependencies are installed

**Runtime Connection Issues**
- Verify endpoint URL and authentication
- Check network connectivity and CORS settings
- Enable debug mode for detailed logs

**SSR Hydration Issues** (Next.js)
- Use `useIsClient()` hook for client-only features
- Implement proper loading states during hydration
- Handle WebSocket connections client-side only

**Performance Issues**
- Use React DevTools Profiler
- Check for unnecessary re-renders
- Optimize large artifact rendering
- Monitor bundle size and lazy load components

### Debug Mode
Enable comprehensive debugging in any example:
```tsx
<AgentUI debug devTools>
  {/* Detailed logging and state inspection */}
</AgentUI>
```

## Contributing

These examples are part of the AgentArea UI SDK monorepo. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes to examples
4. Test across different frameworks
5. Update documentation as needed
6. Submit a pull request

### Adding New Examples

To add a new example:

1. Create a new directory in `examples/`
2. Set up the framework (React, Vue, Angular, etc.)
3. Add SDK dependencies using file references
4. Implement comprehensive component showcase
5. Add detailed README with setup instructions
6. Update this main examples README

## Next Steps

- **Explore Components**: Start with the React example for comprehensive component showcase
- **Learn SSR**: Check the Next.js example for server-side rendering patterns
- **Multi-Protocol**: Try the multi-runtime example for protocol switching
- **Read Docs**: Review the [main documentation](../README.md) for detailed API reference
- **View Stories**: Check [Storybook stories](../stories) for component documentation

## Built With

- [React 19](https://reactjs.org/) - UI library with concurrent features
- [Next.js 15](https://nextjs.org/) - React framework with SSR
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [AgentArea UI SDK](../README.md) - Agent communication components