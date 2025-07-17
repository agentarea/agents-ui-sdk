// Environment detection types for Next.js and Vite support

export interface RuntimeEnvironment {
  isServer: boolean
  isClient: boolean
  isNextJS: boolean
  isVite: boolean
  supportsWebSockets: boolean
  supportsFileAPI: boolean
  supportsServiceWorker: boolean
  supportsIndexedDB: boolean
}

export interface EnvironmentCapabilities {
  realTimeUpdates: boolean
  fileUpload: boolean
  fileDownload: boolean
  notifications: boolean
  backgroundSync: boolean
  offlineStorage: boolean
}

export interface BuildEnvironment {
  mode: 'development' | 'production' | 'test'
  bundler: 'webpack' | 'vite' | 'rollup' | 'esbuild' | 'unknown'
  framework: 'nextjs' | 'react' | 'vue' | 'svelte' | 'unknown'
  target: 'web' | 'node' | 'webworker' | 'electron'
}

export interface SSRCompatibility {
  supportsSsr: boolean
  supportsStaticGeneration: boolean
  requiresClientOnly: boolean
  hydrationSafe: boolean
}

export interface AgentUIConfig {
  // Environment-specific configuration
  environment?: Partial<RuntimeEnvironment>
  
  // Development vs Production
  development?: {
    debug: boolean
    devTools: boolean
    mockData: boolean
    hotReload?: boolean
  }
  
  // Server vs Client configuration
  server?: {
    ssr: boolean
    preloadData: boolean
    staticGeneration: boolean
    serverComponents?: boolean
  }
  
  // Runtime-specific configuration
  nextjs?: {
    appDir: boolean
    serverComponents: boolean
    middleware: boolean
    apiRoutes?: boolean
  }
  
  vite?: {
    hmr: boolean
    fastRefresh: boolean
    optimizeDeps?: string[]
  }
  
  // Performance and optimization
  performance?: {
    lazyLoading: boolean
    codesplitting: boolean
    treeshaking: boolean
    bundleAnalysis?: boolean
  }
}

export interface ComponentEnvironmentProps {
  // SSR-safe component properties
  suppressHydrationWarning?: boolean
  fallback?: any // React.ReactNode equivalent for core package
  clientOnly?: boolean
  
  // Environment-specific rendering
  serverFallback?: any // React.ReactNode equivalent for core package
  loadingFallback?: any // React.ReactNode equivalent for core package
  errorFallback?: any // React.ComponentType equivalent for core package
}

export interface EnvironmentDetector {
  // Environment detection methods
  detectEnvironment(): RuntimeEnvironment
  detectBuildEnvironment(): BuildEnvironment
  getCapabilities(): EnvironmentCapabilities
  checkSSRCompatibility(): SSRCompatibility
  
  // Feature detection
  supportsFeature(feature: string): boolean
  getUnsupportedFeatures(): string[]
  
  // Configuration validation
  validateConfig(config: AgentUIConfig): ValidationResult
  getRecommendedConfig(): Partial<AgentUIConfig>
}

// Environment-specific error types
export interface EnvironmentError extends Error {
  code: 'UNSUPPORTED_ENVIRONMENT' | 'SSR_MISMATCH' | 'FEATURE_UNAVAILABLE' | 'CONFIG_INVALID'
  environment: RuntimeEnvironment
  feature?: string
  recommendation?: string
}

// Dynamic import types for environment-specific features
export interface DynamicImportConfig {
  ssr: boolean
  loading?: any // Component type equivalent for core package
  error?: any // Component type equivalent for core package
}

export interface EnvironmentSpecificComponent<T = any> {
  component: any // Component type equivalent for core package
  environment: RuntimeEnvironment
  fallback?: any // Component type equivalent for core package
  dynamicImport?: DynamicImportConfig
}

// Build target configuration
export interface BuildTarget {
  name: string
  environment: RuntimeEnvironment
  optimizations: BuildOptimization[]
  polyfills?: string[]
  externals?: string[]
}

export interface BuildOptimization {
  type: 'minification' | 'treeshaking' | 'codesplitting' | 'bundleanalysis'
  enabled: boolean
  config?: Record<string, unknown>
}

// Framework-specific types
export interface NextJSEnvironment extends RuntimeEnvironment {
  isNextJS: true
  appDir: boolean
  serverComponents: boolean
  middleware: boolean
  apiRoutes: boolean
  version: string
}

export interface ViteEnvironment extends RuntimeEnvironment {
  isVite: true
  hmr: boolean
  fastRefresh: boolean
  version: string
  plugins: string[]
}

// Import validation types from runtime
import type { ValidationResult, ValidationError, ValidationWarning } from './runtime'

// Re-export validation types
export type { ValidationResult, ValidationError, ValidationWarning }