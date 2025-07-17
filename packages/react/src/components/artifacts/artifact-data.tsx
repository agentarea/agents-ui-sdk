import * as React from "react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { EnhancedArtifact } from "@agentarea/core"
import { ArtifactContainer } from "./artifact-container"

export interface ArtifactDataProps extends React.HTMLAttributes<HTMLDivElement> {
  artifact: EnhancedArtifact
  maxHeight?: number
  defaultExpanded?: boolean
  showSearch?: boolean
  onDownload?: (artifact: EnhancedArtifact) => void
  onShare?: (artifact: EnhancedArtifact) => void
}

interface TreeNodeProps {
  data: any
  path: string[]
  level: number
  searchTerm: string
  onToggle: (path: string[]) => void
  expandedPaths: Set<string>
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
  data, 
  path, 
  level, 
  searchTerm, 
  onToggle, 
  expandedPaths 
}) => {
  const pathKey = path.join('.')
  const isExpanded = expandedPaths.has(pathKey)
  const indent = level * 16

  const matchesSearch = (value: any, key?: string): boolean => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    
    if (key && key.toLowerCase().includes(searchLower)) return true
    if (typeof value === 'string' && value.toLowerCase().includes(searchLower)) return true
    if (typeof value === 'number' && value.toString().includes(searchLower)) return true
    
    return false
  }

  const renderValue = (value: any, key?: string) => {
    const matches = matchesSearch(value, key)
    
    if (value === null) {
      return <span className="text-gray-500 italic">null</span>
    }
    
    if (typeof value === 'boolean') {
      return <span className="text-blue-600 font-medium">{value.toString()}</span>
    }
    
    if (typeof value === 'number') {
      return <span className={cn("text-purple-600 font-medium", matches && searchTerm && "bg-yellow-200")}>{value}</span>
    }
    
    if (typeof value === 'string') {
      return (
        <span className={cn("text-green-600", matches && searchTerm && "bg-yellow-200")}>
          "{value}"
        </span>
      )
    }
    
    if (Array.isArray(value)) {
      return (
        <span className="text-gray-600">
          Array({value.length})
        </span>
      )
    }
    
    if (typeof value === 'object') {
      const keys = Object.keys(value)
      return (
        <span className="text-gray-600">
          Object({keys.length})
        </span>
      )
    }
    
    return <span className="text-gray-500">{String(value)}</span>
  }

  if (typeof data !== 'object' || data === null) {
    return (
      <div style={{ paddingLeft: `${indent}px` }} className="py-1">
        {renderValue(data)}
      </div>
    )
  }

  if (Array.isArray(data)) {
    return (
      <div>
        <div 
          style={{ paddingLeft: `${indent}px` }} 
          className="py-1 cursor-pointer hover:bg-muted/50 rounded flex items-center gap-1"
          onClick={() => onToggle(path)}
        >
          <span className="w-4 text-center text-xs">
            {isExpanded ? "▼" : "▶"}
          </span>
          <span className="text-gray-600 font-medium">
            [{data.length}]
          </span>
        </div>
        {isExpanded && data.map((item, index) => (
          <TreeNode
            key={index}
            data={item}
            path={[...path, index.toString()]}
            level={level + 1}
            searchTerm={searchTerm}
            onToggle={onToggle}
            expandedPaths={expandedPaths}
          />
        ))}
      </div>
    )
  }

  const entries = Object.entries(data)
  const filteredEntries = searchTerm 
    ? entries.filter(([key, value]) => matchesSearch(value, key))
    : entries

  return (
    <div>
      <div 
        style={{ paddingLeft: `${indent}px` }} 
        className="py-1 cursor-pointer hover:bg-muted/50 rounded flex items-center gap-1"
        onClick={() => onToggle(path)}
      >
        <span className="w-4 text-center text-xs">
          {isExpanded ? "▼" : "▶"}
        </span>
        <span className="text-gray-600 font-medium">
          {`{${entries.length}}`}
        </span>
      </div>
      {isExpanded && filteredEntries.map(([key, value]) => {
        const keyMatches = matchesSearch(value, key)
        return (
          <div key={key}>
            <div style={{ paddingLeft: `${indent + 16}px` }} className="py-1 flex items-start gap-2">
              <span className={cn(
                "text-blue-800 font-medium flex-shrink-0",
                keyMatches && searchTerm && "bg-yellow-200"
              )}>
                {key}:
              </span>
              {typeof value === 'object' && value !== null ? (
                <TreeNode
                  data={value}
                  path={[...path, key]}
                  level={0}
                  searchTerm={searchTerm}
                  onToggle={onToggle}
                  expandedPaths={expandedPaths}
                />
              ) : (
                <span className="flex-1">{renderValue(value, key)}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const ArtifactData = React.forwardRef<HTMLDivElement, ArtifactDataProps>(
  ({ 
    artifact,
    maxHeight = 400,
    defaultExpanded = false,
    showSearch = true,
    onDownload,
    onShare,
    className,
    ...props 
  }, ref) => {
    const [isCopied, setIsCopied] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(new Set())
    const [viewMode, setViewMode] = React.useState<'tree' | 'raw'>('tree')
    
    const parsedData = React.useMemo(() => {
      try {
        if (artifact.content && typeof artifact.content === 'object') {
          if ('data' in artifact.content) {
            return (artifact.content as any).data.content || (artifact.content as any).data
          }
          return artifact.content
        }
        
        if (typeof artifact.content === 'string') {
          return JSON.parse(artifact.content)
        }
        
        return artifact.content
      } catch (error) {
        return artifact.content
      }
    }, [artifact.content])

    const rawJson = React.useMemo(() => {
      return JSON.stringify(parsedData, null, 2)
    }, [parsedData])

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(rawJson)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy data:', err)
      }
    }

    const handleToggle = (path: string[]) => {
      const pathKey = path.join('.')
      const newExpanded = new Set(expandedPaths)
      
      if (newExpanded.has(pathKey)) {
        newExpanded.delete(pathKey)
      } else {
        newExpanded.add(pathKey)
      }
      
      setExpandedPaths(newExpanded)
    }

    const expandAll = () => {
      const allPaths = new Set<string>()
      
      const collectPaths = (obj: any, currentPath: string[] = []) => {
        if (typeof obj === 'object' && obj !== null) {
          allPaths.add(currentPath.join('.'))
          
          if (Array.isArray(obj)) {
            obj.forEach((_, index) => {
              collectPaths(obj[index], [...currentPath, index.toString()])
            })
          } else {
            Object.entries(obj).forEach(([key, value]) => {
              collectPaths(value, [...currentPath, key])
            })
          }
        }
      }
      
      collectPaths(parsedData)
      setExpandedPaths(allPaths)
    }

    const collapseAll = () => {
      setExpandedPaths(new Set())
    }

    React.useEffect(() => {
      if (defaultExpanded) {
        expandAll()
      }
    }, [defaultExpanded])

    const dataSize = new Blob([rawJson]).size
    const itemCount = React.useMemo(() => {
      const count = (obj: any): number => {
        if (typeof obj !== 'object' || obj === null) return 1
        if (Array.isArray(obj)) return obj.reduce((sum: number, item) => sum + count(item), 0)
        return Object.values(obj).reduce((sum: number, value) => sum + count(value), 0)
      }
      return count(parsedData)
    }, [parsedData])

    const actions = (
      <>
        <Badge variant="outline" className="text-xs">
          {itemCount} items
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(viewMode === 'tree' ? 'raw' : 'tree')}
          className="h-8"
        >
          {viewMode === 'tree' ? '📄 Raw' : '🌳 Tree'}
        </Button>
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
        {showSearch && viewMode === 'tree' && (
          <div className="mb-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="Search keys and values..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        )}

        <div 
          className="border rounded-md bg-muted/30 overflow-auto"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          {viewMode === 'tree' ? (
            <div className="p-3 font-mono text-sm">
              <TreeNode
                data={parsedData}
                path={[]}
                level={0}
                searchTerm={searchTerm}
                onToggle={handleToggle}
                expandedPaths={expandedPaths}
              />
            </div>
          ) : (
            <pre className="p-3 font-mono text-sm whitespace-pre-wrap break-words">
              {rawJson}
            </pre>
          )}
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          Size: {(dataSize / 1024).toFixed(1)} KB • Items: {itemCount}
        </div>
      </ArtifactContainer>
    )
  }
)
ArtifactData.displayName = "Artifact.Data"

export { ArtifactData }