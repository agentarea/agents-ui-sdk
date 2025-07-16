# AgentArea UI SDK

**The React UI library that makes agent integration effortless.**

Stop wrestling with WebSocket connections, protocol differences, and complex state management. AgentArea UI SDK provides everything you need to build beautiful, responsive agent interfaces in minutes, not months.

## Why AgentArea UI SDK?

### 🚀 **Ship Agent UIs 10x Faster**
```tsx
// Before: 500+ lines of WebSocket boilerplate
// After: 5 lines to get started
const runtime = createA2ARuntime({ endpoint: 'http://localhost:9999' })
return (
  <AgentProvider runtime={runtime}>
    <TaskPrimitive.Root>
      <TaskPrimitive.Input onSubmit={handleTask} />
      <TaskPrimitive.Output />
    </TaskPrimitive.Root>
  </AgentProvider>
)
```


## License

MIT © 2025 AgentArea Team - see [LICENSE](LICENSE) file for details.

**Built with ❤️ by the AgentArea team**
