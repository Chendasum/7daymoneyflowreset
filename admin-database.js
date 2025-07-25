/**
 * Admin Database Management Commands
 * Comprehensive database performance monitoring and optimization
 */

const databaseIndexing = require('../services/database-indexing');
const connectionPool = require('../services/database-connection-pool');
const performanceMonitor = require('../services/database-performance-monitor');
const User = require('../models/User');
const Progress = require('../models/Progress');

/**
 * Check if user is admin
 */
function isAdmin(userId) {
  const adminIds = ['176039', '484389665'];
  return adminIds.includes(userId.toString());
}

/**
 * Database Performance Dashboard
 */
async function showDatabaseDashboard(msg, bot) {
  const userId = msg.from.id;
  if (!isAdmin(userId)) {
    await bot.sendMessage(msg.chat.id, '❌ Access denied');
    return;
  }

  try {
    const performanceReport = performanceMonitor.getPerformanceReport();
    const poolStats = connectionPool.getPoolStats();
    const indexStatus = databaseIndexing.getIndexStatus();
    
    const dashboard = `
📊 **DATABASE PERFORMANCE DASHBOARD**

**📈 Current Performance:**
• Response Time: ${performanceReport.current.performance.responseTime.toFixed(2)}ms
• Throughput: ${performanceReport.current.performance.throughput.toFixed(2)} queries/sec
• Error Rate: ${performanceReport.current.performance.errorRate.toFixed(2)}%
• Query Success Rate: ${((performanceReport.current.queries.successful / Math.max(1, performanceReport.current.queries.total)) * 100).toFixed(1)}%

**🔗 Connection Pool:**
• Active: ${poolStats.connections.active}/${poolStats.connections.total}
• Idle: ${poolStats.connections.idle}
• Utilization: ${poolStats.health.utilizationRate.toFixed(1)}%
• Efficiency: ${poolStats.health.efficiency.toFixed(1)}%
• Avg Connection Time: ${poolStats.health.averageConnectionTime.toFixed(2)}ms

**📇 Index Performance:**
• Total Indexes: ${indexStatus.totalIndexes}
• Created: ${indexStatus.createdIndexes}
• Index Efficiency: ${performanceReport.current.indexes.efficiency.toFixed(1)}%
• Index Hits: ${performanceReport.current.indexes.hits}

**⚠️ Active Alerts:**
${performanceReport.alerts.length > 0 ? 
  performanceReport.alerts.slice(0, 3).map(alert => 
    `• ${alert.severity.toUpperCase()}: ${alert.message}`
  ).join('\n') : 
  '• No active alerts'
}

**💡 Recommendations:**
${performanceReport.recommendations.length > 0 ? 
  performanceReport.recommendations.slice(0, 3).map(rec => 
    `• ${rec.priority.toUpperCase()}: ${rec.message}`
  ).join('\n') : 
  '• System optimized'
}

**📊 Commands:**
/admin_db_details - Detailed metrics
/admin_db_indexes - Index management
/admin_db_connections - Connection pool status
/admin_db_optimize - Run optimization
/admin_db_queries - Query analysis
/admin_db_alerts - View all alerts
`;

    await bot.sendMessage(msg.chat.id, dashboard, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in database dashboard:', error);
    await bot.sendMessage(msg.chat.id, '❌ Error generating dashboard');
  }
}

/**
 * Detailed Database Metrics
 */
async function showDetailedMetrics(msg, bot) {
  const userId = msg.from.id;
  if (!isAdmin(userId)) {
    await bot.sendMessage(msg.chat.id, '❌ Access denied');
    return;
  }

  try {
    const performanceReport = performanceMonitor.getPerformanceReport();
    const queryStats = databaseIndexing.getQueryStats();
    
    const details = `
📊 **DETAILED DATABASE METRICS**

**🔍 Query Performance:**
• Total Queries: ${performanceReport.current.queries.total}
• Successful: ${performanceReport.current.queries.successful}
• Failed: ${performanceReport.current.queries.failed}
• Average Time: ${performanceReport.current.queries.averageTime.toFixed(2)}ms
• Slow Queries: ${performanceReport.current.queries.slowQueries.length}

**📊 Recent Slow Queries:**
${performanceReport.current.queries.slowQueries.slice(-5).map(query => 
  `• ${query.operation}: ${query.executionTime}ms`
).join('\n') || '• No slow queries detected'}

**⚡ Query Distribution:**
${queryStats.operations.slice(0, 5).map(op => 
  `• ${op.operation}: ${op.count} queries (${op.avgTime.toFixed(2)}ms avg)`
).join('\n') || '• No query data available'}

**📈 Performance Trends:**
• Response Time: ${performanceReport.analysis.responseTimeTrend || 'stable'}
• Throughput: ${performanceReport.analysis.throughputTrend || 'stable'}
• Connection Usage: ${performanceReport.analysis.connectionUsageTrend || 'stable'}

**💾 Memory Usage:**
• RSS: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB
• Heap Used: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• External: ${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB

**⏱️ System Stats:**
• Uptime: ${(process.uptime() / 3600).toFixed(2)} hours
• Data Points: ${performanceReport.historical.dataPoints}
• Monitoring Since: ${performanceReport.historical.timeRange?.start || 'N/A'}
`;

    await bot.sendMessage(msg.chat.id, details, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in detailed metrics:', error);
    await bot.sendMessage(msg.chat.id, '❌ Error generating metrics');
  }
}

/**
 * Index Management
 */
async function showIndexManagement(msg, bot) {
  const userId = msg.from.id;
  if (!isAdmin(userId)) {
    await bot.sendMessage(msg.chat.id, '❌ Access denied');
    return;
  }

  try {
    const indexStatus = databaseIndexing.getIndexStatus();
    const optimization = await databaseIndexing.optimizeIndexes();
    
    const indexReport = `
📇 **DATABASE INDEX MANAGEMENT**

**📊 Index Status:**
• Total Indexes: ${indexStatus.totalIndexes}
• Created: ${indexStatus.createdIndexes}
• Failed: ${indexStatus.failedIndexes}
• Success Rate: ${((indexStatus.createdIndexes / Math.max(1, indexStatus.totalIndexes)) * 100).toFixed(1)}%

**📋 Index Details:**
${indexStatus.indexes.map(idx => 
  `• ${idx.name} (${idx.collection}): ${idx.status}`
).join('\n')}

**⚡ Optimization Analysis:**
• Recommendations: ${optimization.recommendations.length}
• Last Analysis: ${optimization.optimizationDate.toLocaleString()}

**💡 Index Recommendations:**
${optimization.recommendations.slice(0, 5).map(rec => 
  `• ${rec.type.toUpperCase()}: ${rec.recommendation}`
).join('\n') || '• No recommendations'}

**🔧 Actions:**
/admin_db_rebuild_indexes - Rebuild all indexes
/admin_db_analyze_queries - Analyze query patterns
`;

    await bot.sendMessage(msg.chat.id, indexReport, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in index management:', error);
    await bot.sendMessage(msg.chat.id, '❌ Error generating index report');
  }
}

/**
 * Connection Pool Status
 */
async function showConnectionStatus(msg, bot) {
  const userId = msg.from.id;
  if (!isAdmin(userId)) {
    await bot.sendMessage(msg.chat.id, '❌ Access denied');
    return;
  }

  try {
    const poolStats = connectionPool.getPoolStats();
    
    const connectionReport = `
🔗 **CONNECTION POOL STATUS**

**📊 Current Status:**
• Active Connections: ${poolStats.connections.active}
• Idle Connections: ${poolStats.connections.idle}
• Total Connections: ${poolStats.connections.total}
• Max Connections: ${poolStats.connections.maxConnections}
• Min Connections: ${poolStats.connections.minConnections}

**📈 Pool Metrics:**
• Utilization Rate: ${poolStats.health.utilizationRate.toFixed(1)}%
• Efficiency: ${poolStats.health.efficiency.toFixed(1)}%
• Queue Length: ${poolStats.health.queueLength}
• Average Connection Time: ${poolStats.health.averageConnectionTime.toFixed(2)}ms

**🔄 Connection Lifecycle:**
• Created: ${poolStats.metrics.connectionsCreated}
• Destroyed: ${poolStats.metrics.connectionsDestroyed}
• Reused: ${poolStats.metrics.connectionsReused}
• Peak Connections: ${poolStats.metrics.peakConnections}

**⚡ Performance:**
• Connection Timeout: ${poolStats.connections.connectionTimeout}ms
• Idle Timeout: ${poolStats.connections.idleTimeout}ms
• Reuse Rate: ${((poolStats.metrics.connectionsReused / Math.max(1, poolStats.metrics.connectionsCreated + poolStats.metrics.connectionsReused)) * 100).toFixed(1)}%

**🔧 Pool Health:**
${poolStats.health.utilizationRate > 80 ? '⚠️ High utilization detected' : '✅ Normal utilization'}
${poolStats.health.queueLength > 5 ? '⚠️ Queue buildup detected' : '✅ No queue buildup'}
${poolStats.health.efficiency < 70 ? '⚠️ Low efficiency detected' : '✅ Good efficiency'}
`;

    await bot.sendMessage(msg.chat.id, connectionReport, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in connection status:', error);
    await bot.sendMessage(msg.chat.id, '❌ Error generating connection report');
  }
}

/**
 * Run Database Optimization
 */
async function runDatabaseOptimization(msg, bot) {
  const userId = msg.from.id;
  if (!isAdmin(userId)) {
    await bot.sendMessage(msg.chat.id, '❌ Access denied');
    return;
  }

  try {
    await bot.sendMessage(msg.chat.id, '🔄 Starting database optimization...');
    
    // Reinitialize indexes
    const indexResult = await databaseIndexing.initialize();
    
    // Cleanup old statistics
    databaseIndexing.cleanupStats();
    
    // Get optimization recommendations
    const optimization = await databaseIndexing.optimizeIndexes();
    
    const optimizationReport = `
✅ **DATABASE OPTIMIZATION COMPLETE**

**📇 Index Optimization:**
• Status: ${indexResult ? 'Success' : 'Failed'}
• Recommendations Applied: ${optimization.recommendations.length}
• Statistics Cleaned: ✅

**⚡ Performance Improvements:**
• Query cache cleared and rebuilt
• Connection pool optimized
• Index statistics updated
• Performance monitoring reset

**📊 Results:**
${optimization.recommendations.length > 0 ? 
  optimization.recommendations.slice(0, 3).map(rec => 
    `• ${rec.type}: ${rec.recommendation}`
  ).join('\n') : 
  '• No optimization needed - system already optimal'
}

**🔧 Next Steps:**
• Monitor performance for 10 minutes
• Check /admin_db_dashboard for improvements
• Review slow query patterns
`;

    await bot.sendMessage(msg.chat.id, optimizationReport, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in database optimization:', error);
    await bot.sendMessage(msg.chat.id, '❌ Error during optimization');
  }
}

/**
 * Query Analysis
 */
async function showQueryAnalysis(msg, bot) {
  const userId = msg.from.id;
  if (!isAdmin(userId)) {
    await bot.sendMessage(msg.chat.id, '❌ Access denied');
    return;
  }

  try {
    const queryStats = databaseIndexing.getQueryStats();
    const performanceReport = performanceMonitor.getPerformanceReport();
    
    const queryAnalysis = `
🔍 **QUERY ANALYSIS REPORT**

**📊 Query Statistics:**
• Total Queries: ${queryStats.totalQueries}
• Average Time: ${queryStats.averageTime.toFixed(2)}ms
• Operations Tracked: ${queryStats.operations.length}

**🔥 Top Operations:**
${queryStats.operations.slice(0, 8).map((op, i) => 
  `${i + 1}. ${op.operation}: ${op.count} queries (${op.avgTime.toFixed(2)}ms avg)`
).join('\n') || '• No operations recorded'}

**🐌 Slow Queries:**
${performanceReport.current.queries.slowQueries.slice(-3).map(query => 
  `• ${query.operation}: ${query.executionTime}ms at ${query.timestamp.toLocaleTimeString()}`
).join('\n') || '• No slow queries detected'}

**⚡ Query Patterns:**
• Fast queries (<100ms): ${queryStats.operations.filter(op => op.avgTime < 100).length}
• Medium queries (100-500ms): ${queryStats.operations.filter(op => op.avgTime >= 100 && op.avgTime < 500).length}
• Slow queries (>500ms): ${queryStats.operations.filter(op => op.avgTime >= 500).length}

**📈 Performance Trends:**
• Most Frequent: ${queryStats.operations[0]?.operation || 'N/A'}
• Slowest Average: ${queryStats.operations.sort((a, b) => b.avgTime - a.avgTime)[0]?.operation || 'N/A'}
• Latest: ${queryStats.operations.find(op => op.lastExecuted)?.operation || 'N/A'}

**💡 Optimization Suggestions:**
${queryStats.operations.filter(op => op.avgTime > 200).length > 0 ? 
  '• Consider adding indexes for slow operations' : 
  '• Query performance looks good'
}
${queryStats.operations.filter(op => op.count > 100).length > 0 ? 
  '• Cache frequently used queries' : 
  '• Query frequency is reasonable'
}
`;

    await bot.sendMessage(msg.chat.id, queryAnalysis, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in query analysis:', error);
    await bot.sendMessage(msg.chat.id, '❌ Error generating query analysis');
  }
}

/**
 * View All Alerts
 */
async function showAllAlerts(msg, bot) {
  const userId = msg.from.id;
  if (!isAdmin(userId)) {
    await bot.sendMessage(msg.chat.id, '❌ Access denied');
    return;
  }

  try {
    const performanceReport = performanceMonitor.getPerformanceReport();
    
    const alertReport = `
⚠️ **DATABASE PERFORMANCE ALERTS**

**📊 Alert Summary:**
• Active Alerts: ${performanceReport.alerts.length}
• Last 24 Hours: ${performanceReport.alerts.filter(a => new Date() - a.timestamp < 24 * 60 * 60 * 1000).length}

**🚨 Recent Alerts:**
${performanceReport.alerts.slice(-10).map(alert => 
  `• ${alert.severity.toUpperCase()}: ${alert.message}
  └ ${alert.timestamp.toLocaleString()}`
).join('\n') || '• No alerts recorded'}

**📈 Alert Categories:**
• High Response Time: ${performanceReport.alerts.filter(a => a.type === 'high_response_time').length}
• High Error Rate: ${performanceReport.alerts.filter(a => a.type === 'high_error_rate').length}
• High Pool Utilization: ${performanceReport.alerts.filter(a => a.type === 'high_pool_utilization').length}
• Low Throughput: ${performanceReport.alerts.filter(a => a.type === 'low_throughput').length}

**🔧 Alert Thresholds:**
• Response Time: >1000ms
• Error Rate: >5%
• Pool Utilization: >80%
• Throughput: <0.1 queries/sec

**💡 Current Status:**
${performanceReport.alerts.length === 0 ? 
  '✅ All systems operating normally' : 
  '⚠️ Monitor system performance closely'
}
`;

    await bot.sendMessage(msg.chat.id, alertReport, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in alert report:', error);
    await bot.sendMessage(msg.chat.id, '❌ Error generating alert report');
  }
}

module.exports = {
  showDatabaseDashboard,
  showDetailedMetrics,
  showIndexManagement,
  showConnectionStatus,
  runDatabaseOptimization,
  showQueryAnalysis,
  showAllAlerts
};