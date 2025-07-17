import React from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { ErrorMessages } from '../../lib/fallback-utils'

/**
 * Comprehensive error message component with actionable guidance
 */
export interface ErrorMessageProps {
  error: Error
  title?: string
  context?: string
  showDetails?: boolean
  showGuidance?: boolean
  onRetry?: () => void
  onReport?: (error: Error) => void
  onDismiss?: () => void
  className?: string
}

export function ErrorMessage({
  error,
  title,
  context,
  showDetails = false,
  showGuidance = true,
  onRetry,
  onReport,
  onDismiss,
  className
}: ErrorMessageProps) {
  const [detailsExpanded, setDetailsExpanded] = React.useState(false)
  const [guidanceExpanded, setGuidanceExpanded] = React.useState(false)

  const severity = ErrorMessages.getErrorSeverity(error)
  const userMessage = ErrorMessages.getUserFriendlyMessage(error)
  const guidance = ErrorMessages.getActionableGuidance(error)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-800 bg-red-50 border-red-200'
      case 'high': return 'text-red-700 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-700 bg-blue-50 border-blue-200'
      default: return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '⚡'
      case 'low': return 'ℹ️'
      default: return '❓'
    }
  }

  return (
    <div className={cn(
      "border rounded-lg p-4 space-y-4",
      getSeverityColor(severity),
      className
    )}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-xl">{getSeverityIcon(severity)}</span>
        <div className="flex-1">
          <h3 className="font-semibold">
            {title || 'Error Occurred'}
          </h3>
          <p className="text-sm mt-1">
            {userMessage}
          </p>
          {context && (
            <p className="text-xs mt-1 opacity-80">
              Context: {context}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {severity.toUpperCase()}
          </Badge>
          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          )}
        </div>
      </div>

      {/* Actionable Guidance */}
      {showGuidance && guidance.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setGuidanceExpanded(!guidanceExpanded)}
            className="flex items-center gap-2 text-sm font-medium hover:underline"
          >
            <span>{guidanceExpanded ? '▼' : '▶'}</span>
            What can I do?
          </button>
          
          {guidanceExpanded && (
            <div className="pl-6 space-y-1">
              {guidance.map((item, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-xs mt-0.5">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Technical Details */}
      {showDetails && (
        <div className="space-y-2">
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="flex items-center gap-2 text-sm font-medium hover:underline"
          >
            <span>{detailsExpanded ? '▼' : '▶'}</span>
            Technical Details
          </button>
          
          {detailsExpanded && (
            <div className="pl-6 space-y-2 text-sm">
              <div>
                <strong>Error:</strong> {error.message}
              </div>
              <div>
                <strong>Type:</strong> {error.name}
              </div>
              <div>
                <strong>Timestamp:</strong> {new Date().toLocaleString()}
              </div>
              {error.stack && (
                <div>
                  <strong>Stack Trace:</strong>
                  <pre className="mt-1 p-2 bg-white/50 rounded text-xs overflow-auto max-h-32 border">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
          >
            Try Again
          </Button>
        )}
        {onReport && (
          <Button
            onClick={() => onReport(error)}
            size="sm"
            variant="outline"
          >
            Report Issue
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Network error specific message
 */
export interface NetworkErrorMessageProps {
  error: Error
  onRetry?: () => void
  onOfflineMode?: () => void
  className?: string
}

export function NetworkErrorMessage({
  error,
  onRetry,
  onOfflineMode,
  className
}: NetworkErrorMessageProps) {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className={cn(
      "border border-orange-200 rounded-lg p-4 bg-orange-50 space-y-4",
      className
    )}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">🌐</span>
        <div>
          <h3 className="font-semibold text-orange-800">
            Network Connection Issue
          </h3>
          <p className="text-sm text-orange-700">
            {isOnline 
              ? 'Unable to reach the server. Please check your connection.'
              : 'You appear to be offline. Please check your internet connection.'
            }
          </p>
        </div>
        <Badge variant={isOnline ? 'default' : 'destructive'} className="ml-auto">
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
      </div>

      <div className="text-sm text-orange-700">
        <p className="font-medium mb-2">What you can try:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Check your internet connection</li>
          <li>Try refreshing the page</li>
          <li>Check if the service is experiencing issues</li>
          {onOfflineMode && <li>Continue in offline mode with limited features</li>}
        </ul>
      </div>

      <div className="flex gap-2">
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Retry Connection
          </Button>
        )}
        {onOfflineMode && (
          <Button
            onClick={onOfflineMode}
            size="sm"
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            Continue Offline
          </Button>
        )}
      </div>

      <div className="text-xs text-orange-600">
        Error: {error.message}
      </div>
    </div>
  )
}

/**
 * Permission error specific message
 */
export interface PermissionErrorMessageProps {
  error: Error
  resource?: string
  onLogin?: () => void
  onContactSupport?: () => void
  className?: string
}

export function PermissionErrorMessage({
  error,
  resource,
  onLogin,
  onContactSupport,
  className
}: PermissionErrorMessageProps) {
  return (
    <div className={cn(
      "border border-red-200 rounded-lg p-4 bg-red-50 space-y-4",
      className
    )}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">🔒</span>
        <div>
          <h3 className="font-semibold text-red-800">
            Access Denied
          </h3>
          <p className="text-sm text-red-700">
            You don't have permission to access {resource || 'this resource'}.
          </p>
        </div>
      </div>

      <div className="text-sm text-red-700">
        <p className="font-medium mb-2">Possible solutions:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Log out and log back in to refresh your session</li>
          <li>Check if your account has the necessary permissions</li>
          <li>Contact an administrator for access</li>
          <li>Verify that your session hasn't expired</li>
        </ul>
      </div>

      <div className="flex gap-2">
        {onLogin && (
          <Button
            onClick={onLogin}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Log In Again
          </Button>
        )}
        {onContactSupport && (
          <Button
            onClick={onContactSupport}
            size="sm"
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Contact Support
          </Button>
        )}
      </div>

      <div className="text-xs text-red-600">
        Error: {error.message}
      </div>
    </div>
  )
}

/**
 * Generic fallback message for unknown errors
 */
export interface GenericErrorMessageProps {
  error: Error
  componentName?: string
  onRetry?: () => void
  onReset?: () => void
  onReport?: (error: Error) => void
  className?: string
}

export function GenericErrorMessage({
  error,
  componentName,
  onRetry,
  onReset,
  onReport,
  className
}: GenericErrorMessageProps) {
  const errorId = React.useMemo(() => 
    `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    []
  )

  return (
    <div className={cn(
      "border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4",
      className
    )}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">❓</span>
        <div>
          <h3 className="font-semibold text-gray-800">
            Unexpected Error
            {componentName && ` in ${componentName}`}
          </h3>
          <p className="text-sm text-gray-600">
            Something went wrong, but we're not sure what.
          </p>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p className="font-medium mb-2">What you can try:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Refresh the page or component</li>
          <li>Clear your browser cache</li>
          <li>Try again in a few minutes</li>
          <li>Contact support if the problem persists</li>
        </ul>
      </div>

      <div className="flex gap-2">
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
          >
            Try Again
          </Button>
        )}
        {onReset && (
          <Button
            onClick={onReset}
            size="sm"
            variant="outline"
          >
            Reset
          </Button>
        )}
        {onReport && (
          <Button
            onClick={() => onReport(error)}
            size="sm"
            variant="outline"
          >
            Report Issue
          </Button>
        )}
      </div>

      <div className="text-xs text-gray-500">
        Error ID: <code>{errorId}</code> | {error.message}
      </div>
    </div>
  )
}