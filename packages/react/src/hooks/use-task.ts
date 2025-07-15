import { useState, useCallback } from 'react'
import { useAgentContext } from '../components/providers/agent-provider'
import type { 
  Task, 
  TaskInput, 
  TaskResponse, 
  TaskUpdate,
  TaskStatus 
} from '@agentarea/core'

export function useTask(taskId?: string) {
  const { runtime, tasks } = useAgentContext()
  const task = taskId ? tasks.get(taskId) : null

  const getTask = useCallback(async (id: string): Promise<Task> => {
    if (!runtime) {
      throw new Error('No runtime available')
    }
    return runtime.getTask(id)
  }, [runtime])

  const cancelTask = useCallback(async (id: string): Promise<void> => {
    if (!runtime) {
      throw new Error('No runtime available')
    }
    return runtime.cancelTask(id)
  }, [runtime])

  return {
    task,
    getTask,
    cancelTask,
    
    // Helper methods
    isCompleted: task?.status === 'completed',
    isWorking: task?.status === 'working',
    isFailed: task?.status === 'failed',
    hasError: !!task?.error,
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
      const response = await runtime.sendTask(input)
      
      // Add task to local state
      tasks.set(response.task.id, response.task)
      
      return response
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

    if (!runtime.supportsStreaming()) {
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
    canStream: runtime?.supportsStreaming() ?? false,
  }
}