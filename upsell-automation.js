/**
 * Upsell Automation Service
 * Automates tier upgrade sequences for revenue optimization
 */

const User = require('../models/User');
const RevenueOptimizer = require('./revenue-optimizer');

class UpsellAutomation {
  constructor() {
    this.revenueOptimizer = new RevenueOptimizer();
  }

  /**
   * Send upsell message on specific days
   * @param {Object} bot - Bot instance
   * @param {number} chatId - Chat ID
   * @param {number} telegramId - User's telegram ID
   * @param {number} dayNumber - Day number (3, 5, 7)
   */
  async sendUpsellMessage(bot, chatId, telegramId, dayNumber) {
    try {
      const user = await User.findOne({ telegramId });
      if (!user) return;

      const currentTier = user.tier || 'essential';
      const upsellMessage = this.revenueOptimizer.getUpsellMessage(dayNumber, currentTier);

      if (upsellMessage) {
        // Send upsell with delay after day completion
        setTimeout(async () => {
          await bot.sendMessage(chatId, upsellMessage);
          
          // Track upsell attempt
          await this.trackUpsellAttempt(telegramId, dayNumber, currentTier);
        }, 10000); // 10 second delay
      }

    } catch (error) {
      console.error('Error sending upsell message:', error);
    }
  }

  /**
   * Track upsell attempt in database
   * @param {number} telegramId - User's telegram ID
   * @param {number} dayNumber - Day number
   * @param {string} currentTier - Current user tier
   */
  async trackUpsellAttempt(telegramId, dayNumber, currentTier) {
    try {
      const upsellAttempt = {
        dayNumber,
        currentTier,
        attemptedAt: new Date(),
        converted: false
      };

      await User.findOneAndUpdate(
        { telegramId },
        { 
          $push: { upsellAttempts: upsellAttempt }
        }
      );

    } catch (error) {
      console.error('Error tracking upsell attempt:', error);
    }
  }

  /**
   * Record tier conversion when user upgrades
   * @param {number} telegramId - User's telegram ID
   * @param {string} fromTier - Previous tier
   * @param {string} toTier - New tier
   * @param {number} amount - Amount paid
   */
  async recordTierConversion(telegramId, fromTier, toTier, amount) {
    try {
      const conversionRecord = {
        fromTier,
        toTier,
        amount,
        convertedAt: new Date(),
        conversionType: this.getConversionType(fromTier, toTier)
      };

      // Update user tier and add conversion record
      await User.findOneAndUpdate(
        { telegramId },
        { 
          tier: toTier,
          tierPrice: amount,
          $push: { conversionHistory: conversionRecord },
          // Mark recent upsell attempts as converted
          $set: { 
            "upsellAttempts.$[elem].converted": true,
            "upsellAttempts.$[elem].convertedAt": new Date()
          }
        },
        { 
          arrayFilters: [{ 
            "elem.converted": false,
            "elem.attemptedAt": { 
              $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }] 
        }
      );

      console.log(`Tier conversion recorded: ${telegramId} ${fromTier} → ${toTier} ($${amount})`);
      return true;

    } catch (error) {
      console.error('Error recording tier conversion:', error);
      return false;
    }
  }

  /**
   * Get conversion type for analytics
   * @param {string} fromTier - Previous tier
   * @param {string} toTier - New tier
   * @returns {string} Conversion type
   */
  getConversionType(fromTier, toTier) {
    if (fromTier === 'essential' && toTier === 'premium') return 'essential_to_premium';
    if (fromTier === 'premium' && toTier === 'vip') return 'premium_to_vip';
    if (fromTier === 'essential' && toTier === 'vip') return 'essential_to_vip';
    return 'other';
  }

  /**
   * Get upsell conversion analytics
   * @returns {Promise<Object>} Conversion analytics
   */
  async getUpsellAnalytics() {
    try {
      const users = await User.findAll();
      
      const analytics = {
        upsellAttempts: {
          total: 0,
          byDay: { 3: 0, 5: 0, 7: 0 },
          byTier: { essential: 0, premium: 0, vip: 0 }
        },
        conversions: {
          total: 0,
          byType: {
            essential_to_premium: 0,
            premium_to_vip: 0,
            essential_to_vip: 0
          },
          conversionRate: 0
        },
        revenue: {
          fromUpsells: 0,
          averageUpgrade: 0,
          totalLifetimeValue: 0
        },
        timing: {
          day3Success: 0,
          day5Success: 0,
          day7Success: 0
        }
      };

      let totalUpsellRevenue = 0;
      let conversionCount = 0;

      users.forEach(user => {
        // Count upsell attempts
        if (user.upsellAttempts && user.upsellAttempts.length > 0) {
          user.upsellAttempts.forEach(attempt => {
            analytics.upsellAttempts.total++;
            analytics.upsellAttempts.byDay[attempt.dayNumber] = 
              (analytics.upsellAttempts.byDay[attempt.dayNumber] || 0) + 1;
            analytics.upsellAttempts.byTier[attempt.currentTier] = 
              (analytics.upsellAttempts.byTier[attempt.currentTier] || 0) + 1;
          });
        }

        // Count conversions
        if (user.conversionHistory && user.conversionHistory.length > 0) {
          user.conversionHistory.forEach(conversion => {
            analytics.conversions.total++;
            analytics.conversions.byType[conversion.conversionType] = 
              (analytics.conversions.byType[conversion.conversionType] || 0) + 1;
            
            totalUpsellRevenue += conversion.amount;
            conversionCount++;

            // Track timing success
            const dayOfConversion = this.getConversionDay(conversion.convertedAt, user.joinedAt);
            if (dayOfConversion <= 3) analytics.timing.day3Success++;
            else if (dayOfConversion <= 5) analytics.timing.day5Success++;
            else if (dayOfConversion <= 7) analytics.timing.day7Success++;
          });
        }

        // Calculate lifetime value
        const userValue = user.tierPrice || 0;
        analytics.revenue.totalLifetimeValue += userValue;
      });

      // Calculate rates and averages
      analytics.conversions.conversionRate = analytics.upsellAttempts.total > 0 ? 
        (analytics.conversions.total / analytics.upsellAttempts.total * 100).toFixed(1) : 0;
      
      analytics.revenue.fromUpsells = totalUpsellRevenue;
      analytics.revenue.averageUpgrade = conversionCount > 0 ? 
        Math.round(totalUpsellRevenue / conversionCount) : 0;

      return analytics;

    } catch (error) {
      console.error('Error getting upsell analytics:', error);
      return null;
    }
  }

  /**
   * Get conversion day relative to user join date
   * @param {Date} conversionDate - Conversion date
   * @param {Date} joinDate - User join date
   * @returns {number} Days since joining
   */
  getConversionDay(conversionDate, joinDate) {
    const diffTime = Math.abs(conversionDate - joinDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get upsell analytics message for admin
   * @returns {Promise<string>} Formatted analytics message
   */
  async getUpsellAnalyticsMessage() {
    try {
      const analytics = await this.getUpsellAnalytics();
      if (!analytics) return 'មានបញ្ហាក្នុងការទទួលយកទិន្នន័យ។';

      return `📈 *Upsell Performance Analytics*

🎯 *Upsell Attempts:*
• Total: ${analytics.upsellAttempts.total}
• Day 3: ${analytics.upsellAttempts.byDay[3]}
• Day 5: ${analytics.upsellAttempts.byDay[5]}
• Day 7: ${analytics.upsellAttempts.byDay[7]}

💰 *Conversions:*
• Total: ${analytics.conversions.total}
• Conversion Rate: ${analytics.conversions.conversionRate}%
• Essential → Premium: ${analytics.conversions.byType.essential_to_premium}
• Premium → VIP: ${analytics.conversions.byType.premium_to_vip}
• Essential → VIP: ${analytics.conversions.byType.essential_to_vip}

💵 *Revenue Impact:*
• From Upsells: $${analytics.revenue.fromUpsells}
• Average Upgrade: $${analytics.revenue.averageUpgrade}
• Total LTV: $${analytics.revenue.totalLifetimeValue}

⏱️ *Timing Success:*
• Day 1-3 Conversions: ${analytics.timing.day3Success}
• Day 4-5 Conversions: ${analytics.timing.day5Success}
• Day 6-7 Conversions: ${analytics.timing.day7Success}

🔧 *Optimization Insights:*
• Best performing day: Day ${this.getBestPerformingDay(analytics)}
• Highest conversion: ${this.getHighestConversionType(analytics)}
• Revenue per attempt: $${(analytics.revenue.fromUpsells / analytics.upsellAttempts.total).toFixed(2)}`;

    } catch (error) {
      console.error('Error getting upsell analytics message:', error);
      return 'សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។';
    }
  }

  /**
   * Get best performing upsell day
   * @param {Object} analytics - Analytics data
   * @returns {number} Best performing day
   */
  getBestPerformingDay(analytics) {
    const dayPerformance = {
      3: analytics.upsellAttempts.byDay[3] || 0,
      5: analytics.upsellAttempts.byDay[5] || 0,
      7: analytics.upsellAttempts.byDay[7] || 0
    };

    return Object.entries(dayPerformance).reduce((a, b) => 
      dayPerformance[a[0]] > dayPerformance[b[0]] ? a : b
    )[0];
  }

  /**
   * Get highest conversion type
   * @param {Object} analytics - Analytics data
   * @returns {string} Highest conversion type
   */
  getHighestConversionType(analytics) {
    const types = analytics.conversions.byType;
    const highest = Object.entries(types).reduce((a, b) => types[a[0]] > types[b[0]] ? a : b);
    return highest[0].replace(/_/g, ' → ');
  }

  /**
   * Send follow-up upsell to users who didn't convert
   * @param {Object} bot - Bot instance
   * @param {number} daysBack - Days to look back for unconverted users
   */
  async sendFollowUpUpsells(bot, daysBack = 3) {
    try {
      const users = await User.findAll();
      const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
      
      let followUpsSent = 0;

      for (const user of users) {
        if (!user.upsellAttempts || user.upsellAttempts.length === 0) continue;

        // Find recent unconverted upsell attempts
        const recentUnconverted = user.upsellAttempts.filter(attempt => 
          !attempt.converted && new Date(attempt.attemptedAt) > cutoffDate
        );

        if (recentUnconverted.length > 0) {
          const followUpMessage = this.getFollowUpMessage(user.tier, recentUnconverted);
          
          try {
            await bot.sendMessage(user.telegramId, followUpMessage);
            followUpsSent++;
            
            // Track follow-up attempt
            await User.findOneAndUpdate(
              { telegramId: user.telegramId },
              { 
                $push: { 
                  upsellAttempts: {
                    dayNumber: 'followup',
                    currentTier: user.tier,
                    attemptedAt: new Date(),
                    converted: false,
                    isFollowUp: true
                  }
                }
              }
            );
          } catch (msgError) {
            console.error(`Error sending follow-up to ${user.telegramId}:`, msgError);
          }
        }
      }

      console.log(`Follow-up upsells sent to ${followUpsSent} users`);
      return followUpsSent;

    } catch (error) {
      console.error('Error sending follow-up upsells:', error);
      return 0;
    }
  }

  /**
   * Get follow-up upsell message
   * @param {string} currentTier - User's current tier
   * @param {Array} recentAttempts - Recent upsell attempts
   * @returns {string} Follow-up message
   */
  getFollowUpMessage(currentTier, recentAttempts) {
    const baseMessage = `🚀 *Second Chance Offer!*

យើងកត់សម្គាល់ឃើញថាអ្នកកំពុងប្រយុទ្ធដើម្បីសម្រេចគោលដៅហិរញ្ញវត្ថុ។

`;

    const tierMessages = {
      essential: `👑 *Limited Time: Premium Upgrade*

ជាមួយ Premium ($97) អ្នកនឹងទទួលបាន:
✅ សម្រង់ប្រាជ្ញាប្រចាំថ្ងៃ
✅ ការតាមដានអារម្មណ៍
✅ ទាក់ទងអ្នកគ្រប់គ្រងផ្ទាល់
✅ ការគាំទ្រពិសេស

🎁 *Special Bonus:* 1-on-1 consultation session FREE!

កម្រិតនេះនឹងបញ្ចប់ក្នុង 24 ម៉ោង។`,

      premium: `👑 *VIP Exclusive Invitation*

អ្នកកំពុងបានជោគជ័យជាមួយ Premium។ ឥឡូវជាពេលដើម្បីឈានទៅកម្រិតបន្ទាប់:

VIP Program ($197) បន្ថែម:
✅ ប្រព័ន្ធកក់ជួបផ្ទាល់ 1-on-1
✅ Capital Clarity Sessions
✅ ការតាមដានពង្រីក 30 ថ្ងៃ
✅ របាយការណ៍ផ្ទាល់ខ្លួន

🎁 *VIP Bonus:* Priority access to new programs!

មានតែ 3 កន្លែងនៅសល់ក្នុងខែនេះ។`
    };

    const closingMessage = `

💬 *Success Stories:*
"ការកំណែទម្រង់បានផ្លាស់ប្តូរជីវិតខ្ញុំ! ខ្ញុំឥឡូវមានទំនុកចិត្តលើការគ្រប់គ្រងលុយកាក់។" - លីម៉ា

ចង់ចាប់ផ្តើមឥឡូវនេះ? /pricing

*P.S. នេះជាឱកាសចុងក្រោយសម្រាប់ថ្លៃពិសេស!*`;

    return baseMessage + (tierMessages[currentTier] || '') + closingMessage;
  }
}

module.exports = UpsellAutomation;