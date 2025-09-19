import { TaskGraph } from './task-graph'
import { Timeline } from './timeline'
import { AgentLog } from './agent-log'

export { TaskGraph, Timeline, AgentLog }
export type { TaskGraphNode, TaskStatus } from './task-graph'
export type { TimelineEvent, TimelineEventType } from './timeline'
export type { LogEntry, LogLevel } from './agent-log'

export const MultiAgent = {
  TaskGraph,
  Timeline,
  AgentLog,
} as const