import { useAgentContext } from '../components/providers/agent-provider'
import type { AgentRuntime, AgentCard, Capability } from '@agentarea/core'

export function useAgent() {
  const { runtime, isConnected, agentCard, capabilities, error } = useAgentContext()

  return {
    runtime,
    isConnected,
    agentCard,
    capabilities,
    error,
    
    // Helper methods
    supportsStreaming: () => runtime?.supportsStreaming() ?? false,
    supportsPushNotifications: () => runtime?.supportsPushNotifications() ?? false,
  }
}

export function useAgentRuntime(): AgentRuntime {
  const { runtime } = useAgentContext()
  if (!runtime) {
    throw new Error('No agent runtime available')
  }
  return runtime
}

export function useAgentCard(): AgentCard | null {
  const { agentCard } = useAgentContext()
  return agentCard
}

export function useAgentCapabilities(): Capability[] {
  const { capabilities } = useAgentContext()
  return capabilities
}

export function useConnection() {
  const { isConnected, error, runtime } = useAgentContext()

  const connect = async () => {
    if (runtime && !isConnected) {
      await runtime.connect(runtime.config)
    }
  }

  const disconnect = async () => {
    if (runtime && isConnected) {
      await runtime.disconnect()
    }
  }

  return {
    isConnected,
    error,
    connect,
    disconnect
  }
}