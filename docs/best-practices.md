# Best Practices - AgentArea UI SDK

This guide provides recommended patterns, practices, and architectural guidance for building production-ready applications with the AgentArea UI SDK.

## Table of Contents

- [Architecture Patterns](#architecture-patterns)
- [Component Usage](#component-usage)
- [Multi-Runtime Management](#multi-runtime-management)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)
- [Accessibility](#accessibility)
- [Testing Strategies](#testing-strategies)
- [Production Deployment](#production-deployment)

## Architecture Patterns

### Component Composition

**✅ Recommended: Compound Component Pattern**
```tsx
// Use compound components for flexibility
<AgentUI runtime="a2a" endpoint="https://api.example.com">
  <AgentUI.Connection showStatus showLatency />
  
  <Task.Root taskId="task-123">
    <Task.Status />
    <Task.Progress />
    <Task.InputRequest onResponse={handleInput} />
    <Task.Artifacts onDownload={handleDownload} />
  </Task.Root>
  
  <AgentUI.Debug showEnvironment />
</AgentUI>
```

**❌ Avoid: Monolithic Components**
```tsx
// Don't create large, inflexible components
<MegaAgentComponent 
  showEverything={true}
  handleAllEvents={handleEverything}
  // Too many props, hard to maintain
/>
```

### State Management

**✅ Recommended: Context + Hooks Pattern**
```tsx
// Use provided hooks for state management
function TaskManager() {
  const { task, inputRequests, respondToInput } = useTask('task-123')
  const { artifacts, downloadArtifact } = useArtifacts('task-123')
  const { connection, status } = useAgentConnection()
  
  // Local state for UI-specific concerns
  const [selectedArtifact, setSelectedArtifact] = useState(null)
  
  return (
    <div>
      <TaskStatus task={task} />
      <ArtifactList 
        artifacts={artifacts}
        onSelect={setSelectedArtifact}
        onDownload={downloadArtifact}
      />
    </div>
  )
}
```

## Component Usage

### Error Boundaries

**✅ Recommended: Granular Error Boundaries**
```tsx
function TaskDashboard() {
  return (
    <div>
      <TaskErrorBoundary fallback={<TaskErrorFallback />}>
        <Task.Root taskId="task-123" />
      </TaskErrorBoundary>
      
      <ArtifactErrorBoundary fallback={<ArtifactErrorFallback />}>
        <Artifact.List artifacts={artifacts} />
      </ArtifactErrorBoundary>
      
      <InputErrorBoundary fallback={<InputErrorFallback />}>
        <Input.Form schema={formSchema} />
      </InputErrorBoundary>
    </div>
  )
}
```

### Loading States

**✅ Recommended: Skeleton Components**
```tsx
function TaskSkeleton() {
  return (
    <div className="task-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-title" />
        <div className="skeleton-status" />
      </div>
      <div className="skeleton-content">
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
    </div>
  )
}

// Usage with Suspense
<Suspense fallback={<TaskSkeleton />}>
  <Task.Root taskId="task-123" />
</Suspense>
```

## Multi-Runtime Management

### Runtime Selection Strategy

**✅ Recommended: Environment-Based Selection**
```tsx
function useRuntimeSelection() {
  const environment = useRuntimeEnvironment()
  
  return useMemo(() => {
    // Production: Use A2A for standardization
    if (process.env.NODE_ENV === 'production') {
      return {
        runtime: 'a2a' as const,
        endpoint: process.env.REACT_APP_A2A_ENDPOINT,
        authentication: {
          type: 'oauth2' as const,
          clientId: process.env.REACT_APP_A2A_CLIENT_ID
        }
      }
    }
    
    // Development: Use AgentArea for enhanced features
    return {
      runtime: 'agentarea' as const,
      endpoint: process.env.REACT_APP_AGENTAREA_ENDPOINT,
      authentication: {
        type: 'bearer' as const,
        token: process.env.REACT_APP_AGENTAREA_TOKEN
      }
    }
  }, [environment])
}
```

### Protocol Compatibility

**✅ Recommended: Feature Detection**
```tsx
function useProtocolFeatures(runtime: AgentRuntime) {
  const [features, setFeatures] = useState<string[]>([])
  
  useEffect(() => {
    const detectFeatures = async () => {
      try {
        const supportedFeatures = await runtime.getSupportedCapabilities()
        setFeatures(supportedFeatures)
      } catch (error) {
        console.warn('Feature detection failed:', error)
        setFeatures([]) // Fallback to basic features
      }
    }
    
    detectFeatures()
  }, [runtime])
  
  return {
    features,
    supports: (feature: string) => features.includes(feature),
    supportsStreaming: features.includes('streaming'),
    supportsBatchProcessing: features.includes('batch-processing'),
    supportsFileUpload: features.includes('file-upload')
  }
}
```

## Performance Optimization

### Component Optimization

**✅ Recommended: Memoization Strategies**
```tsx
// Memoize expensive components
const ExpensiveArtifactRenderer = React.memo(({ artifact }: { artifact: EnhancedArtifact }) => {
  const processedContent = useMemo(() => {
    return processArtifactContent(artifact.content)
  }, [artifact.content])
  
  return <div>{processedContent}</div>
})

// Memoize callback functions
function TaskManager({ taskId }: { taskId: string }) {
  const { task, respondToInput } = useTask(taskId)
  
  const handleInputResponse = useCallback((requestId: string, response: InputResponse) => {
    respondToInput(requestId, response)
  }, [respondToInput])
  
  return (
    <Task.InputRequest 
      requests={task.inputRequests}
      onResponse={handleInputResponse}
    />
  )
}
```

### Bundle Optimization

**✅ Recommended: Code Splitting**
```tsx
// Split heavy components
const HeavyArtifactRenderer = lazy(() => 
  import('./HeavyArtifactRenderer').then(module => ({
    default: module.HeavyArtifactRenderer
  }))
)

// Split by feature
const AdvancedInputForms = lazy(() => import('./AdvancedInputForms'))
const RealtimeChat = lazy(() => import('./RealtimeChat'))

function FeatureBasedSplitting() {
  const { supports } = useProtocolFeatures()
  
  return (
    <div>
      <Task.Basic />
      
      <Suspense fallback={<div>Loading advanced features...</div>}>
        {supports('advanced-inputs') && <AdvancedInputForms />}
        {supports('realtime-chat') && <RealtimeChat />}
      </Suspense>
    </div>
  )
}
```

## Error Handling

### Comprehensive Error Strategy

**✅ Recommended: Layered Error Handling**
```tsx
// Global error boundary
function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<GlobalErrorFallback />}
      onError={(error, errorInfo) => {
        // Send to error reporting service
        reportError(error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Feature-specific error boundaries
function TaskFeatureErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<TaskErrorFallback />}
      onError={(error, errorInfo) => {
        console.error('Task feature error:', error)
        // Feature-specific error handling
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
```

### Network Error Handling

**✅ Recommended: Retry with Exponential Backoff**
```tsx
function useRetryableRequest<T>(
  requestFn: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
  } = {}
) {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options
  
  const executeWithRetry = useCallback(async (): Promise<T> => {
    let lastError: Error
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries) {
          throw lastError
        }
        
        // Exponential backoff with jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          maxDelay
        )
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError!
  }, [requestFn, maxRetries, baseDelay, maxDelay])
  
  return executeWithRetry
}
```

## Security Considerations

### Authentication and Authorization

**✅ Recommended: Secure Token Management**
```tsx
function useSecureAuthentication() {
  const [token, setToken] = useState<string | null>(null)
  
  // Store tokens securely
  const storeToken = useCallback((newToken: string) => {
    // Use secure storage (not localStorage for sensitive tokens)
    sessionStorage.setItem('agent_token', newToken)
    setToken(newToken)
  }, [])
  
  const clearToken = useCallback(() => {
    sessionStorage.removeItem('agent_token')
    setToken(null)
  }, [])
  
  return { token, storeToken, clearToken }
}
```

### Input Sanitization

**✅ Recommended: Sanitize User Input**
```tsx
function sanitizeUserInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

function SecureInputForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const handleSubmit = (data: Record<string, unknown>) => {
    // Sanitize all string inputs
    const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = sanitizeUserInput(value)
      } else {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, unknown>)
    
    onSubmit(sanitizedData)
  }
  
  return (
    <Input.Form
      schema={formSchema}
      onSubmit={handleSubmit}
      onValidate={validateInput}
    />
  )
}
```

## Accessibility

**✅ Recommended: Semantic HTML and ARIA**
```tsx
function AccessibleTaskList({ tasks }: { tasks: Task[] }) {
  return (
    <section aria-labelledby="tasks-heading">
      <h2 id="tasks-heading">Active Tasks</h2>
      
      <ul role="list" aria-label="Task list">
        {tasks.map(task => (
          <li key={task.id} role="listitem">
            <article aria-labelledby={`task-${task.id}-title`}>
              <h3 id={`task-${task.id}-title`}>{task.title}</h3>
              
              <div 
                role="status" 
                aria-live="polite"
                aria-label={`Task status: ${task.status}`}
              >
                <Task.Status task={task} />
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

## Testing Strategies

### Component Testing

**✅ Recommended: Comprehensive Test Coverage**
```tsx
describe('Task Component', () => {
  const mockTask = {
    id: 'task-123',
    title: 'Test Task',
    status: 'working' as const,
    progress: 0.5
  }
  
  it('renders task information correctly', () => {
    render(
      <AgentUI runtime="a2a" endpoint="http://localhost:9999">
        <Task.Root taskId="task-123" />
      </AgentUI>
    )
    
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('Working')).toBeInTheDocument()
  })
  
  it('handles input responses correctly', async () => {
    const mockResponseHandler = jest.fn()
    
    render(
      <AgentUI runtime="a2a" endpoint="http://localhost:9999">
        <Task.InputRequest 
          requests={mockInputRequests}
          onResponse={mockResponseHandler}
        />
      </AgentUI>
    )
    
    fireEvent.click(screen.getByText('Approve'))
    
    await waitFor(() => {
      expect(mockResponseHandler).toHaveBeenCalledWith(
        'request-1',
        { approved: true }
      )
    })
  })
})
```

## Production Deployment

### Environment Configuration

**✅ Recommended: Environment-Specific Configs**
```typescript
interface EnvironmentConfig {
  agentEndpoint: string
  authentication: AuthConfig
  features: {
    debug: boolean
    analytics: boolean
    errorReporting: boolean
  }
}

const environments: Record<string, EnvironmentConfig> = {
  development: {
    agentEndpoint: 'http://localhost:9999',
    authentication: { type: 'bearer', token: 'dev-token' },
    features: {
      debug: true,
      analytics: false,
      errorReporting: false
    }
  },
  
  production: {
    agentEndpoint: 'https://api.example.com',
    authentication: { type: 'oauth2', clientId: 'prod-client' },
    features: {
      debug: false,
      analytics: true,
      errorReporting: true
    }
  }
}

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = process.env.NODE_ENV || 'development'
  return environments[env] || environments.development
}
```

This guide provides the foundation for building robust, scalable, and maintainable applications with the AgentArea UI SDK. Remember to adapt these patterns to your specific use case and requirements.