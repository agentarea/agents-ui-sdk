"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import type { 
  AgentRuntime, 
  RuntimeEvent, 
  Task, 
  TaskInput,
  AgentCard, 
  Capability,
  TaskWithInputs,
  TaskInputRequest,
  InputResponse,
  CommunicationBlock,
  ProtocolMessage,
  Connection,
  ConnectionConfig
} from '@agentarea/core'
import { RuntimeManager, createRuntimeManager } from '@agentarea/core'
import { useIsClient } from '../../hooks/use-ssr'

interface AgentContextValue {
  // Runtime management
  runtimeManager: RuntimeManager
  activeRuntime: AgentRuntime | null
  runtimes: Map<string, AgentRuntime>
  
  // Connection management
  connections: Connection[]
  connectionStatus: Record<string, ConnectionStatus>
  
  // Legacy compatibility
  runtime: AgentRuntime | null
  isConnected: boolean
  agentCard: AgentCard | null
  capabilities: Capability[]
  
  // Enhanced task management with input handling
  tasks: Map<string, TaskWithInputs>
  activeInputRequests: TaskInputRequest[]
  
  // Real-time communication
  protocolMessages: ProtocolMessage[]
  communicationBlocks: CommunicationBlock[]
  
  // Error handling
  error: Error | null
  
  // Actions
  connectToAgent: (endpoint: string, config: ConnectionConfig) => Promise<void>
  disconnectFromAgent: (connectionId: string) => Promise<void>
  switchRuntime: (runtimeId: string) => Promise<void>
  submitTask: (input: TaskInput, agentId?: string) => Promise<Task>
  respondToInputRequest: (requestId: string, response: InputResponse) => Promise<void>
  sendProtocolMessage: (message: ProtocolMessage, targetAgent: string) => Promise<void>
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

const AgentContext = createContext<AgentContextValue | null>(null)

interface AgentProviderProps {
  runtime?: AgentRuntime
  runtimeManager?: RuntimeManager
  children: ReactNode
}

export function AgentProvider({ runtime, runtimeManager, children }: AgentProviderProps) {
  // Initialize runtime manager
  const [manager] = useState(() => runtimeManager || createRuntimeManager())
  
  // Runtime management state
  const [activeRuntime, setActiveRuntime] = useState<AgentRuntime | null>(runtime || null)
  const [runtimes, setRuntimes] = useState<Map<string, AgentRuntime>>(new Map())
  
  // Connection management state
  const [connections, setConnections] = useState<Connection[]>([])
  const [connectionStatus, setConnectionStatus] = useState<Record<string, ConnectionStatus>>({})
  
  // Legacy compatibility state
  const [isConnected, setIsConnected] = useState(false)
  const [agentCard, setAgentCard] = useState<AgentCard | null>(null)
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  
  // Enhanced task management state
  const [tasks, setTasks] = useState<Map<string, TaskWithInputs>>(new Map())
  const [activeInputRequests, setActiveInputRequests] = useState<TaskInputRequest[]>([])
  
  // Real-time communication state
  const [protocolMessages, setProtocolMessages] = useState<ProtocolMessage[]>([])
  const [communicationBlocks, setCommunicationBlocks] = useState<CommunicationBlock[]>([])
  
  // Error handling state
  const [error, setError] = useState<Error | null>(null)
  
  const isClient = useIsClient()

  // Register initial runtime if provided
  useEffect(() => {
    if (runtime && isClient) {
      const runtimeId = `runtime-${runtime.protocolType}-${Date.now()}`
      manager.registerRuntime(runtimeId, runtime)
      setActiveRuntime(runtime)
    }
  }, [runtime, manager, isClient])

  // Listen to runtime manager events
  useEffect(() => {
    if (!isClient) return

    const handleManagerEvent = (event: any) => {
      switch (event.type) {
        case 'runtime-registered':
          setRuntimes(new Map(manager.getAllRuntimes()))
          break
        case 'runtime-unregistered':
          setRuntimes(new Map(manager.getAllRuntimes()))
          break
        case 'runtime-switched':
          setActiveRuntime(event.runtime)
          break
      }
    }

    manager.addEventListener(handleManagerEvent)
    
    // Initialize runtimes state
    setRuntimes(new Map(manager.getAllRuntimes()))
    setActiveRuntime(manager.getActiveRuntime() || null)

    return () => {
      manager.removeEventListener(handleManagerEvent)
    }
  }, [manager, isClient])

  // Listen to active runtime events
  useEffect(() => {
    if (!isClient || !activeRuntime) return

    const handleRuntimeEvent = (event: RuntimeEvent) => {
      switch (event.type) {
        case 'connected':
          setIsConnected(true)
          setError(null)
          loadAgentInfo()
          break
          
        case 'disconnected':
          setIsConnected(false)
          break
          
        case 'error':
          setError(event.error)
          break
          
        case 'task-update':
          handleTaskUpdate(event.update)
          break
      }
    }

    activeRuntime.addEventListener?.(handleRuntimeEvent)

    // Initial connection check
    if (activeRuntime.isConnected?.()) {
      setIsConnected(true)
      loadAgentInfo()
    }

    return () => {
      activeRuntime.removeEventListener?.(handleRuntimeEvent)
    }
  }, [activeRuntime, isClient])

  const handleTaskUpdate = useCallback((update: any) => {
    setTasks(prev => {
      const newTasks = new Map(prev)
      const { taskId } = update
      const existingTask = newTasks.get(taskId)
      
      if (existingTask) {
        // Update existing task with enhanced properties
        const updatedTask: TaskWithInputs = {
          ...existingTask,
          status: update.status || existingTask.status,
          progress: update.progress || existingTask.progress,
          artifacts: update.artifacts || existingTask.artifacts,
          messages: update.messages || existingTask.messages,
          error: update.error || existingTask.error,
          updatedAt: new Date(),
          // Enhanced properties
          inputRequests: update.inputRequests || existingTask.inputRequests,
          inputResponses: update.inputResponses || existingTask.inputResponses,
          communicationBlocks: update.communicationBlocks || existingTask.communicationBlocks,
          enhancedArtifacts: update.enhancedArtifacts || existingTask.enhancedArtifacts
        }
        newTasks.set(taskId, updatedTask)
        
        // Update active input requests
        if (updatedTask.inputRequests) {
          setActiveInputRequests(prev => {
            const filtered = prev.filter(req => req.taskId !== taskId)
            const activeRequests = updatedTask.inputRequests?.filter(req => 
              !updatedTask.inputResponses?.some(resp => resp.requestId === req.id)
            ) || []
            return [...filtered, ...activeRequests]
          })
        }
        
        // Update communication blocks
        if (updatedTask.communicationBlocks) {
          setCommunicationBlocks(prev => {
            const filtered = prev.filter(block => block.taskId !== taskId)
            return [...filtered, ...updatedTask.communicationBlocks!]
          })
        }
      }
      
      return newTasks
    })
  }, [])

  const loadAgentInfo = async () => {
    if (!activeRuntime) return
    
    try {
      const [card, caps] = await Promise.all([
        activeRuntime.getAgentCard?.() || Promise.resolve(null),
        activeRuntime.getCapabilities?.() || Promise.resolve([])
      ])
      setAgentCard(card)
      setCapabilities(caps)
    } catch (err) {
      setError(err as Error)
    }
  }

  // Action implementations
  const connectToAgent = useCallback(async (endpoint: string, config: ConnectionConfig) => {
    if (!activeRuntime) {
      throw new Error('No active runtime available')
    }

    try {
      setConnectionStatus(prev => ({ ...prev, [endpoint]: 'connecting' }))
      
      const connection = await activeRuntime.connect(endpoint, config)
      
      setConnections(prev => [...prev.filter(c => c.endpoint !== endpoint), connection])
      setConnectionStatus(prev => ({ ...prev, [endpoint]: 'connected' }))
      setError(null)
    } catch (err) {
      setConnectionStatus(prev => ({ ...prev, [endpoint]: 'error' }))
      setError(err as Error)
      throw err
    }
  }, [activeRuntime])

  const disconnectFromAgent = useCallback(async (connectionId: string) => {
    if (!activeRuntime) {
      throw new Error('No active runtime available')
    }

    try {
      await activeRuntime.disconnect(connectionId)
      
      setConnections(prev => prev.filter(c => c.id !== connectionId))
      setConnectionStatus(prev => {
        const newStatus = { ...prev }
        const connection = connections.find(c => c.id === connectionId)
        if (connection) {
          newStatus[connection.endpoint] = 'disconnected'
        }
        return newStatus
      })
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [activeRuntime, connections])

  const switchRuntime = useCallback(async (runtimeId: string) => {
    try {
      await manager.switchRuntime(runtimeId)
      // State will be updated via manager event listener
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [manager])

  const submitTask = useCallback(async (input: any, agentId?: string) => {
    if (!activeRuntime) {
      throw new Error('No active runtime available')
    }

    try {
      const response = await activeRuntime.submitTask(input, agentId)
      
      // Add task to local state
      const taskWithInputs: TaskWithInputs = {
        ...response.task,
        inputRequests: [],
        inputResponses: [],
        communicationBlocks: [],
        enhancedArtifacts: []
      }
      
      setTasks(prev => new Map(prev.set(response.task.id, taskWithInputs)))
      
      return response.task
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [activeRuntime])

  const respondToInputRequest = useCallback(async (requestId: string, response: InputResponse) => {
    if (!activeRuntime) {
      throw new Error('No active runtime available')
    }

    try {
      const request = activeInputRequests.find(req => req.id === requestId)
      if (!request) {
        throw new Error(`Input request ${requestId} not found`)
      }

      await activeRuntime.handleInputRequest(request.taskId, response)
      
      // Update local state
      setActiveInputRequests(prev => prev.filter(req => req.id !== requestId))
      
      // Update task with response
      setTasks(prev => {
        const newTasks = new Map(prev)
        const task = newTasks.get(request.taskId)
        if (task) {
          const updatedTask: TaskWithInputs = {
            ...task,
            inputResponses: [...(task.inputResponses || []), response],
            updatedAt: new Date()
          }
          newTasks.set(request.taskId, updatedTask)
        }
        return newTasks
      })
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [activeRuntime, activeInputRequests])

  const sendProtocolMessage = useCallback(async (message: ProtocolMessage, targetAgent: string) => {
    if (!activeRuntime) {
      throw new Error('No active runtime available')
    }

    try {
      await activeRuntime.sendMessage(message, targetAgent)
      
      // Add message to local state
      setProtocolMessages(prev => [...prev, message])
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [activeRuntime])

  const value: AgentContextValue = {
    // Runtime management
    runtimeManager: manager,
    activeRuntime,
    runtimes,
    
    // Connection management
    connections,
    connectionStatus,
    
    // Legacy compatibility
    runtime: activeRuntime,
    isConnected,
    agentCard,
    capabilities,
    
    // Enhanced task management
    tasks,
    activeInputRequests,
    
    // Real-time communication
    protocolMessages,
    communicationBlocks,
    
    // Error handling
    error,
    
    // Actions
    connectToAgent,
    disconnectFromAgent,
    switchRuntime,
    submitTask,
    respondToInputRequest,
    sendProtocolMessage
  }

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  )
}

export function useAgentContext(): AgentContextValue {
  const context = useContext(AgentContext)
  if (!context) {
    throw new Error('useAgentContext must be used within an AgentProvider')
  }
  return context
}