"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAgentContext } from '../components/providers/agent-provider'
import type { 
  TaskUpdate,
  AgentUpdate,
  Subscription
} from '@agentarea/core'

// Real-time updates hook
export function useRealTimeUpdates<T>(
  subscriptionType: 'task' | 'agent' | 'protocol',
  id: string,
  callback: (update: T) => void
) {
  const { runtime } = useAgentContext()
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const subscriptionRef = useRef<Subscription | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(async (): Promise<void> => {
    if (!runtime || !id) {
      throw new Error('No runtime available or ID missing')
    }

    setError(null)
    
    try {
      let subscription: Subscription

      switch (subscriptionType) {
        case 'task':
          subscription = runtime.subscribeToTask(id, (update) => {
            setLastUpdate(new Date())
            setIsConnected(true)
            setReconnectAttempts(0)
            callback(update as T)
          })
          break
        case 'agent':
          subscription = runtime.subscribeToAgent(id, (update) => {
            setLastUpdate(new Date())
            setIsConnected(true)
            setReconnectAttempts(0)
            callback(update as T)
          })
          break
        case 'protocol':
          // This would be implemented for protocol-specific subscriptions
          subscription = {
            unsubscribe: () => {},
            isActive: () => true
          }
          break
        default:
          throw new Error(`Unsupported subscription type: ${subscriptionType}`)
      }

      subscriptionRef.current = subscription
      setIsConnected(true)
      setReconnectAttempts(0)
    } catch (err) {
      const error = err as Error
      setError(error)
      setIsConnected(false)
      
      // Attempt reconnection with exponential backoff
      if (reconnectAttempts < 5) {
        const delay = Math.pow(2, reconnectAttempts) * 1000
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1)
          connect()
        }, delay)
      }
      
      throw error
    }
  }, [runtime, id, subscriptionType, callback, reconnectAttempts])

  const disconnect = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setIsConnected(false)
    setReconnectAttempts(0)
  }, [])

  const reconnect = useCallback(async (): Promise<void> => {
    disconnect()
    await connect()
  }, [disconnect, connect])

  // Auto-connect when dependencies change
  useEffect(() => {
    if (runtime && id) {
      connect()
    }
    
    return disconnect
  }, [runtime, id, subscriptionType])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    lastUpdate,
    error,
    reconnectAttempts,
    
    // Actions
    reconnect,
    disconnect,
    
    // Helper methods
    hasError: !!error,
    isReconnecting: reconnectAttempts > 0,
    maxReconnectAttemptsReached: reconnectAttempts >= 5
  }
}

// WebSocket connection hook
export function useWebSocketConnection(endpoint: string) {
  const [connection, setConnection] = useState<WebSocket | null>(null)
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageHandlersRef = useRef<Set<(event: MessageEvent) => void>>(new Set())
  const errorHandlersRef = useRef<Set<(event: Event) => void>>(new Set())
  const closeHandlersRef = useRef<Set<(event: CloseEvent) => void>>(new Set())

  const connect = useCallback(async (): Promise<void> => {
    if (!endpoint) {
      throw new Error('No endpoint provided')
    }

    // Close existing connection
    if (connection) {
      connection.close()
    }

    setError(null)
    
    try {
      const ws = new WebSocket(endpoint)
      
      ws.onopen = () => {
        setConnection(ws)
        setReadyState(ws.readyState)
        setReconnectAttempts(0)
      }
      
      ws.onmessage = (event) => {
        messageHandlersRef.current.forEach(handler => handler(event))
      }
      
      ws.onerror = (event) => {
        const error = new Error('WebSocket error')
        setError(error)
        errorHandlersRef.current.forEach(handler => handler(event))
      }
      
      ws.onclose = (event) => {
        setConnection(null)
        setReadyState(WebSocket.CLOSED)
        closeHandlersRef.current.forEach(handler => handler(event))
        
        // Attempt reconnection if not a clean close
        if (!event.wasClean && reconnectAttempts < 5) {
          const delay = Math.pow(2, reconnectAttempts) * 1000
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1)
            connect()
          }, delay)
        }
      }
      
      // Update ready state changes
      const checkReadyState = () => {
        if (ws.readyState !== readyState) {
          setReadyState(ws.readyState)
        }
      }
      
      const interval = setInterval(checkReadyState, 100)
      
      // Cleanup interval when connection changes
      ws.addEventListener('close', () => clearInterval(interval))
      
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    }
  }, [endpoint, connection, readyState, reconnectAttempts])

  const disconnect = useCallback(() => {
    if (connection) {
      connection.close(1000, 'Manual disconnect')
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setConnection(null)
    setReadyState(WebSocket.CLOSED)
    setReconnectAttempts(0)
  }, [connection])

  const send = useCallback((data: unknown) => {
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }
    
    const message = typeof data === 'string' ? data : JSON.stringify(data)
    connection.send(message)
  }, [connection])

  const onMessage = useCallback((handler: (event: MessageEvent) => void) => {
    messageHandlersRef.current.add(handler)
    
    // Return cleanup function
    return () => {
      messageHandlersRef.current.delete(handler)
    }
  }, [])

  const onError = useCallback((handler: (event: Event) => void) => {
    errorHandlersRef.current.add(handler)
    
    // Return cleanup function
    return () => {
      errorHandlersRef.current.delete(handler)
    }
  }, [])

  const onClose = useCallback((handler: (event: CloseEvent) => void) => {
    closeHandlersRef.current.add(handler)
    
    // Return cleanup function
    return () => {
      closeHandlersRef.current.delete(handler)
    }
  }, [])

  // Auto-connect when endpoint changes
  useEffect(() => {
    if (endpoint) {
      connect()
    }
    
    return disconnect
  }, [endpoint])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    connection,
    readyState,
    reconnectAttempts,
    error,
    
    // Actions
    connect,
    disconnect,
    send,
    
    // Event handlers
    onMessage,
    onError,
    onClose,
    
    // Helper methods
    isConnecting: readyState === WebSocket.CONNECTING,
    isOpen: readyState === WebSocket.OPEN,
    isClosing: readyState === WebSocket.CLOSING,
    isClosed: readyState === WebSocket.CLOSED,
    canSend: readyState === WebSocket.OPEN,
    hasError: !!error,
    isReconnecting: reconnectAttempts > 0,
    maxReconnectAttemptsReached: reconnectAttempts >= 5
  }
}