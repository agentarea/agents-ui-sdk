// Runtime factory and management system

import type {
  AgentRuntime,
  RuntimeConfig,
  RuntimeFactory as IRuntimeFactory,
  RuntimeManager as IRuntimeManager,
  TaskInput,
  TaskResponse,
  ProtocolMessage,
} from "../types";
import { A2ARuntime, type A2AConfig } from "./a2a-runtime";
import { AgentAreaRuntime, type AgentAreaConfig } from "./agentarea-runtime";

// Runtime Factory Implementation
export class RuntimeFactory {
  private static instance: RuntimeFactory | null = null;

  // Singleton pattern for global factory access
  static getInstance(): RuntimeFactory {
    if (!RuntimeFactory.instance) {
      RuntimeFactory.instance = new RuntimeFactory();
    }
    return RuntimeFactory.instance;
  }

  createRuntime(
    protocolType: "a2a" | "agentarea",
    config: RuntimeConfig
  ): AgentRuntime {
    switch (protocolType) {
      case "a2a":
        return new A2ARuntime(config as A2AConfig);
      case "agentarea":
        return new AgentAreaRuntime(config as AgentAreaConfig);
      default:
        throw new Error(`Unsupported protocol type: ${protocolType}`);
    }
  }

  getSupportedProtocols(): string[] {
    return ["a2a", "agentarea"];
  }

  async detectProtocol(endpoint: string): Promise<string> {
    // Try to detect protocol by examining endpoint characteristics
    try {
      // Check for A2A protocol indicators
      if (await this.isA2AEndpoint(endpoint)) {
        return "a2a";
      }

      // Check for AgentArea protocol indicators
      if (await this.isAgentAreaEndpoint(endpoint)) {
        return "agentarea";
      }

      // Default fallback
      throw new Error("Unable to detect protocol type");
    } catch (error) {
      throw new Error(`Protocol detection failed: ${(error as Error).message}`);
    }
  }

  private async isA2AEndpoint(endpoint: string): Promise<boolean> {
    try {
      // Try to fetch A2A agent card
      const response = await fetch(`${endpoint}/agent-card`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        // Check for A2A-specific fields
        return !!(
          data.name &&
          data.description &&
          (data.skills || data.capabilities)
        );
      }
    } catch (error) {
      // Ignore errors, continue with other checks
    }
    return false;
  }

  private async isAgentAreaEndpoint(endpoint: string): Promise<boolean> {
    try {
      // Try to access AgentArea-specific health endpoint
      const response = await fetch(`${endpoint}/health`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        // Check for AgentArea-specific fields
        return !!(data.service && data.service.includes("agentarea"));
      }
    } catch (error) {
      // Ignore errors, continue with other checks
    }
    return false;
  }

  // Create runtime with automatic protocol detection
  async createRuntimeWithDetection(
    endpoint: string,
    config: RuntimeConfig
  ): Promise<AgentRuntime> {
    const protocolType = await this.detectProtocol(endpoint);

    // Merge endpoint into config
    const enhancedConfig = {
      ...config,
      endpoint,
    };

    return this.createRuntime(
      protocolType as "a2a" | "agentarea",
      enhancedConfig
    );
  }

  // Validate runtime configuration
  validateRuntimeConfig(
    protocolType: string,
    config: RuntimeConfig
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Common validation
    if (!config.endpoint) {
      errors.push("Endpoint is required");
    }

    // Protocol-specific validation
    switch (protocolType) {
      case "a2a":
        if (!config.endpoint?.includes("http")) {
          errors.push("A2A protocol requires HTTP/HTTPS endpoint");
        }
        break;
      case "agentarea":
        if (!config.authentication?.token && !config.authentication?.apiKey) {
          errors.push(
            "AgentArea protocol requires authentication token or API key"
          );
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Runtime Manager Implementation
export class RuntimeManager implements IRuntimeManager {
  runtimes: Map<string, AgentRuntime> = new Map();
  activeRuntime?: AgentRuntime;
  private eventListeners: Set<(event: RuntimeManagerEvent) => void> = new Set();

  constructor() {
    // Initialize with default factory
    this.factory = RuntimeFactory.getInstance();
  }

  private factory: RuntimeFactory;

  // Runtime registration and management
  registerRuntime(id: string, runtime: AgentRuntime): void {
    // Unregister existing runtime with same ID
    if (this.runtimes.has(id)) {
      this.unregisterRuntime(id);
    }

    this.runtimes.set(id, runtime);

    // Set as active if it's the first runtime
    if (!this.activeRuntime) {
      this.activeRuntime = runtime;
    }

    this.emitEvent({
      type: "runtime-registered",
      runtimeId: id,
      runtime,
    });
  }

  unregisterRuntime(id: string): void {
    const runtime = this.runtimes.get(id);
    if (runtime) {
      // Disconnect runtime before unregistering
      runtime.disconnect().catch((error) => {
        console.error(`Error disconnecting runtime ${id}:`, error);
      });

      this.runtimes.delete(id);

      // Update active runtime if necessary
      if (this.activeRuntime === runtime) {
        this.activeRuntime = this.runtimes.values().next().value || undefined;
      }

      this.emitEvent({
        type: "runtime-unregistered",
        runtimeId: id,
        runtime,
      });
    }
  }

  async switchRuntime(runtimeId: string): Promise<void> {
    const runtime = this.runtimes.get(runtimeId);
    if (!runtime) {
      throw new Error(`Runtime ${runtimeId} not found`);
    }

    const previousRuntime = this.activeRuntime;
    this.activeRuntime = runtime;

    this.emitEvent({
      type: "runtime-switched",
      runtimeId,
      runtime,
      previousRuntime,
    });
  }

  getRuntime(protocolType: string): AgentRuntime | undefined {
    // Find runtime by protocol type
    for (const [id, runtime] of this.runtimes) {
      if (runtime.protocolType === protocolType) {
        return runtime;
      }
    }
    return undefined;
  }

  getRuntimeById(id: string): AgentRuntime | undefined {
    return this.runtimes.get(id);
  }

  getAllRuntimes(): Map<string, AgentRuntime> {
    return new Map(this.runtimes);
  }

  getActiveRuntime(): AgentRuntime | undefined {
    return this.activeRuntime;
  }

  // Multi-protocol operations
  async submitTaskToAnyRuntime(
    input: TaskInput,
    preferredProtocol?: string
  ): Promise<TaskResponse> {
    let runtime: AgentRuntime | undefined;

    // Try preferred protocol first
    if (preferredProtocol) {
      runtime = this.getRuntime(preferredProtocol);
    }

    // Fall back to active runtime
    if (!runtime) {
      runtime = this.activeRuntime;
    }

    // Fall back to any available runtime
    if (!runtime && this.runtimes.size > 0) {
      runtime = this.runtimes.values().next().value;
    }

    if (!runtime) {
      throw new Error("No runtime available for task submission");
    }

    try {
      return await runtime.submitTask(input);
    } catch (error) {
      // Try other runtimes if the preferred one fails
      for (const [id, fallbackRuntime] of this.runtimes) {
        if (fallbackRuntime !== runtime) {
          try {
            return await fallbackRuntime.submitTask(input);
          } catch (fallbackError) {
            // Continue to next runtime
          }
        }
      }

      // If all runtimes fail, throw the original error
      throw error;
    }
  }

  async broadcastMessage(
    message: ProtocolMessage,
    protocols?: string[]
  ): Promise<void> {
    const targetRuntimes = protocols
      ? Array.from(this.runtimes.values()).filter((runtime) =>
          protocols.includes(runtime.protocolType)
        )
      : Array.from(this.runtimes.values());

    if (targetRuntimes.length === 0) {
      throw new Error("No runtimes available for message broadcast");
    }

    const results = await Promise.allSettled(
      targetRuntimes.map((runtime) => runtime.sendMessage(message, "broadcast"))
    );

    // Check if any broadcasts succeeded
    const successful = results.filter(
      (result) => result.status === "fulfilled"
    );
    if (successful.length === 0) {
      const errors = results
        .filter((result) => result.status === "rejected")
        .map((result) => (result as PromiseRejectedResult).reason.message)
        .join(", ");
      throw new Error(`All message broadcasts failed: ${errors}`);
    }
  }

  // Runtime creation and auto-registration
  async createAndRegisterRuntime(
    id: string,
    protocolType: "a2a" | "agentarea",
    config: RuntimeConfig
  ): Promise<AgentRuntime> {
    const runtime = this.factory.createRuntime(protocolType, config);
    this.registerRuntime(id, runtime);
    return runtime;
  }

  async createAndRegisterRuntimeWithDetection(
    id: string,
    endpoint: string,
    config: RuntimeConfig
  ): Promise<AgentRuntime> {
    const runtime = await this.factory.createRuntimeWithDetection(
      endpoint,
      config
    );
    this.registerRuntime(id, runtime);
    return runtime;
  }

  // Connection management
  async connectAll(): Promise<void> {
    const connections = Array.from(this.runtimes.entries()).map(
      async ([id, runtime]) => {
        try {
          if (runtime.config?.endpoint) {
            await runtime.connect(runtime.config.endpoint, {
              endpoint: runtime.config.endpoint,
              authentication: runtime.config.authentication || {
                type: "bearer",
              },
              protocols: [runtime.protocolType],
            });
          }
        } catch (error) {
          console.error(`Failed to connect runtime ${id}:`, error);
        }
      }
    );

    await Promise.allSettled(connections);
  }

  async disconnectAll(): Promise<void> {
    const disconnections = Array.from(this.runtimes.values()).map((runtime) =>
      runtime.disconnect()
    );

    await Promise.allSettled(disconnections);
  }

  // Event management
  addEventListener(listener: (event: RuntimeManagerEvent) => void): void {
    this.eventListeners.add(listener);
  }

  removeEventListener(listener: (event: RuntimeManagerEvent) => void): void {
    this.eventListeners.delete(listener);
  }

  private emitEvent(event: RuntimeManagerEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in runtime manager event listener:", error);
      }
    });
  }

  // Cleanup
  async dispose(): Promise<void> {
    await this.disconnectAll();
    this.runtimes.clear();
    this.activeRuntime = undefined;
    this.eventListeners.clear();
  }

  // Health check
  async healthCheck(): Promise<RuntimeHealthStatus> {
    const runtimeStatuses = new Map<string, boolean>();

    for (const [id, runtime] of this.runtimes) {
      try {
        const isConnected = runtime.isConnected?.() || false;
        runtimeStatuses.set(id, isConnected);
      } catch (error) {
        runtimeStatuses.set(id, false);
      }
    }

    const totalRuntimes = this.runtimes.size;
    const connectedRuntimes = Array.from(runtimeStatuses.values()).filter(
      Boolean
    ).length;

    return {
      totalRuntimes,
      connectedRuntimes,
      runtimeStatuses,
      healthy: connectedRuntimes > 0,
      activeRuntimeId: this.activeRuntime
        ? this.findRuntimeId(this.activeRuntime)
        : undefined,
    };
  }

  private findRuntimeId(runtime: AgentRuntime): string | undefined {
    for (const [id, r] of this.runtimes) {
      if (r === runtime) {
        return id;
      }
    }
    return undefined;
  }
}

// Event types for runtime manager
export type RuntimeManagerEvent =
  | { type: "runtime-registered"; runtimeId: string; runtime: AgentRuntime }
  | { type: "runtime-unregistered"; runtimeId: string; runtime: AgentRuntime }
  | {
      type: "runtime-switched";
      runtimeId: string;
      runtime: AgentRuntime;
      previousRuntime?: AgentRuntime;
    };

export interface RuntimeHealthStatus {
  totalRuntimes: number;
  connectedRuntimes: number;
  runtimeStatuses: Map<string, boolean>;
  healthy: boolean;
  activeRuntimeId?: string;
}

// Convenience functions
export function createRuntimeFactory(): RuntimeFactory {
  return RuntimeFactory.getInstance();
}

export function createRuntimeManager(): RuntimeManager {
  return new RuntimeManager();
}

// Global runtime manager instance (optional)
let globalRuntimeManager: RuntimeManager | null = null;

export function getGlobalRuntimeManager(): RuntimeManager {
  if (!globalRuntimeManager) {
    globalRuntimeManager = new RuntimeManager();
  }
  return globalRuntimeManager;
}

export function setGlobalRuntimeManager(manager: RuntimeManager): void {
  globalRuntimeManager = manager;
}
