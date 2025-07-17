import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { 
  AgentRuntime, 
  RuntimeConfig,
  Connection,
  ConnectionConfig,
  AuthConfig,
  RuntimeEnvironment,
  AgentUIConfig
} from '@agentarea/core'
import { useRuntimeEnvironment } from '../hooks/use-runtime-environment'
import { AgentProvider } from './providers/agent-provider'
import { ConfigProvider } from './providers/config-provider'

// Main AgentUI configuration interface
export interface AgentUIProps {
  // Runtime configuration
  runtime?: 'a2a' | 'agentarea' | AgentRuntime
  endpoint?: string
  authentication?: AuthConfig
  
  // Connection options
  autoConnect?: boolean
  reconnectAttempts?: number
  
  // UI configuration
  theme?: 'light' | 'dark' | 'system'
  className?: string
  
  // Development options
  debug?: boolean
  devTools?: boolean
  
  // Environment configuration
  config?: AgentUIConfig
  
  children: ReactNode
}

// AgentUI Context for managing global state
interface AgentUIContextValue {
  // Configuration
  config: AgentUIConfig
  environment: RuntimeEnvironment
  
  // Runtime management
  runtime: AgentRuntime | null
  connections: Connection[]
  activeConnection: Connection | null
  
  // UI state
  theme: 'light' | 'dark' | 'system'
  debug: boolean
  devTools: boolean
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleDebug: () => void
  toggleDevTools: () => void
  connectToAgent: (endpoint: string, config?: ConnectionConfig) => Promise<void>
  disconnectFromAgent: (connectionId?: string) => Promise<void>
}

const AgentUIContext = createContext<AgentUIContextValue | null>(null)

// Main AgentUI component
export function AgentUI({
  runtime,
  endpoint,
  authentication,
  autoConnect = false,
  reconnectAttempts = 3,
  theme = 'system',
  className,
  debug = false,
  devTools = false,
  config = {},
  children
}: AgentUIProps) {
  const environment = useRuntimeEnvironment()
  const [agentRuntime, setAgentRuntime] = useState<AgentRuntime | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [activeConnection, setActiveConnection] = useState<Connection | null>(null)
  const [currentTheme, setCurrentTheme] = useState(theme)
  const [debugEnabled, setDebugEnabled] = useState(debug)
  const [devToolsEnabled, setDevToolsEnabled] = useState(devTools)

  // Initialize runtime based on configuration
  useEffect(() => {
    if (!environment.isClient) return

    let runtimeInstance: AgentRuntime | null = null

    if (typeof runtime === 'object' && runtime !== null) {
      // Runtime instance provided directly
      runtimeInstance = runtime
    } else if (typeof runtime === 'string') {
      // Create runtime from string identifier
      runtimeInstance = createRuntimeFromType(runtime, {
        endpoint,
        authentication,
        timeout: config.development?.debug ? 30000 : 10000,
        retries: reconnectAttempts
      })
    }

    setAgentRuntime(runtimeInstance)

    // Auto-connect if enabled and endpoint provided
    if (autoConnect && endpoint && runtimeInstance) {
      connectToAgent(endpoint, {
        endpoint,
        authentication: authentication || { type: 'bearer' },
        protocols: [runtime as string || 'agentarea'],
        options: {
          timeout: 10000,
          retryAttempts: reconnectAttempts,
          heartbeatInterval: 30000
        }
      }).catch(error => {
        if (debugEnabled) {
          console.error('AgentUI: Auto-connect failed:', error)
        }
      })
    }
  }, [runtime, endpoint, authentication, autoConnect, reconnectAttempts, environment.isClient])

  const connectToAgent = async (endpoint: string, config?: ConnectionConfig) => {
    if (!agentRuntime) {
      throw new Error('No runtime available for connection')
    }

    try {
      const connection = await agentRuntime.connect(endpoint, config || {
        endpoint,
        authentication: authentication || { type: 'bearer' },
        protocols: ['agentarea']
      })

      setConnections(prev => [...prev, connection])
      setActiveConnection(connection)

      if (debugEnabled) {
        console.log('AgentUI: Connected to agent:', connection)
      }
    } catch (error) {
      if (debugEnabled) {
        console.error('AgentUI: Connection failed:', error)
      }
      throw error
    }
  }

  const disconnectFromAgent = async (connectionId?: string) => {
    if (!agentRuntime) return

    try {
      await agentRuntime.disconnect(connectionId)
      
      if (connectionId) {
        setConnections(prev => prev.filter(conn => conn.id !== connectionId))
        if (activeConnection?.id === connectionId) {
          setActiveConnection(connections.find(conn => conn.id !== connectionId) || null)
        }
      } else {
        setConnections([])
        setActiveConnection(null)
      }

      if (debugEnabled) {
        console.log('AgentUI: Disconnected from agent:', connectionId || 'all')
      }
    } catch (error) {
      if (debugEnabled) {
        console.error('AgentUI: Disconnect failed:', error)
      }
      throw error
    }
  }

  const contextValue: AgentUIContextValue = {
    config,
    environment,
    runtime: agentRuntime,
    connections,
    activeConnection,
    theme: currentTheme,
    debug: debugEnabled,
    devTools: devToolsEnabled,
    setTheme: setCurrentTheme,
    toggleDebug: () => setDebugEnabled(prev => !prev),
    toggleDevTools: () => setDevToolsEnabled(prev => !prev),
    connectToAgent,
    disconnectFromAgent
  }

  // Wrap with ConfigProvider and AgentProvider
  const content = (
    <ConfigProvider 
      config={config}
      autoOptimize={true}
      validateOnMount={debugEnabled}
    >
      <AgentUIContext.Provider value={contextValue}>
        <div 
          className={`agent-ui ${currentTheme} ${className || ''}`}
          data-theme={currentTheme}
          data-debug={debugEnabled}
          data-environment={environment.isNextJS ? 'nextjs' : environment.isVite ? 'vite' : 'react'}
        >
          {agentRuntime ? (
            <AgentProvider runtime={agentRuntime}>
              {children}
            </AgentProvider>
          ) : (
            children
          )}
        </div>
      </AgentUIContext.Provider>
    </ConfigProvider>
  )

  return content
}

// Hook to access AgentUI context
export function useAgentUI(): AgentUIContextValue {
  const context = useContext(AgentUIContext)
  if (!context) {
    throw new Error('useAgentUI must be used within an AgentUI component')
  }
  return context
}

// Helper function to create runtime from type string
function createRuntimeFromType(type: string, config: RuntimeConfig): AgentRuntime | null {
  // This would typically use the RuntimeFactory from core
  // For now, return null as the factory implementation is in task 2
  console.warn(`AgentUI: Runtime creation for type "${type}" not yet implemented. Requires RuntimeFactory from task 2.`)
  return null
}

// AgentUI.Provider - Explicit provider pattern usage
interface AgentUIProviderProps {
  runtime?: 'a2a' | 'agentarea' | AgentRuntime
  endpoint?: string
  authentication?: AuthConfig
  config?: AgentUIConfig
  children: ReactNode
}

function AgentUIProvider({
  runtime,
  endpoint,
  authentication,
  config = {},
  children
}: AgentUIProviderProps) {
  const environment = useRuntimeEnvironment()
  const [agentRuntime, setAgentRuntime] = useState<AgentRuntime | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [activeConnection, setActiveConnection] = useState<Connection | null>(null)

  useEffect(() => {
    if (!environment.isClient) return

    let runtimeInstance: AgentRuntime | null = null

    if (typeof runtime === 'object' && runtime !== null) {
      runtimeInstance = runtime
    } else if (typeof runtime === 'string') {
      runtimeInstance = createRuntimeFromType(runtime, {
        endpoint,
        authentication,
        timeout: config.development?.debug ? 30000 : 10000
      })
    }

    setAgentRuntime(runtimeInstance)
  }, [runtime, endpoint, authentication, environment.isClient])

  const connectToAgent = async (endpoint: string, config?: ConnectionConfig) => {
    if (!agentRuntime) {
      throw new Error('No runtime available for connection')
    }

    const connection = await agentRuntime.connect(endpoint, config || {
      endpoint,
      authentication: authentication || { type: 'bearer' },
      protocols: ['agentarea']
    })

    setConnections(prev => [...prev, connection])
    setActiveConnection(connection)
  }

  const disconnectFromAgent = async (connectionId?: string) => {
    if (!agentRuntime) return

    await agentRuntime.disconnect(connectionId)
    
    if (connectionId) {
      setConnections(prev => prev.filter(conn => conn.id !== connectionId))
      if (activeConnection?.id === connectionId) {
        setActiveConnection(connections.find(conn => conn.id !== connectionId) || null)
      }
    } else {
      setConnections([])
      setActiveConnection(null)
    }
  }

  const contextValue: AgentUIContextValue = {
    config,
    environment,
    runtime: agentRuntime,
    connections,
    activeConnection,
    theme: 'system',
    debug: config.development?.debug || false,
    devTools: config.development?.devTools || false,
    setTheme: () => {},
    toggleDebug: () => {},
    toggleDevTools: () => {},
    connectToAgent,
    disconnectFromAgent
  }

  const content = agentRuntime ? (
    <AgentProvider runtime={agentRuntime}>
      {children}
    </AgentProvider>
  ) : (
    children
  )

  return (
    <AgentUIContext.Provider value={contextValue}>
      {content}
    </AgentUIContext.Provider>
  )
}

// AgentUI.Connection - Connection status and management display
interface AgentUIConnectionProps {
  showStatus?: boolean
  showLatency?: boolean
  showActions?: boolean
  className?: string
}

function AgentUIConnection({
  showStatus = true,
  showLatency = false,
  showActions = true,
  className
}: AgentUIConnectionProps) {
  const { connections, activeConnection, connectToAgent, disconnectFromAgent, debug } = useAgentUI()
  const [latency, setLatency] = useState<number | null>(null)

  // Monitor connection latency if enabled
  useEffect(() => {
    if (!showLatency || !activeConnection) return

    const measureLatency = async () => {
      const start = Date.now()
      try {
        // Simple ping to measure latency (would need runtime support)
        await new Promise(resolve => setTimeout(resolve, 10))
        setLatency(Date.now() - start)
      } catch {
        setLatency(null)
      }
    }

    const interval = setInterval(measureLatency, 5000)
    return () => clearInterval(interval)
  }, [showLatency, activeConnection])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600'
      case 'connecting': return 'text-yellow-600'
      case 'disconnected': return 'text-gray-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return '●'
      case 'connecting': return '◐'
      case 'disconnected': return '○'
      case 'error': return '✕'
      default: return '○'
    }
  }

  if (!activeConnection && connections.length === 0) {
    return (
      <div className={`agent-ui-connection no-connection ${className || ''}`}>
        <span className="text-gray-500">No connections</span>
      </div>
    )
  }

  return (
    <div className={`agent-ui-connection ${className || ''}`}>
      {connections.map(connection => (
        <div key={connection.id} className="connection-item flex items-center gap-2 p-2">
          {showStatus && (
            <div className="connection-status flex items-center gap-1">
              <span className={`status-icon ${getStatusColor(connection.status)}`}>
                {getStatusIcon(connection.status)}
              </span>
              <span className={`status-text text-sm ${getStatusColor(connection.status)}`}>
                {connection.status}
              </span>
            </div>
          )}
          
          <div className="connection-info flex-1">
            <div className="text-sm font-medium">{connection.agentId}</div>
            <div className="text-xs text-gray-500">{connection.endpoint}</div>
          </div>

          {showLatency && latency !== null && connection.id === activeConnection?.id && (
            <div className="latency text-xs text-gray-500">
              {latency}ms
            </div>
          )}

          {showActions && (
            <div className="connection-actions flex gap-1">
              <button
                onClick={() => disconnectFromAgent(connection.id)}
                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                title="Disconnect"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      ))}

      {debug && (
        <div className="debug-info mt-2 p-2 bg-gray-100 rounded text-xs">
          <div>Active: {activeConnection?.id || 'none'}</div>
          <div>Total: {connections.length}</div>
        </div>
      )}
    </div>
  )
}

// AgentUI.Debug - Development tools and debugging
interface AgentUIDebugProps {
  showEnvironment?: boolean
  showRuntime?: boolean
  showConnections?: boolean
  showConfig?: boolean
  className?: string
}

function AgentUIDebug({
  showEnvironment = true,
  showRuntime = true,
  showConnections = true,
  showConfig = false,
  className
}: AgentUIDebugProps) {
  const { 
    environment, 
    runtime, 
    connections, 
    config, 
    debug, 
    devTools,
    toggleDebug,
    toggleDevTools
  } = useAgentUI()

  if (!debug && !devTools) {
    return null
  }

  return (
    <div className={`agent-ui-debug bg-gray-900 text-white p-4 rounded ${className || ''}`}>
      <div className="debug-header flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">AgentUI Debug</h3>
        <div className="debug-controls flex gap-2">
          <button
            onClick={toggleDebug}
            className={`px-2 py-1 text-xs rounded ${
              debug ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            Debug: {debug ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={toggleDevTools}
            className={`px-2 py-1 text-xs rounded ${
              devTools ? 'bg-green-600' : 'bg-gray-600'
            }`}
          >
            DevTools: {devTools ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {showEnvironment && (
        <div className="debug-section mb-4">
          <h4 className="text-sm font-semibold mb-2">Environment</h4>
          <div className="text-xs space-y-1">
            <div>Client: {environment.isClient ? '✓' : '✗'}</div>
            <div>Server: {environment.isServer ? '✓' : '✗'}</div>
            <div>Next.js: {environment.isNextJS ? '✓' : '✗'}</div>
            <div>Vite: {environment.isVite ? '✓' : '✗'}</div>
            <div>WebSockets: {environment.supportsWebSockets ? '✓' : '✗'}</div>
            <div>File API: {environment.supportsFileAPI ? '✓' : '✗'}</div>
          </div>
        </div>
      )}

      {showRuntime && (
        <div className="debug-section mb-4">
          <h4 className="text-sm font-semibold mb-2">Runtime</h4>
          <div className="text-xs space-y-1">
            <div>Type: {runtime?.protocolType || 'none'}</div>
            <div>Version: {runtime?.version || 'unknown'}</div>
            <div>Connected: {runtime ? '✓' : '✗'}</div>
          </div>
        </div>
      )}

      {showConnections && (
        <div className="debug-section mb-4">
          <h4 className="text-sm font-semibold mb-2">Connections ({connections.length})</h4>
          <div className="text-xs space-y-1">
            {connections.map(conn => (
              <div key={conn.id} className="connection-debug">
                <div>ID: {conn.id}</div>
                <div>Agent: {conn.agentId}</div>
                <div>Status: {conn.status}</div>
                <div>Endpoint: {conn.endpoint}</div>
                <div>Protocols: {conn.protocols.join(', ')}</div>
                <hr className="my-1 border-gray-700" />
              </div>
            ))}
            {connections.length === 0 && (
              <div className="text-gray-400">No active connections</div>
            )}
          </div>
        </div>
      )}

      {showConfig && (
        <div className="debug-section">
          <h4 className="text-sm font-semibold mb-2">Configuration</h4>
          <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

// Attach compound components to main AgentUI
AgentUI.Provider = AgentUIProvider
AgentUI.Connection = AgentUIConnection
AgentUI.Debug = AgentUIDebug