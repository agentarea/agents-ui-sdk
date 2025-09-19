// Connection pool for optimized connection management and reuse

import type {
  Connection,
  ConnectionConfig,
  ValidationResult
} from '../types'
import { Connection as RuntimeConnection, ConnectionConfig as RuntimeConnectionConfig } from '../types/runtime';

export interface ConnectionPoolOptions {
  maxPoolSize?: number
  idleTimeout?: number
  connectionTimeout?: number
  enableHealthCheck?: boolean
  healthCheckInterval?: number
  maxRetries?: number
}

export interface PooledConnection {
  connection: Connection
  poolId: string
  createdAt: number
  lastUsed: number
  isIdle: boolean
  healthCheckCount: number
  endpoint: string
  pool: ConnectionPool
  config: ConnectionConfig
  close(): Promise<void>
}

export interface ConnectionPoolMetrics {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  poolHitRate: number
  averageConnectionTime: number
  failedConnections: number
}

export class ConnectionPool {
  private pools = new Map<string, PooledConnection[]>()
  private options: Required<ConnectionPoolOptions>
  private metrics: ConnectionPoolMetrics
  private healthCheckTimer: NodeJS.Timeout | null = null
  private connectionCounter = 0
  
  constructor(options: ConnectionPoolOptions = {}) {
    this.options = {
      maxPoolSize: options.maxPoolSize ?? 10,
      idleTimeout: options.idleTimeout ?? 30000, // 30 seconds
      connectionTimeout: options.connectionTimeout ?? 10000, // 10 seconds
      enableHealthCheck: options.enableHealthCheck ?? true,
      healthCheckInterval: options.healthCheckInterval ?? 60000, // 1 minute
      maxRetries: options.maxRetries ?? 3
    }
    
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      poolHitRate: 0,
      averageConnectionTime: 0,
      failedConnections: 0
    }
    
    if (this.options.enableHealthCheck) {
      this.startHealthCheck()
    }
    
    // Clean up idle connections periodically
    this.startIdleCleanup()
  }
  
  /**
   * Get a connection from the pool or create a new one
   */
  async getConnection(
    endpoint: string,
    config: ConnectionConfig
  ): Promise<PooledConnection> {
    const startTime = performance.now()
    const poolKey = this.generatePoolKey(endpoint, config)
    
    try {
      // Try to get existing connection from pool
      const existingConnection = await this.getExistingConnection(poolKey)
      if (existingConnection) {
        this.updatePoolHitRate(true)
        existingConnection.lastUsed = Date.now()
        existingConnection.isIdle = false
        this.updateMetrics(performance.now() - startTime, false)
        return existingConnection
      }
      
      // Create new connection
      const newConnection = await this.createConnection(endpoint, config, poolKey)
      this.addToPool(poolKey, newConnection)
      
      this.updatePoolHitRate(false)
      this.updateMetrics(performance.now() - startTime, true)
      
      return newConnection
    } catch (error) {
      this.metrics.failedConnections++
      throw error
    }
  }
  
  /**
   * Return a connection to the pool
   */
  releaseConnection(connection: PooledConnection): void {
    connection.isIdle = true
    connection.lastUsed = Date.now()
    this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1)
    this.metrics.idleConnections++
  }
  
  /**
   * Remove a connection from the pool
   */
  removeConnection(connection: PooledConnection): void {
    const poolKey = this.generatePoolKey(connection.endpoint, {
      endpoint: connection.endpoint,
      authentication: connection.config?.authentication,
      protocols: connection.config?.protocols || ['json-rpc', 'json-rest']
    })
    
    const pool = this.pools.get(poolKey)
    if (pool) {
      const index = pool.findIndex(conn => conn.poolId === connection.poolId)
      if (index !== -1) {
        pool.splice(index, 1)
        this.metrics.totalConnections--
        
        if (connection.isIdle) {
          this.metrics.idleConnections--
        } else {
          this.metrics.activeConnections--
        }
        
        // Clean up empty pools
        if (pool.length === 0) {
          this.pools.delete(poolKey)
        }
      }
    }
    
    // Mark connection as disconnected
    connection.connection.status = 'disconnected'
  }
  
  /**
   * Clear all connections from all pools
   */
  clearAll(): void {
    for (const pool of this.pools.values()) {
      for (const connection of pool) {
        if (typeof connection.close === 'function') {
          connection.close().catch(console.error)
        }
      }
    }
    
    this.pools.clear()
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      poolHitRate: 0,
      averageConnectionTime: 0,
      failedConnections: 0
    }
  }
  
  /**
   * Get current pool metrics
   */
  getMetrics(): ConnectionPoolMetrics {
    return { ...this.metrics }
  }
  
  /**
   * Destroy the connection pool
   */
  destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }
    
    this.clearAll()
  }
  
  /**
   * Get existing connection from pool
   */
  private async getExistingConnection(poolKey: string): Promise<PooledConnection | null> {
    const pool = this.pools.get(poolKey)
    if (!pool || pool.length === 0) return null
    
    // Find idle connection
    const idleConnection = pool.find(conn => conn.isIdle)
    if (idleConnection) {
      // Validate connection health
      if (await this.isConnectionHealthy(idleConnection)) {
        return idleConnection
      } else {
        // Remove unhealthy connection
        this.removeConnection(idleConnection)
        return null
      }
    }
    
    // No idle connections available
    return null
  }
  
  /**
   * Create a new connection
   */
  private async createConnection(
    endpoint: string,
    config: ConnectionConfig,
    poolKey: string
  ): Promise<PooledConnection> {
    const poolId = `conn_${++this.connectionCounter}_${Date.now()}`
    
    // Create base connection (simplified implementation)
    const baseConnection: Connection = {
      id: poolId,
      agentId: 'pool-agent',
      endpoint,
      status: 'connecting',
      protocols: config.protocols || ['json-rpc', 'json-rest'],
      metadata: {},
      createdAt: new Date(),
      lastActivity: new Date()
    }
    
    // Create pooled connection wrapper
    const pooledConnection: PooledConnection = {
      connection: baseConnection,
      poolId,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      isIdle: false,
      healthCheckCount: 0,
      endpoint,
      pool: this,
      config,
      close: async () => {
        baseConnection.status = 'disconnected'
        this.removeConnection(pooledConnection)
      }
    }
    
    // Simulate connection attempt with WebSocket-like interface
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate for simulation
          // Simulate WebSocket connection with protocols property
          const wsConnection = {
            endpoint: config.endpoint,
            authentication: config.authentication,
            protocols: config.protocols || ['json-rpc', 'json-rest']
          }
          resolve()
        } else {
          reject(new Error('Connection failed'))
        }
      }, 100) // Simulate connection delay
    })
    
    baseConnection.status = 'connected'
    
    return pooledConnection
  }
  
  /**
   * Add connection to pool
   */
  private addToPool(poolKey: string, connection: PooledConnection): void {
    let pool = this.pools.get(poolKey)
    if (!pool) {
      pool = []
      this.pools.set(poolKey, pool)
    }
    
    // Check pool size limit
    if (pool.length >= this.options.maxPoolSize) {
      // Remove oldest idle connection
      const oldestIdle = pool
        .filter(conn => conn.isIdle)
        .sort((a, b) => a.lastUsed - b.lastUsed)[0]
      
      if (oldestIdle) {
        this.removeConnection(oldestIdle)
      }
    }
    
    pool.push(connection)
    this.metrics.totalConnections++
    this.metrics.activeConnections++
  }
  
  /**
   * Generate pool key for connection grouping
   */
  private generatePoolKey(endpoint: string, config: ConnectionConfig): string {
    const keyData = {
      endpoint,
      authType: config.authentication?.type,
      // Add other relevant config properties for grouping
    }
    
    return JSON.stringify(keyData)
  }
  
  /**
   * Check if connection is healthy
   */
  private async isConnectionHealthy(connection: PooledConnection): Promise<boolean> {
    try {
      // Simple health check - could be enhanced based on protocol
      if (connection.connection.status !== 'connected') return false
      
      // Check if connection is too old
      const age = Date.now() - connection.createdAt
      if (age > this.options.idleTimeout * 10) return false // Max age is 10x idle timeout
      
      // Update last activity as health check
      connection.connection.lastActivity = new Date()
      
      connection.healthCheckCount++
      return true
    } catch (error) {
      return false
    }
  }
  
  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      for (const [poolKey, pool] of this.pools.entries()) {
        const unhealthyConnections: PooledConnection[] = []
        
        for (const connection of pool) {
          if (connection.isIdle && !(await this.isConnectionHealthy(connection))) {
            unhealthyConnections.push(connection)
          }
        }
        
        // Remove unhealthy connections
        for (const connection of unhealthyConnections) {
          this.removeConnection(connection)
        }
      }
    }, this.options.healthCheckInterval)
  }
  
  /**
   * Start idle connection cleanup
   */
  private startIdleCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      
      for (const pool of this.pools.values()) {
        const expiredConnections = pool.filter(conn => 
          conn.isIdle && (now - conn.lastUsed) > this.options.idleTimeout
        )
        
        for (const connection of expiredConnections) {
          this.removeConnection(connection)
        }
      }
    }, this.options.idleTimeout / 2) // Check twice per timeout period
  }
  
  /**
   * Update pool hit rate metrics
   */
  private updatePoolHitRate(isHit: boolean): void {
    const totalRequests = this.metrics.totalConnections + (isHit ? 0 : 1)
    const hits = this.metrics.poolHitRate * (totalRequests - 1) + (isHit ? 1 : 0)
    this.metrics.poolHitRate = totalRequests > 0 ? hits / totalRequests : 0
  }
  
  /**
   * Update connection metrics
   */
  private updateMetrics(connectionTime: number, isNewConnection: boolean): void {
    if (isNewConnection) {
      // Update average connection time
      const totalTime = this.metrics.averageConnectionTime * (this.metrics.totalConnections - 1) + connectionTime
      this.metrics.averageConnectionTime = totalTime / this.metrics.totalConnections
    }
  }
}