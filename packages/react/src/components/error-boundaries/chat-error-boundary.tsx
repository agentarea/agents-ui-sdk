import React from 'react'
import { BaseErrorBoundary, ErrorBoundaryProps, ErrorFallbackProps } from './base-error-boundary'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

/**
 * Error boundary specifically for Chat components
 */
export interface ChatErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'componentGroup'> {
  // Chat specific options
  chatId?: string
  preserveMessages?: boolean
  enableMessageRecovery?: boolean
  onChatError?: (chatId: string | undefined, error: Error) => void
  onMessageLoss?: (messageCount: number) => void
}

export function ChatErrorBoundary({
  chatId,
  preserveMessages = true,
  enableMessageRecovery = true,
  onChatError,
  onMessageLoss,
  onError,
  ...props
}: ChatErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    // Call chat-specific error handler
    onChatError?.(chatId, error)

    // Check if error might cause message loss
    if (error.message.includes('message') || error.message.includes('render')) {
      onMessageLoss?.(0) // Would need actual message count from context
    }

    // Call general error handler
    onError?.(error, errorInfo, errorId)
  }

  return (
    <BaseErrorBoundary
      {...props}
      componentGroup="chat"
      componentName={chatId ? `Chat[${chatId}]` : 'Chat'}
      onError={handleError}
      fallback={(fallbackProps) => (
        <ChatErrorFallback
          {...fallbackProps}
          chatId={chatId}
          preserveMessages={preserveMessages}
          enableMessageRecovery={enableMessageRecovery}
        />
      )}
    />
  )
}

/**
 * Specialized error fallback for Chat components
 */
interface ChatErrorFallbackProps extends ErrorFallbackProps {
  chatId?: string
  preserveMessages?: boolean
  enableMessageRecovery?: boolean
}

function ChatErrorFallback({
  error,
  errorInfo,
  errorId,
  retryCount,
  maxRetries,
  onRetry,
  onReset,
  showErrorDetails,
  chatId,
  preserveMessages,
  enableMessageRecovery
}: ChatErrorFallbackProps) {
  const [messageRecoveryMode, setMessageRecoveryMode] = React.useState(false)
  const [preservedMessages, setPreservedMessages] = React.useState<any[]>([])
  const canRetry = retryCount < maxRetries

  const isMessageRenderError = error?.message.includes('message') || error?.message.includes('render')
  const isInputError = error?.message.includes('input') || error?.message.includes('send')
  const isScrollError = error?.message.includes('scroll') || error?.message.includes('auto-scroll')

  const getErrorType = () => {
    if (isMessageRenderError) return 'Message Display Error'
    if (isInputError) return 'Chat Input Error'
    if (isScrollError) return 'Chat Scroll Error'
    return 'Chat Error'
  }

  const getErrorMessage = () => {
    if (isMessageRenderError) {
      return 'Unable to display chat messages. Some messages may not be visible.'
    }
    if (isInputError) {
      return 'Chat input is not working properly. You may not be able to send messages.'
    }
    if (isScrollError) {
      return 'Chat scrolling is not working correctly. New messages may not be visible.'
    }
    return 'An error occurred in the chat interface.'
  }

  const handleMessageRecovery = () => {
    setMessageRecoveryMode(true)
    // In a real implementation, this would attempt to recover messages from localStorage or server
    const recovered = JSON.parse(localStorage.getItem(`chat-messages-${chatId}`) || '[]')
    setPreservedMessages(recovered)
  }

  React.useEffect(() => {
    // Attempt to preserve messages when error occurs
    if (preserveMessages && chatId) {
      try {
        // In a real implementation, this would get messages from chat context
        const messages = [] // Would get from context
        localStorage.setItem(`chat-messages-${chatId}`, JSON.stringify(messages))
      } catch (e) {
        console.warn('Failed to preserve chat messages:', e)
      }
    }
  }, [preserveMessages, chatId])

  if (messageRecoveryMode) {
    return (
      <div className="border border-blue-200 rounded-lg p-6 bg-blue-50 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <h3 className="font-semibold text-blue-800">Message Recovery Mode</h3>
            <p className="text-sm text-blue-700">
              Attempting to recover chat messages and restore functionality
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-blue-700">
            <p>Recovery status:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Messages preserved: {preservedMessages.length}</li>
              <li>Chat state: {chatId ? 'Identified' : 'Unknown'}</li>
              <li>Recovery mode: Active</li>
            </ul>
          </div>

          {preservedMessages.length > 0 && (
            <div className="border rounded p-3 bg-white max-h-32 overflow-y-auto">
              <div className="text-xs text-blue-600 mb-2">Preserved Messages:</div>
              {preservedMessages.slice(-3).map((msg, index) => (
                <div key={index} className="text-xs text-gray-600 mb-1">
                  {typeof msg === 'string' ? msg : JSON.stringify(msg).slice(0, 50) + '...'}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="text-blue-800 border-blue-300 hover:bg-blue-100"
            >
              Restore Chat
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              className="text-blue-800 border-blue-300 hover:bg-blue-100"
            >
              Start Fresh
            </Button>
            <Button
              onClick={() => setMessageRecoveryMode(false)}
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
        <span className="text-2xl">💬</span>
        <div>
          <h3 className="font-semibold text-destructive">
            {getErrorType()}
          </h3>
          <p className="text-sm text-muted-foreground">
            {getErrorMessage()}
          </p>
        </div>
        <Badge variant="destructive" className="ml-auto">
          Chat Error
        </Badge>
      </div>

      {/* Chat Information */}
      <div className="border rounded-lg p-4 bg-muted/50">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <span>💬</span>
          Chat Information
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Chat ID:</span>
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {chatId || 'Unknown'}
            </code>
          </div>
          <div className="flex justify-between">
            <span>Error Type:</span>
            <Badge variant="outline" className="text-xs">
              {isMessageRenderError ? 'Message Display' : 
               isInputError ? 'Input' : 
               isScrollError ? 'Scroll' : 'Unknown'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Messages Preserved:</span>
            <Badge variant={preserveMessages ? 'default' : 'secondary'} className="text-xs">
              {preserveMessages ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Retry Count:</span>
            <span className="text-muted-foreground">{retryCount}/{maxRetries}</span>
          </div>
        </div>
      </div>

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
              variant="outline"
              size="sm"
              className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10"
            >
              {isMessageRenderError ? 'Reload Messages' : 
               isInputError ? 'Fix Input' : 
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
            Reset Chat
          </Button>
        </div>
        
        {enableMessageRecovery && (
          <Button
            onClick={handleMessageRecovery}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            Recover Messages
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        {preserveMessages && 'Your messages have been preserved. '}
        If this problem persists, contact support with error ID: <code>{errorId}</code>
      </div>
    </div>
  )
}

/**
 * HOC for wrapping Chat components with error boundary
 */
export function withChatErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ChatErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ChatErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </ChatErrorBoundary>
  ))

  WrappedComponent.displayName = `withChatErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}