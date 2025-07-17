import React from 'react'
import { BaseErrorBoundary, ErrorBoundaryProps, ErrorFallbackProps } from './base-error-boundary'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

/**
 * Error boundary specifically for AgentUI main component and providers
 */
export interface AgentUIErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'componentGroup'> {
  // AgentUI specific options
  showConnectionStatus?: boolean
  showRuntimeInfo?: boolean
  enableOfflineMode?: boolean
  onConnectionError?: (error: Error) => void
  onRuntimeError?: (error: Error) => void
}

export function AgentUIErrorBoundary({
  showConnectionStatus = true,
  showRuntimeInfo = true,
  enableOfflineMode = true,
  onConnectionError,
  onRuntimeError,
  onError,
  ...props
}: AgentUIErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    // Call specific error handlers based on error type
    if (error.message.includes('connection') || error.message.includes('network')) {
      onConnectionError?.(error)
    } else if (error.message.includes('runtime') || error.message.includes('protocol')) {
      onRuntimeError?.(error)
    }

    // Call general error handler
    onError?.(error, errorInfo, errorId)
  }

  return (
    <BaseErrorBoundary
      {...props}
      componentGroup="agent-ui"
      componentName="AgentUI"
      onError={handleError}
      fallback={(fallbackProps) => (
        <AgentUIErrorFallback
          {...fallbackProps}
          showConnectionStatus={showConnectionStatus}
          showRuntimeInfo={showRuntimeInfo}
          enableOfflineMode={enableOfflineMode}
        />
      )}
    />
  )
}

/**
 * Specialized error fallback for AgentUI components
 */
interface AgentUIErrorFallbackProps extends ErrorFallbackProps {
  showConnectionStatus?: boolean
  showRuntimeInfo?: boolean
  enableOfflineMode?: boolean
}

function AgentUIErrorFallback({
  error,
  errorInfo,
  errorId,
  retryCount,
  maxRetries,
  onRetry,
  onReset,
  showErrorDetails,
  showConnectionStatus,
  showRuntimeInfo,
  enableOfflineMode
}: AgentUIErrorFallbackProps) {
  const [offlineMode, setOfflineMode] = React.useState(false)
  const canRetry = retryCount < maxRetries

  const isConnectionError = error?.message.includes('connection') || error?.message.includes('network')
  const isRuntimeError = error?.message.includes('runtime') || error?.message.includes('protocol')

  const getErrorType = () => {
    if (isConnectionError) return 'Connection Error'
    if (isRuntimeError) return 'Runtime Error'
    return 'Application Error'
  }

  const getErrorIcon = () => {
    if (isConnectionError) return '🔌'
    if (isRuntimeError) return '⚙️'
    return '⚠️'
  }

  const getErrorMessage = () => {
    if (isConnectionError) {
      return 'Unable to connect to the agent service. Please check your network connection.'
    }
    if (isRuntimeError) {
      return 'There was an issue with the agent runtime. The service may be temporarily unavailable.'
    }
    return 'An unexpected error occurred in the AgentUI application.'
  }

  const handleOfflineMode = () => {
    setOfflineMode(true)
  }

  if (offlineMode) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">📱</div>
          <h2 className="text-xl font-semibold">Offline Mode</h2>
          <p className="text-muted-foreground">
            You're currently using AgentUI in offline mode. Some features may be limited.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setOfflineMode(false)} variant="outline">
              Try Reconnecting
            </Button>
            <Button onClick={onReset}>
              Restart Application
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="text-6xl">{getErrorIcon()}</div>
          <div>
            <h2 className="text-xl font-semibold text-destructive">
              {getErrorType()}
            </h2>
            <p className="text-muted-foreground mt-2">
              {getErrorMessage()}
            </p>
          </div>
        </div>

        {/* Connection Status */}
        {showConnectionStatus && isConnectionError && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <span>🔍</span>
              Connection Diagnostics
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Network Status:</span>
                <Badge variant={navigator.onLine ? 'default' : 'destructive'}>
                  {navigator.onLine ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Service Status:</span>
                <Badge variant="destructive">Unavailable</Badge>
              </div>
              <div className="flex justify-between">
                <span>Last Attempt:</span>
                <span className="text-muted-foreground">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Runtime Information */}
        {showRuntimeInfo && isRuntimeError && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <span>⚙️</span>
              Runtime Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Runtime Type:</span>
                <span className="text-muted-foreground">Unknown</span>
              </div>
              <div className="flex justify-between">
                <span>Protocol Version:</span>
                <span className="text-muted-foreground">Unknown</span>
              </div>
              <div className="flex justify-between">
                <span>Error Count:</span>
                <Badge variant="destructive">{retryCount + 1}</Badge>
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
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {canRetry && (
              <Button
                onClick={onRetry}
                className="flex-1"
                variant={isConnectionError ? 'default' : 'outline'}
              >
                {isConnectionError ? 'Retry Connection' : 'Try Again'}
                {maxRetries - retryCount > 0 && ` (${maxRetries - retryCount} left)`}
              </Button>
            )}
            <Button
              onClick={onReset}
              variant="outline"
              className="flex-1"
            >
              Restart
            </Button>
          </div>
          
          {enableOfflineMode && isConnectionError && (
            <Button
              onClick={handleOfflineMode}
              variant="secondary"
              className="w-full"
            >
              Continue in Offline Mode
            </Button>
          )}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          If this problem persists, please contact support with error ID: <code>{errorId}</code>
        </div>
      </div>
    </div>
  )
}

/**
 * HOC for wrapping AgentUI components with error boundary
 */
export function withAgentUIErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<AgentUIErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <AgentUIErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </AgentUIErrorBoundary>
  ))

  WrappedComponent.displayName = `withAgentUIErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}