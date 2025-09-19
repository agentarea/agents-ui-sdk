export interface DashboardConfig {
  refreshInterval: number; // milliseconds
  maxDataPoints: number;
  enableRealTimeUpdates: boolean;
  enableAlerts: boolean;
  thresholds: {
    memoryUsage: number; // percentage
    responseTime: number; // milliseconds
    errorRate: number; // percentage
    cacheHitRate: number; // percentage
  };
}

export interface MetricDataPoint {
  timestamp: number;
  value: number;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
    type: 'line' | 'bar' | 'area';
  }>;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'alert';
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number; width: number; height: number };
  config: Record<string, unknown>;
  data: unknown;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // milliseconds
  lastTriggered?: number;
}

export interface DashboardAlert {
  id: string;
  ruleId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  acknowledged: boolean;
  metadata?: Record<string, unknown>;
}

export class PerformanceDashboard {
  private static instance: PerformanceDashboard;
  private config: DashboardConfig;
  private widgets = new Map<string, DashboardWidget>();
  private metrics = new Map<string, MetricDataPoint[]>();
  private alerts: DashboardAlert[] = [];
  private alertRules = new Map<string, AlertRule>();
  private updateTimer?: NodeJS.Timeout;
  private subscribers = new Set<(data: DashboardData) => void>();
  
  private constructor(config?: Partial<DashboardConfig>) {
    this.config = {
      refreshInterval: 5000, // 5 seconds
      maxDataPoints: 100,
      enableRealTimeUpdates: true,
      enableAlerts: true,
      thresholds: {
        memoryUsage: 80,
        responseTime: 1000,
        errorRate: 5,
        cacheHitRate: 90
      },
      ...config
    };
    
    this.initializeDefaultWidgets();
    this.initializeDefaultAlertRules();
    
    if (this.config.enableRealTimeUpdates) {
      this.startUpdateTimer();
    }
  }
  
  static getInstance(config?: Partial<DashboardConfig>): PerformanceDashboard {
    if (!PerformanceDashboard.instance) {
      PerformanceDashboard.instance = new PerformanceDashboard(config);
    }
    return PerformanceDashboard.instance;
  }
  
  // Widget management
  
  addWidget(widget: DashboardWidget): void {
    this.widgets.set(widget.id, widget);
    this.notifySubscribers();
  }
  
  removeWidget(widgetId: string): boolean {
    const removed = this.widgets.delete(widgetId);
    if (removed) {
      this.notifySubscribers();
    }
    return removed;
  }
  
  updateWidget(widgetId: string, updates: Partial<DashboardWidget>): void {
    const widget = this.widgets.get(widgetId);
    if (widget) {
      this.widgets.set(widgetId, { ...widget, ...updates });
      this.notifySubscribers();
    }
  }
  
  getWidget(widgetId: string): DashboardWidget | undefined {
    return this.widgets.get(widgetId);
  }
  
  getAllWidgets(): DashboardWidget[] {
    return Array.from(this.widgets.values());
  }
  
  // Metric management
  
  addMetricData(metricName: string, dataPoint: MetricDataPoint): void {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    
    const data = this.metrics.get(metricName)!;
    data.push(dataPoint);
    
    // Keep only the latest data points
    if (data.length > this.config.maxDataPoints) {
      data.splice(0, data.length - this.config.maxDataPoints);
    }
    
    // Check alert rules
    if (this.config.enableAlerts) {
      this.checkAlertRules(metricName, dataPoint.value);
    }
    
    this.notifySubscribers();
  }
  
  getMetricData(metricName: string): MetricDataPoint[] {
    return this.metrics.get(metricName) || [];
  }
  
  getAllMetrics(): Map<string, MetricDataPoint[]> {
    return new Map(this.metrics);
  }
  
  clearMetricData(metricName?: string): void {
    if (metricName) {
      this.metrics.delete(metricName);
    } else {
      this.metrics.clear();
    }
    this.notifySubscribers();
  }
  
  // Chart data generation
  
  generateChartData(metricNames: string[], timeRange?: { start: number; end: number }): ChartData {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    const datasets: ChartData['datasets'] = [];
    const allTimestamps = new Set<number>();
    
    // Collect all timestamps
    metricNames.forEach(metricName => {
      const data = this.getMetricData(metricName);
      data.forEach(point => {
        if (!timeRange || (point.timestamp >= timeRange.start && point.timestamp <= timeRange.end)) {
          allTimestamps.add(point.timestamp);
        }
      });
    });
    
    const sortedTimestamps = Array.from(allTimestamps).sort();
    const labels = sortedTimestamps.map(ts => new Date(ts).toLocaleTimeString());
    
    // Generate datasets
    metricNames.forEach((metricName, index) => {
      const data = this.getMetricData(metricName);
      const dataMap = new Map(data.map(point => [point.timestamp, point.value]));
      
      const values = sortedTimestamps.map(ts => dataMap.get(ts) || 0);
      
      datasets.push({
        label: metricName,
        data: values,
        color: colors[index % colors.length],
        type: 'line'
      });
    });
    
    return { labels, datasets };
  }
  
  // Alert management
  
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }
  
  removeAlertRule(ruleId: string): boolean {
    return this.alertRules.delete(ruleId);
  }
  
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      this.alertRules.set(ruleId, { ...rule, ...updates });
    }
  }
  
  getAlertRule(ruleId: string): AlertRule | undefined {
    return this.alertRules.get(ruleId);
  }
  
  getAllAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }
  
  private checkAlertRules(metricName: string, value: number): void {
    const now = Date.now();
    
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled || rule.metric !== metricName) {
        continue;
      }
      
      // Check cooldown
      if (rule.lastTriggered && (now - rule.lastTriggered) < rule.cooldown) {
        continue;
      }
      
      // Check condition
      let triggered = false;
      switch (rule.condition) {
        case 'gt':
          triggered = value > rule.threshold;
          break;
        case 'gte':
          triggered = value >= rule.threshold;
          break;
        case 'lt':
          triggered = value < rule.threshold;
          break;
        case 'lte':
          triggered = value <= rule.threshold;
          break;
        case 'eq':
          triggered = value === rule.threshold;
          break;
      }
      
      if (triggered) {
        this.triggerAlert(rule, value);
      }
    }
  }
  
  private triggerAlert(rule: AlertRule, value: number): void {
    const alert: DashboardAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      message: `${rule.name}: ${rule.metric} is ${value} (threshold: ${rule.threshold})`,
      severity: rule.severity,
      timestamp: Date.now(),
      acknowledged: false,
      metadata: {
        metric: rule.metric,
        value,
        threshold: rule.threshold,
        condition: rule.condition
      }
    };
    
    this.alerts.unshift(alert);
    
    // Keep only the latest 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }
    
    // Update rule's last triggered time
    rule.lastTriggered = Date.now();
    
    this.notifySubscribers();
  }
  
  getAlerts(options?: { severity?: string; acknowledged?: boolean; limit?: number }): DashboardAlert[] {
    let filtered = this.alerts;
    
    if (options?.severity) {
      filtered = filtered.filter(alert => alert.severity === options.severity);
    }
    
    if (options?.acknowledged !== undefined) {
      filtered = filtered.filter(alert => alert.acknowledged === options.acknowledged);
    }
    
    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }
  
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.notifySubscribers();
      return true;
    }
    return false;
  }
  
  clearAlerts(acknowledged?: boolean): void {
    if (acknowledged !== undefined) {
      this.alerts = this.alerts.filter(alert => alert.acknowledged !== acknowledged);
    } else {
      this.alerts = [];
    }
    this.notifySubscribers();
  }
  
  // Data collection from various sources
  
  async collectRuntimeMetrics(): Promise<void> {
    const timestamp = Date.now();
    
    try {
      // Memory usage
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        const memory = (performance as any).memory;
        this.addMetricData('memory.used', {
          timestamp,
          value: memory.usedJSHeapSize / 1024 / 1024 // MB
        });
        
        this.addMetricData('memory.total', {
          timestamp,
          value: memory.totalJSHeapSize / 1024 / 1024 // MB
        });
        
        this.addMetricData('memory.usage_percentage', {
          timestamp,
          value: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
        });
      }
      
      // Performance timing
      if (typeof performance !== 'undefined' && (performance as any).timing) {
        const timing = (performance as any).timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        
        if (loadTime > 0) {
          this.addMetricData('page.load_time', {
            timestamp,
            value: loadTime
          });
        }
      }
      
      // Connection information (browser only)
      if (typeof globalThis !== 'undefined' && (globalThis as any).navigator?.connection) {
        const connection = (globalThis as any).navigator.connection;
        
        this.addMetricData('network.downlink', {
          timestamp,
          value: connection.downlink || 0
        });
        
        this.addMetricData('network.rtt', {
          timestamp,
          value: connection.rtt || 0
        });
      }
      
    } catch (error) {
      console.warn('Failed to collect runtime metrics:', error);
    }
  }
  
  async collectCacheMetrics(): Promise<void> {
    try {
      // This would integrate with the CacheManager
      // For now, we'll simulate some cache metrics
      const timestamp = Date.now();
      
      // Simulated cache metrics
      this.addMetricData('cache.hit_rate', {
        timestamp,
        value: Math.random() * 100 // 0-100%
      });
      
      this.addMetricData('cache.size', {
        timestamp,
        value: Math.random() * 50 // 0-50MB
      });
      
      this.addMetricData('cache.entries', {
        timestamp,
        value: Math.floor(Math.random() * 1000) // 0-1000 entries
      });
      
    } catch (error) {
      console.warn('Failed to collect cache metrics:', error);
    }
  }
  
  async collectPerformanceMetrics(): Promise<void> {
    try {
      // This would integrate with the PerformanceMonitor
      const timestamp = Date.now();
      
      // Simulated performance metrics
      this.addMetricData('performance.response_time', {
        timestamp,
        value: Math.random() * 500 + 100 // 100-600ms
      });
      
      this.addMetricData('performance.throughput', {
        timestamp,
        value: Math.random() * 1000 + 500 // 500-1500 ops/sec
      });
      
      this.addMetricData('performance.error_rate', {
        timestamp,
        value: Math.random() * 10 // 0-10%
      });
      
    } catch (error) {
      console.warn('Failed to collect performance metrics:', error);
    }
  }
  
  // Real-time updates
  
  private startUpdateTimer(): void {
    this.updateTimer = setInterval(async () => {
      await this.collectAllMetrics();
    }, this.config.refreshInterval);
  }
  
  private async collectAllMetrics(): Promise<void> {
    await Promise.all([
      this.collectRuntimeMetrics(),
      this.collectCacheMetrics(),
      this.collectPerformanceMetrics()
    ]);
  }
  
  // Subscription management
  
  subscribe(callback: (data: DashboardData) => void): () => void {
    this.subscribers.add(callback);
    
    // Send initial data
    callback(this.getDashboardData());
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }
  
  private notifySubscribers(): void {
    const data = this.getDashboardData();
    for (const callback of this.subscribers) {
      try {
        callback(data);
      } catch (error) {
        console.error('Error notifying dashboard subscriber:', error);
      }
    }
  }
  
  // Dashboard data export
  
  getDashboardData(): DashboardData {
    return {
      widgets: this.getAllWidgets(),
      metrics: Object.fromEntries(this.metrics),
      alerts: this.getAlerts({ limit: 20 }),
      alertRules: this.getAllAlertRules(),
      config: this.config,
      timestamp: Date.now()
    };
  }
  
  // Configuration
  
  updateConfig(newConfig: Partial<DashboardConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart timer if refresh interval changed
    if (newConfig.refreshInterval && this.updateTimer) {
      clearInterval(this.updateTimer);
      if (this.config.enableRealTimeUpdates) {
        this.startUpdateTimer();
      }
    }
    
    this.notifySubscribers();
  }
  
  getConfig(): DashboardConfig {
    return { ...this.config };
  }
  
  // Initialize default widgets and rules
  
  private initializeDefaultWidgets(): void {
    const defaultWidgets: DashboardWidget[] = [
      {
        id: 'memory-usage',
        title: 'Memory Usage',
        type: 'metric',
        size: 'small',
        position: { x: 0, y: 0, width: 1, height: 1 },
        config: { metric: 'memory.usage_percentage', unit: '%' },
        data: null
      },
      {
        id: 'response-time',
        title: 'Response Time',
        type: 'chart',
        size: 'medium',
        position: { x: 1, y: 0, width: 2, height: 1 },
        config: { metrics: ['performance.response_time'], timeRange: 300000 },
        data: null
      },
      {
        id: 'cache-hit-rate',
        title: 'Cache Hit Rate',
        type: 'metric',
        size: 'small',
        position: { x: 0, y: 1, width: 1, height: 1 },
        config: { metric: 'cache.hit_rate', unit: '%' },
        data: null
      },
      {
        id: 'alerts-table',
        title: 'Recent Alerts',
        type: 'table',
        size: 'large',
        position: { x: 0, y: 2, width: 3, height: 2 },
        config: { showAcknowledged: false, limit: 10 },
        data: null
      }
    ];
    
    defaultWidgets.forEach(widget => this.addWidget(widget));
  }
  
  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        metric: 'memory.usage_percentage',
        condition: 'gt',
        threshold: this.config.thresholds.memoryUsage,
        severity: 'high',
        enabled: true,
        cooldown: 60000 // 1 minute
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        metric: 'performance.response_time',
        condition: 'gt',
        threshold: this.config.thresholds.responseTime,
        severity: 'medium',
        enabled: true,
        cooldown: 30000 // 30 seconds
      },
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        metric: 'performance.error_rate',
        condition: 'gt',
        threshold: this.config.thresholds.errorRate,
        severity: 'critical',
        enabled: true,
        cooldown: 60000 // 1 minute
      },
      {
        id: 'low-cache-hit-rate',
        name: 'Low Cache Hit Rate',
        metric: 'cache.hit_rate',
        condition: 'lt',
        threshold: this.config.thresholds.cacheHitRate,
        severity: 'medium',
        enabled: true,
        cooldown: 300000 // 5 minutes
      }
    ];
    
    defaultRules.forEach(rule => this.addAlertRule(rule));
  }
  
  // Export/Import for persistence
  
  export(): {
    widgets: DashboardWidget[];
    alertRules: AlertRule[];
    config: DashboardConfig;
  } {
    return {
      widgets: this.getAllWidgets(),
      alertRules: this.getAllAlertRules(),
      config: this.config
    };
  }
  
  import(data: {
    widgets?: DashboardWidget[];
    alertRules?: AlertRule[];
    config?: Partial<DashboardConfig>;
  }): void {
    if (data.config) {
      this.updateConfig(data.config);
    }
    
    if (data.widgets) {
      this.widgets.clear();
      data.widgets.forEach(widget => this.addWidget(widget));
    }
    
    if (data.alertRules) {
      this.alertRules.clear();
      data.alertRules.forEach(rule => this.addAlertRule(rule));
    }
  }
  
  // Cleanup
  
  destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    this.widgets.clear();
    this.metrics.clear();
    this.alerts = [];
    this.alertRules.clear();
    this.subscribers.clear();
  }
}

export interface DashboardData {
  widgets: DashboardWidget[];
  metrics: Record<string, MetricDataPoint[]>;
  alerts: DashboardAlert[];
  alertRules: AlertRule[];
  config: DashboardConfig;
  timestamp: number;
}

// Export singleton instance getter
export const getPerformanceDashboard = (config?: Partial<DashboardConfig>) => 
  PerformanceDashboard.getInstance(config);