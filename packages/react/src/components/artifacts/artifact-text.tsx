import * as React from "react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { EnhancedArtifact } from "@agentarea/core"
import { ArtifactContainer } from "./artifact-container"

export interface ArtifactTextProps extends React.HTMLAttributes<HTMLDivElement> {
  artifact: EnhancedArtifact
  maxHeight?: number
  showLineNumbers?: boolean
  onDownload?: (artifact: EnhancedArtifact) => void
  onShare?: (artifact: EnhancedArtifact) => void
}

const ArtifactText = React.forwardRef<HTMLDivElement, ArtifactTextProps>(
  ({ 
    artifact,
    maxHeight = 400,
    showLineNumbers = false,
    onDownload,
    onShare,
    className,
    ...props 
  }, ref) => {
    const [isCopied, setIsCopied] = React.useState(false)
    
    const textContent = React.useMemo(() => {
      if (typeof artifact.content === 'string') {
        return artifact.content
      }
      if (artifact.content && typeof artifact.content === 'object' && 'text' in artifact.content) {
        return (artifact.content as any).text
      }
      return JSON.stringify(artifact.content, null, 2)
    }, [artifact.content])

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(textContent)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy text:', err)
      }
    }

    const lines = textContent.split('\n')

    const actions = (
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="h-8"
      >
        {isCopied ? "✓ Copied" : "📋 Copy"}
      </Button>
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
        <div 
          className="relative"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          <div className="overflow-auto">
            {showLineNumbers ? (
              <div className="flex">
                <div className="flex-shrink-0 pr-4 text-xs text-muted-foreground font-mono border-r mr-4">
                  {lines.map((_: string, index: number) => (
                    <div key={index} className="leading-6">
                      {index + 1}
                    </div>
                  ))}
                </div>
                <div className="flex-1 font-mono text-sm leading-6 whitespace-pre-wrap break-words">
                  {textContent}
                </div>
              </div>
            ) : (
              <div className="font-mono text-sm leading-6 whitespace-pre-wrap break-words">
                {textContent}
              </div>
            )}
          </div>
        </div>
      </ArtifactContainer>
    )
  }
)
ArtifactText.displayName = "Artifact.Text"

export { ArtifactText }