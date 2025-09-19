import * as React from "react"
import { cn } from "../../lib/utils"

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  id: string
  level: LogLevel
  message: string
  timestamp: Date
  context?: Record<string, unknown>
}

export interface AgentLogProps extends React.HTMLAttributes<HTMLDivElement> {
  agentId?: string
  entries?: LogEntry[]
  levels?: LogLevel[]
  maxHeight?: number
  follow?: boolean
}

function levelClass(level: LogLevel) {
  switch (level) {
    case 'trace': return 'text-gray-500'
    case 'debug': return 'text-slate-500'
    case 'info': return 'text-blue-600'
    case 'warn': return 'text-amber-600'
    case 'error': return 'text-red-600'
    default: return 'text-foreground'
  }
}

const AgentLogRoot = React.forwardRef<HTMLDivElement, AgentLogProps>(
  ({ className, agentId, entries = [], levels, maxHeight = 240, follow = true, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const mergedRef = (node: HTMLDivElement) => {
      containerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
    }

    React.useEffect(() => {
      if (!follow || !containerRef.current) return
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }, [entries, follow])

    const filtered = React.useMemo(() => {
      if (!levels || levels.length === 0) return entries
      const set = new Set(levels)
      return entries.filter(e => set.has(e.level))
    }, [entries, levels])

    return (
      <div ref={mergedRef} className={cn("w-full rounded border bg-background overflow-auto", className)} style={{ maxHeight }} {...props}>
        <div className="sticky top-0 z-10 bg-background border-b px-3 py-2 flex items-center justify-between">
          <div className="font-medium">{agentId ? `Agent ${agentId} Logs` : 'Agent Logs'}</div>
          <div className="text-xs text-muted-foreground">{filtered.length} entries</div>
        </div>
        <div className="p-2 text-xs font-mono">
          {filtered.length === 0 ? (
            <div className="text-muted-foreground">No log entries.</div>
          ) : (
            filtered.map(e => (
              <div key={e.id} className="flex gap-2 py-0.5">
                <span className={cn('min-w-[60px] text-muted-foreground')}>{e.timestamp.toLocaleTimeString()}</span>
                <span className={cn('min-w-[56px] uppercase', levelClass(e.level))}>{e.level}</span>
                <span className="whitespace-pre-wrap break-words flex-1">{e.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }
)
AgentLogRoot.displayName = 'AgentLog'

export const AgentLog = AgentLogRoot