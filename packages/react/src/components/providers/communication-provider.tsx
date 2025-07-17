import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import type { 
  Connection,
  ConnectionConfig,
  ProtocolMessage,
  CommunicationBlock
} from '@agentarea/core'
import { useIsClient } from '../../hooks/use-ssr'

interface NetworkStatus {
  online: boolean
  latency?: number
  lastCheck: Date
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline'
}

interface ProtocolCallback {
  (message: ProtocolMessage): void
}

interface Subscription {
  id: string
  protocolType: string
  callback: ProtocolCallback
  active: boolean
}

interface MessageFilter {
  protocolType?: string
  source?: string
  target?: string
  messageType?: string
  since?: Date
}

interface CommunicationContextValue {
  connections: Connection[]
  protocolMessages: ProtocolMessage[]
  communicationBlocks: CommunicationBlock[]
  networkStatus: NetworkStatus
  subscriptions: Subscription[]
  error: Error | null
  
  // Actions
  establishConnection: (config: ConnectionConfig) => Promise<Connection>
  closeConnection: (connectionId: string) => Promise<void>
  sendMessage: (message: ProtocolMessage, target: string) => Promise<void>
  subscribeToProtocol: (protocolType: string, callback: ProtocolCallback) => Subscription
  unsubscribeFromProtocol: (subscriptionId: string) => void
  addCommunicationBlock: (block: CommunicationBlock) => void
  removeCommunicationBlock: (blockId: string) => void
  updateCommunicationBlock: (blockId: string, updates: Partial<CommunicationBlock>) => void
  filterMessages: (filter: MessageFilter) => ProtocolMessage[]
  clearMessages: (olderThan?: Date) => void
  getConnectionById: (connectionId: string) => Connection | undefined
  getConnectionsByProtocol: (protocolType: string) => Connection[]
}

const CommunicationContext = createContext<CommunicationContextValue | null>(null)

interface CommunicationProviderProps {
  children: ReactNode
  maxMessages?: number
  networkCheckInterval?: number
  autoReconnect?: boolean
  onConnectionChange?: (connection: Connection, status: 'connected' | 'disconnected' | 'error') => void
  onMessageReceived?: (message: ProtocolMessage) => void
}

export function CommunicationProvider({ 
  children,
  maxMessages = 1000,
  networkCheckInterval = 30000, // 30 seconds
  autoReconnect = true,
  onConnectionChange,
  onMessageReceived
}: CommunicationProviderProps) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [protocolMessages, setProtocolMessages] = useState<ProtocolMessage[]>([])
  const [communicationBlocks, setCommunicationBlocks] = useState<CommunicationBlock[]>([])
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: true,
    lastCheck: new Date(),
    connectionQuality: 'excellent'
  })
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [error, setError] = useState<Error | null>(null)
  
  const isClient = useIsClient()

  // Network status monitoring
  useEffect(() => {
    if (!isClient) return

    const checkNetworkStatus = async () => {
      try {
        const startTime = Date.now()
        
        // Simple network check using a small request
        const response = await fetch('/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-cache'
        })
        
        const latency = Date.now() - startTime
        const online = response.ok
        
        let connectionQuality: NetworkStatus['connectionQuality']
        if (!online) {
          connectionQuality = 'offline'
        } else if (latency < 100) {
          connectionQuality = 'excellent'
        } else if (latency < 300) {
          connectionQuality = 'good'
        } else if (latency < 1000) {
          connectionQuality = 'fair'
        } else {
          connectionQuality = 'poor'
        }

        setNetworkStatus({
          online,
          latency,
          lastCheck: new Date(),
          connectionQuality
        })
      } catch (err) {
        setNetworkStatus(prev => ({
          ...prev,
          online: false,
          lastCheck: new Date(),
          connectionQuality: 'offline'
        }))
      }
    }

    // Initial check
    checkNetworkStatus()

    // Set up interval for periodic checks
    const interval = setInterval(checkNetworkStatus, networkCheckInterval)

    // Listen to online/offline events
    const handleOnline = () => checkNetworkStatus()
    const handleOffline = () => setNetworkStatus(prev => ({
      ...prev,
      online: false,
      connectionQuality: 'offline',
      lastCheck: new Date()
    }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isClient, networkCheckInterval])

  // Auto-cleanup old messages
  useEffect(() => {
    if (protocolMessages.length > maxMessages) {
      setProtocolMessages(prev => prev.slice(-maxMessages))
    }
  }, [protocolMessages.length, maxMessages])

  // Auto-reconnect logic
  useEffect(() => {
    if (!autoReconnect || !isClient) return

    const reconnectInterval = setInterval(() => {
      connections.forEach(async (connection) => {
        if (connection.status === 'disconnected' || connection.status === 'error') {
          try {
            // Attempt to reconnect (this would need actual implementation)
            await reconnectConnection(connection)
          } catch (err) {
            console.warn(`Failed to reconnect to ${connection.endpoint}:`, err)
          }
        }
      })
    }, 10000) // Try reconnecting every 10 seconds

    return () => clearInterval(reconnectInterval)
  }, [connections, autoReconnect, isClient])

  const establishConnection = useCallback(async (config: ConnectionConfig): Promise<Connection> => {
    if (!isClient) {
      throw new Error('Connection establishment not available on server side')
    }

    try {
      setError(null)

      // Create connection object
      const connection: Connection = {
        id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        agentId: `agent-${config.endpoint}`,
        endpoint: config.endpoint,
        status: 'connecting',
        protocols: config.protocols,
        metadata: {
          ...config.options,
          createdAt: new Date().toISOString()
        },
        createdAt: new Date(),
        lastActivity: new Date()
      }

      // Add to connections with connecting status
      setConnections(prev => [...prev.filter(c => c.endpoint !== config.endpoint), connection])

      // Simulate connection process (replace with actual implementation)
      const establishedConnection = await simulateConnection(connection, config)

      // Update connection status
      setConnections(prev => prev.map(c => 
        c.id === connection.id ? establishedConnection : c
      ))

      // Notify about connection change
      if (onConnectionChange) {
        onConnectionChange(establishedConnection, 'connected')
      }

      return establishedConnection
    } catch (err) {
      const error = err as Error
      setError(error)
      
      // Update connection status to error
      setConnections(prev => prev.map(c => 
        c.endpoint === config.endpoint 
          ? { ...c, status: 'error' as const, lastActivity: new Date() }
          : c
      ))

      throw error
    }
  }, [isClient, onConnectionChange])

  const closeConnection = useCallback(async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId)
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`)
    }

    try {
      setError(null)

      // Simulate disconnection process (replace with actual implementation)
      await simulateDisconnection(connection)

      // Remove connection
      setConnections(prev => prev.filter(c => c.id !== connectionId))

      // Notify about connection change
      if (onConnectionChange) {
        onConnectionChange(connection, 'disconnected')
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }, [connections, onConnectionChange])

  const sendMessage = useCallback(async (message: ProtocolMessage, target: string) => {
    const targetConnection = connections.find(c => 
      c.agentId === target || c.endpoint === target
    )

    if (!targetConnection) {
      throw new Error(`No connection found for target: ${target}`)
    }

    if (targetConnection.status !== 'connected') {
      throw new Error(`Connection to ${target} is not active`)
    }

    try {
      setError(null)

      // Simulate message sending (replace with actual implementation)
      await simulateMessageSending(message, targetConnection)

      // Add message to local state
      setProtocolMessages(prev => [...prev, {
        ...message,
        timestamp: new Date()
      }])

      // Update connection last activity
      setConnections(prev => prev.map(c => 
        c.id === targetConnection.id 
          ? { ...c, lastActivity: new Date() }
          : c
      ))

    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }, [connections])

  const subscribeToProtocol = useCallback((
    protocolType: string, 
    callback: ProtocolCallback
  ): Subscription => {
    const subscription: Subscription = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      protocolType,
      callback,
      active: true
    }

    setSubscriptions(prev => [...prev, subscription])

    return subscription
  }, [])

  const unsubscribeFromProtocol = useCallback((subscriptionId: string) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId))
  }, [])

  const addCommunicationBlock = useCallback((block: CommunicationBlock) => {
    setCommunicationBlocks(prev => [...prev.filter(b => b.id !== block.id), block])
  }, [])

  const removeCommunicationBlock = useCallback((blockId: string) => {
    setCommunicationBlocks(prev => prev.filter(b => b.id !== blockId))
  }, [])

  const updateCommunicationBlock = useCallback((
    blockId: string, 
    updates: Partial<CommunicationBlock>
  ) => {
    setCommunicationBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, ...updates }
        : block
    ))
  }, [])

  const filterMessages = useCallback((filter: MessageFilter): ProtocolMessage[] => {
    return protocolMessages.filter(message => {
      if (filter.protocolType && !message.type.includes(filter.protocolType)) {
        return false
      }
      if (filter.source && message.source !== filter.source) {
        return false
      }
      if (filter.target && message.target !== filter.target) {
        return false
      }
      if (filter.messageType && message.type !== filter.messageType) {
        return false
      }
      if (filter.since && message.timestamp < filter.since) {
        return false
      }
      return true
    })
  }, [protocolMessages])

  const clearMessages = useCallback((olderThan?: Date) => {
    if (olderThan) {
      setProtocolMessages(prev => prev.filter(msg => msg.timestamp >= olderThan))
    } else {
      setProtocolMessages([])
    }
  }, [])

  const getConnectionById = useCallback((connectionId: string): Connection | undefined => {
    return connections.find(c => c.id === connectionId)
  }, [connections])

  const getConnectionsByProtocol = useCallback((protocolType: string): Connection[] => {
    return connections.filter(c => c.protocols.includes(protocolType))
  }, [connections])

  // Handle incoming messages for subscriptions
  useEffect(() => {
    protocolMessages.forEach(message => {
      // Notify external handler
      if (onMessageReceived) {
        onMessageReceived(message)
      }

      // Notify protocol subscriptions
      subscriptions
        .filter(sub => sub.active && sub.protocolType === message.type)
        .forEach(sub => {
          try {
            sub.callback(message)
          } catch (err) {
            console.error('Error in protocol subscription callback:', err)
          }
        })
    })
  }, [protocolMessages, subscriptions, onMessageReceived])

  const value: CommunicationContextValue = {
    connections,
    protocolMessages,
    communicationBlocks,
    networkStatus,
    subscriptions,
    error,
    establishConnection,
    closeConnection,
    sendMessage,
    subscribeToProtocol,
    unsubscribeFromProtocol,
    addCommunicationBlock,
    removeCommunicationBlock,
    updateCommunicationBlock,
    filterMessages,
    clearMessages,
    getConnectionById,
    getConnectionsByProtocol
  }

  return (
    <CommunicationContext.Provider value={value}>
      {children}
    </CommunicationContext.Provider>
  )
}

export function useCommunicationContext(): CommunicationContextValue {
  const context = useContext(CommunicationContext)
  if (!context) {
    throw new Error('useCommunicationContext must be used within a CommunicationProvider')
  }
  return context
}

// Helper functions (replace with actual implementations)
async function simulateConnection(
  connection: Connection, 
  config: ConnectionConfig
): Promise<Connection> {
  // Simulate connection delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  return {
    ...connection,
    status: 'connected',
    lastActivity: new Date()
  }
}

async function simulateDisconnection(connection: Connection): Promise<void> {
  // Simulate disconnection delay
  await new Promise(resolve => setTimeout(resolve, 500))
}

async function simulateMessageSending(
  message: ProtocolMessage, 
  connection: Connection
): Promise<void> {
  // Simulate message sending delay
  await new Promise(resolve => setTimeout(resolve, 100))
}

async function reconnectConnection(connection: Connection): Promise<Connection> {
  // Simulate reconnection attempt
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  return {
    ...connection,
    status: 'connected',
    lastActivity: new Date()
  }
}