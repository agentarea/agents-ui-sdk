import * as React from "react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { EnhancedArtifact } from "@agentarea/core"

export interface ArtifactContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  artifact: EnhancedArtifact
  collapsible?: boolean
  defaultExpanded?: boolean
  showMetadata?: boolean
  showTimestamp?: boolean
  onDownload?: (artifact: EnhancedArtifact) => void
  onShare?: (artifact: EnhancedArtifact) => void
  actions?: React.ReactNode
}

const ArtifactContainer = React.forwardRef<HTMLDivElement, ArtifactContainerProps>(
  ({ 
    artifact,
    collapsible = false,
    defaultExpanded = true,
    showMetadata = true,
    showTimestamp = true,
    onDownload,
    onShare,
    actions,
    children,
    className,
    ...props 
  }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

    const formatFileSize = (bytes?: number) => {
      if (!bytes) return ""
      if (bytes === 0) return "0 Bytes"
      const k = 1024
      const sizes = ["Bytes", "KB", "MB", "GB"]
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    const formatTimestamp = (date?: Date) => {
      if (!date) return ""
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    }

    const getArtifactIcon = (displayType: string) => {
      switch (displayType) {
        case 'code': return "💻"
        case 'file': return "📎"
        case 'image': return "🖼️"
        case 'data': return "📊"
        case 'text': return "📝"
        default: return "📄"
      }
    }

    const canDownload = artifact.downloadable !== false && onDownload
    const canShare = artifact.shareable !== false && onShare

    return (
      <div 
        ref={ref}
        className={cn(
          "border rounded-lg bg-background shadow-sm",
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-lg flex-shrink-0">
              {getArtifactIcon(artifact.displayType)}
            </span>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">
                  {artifact.metadata?.name as string || `${artifact.displayType} artifact`}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {artifact.displayType}
                </Badge>
              </div>
              
              {showMetadata && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {artifact.size && (
                    <span>{formatFileSize(artifact.size)}</span>
                  )}
                  {artifact.mimeType && (
                    <span>{artifact.mimeType}</span>
                  )}
                  {showTimestamp && artifact.createdAt && (
                    <span>{formatTimestamp(artifact.createdAt)}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Custom actions */}
            {actions}
            
            {/* Download button */}
            {canDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(artifact)}
                className="h-8"
              >
                ⬇️ Download
              </Button>
            )}
            
            {/* Share button */}
            {canShare && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShare(artifact)}
                className="h-8"
              >
                🔗 Share
              </Button>
            )}
            
            {/* Collapse/Expand button */}
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? "−" : "+"}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {(!collapsible || isExpanded) && (
          <div 
            className={cn(
              "transition-all duration-200 ease-in-out",
              collapsible && !isExpanded && "max-h-0 overflow-hidden opacity-0",
              collapsible && isExpanded && "max-h-none opacity-100"
            )}
          >
            <div className="p-4">
              {children}
            </div>
          </div>
        )}

        {/* Metadata footer (optional) */}
        {showMetadata && artifact.metadata && Object.keys(artifact.metadata).length > 1 && (
          <div className="border-t p-3 bg-muted/30">
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Metadata
                <span className="ml-1 group-open:rotate-90 transition-transform inline-block">▶</span>
              </summary>
              <div className="mt-2 text-xs">
                <pre className="bg-background p-2 rounded border text-xs overflow-auto">
                  {JSON.stringify(artifact.metadata, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>
    )
  }
)
ArtifactContainer.displayName = "Artifact.Container"

export { ArtifactContainer }