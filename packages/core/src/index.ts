// Core AgentArea UI SDK exports

// Runtime exports
export * from './runtime';

// Agent primitives exports - Core building blocks for agent interfaces
export * from './primitives';

// Type exports (avoiding conflicts with runtime exports)
export type {
  // Environment types
  RuntimeEnvironment,
  EnvironmentCapabilities,
  BuildEnvironment,
  SSRCompatibility,
  AgentUIConfig,
  DynamicImportConfig,
  
  // Core types
  Message,
  MessagePart,
  TaskInput,
  Task,
  TaskStatus,
  TaskResponse,
  TaskProgress,
  TaskError,
  TaskUpdate,
  Artifact,
  EnhancedArtifact,
  TaskInputRequest,
  InputResponse,
  TaskWithInputs,
  CommunicationBlock,
  ValidationRule,
  InputOption,
  FormField,
  Subscription,
  AgentUpdate,
  ProtocolMessage,
  AgentCard,
  Capability,
  ArtifactMetadata,
  Connection,
  ConnectionConfig,
  RuntimeEvent,
  ValidationError,
  RuntimeConfig,
  AuthConfig
} from './types';

// Transport types
export type { RestEndpointMapping } from './transport';

// Export both the interface and the concrete implementation
export type { AgentRuntime } from './types';
export { AgentAreaRuntime } from './runtime/agentarea-runtime';
export { A2ARuntime } from './runtime/a2a-runtime';
export { createRuntimeFactory } from './runtime/runtime-factory';
