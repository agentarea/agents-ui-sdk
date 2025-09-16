// Agent primitive for managing AI agent instances and capabilities

import { AgentMessage, MessageContent } from './message';
import { Conversation } from './conversation';

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  type: 'tool' | 'skill' | 'knowledge' | 'integration';
  enabled: boolean;
  config?: Record<string, any>;
}

export interface AgentModel {
  id: string;
  name: string;
  provider: string;
  version?: string;
  contextWindow: number;
  maxTokens?: number;
  supportedFeatures: string[];
  pricing?: {
    inputTokens: number;
    outputTokens: number;
    currency: string;
  };
}

export interface AgentConfig {
  id?: string;
  name: string;
  description?: string;
  model: AgentModel;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  capabilities: AgentCapability[];
  metadata?: Record<string, any>;
}

export interface AgentState {
  id: string;
  name: string;
  status: 'idle' | 'thinking' | 'responding' | 'error' | 'offline';
  currentConversation?: string;
  activeCapabilities: string[];
  metrics: {
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
    averageResponseTime: number;
    uptime: number;
  };
  lastActivity: Date;
  createdAt: Date;
}

export interface AgentResponse {
  messageId: string;
  content: MessageContent[];
  metadata: {
    model: string;
    tokens: {
      input: number;
      output: number;
      total: number;
    };
    cost?: number;
    latency: number;
    reasoning?: string;
    toolCalls?: ToolCall[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
  executionTime?: number;
}

export interface AgentThinkingState {
  step: string;
  reasoning: string;
  confidence: number;
  nextActions: string[];
}

export class Agent {
  private config: Required<AgentConfig>;
  private state: AgentState;
  private conversations: Map<string, Conversation> = new Map();
  private listeners: Set<(state: AgentState) => void> = new Set();
  private thinkingListeners: Set<(thinking: AgentThinkingState) => void> = new Set();

  constructor(config: AgentConfig) {
    this.config = {
      id: config.id || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: config.name,
      description: config.description || '',
      model: config.model,
      systemPrompt: config.systemPrompt || '',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || config.model.maxTokens || 4096,
      capabilities: config.capabilities,
      metadata: config.metadata || {}
    };

    this.state = {
      id: this.config.id,
      name: this.config.name,
      status: 'idle',
      activeCapabilities: this.config.capabilities
        .filter(cap => cap.enabled)
        .map(cap => cap.id),
      metrics: {
        totalMessages: 0,
        totalTokens: 0,
        totalCost: 0,
        averageResponseTime: 0,
        uptime: 0
      },
      lastActivity: new Date(),
      createdAt: new Date()
    };
  }

  async processMessage(
    message: AgentMessage,
    conversation: Conversation,
    options?: {
      stream?: boolean;
      tools?: string[];
      reasoning?: boolean;
    }
  ): Promise<AgentResponse> {
    this.updateStatus('thinking');
    const startTime = Date.now();

    try {
      // Simulate thinking process
      if (options?.reasoning) {
        await this.simulateThinking(message.content[0]?.content || '');
      }

      this.updateStatus('responding');

      // Simulate AI processing
      const response = await this.generateResponse(message, conversation, options);
      
      // Update metrics
      const latency = Date.now() - startTime;
      this.updateMetrics(response.metadata.tokens.total, response.metadata.cost || 0, latency);
      
      this.updateStatus('idle');
      return response;

    } catch (error) {
      this.updateStatus('error');
      throw error;
    }
  }

  getCapability(id: string): AgentCapability | undefined {
    return this.config.capabilities.find(cap => cap.id === id);
  }

  enableCapability(id: string): boolean {
    const capability = this.getCapability(id);
    if (capability) {
      capability.enabled = true;
      if (!this.state.activeCapabilities.includes(id)) {
        this.state.activeCapabilities.push(id);
      }
      this.notifyStateListeners();
      return true;
    }
    return false;
  }

  disableCapability(id: string): boolean {
    const capability = this.getCapability(id);
    if (capability) {
      capability.enabled = false;
      this.state.activeCapabilities = this.state.activeCapabilities.filter(capId => capId !== id);
      this.notifyStateListeners();
      return true;
    }
    return false;
  }

  updateConfig(updates: Partial<AgentConfig>): void {
    Object.assign(this.config, updates);
    if (updates.name) {
      this.state.name = updates.name;
    }
    this.notifyStateListeners();
  }

  getState(): AgentState {
    return { ...this.state };
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  subscribe(listener: (state: AgentState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeToThinking(listener: (thinking: AgentThinkingState) => void): () => void {
    this.thinkingListeners.add(listener);
    return () => this.thinkingListeners.delete(listener);
  }

  private async simulateThinking(input: string): Promise<void> {
    const thinkingSteps = [
      { step: 'analyzing', reasoning: 'Analyzing user input and context', confidence: 0.3 },
      { step: 'planning', reasoning: 'Planning response strategy', confidence: 0.6 },
      { step: 'generating', reasoning: 'Generating response content', confidence: 0.9 }
    ];

    for (const thinking of thinkingSteps) {
      this.notifyThinkingListeners({
        ...thinking,
        nextActions: ['respond', 'clarify', 'use_tool']
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  private async generateResponse(
    message: AgentMessage,
    conversation: Conversation,
    options?: any
  ): Promise<AgentResponse> {
    // Simulate AI response generation
    const responseContent = `I understand your message: "${message.content[0]?.content}". How can I help you further?`;
    
    const tokens = {
      input: message.content[0]?.content.length || 0,
      output: responseContent.length,
      total: (message.content[0]?.content.length || 0) + responseContent.length
    };

    const cost = this.config.model.pricing ? 
      (tokens.input * this.config.model.pricing.inputTokens + tokens.output * this.config.model.pricing.outputTokens) / 1000000
      : 0;

    return {
      messageId: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: [{
        type: 'text',
        content: responseContent
      }],
      metadata: {
        model: this.config.model.id,
        tokens,
        cost,
        latency: Math.random() * 1000 + 500, // Simulate 500-1500ms latency
        reasoning: options?.reasoning ? 'Analyzed input and generated contextual response' : undefined
      }
    };
  }

  private updateStatus(status: AgentState['status']): void {
    this.state.status = status;
    this.state.lastActivity = new Date();
    this.notifyStateListeners();
  }

  private updateMetrics(tokens: number, cost: number, latency: number): void {
    this.state.metrics.totalMessages++;
    this.state.metrics.totalTokens += tokens;
    this.state.metrics.totalCost += cost;
    
    // Update average response time
    const totalResponses = this.state.metrics.totalMessages;
    this.state.metrics.averageResponseTime = 
      (this.state.metrics.averageResponseTime * (totalResponses - 1) + latency) / totalResponses;
  }

  private notifyStateListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  private notifyThinkingListeners(thinking: AgentThinkingState): void {
    this.thinkingListeners.forEach(listener => listener(thinking));
  }
}

export class AgentRegistry {
  private agents: Map<string, Agent> = new Map();
  private listeners: Set<(agents: Agent[]) => void> = new Set();

  registerAgent(agent: Agent): void {
    this.agents.set(agent.getState().id, agent);
    this.notifyListeners();
  }

  unregisterAgent(id: string): boolean {
    const deleted = this.agents.delete(id);
    if (deleted) {
      this.notifyListeners();
    }
    return deleted;
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getActiveAgents(): Agent[] {
    return this.getAllAgents().filter(agent => 
      agent.getState().status !== 'offline'
    );
  }

  findAgentsByCapability(capabilityId: string): Agent[] {
    return this.getAllAgents().filter(agent =>
      agent.getState().activeCapabilities.includes(capabilityId)
    );
  }

  subscribe(listener: (agents: Agent[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getAllAgents()));
  }
}