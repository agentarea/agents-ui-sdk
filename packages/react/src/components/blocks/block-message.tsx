import * as React from "react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import type { CommunicationBlock, ProtocolMessage } from "@agentarea/core"

// Enhanced message display with protocol metadata
export interface BlockMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  message: ProtocolMessage | CommunicationBlock
  showMetadata?: boolean
  showTimestamp?: boolean
  showRouting?: boolean
  expandable?: boolean
  onExpand?: () => void
  onCollapse?: () => void
  isExpanded?: boolean
  correlatedMessage?: ProtocolMessage | CommunicationBlock
  showCorrelation?: boolean
  isError?: boolean
  isRequest?: boolean
  isResponse?: boolean
  correlationId?: string
}

const BlockMessage = React.forwardRef<HTMLDivElement, BlockMessageProps>(
  ({ 
    message, 
    showMetadata = true,
    showTimestamp = true,
    showRouting = true,
    expandable = false,
    onExpand,
    onCollapse,
    isExpanded = false,
    correlatedMessage,
    showCorrelation = true,
    isError = false,
    className, 
    children,
    ...props 
  }, ref) => {
    const [expanded, setExpanded] = React.useState(isExpanded)
    
    const handleToggleExpand = () => {
      const newExpanded = !expanded
      setExpanded(newExpanded)
      if (newExpanded) {
        onExpand?.()
      } else {
        onCollapse?.()
      }
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (expandable && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        handleToggleExpand()
      }
    }

    // Determine if this is a ProtocolMessage or CommunicationBlock
    const isProtocolMessage = 'payload' in message
    const content = isProtocolMessage ? (message as ProtocolMessage).payload : message.content
    const messageType = isProtocolMessage ? (message as ProtocolMessage).type : message.type
    
    // Get agent identification info
    const sourceAgent = message.source
    const targetAgent = message.target || 'broadcast'
    
    // Format timestamp
    const formatTimestamp = (timestamp: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(timestamp)
    }

    // Get message type styling
    const getMessageTypeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
      switch (type.toLowerCase()) {
        case 'error':
        case 'failed':
          return 'destructive'
        case 'success':
        case 'completed':
          return 'default'
        case 'warning':
          return 'outline'
        default:
          return 'secondary'
      }
    }

    // Render content based on type
    const renderContent = () => {
      if (typeof content === 'string') {
        return <div className="text-sm">{content}</div>
      }
      
      if (typeof content === 'object' && content !== null) {
        return (
          <pre className="text-xs bg-muted p-2 rounded border overflow-auto max-h-32">
            {JSON.stringify(content, null, 2)}
          </pre>
        )
      }
      
      return <div className="text-sm text-muted-foreground">No content</div>
    }

    return (
      <div 
        ref={ref}
        className={cn(
          "border rounded-lg p-3 bg-background/50 backdrop-blur-sm",
          "transition-all duration-200 hover:bg-background/80",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          isError && "border-destructive bg-destructive/5",
          expandable && "cursor-pointer",
          className
        )}
        onKeyDown={handleKeyDown}
        tabIndex={expandable ? 0 : undefined}
        role={expandable ? "button" : undefined}
        aria-label={expandable ? `${isError ? 'Error message' : 'Message'} from ${sourceAgent} to ${targetAgent}. Press Enter or Space to ${expanded ? 'collapse' : 'expand'}.` : undefined}
        {...props}
      >
        {/* Header with agent routing and message type */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {showRouting && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground" role="group" aria-label="Message routing">
                <span className="font-medium" aria-label="Source agent">{sourceAgent}</span>
                <span aria-hidden="true">→</span>
                <span className="font-medium" aria-label="Target agent">{targetAgent}</span>
              </div>
            )}
            <Badge variant={getMessageTypeVariant(messageType)} aria-label={`Message type: ${messageType}`}>
              {messageType}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {showTimestamp && (
              <time 
                className="text-xs text-muted-foreground"
                dateTime={message.timestamp.toISOString()}
                aria-label={`Message sent at ${formatTimestamp(message.timestamp)}`}
              >
                {formatTimestamp(message.timestamp)}
              </time>
            )}
            {expandable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleExpand}
                className="h-6 w-6 p-0"
                aria-label={expanded ? "Collapse message details" : "Expand message details"}
                aria-expanded={expanded}
              >
                {expanded ? '−' : '+'}
              </Button>
            )}
          </div>
        </div>

        {/* Correlation indicator */}
        {showCorrelation && correlatedMessage && (
          <div className="mb-2 p-2 bg-muted/30 rounded border-l-2 border-primary">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span>🔗</span>
              <span>Correlated with:</span>
              <Badge variant="outline" className="text-xs">
                {('payload' in correlatedMessage) ? correlatedMessage.type : correlatedMessage.type}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {correlatedMessage.source} → {correlatedMessage.target || 'broadcast'} at {formatTimestamp(correlatedMessage.timestamp)}
            </div>
          </div>
        )}

        {/* Message content */}
        <div className={cn(
          "transition-all duration-200",
          expanded ? "max-h-none" : "max-h-20 overflow-hidden"
        )}>
          {renderContent()}
          {children}
        </div>

        {/* Metadata section */}
        {showMetadata && message.metadata && Object.keys(message.metadata).length > 0 && (
          <div className={cn(
            "mt-2 pt-2 border-t",
            expanded ? "block" : "hidden"
          )}>
            <div className="text-xs text-muted-foreground mb-1">Metadata:</div>
            <pre className="text-xs bg-muted/50 p-2 rounded border overflow-auto max-h-24">
              {JSON.stringify(message.metadata, null, 2)}
            </pre>
          </div>
        )}

        {/* Expandable indicator */}
        {expandable && !expanded && (
          <div className="mt-1 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpand}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Show more...
            </Button>
          </div>
        )}
      </div>
    )
  }
)
BlockMessage.displayName = "Block.Message"

// Protocol-specific formatting and display
export interface BlockProtocolProps extends React.HTMLAttributes<HTMLDivElement> {
  protocol: {
    type: string
    version?: string
    features?: string[]
    compliance?: {
      level: 'full' | 'partial' | 'minimal'
      issues?: Array<{
        severity: 'error' | 'warning' | 'info'
        message: string
      }>
    }
  }
  showFeatures?: boolean
  showCompliance?: boolean
  expandable?: boolean
}

const BlockProtocol = React.forwardRef<HTMLDivElement, BlockProtocolProps>(
  ({ 
    protocol, 
    showFeatures = true,
    showCompliance = true,
    expandable = true,
    className, 
    ...props 
  }, ref) => {
    const [expanded, setExpanded] = React.useState(false)

    const getComplianceVariant = (level: string): "default" | "secondary" | "destructive" => {
      switch (level) {
        case 'full': return 'default'
        case 'partial': return 'secondary'
        case 'minimal': return 'destructive'
        default: return 'secondary'
      }
    }

    const getSeverityVariant = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
      switch (severity) {
        case 'error': return 'destructive'
        case 'warning': return 'outline'
        case 'info': return 'secondary'
        default: return 'default'
      }
    }

    return (
      <div 
        ref={ref}
        className={cn(
          "border rounded-lg p-3 bg-background",
          className
        )}
        {...props}
      >
        {/* Protocol header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2" role="group" aria-label="Protocol information">
            <span className="text-base" aria-hidden="true">🔗</span>
            <span className="font-semibold" aria-label={`Protocol type: ${protocol.type}`}>{protocol.type}</span>
            {protocol.version && (
              <Badge variant="outline" aria-label={`Version ${protocol.version}`}>v{protocol.version}</Badge>
            )}
          </div>
          
          {expandable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-6 w-6 p-0"
              aria-label={expanded ? "Collapse protocol details" : "Expand protocol details"}
              aria-expanded={expanded}
            >
              {expanded ? '−' : '+'}
            </Button>
          )}
        </div>

        {/* Compliance status */}
        {showCompliance && protocol.compliance && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">Compliance:</span>
              <Badge variant={getComplianceVariant(protocol.compliance.level)}>
                {protocol.compliance.level.toUpperCase()}
              </Badge>
            </div>
            
            {protocol.compliance.issues && protocol.compliance.issues.length > 0 && (
              <div className={cn(
                "space-y-1",
                expanded ? "block" : "hidden"
              )}>
                {protocol.compliance.issues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <Badge variant={getSeverityVariant(issue.severity)} className="text-xs">
                      {issue.severity}
                    </Badge>
                    <span className="flex-1">{issue.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Features */}
        {showFeatures && protocol.features && protocol.features.length > 0 && (
          <div className={cn(
            "transition-all duration-200",
            expanded ? "block" : "hidden"
          )}>
            <div className="text-sm font-medium mb-1">Supported Features:</div>
            <div className="flex flex-wrap gap-1">
              {protocol.features.map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
)
BlockProtocol.displayName = "Block.Protocol"

// Real-time status updates and indicators
export interface BlockStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  status: {
    type: 'connection' | 'task' | 'agent' | 'system'
    state: 'online' | 'offline' | 'connecting' | 'error' | 'working' | 'idle'
    message?: string
    details?: Record<string, unknown>
    lastUpdate?: Date
    metrics?: {
      latency?: number
      uptime?: number
      errorRate?: number
    }
  }
  showMetrics?: boolean
  showDetails?: boolean
  realTime?: boolean
}

const BlockStatus = React.forwardRef<HTMLDivElement, BlockStatusProps>(
  ({ 
    status, 
    showMetrics = true,
    showDetails = false,
    realTime = false,
    className, 
    ...props 
  }, ref) => {
    const [expanded, setExpanded] = React.useState(showDetails)

    const getStatusVariant = (state: string): "default" | "secondary" | "destructive" | "outline" => {
      switch (state) {
        case 'online':
        case 'working':
          return 'default'
        case 'offline':
        case 'error':
          return 'destructive'
        case 'connecting':
          return 'outline'
        case 'idle':
        default:
          return 'secondary'
      }
    }

    const getStatusIcon = (type: string, state: string) => {
      if (type === 'connection') {
        switch (state) {
          case 'online': return '🟢'
          case 'offline': return '🔴'
          case 'connecting': return '🟡'
          case 'error': return '❌'
          default: return '⚪'
        }
      }
      if (type === 'task') {
        switch (state) {
          case 'working': return '⚙️'
          case 'error': return '❌'
          case 'idle': return '⏸️'
          default: return '📋'
        }
      }
      if (type === 'agent') {
        switch (state) {
          case 'online': return '🤖'
          case 'offline': return '😴'
          case 'working': return '🔄'
          case 'error': return '⚠️'
          default: return '🤖'
        }
      }
      return '📊'
    }

    const formatMetric = (value: number, unit: string) => {
      if (unit === 'ms') {
        return `${value}ms`
      }
      if (unit === 'percent') {
        return `${(value * 100).toFixed(1)}%`
      }
      if (unit === 'uptime') {
        const hours = Math.floor(value / 3600)
        const minutes = Math.floor((value % 3600) / 60)
        return `${hours}h ${minutes}m`
      }
      return `${value}${unit}`
    }

    return (
      <div 
        ref={ref}
        className={cn(
          "border rounded-lg p-3 bg-background",
          realTime && "animate-pulse",
          className
        )}
        {...props}
      >
        {/* Status header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2" role="group" aria-label={`${status.type} status information`}>
            <span className="text-base" aria-hidden="true">
              {getStatusIcon(status.type, status.state)}
            </span>
            <span className="font-semibold capitalize">{status.type} Status</span>
            <Badge variant={getStatusVariant(status.state)} aria-label={`Status: ${status.state}`}>
              {status.state.toUpperCase()}
            </Badge>
          </div>
          
          {status.lastUpdate && (
            <time 
              className="text-xs text-muted-foreground"
              dateTime={status.lastUpdate.toISOString()}
              aria-label={`Last updated at ${status.lastUpdate.toLocaleTimeString()}`}
            >
              {status.lastUpdate.toLocaleTimeString()}
            </time>
          )}
        </div>

        {/* Status message */}
        {status.message && (
          <div className="text-sm mb-2 text-muted-foreground">
            {status.message}
          </div>
        )}

        {/* Metrics */}
        {showMetrics && status.metrics && (
          <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
            {status.metrics.latency !== undefined && (
              <div className="text-center p-2 bg-muted/50 rounded">
                <div className="font-medium">{formatMetric(status.metrics.latency, 'ms')}</div>
                <div className="text-muted-foreground">Latency</div>
              </div>
            )}
            {status.metrics.uptime !== undefined && (
              <div className="text-center p-2 bg-muted/50 rounded">
                <div className="font-medium">{formatMetric(status.metrics.uptime, 'uptime')}</div>
                <div className="text-muted-foreground">Uptime</div>
              </div>
            )}
            {status.metrics.errorRate !== undefined && (
              <div className="text-center p-2 bg-muted/50 rounded">
                <div className="font-medium">{formatMetric(status.metrics.errorRate, 'percent')}</div>
                <div className="text-muted-foreground">Error Rate</div>
              </div>
            )}
          </div>
        )}

        {/* Details */}
        {status.details && Object.keys(status.details).length > 0 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-xs mb-1"
            >
              {expanded ? 'Hide' : 'Show'} Details
            </Button>
            
            {expanded && (
              <pre className="text-xs bg-muted/50 p-2 rounded border overflow-auto max-h-32">
                {JSON.stringify(status.details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    )
  }
)
BlockStatus.displayName = "Block.Status"

// Expandable technical details and metadata
export interface BlockMetadataProps extends React.HTMLAttributes<HTMLDivElement> {
  metadata: Record<string, unknown>
  title?: string
  expandable?: boolean
  defaultExpanded?: boolean
  maxHeight?: number
}

const BlockMetadata = React.forwardRef<HTMLDivElement, BlockMetadataProps>(
  ({ 
    metadata, 
    title = "Metadata",
    expandable = true,
    defaultExpanded = false,
    maxHeight = 200,
    className, 
    ...props 
  }, ref) => {
    const [expanded, setExpanded] = React.useState(defaultExpanded)

    if (!metadata || Object.keys(metadata).length === 0) {
      return null
    }

    return (
      <div 
        ref={ref}
        className={cn(
          "border rounded-lg p-3 bg-muted/30",
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2" role="group" aria-label="Metadata information">
            <span className="text-base" aria-hidden="true">📋</span>
            <span className="font-semibold">{title}</span>
            <Badge variant="outline" className="text-xs" aria-label={`${Object.keys(metadata).length} metadata items`}>
              {Object.keys(metadata).length} items
            </Badge>
          </div>
          
          {expandable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-6 w-6 p-0"
              aria-label={expanded ? "Collapse metadata details" : "Expand metadata details"}
              aria-expanded={expanded}
            >
              {expanded ? '−' : '+'}
            </Button>
          )}
        </div>

        {/* Metadata content */}
        <div className={cn(
          "transition-all duration-200 overflow-hidden",
          expanded ? "max-h-none" : "max-h-16"
        )}>
          <pre 
            className="text-xs bg-background p-2 rounded border overflow-auto"
            style={{ maxHeight: expanded ? maxHeight : 64 }}
          >
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </div>

        {/* Expand indicator */}
        {expandable && !expanded && (
          <div className="mt-1 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Show all metadata...
            </Button>
          </div>
        )}
      </div>
    )
  }
)
BlockMetadata.displayName = "Block.Metadata"

// Export as namespace
export const Block = {
  Message: BlockMessage,
  Protocol: BlockProtocol,
  Status: BlockStatus,
  Metadata: BlockMetadata,
}

