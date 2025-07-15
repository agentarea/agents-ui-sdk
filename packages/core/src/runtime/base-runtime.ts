// Base runtime implementation with common functionality

import type { 
  AgentRuntime, 
  RuntimeConfig, 
  RuntimeEvent, 
  RuntimeEventListener,
  Task,
  TaskInput,
  TaskResponse,
  TaskUpdate,
  AgentCard,
  Capability
} from '../types'

export abstract class BaseRuntime implements AgentRuntime {
  public config: RuntimeConfig
  protected connected = false
  protected listeners: Set<RuntimeEventListener> = new Set()

  constructor(config: RuntimeConfig) {
    this.config = config
  }

  // Abstract methods that must be implemented by protocol-specific runtimes
  abstract sendTask(input: TaskInput): Promise<TaskResponse>
  abstract getTask(taskId: string): Promise<Task>
  abstract cancelTask(taskId: string): Promise<void>
  abstract getAgentCard(): Promise<AgentCard>
  abstract getCapabilities(): Promise<Capability[]>
  abstract connect(config: RuntimeConfig): Promise<void>
  abstract disconnect(): Promise<void>

  // Optional streaming method
  streamTask?(input: TaskInput): AsyncIterable<TaskUpdate>

  // Connection state
  isConnected(): boolean {
    return this.connected
  }

  // Feature support (override in subclasses)
  supportsStreaming(): boolean {
    return typeof this.streamTask === 'function'
  }

  supportsPushNotifications(): boolean {
    return false // Override in subclasses that support push notifications
  }

  // Event management
  addEventListener(listener: RuntimeEventListener): void {
    this.listeners.add(listener)
  }

  removeEventListener(listener: RuntimeEventListener): void {
    this.listeners.delete(listener)
  }

  protected emit(event: RuntimeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in runtime event listener:', error)
      }
    })
  }

  protected setConnected(connected: boolean): void {
    if (this.connected !== connected) {
      this.connected = connected
      this.emit({
        type: connected ? 'connected' : 'disconnected',
        runtime: this
      })
    }
  }

  protected emitError(error: Error): void {
    this.emit({
      type: 'error',
      error,
      runtime: this
    })
  }

  protected emitTaskUpdate(update: TaskUpdate): void {
    this.emit({
      type: 'task-update',
      update,
      runtime: this
    })
  }
}