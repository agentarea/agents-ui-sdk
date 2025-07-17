# Troubleshooting Guide - AgentArea UI SDK

This guide helps you resolve common issues when integrating and using the AgentArea UI SDK.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Import and Module Issues](#import-and-module-issues)
- [Runtime Connection Issues](#runtime-connection-issues)
- [Component Rendering Issues](#component-rendering-issues)
- [SSR and Next.js Issues](#ssr-and-nextjs-issues)
- [TypeScript Issues](#typescript-issues)
- [Performance Issues](#performance-issues)
- [Error Handling Issues](#error-handling-issues)
- [Build and Bundle Issues](#build-and-bundle-issues)
- [Development and Debug Issues](#development-and-debug-issues)

## Installation Issues

### Issue: Package Not Found
**Error:** `npm ERR! 404 Not Found - GET https://registry.npmjs.org/@agentarea/react`

**Cause:** Package not published or incorrect package name

**Solutions:**
```bash
# Ensure you're using the correct package names
npm install @agentarea/core @agentarea/react

# If using local development, use file references
npm install file:../../packages/core file:../../packages/react

# Check package registry
npm config get registry

# Clear npm cache if needed
npm cache clean --force
```

### Issue: Peer Dependency Conflicts
**Error:** `ERESOLVE unable to resolve dependency tree`

**Cause:** React version conflicts or missing peer dependencies

**Solutions:**
```bash
# Check peer dependencies
npm ls --depth=0

# Install missing peer dependencies
npm install react@^19.0.0 react-dom@^19.0.0

# Use --legacy-peer-deps if needed (not recommended)
npm install --legacy-peer-deps

# Or use --force (use with caution)
npm install --force
```

### Issue: pnpm Workspace Issues
**Error:** `Cannot resolve workspace protocol`

**Cause:** Workspace configuration issues

**Solutions:**
```yaml
# Ensure pnpm-workspace.yaml is correct
packages:
  - 'packages/*'
  - 'examples/*'

# Install from workspace root
pnpm install

# Build packages in correct order
pnpm build
```

## Import and Module Issues

### Issue: Module Not Found
**Error:** `Module not found: Can't resolve '@agentarea/react'`

**Cause:** Package not installed or incorrect import path

**Solutions:**
```tsx
// Ensure packages are installed
npm install @agentarea/core @agentarea/react

// Check import paths
import { AgentUI } from '@agentarea/react' // Correct
import { AgentUI } from '@agentarea/ui-sdk' // Incorrect (v1.x)

// Verify package.json dependencies
{
  "dependencies": {
    "@agentarea/core": "^2.0.0",
    "@agentarea/react": "^2.0.0"
  }
}
```

### Issue: Named Import Not Found
**Error:** `'AgentUI' is not exported from '@agentarea/react'`

**Cause:** Component not exported or incorrect import name

**Solutions:**
```tsx
// Check available exports
import * as AgentArea from '@agentarea/react'
console.log(Object.keys(AgentArea))

// Use correct import names
import { 
  AgentUI,        // Correct
  Task,           // Correct
  Chat,           // Correct
  Artifact,       // Correct
  Input,          // Correct
  Block           // Correct
} from '@agentarea/react'

// Check if component exists in current version
import { AgentProvider } from '@agentarea/react' // Still available
```

### Issue: TypeScript Module Resolution
**Error:** `Cannot find module '@agentarea/react' or its corresponding type declarations`

**Cause:** TypeScript configuration or missing type definitions

**Solutions:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "strict": true
  }
}

// Ensure types are included
npm install @types/react @types/react-dom
```

## Runtime Connection Issues

### Issue: Connection Failed
**Error:** `Failed to connect to agent endpoint`

**Cause:** Incorrect endpoint, network issues, or authentication problems

**Solutions:**
```tsx
// Verify endpoint URL
<AgentUI 
  runtime="a2a" 
  endpoint="https://your-agent-api.com" // Check URL
  authentication={{ type: 'bearer', token: 'your-token' }}
  debug // Enable debug logging
>

// Check network connectivity
fetch('https://your-agent-api.com/.well-known/agent.json')
  .then(response => console.log('Agent reachable:', response.ok))
  .catch(error => console.error('Connection failed:', error))

// Verify CORS settings on agent server
// Agent server should include:
// Access-Control-Allow-Origin: *
// Access-Control-Allow-Methods: GET, POST, OPTIONS
// Access-Control-Allow-Headers: Content-Type, Authorization
```

### Issue: Authentication Failed
**Error:** `401 Unauthorized` or `403 Forbidden`

**Cause:** Invalid or missing authentication credentials

**Solutions:**
```tsx
// Check authentication configuration
<AgentUI 
  runtime="a2a"
  endpoint="https://your-agent-api.com"
  authentication={{
    type: 'bearer',
    token: process.env.REACT_APP_AGENT_TOKEN // Ensure token is set
  }}
/>

// For OAuth2
<AgentUI 
  runtime="a2a"
  authentication={{
    type: 'oauth2',
    clientId: 'your-client-id',
    scope: 'agent:read agent:write'
  }}
/>

// Debug authentication
const { debug } = useAgentUI()
console.log('Auth config:', debug.authentication)
```

### Issue: WebSocket Connection Failed
**Error:** `WebSocket connection failed` or `Connection closed unexpectedly`

**Cause:** WebSocket not supported, proxy issues, or server configuration

**Solutions:**
```tsx
// Check WebSocket support
const environment = useRuntimeEnvironment()
if (!environment.supportsWebSockets) {
  console.warn('WebSocket not supported, falling back to polling')
}

// Use secure WebSocket for HTTPS sites
<AgentUI 
  runtime="agentarea"
  endpoint="wss://your-agent-api.com" // Use wss:// not ws://
/>

// Handle connection errors
<AgentUI 
  runtime="agentarea"
  endpoint="wss://your-agent-api.com"
  reconnectAttempts={5}
  onConnectionError={(error) => {
    console.error('Connection error:', error)
    // Implement fallback logic
  }}
/>
```

## Component Rendering Issues

### Issue: Components Not Rendering
**Error:** Blank screen or components not appearing

**Cause:** Missing providers, incorrect props, or JavaScript errors

**Solutions:**
```tsx
// Ensure AgentUI wrapper is present
<AgentUI runtime="a2a" endpoint="https://api.example.com">
  <Task.Root taskId="task-123" /> {/* Will render */}
</AgentUI>

// Without AgentUI wrapper
<Task.Root taskId="task-123" /> {/* May not render correctly */}

// Check browser console for errors
// Open DevTools -> Console

// Use error boundaries
<TaskErrorBoundary fallback={<div>Task failed to load</div>}>
  <Task.Root taskId="task-123" />
</TaskErrorBoundary>

// Enable debug mode
<AgentUI debug devTools>
  {/* Components will log debug information */}
</AgentUI>
```

### Issue: Artifact Not Displaying
**Error:** Artifact component shows loading or error state

**Cause:** Invalid artifact data or unsupported artifact type

**Solutions:**
```tsx
// Verify artifact data structure
const artifact = {
  id: 'artifact-1',
  displayType: 'code', // Must be valid type
  content: {
    code: {
      language: 'javascript',
      content: 'console.log("Hello World")'
    }
  },
  metadata: {
    filename: 'example.js',
    size: 1024,
    createdAt: new Date()
  },
  downloadable: true,
  shareable: true
}

// Check for required properties
if (!artifact.displayType || !artifact.content) {
  console.error('Invalid artifact data:', artifact)
}

// Use fallback for unsupported types
<Artifact 
  artifact={artifact}
  fallback={<div>Unsupported artifact type</div>}
/>
```

### Issue: Input Components Not Working
**Error:** Input forms not submitting or validation failing

**Cause:** Incorrect schema, missing handlers, or validation errors

**Solutions:**
```tsx
// Verify form schema
const schema = {
  fields: [
    {
      name: 'email',
      type: 'email', // Valid type
      label: 'Email Address',
      required: true,
      validation: [
        { type: 'required', message: 'Email is required' },
        { type: 'pattern', value: /\S+@\S+\.\S+/, message: 'Invalid email' }
      ]
    }
  ]
}

// Ensure handlers are provided
<Input.Form
  schema={schema}
  onSubmit={(data) => {
    console.log('Form submitted:', data)
    // Handle form submission
  }}
  onValidate={(data) => {
    const errors = {}
    if (!data.email) {
      errors.email = 'Email is required'
    }
    return errors
  }}
/>

// Check validation errors
const [errors, setErrors] = useState({})

<Input.Form
  schema={schema}
  onSubmit={handleSubmit}
  onValidate={(data) => {
    const validationErrors = validateData(data)
    setErrors(validationErrors)
    return validationErrors
  }}
/>

{Object.keys(errors).length > 0 && (
  <div>Validation errors: {JSON.stringify(errors)}</div>
)}
```

## SSR and Next.js Issues

### Issue: Hydration Mismatch
**Error:** `Hydration failed because the initial UI does not match what was rendered on the server`

**Cause:** Server and client rendering different content

**Solutions:**
```tsx
// Use useIsClient hook
import { useIsClient } from '@agentarea/react'

function MyComponent() {
  const isClient = useIsClient()
  
  if (!isClient) {
    return <div>Loading...</div> // Consistent server/client
  }
  
  return (
    <AgentUI runtime="a2a" endpoint="https://api.example.com">
      {/* Client-only content */}
    </AgentUI>
  )
}

// Use dynamic imports
import dynamic from 'next/dynamic'

const AgentUIWithRealTime = dynamic(
  () => import('@agentarea/react').then(mod => mod.AgentUI),
  { 
    ssr: false,
    loading: () => <div>Loading agent interface...</div>
  }
)

// Suppress hydration warnings for dynamic content
<div suppressHydrationWarning>
  {typeof window !== 'undefined' && (
    <AgentUI runtime="a2a" endpoint="https://api.example.com">
      {/* Dynamic content */}
    </AgentUI>
  )}
</div>
```

### Issue: WebSocket in SSR
**Error:** `WebSocket is not defined` during server-side rendering

**Cause:** WebSocket API not available on server

**Solutions:**
```tsx
// Check environment before using WebSocket features
const environment = useRuntimeEnvironment()

if (environment.isServer) {
  // Server-side: don't initialize WebSocket
  return <div>Loading...</div>
}

// Client-side: safe to use WebSocket
<AgentUI 
  runtime="agentarea" 
  endpoint="wss://api.example.com"
  autoConnect={environment.isClient}
>

// Use dynamic import for WebSocket-dependent components
const RealtimeComponent = dynamic(
  () => import('./RealtimeComponent'),
  { ssr: false }
)
```

### Issue: Environment Variables in Next.js
**Error:** `process.env.AGENT_ENDPOINT is undefined`

**Cause:** Environment variables not properly configured

**Solutions:**
```bash
# .env.local
NEXT_PUBLIC_AGENT_ENDPOINT=https://your-agent-api.com
NEXT_PUBLIC_DEBUG_MODE=true

# For server-side only (no NEXT_PUBLIC_ prefix)
AGENT_API_KEY=your-secret-key
```

```tsx
// Use in components (client-side)
<AgentUI 
  runtime="a2a"
  endpoint={process.env.NEXT_PUBLIC_AGENT_ENDPOINT}
  debug={process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'}
/>

// Use in API routes (server-side)
// pages/api/agents.js or app/api/agents/route.ts
const apiKey = process.env.AGENT_API_KEY
```

## TypeScript Issues

### Issue: Type Errors
**Error:** `Property 'xyz' does not exist on type`

**Cause:** Incorrect types or missing type definitions

**Solutions:**
```tsx
// Import types explicitly
import type { 
  EnhancedTask, 
  TaskInputRequest, 
  EnhancedArtifact 
} from '@agentarea/core'

// Use proper type annotations
const handleTaskUpdate = (task: EnhancedTask) => {
  console.log('Task updated:', task.id)
}

const handleInputResponse = (requestId: string, response: InputResponse) => {
  console.log('Input response:', requestId, response)
}

// Check component prop types
interface MyComponentProps {
  task: EnhancedTask
  onUpdate: (task: EnhancedTask) => void
}

const MyComponent: React.FC<MyComponentProps> = ({ task, onUpdate }) => {
  return <Task.Root taskId={task.id} />
}
```

### Issue: Generic Type Issues
**Error:** `Type 'unknown' is not assignable to type`

**Cause:** Generic types not properly specified

**Solutions:**
```tsx
// Specify generic types
const { artifacts } = useArtifacts<CodeArtifact>('task-123')

// Use type assertions when necessary
const codeArtifact = artifact as EnhancedArtifact & { 
  displayType: 'code' 
}

// Define custom types
interface CustomTaskData {
  customField: string
  metadata: Record<string, unknown>
}

const { task } = useTask<CustomTaskData>('task-123')
```

### Issue: Module Declaration Issues
**Error:** `Could not find a declaration file for module`

**Cause:** Missing type declarations

**Solutions:**
```typescript
// Create types/index.d.ts
declare module '@agentarea/react' {
  export * from '@agentarea/react/dist/types'
}

// Or add to tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "typeRoots": ["./types", "./node_modules/@types"]
  }
}
```

## Performance Issues

### Issue: Slow Component Rendering
**Cause:** Large datasets, unnecessary re-renders, or heavy computations

**Solutions:**
```tsx
// Use React.memo for expensive components
const ExpensiveArtifact = React.memo(({ artifact }) => {
  return <Artifact artifact={artifact} />
})

// Optimize re-renders with useMemo
const processedArtifacts = useMemo(() => {
  return artifacts.filter(a => a.displayType === 'code')
}, [artifacts])

// Use virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window'

const ArtifactList = ({ artifacts }) => (
  <List
    height={400}
    itemCount={artifacts.length}
    itemSize={100}
    itemData={artifacts}
  >
    {({ index, data }) => (
      <Artifact artifact={data[index]} />
    )}
  </List>
)

// Lazy load heavy components
const HeavyArtifactRenderer = lazy(() => 
  import('./HeavyArtifactRenderer')
)

<Suspense fallback={<div>Loading...</div>}>
  <HeavyArtifactRenderer artifact={artifact} />
</Suspense>
```

### Issue: Large Bundle Size
**Cause:** Importing entire library or unused components

**Solutions:**
```tsx
// Import only what you need
import { AgentUI, Task } from '@agentarea/react'
// Don't: import * as AgentArea from '@agentarea/react'

// Use dynamic imports for optional features
const AdvancedArtifactRenderer = lazy(() => 
  import('@agentarea/react').then(mod => ({ 
    default: mod.Artifact.Advanced 
  }))
)

// Check bundle size
npm run build
npm run analyze # If available

// Use webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer
```

### Issue: Memory Leaks
**Cause:** Unsubscribed event listeners or uncleaned resources

**Solutions:**
```tsx
// Properly cleanup subscriptions
useEffect(() => {
  const subscription = subscribeToTask('task-123', handleUpdate)
  
  return () => {
    subscription.unsubscribe() // Important!
  }
}, [])

// Use AbortController for fetch requests
useEffect(() => {
  const controller = new AbortController()
  
  fetch('/api/tasks', { signal: controller.signal })
    .then(response => response.json())
    .then(data => setTasks(data))
    .catch(error => {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error)
      }
    })
  
  return () => {
    controller.abort()
  }
}, [])

// Monitor memory usage
const { memory } = performance
console.log('Memory usage:', memory?.usedJSHeapSize)
```

## Error Handling Issues

### Issue: Unhandled Errors
**Error:** Components crash without proper error messages

**Cause:** Missing error boundaries or inadequate error handling

**Solutions:**
```tsx
// Use built-in error boundaries
<AgentUI runtime="a2a" endpoint="https://api.example.com">
  {/* Automatic error boundaries */}
  <Task.Root taskId="task-123" />
</AgentUI>

// Custom error boundaries
class CustomErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo)
    // Send to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong</h2>
          <details>
            {this.state.error?.message}
          </details>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      )
    }
    
    return this.props.children
  }
}

// Handle async errors
const handleAsyncError = async () => {
  try {
    await someAsyncOperation()
  } catch (error) {
    console.error('Async error:', error)
    // Show user-friendly error message
    setErrorMessage('Operation failed. Please try again.')
  }
}
```

### Issue: Network Errors
**Error:** Failed to fetch data or connection timeouts

**Cause:** Network issues, server problems, or incorrect configuration

**Solutions:**
```tsx
// Implement retry logic
const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        timeout: 10000 // 10 second timeout
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return response
    } catch (error) {
      if (i === retries - 1) throw error
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      )
    }
  }
}

// Handle offline scenarios
const [isOnline, setIsOnline] = useState(navigator.onLine)

useEffect(() => {
  const handleOnline = () => setIsOnline(true)
  const handleOffline = () => setIsOnline(false)
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}, [])

if (!isOnline) {
  return <div>You are offline. Please check your connection.</div>
}
```

## Build and Bundle Issues

### Issue: Build Failures
**Error:** Build process fails with various errors

**Cause:** Configuration issues, dependency conflicts, or code errors

**Solutions:**
```bash
# Clear caches
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Check for dependency conflicts
npm ls --depth=0

# Update dependencies
npm update

# Check for TypeScript errors
npx tsc --noEmit

# Verbose build output
npm run build --verbose
```

### Issue: Webpack Configuration
**Error:** Module resolution or loader issues

**Cause:** Webpack configuration conflicts

**Solutions:**
```javascript
// webpack.config.js or next.config.js
module.exports = {
  // Resolve AgentArea packages
  resolve: {
    alias: {
      '@agentarea/react': path.resolve(__dirname, 'node_modules/@agentarea/react'),
      '@agentarea/core': path.resolve(__dirname, 'node_modules/@agentarea/core')
    }
  },
  
  // Handle ES modules
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        }
      }
    ]
  },
  
  // Externalize for server builds
  externals: process.env.NODE_ENV === 'production' ? {
    '@agentarea/react': '@agentarea/react',
    '@agentarea/core': '@agentarea/core'
  } : {}
}
```

### Issue: CSS/Styling Issues
**Error:** Styles not loading or conflicting

**Cause:** CSS import issues or Tailwind configuration

**Solutions:**
```css
/* Ensure Tailwind CSS is imported */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Import AgentArea styles if needed */
@import '@agentarea/react/dist/styles.css';
```

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@agentarea/react/**/*.{js,ts,jsx,tsx}' // Include AgentArea components
  ],
  theme: {
    extend: {
      // Custom theme extensions
    }
  },
  plugins: []
}
```

## Development and Debug Issues

### Issue: Debug Mode Not Working
**Error:** Debug information not showing

**Cause:** Debug mode not enabled or console filtering

**Solutions:**
```tsx
// Enable debug mode
<AgentUI debug devTools>
  {/* Components will log debug information */}
</AgentUI>

// Check console filters
// Open DevTools -> Console -> Check "All levels" is selected

// Use debug hook
const { debug, toggleDebug } = useAgentUI()
console.log('Debug enabled:', debug)

// Manual debug logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', { task, artifacts, connections })
}
```

### Issue: Hot Reload Not Working
**Error:** Changes not reflected during development

**Cause:** Development server configuration or file watching issues

**Solutions:**
```bash
# Restart development server
npm run dev

# Clear cache and restart
rm -rf .next # For Next.js
rm -rf dist # For Vite
npm run dev

# Check file watching limits (Linux/Mac)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Issue: Source Maps Not Working
**Error:** Cannot debug original source code

**Cause:** Source map configuration

**Solutions:**
```javascript
// webpack.config.js
module.exports = {
  devtool: 'source-map', // or 'eval-source-map' for development
  
  // For production
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map'
}

// next.config.js
module.exports = {
  productionBrowserSourceMaps: true
}

// vite.config.js
export default {
  build: {
    sourcemap: true
  }
}
```

## Getting Additional Help

### Enable Comprehensive Debugging
```tsx
<AgentUI 
  debug 
  devTools
  onError={(error, errorInfo) => {
    console.error('AgentUI Error:', error, errorInfo)
    // Send to error reporting service
  }}
>
  <AgentUI.Debug 
    showEnvironment 
    showRuntime 
    showConnections 
    showConfig 
  />
  {/* Your components */}
</AgentUI>
```

### Collect Debug Information
When reporting issues, include:

1. **Environment Information:**
   ```bash
   node --version
   npm --version
   npx envinfo --binaries --browsers --npmPackages
   ```

2. **Package Versions:**
   ```bash
   npm ls @agentarea/core @agentarea/react
   ```

3. **Browser Console Output:**
   - Open DevTools -> Console
   - Enable all log levels
   - Reproduce the issue
   - Copy console output

4. **Network Tab Information:**
   - Open DevTools -> Network
   - Reproduce the issue
   - Check for failed requests

5. **Component Debug Output:**
   ```tsx
   <AgentUI debug>
     {/* Enable debug mode for detailed logging */}
   </AgentUI>
   ```

### Community Resources
- **GitHub Issues:** Report bugs with detailed reproduction steps
- **Discussions:** Ask questions and share solutions
- **Discord:** Real-time community support
- **Stack Overflow:** Tag questions with `agentarea-ui-sdk`

### Professional Support
For enterprise users or complex integration issues:
- Priority support channels
- Custom integration assistance
- Performance optimization consulting
- Training and workshops

Remember to always check the [API Reference](./api-reference.md) and [examples](../examples/README.md) for the most up-to-date usage patterns and best practices.