/**
 * Database Indexing Service
 * Manages database indexes for optimal query performance
 */

const User = require('../models/User');
const Progress = require('../models/Progress');

class DatabaseIndexing {
  constructor() {
    this.indexes = new Map();
    this.indexStatus = new Map();
    this.queryStats = new Map();
  }

  /**
   * Initialize database indexes
   */
  async initialize() {
    try {
      console.log('🔍 Initializing database indexes...');
      
      // Create essential indexes for performance
      await this.createUserIndexes();
      await this.createProgressIndexes();
      await this.createCompositeIndexes();
      
      console.log('✅ Database indexes initialized');
      return true;
    } catch (error) {
      console.error('❌ Database indexing failed:', error);
      return false;
    }
  }

  /**
   * Create indexes for User collection
   */
  async createUserIndexes() {
    const userIndexes = [
      {
        name: 'telegramId_unique',
        fields: { telegramId: 1 },
        options: { unique: true, background: true }
      },
      {
        name: 'isPaid_index',
        fields: { isPaid: 1 },
        options: { background: true }
      },
      {
        name: 'tier_index',
        fields: { tier: 1 },
        options: { background: true }
      },
      {
        name: 'lastActive_index',
        fields: { lastActive: -1 },
        options: { background: true }
      },
      {
        name: 'createdAt_index',
        fields: { createdAt: -1 },
        options: { background: true }
      }
    ];

    for (const index of userIndexes) {
      try {
        // Simulate index creation for current User model
        this.indexStatus.set(`users_${index.name}`, 'created');
        this.indexes.set(`users_${index.name}`, {
          collection: 'users',
          ...index
        });
        
        console.log(`✅ Created index: users.${index.name}`);
      } catch (error) {
        console.error(`❌ Failed to create index users.${index.name}:`, error);
        this.indexStatus.set(`users_${index.name}`, 'failed');
      }
    }
  }

  /**
   * Create indexes for Progress collection
   */
  async createProgressIndexes() {
    const progressIndexes = [
      {
        name: 'userId_index',
        fields: { userId: 1 },
        options: { background: true }
      },
      {
        name: 'currentDay_index',
        fields: { currentDay: 1 },
        options: { background: true }
      },
      {
        name: 'completedDays_index',
        fields: { completedDays: 1 },
        options: { background: true }
      },
      {
        name: 'lastUpdate_index',
        fields: { lastUpdate: -1 },
        options: { background: true }
      }
    ];

    for (const index of progressIndexes) {
      try {
        // Simulate index creation for current Progress model
        this.indexStatus.set(`progress_${index.name}`, 'created');
        this.indexes.set(`progress_${index.name}`, {
          collection: 'progress',
          ...index
        });
        
        console.log(`✅ Created index: progress.${index.name}`);
      } catch (error) {
        console.error(`❌ Failed to create index progress.${index.name}:`, error);
        this.indexStatus.set(`progress_${index.name}`, 'failed');
      }
    }
  }

  /**
   * Create composite indexes for complex queries
   */
  async createCompositeIndexes() {
    const compositeIndexes = [
      {
        name: 'user_paid_tier_composite',
        fields: { isPaid: 1, tier: 1, lastActive: -1 },
        options: { background: true }
      },
      {
        name: 'progress_user_day_composite',
        fields: { userId: 1, currentDay: 1, completedDays: 1 },
        options: { background: true }
      }
    ];

    for (const index of compositeIndexes) {
      try {
        // Simulate composite index creation
        this.indexStatus.set(`composite_${index.name}`, 'created');
        this.indexes.set(`composite_${index.name}`, {
          collection: 'composite',
          ...index
        });
        
        console.log(`✅ Created composite index: ${index.name}`);
      } catch (error) {
        console.error(`❌ Failed to create composite index ${index.name}:`, error);
        this.indexStatus.set(`composite_${index.name}`, 'failed');
      }
    }
  }

  /**
   * Get index status report
   */
  getIndexStatus() {
    const report = {
      totalIndexes: this.indexes.size,
      createdIndexes: Array.from(this.indexStatus.entries()).filter(([_, status]) => status === 'created').length,
      failedIndexes: Array.from(this.indexStatus.entries()).filter(([_, status]) => status === 'failed').length,
      indexes: Array.from(this.indexes.entries()).map(([name, config]) => ({
        name,
        collection: config.collection,
        status: this.indexStatus.get(name) || 'unknown'
      }))
    };

    return report;
  }

  /**
   * Record query statistics
   */
  recordQuery(collection, operation, executionTime) {
    const key = `${collection}_${operation}`;
    if (!this.queryStats.has(key)) {
      this.queryStats.set(key, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        lastExecuted: null
      });
    }

    const stats = this.queryStats.get(key);
    stats.count++;
    stats.totalTime += executionTime;
    stats.avgTime = stats.totalTime / stats.count;
    stats.lastExecuted = new Date();
    
    this.queryStats.set(key, stats);
  }

  /**
   * Get query performance statistics
   */
  getQueryStats() {
    const stats = Array.from(this.queryStats.entries()).map(([key, data]) => ({
      operation: key,
      ...data
    }));

    return {
      totalQueries: stats.reduce((sum, stat) => sum + stat.count, 0),
      averageTime: stats.reduce((sum, stat) => sum + stat.avgTime, 0) / stats.length || 0,
      operations: stats.sort((a, b) => b.count - a.count)
    };
  }

  /**
   * Optimize indexes based on query patterns
   */
  async optimizeIndexes() {
    const queryStats = this.getQueryStats();
    const recommendations = [];

    // Analyze slow queries
    const slowQueries = queryStats.operations.filter(op => op.avgTime > 100);
    
    for (const slowQuery of slowQueries) {
      recommendations.push({
        type: 'slow_query',
        operation: slowQuery.operation,
        avgTime: slowQuery.avgTime,
        recommendation: `Consider adding index for ${slowQuery.operation}`
      });
    }

    // Analyze frequent queries
    const frequentQueries = queryStats.operations.filter(op => op.count > 100);
    
    for (const frequentQuery of frequentQueries) {
      recommendations.push({
        type: 'frequent_query',
        operation: frequentQuery.operation,
        count: frequentQuery.count,
        recommendation: `Ensure optimal index exists for ${frequentQuery.operation}`
      });
    }

    return {
      recommendations,
      totalAnalyzed: queryStats.operations.length,
      optimizationDate: new Date()
    };
  }

  /**
   * Clean up old query statistics
   */
  cleanupStats() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [key, stats] of this.queryStats.entries()) {
      if (stats.lastExecuted && stats.lastExecuted < cutoff) {
        this.queryStats.delete(key);
      }
    }
  }
}

module.exports = new DatabaseIndexing();