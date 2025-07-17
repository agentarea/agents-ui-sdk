import { useMemo } from 'react'
import type { RuntimeEnvironment } from '@agentarea/core'

/**
 * Hook for detecting the current runtime environment
 * Provides information about Next.js, Vite, SSR capabilities, and browser features
 */
export function useRuntimeEnvironment(): RuntimeEnvironment {
  return useMemo(() => {
    // Server-side detection
    const isServer = typeof window === 'undefined'
    const isClient = !isServer

    // Framework detection (client-side only)
    let isNextJS = false
    let isVite = false

    if (isClient) {
      // Next.js detection
      isNextJS = '__NEXT_DATA__' in window || 
                 (typeof window !== 'undefined' && (window as any).next !== undefined) ||
                 (typeof process !== 'undefined' && process.env?.NEXT_RUNTIME !== undefined)

      // Vite detection
      isVite = '__vite_plugin_react_preamble_installed__' in window ||
               (typeof window !== 'undefined' && (window as any).__vite_plugin_react_preamble_installed__ !== undefined) ||
               (typeof import.meta !== 'undefined' && (import.meta as any).hot !== undefined)
    }

    // Browser API support detection (client-side only)
    const supportsWebSockets = isClient && typeof WebSocket !== 'undefined'
    const supportsFileAPI = isClient && typeof File !== 'undefined' && typeof FileReader !== 'undefined'
    const supportsServiceWorker = isClient && 'serviceWorker' in navigator
    const supportsIndexedDB = isClient && 'indexedDB' in window

    return {
      isServer,
      isClient,
      isNextJS,
      isVite,
      supportsWebSockets,
      supportsFileAPI,
      supportsServiceWorker,
      supportsIndexedDB
    }
  }, [])
}

/**
 * Hook for detecting environment capabilities based on runtime environment
 */
export function useEnvironmentCapabilities() {
  const environment = useRuntimeEnvironment()

  return useMemo(() => ({
    realTimeUpdates: environment.supportsWebSockets,
    fileUpload: environment.supportsFileAPI,
    fileDownload: environment.isClient,
    notifications: environment.isClient && 'Notification' in window,
    backgroundSync: environment.supportsServiceWorker,
    offlineStorage: environment.supportsIndexedDB
  }), [environment])
}

/**
 * Hook for detecting build environment information
 */
export function useBuildEnvironment() {
  const environment = useRuntimeEnvironment()

  return useMemo(() => {
    let mode: 'development' | 'production' | 'test' = 'production'
    let bundler: 'webpack' | 'vite' | 'rollup' | 'esbuild' | 'unknown' = 'unknown'
    let framework: 'nextjs' | 'react' | 'vue' | 'svelte' | 'unknown' = 'react'

    // Mode detection
    if (typeof process !== 'undefined') {
      if (process.env.NODE_ENV === 'development') mode = 'development'
      else if (process.env.NODE_ENV === 'test') mode = 'test'
    }

    // Bundler detection
    if (environment.isVite) {
      bundler = 'vite'
    } else if (environment.isNextJS) {
      bundler = 'webpack' // Next.js uses webpack by default
    }

    // Framework detection
    if (environment.isNextJS) {
      framework = 'nextjs'
    }

    return {
      mode,
      bundler,
      framework,
      target: 'web' as const
    }
  }, [environment])
}

/**
 * Hook for checking SSR compatibility
 */
export function useSSRCompatibility() {
  const environment = useRuntimeEnvironment()

  return useMemo(() => ({
    supportsSsr: environment.isNextJS, // Could be extended for other SSR frameworks
    supportsStaticGeneration: environment.isNextJS,
    requiresClientOnly: false, // Components that require client-only rendering
    hydrationSafe: true // Whether components are safe for hydration
  }), [environment])
}

/**
 * Hook for validating AgentUI configuration against current environment
 */
export function useConfigValidation(config: any) {
  const environment = useRuntimeEnvironment()
  const capabilities = useEnvironmentCapabilities()

  return useMemo(() => {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for WebSocket requirements
    if (config?.realTime && !capabilities.realTimeUpdates) {
      errors.push('Real-time updates require WebSocket support')
    }

    // Check for file upload requirements
    if (config?.fileUpload && !capabilities.fileUpload) {
      errors.push('File upload requires File API support')
    }

    // Check for SSR compatibility
    if (config?.server?.ssr && !environment.isNextJS) {
      warnings.push('SSR configuration detected but not in Next.js environment')
    }

    // Check for development tools in production
    if (config?.development?.devTools && process.env.NODE_ENV === 'production') {
      warnings.push('Development tools enabled in production environment')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }, [config, environment, capabilities])
}

/**
 * Hook for creating environment-optimized configuration
 */
export function useEnvironmentConfig(userConfig: any = {}) {
  const environment = useRuntimeEnvironment()
  const buildEnvironment = useBuildEnvironment()
  const capabilities = useEnvironmentCapabilities()

  return useMemo(() => {
    const { createEnvironmentConfig } = require('../lib/environment-config')
    const configManager = createEnvironmentConfig(environment, buildEnvironment, capabilities)
    return configManager.generateConfig(userConfig)
  }, [environment, buildEnvironment, capabilities, userConfig])
}