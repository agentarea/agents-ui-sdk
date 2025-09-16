import { PerformanceMonitor, getPerformanceMonitor } from './performance-monitor';

export interface BatchableMessage {
  id: string;
  type: string;
  payload: unknown;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timestamp: Date;
  retryCount?: number;
  maxRetries?: number;
  timeout?: number;
}

export interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number; // milliseconds
  priorityThresholds: {
    critical: number; // immediate send
    high: number; // fast batch
    normal: number; // normal batch
    low: number; // slow batch
  };
  compressionEnabled: boolean;
  compressionThreshold: number; // bytes
}

export interface BatchResult {
  batchId: string;
  messageIds: string[];
  success: boolean;
  error?: Error;
  timestamp: Date;
  processingTime: number;
  compressionRatio?: number;
}

export interface BatchMetrics {
  totalBatches: number;
  totalMessages: number;
  averageBatchSize: number;
  averageProcessingTime: number;
  compressionSavings: number;
  failureRate: number;
}

export class MessageBatcher {
  private static instance: MessageBatcher;
  private config: BatchConfig;
  private performanceMonitor: PerformanceMonitor;
  
  // Message queues by priority
  private queues = {
    critical: [] as BatchableMessage[],
    high: [] as BatchableMessage[],
    normal: [] as BatchableMessage[],
    low: [] as BatchableMessage[]
  };
  
  // Batch timers
  private batchTimers = new Map<string, NodeJS.Timeout>();
  
  // Metrics tracking
  private metrics: BatchMetrics = {
    totalBatches: 0,
    totalMessages: 0,
    averageBatchSize: 0,
    averageProcessingTime: 0,
    compressionSavings: 0,
    failureRate: 0
  };
  
  // Processing state
  private isProcessing = false;
  private processingQueue: BatchableMessage[] = [];
  
  private constructor(config: BatchConfig) {
    this.config = config;
    this.performanceMonitor = getPerformanceMonitor();
    this.startBatchProcessing();
  }
  
  static getInstance(config?: BatchConfig): MessageBatcher {
    if (!MessageBatcher.instance) {
      const defaultConfig: BatchConfig = {
        maxBatchSize: 50,
        maxWaitTime: 1000, // 1 second
        priorityThresholds: {
          critical: 0, // immediate
          high: 100, // 100ms
          normal: 1000, // 1s
          low: 5000 // 5s
        },
        compressionEnabled: true,
        compressionThreshold: 1024 // 1KB
      };
      
      MessageBatcher.instance = new MessageBatcher(config || defaultConfig);
    }
    
    return MessageBatcher.instance;
  }
  
  // Add message to batch queue
  async addMessage(message: BatchableMessage): Promise<void> {
    const timingId = this.performanceMonitor.startTiming('message');
    
    try {
      // Validate message
      this.validateMessage(message);
      
      // Add to appropriate queue based on priority
      this.queues[message.priority].push(message);
      
      // Handle critical messages immediately
      if (message.priority === 'critical') {
        await this.processCriticalMessage(message);
        this.performanceMonitor.endTiming(timingId);
        return;
      }
      
      // Schedule batch processing if not already scheduled
      this.scheduleBatchProcessing(message.priority);
      
      this.performanceMonitor.endTiming(timingId);
      this.performanceMonitor.incrementCounter('messages');
    } catch (error) {
      this.performanceMonitor.endTiming(timingId);
      this.performanceMonitor.incrementCounter('errors');
      throw error;
    }
  }
  
  // Validate message structure
  private validateMessage(message: BatchableMessage): void {
    if (!message.id || !message.type) {
      throw new Error('Message must have id and type');
    }
    
    if (!['low', 'normal', 'high', 'critical'].includes(message.priority)) {
      throw new Error('Invalid message priority');
    }
    
    if (message.timeout && message.timeout < 0) {
      throw new Error('Message timeout must be positive');
    }
  }
  
  // Process critical message immediately
  private async processCriticalMessage(message: BatchableMessage): Promise<void> {
    const batch = [message];
    await this.processBatch(batch, 'critical-immediate');
  }
  
  // Schedule batch processing for a priority level
  private scheduleBatchProcessing(priority: keyof typeof this.queues): void {
    const timerKey = `batch-${priority}`;
    
    // Clear existing timer if any
    if (this.batchTimers.has(timerKey)) {
      clearTimeout(this.batchTimers.get(timerKey)!);
    }
    
    // Set new timer based on priority threshold
    const delay = this.config.priorityThresholds[priority];
    const timer = setTimeout(() => {
      this.processPriorityQueue(priority);
      this.batchTimers.delete(timerKey);
    }, delay);
    
    this.batchTimers.set(timerKey, timer);
  }
  
  // Process messages from a specific priority queue
  private async processPriorityQueue(priority: keyof typeof this.queues): Promise<void> {
    const queue = this.queues[priority];
    if (queue.length === 0) return;
    
    // Create batches from queue
    const batches = this.createBatches(queue, this.config.maxBatchSize);
    
    // Clear the queue
    this.queues[priority] = [];
    
    // Process each batch
    for (const batch of batches) {
      await this.processBatch(batch, `${priority}-batch`);
    }
  }
  
  // Create batches from message array
  private createBatches(messages: BatchableMessage[], maxSize: number): BatchableMessage[][] {
    const batches: BatchableMessage[][] = [];
    
    for (let i = 0; i < messages.length; i += maxSize) {
      batches.push(messages.slice(i, i + maxSize));
    }
    
    return batches;
  }
  
  // Process a batch of messages
  private async processBatch(messages: BatchableMessage[], batchType: string): Promise<BatchResult> {
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      // Prepare batch payload
      let payload = this.prepareBatchPayload(messages);
      let compressionRatio: number | undefined;
      
      // Apply compression if enabled and threshold met
      if (this.config.compressionEnabled) {
        const originalSize = JSON.stringify(payload).length;
        if (originalSize > this.config.compressionThreshold) {
          const compressed = await this.compressPayload(payload);
          const compressedSize = compressed.length;
          compressionRatio = originalSize / compressedSize;
          payload = compressed;
          
          // Update compression metrics
          this.metrics.compressionSavings += (originalSize - compressedSize);
        }
      }
      
      // Send batch (placeholder - would integrate with actual transport)
      await this.sendBatch(batchId, payload, batchType);
      
      const processingTime = Date.now() - startTime;
      
      // Update metrics
      this.updateBatchMetrics(messages.length, processingTime, true);
      
      const result: BatchResult = {
        batchId,
        messageIds: messages.map(m => m.id),
        success: true,
        timestamp: new Date(),
        processingTime,
        compressionRatio
      };
      
      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Update failure metrics
      this.updateBatchMetrics(messages.length, processingTime, false);
      
      // Handle retry logic
      await this.handleBatchFailure(messages, error as Error);
      
      const result: BatchResult = {
        batchId,
        messageIds: messages.map(m => m.id),
        success: false,
        error: error as Error,
        timestamp: new Date(),
        processingTime
      };
      
      return result;
    }
  }
  
  // Prepare batch payload
  private prepareBatchPayload(messages: BatchableMessage[]): any {
    return {
      batchId: `batch-${Date.now()}`,
      timestamp: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages.map(msg => ({
        id: msg.id,
        type: msg.type,
        payload: msg.payload,
        priority: msg.priority,
        timestamp: msg.timestamp.toISOString()
      }))
    };
  }
  
  // Compress payload (placeholder implementation)
  private async compressPayload(payload: any): Promise<string> {
    // In a real implementation, this would use a compression library like pako or lz-string
    const jsonString = JSON.stringify(payload);
    
    // Simple compression simulation (in reality, use proper compression)
    const compressed = jsonString
      .replace(/\s+/g, ' ') // Remove extra whitespace
      .replace(/"([^"]+)":/g, '$1:') // Remove quotes from keys where possible
      .trim();
    
    return compressed;
  }
  
  // Send batch (placeholder - integrate with transport layer)
  private async sendBatch(batchId: string, payload: any, batchType: string): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error(`Batch send failed: ${batchId}`);
    }
    
    console.log(`Batch sent successfully: ${batchId} (${batchType})`);
  }
  
  // Handle batch processing failure
  private async handleBatchFailure(messages: BatchableMessage[], error: Error): Promise<void> {
    console.error('Batch processing failed:', error);
    
    // Retry logic for failed messages
    const retryableMessages = messages.filter(msg => {
      const retryCount = (msg.retryCount || 0) + 1;
      const maxRetries = msg.maxRetries || 3;
      
      if (retryCount <= maxRetries) {
        msg.retryCount = retryCount;
        return true;
      }
      
      return false;
    });
    
    // Re-queue retryable messages with lower priority
    for (const message of retryableMessages) {
      // Reduce priority for retry (except critical)
      if (message.priority !== 'critical') {
        const priorities = ['low', 'normal', 'high'];
        const currentIndex = priorities.indexOf(message.priority);
        if (currentIndex > 0) {
          message.priority = priorities[currentIndex - 1] as any;
        }
      }
      
      this.queues[message.priority].push(message);
    }
    
    // Schedule retry processing
    if (retryableMessages.length > 0) {
      setTimeout(() => {
        for (const priority of Object.keys(this.queues) as Array<keyof typeof this.queues>) {
          if (this.queues[priority].length > 0) {
            this.scheduleBatchProcessing(priority);
          }
        }
      }, 5000); // 5 second delay for retries
    }
  }
  
  // Update batch processing metrics
  private updateBatchMetrics(messageCount: number, processingTime: number, success: boolean): void {
    this.metrics.totalBatches++;
    this.metrics.totalMessages += messageCount;
    
    // Update average batch size
    this.metrics.averageBatchSize = this.metrics.totalMessages / this.metrics.totalBatches;
    
    // Update average processing time
    const totalTime = this.metrics.averageProcessingTime * (this.metrics.totalBatches - 1) + processingTime;
    this.metrics.averageProcessingTime = totalTime / this.metrics.totalBatches;
    
    // Update failure rate
    if (!success) {
      const totalFailures = this.metrics.failureRate * (this.metrics.totalBatches - 1) + 1;
      this.metrics.failureRate = totalFailures / this.metrics.totalBatches;
    } else {
      const totalFailures = this.metrics.failureRate * (this.metrics.totalBatches - 1);
      this.metrics.failureRate = totalFailures / this.metrics.totalBatches;
    }
  }
  
  // Start periodic batch processing
  private startBatchProcessing(): void {
    setInterval(() => {
      this.processAllQueues();
    }, this.config.maxWaitTime);
  }
  
  // Process all non-empty queues
  private async processAllQueues(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // Process in priority order: high -> normal -> low
      const priorities: Array<keyof typeof this.queues> = ['high', 'normal', 'low'];
      
      for (const priority of priorities) {
        if (this.queues[priority].length > 0) {
          await this.processPriorityQueue(priority);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
  
  // Public API methods
  
  // Get current metrics
  getMetrics(): BatchMetrics {
    return { ...this.metrics };
  }
  
  // Get queue status
  getQueueStatus(): { [K in keyof typeof this.queues]: number } {
    return {
      critical: this.queues.critical.length,
      high: this.queues.high.length,
      normal: this.queues.normal.length,
      low: this.queues.low.length
    };
  }
  
  // Force process all queues
  async flushAll(): Promise<void> {
    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();
    
    // Process all queues immediately
    await this.processAllQueues();
  }
  
  // Update configuration
  updateConfig(newConfig: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  // Shutdown batcher
  async shutdown(): Promise<void> {
    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();
    
    // Process remaining messages
    await this.flushAll();
  }
}

// Export singleton instance getter
export const getMessageBatcher = () => MessageBatcher.getInstance();