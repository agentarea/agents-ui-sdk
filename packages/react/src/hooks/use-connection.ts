import { useState, useCallback, useEffect, useRef } from 'react'
import { useAgentContext } from '../components/providers/agent-provider'
import type { 
  Connection,
  ConnectionConfig,
  ProtocolMessage,
  Subscription,
  AgentUpdate
} from '@agentarea/core'

// Agent connection management hook
export function useAgentConnection(agentId?: string) {
  const { runtime } = useAgentContext()
  const [connection, setConnection] = useState<Connection | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [latency, setLatency] = useState<number | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const subscriptionRef = useRef<Subscription | null>(null)

  const connect = useCallback(async (config: ConnectionConfig): Promise<void> => {
    if (!runtime) {
      throw new Error('No runtime available')
    }

    setStatus('connecting')
    setError(null)
    
    try {
      const newConnection = await runtime.connect(config.endpoint, config)
      setConnection(newConnection)
      setStatus('connected')
      
      // Start latency monitoring
      const startTime = Date.now()
      // This would be a real ping in production
      setTimeout(() => {
        setLatency(Date.now() - startTime)
      }, 100)
      
    } catch (err) {
      const error = err as Error
      setError(error)
      setStatus('error')
      throw error
    }
  }, [runtime])

  const disconnect = useCallback(async (): Promise<void> => {
    if (!runtime || !connection) {
      return
    }

    setStatus('disconnecting')
    setError(null)
    
    try {
      await runtime.disconnect(connection.id)
      setConnection(null)
      setStatus('disconnected')
      setLatency(null)
      
      // Clean up subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      setStatus('error')
      throw error
    }
  }, [runtime, connection])

  const sendMessage = useCallback(async (message: ProtocolMessage): Promise<void> => {
    if (!runtime || !connection) {
      throw new Error('No runtime or connection available')
    }

    try {
      await runtime.sendMessage(message, connection.agentId)
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }, [runtime, connection])

  const subscribe = useCallback((callback: (update: AgentUpdate) => void): Subscription => {
    if (!runtime || !agentId) {
      throw new Error('No runtime available or agent ID missing')
    }
    
    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }
    
    const subscription = runtime.subscribeToAgent(agentId, callback)
    subscriptionRef.current = subscription
    return subscription
  }, [runtime, agentId])

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [])

  return {
    connection,
    status,
    latency,
    error,
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    subscribe,
    
    // Helper methods
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isDisconnected: status === 'disconnected',
    hasError: status === 'error' || !!error,
    canSendMessages: status === 'connected' && !!connection
  }
}

// Protocol messages hook
export function useProtocolMessages(filter?: MessageFilter) {
  const { runtime } = useAgentContext()
  const [messages, setMessages] = useState<ProtocolMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const subscriptionRef = useRef<Subscription | null>(null)

  const sendMessage = useCallback(async (message: ProtocolMessage, target: string): Promise<void> => {
    if (!runtime) {
      throw new Error('No runtime available')
    }

    setError(null)
    
    try {
      await runtime.sendMessage(message, target)
      
      // Add to local messages
      setMessages(prev => [...prev, { ...message, timestamp: new Date() }])
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }, [runtime])

  const markAsRead = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setUnreadCount(0)
  }, [])

  const subscribe = useCallback((callback: (message: ProtocolMessage) => void): Subscription => {
    if (!runtime) {
      throw new Error('No runtime available')
    }
    
    // This would be implemented by the runtime to subscribe to protocol messages
    // For now, return a mock subscription
    const subscription = {
      unsubscribe: () => {},
      isActive: () => true
    }
    
    subscriptionRef.current = subscription
    return subscription
  }, [runtime])

  // Filter messages based on provided filter
  const filteredMessages = filter 
    ? messages.filter(msg => {
        if (filter.type && msg.type !== filter.type) return false
        if (filter.source && msg.source !== filter.source) return false
        if (filter.target && msg.target !== filter.target) return false
        if (filter.since && msg.timestamp < filter.since) return false
        if (filter.until && msg.timestamp > filter.until) return false
        return true
      })
    : messages

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [])

  return {
    messages: filteredMessages,
    unreadCount,
    error,
    
    // Actions
    sendMessage,
    markAsRead,
    clearMessages,
    subscribe,
    
    // Helper methods
    hasMessages: filteredMessages.length > 0,
    hasUnreadMessages: unreadCount > 0,
    getMessageById: (messageId: string) => messages.find(msg => msg.id === messageId),
    getMessagesByType: (type: string) => filteredMessages.filter(msg => msg.type === type),
    getMessagesBySource: (source: string) => filteredMessages.filter(msg => msg.source === source)
  }
}

// Type definitions
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error'

interface MessageFilter {
  type?: string
  source?: string
  target?: string
  since?: Date
  until?: Date
}

// Extend ProtocolMessage to include read status
declare module '@agentarea/core' {
  interface ProtocolMessage {
    read?: boolean
  }
}