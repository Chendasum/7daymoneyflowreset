/**
 * Admin Performance Dashboard Commands
 * Real-time performance monitoring and optimization controls
 */

const performanceMonitor = require('../services/performance-monitor');
const responseCache = require('../services/response-cache');
const databaseOptimizer = require('../services/database-optimizer');

// Admin IDs
const ADMIN_IDS = [176039, 484389665];

/**
 * Check if user is admin
 */
function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}

/**
 * Admin Performance Dashboard
 */
async function showPerformanceDashboard(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "❌ Admin access required");
    return;
  }

  const performanceStats = performanceMonitor.getSummary();
  const cacheStats = responseCache.getStats();
  const dbStats = databaseOptimizer.getOptimizationStatus();
  const healthStatus = performanceMonitor.getHealthStatus();

  const dashboard = `🚀 **Performance Dashboard**

📊 **Response Times:**
• Average: ${performanceStats.performance.avgResponseTime}ms
• Recent (5min): ${performanceStats.performance.recentAvgResponseTime}ms
• Slow responses: ${performanceStats.performance.slowResponses}
• Database avg: ${performanceStats.performance.avgDatabaseTime}ms

🗄️ **Cache Performance:**
• Hit rate: ${cacheStats.hitRate.toFixed(1)}%
• Cache size: ${cacheStats.size} entries
• Memory usage: ${Math.round(cacheStats.memoryUsage / 1024)}KB
• Hits: ${cacheStats.hits} / Misses: ${cacheStats.misses}

🔍 **Database Optimization:**
• Indexes: ${Object.keys(dbStats.indexes).length} active
• Query cache: ${dbStats.cacheSize} entries
• Cache hit rate: ${dbStats.cacheHitRate.toFixed(1)}%

💻 **System Health:**
• Status: ${healthStatus.healthy ? '✅ Healthy' : '⚠️ Issues'}
• Score: ${healthStatus.score}/100
• Uptime: ${Math.round(performanceStats.uptime / 1000 / 60)}min

📈 **Commands:**
• Total processed: ${performanceStats.commands.total}
• Error rate: ${(performanceStats.errors.total / performanceStats.commands.total * 100).toFixed(1)}%

**Commands:**
/admin_performance_details - Detailed metrics
/admin_clear_cache - Clear all caches
/admin_optimize_db - Run database optimization
/admin_performance_test - Run performance test`;

  await bot.sendMessage(msg.chat.id, dashboard, { parse_mode: 'Markdown' });
}

/**
 * Detailed Performance Metrics
 */
async function showDetailedMetrics(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "❌ Admin access required");
    return;
  }

  const detailed = performanceMonitor.getDetailedMetrics();
  const responseDistribution = detailed.responseTimeDistribution;
  const topCommands = detailed.summary.commands.mostUsed.slice(0, 5);
  const recentErrors = detailed.summary.errors.recent.slice(0, 5);

  const metrics = `📊 **Detailed Performance Metrics**

⏱️ **Response Time Distribution:**
• Under 100ms: ${responseDistribution['Under 100ms']}
• 100-300ms: ${responseDistribution['100-300ms']}
• 300-500ms: ${responseDistribution['300-500ms']}
• 500ms-1s: ${responseDistribution['500ms-1s']}
• Over 1s: ${responseDistribution['Over 1s']}

🔝 **Most Used Commands:**
${topCommands.map(cmd => `• ${cmd.command}: ${cmd.count}`).join('\n')}

🚨 **Recent Errors:**
${recentErrors.length > 0 ? recentErrors.map(err => `• ${err.error}: ${err.count}`).join('\n') : '• None'}

🐌 **Slow Queries (Last 5):**
${detailed.slowQueries.slice(-5).map(q => `• ${q.operation}: ${q.duration}ms`).join('\n')}

💾 **Memory Trend:**
• Current: ${detailed.summary.memory?.current?.heapUsed || 0}MB
• Peak: ${detailed.summary.memory?.peak?.heapUsed || 0}MB
• Warning: ${detailed.summary.memory?.warning ? 'YES' : 'NO'}`;

  await bot.sendMessage(msg.chat.id, metrics, { parse_mode: 'Markdown' });
}

/**
 * Clear All Caches
 */
async function clearAllCaches(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "❌ Admin access required");
    return;
  }

  try {
    // Clear response cache
    responseCache.clear();
    
    // Clear database cache
    databaseOptimizer.invalidateCache('active_users');
    databaseOptimizer.invalidateCache('user_stats');
    
    await bot.sendMessage(msg.chat.id, "✅ All caches cleared successfully");
  } catch (error) {
    await bot.sendMessage(msg.chat.id, `❌ Error clearing caches: ${error.message}`);
  }
}

/**
 * Run Database Optimization
 */
async function runDatabaseOptimization(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "❌ Admin access required");
    return;
  }

  try {
    await bot.sendMessage(msg.chat.id, "🔄 Running database optimization...");
    
    await databaseOptimizer.initialize();
    await databaseOptimizer.preloadCriticalData();
    
    await bot.sendMessage(msg.chat.id, "✅ Database optimization completed");
  } catch (error) {
    await bot.sendMessage(msg.chat.id, `❌ Database optimization failed: ${error.message}`);
  }
}

/**
 * Run Performance Test
 */
async function runPerformanceTest(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "❌ Admin access required");
    return;
  }

  await bot.sendMessage(msg.chat.id, "🔄 Running performance test...");
  
  const testResults = {
    responseTime: [],
    dbQueries: [],
    cacheHits: 0,
    cacheMisses: 0
  };

  try {
    // Test response times
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await bot.sendChatAction(msg.chat.id, 'typing');
      const duration = Date.now() - start;
      testResults.responseTime.push(duration);
    }

    // Test database queries
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await databaseOptimizer.findUserByTelegramId(msg.from.id);
      const duration = Date.now() - start;
      testResults.dbQueries.push(duration);
    }

    // Test cache performance
    for (let i = 0; i < 20; i++) {
      const cacheKey = `test_${i}`;
      const cached = responseCache.get(cacheKey);
      if (cached) {
        testResults.cacheHits++;
      } else {
        testResults.cacheMisses++;
        responseCache.set(cacheKey, `test_data_${i}`);
      }
    }

    const avgResponseTime = testResults.responseTime.reduce((a, b) => a + b, 0) / testResults.responseTime.length;
    const avgDbTime = testResults.dbQueries.reduce((a, b) => a + b, 0) / testResults.dbQueries.length;
    const cacheHitRate = testResults.cacheHits / (testResults.cacheHits + testResults.cacheMisses) * 100;

    const results = `🧪 **Performance Test Results**

⚡ **Response Time:**
• Average: ${Math.round(avgResponseTime)}ms
• Min: ${Math.min(...testResults.responseTime)}ms
• Max: ${Math.max(...testResults.responseTime)}ms
• Target: <1000ms ✅

🗄️ **Database Queries:**
• Average: ${Math.round(avgDbTime)}ms
• Min: ${Math.min(...testResults.dbQueries)}ms
• Max: ${Math.max(...testResults.dbQueries)}ms
• Target: <500ms ${avgDbTime < 500 ? '✅' : '❌'}

💾 **Cache Performance:**
• Hit rate: ${cacheHitRate.toFixed(1)}%
• Target: >80% ${cacheHitRate > 80 ? '✅' : '❌'}

🎯 **Overall Performance:**
${avgResponseTime < 1000 && avgDbTime < 500 && cacheHitRate > 80 ? '✅ Excellent' : '⚠️ Needs optimization'}`;

    await bot.sendMessage(msg.chat.id, results, { parse_mode: 'Markdown' });
  } catch (error) {
    await bot.sendMessage(msg.chat.id, `❌ Performance test failed: ${error.message}`);
  }
}

/**
 * Performance Monitoring Toggle
 */
async function togglePerformanceMonitoring(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "❌ Admin access required");
    return;
  }

  try {
    // Reset performance metrics
    performanceMonitor.reset();
    
    // Restart periodic monitoring
    performanceMonitor.startPeriodicMonitoring();
    
    await bot.sendMessage(msg.chat.id, "🔄 Performance monitoring restarted");
  } catch (error) {
    await bot.sendMessage(msg.chat.id, `❌ Error restarting monitoring: ${error.message}`);
  }
}

/**
 * Real-time Performance Status
 */
async function showRealtimeStatus(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "❌ Admin access required");
    return;
  }

  const status = performanceMonitor.getHealthStatus();
  const memory = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  const realtimeStatus = `🔴 **Real-time Status**

⚡ **Current Performance:**
• Health Score: ${status.score}/100
• Status: ${status.healthy ? '✅ Healthy' : '❌ Issues'}
• Issues: ${status.issues.length > 0 ? status.issues.join(', ') : 'None'}

💻 **System Resources:**
• Memory: ${Math.round(memory.heapUsed / 1024 / 1024)}MB / ${Math.round(memory.heapTotal / 1024 / 1024)}MB
• External: ${Math.round(memory.external / 1024 / 1024)}MB
• RSS: ${Math.round(memory.rss / 1024 / 1024)}MB

⏱️ **Response Times (Recent):**
• Target: <1000ms
• Current avg: ${performanceMonitor.getSummary().performance.recentAvgResponseTime}ms
• Status: ${performanceMonitor.getSummary().performance.recentAvgResponseTime < 1000 ? '✅' : '❌'}

🔄 **Auto-refresh in 30s**
Use /admin_performance_status again for update`;

  await bot.sendMessage(msg.chat.id, realtimeStatus, { parse_mode: 'Markdown' });
}

module.exports = {
  showPerformanceDashboard,
  showDetailedMetrics,
  clearAllCaches,
  runDatabaseOptimization,
  runPerformanceTest,
  togglePerformanceMonitoring,
  showRealtimeStatus
};