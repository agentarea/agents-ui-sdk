import * as React from "react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { EnhancedArtifact } from "@agentarea/core"
import { ArtifactContainer } from "./artifact-container"

export interface ArtifactFileProps extends React.HTMLAttributes<HTMLDivElement> {
  artifact: EnhancedArtifact
  showPreview?: boolean
  maxPreviewSize?: number
  onDownload?: (artifact: EnhancedArtifact) => void
  onShare?: (artifact: EnhancedArtifact) => void
  onPreview?: (artifact: EnhancedArtifact) => void
}

const ArtifactFile = React.forwardRef<HTMLDivElement, ArtifactFileProps>(
  ({ 
    artifact,
    showPreview = true,
    maxPreviewSize = 5 * 1024 * 1024, // 5MB
    onDownload,
    onShare,
    onPreview,
    className,
    ...props 
  }, ref) => {
    const fileData = React.useMemo(() => {
      let file: any = {}
      
      if (artifact.content && typeof artifact.content === 'object') {
        if ('file' in artifact.content) {
          file = (artifact.content as any).file
        } else {
          file = artifact.content
        }
      }
      
      return {
        name: file.name || artifact.metadata?.name as string || 'Unknown file',
        url: file.url || artifact.metadata?.url as string,
        size: file.size || artifact.size || 0,
        mimeType: file.mimeType || artifact.mimeType || 'application/octet-stream'
      }
    }, [artifact.content, artifact.metadata, artifact.size, artifact.mimeType])

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 Bytes"
      const k = 1024
      const sizes = ["Bytes", "KB", "MB", "GB"]
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    const getFileIcon = (mimeType: string, fileName: string) => {
      // Check by MIME type first
      if (mimeType.startsWith("image/")) return "🖼️"
      if (mimeType.startsWith("video/")) return "🎥"
      if (mimeType.startsWith("audio/")) return "🎵"
      if (mimeType.includes("pdf")) return "📄"
      if (mimeType.includes("zip") || mimeType.includes("archive")) return "📦"
      if (mimeType.includes("text")) return "📝"
      if (mimeType.includes("json")) return "📊"
      if (mimeType.includes("xml")) return "📋"
      
      // Check by file extension
      const ext = fileName.split('.').pop()?.toLowerCase()
      switch (ext) {
        case 'js': case 'jsx': case 'ts': case 'tsx': return "💻"
        case 'py': return "🐍"
        case 'java': return "☕"
        case 'html': case 'htm': return "🌐"
        case 'css': return "🎨"
        case 'md': case 'markdown': return "📝"
        case 'doc': case 'docx': return "📄"
        case 'xls': case 'xlsx': return "📊"
        case 'ppt': case 'pptx': return "📽️"
        default: return "📎"
      }
    }

    const getFileTypeColor = (mimeType: string) => {
      if (mimeType.startsWith("image/")) return "text-green-600"
      if (mimeType.startsWith("video/")) return "text-purple-600"
      if (mimeType.startsWith("audio/")) return "text-blue-600"
      if (mimeType.includes("pdf")) return "text-red-600"
      if (mimeType.includes("text")) return "text-gray-600"
      if (mimeType.includes("json")) return "text-yellow-600"
      return "text-gray-500"
    }

    const canPreview = showPreview && 
                      fileData.size <= maxPreviewSize && 
                      (fileData.mimeType.startsWith('image/') || 
                       fileData.mimeType.startsWith('text/') ||
                       fileData.mimeType.includes('json'))

    const actions = (
      <>
        <Badge variant="outline" className="text-xs">
          <span className={cn("font-mono", getFileTypeColor(fileData.mimeType))}>
            {fileData.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
          </span>
        </Badge>
        {canPreview && onPreview && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(artifact)}
            className="h-8"
          >
            👁️ Preview
          </Button>
        )}
      </>
    )

    return (
      <ArtifactContainer
        ref={ref}
        artifact={artifact}
        onDownload={onDownload}
        onShare={onShare}
        actions={actions}
        className={className}
        {...props}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <span className="text-4xl">
              {getFileIcon(fileData.mimeType, fileData.name)}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-base mb-1 truncate">
              {fileData.name}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{formatFileSize(fileData.size)}</span>
              <span className="truncate">{fileData.mimeType}</span>
            </div>
            
            {fileData.url && (
              <div className="mt-2">
                <a 
                  href={fileData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline truncate block"
                >
                  {fileData.url}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Image preview */}
        {canPreview && fileData.mimeType.startsWith('image/') && fileData.url && (
          <div className="mt-4 border rounded-lg overflow-hidden">
            <img 
              src={fileData.url}
              alt={fileData.name}
              className="w-full h-auto max-h-64 object-contain bg-muted"
              loading="lazy"
            />
          </div>
        )}
      </ArtifactContainer>
    )
  }
)
ArtifactFile.displayName = "Artifact.File"

export { ArtifactFile }