import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

/**
 * Base error boundary interface for all component-level error boundaries
 */
export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  retryCount: number
  lastErrorTime: number
}

export interface ErrorBoundaryProps {
  // Error handling configuration
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void
  isolateErrors?: boolean
  maxRetries?: number
  retryDelay?: number
  
  // Component identification
  componentName?: string
  componentGroup?: 'agent-ui' | 'task' | 'chat' | 'artifact' | 'input' | 'block'
  
  // Development options
  showErrorDetails?: boolean
  enableRetry?: boolean
  
  children: ReactNode
}

export interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  componentName?: string
  componentGroup?: string
  retryCount: number
  maxRetries: number
  onRetry: () => void
  onReset: () => void
  showErrorDetails?: boolean
}

/**
 * Base error boundary class with common functionality
 */
export class BaseErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      lastErrorTime: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId,
      lastErrorTime: Date.now()
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, componentName, componentGroup } = this.props
    const { errorId } = this.state

    // Update state with error info
    this.setState({ errorInfo })

    // Call error handler if provided
    if (onError) {
      onError(error, errorInfo, errorId)
    }

    // Log error with context
    this.logError(error, errorInfo, errorId, componentName, componentGroup)

    // Report error to monitoring service if available
    this.reportError(error, errorInfo, errorId, componentName, componentGroup)
  }

  private logError(
    error: Error, 
    errorInfo: ErrorInfo, 
    errorId: string, 
    componentName?: string, 
    componentGroup?: string
  ) {
    const context = {
      errorId,
      componentName,
      componentGroup,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server'
    }

    console.group(`🚨 AgentUI Error Boundary [${componentGroup || 'unknown'}]`)
    console.error('Error:', error)
    console.error('Component Stack:', errorInfo.componentStack)
    console.error('Context:', context)
    console.groupEnd()
  }

  private reportError(
    error: Error, 
    errorInfo: ErrorInfo, 
    errorId: string, 
    componentName?: string, 
    componentGroup?: string
  ) {
    // In a real implementation, this would send to error monitoring service
    // like Sentry, Bugsnag, or custom error reporting endpoint
    
    if (typeof window !== 'undefined' && (window as any).__AGENT_UI_ERROR_REPORTER__) {
      try {
        (window as any).__AGENT_UI_ERROR_REPORTER__({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          errorInfo: {
            componentStack: errorInfo.componentStack
          },
          context: {
            errorId,
            componentName,
            componentGroup,
            timestamp: new Date().toISOString()
          }
        })
      } catch (reportingError) {
        console.warn('Failed to report error:', reportingError)
      }
    }
  }

  private handleRetry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props
    const { retryCount } = this.state

    if (retryCount >= maxRetries) {
      console.warn(`Max retries (${maxRetries}) exceeded for error boundary`)
      return
    }

    // Clear any existing retry timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }

    // Exponential backoff for retries
    const delay = retryDelay * Math.pow(2, retryCount)

    this.retryTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
        retryCount: prevState.retryCount + 1,
        lastErrorTime: 0
      }))
    }, delay)
  }

  private handleReset = () => {
    // Clear any existing retry timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      lastErrorTime: 0
    })
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  render() {
    const { hasError, error, errorInfo, errorId, retryCount } = this.state
    const { 
      fallback: FallbackComponent, 
      componentName, 
      componentGroup,
      maxRetries = 3,
      showErrorDetails = process.env.NODE_ENV === 'development',
      enableRetry = true,
      children 
    } = this.props

    if (hasError) {
      const fallbackProps: ErrorFallbackProps = {
        error,
        errorInfo,
        errorId,
        componentName,
        componentGroup,
        retryCount,
        maxRetries,
        onRetry: this.handleRetry,
        onReset: this.handleReset,
        showErrorDetails
      }

      if (FallbackComponent) {
        return <FallbackComponent {...fallbackProps} />
      }

      return (
        <DefaultErrorFallback 
          {...fallbackProps} 
          enableRetry={enableRetry}
        />
      )
    }

    return children
  }
}

/**
 * Default error fallback component
 */
interface DefaultErrorFallbackProps extends ErrorFallbackProps {
  enableRetry?: boolean
}

function DefaultErrorFallback({
  error,
  errorInfo,
  errorId,
  componentName,
  componentGroup,
  retryCount,
  maxRetries,
  onRetry,
  onReset,
  showErrorDetails,
  enableRetry = true
}: DefaultErrorFallbackProps) {
  const canRetry = enableRetry && retryCount < maxRetries

  return (
    <div className="border border-destructive/20 rounded-lg p-6 bg-destructive/5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <h3 className="font-semibold text-destructive">
            Something went wrong
            {componentName && ` in ${componentName}`}
          </h3>
          <p className="text-sm text-muted-foreground">
            {componentGroup && `Component group: ${componentGroup}`}
          </p>
        </div>
        {componentGroup && (
          <Badge variant="outline" className="ml-auto">
            {componentGroup}
          </Badge>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        <p>An unexpected error occurred while rendering this component.</p>
        {retryCount > 0 && (
          <p>Retry attempts: {retryCount}/{maxRetries}</p>
        )}
      </div>

      {showErrorDetails && error && (
        <details className="text-xs">
          <summary className="cursor-pointer font-medium text-destructive mb-2">
            Show error details
          </summary>
          <div className="space-y-2 pl-4 border-l-2 border-destructive/20">
            <div>
              <strong>Error:</strong> {error.message}
            </div>
            <div>
              <strong>Error ID:</strong> {errorId}
            </div>
            {error.stack && (
              <div>
                <strong>Stack trace:</strong>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                  {error.stack}
                </pre>
              </div>
            )}
            {errorInfo?.componentStack && (
              <div>
                <strong>Component stack:</strong>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
        </details>
      )}

      <div className="flex gap-2">
        {canRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/20 hover:bg-destructive/10"
          >
            Try Again ({maxRetries - retryCount} left)
          </Button>
        )}
        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
        >
          Reset Component
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        If this problem persists, please report it with the error ID: <code>{errorId}</code>
      </div>
    </div>
  )
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <BaseErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </BaseErrorBoundary>
  ))

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

/**
 * Hook to trigger error boundary from within components
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  const captureError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    setError(errorObj)
  }, [])

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  return { captureError, resetError }
}