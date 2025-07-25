/**
 * Performance Monitoring Service for Bot Optimization
 * Tracks response times, database queries, and system metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      responseTime: [],
      databaseQueries: [],
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsage: [],
      commandCounts: new Map(),
      errorCounts: new Map(),
      slowQueries: []
    };
    this.startTime = Date.now();
    this.thresholds = {
      slowResponse: 1000, // 1 second
      slowQuery: 500, // 500ms
      memoryWarning: 100 * 1024 * 1024 // 100MB
    };
  }

  /**
   * Start timing an operation
   */
  startTimer(operation) {
    return {
      operation,
      startTime: Date.now(),
      end: () => {
        const duration = Date.now() - this.startTime;
        this.recordMetric(operation, duration);
        return duration;
      }
    };
  }

  /**
   * Record metric with automatic categorization
   */
  recordMetric(operation, duration, metadata = {}) {
    const metric = {
      operation,
      duration,
      timestamp: Date.now(),
      metadata
    };

    // Categorize metrics
    if (operation.includes('db_') || operation.includes('database')) {
      this.metrics.databaseQueries.push(metric);
      
      // Track slow queries
      if (duration > this.thresholds.slowQuery) {
        this.metrics.slowQueries.push(metric);
      }
    } else {
      this.metrics.responseTime.push(metric);
    }

    // Track command usage
    if (operation.startsWith('cmd_')) {
      const command = operation.replace('cmd_', '');
      this.metrics.commandCounts.set(command, (this.metrics.commandCounts.get(command) || 0) + 1);
    }

    // Keep only recent metrics (last 1000 entries)
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
    }
    if (this.metrics.databaseQueries.length > 1000) {
      this.metrics.databaseQueries = this.metrics.databaseQueries.slice(-1000);
    }
  }

  /**
   * Record cache hit/miss
   */
  recordCacheResult(hit) {
    if (hit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
  }

  /**
   * Record error occurrence
   */
  recordError(error, context = '') {
    const errorKey = `${error.name || 'Unknown'}_${context}`;
    this.metrics.errorCounts.set(errorKey, (this.metrics.errorCounts.get(errorKey) || 0) + 1);
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage() {
    const usage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss
    });

    // Keep only recent memory snapshots
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
    }
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    // Calculate averages
    const avgResponseTime = this.calculateAverage(this.metrics.responseTime);
    const avgDatabaseTime = this.calculateAverage(this.metrics.databaseQueries);
    
    // Cache hit rate
    const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 ? (this.metrics.cacheHits / totalCacheRequests * 100) : 0;
    
    // Recent performance (last 5 minutes)
    const recentCutoff = now - (5 * 60 * 1000);
    const recentResponses = this.metrics.responseTime.filter(m => m.timestamp > recentCutoff);
    const recentAvgResponseTime = this.calculateAverage(recentResponses);
    
    return {
      uptime,
      performance: {
        avgResponseTime,
        avgDatabaseTime,
        recentAvgResponseTime,
        slowResponses: this.metrics.responseTime.filter(m => m.duration > this.thresholds.slowResponse).length,
        slowQueries: this.metrics.slowQueries.length
      },
      cache: {
        hitRate: cacheHitRate,
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses
      },
      commands: {
        total: Array.from(this.metrics.commandCounts.values()).reduce((sum, count) => sum + count, 0),
        mostUsed: this.getMostUsedCommands()
      },
      errors: {
        total: Array.from(this.metrics.errorCounts.values()).reduce((sum, count) => sum + count, 0),
        recent: this.getRecentErrors()
      },
      memory: this.getMemoryStats()
    };
  }

  /**
   * Calculate average duration
   */
  calculateAverage(metrics) {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.duration, 0);
    return Math.round(sum / metrics.length);
  }

  /**
   * Get most used commands
   */
  getMostUsedCommands() {
    return Array.from(this.metrics.commandCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([command, count]) => ({ command, count }));
  }

  /**
   * Get recent errors (last hour)
   */
  getRecentErrors() {
    const cutoff = Date.now() - (60 * 60 * 1000);
    return Array.from(this.metrics.errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .slice(0, 10);
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    if (this.metrics.memoryUsage.length === 0) return null;
    
    const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    const peak = this.metrics.memoryUsage.reduce((max, curr) => 
      curr.heapUsed > max.heapUsed ? curr : max
    );
    
    return {
      current: {
        heapUsed: Math.round(latest.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(latest.heapTotal / 1024 / 1024),
        rss: Math.round(latest.rss / 1024 / 1024)
      },
      peak: {
        heapUsed: Math.round(peak.heapUsed / 1024 / 1024),
        timestamp: peak.timestamp
      },
      warning: latest.heapUsed > this.thresholds.memoryWarning
    };
  }

  /**
   * Get detailed metrics for admin dashboard
   */
  getDetailedMetrics() {
    return {
      summary: this.getSummary(),
      responseTimeDistribution: this.getResponseTimeDistribution(),
      slowQueries: this.metrics.slowQueries.slice(-20),
      commandStats: Array.from(this.metrics.commandCounts.entries()),
      errorStats: Array.from(this.metrics.errorCounts.entries()),
      memoryTrend: this.metrics.memoryUsage.slice(-20)
    };
  }

  /**
   * Get response time distribution
   */
  getResponseTimeDistribution() {
    const buckets = {
      'Under 100ms': 0,
      '100-300ms': 0,
      '300-500ms': 0,
      '500ms-1s': 0,
      'Over 1s': 0
    };

    this.metrics.responseTime.forEach(metric => {
      if (metric.duration < 100) buckets['Under 100ms']++;
      else if (metric.duration < 300) buckets['100-300ms']++;
      else if (metric.duration < 500) buckets['300-500ms']++;
      else if (metric.duration < 1000) buckets['500ms-1s']++;
      else buckets['Over 1s']++;
    });

    return buckets;
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const summary = this.getSummary();
    const issues = [];

    // Check response time
    if (summary.performance.avgResponseTime > this.thresholds.slowResponse) {
      issues.push('Slow average response time');
    }

    // Check cache hit rate
    if (summary.cache.hitRate < 80) {
      issues.push('Low cache hit rate');
    }

    // Check memory usage
    if (summary.memory && summary.memory.warning) {
      issues.push('High memory usage');
    }

    // Check error rate
    const errorRate = summary.errors.total / summary.commands.total * 100;
    if (errorRate > 5) {
      issues.push('High error rate');
    }

    return {
      healthy: issues.length === 0,
      issues,
      score: Math.max(0, 100 - (issues.length * 20))
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      responseTime: [],
      databaseQueries: [],
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsage: [],
      commandCounts: new Map(),
      errorCounts: new Map(),
      slowQueries: []
    };
    this.startTime = Date.now();
  }

  /**
   * Start periodic monitoring
   */
  startPeriodicMonitoring() {
    // Record memory usage every 30 seconds
    setInterval(() => {
      this.recordMemoryUsage();
    }, 30000);

    // Clean up old metrics every 5 minutes
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  cleanupOldMetrics() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    this.metrics.responseTime = this.metrics.responseTime.filter(m => m.timestamp > cutoff);
    this.metrics.databaseQueries = this.metrics.databaseQueries.filter(m => m.timestamp > cutoff);
    this.metrics.slowQueries = this.metrics.slowQueries.filter(m => m.timestamp > cutoff);
    this.metrics.memoryUsage = this.metrics.memoryUsage.filter(m => m.timestamp > cutoff);
  }
}

// Export singleton instance
module.exports = new PerformanceMonitor();