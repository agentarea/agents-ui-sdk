import { forwardRef, HTMLAttributes } from "react";
import {
  useAgent,
  useAgentCapabilities,
  useConnection,
} from "../../hooks/use-agent";
import type { Capability } from "@agentarea/core";

// Root container for agent component
export interface AgentRootProps extends HTMLAttributes<HTMLDivElement> {}

const AgentRoot = forwardRef<HTMLDivElement, AgentRootProps>(
  ({ children, ...props }, ref) => {
    const { agentCard } = useAgent();

    return (
      <div ref={ref} data-agent={agentCard?.name} {...props}>
        {children}
      </div>
    );
  }
);
AgentRoot.displayName = "AgentPrimitive.Root";

// Agent name display
export interface AgentNameProps extends HTMLAttributes<HTMLDivElement> {}

const AgentName = forwardRef<HTMLDivElement, AgentNameProps>(
  ({ children, ...props }, ref) => {
    const { agentCard } = useAgent();

    return (
      <div ref={ref} {...props}>
        {children || agentCard?.name || "Unknown Agent"}
      </div>
    );
  }
);
AgentName.displayName = "AgentPrimitive.Name";

// Agent description display
export interface AgentDescriptionProps extends HTMLAttributes<HTMLDivElement> {}

const AgentDescription = forwardRef<HTMLDivElement, AgentDescriptionProps>(
  ({ children, ...props }, ref) => {
    const { agentCard } = useAgent();

    return (
      <div ref={ref} {...props}>
        {children || agentCard?.description || ""}
      </div>
    );
  }
);
AgentDescription.displayName = "AgentPrimitive.Description";

// Agent connection status
export interface AgentStatusProps extends HTMLAttributes<HTMLDivElement> {}

const AgentStatus = forwardRef<HTMLDivElement, AgentStatusProps>(
  ({ children, ...props }, ref) => {
    const { isConnected } = useConnection();

    return (
      <div ref={ref} data-connected={isConnected} {...props}>
        {children || (isConnected ? "Connected" : "Disconnected")}
      </div>
    );
  }
);
AgentStatus.displayName = "AgentPrimitive.Status";

// Agent capabilities list
export interface AgentCapabilitiesProps extends HTMLAttributes<HTMLDivElement> {
  renderCapability?: (capability: Capability, index: number) => React.ReactNode;
}

const AgentCapabilities = forwardRef<HTMLDivElement, AgentCapabilitiesProps>(
  ({ renderCapability, children, ...props }, ref) => {
    const capabilities = useAgentCapabilities();

    return (
      <div ref={ref} {...props}>
        {children || (
          <div>
            {capabilities.map((capability, index) => (
              <div key={capability.name}>
                {renderCapability ? (
                  renderCapability(capability, index)
                ) : (
                  <div>
                    <div>{capability.name}</div>
                    <div>{capability.description}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
AgentCapabilities.displayName = "AgentPrimitive.Capabilities";

// Individual capability display
export interface AgentCapabilityProps extends HTMLAttributes<HTMLDivElement> {
  capability: Capability;
}

const AgentCapability = forwardRef<HTMLDivElement, AgentCapabilityProps>(
  ({ capability, children, ...props }, ref) => {
    return (
      <div ref={ref} {...props}>
        {children || (
          <div>
            <div>{capability.name}</div>
            <div>{capability.description}</div>
            <div>Input Types: {capability.inputTypes.join(", ")}</div>
            <div>Output Types: {capability.outputTypes.join(", ")}</div>
          </div>
        )}
      </div>
    );
  }
);
AgentCapability.displayName = "AgentPrimitive.Capability";

// Feature support indicators
export interface AgentFeaturesProps extends HTMLAttributes<HTMLDivElement> {}

const AgentFeatures = forwardRef<HTMLDivElement, AgentFeaturesProps>(
  ({ children, ...props }, ref) => {
    const { supportsStreaming, supportsPushNotifications } = useAgent();

    return (
      <div ref={ref} {...props}>
        {children || (
          <div>
            <div data-feature="streaming" data-supported={supportsStreaming()}>
              Streaming: {supportsStreaming() ? "Supported" : "Not Supported"}
            </div>
            <div
              data-feature="push"
              data-supported={supportsPushNotifications()}
            >
              Push Notifications:{" "}
              {supportsPushNotifications() ? "Supported" : "Not Supported"}
            </div>
          </div>
        )}
      </div>
    );
  }
);
AgentFeatures.displayName = "AgentPrimitive.Features";

// Conditional rendering based on agent state
export interface AgentIfProps extends HTMLAttributes<HTMLDivElement> {
  connected?: boolean;
  hasCapabilities?: boolean;
  supportsStreaming?: boolean;
  supportsPushNotifications?: boolean;
}

const AgentIf = forwardRef<HTMLDivElement, AgentIfProps>(
  (
    {
      connected,
      hasCapabilities,
      supportsStreaming: supportsStreamingProp,
      supportsPushNotifications: supportsPushProp,
      children,
      ...props
    },
    ref
  ) => {
    const { isConnected, supportsStreaming, supportsPushNotifications } =
      useAgent();
    const capabilities = useAgentCapabilities();

    // Check connection condition
    if (connected !== undefined && isConnected !== connected) return null;

    // Check capabilities condition
    if (
      hasCapabilities !== undefined &&
      capabilities.length > 0 !== hasCapabilities
    )
      return null;

    // Check streaming support condition
    if (
      supportsStreamingProp !== undefined &&
      supportsStreaming() !== supportsStreamingProp
    )
      return null;

    // Check push notifications support condition
    if (
      supportsPushProp !== undefined &&
      supportsPushNotifications() !== supportsPushProp
    )
      return null;

    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    );
  }
);
AgentIf.displayName = "AgentPrimitive.If";

// Export as namespace
export const AgentPrimitive = {
  Root: AgentRoot,
  Name: AgentName,
  Description: AgentDescription,
  Status: AgentStatus,
  Capabilities: AgentCapabilities,
  Capability: AgentCapability,
  Features: AgentFeatures,
  If: AgentIf,
};
