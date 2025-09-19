import * as React from "react"
import { cn } from "../../lib/utils"

export type TimelineEventType = 'message' | 'status' | 'artifact' | 'log'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  taskId?: string
  agentId?: string
  timestamp: Date
  title?: string
  summary?: string
  payload?: unknown
}

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  events?: TimelineEvent[]
  maxHeight?: number
  showAgent?: boolean
  showTask?: boolean
}

const TimelineRoot = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, events = [], maxHeight = 360, showAgent = true, showTask = true, ...props }, ref) => {
    const ordered = React.useMemo(() => {
      return [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    }, [events])

    return (
      <div ref={ref} className={cn("w-full rounded border bg-background", className)} {...props}>
        <div className="border-b px-3 py-2 font-medium">Multi-Agent Timeline</div>
        <div className="overflow-auto" style={{ maxHeight }}>
          {ordered.length === 0 ? (
            <div className="text-sm text-muted-foreground p-3">No timeline events.</div>
          ) : (
            <ul className="p-3 space-y-2">
              {ordered.map(e => (
                <li key={e.id} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">{e.timestamp.toLocaleTimeString()}</div>
                    <div className="text-sm font-medium">
                      {e.title || e.type}
                      {showAgent && e.agentId && <span className="ml-2 text-xs text-muted-foreground">@{e.agentId}</span>}
                      {showTask && e.taskId && <span className="ml-2 text-xs text-muted-foreground">#{e.taskId}</span>}
                    </div>
                    {e.summary && <div className="text-sm">{e.summary}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }
)
TimelineRoot.displayName = 'Timeline'

export const Timeline = TimelineRoot