import { useState, useCallback, useEffect, useRef } from 'react'
import { useAgentContext } from '../components/providers/agent-provider'
import type { 
  Task, 
  TaskInput, 
  TaskResponse, 
  TaskUpdate,
  TaskStatus,
  TaskWithInputs,
  TaskInputRequest,
  InputResponse,
  EnhancedArtifact,
  CommunicationBlock,
  Subscription
} from '@agentarea/core'

export function useTask(taskId?: string) {
  const { runtime, tasks } = useAgentContext()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const subscriptionRef = useRef<Subscription | null>(null)
  
  const task = taskId ? tasks.get(taskId) : null
  const enhancedTask = task as TaskWithInputs | null

  // Enhanced task properties
  const inputRequests = enhancedTask?.inputRequests || []
  const inputResponses = enhancedTask?.inputResponses || []
  const artifacts = enhancedTask?.enhancedArtifacts || enhancedTask?.artifacts || []
  const communicationBlocks = enhancedTask?.communicationBlocks || []

  const getTask = useCallback(async (id: string): Promise<Task> => {
    if (!runtime) {
      throw new Error('No runtime available')
    }
    setIsLoading(true)
    setError(null)
    
    try {
      const fetchedTask = await runtime.getTask(id)
      tasks.set(id, fetchedTask)
      return fetchedTask
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [runtime, tasks])

  const cancelTask = useCallback(async (id: string): Promise<void> => {
    if (!runtime) {
      throw new Error('No runtime available')
    }
    setIsLoading(true)
    setError(null)
    
    try {
      await runtime.cancelTask(id)
      // Update local task status
      const currentTask = tasks.get(id)
      if (currentTask) {
        tasks.set(id, { ...currentTask, status: 'canceled' as TaskStatus })
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [runtime, tasks])

  // New input request handling
  const respondToInput = useCallback(async (requestId: string, response: InputResponse): Promise<void> => {
    if (!runtime || !taskId) {
      throw new Error('No runtime available or task ID missing')
    }
    setIsLoading(true)
    setError(null)
    
    try {
      await runtime.handleInputRequest(taskId, response)
      // Update local task with response
      const currentTask = tasks.get(taskId) as TaskWithInputs
      if (currentTask) {
        const updatedResponses = [...(currentTask.inputResponses || []), response]
        tasks.set(taskId, { ...currentTask, inputResponses: updatedResponses })
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [runtime, taskId, tasks])

  // Artifact download capability
  const downloadArtifact = useCallback(async (artifactId: string): Promise<Blob> => {
    if (!runtime) {
      throw new Error('No runtime available')
    }
    setIsLoading(true)
    setError(null)
    
    try {
      return await runtime.downloadArtifact(artifactId)
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [runtime])

  // Real-time subscription
  const subscribe = useCallback((callback: (update: TaskUpdate) => void): Subscription => {
    if (!runtime || !taskId) {
      throw new Error('No runtime available or task ID missing')
    }
    
    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }
    
    const subscription = runtime.subscribeToTask(taskId, (update) => {
      // Update local task state
      const currentTask = tasks.get(taskId)
      if (currentTask) {
        const updatedTask: TaskWithInputs = {
          ...currentTask,
          ...update,
          updatedAt: new Date()
        }
        tasks.set(taskId, updatedTask)
      }
      callback(update)
    })
    
    subscriptionRef.current = subscription
    return subscription
  }, [runtime, taskId, tasks])

  // Cleanup subscription on unmount or taskId change
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [taskId])

  return {
    // Existing API (backward compatibility)
    task,
    getTask,
    cancelTask,
    
    // Enhanced capabilities
    inputRequests,
    inputResponses,
    artifacts: artifacts as EnhancedArtifact[],
    communicationBlocks,
    
    // New actions
    respondToInput,
    downloadArtifact,
    subscribe,
    
    // State
    isLoading,
    error,
    
    // Helper methods (existing)
    isCompleted: task?.status === 'completed',
    isWorking: task?.status === 'working',
    isFailed: task?.status === 'failed',
    hasError: !!task?.error || !!error,
    
    // New helper methods
    hasInputRequests: inputRequests.length > 0,
    hasPendingInputs: inputRequests.some(req => 
      !inputResponses.some(res => res.requestId === req.id)
    ),
    hasArtifacts: artifacts.length > 0,
    hasCommunicationBlocks: communicationBlocks.length > 0,
    requiresInput: task?.status === 'input-required',
  }
}

export function useTaskList() {
  const { tasks } = useAgentContext()

  const taskList = Array.from(tasks.values()).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  )

  const getTasksByStatus = useCallback((status: TaskStatus) => {
    return taskList.filter(task => task.status === status)
  }, [taskList])

  const getActiveTasks = useCallback(() => {
    return taskList.filter(task => 
      task.status === 'submitted' || 
      task.status === 'working' ||
      task.status === 'input-required'
    )
  }, [taskList])

  const getCompletedTasks = useCallback(() => {
    return getTasksByStatus('completed')
  }, [getTasksByStatus])

  return {
    tasks: taskList,
    getTasksByStatus,
    getActiveTasks,
    getCompletedTasks,
    
    // Stats
    totalTasks: taskList.length,
    activeTasks: getActiveTasks().length,
    completedTasks: getCompletedTasks().length,
  }
}

export function useTaskCreation() {
  const { runtime, tasks } = useAgentContext()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createTask = useCallback(async (input: TaskInput): Promise<TaskResponse> => {
    if (!runtime) {
      throw new Error('No runtime available')
    }

    setIsCreating(true)
    setError(null)

    try {
      const response = await runtime.sendTask?.(input)
      
      if (response) {
        // Add task to local state
        tasks.set(response.task.id, response.task)
        return response
      }
      throw new Error('Failed to send task')
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }, [runtime, tasks])

  const createStreamingTask = useCallback(async function* (
    input: TaskInput
  ): AsyncIterable<TaskUpdate> {
    if (!runtime) {
      throw new Error('No runtime available')
    }

    if (!runtime.supportsStreaming?.()) {
      throw new Error('Runtime does not support streaming')
    }

    setIsCreating(true)
    setError(null)

    try {
      if (!runtime.streamTask) {
        throw new Error('streamTask method not available')
      }

      for await (const update of runtime.streamTask(input)) {
        yield update
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }, [runtime])

  return {
    createTask,
    createStreamingTask,
    isCreating,
    error,
    
    // Helper methods
    canStream: runtime?.supportsStreaming?.() ?? false,
  }
}

// New specialized hook for input request management
export function useTaskInput(taskId: string) {
  const { runtime, tasks } = useAgentContext()
  const [validationErrors, setValidationErrors] = useState<Map<string, ValidationError[]>>(new Map())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const task = tasks.get(taskId) as TaskWithInputs | undefined
  const activeRequests = task?.inputRequests || []
  const responses = new Map(
    (task?.inputResponses || []).map(response => [response.requestId, response])
  )

  const submitResponse = useCallback(async (requestId: string, value: unknown): Promise<void> => {
    if (!runtime) {
      throw new Error('No runtime available')
    }

    const request = activeRequests.find(req => req.id === requestId)
    if (!request) {
      throw new Error(`Input request ${requestId} not found`)
    }

    // Validate input before submission
    const validationResult = validateInput(requestId, value)
    if (!validationResult.isValid) {
      setValidationErrors(prev => new Map(prev.set(requestId, validationResult.errors)))
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      const response: InputResponse = {
        requestId,
        taskId,
        value,
        timestamp: new Date(),
        metadata: {}
      }
      
      await runtime.handleInputRequest(taskId, response)
      
      // Clear validation errors on successful submission
      setValidationErrors(prev => {
        const newMap = new Map(prev)
        newMap.delete(requestId)
        return newMap
      })
      
      // Update local task state
      const currentTask = tasks.get(taskId) as TaskWithInputs
      if (currentTask) {
        const updatedResponses = [...(currentTask.inputResponses || []), response]
        tasks.set(taskId, { ...currentTask, inputResponses: updatedResponses })
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [runtime, taskId, activeRequests, tasks])

  const validateInput = useCallback((requestId: string, value: unknown) => {
    const request = activeRequests.find(req => req.id === requestId)
    if (!request) {
      return { isValid: false, errors: [{ code: 'NOT_FOUND', message: 'Request not found', field: requestId }] }
    }

    const errors: ValidationError[] = []

    // Apply validation rules
    if (request.validation) {
      for (const rule of request.validation) {
        switch (rule.type) {
          case 'required':
            if (request.required && (value === null || value === undefined || value === '')) {
              errors.push({ code: 'REQUIRED', message: rule.message, field: requestId })
            }
            break
          case 'minLength':
            if (typeof value === 'string' && typeof rule.value === 'number' && value.length < rule.value) {
              errors.push({ code: 'MIN_LENGTH', message: rule.message, field: requestId })
            }
            break
          case 'maxLength':
            if (typeof value === 'string' && typeof rule.value === 'number' && value.length > rule.value) {
              errors.push({ code: 'MAX_LENGTH', message: rule.message, field: requestId })
            }
            break
          case 'pattern':
            if (typeof value === 'string' && typeof rule.value === 'string') {
              const regex = new RegExp(rule.value)
              if (!regex.test(value)) {
                errors.push({ code: 'PATTERN', message: rule.message, field: requestId })
              }
            }
            break
        }
      }
    }

    return { isValid: errors.length === 0, errors }
  }, [activeRequests])

  const clearValidationErrors = useCallback((requestId: string) => {
    setValidationErrors(prev => {
      const newMap = new Map(prev)
      newMap.delete(requestId)
      return newMap
    })
  }, [])

  return {
    activeRequests,
    responses,
    validationErrors,
    isSubmitting,
    error,
    
    // Actions
    submitResponse,
    validateInput,
    clearValidationErrors,
    
    // Helper methods
    hasActiveRequests: activeRequests.length > 0,
    hasPendingRequests: activeRequests.some(req => !responses.has(req.id)),
    getRequest: (requestId: string) => activeRequests.find(req => req.id === requestId),
    getResponse: (requestId: string) => responses.get(requestId),
    hasValidationErrors: (requestId: string) => validationErrors.has(requestId),
    getValidationErrors: (requestId: string) => validationErrors.get(requestId) || []
  }
}

interface ValidationError {
  code: string
  message: string
  field?: string
  data?: unknown
}