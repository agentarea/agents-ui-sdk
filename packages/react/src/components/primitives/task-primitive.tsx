"use client"

import { forwardRef, HTMLAttributes, FormHTMLAttributes, ButtonHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { useTask, useTaskCreation } from '../../hooks/use-task'
import type { Task, TaskStatus } from '@agentarea/core'

// Root container for task component
export interface TaskRootProps extends HTMLAttributes<HTMLDivElement> {
  taskId?: string
}

const TaskRoot = forwardRef<HTMLDivElement, TaskRootProps>(
  ({ taskId, children, ...props }, ref) => {
    return (
      <div ref={ref} data-task-id={taskId} {...props}>
        {children}
      </div>
    )
  }
)
TaskRoot.displayName = 'TaskPrimitive.Root'

// Task input/description textarea
export interface TaskInputProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onSubmit'> {
  onSubmit?: (value: string) => void
}

const TaskInput = forwardRef<HTMLTextAreaElement, TaskInputProps>(
  ({ onSubmit, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        const value = e.currentTarget.value.trim()
        if (value && onSubmit) {
          onSubmit(value)
          e.currentTarget.value = ''
        }
      }
      onKeyDown?.(e)
    }

    return (
      <textarea
        ref={ref}
        placeholder="Describe the task..."
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  }
)
TaskInput.displayName = 'TaskPrimitive.Input'

// Send task button
export interface TaskSendProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  taskInput?: string
}

const TaskSend = forwardRef<HTMLButtonElement, TaskSendProps>(
  ({ taskInput, onClick, children, ...props }, ref) => {
    const { createTask, isCreating } = useTaskCreation()

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (taskInput?.trim()) {
        await createTask({
          message: {
            role: 'user',
            parts: [{ type: 'text', content: taskInput }]
          }
        })
      }
      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        type="button"
        disabled={isCreating || !taskInput?.trim()}
        onClick={handleClick}
        {...props}
      >
        {children || (isCreating ? 'Sending...' : 'Send Task')}
      </button>
    )
  }
)
TaskSend.displayName = 'TaskPrimitive.Send'

// Task status indicator
export interface TaskStatusProps extends HTMLAttributes<HTMLDivElement> {
  taskId?: string
  status?: TaskStatus
}

const TaskStatus = forwardRef<HTMLDivElement, TaskStatusProps>(
  ({ taskId, status: statusProp, children, ...props }, ref) => {
    const { task } = useTask(taskId)
    const status = statusProp || task?.status

    return (
      <div
        ref={ref}
        data-status={status}
        {...props}
      >
        {children || status}
      </div>
    )
  }
)
TaskStatus.displayName = 'TaskPrimitive.Status'

// Task progress indicator
export interface TaskProgressProps extends HTMLAttributes<HTMLDivElement> {
  taskId?: string
}

const TaskProgress = forwardRef<HTMLDivElement, TaskProgressProps>(
  ({ taskId, children, ...props }, ref) => {
    const { task } = useTask(taskId)
    const progress = task?.progress

    if (!progress) return null

    return (
      <div ref={ref} {...props}>
        {children || (
          <div>
            {progress.description && <div>{progress.description}</div>}
            {progress.percentage !== undefined && (
              <div>
                <div style={{ width: `${progress.percentage}%` }} />
                <span>{progress.percentage}%</span>
              </div>
            )}
            {progress.step !== undefined && progress.totalSteps !== undefined && (
              <div>Step {progress.step} of {progress.totalSteps}</div>
            )}
          </div>
        )}
      </div>
    )
  }
)
TaskProgress.displayName = 'TaskPrimitive.Progress'

// Task output/results
export interface TaskOutputProps extends HTMLAttributes<HTMLDivElement> {
  taskId?: string
}

const TaskOutput = forwardRef<HTMLDivElement, TaskOutputProps>(
  ({ taskId, children, ...props }, ref) => {
    const { task } = useTask(taskId)

    return (
      <div ref={ref} {...props}>
        {children || (
          <div>
            {task?.artifacts?.map((artifact, index) => (
              <div key={artifact.id || index}>
                <div>Type: {artifact.type}</div>
                {typeof artifact.content === 'string' ? (
                  <pre>{artifact.content}</pre>
                ) : (
                  <pre>{JSON.stringify(artifact.content, null, 2)}</pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)
TaskOutput.displayName = 'TaskPrimitive.Output'

// Cancel task button
export interface TaskCancelProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  taskId?: string
}

const TaskCancel = forwardRef<HTMLButtonElement, TaskCancelProps>(
  ({ taskId, onClick, children, ...props }, ref) => {
    const { task, cancelTask } = useTask(taskId)

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (taskId) {
        await cancelTask(taskId)
      }
      onClick?.(e)
    }

    const canCancel = task?.status === 'working' || task?.status === 'submitted'

    return (
      <button
        ref={ref}
        type="button"
        disabled={!canCancel}
        onClick={handleClick}
        {...props}
      >
        {children || 'Cancel'}
      </button>
    )
  }
)
TaskCancel.displayName = 'TaskPrimitive.Cancel'

// Conditional rendering based on task state
export interface TaskIfProps extends HTMLAttributes<HTMLDivElement> {
  taskId?: string
  status?: TaskStatus | TaskStatus[]
  hasError?: boolean
  isCompleted?: boolean
  isWorking?: boolean
}

const TaskIf = forwardRef<HTMLDivElement, TaskIfProps>(
  ({ 
    taskId, 
    status: statusProp, 
    hasError, 
    isCompleted, 
    isWorking, 
    children, 
    ...props 
  }, ref) => {
    const { task } = useTask(taskId)

    if (!task) return null

    // Check status condition
    if (statusProp) {
      const statuses = Array.isArray(statusProp) ? statusProp : [statusProp]
      if (!statuses.includes(task.status)) return null
    }

    // Check other conditions
    if (hasError !== undefined && Boolean(task.error) !== hasError) return null
    if (isCompleted !== undefined && (task.status === 'completed') !== isCompleted) return null
    if (isWorking !== undefined && (task.status === 'working') !== isWorking) return null

    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  }
)
TaskIf.displayName = 'TaskPrimitive.If'

// Export as namespace
export const TaskPrimitive = {
  Root: TaskRoot,
  Input: TaskInput,
  Send: TaskSend,
  Status: TaskStatus,
  Progress: TaskProgress,
  Output: TaskOutput,
  Cancel: TaskCancel,
  If: TaskIf,
}