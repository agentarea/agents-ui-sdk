import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { AgentUIConfig, RuntimeEnvironment, BuildEnvironment, EnvironmentCapabilities } from '@agentarea/core'
import { useRuntimeEnvironment, useBuildEnvironment, useEnvironmentCapabilities } from '../../hooks/use-runtime-environment'
import { createEnvironmentConfig, ConfigUtils } from '../../lib/environment-config'

/**
 * Configuration context for AgentUI
 * Manages environment-agnostic configuration with runtime-specific optimizations
 */
interface ConfigContextValue {
  // Current configuration
  config: AgentUIConfig
  
  // Environment information
  environment: RuntimeEnvironment
  buildEnvironment: BuildEnvironment
  capabilities: EnvironmentCapabilities
  
  // Configuration management
  updateConfig: (updates: Partial<AgentUIConfig>) => void
  resetConfig: () => void
  validateConfig: () => { valid: boolean; errors: string[]; warnings: string[] }
  
  // Environment-specific helpers
  isFeatureSupported: (feature: string) => boolean
  getOptimizedConfig: () => AgentUIConfig
  
  // Development helpers
  isDevelopment: boolean
  isProduction: boolean
  isDebugMode: boolean
}

const ConfigContext = createContext<ConfigContextValue | null>(null)

/**
 * Configuration provider props
 */
export interface ConfigProviderProps {
  // Base configuration
  config?: Partial<AgentUIConfig>
  
  // Environment overrides
  developmentConfig?: Partial<AgentUIConfig>
  productionConfig?: Partial<AgentUIConfig>
  
  // Framework-specific configurations
  nextjsConfig?: Partial<AgentUIConfig>
  viteConfig?: Partial<AgentUIConfig>
  
  // Auto-optimization settings
  autoOptimize?: boolean
  validateOnMount?: boolean
  
  children: ReactNode
}

/**
 * Universal configuration provider
 * Automatically detects environment and applies appropriate optimizations
 */
export function ConfigProvider({
  config: userConfig = {},
  developmentConfig = {},
  productionConfig = {},
  nextjsConfig = {},
  viteConfig = {},
  autoOptimize = true,
  validateOnMount = true,
  children
}: ConfigProviderProps) {
  const environment = useRuntimeEnvironment()
  const buildEnvironment = useBuildEnvironment()
  const capabilities = useEnvironmentCapabilities()
  
  const [config, setConfig] = useState<AgentUIConfig>(() => 
    generateInitialConfig(
      userConfig,
      developmentConfig,
      productionConfig,
      nextjsConfig,
      viteConfig,
      environment,
      buildEnvironment,
      capabilities,
      autoOptimize
    )
  )
  
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }>({ valid: true, errors: [], warnings: [] })

  // Update configuration when environment or user config changes
  useEffect(() => {
    const newConfig = generateInitialConfig(
      userConfig,
      developmentConfig,
      productionConfig,
      nextjsConfig,
      viteConfig,
      environment,
      buildEnvironment,
      capabilities,
      autoOptimize
    )
    setConfig(newConfig)
  }, [
    userConfig,
    developmentConfig,
    productionConfig,
    nextjsConfig,
    viteConfig,
    environment,
    buildEnvironment,
    capabilities,
    autoOptimize
  ])

  // Validate configuration on mount and when config changes
  useEffect(() => {
    if (validateOnMount) {
      const result = validateConfiguration(config, environment, buildEnvironment, capabilities)
      setValidationResult(result)
      
      // Log warnings in development
      if (buildEnvironment.mode === 'development' && result.warnings.length > 0) {
        console.warn('AgentUI Configuration Warnings:', result.warnings)
      }
      
      // Log errors
      if (result.errors.length > 0) {
        console.error('AgentUI Configuration Errors:', result.errors)
      }
    }
  }, [config, validateOnMount, environment, buildEnvironment, capabilities])

  const updateConfig = (updates: Partial<AgentUIConfig>) => {
    setConfig(prevConfig => {
      const configManager = createEnvironmentConfig(environment, buildEnvironment, capabilities)
      return configManager.generateConfig({ ...prevConfig, ...updates })
    })
  }

  const resetConfig = () => {
    const newConfig = generateInitialConfig(
      userConfig,
      developmentConfig,
      productionConfig,
      nextjsConfig,
      viteConfig,
      environment,
      buildEnvironment,
      capabilities,
      autoOptimize
    )
    setConfig(newConfig)
  }

  const validateConfig = () => {
    const result = validateConfiguration(config, environment, buildEnvironment, capabilities)
    setValidationResult(result)
    return result
  }

  const isFeatureSupported = (feature: string): boolean => {
    const featureMap: Record<string, boolean> = {
      realTimeUpdates: capabilities.realTimeUpdates,
      fileUpload: capabilities.fileUpload,
      fileDownload: capabilities.fileDownload,
      notifications: capabilities.notifications,
      backgroundSync: capabilities.backgroundSync,
      offlineStorage: capabilities.offlineStorage,
      ssr: environment.isNextJS,
      staticGeneration: environment.isNextJS,
      hotReload: environment.isVite || environment.isNextJS,
      devTools: buildEnvironment.mode === 'development',
      webSockets: environment.supportsWebSockets,
      fileAPI: environment.supportsFileAPI,
      serviceWorker: environment.supportsServiceWorker,
      indexedDB: environment.supportsIndexedDB
    }
    
    return featureMap[feature] ?? false
  }

  const getOptimizedConfig = (): AgentUIConfig => {
    const configManager = createEnvironmentConfig(environment, buildEnvironment, capabilities)
    return configManager.generateConfig(config)
  }

  const contextValue: ConfigContextValue = {
    config,
    environment,
    buildEnvironment,
    capabilities,
    updateConfig,
    resetConfig,
    validateConfig,
    isFeatureSupported,
    getOptimizedConfig,
    isDevelopment: buildEnvironment.mode === 'development',
    isProduction: buildEnvironment.mode === 'production',
    isDebugMode: config.development?.debug ?? false
  }

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  )
}

/**
 * Hook to access configuration context
 */
export function useConfig(): ConfigContextValue {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}

/**
 * Hook for conditional feature rendering based on configuration
 */
export function useFeatureFlags() {
  const { config, isFeatureSupported } = useConfig()

  return {
    // Core features
    realTimeUpdates: isFeatureSupported('realTimeUpdates') && config.development?.debug !== false,
    fileUpload: isFeatureSupported('fileUpload'),
    fileDownload: isFeatureSupported('fileDownload'),
    notifications: isFeatureSupported('notifications'),
    
    // Development features
    debugMode: config.development?.debug ?? false,
    devTools: config.development?.devTools ?? false,
    mockData: config.development?.mockData ?? false,
    hotReload: config.development?.hotReload ?? false,
    
    // Performance features
    lazyLoading: config.performance?.lazyLoading ?? true,
    codesplitting: config.performance?.codesplitting ?? true,
    treeshaking: config.performance?.treeshaking ?? true,
    
    // Server features
    ssr: config.server?.ssr ?? false,
    staticGeneration: config.server?.staticGeneration ?? false,
    serverComponents: config.server?.serverComponents ?? false,
    
    // Framework features
    nextjsAppDir: config.nextjs?.appDir ?? false,
    nextjsMiddleware: config.nextjs?.middleware ?? false,
    viteHMR: config.vite?.hmr ?? false,
    viteFastRefresh: config.vite?.fastRefresh ?? false
  }
}

/**
 * Hook for environment-specific configuration
 */
export function useEnvironmentSpecificConfig() {
  const { config, environment, buildEnvironment } = useConfig()

  return {
    // Current environment config
    current: config,
    
    // Environment-specific configs
    development: buildEnvironment.mode === 'development' ? config : ConfigUtils.createDevelopmentConfig(config),
    production: buildEnvironment.mode === 'production' ? config : ConfigUtils.createProductionConfig(config),
    nextjs: environment.isNextJS ? config : ConfigUtils.createNextJSConfig(config),
    vite: environment.isVite ? config : ConfigUtils.createViteConfig(config),
    
    // Utility functions
    getConfigForEnvironment: (env: 'development' | 'production' | 'nextjs' | 'vite') => {
      switch (env) {
        case 'development': return ConfigUtils.createDevelopmentConfig(config)
        case 'production': return ConfigUtils.createProductionConfig(config)
        case 'nextjs': return ConfigUtils.createNextJSConfig(config)
        case 'vite': return ConfigUtils.createViteConfig(config)
        default: return config
      }
    }
  }
}

/**
 * Generate initial configuration based on environment and user preferences
 */
function generateInitialConfig(
  userConfig: Partial<AgentUIConfig>,
  developmentConfig: Partial<AgentUIConfig>,
  productionConfig: Partial<AgentUIConfig>,
  nextjsConfig: Partial<AgentUIConfig>,
  viteConfig: Partial<AgentUIConfig>,
  environment: RuntimeEnvironment,
  buildEnvironment: BuildEnvironment,
  capabilities: EnvironmentCapabilities,
  autoOptimize: boolean
): AgentUIConfig {
  const configManager = createEnvironmentConfig(environment, buildEnvironment, capabilities)
  
  // Start with base configuration
  let config = configManager.generateConfig(userConfig)
  
  // Apply environment-specific configurations
  if (buildEnvironment.mode === 'development') {
    config = configManager.generateConfig({ ...config, ...developmentConfig })
  } else if (buildEnvironment.mode === 'production') {
    config = configManager.generateConfig({ ...config, ...productionConfig })
  }
  
  // Apply framework-specific configurations
  if (environment.isNextJS) {
    config = configManager.generateConfig({ ...config, ...nextjsConfig })
  }
  
  if (environment.isVite) {
    config = configManager.generateConfig({ ...config, ...viteConfig })
  }
  
  // Apply auto-optimizations if enabled
  if (autoOptimize) {
    config = configManager.getRecommendedConfig()
  }
  
  return config
}

/**
 * Validate configuration against current environment
 */
function validateConfiguration(
  config: AgentUIConfig,
  environment: RuntimeEnvironment,
  buildEnvironment: BuildEnvironment,
  capabilities: EnvironmentCapabilities
): { valid: boolean; errors: string[]; warnings: string[] } {
  const configManager = createEnvironmentConfig(environment, buildEnvironment, capabilities)
  return configManager.validateConfig(config)
}