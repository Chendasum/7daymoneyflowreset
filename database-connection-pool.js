/**
 * Database Connection Pool Service
 * Manages database connections for optimal performance and resource utilization
 */

class DatabaseConnectionPool {
  constructor() {
    this.connections = new Map();
    this.connectionStats = {
      active: 0,
      idle: 0,
      total: 0,
      maxConnections: 20,
      minConnections: 5,
      connectionTimeout: 30000,
      idleTimeout: 300000 // 5 minutes
    };
    this.connectionQueue = [];
    this.poolMetrics = {
      connectionsCreated: 0,
      connectionsDestroyed: 0,
      connectionsReused: 0,
      averageConnectionTime: 0,
      peakConnections: 0
    };
  }

  /**
   * Initialize connection pool
   */
  async initialize() {
    try {
      console.log('🔗 Initializing database connection pool...');
      
      // Create initial connections
      await this.createInitialConnections();
      
      // Start connection monitoring
      this.startConnectionMonitoring();
      
      console.log(`✅ Connection pool initialized with ${this.connectionStats.total} connections`);
      return true;
    } catch (error) {
      console.error('❌ Connection pool initialization failed:', error);
      return false;
    }
  }

  /**
   * Create initial database connections
   */
  async createInitialConnections() {
    const connectionsToCreate = Math.min(this.connectionStats.minConnections, this.connectionStats.maxConnections);
    
    for (let i = 0; i < connectionsToCreate; i++) {
      try {
        const connection = await this.createConnection();
        this.connections.set(`conn_${i}`, {
          id: `conn_${i}`,
          connection: connection,
          status: 'idle',
          createdAt: new Date(),
          lastUsed: new Date(),
          queryCount: 0
        });
        
        this.connectionStats.idle++;
        this.connectionStats.total++;
        this.poolMetrics.connectionsCreated++;
      } catch (error) {
        console.error(`❌ Failed to create connection ${i}:`, error);
      }
    }
  }

  /**
   * Create a new database connection
   */
  async createConnection() {
    // Simulate connection creation for current setup
    return {
      id: `conn_${Date.now()}`,
      connected: true,
      lastActivity: new Date(),
      queries: 0
    };
  }

  /**
   * Get connection from pool
   */
  async getConnection() {
    const startTime = Date.now();
    
    try {
      // Find available idle connection
      const availableConnection = this.findIdleConnection();
      
      if (availableConnection) {
        availableConnection.status = 'active';
        availableConnection.lastUsed = new Date();
        this.connectionStats.idle--;
        this.connectionStats.active++;
        this.poolMetrics.connectionsReused++;
        
        return availableConnection;
      }

      // Create new connection if under limit
      if (this.connectionStats.total < this.connectionStats.maxConnections) {
        const newConnection = await this.createNewPoolConnection();
        this.updatePeakConnections();
        return newConnection;
      }

      // Wait for available connection
      return await this.waitForConnection();
      
    } catch (error) {
      console.error('❌ Failed to get connection:', error);
      throw error;
    } finally {
      const connectionTime = Date.now() - startTime;
      this.updateAverageConnectionTime(connectionTime);
    }
  }

  /**
   * Find idle connection in pool
   */
  findIdleConnection() {
    for (const [id, conn] of this.connections.entries()) {
      if (conn.status === 'idle') {
        return conn;
      }
    }
    return null;
  }

  /**
   * Create new connection for pool
   */
  async createNewPoolConnection() {
    const connectionId = `conn_${Date.now()}`;
    const connection = await this.createConnection();
    
    const poolConnection = {
      id: connectionId,
      connection: connection,
      status: 'active',
      createdAt: new Date(),
      lastUsed: new Date(),
      queryCount: 0
    };
    
    this.connections.set(connectionId, poolConnection);
    this.connectionStats.active++;
    this.connectionStats.total++;
    this.poolMetrics.connectionsCreated++;
    
    return poolConnection;
  }

  /**
   * Wait for available connection
   */
  async waitForConnection() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.connectionStats.connectionTimeout);

      this.connectionQueue.push({
        resolve,
        reject,
        timeout,
        requestedAt: new Date()
      });
    });
  }

  /**
   * Release connection back to pool
   */
  releaseConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    
    if (connection && connection.status === 'active') {
      connection.status = 'idle';
      connection.lastUsed = new Date();
      this.connectionStats.active--;
      this.connectionStats.idle++;
      
      // Process queued requests
      this.processConnectionQueue();
    }
  }

  /**
   * Process queued connection requests
   */
  processConnectionQueue() {
    if (this.connectionQueue.length > 0) {
      const request = this.connectionQueue.shift();
      
      try {
        const connection = this.findIdleConnection();
        if (connection) {
          connection.status = 'active';
          connection.lastUsed = new Date();
          this.connectionStats.idle--;
          this.connectionStats.active++;
          
          clearTimeout(request.timeout);
          request.resolve(connection);
        }
      } catch (error) {
        clearTimeout(request.timeout);
        request.reject(error);
      }
    }
  }

  /**
   * Start connection monitoring
   */
  startConnectionMonitoring() {
    // Monitor idle connections
    setInterval(() => {
      this.cleanupIdleConnections();
    }, 60000); // Check every minute

    // Monitor pool health
    setInterval(() => {
      this.monitorPoolHealth();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Clean up idle connections
   */
  cleanupIdleConnections() {
    const cutoff = new Date(Date.now() - this.connectionStats.idleTimeout);
    
    for (const [id, conn] of this.connections.entries()) {
      if (conn.status === 'idle' && conn.lastUsed < cutoff) {
        if (this.connectionStats.total > this.connectionStats.minConnections) {
          this.destroyConnection(id);
        }
      }
    }
  }

  /**
   * Destroy connection
   */
  destroyConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    
    if (connection) {
      // Close connection
      if (connection.connection && connection.connection.close) {
        connection.connection.close();
      }
      
      this.connections.delete(connectionId);
      
      if (connection.status === 'active') {
        this.connectionStats.active--;
      } else {
        this.connectionStats.idle--;
      }
      
      this.connectionStats.total--;
      this.poolMetrics.connectionsDestroyed++;
    }
  }

  /**
   * Monitor pool health
   */
  monitorPoolHealth() {
    const healthMetrics = {
      activeConnections: this.connectionStats.active,
      idleConnections: this.connectionStats.idle,
      totalConnections: this.connectionStats.total,
      queueLength: this.connectionQueue.length,
      utilizationRate: (this.connectionStats.active / this.connectionStats.total) * 100
    };

    // Log warnings for high utilization
    if (healthMetrics.utilizationRate > 80) {
      console.warn('⚠️ High connection pool utilization:', healthMetrics.utilizationRate + '%');
    }

    // Log warnings for large queue
    if (healthMetrics.queueLength > 10) {
      console.warn('⚠️ Large connection queue:', healthMetrics.queueLength);
    }
  }

  /**
   * Update average connection time
   */
  updateAverageConnectionTime(connectionTime) {
    const currentAvg = this.poolMetrics.averageConnectionTime;
    const totalConnections = this.poolMetrics.connectionsCreated + this.poolMetrics.connectionsReused;
    
    this.poolMetrics.averageConnectionTime = 
      ((currentAvg * (totalConnections - 1)) + connectionTime) / totalConnections;
  }

  /**
   * Update peak connections
   */
  updatePeakConnections() {
    if (this.connectionStats.total > this.poolMetrics.peakConnections) {
      this.poolMetrics.peakConnections = this.connectionStats.total;
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats() {
    return {
      connections: { ...this.connectionStats },
      metrics: { ...this.poolMetrics },
      health: {
        utilizationRate: (this.connectionStats.active / this.connectionStats.total) * 100,
        queueLength: this.connectionQueue.length,
        averageConnectionTime: this.poolMetrics.averageConnectionTime,
        efficiency: (this.poolMetrics.connectionsReused / 
                    (this.poolMetrics.connectionsCreated + this.poolMetrics.connectionsReused)) * 100
      }
    };
  }

  /**
   * Close all connections
   */
  async closeAll() {
    console.log('🔒 Closing all database connections...');
    
    for (const [id, conn] of this.connections.entries()) {
      await this.destroyConnection(id);
    }
    
    this.connections.clear();
    this.connectionStats.active = 0;
    this.connectionStats.idle = 0;
    this.connectionStats.total = 0;
    
    console.log('✅ All connections closed');
  }
}

module.exports = new DatabaseConnectionPool();