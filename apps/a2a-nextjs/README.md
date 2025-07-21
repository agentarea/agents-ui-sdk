# AgentArea UI SDK - A2A Next.js Demo

This is a comprehensive demonstration of the AgentArea UI SDK components running with Agent-to-Agent (A2A) protocol support in a Next.js application.

## Features Demonstrated

### Core Components
- **AgentUI Provider**: Main wrapper providing A2A runtime and configuration
- **Task Management**: Task creation, status tracking, progress monitoring
- **Chat Interface**: Real-time messaging with artifact support
- **Artifact Display**: Code, data, and file artifacts with actions
- **Debug Tools**: Runtime environment and connection monitoring

### A2A Protocol Features
- WebSocket connection management
- Real-time task updates
- Agent communication patterns
- Protocol-agnostic runtime system

## Demo Sections

### 1. Connection Management
- **Endpoint Configuration**: Set custom A2A WebSocket endpoints
- **Connection Controls**: Connect/disconnect functionality
- **Status Monitoring**: Visual connection state indicators

### 2. Task Creation & Management
- **Task Input**: Rich text area for task descriptions
- **Send Task**: Create and submit tasks to agents
- **Status Tracking**: Real-time task status updates
- **Progress Monitoring**: Visual progress indicators
- **Task Actions**: Cancel, retry, and manage tasks

### 3. Agent Communication
- **Chat Interface**: Bi-directional messaging with agents
- **Message History**: Scrollable conversation view
- **Streaming Support**: Real-time message updates
- **Artifact Integration**: Inline artifact display in messages

### 4. Artifact Management
- **Code Artifacts**: Syntax-highlighted code display
- **Data Artifacts**: JSON/structured data visualization
- **File Artifacts**: Document and media file handling
- **Artifact Actions**: Download, share, and preview capabilities

### 5. Debug & Monitoring
- **Environment Info**: Runtime environment detection
- **Connection Monitor**: Active connection tracking
- **Performance Metrics**: Latency and status monitoring
- **Development Tools**: Debug panel for troubleshooting

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- AgentArea UI SDK packages (workspace dependencies)

### Installation & Setup
```bash
# Install dependencies (from project root)
pnpm install

# Build the required packages
pnpm build

# Start the demo
cd apps/a2a-nextjs
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Configuration
1. **A2A Endpoint**: Configure your Agent-to-Agent WebSocket endpoint
2. **Authentication**: Set up authentication credentials if required
3. **Debug Mode**: Enable debug tools for development

## Usage Examples

### Basic Task Creation
```tsx
import { AgentUI, Task } from "@agentarea/react";

function TaskDemo() {
  return (
    <AgentUI runtime="a2a" endpoint="wss://your-a2a-endpoint">
      <Task.Input placeholder="Describe your task..." />
      <Task.Send>Create Task</Task.Send>
    </AgentUI>
  );
}
```

### Chat with Artifacts
```tsx
import { AgentUI, Chat, Artifact } from "@agentarea/react";

function ChatDemo() {
  return (
    <AgentUI runtime="a2a" endpoint="wss://your-a2a-endpoint">
      <Chat.Root>
        <Chat.Message role="agent" artifacts={artifacts}>
          <Chat.Content>Here's your analysis result.</Chat.Content>
        </Chat.Message>
      </Chat.Root>
      <Chat.Input onSend={handleSend} />
    </AgentUI>
  );
}
```

### Connection Monitoring
```tsx
import { AgentUI } from "@agentarea/react";

function MonitorDemo() {
  return (
    <AgentUI runtime="a2a" debug={true}>
      <AgentUI.Connection showStatus showLatency showActions />
      <AgentUI.Debug showEnvironment showRuntime showConnections />
    </AgentUI>
  );
}
```

## Development

### Project Structure
```
apps/a2a-nextjs/
├── src/
│   └── app/
│       ├── page.tsx          # Main demo page
│       ├── layout.tsx        # App layout
│       └── globals.css       # Global styles
├── package.json              # Dependencies
└── README.md                 # This file
```

### Key Dependencies
- `@agentarea/core`: Protocol-agnostic runtime
- `@agentarea/react`: React UI components
- `next`: Next.js framework
- `tailwindcss`: Styling

### Available Scripts
- `pnpm dev`: Start development server
- `pnpm build`: Build for production
- `pnpm start`: Start production server
- `pnpm lint`: Run ESLint

## Architecture

### Component Hierarchy
```
AgentUI (Provider)
├── Task Components
│   ├── Task.Input
│   ├── Task.Send
│   ├── Task.Status
│   └── Task.Progress
├── Chat Components
│   ├── Chat.Root
│   ├── Chat.Message
│   ├── Chat.Content
│   └── Chat.Input
├── Artifact Components
│   ├── Artifact.Container
│   ├── Artifact.Code
│   └── Artifact.Data
└── Debug Components
    ├── AgentUI.Connection
    └── AgentUI.Debug
```

### Runtime System
- **A2A Runtime**: Handles Agent-to-Agent protocol communication
- **Connection Management**: WebSocket connection lifecycle
- **Task Management**: Task creation, tracking, and updates
- **Real-time Updates**: Live data synchronization

## Customization

### Styling
The demo uses Tailwind CSS for styling. Customize by:
- Modifying `globals.css` for global styles
- Adding custom component classes
- Using Tailwind utilities for quick styling

### Protocol Configuration
Configure A2A protocol settings:
```tsx
<AgentUI
  runtime="a2a"
  endpoint="wss://your-endpoint"
  authentication={{ type: "bearer", token: "your-token" }}
  autoConnect={true}
  reconnectAttempts={3}
/>
```

### Theme Support
The demo supports light/dark themes:
```tsx
<AgentUI theme="dark" /> // 'light' | 'dark' | 'system'
```

## Troubleshooting

### Common Issues
1. **Connection Failed**: Check endpoint URL and network connectivity
2. **Components Not Rendering**: Ensure packages are built and imported correctly
3. **WebSocket Errors**: Verify A2A endpoint supports required protocols

### Debug Tools
- Enable debug mode: `<AgentUI debug={true} />`
- Use browser dev tools for network monitoring
- Check console for runtime errors and warnings

## Next Steps

This demo provides a foundation for building A2A-enabled applications. Consider:
- Adding real agent endpoints
- Implementing authentication flows
- Creating custom artifact types
- Building specialized task templates
- Adding persistent storage
- Implementing error handling strategies

## Support

For issues, feature requests, or questions:
- Check the main project documentation
- Review component source code in `packages/react/src/`
- Open issues in the project repository
