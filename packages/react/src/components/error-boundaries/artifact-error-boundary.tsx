import React from 'react'
import { BaseErrorBoundary, ErrorBoundaryProps, ErrorFallbackProps } from './base-error-boundary'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

/**
 * Error boundary specifically for Artifact components
 */
export interface ArtifactErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'componentGroup'> {
  // Artifact specific options
  artifactId?: string
  artifactType?: string
  enableFallbackRenderer?: boolean
  showRawData?: boolean
  onArtifactError?: (artifactId: string | undefined, artifactType: string | undefined, error: Error) => void
}

export function ArtifactErrorBoundary({
  artifactId,
  artifactType,
  enableFallbackRenderer = true,
  showRawData = true,
  onArtifactError,
  onError,
  ...props
}: ArtifactErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    // Call artifact-specific error handler
    onArtifactError?.(artifactId, artifactType, error)

    // Call general error handler
    onError?.(error, errorInfo, errorId)
  }

  return (
    <BaseErrorBoundary
      {...props}
      componentGroup="artifact"
      componentName={artifactId ? `Artifact[${artifactId}]` : 'Artifact'}
      onError={handleError}
      fallback={(fallbackProps) => (
        <ArtifactErrorFallback
          {...fallbackProps}
          artifactId={artifactId}
          artifactType={artifactType}
          enableFallbackRenderer={enableFallbackRenderer}
          showRawData={showRawData}
        />
      )}
    />
  )
}

/**
 * Specialized error fallback for Artifact components
 */
interface ArtifactErrorFallbackProps extends ErrorFallbackProps {
  artifactId?: string
  artifactType?: string
  enableFallbackRenderer?: boolean
  showRawData?: boolean
}

function ArtifactErrorFallback({
  error,
  errorInfo,
  errorId,
  retryCount,
  maxRetries,
  onRetry,
  onReset,
  showErrorDetails,
  artifactId,
  artifactType,
  enableFallbackRenderer,
  showRawData
}: ArtifactErrorFallbackProps) {
  const [fallbackMode, setFallbackMode] = React.useState(false)
  const [rawDataMode, setRawDataMode] = React.useState(false)
  const canRetry = retryCount < maxRetries

  const isRenderError = error?.message.includes('render') || error?.message.includes('display')
  const isDownloadError = error?.message.includes('download') || error?.message.includes('fetch')
  const isPreviewError = error?.message.includes('preview') || error?.message.includes('thumbnail')

  const getErrorType = () => {
    if (isRenderError) return 'Artifact Render Error'
    if (isDownloadError) return 'Artifact Download Error'
    if (isPreviewError) return 'Artifact Preview Error'
    return 'Artifact Error'
  }

  const getErrorMessage = () => {
    if (isRenderError) {
      return 'Unable to display this artifact. The content may be corrupted or in an unsupported format.'
    }
    if (isDownloadError) {
      return 'Failed to download the artifact. Please check your connection and try again.'
    }
    if (isPreviewError) {
      return 'Cannot generate preview for this artifact. You can still try to download it.'
    }
    return 'An error occurred while processing the artifact.'
  }

  const getArtifactIcon = (type?: string) => {
    switch (type) {
      case 'text': return '📝'
      case 'code': return '💻'
      case 'image': return '🖼️'
      case 'file': return '📎'
      case 'data': return '📊'
      default: return '📄'
    }
  }

  const handleFallbackRenderer = () => {
    setFallbackMode(true)
  }

  const handleRawDataMode = () => {
    setRawDataMode(true)
  }

  if (rawDataMode) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <h4 className="font-medium">Raw Artifact Data</h4>
          <Badge variant="secondary" className="text-xs">Debug Mode</Badge>
        </div>
        
        <div className="text-sm text-gray-600">
          Displaying raw artifact data for debugging purposes.
        </div>
        
        <div className="border rounded p-3 bg-white max-h-64 overflow-auto">
          <pre className="text-xs text-gray-800">
            {JSON.stringify({
              id: artifactId,
              type: artifactType,
              error: error?.message,
              timestamp: new Date().toISOString()
            }, null, 2)}
          </pre>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setRawDataMode(false)}
            variant="outline"
            size="sm"
          >
            Back to Error View
          </Button>
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
          >
            Retry Render
          </Button>
        </div>
      </div>
    )
  }

  if (fallbackMode) {
    return (
      <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getArtifactIcon(artifactType)}</span>
          <h4 className="font-medium text-yellow-800">Fallback Renderer</h4>
          <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
            {artifactType || 'Unknown'}
          </Badge>
        </div>
        
        <div className="text-sm text-yellow-700">
          Using basic fallback renderer for this artifact. Some features may not be available.
        </div>
        
        <div className="border rounded p-3 bg-white">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between mb-2">
              <span>Artifact ID:</span>
              <code className="text-xs">{artifactId || 'Unknown'}</code>
            </div>
            <div className="flex justify-between mb-2">
              <span>Type:</span>
              <span>{artifactType || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <Badge variant="secondary" className="text-xs">Fallback Mode</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
          >
            Try Normal Renderer
          </Button>
          <Button
            onClick={() => setFallbackMode(false)}
            variant="ghost"
            size="sm"
          >
            Back to Error
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-xl">{getArtifactIcon(artifactType)}</span>
        <div>
          <h3 className="font-semibold text-destructive">
            {getErrorType()}
          </h3>
          <p className="text-sm text-muted-foreground">
            {getErrorMessage()}
          </p>
        </div>
        <Badge variant="destructive" className="ml-auto">
          Artifact Error
        </Badge>
      </div>

      {/* Artifact Information */}
      <div className="border rounded-lg p-3 bg-muted/50">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <span>{getArtifactIcon(artifactType)}</span>
          Artifact Information
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Artifact ID:</span>
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {artifactId || 'Unknown'}
            </code>
          </div>
          <div className="flex justify-between">
            <span>Type:</span>
            <Badge variant="outline" className="text-xs">
              {artifactType || 'Unknown'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Error Category:</span>
            <Badge variant="outline" className="text-xs">
              {isRenderError ? 'Render' : 
               isDownloadError ? 'Download' : 
               isPreviewError ? 'Preview' : 'Unknown'}
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
          <summary className="p-3 cursor-pointer font-medium hover:bg-muted/50">
            Technical Details
          </summary>
          <div className="p-3 pt-0 space-y-2 text-sm">
            <div>
              <strong>Error ID:</strong> <code className="text-xs">{errorId}</code>
            </div>
            <div>
              <strong>Message:</strong> {error.message}
            </div>
            {error.stack && (
              <div>
                <strong>Stack Trace:</strong>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-24">
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
              {isRenderError ? 'Retry Render' : 
               isDownloadError ? 'Retry Download' : 
               isPreviewError ? 'Retry Preview' : 
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
            Reset
          </Button>
        </div>
        
        <div className="flex gap-2">
          {enableFallbackRenderer && (
            <Button
              onClick={handleFallbackRenderer}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              Use Fallback Renderer
            </Button>
          )}
          {showRawData && (
            <Button
              onClick={handleRawDataMode}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              Show Raw Data
            </Button>
          )}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        If this artifact continues to fail, it may be corrupted or in an unsupported format. 
        Error ID: <code>{errorId}</code>
      </div>
    </div>
  )
}

/**
 * HOC for wrapping Artifact components with error boundary
 */
export function withArtifactErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ArtifactErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ArtifactErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </ArtifactErrorBoundary>
  ))

  WrappedComponent.displayName = `withArtifactErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}