// Agent conversation primitive for managing chat sessions

import { AgentMessage, MessageManager, createMessage, MessageRole } from './message';

export interface ConversationConfig {
  id?: string;
  title?: string;
  systemPrompt?: string;
  maxMessages?: number;
  retentionPolicy?: 'all' | 'sliding_window' | 'summary';
  metadata?: Record<string, any>;
}

export interface ConversationState {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  isActive: boolean;
  metadata: Record<string, any>;
}

export interface ConversationSummary {
  conversationId: string;
  summary: string;
  messageRange: { start: string; end: string };
  createdAt: Date;
}

export class Conversation {
  private messageManager: MessageManager;
  private config: Required<ConversationConfig>;
  private state: ConversationState;
  private summaries: ConversationSummary[] = [];
  private listeners: Set<(state: ConversationState) => void> = new Set();

  constructor(config: ConversationConfig = {}) {
    this.messageManager = new MessageManager();
    this.config = {
      id: config.id || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: config.title || 'New Conversation',
      systemPrompt: config.systemPrompt || '',
      maxMessages: config.maxMessages || 1000,
      retentionPolicy: config.retentionPolicy || 'all',
      metadata: config.metadata || {}
    };

    this.state = {
      id: this.config.id,
      title: this.config.title,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
      isActive: true,
      metadata: this.config.metadata
    };

    // Add system message if provided
    if (this.config.systemPrompt) {
      this.addMessage('system', this.config.systemPrompt);
    }

    // Subscribe to message updates
    this.messageManager.subscribe(() => {
      this.updateState();
    });
  }

  addMessage(role: keyof MessageRole, content: string, metadata?: Record<string, any>): AgentMessage {
    const message = createMessage(role, content, { metadata });
    this.messageManager.addMessage(message);
    this.enforceRetentionPolicy();
    return message;
  }

  addUserMessage(content: string, metadata?: Record<string, any>): AgentMessage {
    return this.addMessage('user', content, metadata);
  }

  addAssistantMessage(content: string, metadata?: Record<string, any>): AgentMessage {
    return this.addMessage('assistant', content, metadata);
  }

  streamAssistantMessage(content: string, metadata?: Record<string, any>): AgentMessage {
    const message = createMessage('assistant', '', { 
      status: 'streaming',
      metadata 
    });
    this.messageManager.addMessage(message);
    return message;
  }

  updateMessage(messageId: string, updates: Partial<AgentMessage>): void {
    this.messageManager.updateMessage(messageId, updates);
  }

  getMessages(): AgentMessage[] {
    return this.messageManager.getMessages();
  }

  getLastMessage(): AgentMessage | undefined {
    const messages = this.getMessages();
    return messages[messages.length - 1];
  }

  getMessagesByRole(role: keyof MessageRole): AgentMessage[] {
    return this.getMessages().filter(msg => msg.role === role);
  }

  getState(): ConversationState {
    return { ...this.state };
  }

  updateTitle(title: string): void {
    this.state.title = title;
    this.updateState();
  }

  archive(): void {
    this.state.isActive = false;
    this.updateState();
  }

  restore(): void {
    this.state.isActive = true;
    this.updateState();
  }

  clear(): void {
    this.messageManager.clear();
    this.summaries = [];
    
    // Re-add system message if it exists
    if (this.config.systemPrompt) {
      this.addMessage('system', this.config.systemPrompt);
    }
    
    this.updateState();
  }

  export(): {
    config: ConversationConfig;
    state: ConversationState;
    messages: AgentMessage[];
    summaries: ConversationSummary[];
  } {
    return {
      config: this.config,
      state: this.state,
      messages: this.getMessages(),
      summaries: this.summaries
    };
  }

  subscribe(listener: (state: ConversationState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private updateState(): void {
    this.state.updatedAt = new Date();
    this.state.messageCount = this.getMessages().length;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  private enforceRetentionPolicy(): void {
    const messages = this.getMessages();
    
    if (this.config.retentionPolicy === 'sliding_window' && messages.length > this.config.maxMessages) {
      // Keep system messages and remove oldest user/assistant messages
      const systemMessages = messages.filter(msg => msg.role === 'system');
      const otherMessages = messages.filter(msg => msg.role !== 'system');
      
      const messagesToKeep = this.config.maxMessages - systemMessages.length;
      const keptMessages = otherMessages.slice(-messagesToKeep);
      
      this.messageManager.clear();
      [...systemMessages, ...keptMessages].forEach(msg => {
        this.messageManager.addMessage(msg);
      });
    }
  }

  private async createSummary(messages: AgentMessage[]): Promise<ConversationSummary> {
    // This would typically call an AI service to summarize
    // For now, return a basic summary
    const summary = `Conversation with ${messages.length} messages`;
    
    return {
      conversationId: this.state.id,
      summary,
      messageRange: {
        start: messages[0]?.id || '',
        end: messages[messages.length - 1]?.id || ''
      },
      createdAt: new Date()
    };
  }
}

export class ConversationManager {
  private conversations: Map<string, Conversation> = new Map();
  private activeConversationId: string | null = null;

  createConversation(config?: ConversationConfig): Conversation {
    const conversation = new Conversation(config);
    this.conversations.set(conversation.getState().id, conversation);
    this.activeConversationId = conversation.getState().id;
    return conversation;
  }

  getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  getActiveConversation(): Conversation | undefined {
    return this.activeConversationId ? this.conversations.get(this.activeConversationId) : undefined;
  }

  setActiveConversation(id: string): boolean {
    if (this.conversations.has(id)) {
      this.activeConversationId = id;
      return true;
    }
    return false;
  }

  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values());
  }

  getActiveConversations(): Conversation[] {
    return this.getAllConversations().filter(conv => conv.getState().isActive);
  }

  deleteConversation(id: string): boolean {
    const deleted = this.conversations.delete(id);
    if (this.activeConversationId === id) {
      this.activeConversationId = null;
    }
    return deleted;
  }

  archiveConversation(id: string): boolean {
    const conversation = this.conversations.get(id);
    if (conversation) {
      conversation.archive();
      return true;
    }
    return false;
  }
}