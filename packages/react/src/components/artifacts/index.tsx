import * as React from "react"
import { EnhancedArtifact } from "@agentarea/core"
import { ArtifactContainer } from "./artifact-container"
import { ArtifactText } from "./artifact-text"
import { ArtifactCode } from "./artifact-code"
import { ArtifactFile } from "./artifact-file"
import { ArtifactData } from "./artifact-data"
import { ArtifactImage } from "./artifact-image"

export interface ArtifactProps extends React.HTMLAttributes<HTMLDivElement> {
  artifact: EnhancedArtifact
  onDownload?: (artifact: EnhancedArtifact) => void
  onShare?: (artifact: EnhancedArtifact) => void
  onPreview?: (artifact: EnhancedArtifact) => void
}

// Auto-detecting Artifact component that renders the appropriate specialized component
const ArtifactRoot = React.forwardRef<HTMLDivElement, ArtifactProps>(
  ({ artifact, onDownload, onShare, onPreview, ...props }, ref) => {
    // Determine the appropriate component based on displayType
    switch (artifact.displayType) {
      case 'code':
        return (
          <ArtifactCode
            ref={ref}
            artifact={artifact}
            onDownload={onDownload}
            onShare={onShare}
            {...props}
          />
        )
      
      case 'file':
        return (
          <ArtifactFile
            ref={ref}
            artifact={artifact}
            onDownload={onDownload}
            onShare={onShare}
            onPreview={onPreview}
            {...props}
          />
        )
      
      case 'data':
        return (
          <ArtifactData
            ref={ref}
            artifact={artifact}
            onDownload={onDownload}
            onShare={onShare}
            {...props}
          />
        )
      
      case 'image':
        return (
          <ArtifactImage
            ref={ref}
            artifact={artifact}
            onDownload={onDownload}
            onShare={onShare}
            {...props}
          />
        )
      
      case 'text':
      default:
        return (
          <ArtifactText
            ref={ref}
            artifact={artifact}
            onDownload={onDownload}
            onShare={onShare}
            {...props}
          />
        )
    }
  }
)
ArtifactRoot.displayName = "Artifact"

// Export as namespace following the compound component pattern
export const Artifact = Object.assign(ArtifactRoot, {
  Container: ArtifactContainer,
  Text: ArtifactText,
  Code: ArtifactCode,
  File: ArtifactFile,
  Data: ArtifactData,
  Image: ArtifactImage,
})

// Export individual components
export { ArtifactContainer, ArtifactText, ArtifactCode, ArtifactFile, ArtifactData, ArtifactImage }