import React from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import type { EnhancedArtifact } from '@agentarea/core'

/**
 * Fallback renderer for unsupported artifact types
 */
export interface ArtifactFallbackProps {
  artifact: EnhancedArtifact
  error?: Error
  onDownload?: (artifact: EnhancedArtifact) => void
  onRetry?: () => void
  className?: string
}

export function ArtifactFallback({
  artifact,
  error,
  onDownload,
  onRetry,
  className
}: ArtifactFallbackProps) {
  const getArtifactIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝'
      case 'code': return '💻'
      case 'image': return '🖼️'
      case 'file': return '📎'
      case 'data': return '📊'
      case 'video': return '🎥'
      case 'audio': return '🎵'
      case 'pdf': return '📄'
      case 'archive': return '📦'
      default: return '❓'
    }
  }

  const getDisplayType = () => {
    return artifact.displayType || artifact.type || 'unknown'
  }

  const formatFileSize = (size?: number) => {
    if (!size) return 'Unknown size'
    
    const units = ['B', 'KB', 'MB', 'GB']
    let unitIndex = 0
    let fileSize = size

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024
      unitIndex++
    }

    return `${fileSize.toFixed(1)} ${units[unitIndex]}`
  }

  const canShowRawContent = () => {
    return typeof artifact.content === 'string' && artifact.content.length < 10000
  }

  const canDownload = () => {
    return artifact.downloadable !== false && onDownload
  }

  return (
    <div className={cn(
      "border rounded-lg p-4 bg-muted/30 space-y-3",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getArtifactIcon(getDisplayType())}</span>
        <div className="flex-1">
          <h4 className="font-medium">
            Unsupported Artifact Type
          </h4>
          <p className="text-sm text-muted-foreground">
            Cannot display {getDisplayType()} artifacts
          </p>
        </div>
        <Badge variant="secondary">
          {getDisplayType()}
        </Badge>
      </div>

      {/* Error Information */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">⚠️</span>
            <span className="text-sm font-medium text-destructive">Render Error</span>
          </div>
          <p className="text-xs text-destructive/80">
            {error.message}
          </p>
        </div>
      )}

      {/* Artifact Information */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">ID:</span>
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            {artifact.id || 'Unknown'}
          </code>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Type:</span>
          <span>{artifact.type}</span>
        </div>
        {artifact.displayType && artifact.displayType !== artifact.type && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Display Type:</span>
            <span>{artifact.displayType}</span>
          </div>
        )}
        {'size' in artifact && artifact.size && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Size:</span>
            <span>{formatFileSize(artifact.size as number)}</span>
          </div>
        )}
        {'createdAt' in artifact && artifact.createdAt && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span>{new Date(artifact.createdAt as string | number | Date).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Raw Content Preview */}
      {canShowRawContent() && (
        <details className="border rounded">
          <summary className="p-3 cursor-pointer font-medium hover:bg-muted/50">
            Show Raw Content
          </summary>
          <div className="p-3 pt-0">
            <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32">
              {typeof artifact.content === 'string' 
                ? artifact.content.slice(0, 1000) + (artifact.content.length > 1000 ? '...' : '')
                : JSON.stringify(artifact.content, null, 2).slice(0, 1000)
              }
            </pre>
          </div>
        </details>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
          >
            Try Again
          </Button>
        )}
        {canDownload() && (
          <Button
            onClick={() => onDownload!(artifact)}
            variant="outline"
            size="sm"
          >
            Download
          </Button>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground">
        This artifact type ({getDisplayType()}) is not supported by the current renderer. 
        {canDownload() && ' You can download it to view with an external application.'}
      </div>
    </div>
  )
}

/**
 * Fallback for failed artifact rendering
 */
export interface ArtifactRenderErrorFallbackProps {
  artifact: EnhancedArtifact
  error: Error
  onRetry?: () => void
  onDownload?: (artifact: EnhancedArtifact) => void
  className?: string
}

export function ArtifactRenderErrorFallback({
  artifact,
  error,
  onRetry,
  onDownload,
  className
}: ArtifactRenderErrorFallbackProps) {
  const [showRawData, setShowRawData] = React.useState(false)

  if (showRawData) {
    return (
      <div className={cn(
        "border rounded-lg p-4 bg-yellow-50 border-yellow-200 space-y-3",
        className
      )}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <h4 className="font-medium text-yellow-800">Raw Artifact Data</h4>
          <Button
            onClick={() => setShowRawData(false)}
            variant="ghost"
            size="sm"
            className="ml-auto"
          >
            ✕
          </Button>
        </div>
        
        <div className="border rounded p-3 bg-white max-h-64 overflow-auto">
          <pre className="text-xs">
            {JSON.stringify({
              id: artifact.id,
              type: artifact.type,
              displayType: artifact.displayType,
              content: typeof artifact.content === 'string' 
                ? artifact.content.slice(0, 500) + (artifact.content.length > 500 ? '...' : '')
                : artifact.content,
              metadata: artifact.metadata,
              error: error.message
            }, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "border border-destructive/20 rounded-lg p-4 bg-destructive/5 space-y-3",
      className
    )}>
      <div className="flex items-center gap-3">
        <span className="text-xl">⚠️</span>
        <div>
          <h4 className="font-medium text-destructive">
            Artifact Render Failed
          </h4>
          <p className="text-sm text-muted-foreground">
            {error.message}
          </p>
        </div>
      </div>

      <div className="text-sm space-y-1">
        <div><strong>Artifact ID:</strong> {artifact.id}</div>
        <div><strong>Type:</strong> {artifact.type}</div>
        <div><strong>Display Type:</strong> {artifact.displayType || 'Not specified'}</div>
      </div>

      <div className="flex gap-2">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
          >
            Retry Render
          </Button>
        )}
        <Button
          onClick={() => setShowRawData(true)}
          variant="outline"
          size="sm"
        >
          Show Raw Data
        </Button>
        {onDownload && artifact.downloadable !== false && (
          <Button
            onClick={() => onDownload(artifact)}
            variant="outline"
            size="sm"
          >
            Download
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Simple text fallback for any artifact
 */
export interface ArtifactTextFallbackProps {
  artifact: EnhancedArtifact
  maxLength?: number
  className?: string
}

export function ArtifactTextFallback({
  artifact,
  maxLength = 1000,
  className
}: ArtifactTextFallbackProps) {
  const getTextContent = () => {
    if (typeof artifact.content === 'string') {
      return artifact.content
    }
    
    try {
      return JSON.stringify(artifact.content, null, 2)
    } catch {
      return String(artifact.content)
    }
  }

  const textContent = getTextContent()
  const truncated = textContent.length > maxLength
  const displayContent = truncated ? textContent.slice(0, maxLength) + '...' : textContent

  return (
    <div className={cn(
      "border rounded-lg p-4 bg-background space-y-3",
      className
    )}>
      <div className="flex items-center gap-2">
        <span className="text-lg">📝</span>
        <h4 className="font-medium">Text Content</h4>
        <Badge variant="secondary" className="text-xs">
          Fallback Renderer
        </Badge>
      </div>

      <pre className="text-sm bg-muted p-3 rounded border overflow-auto max-h-64 whitespace-pre-wrap">
        {displayContent}
      </pre>

      {truncated && (
        <div className="text-xs text-muted-foreground">
          Content truncated. Showing first {maxLength} characters of {textContent.length}.
        </div>
      )}
    </div>
  )
}

/**
 * Hook to determine if an artifact type is supported
 */
export function useArtifactSupport() {
  const supportedTypes = React.useMemo(() => new Set([
    'text',
    'code', 
    'image',
    'file',
    'data'
  ]), [])

  const isSupported = React.useCallback((artifact: EnhancedArtifact) => {
    const type = artifact.displayType || artifact.type
    return supportedTypes.has(type)
  }, [supportedTypes])

  const getFallbackComponent = React.useCallback((artifact: EnhancedArtifact, error?: Error) => {
    if (error) {
      return ArtifactRenderErrorFallback
    }
    
    if (!isSupported(artifact)) {
      return ArtifactFallback
    }

    // Default to text fallback
    return ArtifactTextFallback
  }, [isSupported])

  return {
    isSupported,
    getFallbackComponent,
    supportedTypes: Array.from(supportedTypes)
  }
}