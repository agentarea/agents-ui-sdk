// Agent message primitive for conversation interfaces

export interface MessageRole {
  user: 'user';
  assistant: 'assistant';
  system: 'system';
  tool: 'tool';
}

export interface MessageContent {
  type: 'text' | 'image' | 'audio' | 'file' | 'code' | 'tool_call' | 'tool_result';
  content: string;
  metadata?: Record<string, any>;
}

export interface AgentMessage {
  id: string;
  role: keyof MessageRole;
  content: MessageContent[];
  timestamp: Date;
  status?: 'pending' | 'streaming' | 'complete' | 'error';
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
    latency?: number;
    [key: string]: any;
  };
}

export interface MessageStreamChunk {
  messageId: string;
  delta: Partial<MessageContent>;
  isComplete: boolean;
}

export class MessageManager {
  private messages: Map<string, AgentMessage> = new Map();
  private listeners: Set<(message: AgentMessage) => void> = new Set();

  addMessage(message: AgentMessage): void {
    this.messages.set(message.id, message);
    this.notifyListeners(message);
  }

  updateMessage(id: string, updates: Partial<AgentMessage>): void {
    const existing = this.messages.get(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.messages.set(id, updated);
      this.notifyListeners(updated);
    }
  }

  streamMessage(chunk: MessageStreamChunk): void {
    const existing = this.messages.get(chunk.messageId);
    if (existing && chunk.delta.content) {
      const lastContent = existing.content[existing.content.length - 1];
      if (lastContent && lastContent.type === chunk.delta.type) {
        lastContent.content += chunk.delta.content;
      } else if (chunk.delta.content) {
        existing.content.push({
          type: chunk.delta.type || 'text',
          content: chunk.delta.content
        });
      }
      
      if (chunk.isComplete) {
        existing.status = 'complete';
      }
      
      this.notifyListeners(existing);
    }
  }

  getMessage(id: string): AgentMessage | undefined {
    return this.messages.get(id);
  }

  getMessages(): AgentMessage[] {
    return Array.from(this.messages.values()).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  subscribe(listener: (message: AgentMessage) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(message: AgentMessage): void {
    this.listeners.forEach(listener => listener(message));
  }

  clear(): void {
    this.messages.clear();
  }
}

export const createMessage = (
  role: keyof MessageRole,
  content: string | MessageContent[],
  options?: Partial<AgentMessage>
): AgentMessage => {
  const messageContent: MessageContent[] = typeof content === 'string'
    ? [{ type: 'text', content }]
    : content;

  return {
    id: options?.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    role,
    content: messageContent,
    timestamp: new Date(),
    status: 'complete',
    ...options
  };
};