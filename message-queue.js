/**
 * Message Queue Service for Bot Performance Optimization
 * Handles bulk operations and message batching for improved performance
 */

class MessageQueue {
  constructor(bot) {
    this.bot = bot;
    this.queues = new Map();
    this.processing = new Map();
    this.maxConcurrent = 5;
    this.batchSize = 10;
    this.delayBetweenMessages = 100; // ms
    this.stats = {
      processed: 0,
      failed: 0,
      queued: 0
    };
  }

  /**
   * Add message to queue
   */
  enqueue(queueName, message, priority = 'normal') {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }

    const queueItem = {
      ...message,
      priority,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3
    };

    const queue = this.queues.get(queueName);
    
    // Insert based on priority
    if (priority === 'high') {
      queue.unshift(queueItem);
    } else {
      queue.push(queueItem);
    }

    this.stats.queued++;
    this.processQueue(queueName);
  }

  /**
   * Process queue with concurrency control
   */
  async processQueue(queueName) {
    if (this.processing.get(queueName)) {
      return; // Already processing
    }

    this.processing.set(queueName, true);
    const queue = this.queues.get(queueName);

    try {
      while (queue && queue.length > 0) {
        const batch = queue.splice(0, this.batchSize);
        await this.processBatch(batch);
        
        // Small delay between batches
        if (queue.length > 0) {
          await this.delay(this.delayBetweenMessages);
        }
      }
    } catch (error) {
      console.error(`Queue processing error for ${queueName}:`, error);
    } finally {
      this.processing.set(queueName, false);
    }
  }

  /**
   * Process batch of messages concurrently
   */
  async processBatch(batch) {
    const promises = batch.map(item => this.processMessage(item));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.stats.processed++;
      } else {
        this.stats.failed++;
        const item = batch[index];
        if (item.retries < item.maxRetries) {
          item.retries++;
          // Re-queue failed message
          this.enqueue('retry', item, 'high');
        }
      }
    });
  }

  /**
   * Process individual message
   */
  async processMessage(item) {
    const { type, chatId, content, options = {} } = item;

    switch (type) {
      case 'text':
        return await this.bot.sendMessage(chatId, content, options);
      
      case 'photo':
        return await this.bot.sendPhoto(chatId, content, options);
      
      case 'document':
        return await this.bot.sendDocument(chatId, content, options);
      
      case 'typing':
        return await this.bot.sendChatAction(chatId, 'typing');
      
      case 'bulk_text':
        return await this.sendBulkMessages(item);
      
      case 'delayed_message':
        await this.delay(item.delay);
        return await this.bot.sendMessage(chatId, content, options);
      
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  }

  /**
   * Send bulk messages to multiple users
   */
  async sendBulkMessages(item) {
    const { userIds, content, options = {} } = item;
    const results = [];

    for (const userId of userIds) {
      try {
        const result = await this.bot.sendMessage(userId, content, options);
        results.push({ userId, success: true, result });
        
        // Rate limiting delay
        await this.delay(this.delayBetweenMessages);
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Add typing indicator before message
   */
  async sendWithTyping(chatId, content, options = {}) {
    this.enqueue('typing', {
      type: 'typing',
      chatId
    }, 'high');

    this.enqueue('message', {
      type: 'text',
      chatId,
      content,
      options
    }, 'high');
  }

  /**
   * Send delayed message
   */
  async sendDelayedMessage(chatId, content, delay, options = {}) {
    this.enqueue('delayed', {
      type: 'delayed_message',
      chatId,
      content,
      delay,
      options
    });
  }

  /**
   * Batch send to multiple users
   */
  async broadcastMessage(userIds, content, options = {}) {
    this.enqueue('broadcast', {
      type: 'bulk_text',
      userIds,
      content,
      options
    });
  }

  /**
   * Priority message (bypass queue)
   */
  async sendPriorityMessage(chatId, content, options = {}) {
    try {
      await this.bot.sendChatAction(chatId, 'typing');
      await this.delay(300); // Show typing for 300ms
      return await this.bot.sendMessage(chatId, content, options);
    } catch (error) {
      console.error('Priority message failed:', error);
      throw error;
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const queueSizes = {};
    for (const [name, queue] of this.queues.entries()) {
      queueSizes[name] = queue.length;
    }

    return {
      ...this.stats,
      queueSizes,
      processing: Array.from(this.processing.entries()).filter(([_, isProcessing]) => isProcessing).map(([name]) => name),
      totalQueued: Array.from(this.queues.values()).reduce((sum, queue) => sum + queue.length, 0)
    };
  }

  /**
   * Clear all queues
   */
  clearQueues() {
    this.queues.clear();
    this.processing.clear();
    this.stats = {
      processed: 0,
      failed: 0,
      queued: 0
    };
  }

  /**
   * Get queue health status
   */
  getHealthStatus() {
    const stats = this.getStats();
    const successRate = stats.processed / (stats.processed + stats.failed) * 100;
    
    return {
      healthy: successRate > 95 && stats.totalQueued < 100,
      successRate,
      ...stats
    };
  }
}

module.exports = MessageQueue;