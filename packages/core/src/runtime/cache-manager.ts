export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
  size: number; // Estimated size in bytes
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of entries
  defaultTtl: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  evictionPolicy: EvictionPolicy;
  compressionThreshold: number; // Size threshold for compression
  enableCompression: boolean;
  enableMetrics: boolean;
}

export type EvictionPolicy = 'lru' | 'lfu' | 'fifo' | 'ttl' | 'size';

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  totalSize: number;
  evictions: number;
  compressions: number;
  averageAccessTime: number;
  memoryUsage: {
    used: number;
    available: number;
    percentage: number;
  };
  topKeys: Array<{ key: string; accessCount: number; size: number }>;
}

export interface CacheQuery {
  tags?: string[];
  keyPattern?: RegExp;
  minAccessCount?: number;
  maxAge?: number;
  minSize?: number;
  maxSize?: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = []; // For LRU
  private accessFrequency = new Map<string, number>(); // For LFU
  private insertionOrder: string[] = []; // For FIFO
  private cleanupTimer?: NodeJS.Timeout;
  private metrics: CacheMetrics;
  private config: CacheConfig;
  
  private constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 10000,
      defaultTtl: 30 * 60 * 1000, // 30 minutes
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      evictionPolicy: 'lru',
      compressionThreshold: 1024, // 1KB
      enableCompression: true,
      enableMetrics: true,
      ...config
    };
    
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      totalSize: 0,
      evictions: 0,
      compressions: 0,
      averageAccessTime: 0,
      memoryUsage: {
        used: 0,
        available: this.config.maxSize,
        percentage: 0
      },
      topKeys: []
    };
    
    this.startCleanupTimer();
  }
  
  static getInstance(config?: Partial<CacheConfig>): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(config);
    }
    return CacheManager.instance;
  }
  
  // Main cache operations
  
  async set<T>(key: string, value: T, options?: {
    ttl?: number;
    tags?: string[];
    metadata?: Record<string, unknown>;
    compress?: boolean;
  }): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Calculate size
      const serialized = JSON.stringify(value);
      let size = new TextEncoder().encode(serialized).length;
      let finalValue: T | string = value;
      let compressed = false;
      
      // Apply compression if enabled and threshold met
      if (
        this.config.enableCompression &&
        (options?.compress ?? size >= this.config.compressionThreshold)
      ) {
        try {
          // Simple compression simulation (in real implementation, use compression-utils)
          const compressedStr = this.simpleCompress(serialized);
          if (compressedStr.length < serialized.length) {
            finalValue = compressedStr as T;
            size = new TextEncoder().encode(compressedStr).length;
            compressed = true;
            this.metrics.compressions++;
          }
        } catch (error) {
          console.warn('Compression failed, storing uncompressed:', error);
        }
      }
      
      const entry: CacheEntry<T> = {
        key,
        value: finalValue,
        timestamp: Date.now(),
        ttl: options?.ttl ?? this.config.defaultTtl,
        accessCount: 0,
        lastAccessed: Date.now(),
        size,
        tags: options?.tags,
        metadata: {
          ...options?.metadata,
          compressed
        }
      };
      
      // Check if we need to evict entries
      await this.ensureCapacity(size);
      
      // Remove existing entry if it exists
      if (this.cache.has(key)) {
        this.removeFromTracking(key);
      }
      
      // Add new entry
      const entryWithKey = { ...entry, key };
      this.cache.set(key, entryWithKey);
      this.addToTracking(key);
      
      // Update metrics
      if (this.config.enableMetrics) {
        this.updateMetricsAfterSet(size, performance.now() - startTime);
      }
    } catch (error) {
      console.error('Cache set operation failed:', error);
      throw error;
    }
  }
  
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      const entry = this.cache.get(key) as CacheEntry<T> | undefined;
      
      if (!entry) {
        this.metrics.misses++;
        this.updateHitRate();
        return null;
      }
      
      // Check TTL
      if (this.isExpired(entry)) {
        this.delete(key);
        this.metrics.misses++;
        this.updateHitRate();
        return null;
      }
      
      // Update access tracking
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      this.updateAccessTracking(key);
      
      // Handle decompression if needed
      let value = entry.value;
      if (entry.metadata?.compressed) {
        try {
          const decompressed = this.simpleDecompress(entry.value as string);
          value = JSON.parse(decompressed) as T;
        } catch (error) {
          console.warn('Decompression failed, returning raw value:', error);
        }
      }
      
      // Update metrics
      this.metrics.hits++;
      this.updateHitRate();
      
      if (this.config.enableMetrics) {
        this.updateAverageAccessTime(performance.now() - startTime);
      }
      
      return value;
    } catch (error) {
      console.error('Cache get operation failed:', error);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }
  }
  
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    
    this.cache.delete(key);
    this.removeFromTracking(key);
    
    // Update metrics
    this.metrics.totalEntries = this.cache.size;
    this.metrics.totalSize -= entry.size;
    this.updateMemoryUsage();
    
    return true;
  }
  
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }
  
  clear(): void {
    this.cache.clear();
    this.accessOrder.length = 0;
    this.accessFrequency.clear();
    this.insertionOrder.length = 0;
    
    // Reset metrics
    this.metrics.totalEntries = 0;
    this.metrics.totalSize = 0;
    this.updateMemoryUsage();
  }
  
  // Advanced operations
  
  async getMultiple<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    
    await Promise.all(
      keys.map(async (key) => {
        const value = await this.get<T>(key);
        if (value !== null) {
          results.set(key, value);
        }
      })
    );
    
    return results;
  }
  
  async setMultiple<T>(entries: Array<{ key: string; value: T; options?: any }>): Promise<void> {
    await Promise.all(
      entries.map(({ key, value, options }) => this.set(key, value, options))
    );
  }
  
  deleteMultiple(keys: string[]): number {
    let deletedCount = 0;
    for (const key of keys) {
      if (this.delete(key)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }
  
  // Query operations
  
  query(query: CacheQuery): CacheEntry[] {
    const results: CacheEntry[] = [];
    
    for (const [key, entry] of this.cache) {
      if (this.matchesQuery(key, entry, query)) {
        results.push({ ...entry });
      }
    }
    
    return results;
  }
  
  queryKeys(query: CacheQuery): string[] {
    return this.query(query).map(entry => entry.key);
  }
  
  deleteByQuery(query: CacheQuery): number {
    const keysToDelete = this.queryKeys(query);
    return this.deleteMultiple(keysToDelete);
  }
  
  // Tag operations
  
  getByTag(tag: string): CacheEntry[] {
    return this.query({ tags: [tag] });
  }
  
  deleteByTag(tag: string): number {
    return this.deleteByQuery({ tags: [tag] });
  }
  
  // Utility methods
  
  private matchesQuery(key: string, entry: CacheEntry, query: CacheQuery): boolean {
    // Check tags
    if (query.tags && query.tags.length > 0) {
      if (!entry.tags || !query.tags.some(tag => entry.tags!.includes(tag))) {
        return false;
      }
    }
    
    // Check key pattern
    if (query.keyPattern && !query.keyPattern.test(key)) {
      return false;
    }
    
    // Check access count
    if (query.minAccessCount !== undefined && entry.accessCount < query.minAccessCount) {
      return false;
    }
    
    // Check age
    if (query.maxAge !== undefined) {
      const age = Date.now() - entry.timestamp;
      if (age > query.maxAge) {
        return false;
      }
    }
    
    // Check size
    if (query.minSize !== undefined && entry.size < query.minSize) {
      return false;
    }
    
    if (query.maxSize !== undefined && entry.size > query.maxSize) {
      return false;
    }
    
    return true;
  }
  
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }
  
  private async ensureCapacity(newEntrySize: number): Promise<void> {
    // Check entry count limit
    while (this.cache.size >= this.config.maxEntries) {
      await this.evictOne();
    }
    
    // Check size limit
    while (this.metrics.totalSize + newEntrySize > this.config.maxSize) {
      await this.evictOne();
    }
  }
  
  private async evictOne(): Promise<void> {
    let keyToEvict: string | null = null;
    
    switch (this.config.evictionPolicy) {
      case 'lru':
        keyToEvict = this.accessOrder[0] || null;
        break;
      case 'lfu':
        keyToEvict = this.findLeastFrequentlyUsed();
        break;
      case 'fifo':
        keyToEvict = this.insertionOrder[0] || null;
        break;
      case 'ttl':
        keyToEvict = this.findEarliestExpiring();
        break;
      case 'size':
        keyToEvict = this.findLargestEntry();
        break;
    }
    
    if (keyToEvict) {
      this.delete(keyToEvict);
      this.metrics.evictions++;
    }
  }
  
  private findLeastFrequentlyUsed(): string | null {
    let minFreq = Infinity;
    let leastUsedKey: string | null = null;
    
    for (const [key, freq] of this.accessFrequency) {
      if (freq < minFreq) {
        minFreq = freq;
        leastUsedKey = key;
      }
    }
    
    return leastUsedKey;
  }
  
  private findEarliestExpiring(): string | null {
    let earliestExpiry = Infinity;
    let keyToEvict: string | null = null;
    
    for (const [key, entry] of this.cache) {
      const expiryTime = entry.timestamp + entry.ttl;
      if (expiryTime < earliestExpiry) {
        earliestExpiry = expiryTime;
        keyToEvict = key;
      }
    }
    
    return keyToEvict;
  }
  
  private findLargestEntry(): string | null {
    let maxSize = 0;
    let largestKey: string | null = null;
    
    for (const [key, entry] of this.cache) {
      if (entry.size > maxSize) {
        maxSize = entry.size;
        largestKey = key;
      }
    }
    
    return largestKey;
  }
  
  private addToTracking(key: string): void {
    // LRU tracking
    this.accessOrder.push(key);
    
    // LFU tracking
    this.accessFrequency.set(key, 0);
    
    // FIFO tracking
    this.insertionOrder.push(key);
  }
  
  private removeFromTracking(key: string): void {
    // LRU tracking
    const lruIndex = this.accessOrder.indexOf(key);
    if (lruIndex > -1) {
      this.accessOrder.splice(lruIndex, 1);
    }
    
    // LFU tracking
    this.accessFrequency.delete(key);
    
    // FIFO tracking
    const fifoIndex = this.insertionOrder.indexOf(key);
    if (fifoIndex > -1) {
      this.insertionOrder.splice(fifoIndex, 1);
    }
  }
  
  private updateAccessTracking(key: string): void {
    // Update LRU order
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(key);
    }
    
    // Update LFU frequency
    const currentFreq = this.accessFrequency.get(key) || 0;
    this.accessFrequency.set(key, currentFreq + 1);
  }
  
  // Cleanup operations
  
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }
  
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    // Find expired entries
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }
    
    // Remove expired entries
    for (const key of expiredKeys) {
      this.delete(key);
    }
    
    // Update metrics
    this.updateMetrics();
  }
  
  // Metrics and monitoring
  
  private updateMetricsAfterSet(size: number, accessTime: number): void {
    this.metrics.totalEntries = this.cache.size;
    this.metrics.totalSize += size;
    this.updateMemoryUsage();
    this.updateAverageAccessTime(accessTime);
  }
  
  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }
  
  private updateMemoryUsage(): void {
    this.metrics.memoryUsage = {
      used: this.metrics.totalSize,
      available: this.config.maxSize - this.metrics.totalSize,
      percentage: (this.metrics.totalSize / this.config.maxSize) * 100
    };
  }
  
  private updateAverageAccessTime(accessTime: number): void {
    const totalOperations = this.metrics.hits + this.metrics.misses;
    if (totalOperations === 1) {
      this.metrics.averageAccessTime = accessTime;
    } else {
      this.metrics.averageAccessTime = 
        (this.metrics.averageAccessTime * (totalOperations - 1) + accessTime) / totalOperations;
    }
  }
  
  private updateMetrics(): void {
    this.metrics.totalEntries = this.cache.size;
    
    // Calculate total size
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    this.metrics.totalSize = totalSize;
    
    // Update memory usage
    this.updateMemoryUsage();
    
    // Update top keys
    this.updateTopKeys();
  }
  
  private updateTopKeys(): void {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        size: entry.size
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);
    
    this.metrics.topKeys = entries;
  }
  
  // Simple compression/decompression (placeholder)
  private simpleCompress(data: string): string {
    // Simple run-length encoding for demonstration
    return data.replace(/(.)\1+/g, (match, char) => {
      return `${char}${match.length}`;
    });
  }
  
  private simpleDecompress(data: string): string {
    // Reverse of simple compression
    return data.replace(/(.)([0-9]+)/g, (match, char, count) => {
      return char.repeat(parseInt(count));
    });
  }
  
  // Public API
  
  getMetrics(): CacheMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }
  
  getConfig(): CacheConfig {
    return { ...this.config };
  }
  
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval && this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.startCleanupTimer();
    }
  }
  
  // Export/Import for persistence
  
  export(): { entries: Array<CacheEntry & { key: string }>; config: CacheConfig; metrics: CacheMetrics } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({ ...entry, key }));
    return {
      entries,
      config: this.config,
      metrics: this.metrics
    };
  }
  
  import(data: { entries: Array<CacheEntry & { key: string }>; config?: CacheConfig }): void {
    this.clear();
    
    if (data.config) {
      this.updateConfig(data.config);
    }
    
    // Import entries
    for (const entry of data.entries) {
      const { key, ...entryData } = entry;
      const entryWithKey = { ...entryData, key };
      this.cache.set(key, entryWithKey);
      this.addToTracking(key);
    }
    
    this.updateMetrics();
  }
  
  // Cleanup on destruction
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// Export singleton instance getter
export const getCacheManager = (config?: Partial<CacheConfig>) => CacheManager.getInstance(config);