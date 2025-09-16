// Agent primitives - Core building blocks for agent interfaces

// Message primitives
export type {
  MessageRole,
  MessageContent,
  AgentMessage,
  MessageStreamChunk
} from './message';
export {
  MessageManager,
  createMessage
} from './message';

// Conversation primitives
export type {
  ConversationConfig,
  ConversationState,
  ConversationSummary
} from './conversation';
export {
  Conversation,
  ConversationManager
} from './conversation';

// Agent primitives
export type {
  AgentCapability,
  AgentModel,
  AgentConfig,
  AgentState,
  AgentResponse,
  ToolCall,
  AgentThinkingState
} from './agent';
export {
  Agent,
  AgentRegistry
} from './agent';

// Tool primitives
export type {
  ToolParameter,
  ToolSchema,
  ToolExecution,
  ToolConfig,
  ToolFunction
} from './tool';
export {
  Tool,
  ToolRegistry,
  createBuiltinTools
} from './tool';

// Utility functions for creating agent instances
export const createAgent = (config: import('./agent').AgentConfig): import('./agent').Agent => {
  return new (require('./agent').Agent)(config);
};

export const createConversation = (config?: import('./conversation').ConversationConfig): import('./conversation').Conversation => {
  return new (require('./conversation').Conversation)(config);
};

export const createTool = (
  schema: import('./tool').ToolSchema,
  implementation: import('./tool').ToolFunction,
  config?: import('./tool').ToolConfig
): import('./tool').Tool => {
  return new (require('./tool').Tool)(schema, implementation, config);
};