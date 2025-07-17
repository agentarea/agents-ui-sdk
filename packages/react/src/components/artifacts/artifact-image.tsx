import * as React from "react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { EnhancedArtifact } from "@agentarea/core"
import { ArtifactContainer } from "./artifact-container"

export interface ArtifactImageProps extends React.HTMLAttributes<HTMLDivElement> {
  artifact: EnhancedArtifact
  maxWidth?: number
  maxHeight?: number
  showDimensions?: boolean
  onDownload?: (artifact: EnhancedArtifact) => void
  onShare?: (artifact: EnhancedArtifact) => void
}

const ArtifactImage = React.forwardRef<HTMLDivElement, ArtifactImageProps>(
  ({ 
    artifact,
    maxWidth = 600,
    maxHeight = 400,
    showDimensions = true,
    onDownload,
    onShare,
    className,
    ...props 
  }, ref) => {
    const [imageLoaded, setImageLoaded] = React.useState(false)
    const [imageError, setImageError] = React.useState(false)
    const [naturalDimensions, setNaturalDimensions] = React.useState<{width: number, height: number} | null>(null)
    
    const imageData = React.useMemo(() => {
      let image: any = {}
      
      if (artifact.content && typeof artifact.content === 'object') {
        if ('image' in artifact.content) {
          image = (artifact.content as any).image
        } else if ('url' in artifact.content) {
          image = artifact.content
        }
      }
      
      return {
        url: image.url || artifact.metadata?.url as string,
        alt: image.alt || artifact.metadata?.alt as string || artifact.metadata?.name as string || 'Image artifact',
        width: image.width || artifact.metadata?.width as number,
        height: image.height || artifact.metadata?.height as number
      }
    }, [artifact.content, artifact.metadata])

    const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget
      setNaturalDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
      setImageLoaded(true)
      setImageError(false)
    }

    const handleImageError = () => {
      setImageError(true)
      setImageLoaded(false)
    }

    const formatDimensions = (width?: number, height?: number) => {
      if (!width || !height) return ""
      return `${width} × ${height}px`
    }

    const getImageFormat = (url: string) => {
      const extension = url.split('.').pop()?.toLowerCase()
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          return 'JPEG'
        case 'png':
          return 'PNG'
        case 'gif':
          return 'GIF'
        case 'webp':
          return 'WebP'
        case 'svg':
          return 'SVG'
        default:
          return 'IMAGE'
      }
    }

    const actions = (
      <>
        {imageData.url && (
          <Badge variant="outline" className="text-xs">
            {getImageFormat(imageData.url)}
          </Badge>
        )}
        {showDimensions && naturalDimensions && (
          <Badge variant="outline" className="text-xs">
            {formatDimensions(naturalDimensions.width, naturalDimensions.height)}
          </Badge>
        )}
      </>
    )

    if (!imageData.url) {
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
          <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
            <div className="text-center text-muted-foreground">
              <span className="text-2xl mb-2 block">🖼️</span>
              <p className="text-sm">No image URL provided</p>
            </div>
          </div>
        </ArtifactContainer>
      )
    }

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
        <div className="relative">
          {!imageLoaded && !imageError && (
            <div className="flex items-center justify-center h-32 bg-muted rounded-lg animate-pulse">
              <div className="text-center text-muted-foreground">
                <span className="text-2xl mb-2 block">🖼️</span>
                <p className="text-sm">Loading image...</p>
              </div>
            </div>
          )}
          
          {imageError && (
            <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
              <div className="text-center text-muted-foreground">
                <span className="text-2xl mb-2 block">❌</span>
                <p className="text-sm">Failed to load image</p>
                <p className="text-xs mt-1 opacity-70">Check the image URL</p>
              </div>
            </div>
          )}
          
          <img
            src={imageData.url}
            alt={imageData.alt}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={cn(
              "w-full h-auto rounded-lg border bg-muted",
              !imageLoaded && "hidden"
            )}
            style={{
              maxWidth: `${maxWidth}px`,
              maxHeight: `${maxHeight}px`,
              objectFit: 'contain'
            }}
            loading="lazy"
          />
          
          {imageLoaded && (
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                {naturalDimensions && (
                  <span>
                    Original: {formatDimensions(naturalDimensions.width, naturalDimensions.height)}
                  </span>
                )}
                {artifact.size && (
                  <span>
                    Size: {(artifact.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
              
              <a 
                href={imageData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View full size
              </a>
            </div>
          )}
        </div>
      </ArtifactContainer>
    )
  }
)
ArtifactImage.displayName = "Artifact.Image"

export { ArtifactImage }