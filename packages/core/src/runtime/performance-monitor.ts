import { RuntimeConfig, ValidationResult } from '../types/runtime';

export interface PerformanceMetrics {
  // Runtime metrics
  initializationTime: number;
  connectionTime: number;
  messageLatency: number;
  throughput: number;
  
  // Memory metrics
  memoryUsage: number;
  heapSize: number;
  gcCount: number;
  
  // Connection metrics
  activeConnections: number;
  poolUtilization: number;
  connectionErrors: number;
  
  // Task metrics
  taskExecutionTime: number;
  taskQueueSize: number;
  taskSuccessRate: number;
  
  timestamp: Date;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  metric: keyof PerformanceMetrics;
  threshold: number;
  currentValue: number;
  message: string;
  timestamp: Date;
}

export interface PerformanceThresholds {
  initializationTime: { warning: number; error: number };
  connectionTime: { warning: number; error: number };
  messageLatency: { warning: number; error: number };
  throughput: { warning: number; error: number };
  memoryUsage: { warning: number; error: number };
  heapSize: { warning: number; error: number };
  gcCount: { warning: number; error: number };
  activeConnections: { warning: number; error: number };
  poolUtilization: { warning: number; error: number };
  connectionErrors: { warning: number; error: number };
  taskExecutionTime: { warning: number; error: number };
  taskQueueSize: { warning: number; error: number };
  taskSuccessRate: { warning: number; error: number };
}

export interface PerformanceMonitorOptions {
  enabled: boolean;
  collectInterval: number; // milliseconds
  retentionPeriod: number; // milliseconds
  thresholds: PerformanceThresholds;
  alertCallback?: (alert: PerformanceAlert) => void;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private options: PerformanceMonitorOptions;
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private collectTimer?: NodeJS.Timeout;
  private startTime: number = Date.now();
  
  // Performance counters
  private counters = {
    connections: 0,
    messages: 0,
    tasks: 0,
    errors: 0,
    gcEvents: 0
  };
  
  // Timing measurements
  private timings = new Map<string, number>();
  
  private constructor(options: PerformanceMonitorOptions) {
    this.options = options;
    
    if (options.enabled) {
      this.startCollection();
    }
  }
  
  static getInstance(options?: PerformanceMonitorOptions): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      const defaultOptions: PerformanceMonitorOptions = {
        enabled: true,
        collectInterval: 5000, // 5 seconds
        retentionPeriod: 3600000, // 1 hour
        thresholds: {
          initializationTime: { warning: 1000, error: 3000 },
          connectionTime: { warning: 2000, error: 5000 },
          messageLatency: { warning: 100, error: 500 },
          throughput: { warning: 10, error: 5 }, // messages per second
          memoryUsage: { warning: 100 * 1024 * 1024, error: 500 * 1024 * 1024 }, // 100MB/500MB
          heapSize: { warning: 80 * 1024 * 1024, error: 400 * 1024 * 1024 }, // 80MB/400MB
          gcCount: { warning: 100, error: 200 },
          activeConnections: { warning: 50, error: 100 },
          poolUtilization: { warning: 0.8, error: 0.95 },
          connectionErrors: { warning: 5, error: 10 },
          taskExecutionTime: { warning: 1000, error: 5000 },
          taskQueueSize: { warning: 20, error: 50 },
          taskSuccessRate: { warning: 0.9, error: 0.8 }
        }
      };
      
      PerformanceMonitor.instance = new PerformanceMonitor(options || defaultOptions);
    }
    
    return PerformanceMonitor.instance;
  }
  
  // Start performance data collection
  private startCollection(): void {
    this.collectTimer = setInterval(() => {
      this.collectMetrics();
      this.cleanupOldData();
    }, this.options.collectInterval);
  }
  
  // Stop performance data collection
  stopCollection(): void {
    if (this.collectTimer) {
      clearInterval(this.collectTimer);
      this.collectTimer = undefined;
    }
  }
  
  // Collect current performance metrics
  private collectMetrics(): void {
    const now = new Date();
    const memoryUsage = this.getMemoryUsage();
    
    const metrics: PerformanceMetrics = {
      initializationTime: this.getAverageTime('initialization'),
      connectionTime: this.getAverageTime('connection'),
      messageLatency: this.getAverageTime('message'),
      throughput: this.calculateThroughput(),
      memoryUsage: memoryUsage.used,
      heapSize: memoryUsage.heapUsed,
      gcCount: this.counters.gcEvents,
      activeConnections: this.counters.connections,
      poolUtilization: this.calculatePoolUtilization(),
      connectionErrors: this.counters.errors,
      taskExecutionTime: this.getAverageTime('task'),
      taskQueueSize: 0, // Would be populated by runtime
      taskSuccessRate: this.calculateTaskSuccessRate(),
      timestamp: now
    };
    
    this.metrics.push(metrics);
    this.checkThresholds(metrics);
  }
  
  // Get memory usage information
  private getMemoryUsage(): { used: number; heapUsed: number } {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        used: usage.rss,
        heapUsed: usage.heapUsed
      };
    }
    
    // Fallback for browser environment
    return {
      used: 0,
      heapUsed: 0
    };
  }
  
  // Calculate average time for a specific operation
  private getAverageTime(operation: string): number {
    const times = Array.from(this.timings.entries())
      .filter(([key]) => key.startsWith(operation))
      .map(([, time]) => time);
    
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }
  
  // Calculate message throughput (messages per second)
  private calculateThroughput(): number {
    const timeWindow = 60000; // 1 minute
    const cutoff = Date.now() - timeWindow;
    
    const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);
    return recentMetrics.length > 0 ? this.counters.messages / (timeWindow / 1000) : 0;
  }
  
  // Calculate connection pool utilization
  private calculatePoolUtilization(): number {
    // This would be calculated based on actual pool metrics
    // For now, return a placeholder
    return Math.min(this.counters.connections / 10, 1); // Assume max 10 connections
  }
  
  // Calculate task success rate
  private calculateTaskSuccessRate(): number {
    const totalTasks = this.counters.tasks;
    const failedTasks = this.counters.errors;
    
    return totalTasks > 0 ? (totalTasks - failedTasks) / totalTasks : 1;
  }
  
  // Check performance thresholds and generate alerts
  private checkThresholds(metrics: PerformanceMetrics): void {
    const checks: Array<{ metric: keyof PerformanceThresholds; value: number }> = [
      { metric: 'initializationTime', value: metrics.initializationTime },
      { metric: 'connectionTime', value: metrics.connectionTime },
      { metric: 'messageLatency', value: metrics.messageLatency },
      { metric: 'throughput', value: metrics.throughput },
      { metric: 'memoryUsage', value: metrics.memoryUsage },
      { metric: 'heapSize', value: metrics.heapSize },
      { metric: 'gcCount', value: metrics.gcCount },
      { metric: 'activeConnections', value: metrics.activeConnections },
      { metric: 'poolUtilization', value: metrics.poolUtilization },
      { metric: 'connectionErrors', value: metrics.connectionErrors },
      { metric: 'taskExecutionTime', value: metrics.taskExecutionTime },
      { metric: 'taskQueueSize', value: metrics.taskQueueSize },
      { metric: 'taskSuccessRate', value: metrics.taskSuccessRate }
    ];
    
    for (const check of checks) {
      const thresholds = this.options.thresholds[check.metric];
      if (!thresholds) continue;
      
      let alertType: 'warning' | 'error' | null = null;
      let threshold = 0;
      
      if (check.metric === 'taskSuccessRate') {
        // For success rate, lower values are worse
        if (check.value < thresholds.error) {
          alertType = 'error';
          threshold = thresholds.error;
        } else if (check.value < thresholds.warning) {
          alertType = 'warning';
          threshold = thresholds.warning;
        }
      } else {
        // For other metrics, higher values are worse
        if (check.value > thresholds.error) {
          alertType = 'error';
          threshold = thresholds.error;
        } else if (check.value > thresholds.warning) {
          alertType = 'warning';
          threshold = thresholds.warning;
        }
      }
      
      if (alertType) {
        this.generateAlert(alertType, check.metric, threshold, check.value);
      }
    }
  }
  
  // Generate performance alert
  private generateAlert(
    type: 'warning' | 'error',
    metric: keyof PerformanceThresholds,
    threshold: number,
    currentValue: number
  ): void {
    const alert: PerformanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      metric,
      threshold,
      currentValue,
      message: `Performance ${type}: ${metric} is ${currentValue}, threshold is ${threshold}`,
      timestamp: new Date()
    };
    
    this.alerts.push(alert);
    
    if (this.options.alertCallback) {
      this.options.alertCallback(alert);
    }
  }
  
  // Clean up old performance data
  private cleanupOldData(): void {
    const cutoff = Date.now() - this.options.retentionPeriod;
    
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);
    this.alerts = this.alerts.filter(a => a.timestamp.getTime() > cutoff);
  }
  
  // Public API methods
  
  // Record timing for an operation
  startTiming(operation: string): string {
    const timingId = `${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.timings.set(timingId, Date.now());
    return timingId;
  }
  
  // End timing for an operation
  endTiming(timingId: string): number {
    const startTime = this.timings.get(timingId);
    if (!startTime) return 0;
    
    const duration = Date.now() - startTime;
    this.timings.delete(timingId);
    return duration;
  }
  
  // Increment counters
  incrementCounter(type: keyof typeof this.counters): void {
    this.counters[type]++;
  }
  
  // Get current metrics
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }
  
  // Get metrics history
  getMetricsHistory(limit?: number): PerformanceMetrics[] {
    return limit ? this.metrics.slice(-limit) : [...this.metrics];
  }
  
  // Get active alerts
  getActiveAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }
  
  // Get performance summary
  getPerformanceSummary(): {
    uptime: number;
    totalMetrics: number;
    activeAlerts: number;
    averageLatency: number;
    memoryTrend: 'increasing' | 'decreasing' | 'stable';
  } {
    const uptime = Date.now() - this.startTime;
    const recentMetrics = this.metrics.slice(-10);
    
    let memoryTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentMetrics.length >= 2) {
      const first = recentMetrics[0].memoryUsage;
      const last = recentMetrics[recentMetrics.length - 1].memoryUsage;
      const change = (last - first) / first;
      
      if (change > 0.1) memoryTrend = 'increasing';
      else if (change < -0.1) memoryTrend = 'decreasing';
    }
    
    return {
      uptime,
      totalMetrics: this.metrics.length,
      activeAlerts: this.alerts.length,
      averageLatency: this.getAverageTime('message'),
      memoryTrend
    };
  }
  
  // Update configuration
  updateOptions(options: Partial<PerformanceMonitorOptions>): void {
    this.options = { ...this.options, ...options };
    
    if (options.enabled !== undefined) {
      if (options.enabled && !this.collectTimer) {
        this.startCollection();
      } else if (!options.enabled && this.collectTimer) {
        this.stopCollection();
      }
    }
  }
}

// Export singleton instance getter
export const getPerformanceMonitor = () => PerformanceMonitor.getInstance();