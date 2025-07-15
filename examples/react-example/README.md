# React Example - AgentArea UI SDK

A complete React application demonstrating the AgentArea UI SDK capabilities.

## Features

- **Agent Configuration**: Dynamic endpoint and authentication setup
- **Task Management**: Create, submit, and track agent tasks  
- **Real-time Updates**: Live progress tracking and streaming support
- **Agent Information**: Display agent capabilities, features, and status
- **Error Handling**: Graceful handling of connection and task errors

## Getting Started

1. **Build the SDK** (from repository root):
   ```bash
   pnpm build
   ```

2. **Install dependencies**:
   ```bash
   cd examples/react-example
   pnpm install
   ```

3. **Start development server**:
   ```bash
   pnpm dev
   ```

4. **Open in browser**: http://localhost:3000

## Usage

### Configure Agent Connection

1. Set the agent endpoint (default: http://localhost:9999)
2. Optionally provide a bearer token for authentication
3. The app will attempt to connect and display agent information

### Create Tasks

1. Enter a task description in the text area
2. Press Ctrl/Cmd + Enter or click "Send Task"
3. Watch real-time progress and results

### View Agent Capabilities

When connected, the app displays:
- Agent name and description
- Connection status
- Supported features (streaming, push notifications)
- Available capabilities with input/output types

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

## Built With

- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [AgentArea UI SDK](../../README.md) - Agent communication components