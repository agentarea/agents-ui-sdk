import React from 'react'
import { BaseErrorBoundary, ErrorBoundaryProps, ErrorFallbackProps } from './base-error-boundary'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

/**
 * Error boundary specifically for Task components
 */
export interface TaskErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'componentGroup'> {
  // Task specific options
  taskId?: string
  showTaskInfo?: boolean
  enableTaskRecovery?: boolean
  onTaskError?: (taskId: string | undefined, error: Error) => void
}

export function TaskErrorBoundary({
  taskId,
  showTaskInfo = true,
  enableTaskRecovery = true,
  onTaskError,
  onError,
  ...props
}: TaskErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    // Call task-specific error handler
    onTaskError?.(taskId, error)

    // Call general error handler
    onError?.(error, errorInfo, errorId)
  }

  return (
    <BaseErrorBoundary
      {...props}
      componentGroup="task"
      componentName={taskId ? `Task[${taskId}]` : 'Task'}
      onError={handleError}
      fallback={(fallbackProps) => (
        <TaskErrorFallback
          {...fallbackProps}
          taskId={taskId}
          showTaskInfo={showTaskInfo}
          enableTaskRecovery={enableTaskRecovery}
        />
      )}
    />
  )
}

/**
 * Specialized error fallback for Task components
 */
interface TaskErrorFallbackProps extends ErrorFallbackProps {
  taskId?: string
  showTaskInfo?: boolean
  enableTaskRecovery?: boolean
}

function TaskErrorFallback({
  error,
  errorInfo,
  errorId,
  retryCount,
  maxRetries,
  onRetry,
  onReset,
  showErrorDetails,
  taskId,
  showTaskInfo,
  enableTaskRecovery
}: TaskErrorFallbackProps) {
  const [recoveryMode, setRecoveryMode] = React.useState(false)
  const canRetry = retryCount < maxRetries

  const isTaskSubmissionError = error?.message.includes('submit') || error?.message.includes('create')
  const isTaskUpdateError = error?.message.includes('update') || error?.message.includes('progress')
  const isTaskRenderError = error?.message.includes('render') || error?.message.includes('display')

  const getErrorType = () => {
    if (isTaskSubmissionError) return 'Task Submission Error'
    if (isTaskUpdateError) return 'Task Update Error'
    if (isTaskRenderError) return 'Task Display Error'
    return 'Task Error'
  }

  const getErrorMessage = () => {
    if (isTaskSubmissionError) {
      return 'Failed to submit the task. Please check your connection and try again.'
    }
    if (isTaskUpdateError) {
      return 'Unable to update task status. The task may still be running in the background.'
    }
    if (isTaskRenderError) {
      return 'Error displaying task content. The task data may be corrupted or incomplete.'
    }
    return 'An error occurred while processing the task.'
  }

  const handleRecoveryMode = () => {
    setRecoveryMode(true)
  }

  if (recoveryMode) {
    return (
      <div className="border border-yellow-200 rounded-lg p-6 bg-yellow-50 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔧</span>
          <div>
            <h3 className="font-semibold text-yellow-800">Task Recovery Mode</h3>
            <p className="text-sm text-yellow-700">
              Attempting to recover task data and functionality
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-yellow-700">
            <p>Recovery options:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Reload task data from server</li>
              <li>Reset task to last known good state</li>
              <li>Create new task with same parameters</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
            >
              Reload Task Data
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
            >
              Reset Task
            </Button>
            <Button
              onClick={() => setRecoveryMode(false)}
              variant="ghost"
              size="sm"
            >
              Cancel Recovery
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-destructive/20 rounded-lg p-6 bg-destructive/5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📋</span>
        <div>
          <h3 className="font-semibold text-destructive">
            {getErrorType()}
          </h3>
          <p className="text-sm text-muted-foreground">
            {getErrorMessage()}
          </p>
        </div>
        <Badge variant="destructive" className="ml-auto">
          Task Error
        </Badge>
      </div>

      {/* Task Information */}
      {showTaskInfo && (
        <div className="border rounded-lg p-4 bg-muted/50">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <span>📋</span>
            Task Information
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Task ID:</span>
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                {taskId || 'Unknown'}
              </code>
            </div>
            <div className="flex justify-between">
              <span>Error Type:</span>
              <Badge variant="outline" className="text-xs">
                {isTaskSubmissionError ? 'Submission' : 
                 isTaskUpdateError ? 'Update' : 
                 isTaskRenderError ? 'Render' : 'Unknown'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Retry Count:</span>
              <span className="text-muted-foreground">{retryCount}/{maxRetries}</span>
            </div>
            <div className="flex justify-between">
              <span>Timestamp:</span>
              <span className="text-muted-foreground">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Details */}
      {showErrorDetails && error && (
        <details className="border rounded-lg">
          <summary className="p-4 cursor-pointer font-medium hover:bg-muted/50">
            Technical Details
          </summary>
          <div className="p-4 pt-0 space-y-2 text-sm">
            <div>
              <strong>Error ID:</strong> <code className="text-xs">{errorId}</code>
            </div>
            <div>
              <strong>Message:</strong> {error.message}
            </div>
            {error.stack && (
              <div>
                <strong>Stack Trace:</strong>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                  {error.stack}
                </pre>
              </div>
            )}
            {errorInfo?.componentStack && (
              <div>
                <strong>Component Stack:</strong>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
        </details>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {canRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10"
            >
              {isTaskSubmissionError ? 'Retry Submission' : 
               isTaskUpdateError ? 'Refresh Task' : 
               'Try Again'}
              {maxRetries - retryCount > 0 && ` (${maxRetries - retryCount} left)`}
            </Button>
          )}
          <Button
            onClick={onReset}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Reset Task
          </Button>
        </div>
        
        {enableTaskRecovery && (
          <Button
            onClick={handleRecoveryMode}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            Enter Recovery Mode
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        If this task continues to fail, try refreshing the page or contact support with error ID: <code>{errorId}</code>
      </div>
    </div>
  )
}

/**
 * HOC for wrapping Task components with error boundary
 */
export function withTaskErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<TaskErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <TaskErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </TaskErrorBoundary>
  ))

  WrappedComponent.displayName = `withTaskErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}