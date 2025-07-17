import React, { ReactNode } from 'react'
import { dynamic, withSSRSafety } from '../../lib/dynamic-import'
import { useRuntimeEnvironment, useSSRCompatibility } from '../../hooks/use-runtime-environment'
import type { AgentUIProps } from '../agent-ui'

/**
 * SSR-safe wrapper for AgentUI component
 * Handles hydration mismatches and client-only features
 */
export interface AgentUISSRProps extends AgentUIProps {
  // SSR-specific props
  suppressHydrationWarning?: boolean
  serverFallback?: ReactNode
  loadingFallback?: ReactNode
  
  // Feature flags for conditional rendering
  enableRealTime?: boolean
  enableFileUpload?: boolean
  enableDevTools?: boolean
}

/**
 * Main SSR-safe AgentUI component
 */
export function AgentUISSR({
  suppressHydrationWarning = true,
  serverFallback,
  loadingFallback,
  enableRealTime = true,
  enableFileUpload = true,
  enableDevTools = false,
  ...agentUIProps
}: AgentUISSRProps) {
  const environment = useRuntimeEnvironment()
  const ssrCompatibility = useSSRCompatibility()

  // Server-side fallback
  if (environment.isServer && serverFallback) {
    return <>{serverFallback}</>
  }

  // For now, directly import AgentUI to avoid complex typing issues
  // This will be improved in future iterations
  const { AgentUI } = require('../agent-ui')

  return (
    <div suppressHydrationWarning={suppressHydrationWarning}>
      <AgentUI {...agentUIProps} />
    </div>
  )
}

/**
 * Loading skeleton for AgentUI
 */
function AgentUILoadingSkeleton() {
  return (
    <div className="agent-ui-skeleton animate-pulse">
      <div className="h-8 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  )
}

/**
 * Offline/fallback component when AgentUI cannot load
 */
function AgentUIOfflineFallback() {
  return (
    <div className="agent-ui-offline p-4 border border-gray-200 rounded bg-gray-50">
      <div className="text-gray-800 font-medium mb-2">Agent UI Unavailable</div>
      <div className="text-gray-600 text-sm">
        The agent interface is currently unavailable. This may be due to:
      </div>
      <ul className="text-gray-600 text-sm mt-2 ml-4 list-disc">
        <li>Network connectivity issues</li>
        <li>Browser compatibility limitations</li>
        <li>Server-side rendering constraints</li>
      </ul>
      <button
        onClick={() => window.location.reload()}
        className="mt-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
      >
        Retry
      </button>
    </div>
  )
}

/**
 * SSR-safe AgentUI.Provider
 */
export function AgentUIProviderSSR(props: any) {
  const { AgentUI } = require('../agent-ui')
  return <AgentUI.Provider {...props} />
}

/**
 * SSR-safe AgentUI.Connection with conditional WebSocket features
 */
export function AgentUIConnectionSSR(props: any) {
  const environment = useRuntimeEnvironment()

  // Disable real-time features on server or when WebSockets unavailable
  const connectionProps = {
    ...props,
    showLatency: props.showLatency && environment.supportsWebSockets,
    realTimeUpdates: props.realTimeUpdates && environment.supportsWebSockets
  }

  const { AgentUI } = require('../agent-ui')
  return <AgentUI.Connection {...connectionProps} />
}

function ConnectionFallback() {
  return (
    <div className="connection-fallback p-2 bg-gray-100 rounded">
      <div className="text-sm text-gray-600">Connection status unavailable</div>
    </div>
  )
}

/**
 * SSR-safe AgentUI.Debug (client-only)
 */
export function AgentUIDebugSSR(props: any) {
  const environment = useRuntimeEnvironment()
  
  // Only render on client side
  if (environment.isServer) {
    return null
  }
  
  const { AgentUI } = require('../agent-ui')
  return <AgentUI.Debug {...props} />
}

/**
 * Hydration-safe wrapper for any AgentUI component
 */
export function withHydrationSafety<T extends object>(
  Component: React.ComponentType<T>,
  displayName?: string
) {
  const HydrationSafeComponent = function(props: T) {
    const environment = useRuntimeEnvironment()
    const [isHydrated, setIsHydrated] = React.useState(false)

    React.useEffect(() => {
      setIsHydrated(true)
    }, [])

    // Show loading state during hydration
    if (environment.isClient && !isHydrated) {
      return <div className="hydration-loading">Loading...</div>
    }

    return <Component {...props} />
  }

  HydrationSafeComponent.displayName = displayName || `HydrationSafe(${Component.displayName || Component.name})`
  
  return HydrationSafeComponent
}

/**
 * Hook for managing hydration state
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = React.useState(false)
  const environment = useRuntimeEnvironment()

  React.useEffect(() => {
    if (environment.isClient) {
      setIsHydrated(true)
    }
  }, [environment.isClient])

  return {
    isHydrated,
    isHydrating: environment.isClient && !isHydrated,
    isServer: environment.isServer
  }
}

/**
 * Component for handling hydration mismatches
 */
export function HydrationBoundary({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  const { isHydrated, isHydrating } = useHydration()

  if (isHydrating) {
    return <>{fallback || <div className="hydrating">Hydrating...</div>}</>
  }

  return <>{children}</>
}