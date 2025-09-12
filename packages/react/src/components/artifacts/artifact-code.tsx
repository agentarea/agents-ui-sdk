"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { EnhancedArtifact } from "@agentarea/core"
import { ArtifactContainer } from "./artifact-container"

export interface ArtifactCodeProps extends React.HTMLAttributes<HTMLDivElement> {
  artifact: EnhancedArtifact
  maxHeight?: number
  showLineNumbers?: boolean
  language?: string
  theme?: 'light' | 'dark' | 'auto'
  onDownload?: (artifact: EnhancedArtifact) => void
  onShare?: (artifact: EnhancedArtifact) => void
}

const ArtifactCode = React.forwardRef<HTMLDivElement, ArtifactCodeProps>(
  ({ 
    artifact,
    maxHeight = 400,
    showLineNumbers = true,
    language,
    theme = 'auto',
    onDownload,
    onShare,
    className,
    ...props 
  }, ref) => {
    const [isCopied, setIsCopied] = React.useState(false)
    
    const { codeContent, detectedLanguage } = React.useMemo(() => {
      let content = ''
      let lang = language || 'text'
      
      if (typeof artifact.content === 'string') {
        content = artifact.content
      } else if (artifact.content && typeof artifact.content === 'object') {
        if ('code' in artifact.content) {
          const codeData = (artifact.content as any).code
          content = codeData.content || codeData
          lang = codeData.language || lang
        } else if ('content' in artifact.content) {
          content = (artifact.content as any).content
        } else {
          content = JSON.stringify(artifact.content, null, 2)
          lang = 'json'
        }
      }
      
      // Try to detect language from metadata or render options
      if (!language) {
        lang = artifact.renderOptions?.language || 
              artifact.metadata?.language as string || 
              lang
      }
      
      return { codeContent: content, detectedLanguage: lang }
    }, [artifact.content, artifact.renderOptions, artifact.metadata, language])

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(codeContent)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy code:', err)
      }
    }

    // Simple syntax highlighting for common languages
    const getLanguageColor = (lang: string) => {
      const colors: Record<string, string> = {
        javascript: 'text-yellow-600',
        typescript: 'text-blue-600',
        python: 'text-green-600',
        java: 'text-orange-600',
        html: 'text-red-600',
        css: 'text-purple-600',
        json: 'text-gray-600',
        sql: 'text-indigo-600',
        bash: 'text-gray-800',
        shell: 'text-gray-800'
      }
      return colors[lang.toLowerCase()] || 'text-gray-600'
    }

    const lines = codeContent.split('\n')

    const actions = (
      <>
        {detectedLanguage && (
          <Badge variant="outline" className="text-xs">
            <span className={cn("font-mono", getLanguageColor(detectedLanguage))}>
              {detectedLanguage.toUpperCase()}
            </span>
          </Badge>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-8"
        >
          {isCopied ? "✓ Copied" : "📋 Copy"}
        </Button>
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
        <div 
          className={cn(
            "relative rounded-md border bg-muted/30",
            theme === 'dark' && "bg-gray-900 text-gray-100",
            theme === 'light' && "bg-gray-50 text-gray-900"
          )}
          style={{ maxHeight: `${maxHeight}px` }}
        >
          <div className="overflow-auto p-4">
            {showLineNumbers ? (
              <div className="flex">
                <div className="flex-shrink-0 pr-4 text-xs text-muted-foreground font-mono border-r mr-4 select-none">
                  {lines.map((_, index) => (
                    <div key={index} className="leading-6 text-right" style={{ minWidth: '2em' }}>
                      {index + 1}
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  <pre className="font-mono text-sm leading-6 whitespace-pre-wrap break-words">
                    <code className={cn(
                      "language-" + detectedLanguage.toLowerCase(),
                      "block"
                    )}>
                      {codeContent}
                    </code>
                  </pre>
                </div>
              </div>
            ) : (
              <pre className="font-mono text-sm leading-6 whitespace-pre-wrap break-words">
                <code className={cn(
                  "language-" + detectedLanguage.toLowerCase(),
                  "block"
                )}>
                  {codeContent}
                </code>
              </pre>
            )}
          </div>
        </div>
      </ArtifactContainer>
    )
  }
)
ArtifactCode.displayName = "Artifact.Code"

export { ArtifactCode }