// A2A Protocol runtime implementation
// Uses official @a2a-js/sdk

import { A2AClient } from '@a2a-js/sdk/client'
import type { 
  AgentCard as A2AAgentCard,
  Message as A2AMessage,
  Task as A2ATask,
  MessageSendParams,
  Part as A2APart
} from '@a2a-js/sdk'
import { BaseRuntime } from './base-runtime'
import type { 
  RuntimeConfig,
  Task,
  TaskInput,
  TaskResponse,
  TaskUpdate,
  AgentCard,
  Capability,
  Message
} from '../types'

export interface A2AConfig {
  agentBaseUrl: string
  authentication?: {
    type: 'bearer' | 'api-key' | 'oauth' | 'openid'
    token?: string
    apiKey?: string
    config?: Record<string, unknown>
  }
  timeout?: number
  retries?: number
  [key: string]: unknown
}

export class A2ARuntime extends BaseRuntime {
  private client: A2AClient
  private agentCard: A2AAgentCard | null = null

  constructor(config: A2AConfig) {
    super(config as RuntimeConfig)
    this.client = new A2AClient(config.agentBaseUrl)
  }

  async connect(config: RuntimeConfig): Promise<void> {
    try {
      // Test connection by fetching agent card
      this.agentCard = await this.client.getAgentCard()
      this.setConnected(true)
    } catch (error) {
      this.emitError(error as Error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    this.setConnected(false)
  }

  async sendTask(input: TaskInput): Promise<TaskResponse> {
    const params: MessageSendParams = {
      message: this.mapToA2AMessage(input.message),
      configuration: {
        blocking: true,
        acceptedOutputModes: ['message', 'task']
      }
    }

    const response = await this.client.sendMessage(params)
    
    // Handle different response types
    if ('error' in response) {
      throw new Error(`A2A Error: ${response.error.message}`)
    }

    return {
      task: this.mapA2AResponseToTask(response),
      streaming: false
    }
  }

  async *streamTask(input: TaskInput): AsyncIterable<TaskUpdate> {
    if (!this.supportsStreaming()) {
      throw new Error('Streaming not supported by this agent')
    }

    const params: MessageSendParams = {
      message: this.mapToA2AMessage(input.message),
      configuration: {
        blocking: false,
        acceptedOutputModes: ['message', 'task']
      }
    }

    const streamGenerator = this.client.sendMessageStream(params)

    try {
      for await (const eventData of streamGenerator) {
        const update = this.mapA2AEventToTaskUpdate(eventData)
        this.emitTaskUpdate(update)
        yield update
      }
    } catch (error) {
      this.emitError(error as Error)
      throw error
    }
  }

  async getTask(taskId: string): Promise<Task> {
    const response = await this.client.getTask({ taskId } as any)
    
    if ('error' in response) {
      throw new Error(`A2A Error: ${response.error.message}`)
    }

    return this.mapA2AResponseToTask(response.result)
  }

  async cancelTask(taskId: string): Promise<void> {
    const response = await this.client.cancelTask({ taskId } as any)
    
    if ('error' in response) {
      throw new Error(`A2A Error: ${response.error.message}`)
    }

  }

  async getAgentCard(): Promise<AgentCard> {
    if (!this.agentCard) {
      this.agentCard = await this.client.getAgentCard()
    }
    return this.mapA2AAgentCard(this.agentCard!)
  }

  async getCapabilities(): Promise<Capability[]> {
    const agentCard = await this.getAgentCard()
    return agentCard.capabilities
  }

  supportsStreaming(): boolean {
    return this.agentCard?.capabilities?.streaming === true
  }

  private mapToA2AMessage(message: Message): A2AMessage {
    return {
      kind: 'message',
      messageId: `msg-${Date.now()}`,
      role: message.role,
      parts: message.parts.map((part: any) => {
        if (part.type === 'text') {
          return {
            text: part.content as string
          } as A2APart
        } else if (part.type === 'file') {
          return {
            uri: part.content as string,
            mimeType: part.mimeType
          } as unknown as A2APart
        } else {
          return {
            data: part.content
          } as A2APart
        }
      })
    }
  }

  private mapA2AResponseToTask(result: any): Task {
    return {
      id: result.id || result.taskId,
      contextId: result.contextId,
      status: result.status || 'submitted',
      input: result.input || { message: { role: 'user', parts: [] } },
      artifacts: result.artifacts || [],
      messages: result.messages || [],
      progress: result.progress,
      error: result.error,
      createdAt: new Date(result.createdAt || Date.now()),
      updatedAt: new Date(result.updatedAt || Date.now())
    }
  }

  private mapA2AEventToTaskUpdate(event: any): TaskUpdate {
    return {
      taskId: event.taskId,
      status: event.status,
      progress: event.progress,
      artifacts: event.artifacts,
      messages: event.messages,
      error: event.error
    }
  }

  private mapA2AAgentCard(card: A2AAgentCard): AgentCard {
    return {
      name: card.name,
      description: card.description,
      capabilities: card.skills?.map((skill: any) => ({
        name: skill.name,
        description: skill.description,
        inputTypes: skill.defaultInputModes || card.defaultInputModes || [],
        outputTypes: skill.defaultOutputModes || card.defaultOutputModes || []
      })) || [],
      endpoints: { main: card.url },
      streaming: card.capabilities?.streaming || false,
      pushNotifications: card.capabilities?.pushNotifications || false
    }
  }
}

// Factory function for creating A2A runtime
export function createA2ARuntime(config: { agentBaseUrl: string; authentication?: any }): A2ARuntime {
  return new A2ARuntime(config as A2AConfig)
}