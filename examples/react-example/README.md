# React Example - Comprehensive Component Showcase

This example demonstrates the full capabilities of the AgentArea UI SDK in a React application with Vite, showcasing all new components and features.

## Features Demonstrated

### 🎨 New Component Families
- **Artifact Display**: Rich rendering for code, data, files, images, and text
- **Input Collection**: Dynamic forms, approvals, selections, and file uploads  
- **Communication Blocks**: Protocol messages, status updates, and metadata
- **Enhanced Task Management**: Input requests and artifact integration

### 🔄 AgentUI Entry Point
- **Main Component**: Unified entry point with runtime configuration
- **Compound Pattern**: AgentUI.Provider, AgentUI.Connection, AgentUI.Debug
- **Multi-Runtime Support**: A2A protocol and AgentArea custom protocol
- **Environment Detection**: Automatic Vite/React environment adaptation

### ⚡ Advanced Features
- **Real-time Updates**: WebSocket-based live communication
- **Error Boundaries**: Component-level error handling and recovery
- **Debug Tools**: Comprehensive development and debugging features
- **Performance Optimization**: Code splitting and lazy loading

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation
```bash
# From repository root, build the SDK
pnpm build

# Install example dependencies
cd examples/react-example
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Component Showcase

### AgentUI Entry Point
```tsx
import { AgentUI } from '@agentarea/react'

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

### Artifact Display Components
```tsx
// Auto-detecting artifact component
<Artifact 
  artifact={artifact}
  onDownload={handleDownload}
  onShare={handleShare}
/>

// Specific artifact types
<Artifact.Code artifact={codeArtifact} />
<Artifact.Data artifact={dataArtifact} />
<Artifact.File artifact={fileArtifact} />
<Artifact.Image artifact={imageArtifact} />
```

### Input Collection Components
```tsx
// Approval input
<Input.Approval
  request={approvalRequest}
  onApprove={(value, reason) => handleApproval(true, value, reason)}
  onReject={(reason) => handleApproval(false, null, reason)}
  showContext
/>

// Multi-select input
<Input.Selection
  request={selectionRequest}
  multiSelect
  searchable
  onSelect={handleSelection}
/>

// File upload with progress
<Input.Upload
  accept=".pdf,.doc,.docx"
  maxSize={5 * 1024 * 1024}
  onUpload={handleFileUpload}
  onProgress={handleProgress}
  dragAndDrop
/>

// Dynamic form generation
<Input.Form
  schema={formSchema}
  onSubmit={handleFormSubmit}
  onValidate={handleValidation}
/>
```

### Communication Block Components
```tsx
// Protocol message display
<Block.Message
  message={protocolMessage}
  showMetadata
  showRouting
  expandable
  correlatedMessage={relatedMessage}
/>

// Protocol information
<Block.Protocol
  protocol={{
    type: 'A2A',
    version: '1.0.0',
    features: ['streaming', 'file-transfer'],
    compliance: { level: 'full' }
  }}
/>

// Real-time status
<Block.Status
  status={{
    type: 'agent',
    state: 'working',
    metrics: { latency: 45, uptime: 7200 }
  }}
  realTime
/>

// Technical metadata
<Block.Metadata
  metadata={executionMetadata}
  expandable
  defaultExpanded={false}
/>
```

### Enhanced Task Components
```tsx
// Task with input requests and artifacts
<Task.Root taskId="task-123">
  <Task.Status />
  <Task.Progress />
  <Task.InputRequest 
    requests={inputRequests}
    onResponse={handleInputResponse}
  />
  <Task.Artifacts 
    artifacts={artifacts}
    onDownload={handleDownload}
  />
  <Task.Chat />
</Task.Root>

// Chat with structured input
<Chat.Root taskId="task-123">
  <Chat.Message message={message} />
  <Chat.InputForm
    schema={formSchema}
    onSubmit={handleFormSubmit}
  />
</Chat.Root>
```

## Demo Sections

The example includes five comprehensive demo sections:

### 1. Overview
- AgentUI entry point usage examples
- Compound component patterns
- Feature overview with interactive cards
- Code examples for different usage patterns

### 2. Artifacts
- Interactive artifact display for different types
- Code syntax highlighting with copy functionality
- Data visualization with JSON tree view
- File preview and download capabilities
- Image display with metadata

### 3. Input Collection
- Approval workflows with context display
- Multi-select with search and filtering
- File upload with drag-and-drop
- Dynamic form generation with validation
- Real-time response preview

### 4. Communication
- Protocol message threading and correlation
- Real-time status updates with metrics
- Protocol compliance information
- Expandable technical metadata
- Message routing visualization

### 5. Task Management
- Enhanced task components with input handling
- Artifact integration and management
- Chat interface with structured inputs
- Real-time progress tracking
- Error handling and recovery

## Configuration Options

### Runtime Configuration
```tsx
const config = {
  // Development settings
  development: {
    debug: true,
    devTools: true,
    mockData: true
  },
  
  // Runtime-specific settings
  a2a: {
    endpoint: 'https://a2a-api.example.com',
    authentication: { type: 'oauth2', clientId: 'client-id' }
  },
  
  agentarea: {
    endpoint: 'wss://agentarea.example.com',
    authentication: { type: 'bearer', token: 'bearer-token' }
  }
}
```

### Theme Customization
```tsx
<AgentUI theme="dark" className="custom-theme">
  {/* Components inherit theme */}
</AgentUI>
```

## Development Features

### Debug Tools
The example includes comprehensive debugging:
- Environment detection and display
- Runtime state inspection
- Connection monitoring
- Configuration validation
- Performance metrics

### Error Handling
- Component-level error boundaries
- Graceful degradation for unsupported features
- Retry mechanisms with exponential backoff
- Clear error messaging with actionable guidance

### Performance Optimization
- Code splitting for different component families
- Lazy loading of specialized renderers
- Tree-shaking for optimal bundle size
- Memory usage monitoring

## Browser Support

- Modern browsers (ES2018+)
- WebSocket support for real-time features
- File API for upload functionality
- Responsive design for mobile devices

## Customization

### Styling
The example uses CSS custom properties for easy theming:

```css
:root {
  --primary-color: #007bff;
  --success-color: #28a745;
  --warning-color: #ffc107;
  --danger-color: #dc3545;
  --background-color: #f8f9fa;
  --text-color: #333;
}
```

### Component Overrides
```tsx
// Custom artifact renderer
<Artifact.Container artifact={artifact}>
  <CustomRenderer data={artifact.content} />
</Artifact.Container>

// Custom input component
<Input.Form
  schema={schema}
  renderField={(field) => <CustomField {...field} />}
/>
```

## Mock Agent Server

For testing, you can create a simple mock A2A agent server:

```javascript
// mock-agent.js
const express = require('express')
const app = express()
app.use(express.json())

// Agent Card endpoint
app.get('/.well-known/agent.json', (req, res) => {
  res.json({
    name: "Test Agent",
    description: "A test agent for development",
    capabilities: [
      {
        name: "Echo",
        description: "Echoes back the input",
        inputTypes: ["text"],
        outputTypes: ["text"]
      }
    ],
    streaming: true
  })
})

// JSON-RPC endpoint
app.post('/', (req, res) => {
  const { method, params, id } = req.body
  
  if (method === 'message/send') {
    res.json({
      jsonrpc: "2.0",
      result: {
        id: "task-123",
        status: "completed",
        artifacts: [{
          type: "text",
          content: `Echo: ${params.message.parts[0].content}`
        }]
      },
      id
    })
  }
})

app.listen(9999, () => {
  console.log('Mock agent running on http://localhost:9999')
})
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

## Troubleshooting

### Common Issues

**Components not rendering**
- Check imports from @agentarea/react
- Verify TypeScript types match
- Use error boundaries to isolate issues

**Runtime connection issues**
- Verify endpoint URL and authentication
- Check network connectivity
- Enable debug mode for detailed logs

**Performance problems**
- Use React DevTools Profiler
- Check for unnecessary re-renders
- Optimize large artifact rendering

### Debug Mode
Enable comprehensive debugging:
```tsx
<AgentUI debug devTools>
  {/* Detailed logging and state inspection */}
</AgentUI>
```

## Next Steps

- Explore the [Next.js example](../react-nextjs-example) for SSR integration
- Check the [Multi-Runtime example](../multi-runtime-example) for protocol switching
- Review the [Storybook stories](../../stories) for component documentation
- Read the [API documentation](../../packages/react/README.md) for detailed usage

## Built With

- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [AgentArea UI SDK](../../README.md) - Agent communication components

## Contributing

This example is part of the AgentArea UI SDK. To contribute:
1. Fork the repository
2. Create a feature branch  
3. Make your changes
4. Add tests if applicable
5. Submit a pull request