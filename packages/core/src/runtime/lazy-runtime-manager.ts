// Lazy runtime manager for optimized initialization and caching

import type {
  AgentRuntime,
  RuntimeConfig,
  Connection,
  ConnectionConfig,
  ValidationResult
} from '../types'
import { RuntimeFactory } from './runtime-factory'
// Note: ConnectionPool will be implemented separately
// import { ConnectionPool } from './connection-pool'
import { PerformanceMonitor, getPerformanceMonitor } from './performance-monitor'

export interface LazyRuntimeOptions {
  maxCacheSize?: number
  cacheTimeout?: number
  preloadProtocols?: string[]
  enableMetrics?: boolean
}

export interface RuntimeMetrics {
  initializationTime: number
  cacheHitRate: number
  activeRuntimes: number
  totalRequests: number
  averageInitTime: number
  performance?: any
  connectionPool?: any
}

export class LazyRuntimeManager {
  private runtimeCache = new Map<string, Promise<AgentRuntime>>()
  private runtimeInstances = new Map<string, AgentRuntime>()
  // private connectionPool: ConnectionPool // Will be enabled when ConnectionPool is integrated
  private factory: RuntimeFactory
  private options: Required<LazyRuntimeOptions>
  private metrics: RuntimeMetrics
  private cacheTimers = new Map<string, NodeJS.Timeout>()
  private performanceMonitor: PerformanceMonitor
  
  constructor(options: LazyRuntimeOptions = {}) {
    this.options = {
      maxCacheSize: options.maxCacheSize ?? 10,
      cacheTimeout: options.cacheTimeout ?? 300000, // 5 minutes
      preloadProtocols: options.preloadProtocols ?? [],
      enableMetrics: options.enableMetrics ?? true
    }
    
    // this.connectionPool = new ConnectionPool({
    //   maxPoolSize: 20,
    //   idleTimeout: 60000,
    //   enableHealthCheck: true
    // }) // Will be enabled when ConnectionPool is integrated
    
    this.factory = RuntimeFactory.getInstance()
    this.performanceMonitor = getPerformanceMonitor()
    
    this.metrics = {
      initializationTime: 0,
      cacheHitRate: 0,
      activeRuntimes: 0,
      totalRequests: 0,
      averageInitTime: 0
    }
    
    // Preload specified protocols
    this.preloadRuntimes()
  }
  
  /**
   * Get or create a runtime instance with lazy loading
   */
  async getRuntime(
    protocolType: 'a2a' | 'agentarea',
    config: RuntimeConfig
  ): Promise<AgentRuntime> {
    const timingId = this.performanceMonitor.startTiming('initialization')
    const cacheKey = this.generateCacheKey(protocolType, config)
    
    this.metrics.totalRequests++
    
    try {
      // Check if runtime is already cached
      if (this.runtimeCache.has(cacheKey)) {
        const runtime = await this.runtimeCache.get(cacheKey)!
        this.updateCacheHitRate(true)
        this.performanceMonitor.endTiming(timingId)
        return runtime
      }
      
      // Create new runtime promise
      const runtimePromise = this.createRuntime(protocolType, config)
      
      // Cache the promise to prevent duplicate creation
      this.runtimeCache.set(cacheKey, runtimePromise)
      
      try {
        const runtime = await runtimePromise
        this.runtimeInstances.set(cacheKey, runtime)
        
        // Set up cache expiration
        this.setupCacheExpiration(cacheKey)
        
        // Update metrics
        const initTime = this.performanceMonitor.endTiming(timingId)
        this.updateMetrics(initTime)
        this.updateCacheHitRate(false)
        
        // Manage cache size
        this.manageCacheSize()
        
        return runtime
      } catch (error) {
        // Remove failed promise from cache
        this.runtimeCache.delete(cacheKey)
        throw error
      }
    } catch (error) {
      this.performanceMonitor.endTiming(timingId)
      this.performanceMonitor.incrementCounter('errors')
      throw error
    }
  }
  
  /**
   * Get a connection from the pool for a specific endpoint
   */
  async getConnection(
    endpoint: string,
    config: ConnectionConfig
  ): Promise<Connection> {
    // return this.connectionPool.getConnection(endpoint, config) // Will be enabled when ConnectionPool is integrated
    throw new Error('ConnectionPool not yet implemented')
  }
  
  /**
   * Validate connection configuration without creating runtime
   */
  async validateConnection(
    protocolType: 'a2a' | 'agentarea',
    config: ConnectionConfig
  ): Promise<ValidationResult> {
    try {
      // Use a lightweight validation approach
      const tempRuntime = await this.getRuntime(protocolType, {
        endpoint: config.endpoint,
        authentication: config.authentication
      })
      
      return await tempRuntime.validateConnection(config)
    } catch (error) {
      return {
        valid: false,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: (error as Error).message,
          field: 'connection'
        }]
      }
    }
  }
  
  /**
   * Clear specific runtime from cache
   */
  clearRuntime(protocolType: 'a2a' | 'agentarea', config: RuntimeConfig): void {
    const cacheKey = this.generateCacheKey(protocolType, config)
    
    // Clear timer
    const timer = this.cacheTimers.get(cacheKey)
    if (timer) {
      clearTimeout(timer)
      this.cacheTimers.delete(cacheKey)
    }
    
    // Remove from caches
    this.runtimeCache.delete(cacheKey)
    this.runtimeInstances.delete(cacheKey)
    
    this.metrics.activeRuntimes = Math.max(0, this.metrics.activeRuntimes - 1)
  }
  
  /**
   * Clear all cached runtimes
   */
  clearAll(): void {
    // Clear all timers
    for (const timer of this.cacheTimers.values()) {
      clearTimeout(timer)
    }
    
    this.cacheTimers.clear()
    this.runtimeCache.clear()
    this.runtimeInstances.clear()
    // this.connectionPool.clearAll() // Will be enabled when ConnectionPool is integrated
    
    this.metrics.activeRuntimes = 0
  }
  
  /**
   * Get current performance metrics
   */
  getMetrics(): RuntimeMetrics {
    const performanceMetrics = this.performanceMonitor.getCurrentMetrics()
    
    return {
      ...this.metrics,
      performance: performanceMetrics
      // connectionPool: this.connectionPool.getMetrics() // Will be enabled when ConnectionPool is integrated
    }
  }
  
  /**
   * Preload runtimes for specified protocols
   */
  private async preloadRuntimes(): Promise<void> {
    if (this.options.preloadProtocols.length === 0) return
    
    const preloadPromises = this.options.preloadProtocols.map(async (protocol) => {
      try {
        if (protocol === 'a2a' || protocol === 'agentarea') {
          // Create minimal config for preloading
          const config: RuntimeConfig = {
            endpoint: 'http://localhost:3000', // Placeholder
            timeout: 5000
          }
          
          await this.getRuntime(protocol, config)
        }
      } catch (error) {
        // Ignore preload errors
        console.warn(`Failed to preload runtime for protocol ${protocol}:`, error)
      }
    })
    
    await Promise.allSettled(preloadPromises)
  }
  
  /**
   * Create a new runtime instance
   */
  private async createRuntime(
    protocolType: 'a2a' | 'agentarea',
    config: RuntimeConfig
  ): Promise<AgentRuntime> {
    const connectionTimingId = this.performanceMonitor.startTiming('connection')
    
    try {
      // Enhance config (connection pool integration pending)
      const enhancedConfig = {
        ...config
        // connectionPool: this.connectionPool // Will be enabled when ConnectionPool is integrated
      }
      
      const runtime = this.factory.createRuntime(protocolType, enhancedConfig)
      
      this.performanceMonitor.endTiming(connectionTimingId)
      this.performanceMonitor.incrementCounter('connections')
      
      // Initialize runtime if needed
      if (typeof (runtime as any).initialize === 'function') {
        await (runtime as any).initialize()
      }
      
      this.metrics.activeRuntimes++
      
      return runtime
    } catch (error) {
      this.performanceMonitor.endTiming(connectionTimingId)
      this.performanceMonitor.incrementCounter('errors')
      throw error
    }
  }
  
  /**
   * Generate cache key for runtime configuration
   */
  private generateCacheKey(protocolType: string, config: RuntimeConfig): string {
    const keyData = {
      protocol: protocolType,
      endpoint: config.endpoint,
      authType: config.authentication?.type,
      // Include other relevant config properties
      timeout: config.timeout,
      transport: config.transport?.type
    }
    
    return JSON.stringify(keyData)
  }
  
  /**
   * Set up cache expiration for a runtime
   */
  private setupCacheExpiration(cacheKey: string): void {
    const timer = setTimeout(() => {
      this.runtimeCache.delete(cacheKey)
      this.runtimeInstances.delete(cacheKey)
      this.cacheTimers.delete(cacheKey)
      this.metrics.activeRuntimes = Math.max(0, this.metrics.activeRuntimes - 1)
    }, this.options.cacheTimeout)
    
    this.cacheTimers.set(cacheKey, timer)
  }
  
  /**
   * Manage cache size by removing oldest entries
   */
  private manageCacheSize(): void {
    if (this.runtimeCache.size <= this.options.maxCacheSize) return
    
    // Remove oldest entries (simple FIFO approach)
    const keysToRemove = Array.from(this.runtimeCache.keys())
      .slice(0, this.runtimeCache.size - this.options.maxCacheSize)
    
    for (const key of keysToRemove) {
      const timer = this.cacheTimers.get(key)
      if (timer) {
        clearTimeout(timer)
        this.cacheTimers.delete(key)
      }
      
      this.runtimeCache.delete(key)
      this.runtimeInstances.delete(key)
      this.metrics.activeRuntimes = Math.max(0, this.metrics.activeRuntimes - 1)
    }
  }
  
  /**
   * Update initialization metrics
   */
  private updateMetrics(initTime: number): void {
    this.metrics.initializationTime = initTime
    
    // Update rolling average
    const totalTime = this.metrics.averageInitTime * (this.metrics.totalRequests - 1) + initTime
    this.metrics.averageInitTime = totalTime / this.metrics.totalRequests
  }
  
  /**
   * Update cache hit rate
   */
  private updateCacheHitRate(isHit: boolean): void {
    const hits = this.metrics.cacheHitRate * (this.metrics.totalRequests - 1)
    const newHits = hits + (isHit ? 1 : 0)
    this.metrics.cacheHitRate = newHits / this.metrics.totalRequests
  }
}

// Singleton instance for global access
let globalLazyRuntimeManager: LazyRuntimeManager | null = null

export function getLazyRuntimeManager(options?: LazyRuntimeOptions): LazyRuntimeManager {
  if (!globalLazyRuntimeManager) {
    globalLazyRuntimeManager = new LazyRuntimeManager(options)
  }
  return globalLazyRuntimeManager
}

export function resetLazyRuntimeManager(): void {
  if (globalLazyRuntimeManager) {
    globalLazyRuntimeManager.clearAll()
    globalLazyRuntimeManager = null
  }
}