/**
 * Database Performance Monitor Service
 * Real-time monitoring and analysis of database performance metrics
 */

const databaseIndexing = require('./database-indexing');
const connectionPool = require('./database-connection-pool');

class DatabasePerformanceMonitor {
  constructor() {
    this.metrics = {
      queries: {
        total: 0,
        successful: 0,
        failed: 0,
        averageTime: 0,
        slowQueries: []
      },
      connections: {
        active: 0,
        idle: 0,
        total: 0,
        poolUtilization: 0
      },
      indexes: {
        hits: 0,
        misses: 0,
        efficiency: 0
      },
      performance: {
        responseTime: 0,
        throughput: 0,
        errorRate: 0
      }
    };
    
    this.realtimeStats = new Map();
    this.performanceAlerts = [];
    this.monitoringInterval = null;
  }

  /**
   * Initialize performance monitoring
   */
  initialize() {
    console.log('📊 Initializing database performance monitoring...');
    
    // Start real-time monitoring
    this.startRealtimeMonitoring();
    
    // Initialize alert system
    this.initializeAlerts();
    
    console.log('✅ Database performance monitoring active');
  }

  /**
   * Start real-time monitoring
   */
  startRealtimeMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
      this.checkAlerts();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Collect performance metrics
   */
  collectMetrics() {
    // Collect connection pool metrics
    const poolStats = connectionPool.getPoolStats();
    this.metrics.connections = {
      active: poolStats.connections.active,
      idle: poolStats.connections.idle,
      total: poolStats.connections.total,
      poolUtilization: poolStats.health.utilizationRate
    };

    // Collect indexing metrics
    const indexStats = databaseIndexing.getIndexStatus();
    const queryStats = databaseIndexing.getQueryStats();
    
    this.metrics.indexes = {
      hits: queryStats.totalQueries || 0,
      misses: Math.max(0, queryStats.totalQueries - (queryStats.totalQueries * 0.8)),
      efficiency: indexStats.createdIndexes / Math.max(1, indexStats.totalIndexes) * 100
    };

    // Update performance metrics
    this.updatePerformanceMetrics();
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics() {
    const now = Date.now();
    
    // Calculate response time (simulated)
    this.metrics.performance.responseTime = this.calculateAverageResponseTime();
    
    // Calculate throughput
    this.metrics.performance.throughput = this.calculateThroughput();
    
    // Calculate error rate
    this.metrics.performance.errorRate = this.calculateErrorRate();
    
    // Store real-time stats
    this.realtimeStats.set(now, {
      ...this.metrics,
      timestamp: now
    });
    
    // Keep only last 100 entries
    if (this.realtimeStats.size > 100) {
      const oldestKey = Math.min(...this.realtimeStats.keys());
      this.realtimeStats.delete(oldestKey);
    }
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime() {
    const stats = Array.from(this.realtimeStats.values());
    if (stats.length === 0) return 0;
    
    const totalTime = stats.reduce((sum, stat) => sum + (stat.performance?.responseTime || 0), 0);
    return totalTime / stats.length;
  }

  /**
   * Calculate throughput (queries per second)
   */
  calculateThroughput() {
    const stats = Array.from(this.realtimeStats.values());
    if (stats.length < 2) return 0;
    
    const recent = stats.slice(-10); // Last 10 measurements
    const timeSpan = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000;
    const queryDiff = recent[recent.length - 1].queries.total - recent[0].queries.total;
    
    return timeSpan > 0 ? queryDiff / timeSpan : 0;
  }

  /**
   * Calculate error rate
   */
  calculateErrorRate() {
    const totalQueries = this.metrics.queries.total;
    const failedQueries = this.metrics.queries.failed;
    
    return totalQueries > 0 ? (failedQueries / totalQueries) * 100 : 0;
  }

  /**
   * Analyze performance trends
   */
  analyzePerformance() {
    const stats = Array.from(this.realtimeStats.values());
    if (stats.length < 10) return;
    
    const recent = stats.slice(-10);
    const analysis = {
      responseTimeTrend: this.calculateTrend(recent.map(s => s.performance.responseTime)),
      throughputTrend: this.calculateTrend(recent.map(s => s.performance.throughput)),
      connectionUsageTrend: this.calculateTrend(recent.map(s => s.connections.poolUtilization))
    };
    
    // Store analysis results
    this.performanceAnalysis = analysis;
  }

  /**
   * Calculate trend (increasing, decreasing, stable)
   */
  calculateTrend(values) {
    if (values.length < 3) return 'stable';
    
    const first = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const last = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    
    const change = ((last - first) / first) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Initialize performance alerts
   */
  initializeAlerts() {
    this.alertThresholds = {
      responseTime: 1000, // 1 second
      errorRate: 5, // 5%
      poolUtilization: 80, // 80%
      throughput: 0.1 // 0.1 queries per second minimum
    };
  }

  /**
   * Check performance alerts
   */
  checkAlerts() {
    const alerts = [];
    
    // High response time alert
    if (this.metrics.performance.responseTime > this.alertThresholds.responseTime) {
      alerts.push({
        type: 'high_response_time',
        severity: 'warning',
        message: `High response time: ${this.metrics.performance.responseTime}ms`,
        threshold: this.alertThresholds.responseTime,
        current: this.metrics.performance.responseTime,
        timestamp: new Date()
      });
    }
    
    // High error rate alert
    if (this.metrics.performance.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        type: 'high_error_rate',
        severity: 'error',
        message: `High error rate: ${this.metrics.performance.errorRate}%`,
        threshold: this.alertThresholds.errorRate,
        current: this.metrics.performance.errorRate,
        timestamp: new Date()
      });
    }
    
    // High pool utilization alert
    if (this.metrics.connections.poolUtilization > this.alertThresholds.poolUtilization) {
      alerts.push({
        type: 'high_pool_utilization',
        severity: 'warning',
        message: `High connection pool utilization: ${this.metrics.connections.poolUtilization}%`,
        threshold: this.alertThresholds.poolUtilization,
        current: this.metrics.connections.poolUtilization,
        timestamp: new Date()
      });
    }
    
    // Low throughput alert
    if (this.metrics.performance.throughput < this.alertThresholds.throughput) {
      alerts.push({
        type: 'low_throughput',
        severity: 'info',
        message: `Low throughput: ${this.metrics.performance.throughput} queries/sec`,
        threshold: this.alertThresholds.throughput,
        current: this.metrics.performance.throughput,
        timestamp: new Date()
      });
    }
    
    // Store new alerts
    this.performanceAlerts = [...this.performanceAlerts, ...alerts].slice(-50); // Keep last 50
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport() {
    const stats = Array.from(this.realtimeStats.values());
    
    return {
      current: this.metrics,
      analysis: this.performanceAnalysis || {},
      alerts: this.performanceAlerts.slice(-10), // Last 10 alerts
      historical: {
        dataPoints: stats.length,
        timeRange: stats.length > 0 ? {
          start: new Date(Math.min(...stats.map(s => s.timestamp))),
          end: new Date(Math.max(...stats.map(s => s.timestamp)))
        } : null
      },
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Response time recommendations
    if (this.metrics.performance.responseTime > 500) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Consider optimizing slow queries or adding indexes',
        action: 'Review slow query log and index usage'
      });
    }
    
    // Connection pool recommendations
    if (this.metrics.connections.poolUtilization > 70) {
      recommendations.push({
        type: 'connections',
        priority: 'medium',
        message: 'Connection pool utilization is high',
        action: 'Consider increasing max connections or optimizing queries'
      });
    }
    
    // Index recommendations
    if (this.metrics.indexes.efficiency < 80) {
      recommendations.push({
        type: 'indexes',
        priority: 'medium',
        message: 'Index efficiency could be improved',
        action: 'Review and optimize database indexes'
      });
    }
    
    return recommendations;
  }

  /**
   * Get real-time metrics
   */
  getRealtimeMetrics() {
    return {
      current: this.metrics,
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  /**
   * Record query execution
   */
  recordQuery(operation, executionTime, success = true) {
    this.metrics.queries.total++;
    
    if (success) {
      this.metrics.queries.successful++;
    } else {
      this.metrics.queries.failed++;
    }
    
    // Update average time
    const currentAvg = this.metrics.queries.averageTime;
    const totalQueries = this.metrics.queries.total;
    this.metrics.queries.averageTime = 
      ((currentAvg * (totalQueries - 1)) + executionTime) / totalQueries;
    
    // Track slow queries
    if (executionTime > 1000) {
      this.metrics.queries.slowQueries.push({
        operation,
        executionTime,
        timestamp: new Date()
      });
      
      // Keep only last 20 slow queries
      if (this.metrics.queries.slowQueries.length > 20) {
        this.metrics.queries.slowQueries.shift();
      }
    }
    
    // Record in indexing service
    databaseIndexing.recordQuery('database', operation, executionTime);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('📊 Database performance monitoring stopped');
  }
}

module.exports = new DatabasePerformanceMonitor();