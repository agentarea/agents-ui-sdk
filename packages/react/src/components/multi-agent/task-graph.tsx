import * as React from "react"
import { cn } from "../../lib/utils"
import { Badge } from "../ui/badge"

export type TaskStatus = 'submitted' | 'working' | 'input-required' | 'completed' | 'canceled' | 'failed' | 'rejected'

export interface TaskGraphNode {
  id: string
  label?: string
  status?: TaskStatus
  agentId?: string
  parentId?: string
  children?: TaskGraphNode[]
  metadata?: Record<string, unknown>
}

export interface TaskGraphProps extends React.HTMLAttributes<HTMLDivElement> {
  rootId?: string
  nodes?: TaskGraphNode[]
  maxHeight?: number
  collapsible?: boolean
  defaultExpanded?: boolean
  onFocusNode?: (nodeId: string) => void
}

function StatusBadge({ status }: { status?: TaskStatus }) {
  if (!status) return null
  const color =
    status === 'completed' ? 'bg-green-100 text-green-800' :
    status === 'working' ? 'bg-blue-100 text-blue-800' :
    status === 'failed' || status === 'rejected' ? 'bg-red-100 text-red-800' :
    status === 'input-required' ? 'bg-amber-100 text-amber-800' :
    'bg-gray-100 text-gray-800'
  return <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', color)}>{status}</span>
}

function NodeRow({ node, depth, collapsible, onFocusNode }: { node: TaskGraphNode; depth: number; collapsible: boolean; onFocusNode?: (id: string) => void }) {
  const [open, setOpen] = React.useState(true)
  const hasChildren = !!node.children?.length
  const paddingLeft = 8 + depth * 16
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 py-1 px-2 hover:bg-muted/40 rounded" style={{ paddingLeft }}>
        {hasChildren && collapsible ? (
          <button onClick={() => setOpen(!open)} className="w-5 h-5 inline-flex items-center justify-center rounded border text-xs">
            {open ? '-' : '+'}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{node.label || node.id}</span>
            <StatusBadge status={node.status} />
            {node.agentId && <Badge variant="secondary">{node.agentId}</Badge>}
          </div>
          {node.parentId && (
            <div className="text-xs text-muted-foreground">child of {node.parentId}</div>
          )}
        </div>
        <button onClick={() => onFocusNode?.(node.id)} className="text-xs text-primary hover:underline">Focus</button>
      </div>
      {hasChildren && open && (
        <div>
          {node.children!.map((child) => (
            <NodeRow key={child.id} node={child} depth={depth + 1} collapsible={collapsible} onFocusNode={onFocusNode} />
          ))}
        </div>
      )}
    </div>
  )
}

const TaskGraphRoot = React.forwardRef<HTMLDivElement, TaskGraphProps>(
  ({ className, rootId, nodes = [], maxHeight = 360, collapsible = true, defaultExpanded = true, onFocusNode, ...props }, ref) => {
    const [expandedAll, setExpandedAll] = React.useState(defaultExpanded)

    // Normalize nodes: if a flat array with parentId is provided, build a tree
    const tree = React.useMemo(() => {
      if (!nodes.length) return [] as TaskGraphNode[]
      const byId = new Map<string, TaskGraphNode>()
      nodes.forEach(n => byId.set(n.id, { ...n, children: n.children ? [...n.children] : [] }))
      byId.forEach(n => {
        if (n.parentId && byId.has(n.parentId)) {
          const p = byId.get(n.parentId)!
          p.children = p.children || []
          p.children.push(n)
        }
      })
      const roots = [...byId.values()].filter(n => !n.parentId)
      // If rootId specified, pick it
      if (rootId) {
        const root = byId.get(rootId)
        return root ? [root] : roots
      }
      return roots
    }, [nodes, rootId])

    React.useEffect(() => {
      // Expand/collapse all by toggling a global key
      // We pass defaultExpanded to NodeRow via key to reset their local state
    }, [expandedAll])

    return (
      <div ref={ref} className={cn("w-full rounded border bg-background", className)} {...props}>
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="font-medium">Task Graph</div>
          <div className="flex gap-2">
            <button className="text-xs underline" onClick={() => setExpandedAll(true)}>Expand all</button>
            <button className="text-xs underline" onClick={() => setExpandedAll(false)}>Collapse all</button>
          </div>
        </div>
        <div className="overflow-auto" style={{ maxHeight }}>
          {tree.length === 0 ? (
            <div className="text-sm text-muted-foreground p-3">No task graph data. Provide nodes or create subtasks.</div>
          ) : (
            <div key={String(expandedAll)} className="p-2">
              {tree.map((n) => (
                <NodeRow key={n.id} node={n} depth={0} collapsible={collapsible} onFocusNode={onFocusNode} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
)
TaskGraphRoot.displayName = "TaskGraph"

export const TaskGraph = TaskGraphRoot
export { Badge }