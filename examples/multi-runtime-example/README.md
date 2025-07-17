# Multi-Runtime Integration Example

This example demonstrates the AgentArea UI SDK's multi-runtime capabilities, showcasing how to build applications that work with different agent communication protocols.

## Features Demonstrated

### 🔄 Multi-Runtime Support
- **A2A Protocol**: Google's Agent-to-Agent communication standard
- **AgentArea Custom**: Enhanced custom protocol with additional features
- **Runtime Switching**: Dynamic switching between different protocols
- **Protocol Comparison**: Side-by-side feature comparison

### 🎨 Component Showcase
- **Artifact Display**: Rich rendering for code, data, and files
- **Input Collection**: Dynamic forms, approvals, and selections
- **Communication Blocks**: Protocol messages and status updates
- **Task Management**: Enhanced task handling with real-time updates

### ⚡ Advanced Features
- **Environment Detection**: Automatic Vite/React environment detection
- **Real-time Updates**: WebSocket-based live communication
- **Error Boundaries**: Graceful error handling and recovery
- **Debug Tools**: Comprehensive debugging and development tools

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation
```bash
# From the example directory
pnpm install

# Or from the root of the monorepo
pnpm install
```

### Development
```bash
# Start the development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Usage Examples

### Basic Multi-Runtime Setup
```tsx
import { AgentUI } from '@agentarea/react'

function App() {
  const [runtime, setRuntime] = useState<'a2a' | 'agentarea'>('a2a')
  
  return (
    <AgentUI
      runtime={runtime}
      endpoint={getEndpointForRuntime(runtime)}
      authentication={getAuthForRuntime(runtime)}
      autoConnect
      debug
    >
      <RuntimeDemo runtime={runtime} />
    </AgentUI>
  )
}
```

### A2A Protocol Integration
```tsx
// A2A-specific features
<AgentUI runtime="a2a" endpoint="https://a2a-registry.example.com">
  {/* Agent Discovery */}
  <Block.Protocol
    protocol={{
      type: 'A2A',
      version: '1.0.0',
      features: ['discovery', 'negotiation', 'streaming']
    }}
  />
  
  {/* Agent Selection */}
  <Input.Selection
    request={agentSelectionRequest}
    multiSelect
    onSelect={handleAgentSelection}
  />
  
  {/* Discovery Results */}
  <Artifact
    artifact={discoveryResults}
    onDownload={handleDownload}
  />
</AgentUI>
```

### AgentArea Custom Protocol
```tsx
// Custom protocol features
<AgentUI runtime="agentarea" endpoint="wss://custom.example.com">
  {/* Batch Configuration */}
  <Input.Form
    schema={{
      fields: [
        { name: 'batchSize', type: 'number', required: true },
        { name: 'priority', type: 'select', options: priorityOptions }
      ]
    }}
    onSubmit={handleBatchConfig}
  />
  
  {/* Processing Status */}
  <Block.Status
    status={{
      type: 'task',
      state: 'working',
      metrics: { processed: 150, errors: 2 }
    }}
    showMetrics
    realTime
  />
</AgentUI>
```

### Runtime Switching
```tsx
function RuntimeSelector({ onRuntimeChange }) {
  const runtimes = [
    { id: 'a2a', name: 'A2A Protocol', features: [...] },
    { id: 'agentarea', name: 'Custom Protocol', features: [...] }
  ]
  
  return (
    <div className="runtime-selector">
      {runtimes.map(runtime => (
        <RuntimeCard
          key={runtime.id}
          runtime={runtime}
          onClick={() => onRuntimeChange(runtime.id)}
        />
      ))}
    </div>
  )
}
```

## Protocol Comparison

### A2A Protocol
- ✅ Standardized agent discovery
- ✅ Automatic capability negotiation  
- ✅ Protocol compliance validation
- ✅ Cross-platform interoperability
- ✅ Built-in security and authentication
- ✅ Real-time bidirectional communication

### AgentArea Custom Protocol
- ✅ Flexible authentication methods
- ✅ Batch task submission and processing
- ✅ Advanced task analytics and metrics
- ✅ Template-based workflow automation
- ✅ Intelligent task scheduling
- ✅ Custom protocol extensions

## Component Architecture

```
App
├── RuntimeSelector          # Protocol selection UI
├── ConnectionStatus         # Connection state display
├── ProtocolComparison      # Feature comparison
└── AgentUI                 # Main SDK wrapper
    ├── RuntimeDemo         # Protocol-specific demos
    │   ├── Block.Protocol  # Protocol information
    │   ├── Block.Status    # Connection status
    │   ├── Task Examples   # Active task display
    │   └── Artifacts       # Generated artifacts
    ├── Communication       # Protocol messages
    │   └── Block.Message   # Message display
    ├── Input Collection    # Runtime-specific inputs
    │   ├── Input.Selection # A2A agent selection
    │   └── Input.Form      # Custom batch config
    └── AgentUI.Debug       # Development tools
```

## Environment Support

### Vite Integration
- ⚡ Lightning-fast HMR
- 📦 Optimized bundling
- 🔧 TypeScript support
- 🎯 Tree-shaking enabled

### Browser Compatibility
- 🌐 Modern browsers (ES2018+)
- 📱 Mobile responsive design
- 🔌 WebSocket support detection
- 📁 File API availability check

## Development Features

### Debug Tools
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
- Bundle size optimization
- Runtime performance metrics
- Memory usage tracking
- Connection latency monitoring

## Customization

### Styling
The example uses CSS custom properties for theming:

```css
:root {
  --runtime-card-bg: #1a1a1a;
  --runtime-card-border: #333;
  --runtime-card-active: #2a2a3a;
  --connection-success: #4ade80;
  --connection-error: #f87171;
  --connection-warning: #fbbf24;
}
```

### Runtime Configuration
```tsx
const runtimeConfigs = {
  a2a: {
    endpoint: 'https://a2a-demo.example.com',
    authentication: { type: 'oauth2', clientId: 'demo-client' },
    features: ['discovery', 'negotiation', 'streaming']
  },
  agentarea: {
    endpoint: 'wss://agentarea-demo.example.com',
    authentication: { type: 'bearer', token: 'demo-token' },
    features: ['batch', 'analytics', 'templates', 'scheduling']
  }
}
```

## Best Practices

### Runtime Management
- Use environment variables for endpoints
- Implement proper authentication handling
- Add connection retry logic with exponential backoff
- Monitor connection health and automatically reconnect

### Component Usage
- Wrap components in error boundaries
- Use Suspense for dynamic imports
- Implement loading states for better UX
- Handle offline scenarios gracefully

### Performance Optimization
- Lazy load protocol-specific components
- Use React.memo for expensive renders
- Implement virtual scrolling for large lists
- Cache artifacts and metadata locally

## Troubleshooting

### Common Issues

**Runtime not connecting**
- Check endpoint URL and authentication
- Verify network connectivity
- Check browser console for errors
- Enable debug mode for detailed logs

**Components not rendering**
- Ensure proper imports from @agentarea/react
- Check for TypeScript errors
- Verify component props match expected types
- Use error boundaries to isolate issues

**Performance issues**
- Enable React DevTools Profiler
- Check for unnecessary re-renders
- Optimize large artifact rendering
- Use pagination for large datasets

### Debug Mode
Enable comprehensive debugging:

```tsx
<AgentUI debug devTools>
  {/* Your components */}
</AgentUI>
```

This provides:
- Detailed console logging
- Runtime state inspection
- Connection monitoring
- Performance metrics
- Error tracking

## Contributing

This example is part of the AgentArea UI SDK monorepo. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This example is licensed under the same terms as the AgentArea UI SDK.