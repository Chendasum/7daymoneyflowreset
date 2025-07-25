/**
 * Bot Health Monitor Service
 * Monitors bot health and automatically recovers from failures
 */

class BotHealthMonitor {
  constructor(bot) {
    this.bot = bot;
    this.healthCheckInterval = null;
    this.webhookResetAttempts = 0;
    this.maxResetAttempts = 3;
    this.isMonitoring = false;
    this.lastHealthCheck = null;
    this.consecutiveFailures = 0;
    this.maxConsecutiveFailures = 3;
  }

  /**
   * Start monitoring bot health
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    console.log('💓 Bot health monitoring started');

    // Initial health check
    this.performHealthCheck();

    // Set up regular health checks every 2 minutes
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 2 * 60 * 1000);

    // Set up webhook status check every 10 minutes
    setInterval(() => {
      this.checkWebhookStatus();
    }, 10 * 60 * 1000);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isMonitoring = false;
    console.log('💓 Bot health monitoring stopped');
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    try {
      const startTime = Date.now();
      const me = await this.bot.getMe();
      const responseTime = Date.now() - startTime;

      this.lastHealthCheck = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        bot: {
          username: me.username,
          id: me.id,
          is_bot: me.is_bot
        },
        response_time: responseTime,
        consecutive_failures: 0
      };

      // Reset failure counter on successful check
      this.consecutiveFailures = 0;
      this.webhookResetAttempts = 0;

      console.log(`💓 Health check passed: ${me.username} (${responseTime}ms)`);
    } catch (error) {
      this.consecutiveFailures++;
      
      this.lastHealthCheck = {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error.message,
        consecutive_failures: this.consecutiveFailures
      };

      console.error(`❌ Health check failed (${this.consecutiveFailures}/${this.maxConsecutiveFailures}):`, error.message);

      // Attempt recovery if we have too many failures
      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        await this.attemptRecovery(error);
      }
    }
  }

  /**
   * Check webhook status
   */
  async checkWebhookStatus() {
    try {
      const webhookInfo = await this.bot.getWebHookInfo();
      
      if (!webhookInfo.url) {
        console.error('❌ Webhook URL is empty, attempting to reset...');
        await this.resetWebhook();
        return;
      }

      // Check if webhook has pending updates (possible issue)
      if (webhookInfo.pending_update_count > 100) {
        console.warn(`⚠️ High pending updates: ${webhookInfo.pending_update_count}`);
      }

      // Check last error date
      if (webhookInfo.last_error_date) {
        const lastError = new Date(webhookInfo.last_error_date * 1000);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (lastError > hourAgo) {
          console.error('❌ Recent webhook error detected, attempting reset...');
          await this.resetWebhook();
        }
      }

      console.log('✅ Webhook status check passed');
    } catch (error) {
      console.error('❌ Webhook status check failed:', error);
      await this.resetWebhook();
    }
  }

  /**
   * Attempt recovery from failures
   */
  async attemptRecovery(error) {
    console.log(`🔄 Attempting bot recovery (attempt ${this.webhookResetAttempts + 1}/${this.maxResetAttempts})...`);

    if (this.webhookResetAttempts >= this.maxResetAttempts) {
      console.error('❌ Max recovery attempts reached, manual intervention required');
      return;
    }

    this.webhookResetAttempts++;

    try {
      // Try to reset webhook
      await this.resetWebhook();
      
      // Wait and test again
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Perform another health check
      await this.performHealthCheck();
      
      if (this.consecutiveFailures === 0) {
        console.log('✅ Bot recovery successful');
      }
    } catch (recoveryError) {
      console.error('❌ Recovery attempt failed:', recoveryError);
    }
  }

  /**
   * Reset webhook
   */
  async resetWebhook() {
    try {
      // Delete current webhook
      await this.bot.deleteWebHook();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set new webhook
      const webhookUrl = process.env.CUSTOM_DOMAIN 
        ? `https://${process.env.CUSTOM_DOMAIN}/webhook/${process.env.BOT_TOKEN}`
        : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/webhook/${process.env.BOT_TOKEN}`;
      
      await this.bot.setWebHook(webhookUrl);
      
      console.log('✅ Webhook reset successfully');
    } catch (error) {
      console.error('❌ Failed to reset webhook:', error);
      throw error;
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus() {
    return {
      is_monitoring: this.isMonitoring,
      last_health_check: this.lastHealthCheck,
      consecutive_failures: this.consecutiveFailures,
      webhook_reset_attempts: this.webhookResetAttempts,
      max_reset_attempts: this.maxResetAttempts
    };
  }

  /**
   * Force health check
   */
  async forceHealthCheck() {
    console.log('🔄 Forcing health check...');
    await this.performHealthCheck();
    return this.lastHealthCheck;
  }
}

module.exports = BotHealthMonitor;