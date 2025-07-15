import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { 
  AgentRuntime, 
  RuntimeEvent, 
  Task, 
  AgentCard, 
  Capability 
} from '@agentarea/core'
import { useIsClient } from '../../hooks/use-ssr'

interface AgentContextValue {
  runtime: AgentRuntime | null
  isConnected: boolean
  agentCard: AgentCard | null
  capabilities: Capability[]
  tasks: Map<string, Task>
  error: Error | null
}

const AgentContext = createContext<AgentContextValue | null>(null)

interface AgentProviderProps {
  runtime: AgentRuntime
  children: ReactNode
}

export function AgentProvider({ runtime, children }: AgentProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [agentCard, setAgentCard] = useState<AgentCard | null>(null)
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [tasks, setTasks] = useState<Map<string, Task>>(new Map())
  const [error, setError] = useState<Error | null>(null)
  const isClient = useIsClient()

  useEffect(() => {
    // Skip if running on server
    if (!isClient) return
    const handleRuntimeEvent = (event: RuntimeEvent) => {
      switch (event.type) {
        case 'connected':
          setIsConnected(true)
          setError(null)
          // Load agent card and capabilities
          loadAgentInfo()
          break
          
        case 'disconnected':
          setIsConnected(false)
          break
          
        case 'error':
          setError(event.error)
          break
          
        case 'task-update':
          setTasks(prev => {
            const newTasks = new Map(prev)
            const { taskId } = event.update
            const existingTask = newTasks.get(taskId)
            
            if (existingTask) {
              // Update existing task
              const updatedTask: Task = {
                ...existingTask,
                status: event.update.status || existingTask.status,
                progress: event.update.progress || existingTask.progress,
                artifacts: event.update.artifacts || existingTask.artifacts,
                messages: event.update.messages || existingTask.messages,
                error: event.update.error || existingTask.error,
                updatedAt: new Date()
              }
              newTasks.set(taskId, updatedTask)
            }
            
            return newTasks
          })
          break
      }
    }

    runtime.addEventListener(handleRuntimeEvent)

    // Initial connection check
    if (runtime.isConnected()) {
      setIsConnected(true)
      loadAgentInfo()
    }

    return () => {
      runtime.removeEventListener(handleRuntimeEvent)
    }
  }, [runtime, isClient])

  const loadAgentInfo = async () => {
    try {
      const [card, caps] = await Promise.all([
        runtime.getAgentCard(),
        runtime.getCapabilities()
      ])
      setAgentCard(card)
      setCapabilities(caps)
    } catch (err) {
      setError(err as Error)
    }
  }

  const value: AgentContextValue = {
    runtime,
    isConnected,
    agentCard,
    capabilities,
    tasks,
    error
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