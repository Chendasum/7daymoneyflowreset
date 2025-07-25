/**
 * Testimonial Collection Service
 * Automates testimonial requests and management for revenue optimization
 */

const User = require('../models/User');
const RevenueOptimizer = require('./revenue-optimizer');

class TestimonialCollector {
  constructor() {
    this.revenueOptimizer = new RevenueOptimizer();
  }

  /**
   * Send testimonial request after day completion
   * @param {Object} bot - Bot instance
   * @param {number} chatId - Chat ID
   * @param {number} telegramId - User's telegram ID
   * @param {number} dayNumber - Day number completed
   */
  async sendDayTestimonialRequest(bot, chatId, telegramId, dayNumber) {
    try {
      const user = await User.findOne({ telegramId });
      if (!user) return;

      const userName = user.username || 'មិត្តភក្តិ';
      const testimonialMessage = this.revenueOptimizer.getTestimonialRequest(dayNumber, userName);

      // Send testimonial request with delay after day completion
      setTimeout(async () => {
        await bot.sendMessage(chatId, testimonialMessage);
        
        // Mark testimonial request sent
        await User.findOneAndUpdate(
          { telegramId },
          { 
            $push: { 
              testimonialRequests: {
                dayNumber,
                requestedAt: new Date(),
                responded: false
              }
            }
          }
        );
      }, 5000); // 5 second delay

    } catch (error) {
      console.error('Error sending day testimonial request:', error);
    }
  }

  /**
   * Send program completion testimonial request
   * @param {Object} bot - Bot instance
   * @param {number} chatId - Chat ID
   * @param {number} telegramId - User's telegram ID
   */
  async sendProgramCompletionTestimonial(bot, chatId, telegramId) {
    try {
      const user = await User.findOne({ telegramId });
      if (!user) return;

      const userName = user.username || 'មិត្តភក្តិ';
      const testimonialMessage = this.revenueOptimizer.getTestimonialRequest('complete', userName);

      // Send with celebration animation
      setTimeout(async () => {
        await bot.sendMessage(chatId, testimonialMessage);
        
        // Mark program completion testimonial requested
        await User.findOneAndUpdate(
          { telegramId },
          { 
            $push: { 
              testimonialRequests: {
                dayNumber: 'complete',
                requestedAt: new Date(),
                responded: false
              }
            }
          }
        );
      }, 8000); // 8 second delay after completion celebration

    } catch (error) {
      console.error('Error sending program completion testimonial:', error);
    }
  }

  /**
   * Handle testimonial response from user
   * @param {Object} bot - Bot instance
   * @param {number} chatId - Chat ID
   * @param {number} telegramId - User's telegram ID
   * @param {string} content - Testimonial content
   * @param {number|string} dayNumber - Day number or 'complete'
   */
  async handleTestimonialResponse(bot, chatId, telegramId, content, dayNumber = 'general') {
    try {
      // Store testimonial
      const success = await this.revenueOptimizer.storeTestimonial(telegramId, content, dayNumber);
      
      if (success) {
        // Mark testimonial request as responded
        await User.findOneAndUpdate(
          { telegramId },
          { 
            $set: { 
              "testimonialRequests.$[elem].responded": true,
              "testimonialRequests.$[elem].respondedAt": new Date()
            }
          },
          { 
            arrayFilters: [{ "elem.dayNumber": dayNumber }] 
          }
        );

        // Send thank you message
        const thankYouMessage = `🙏 *អរគុណចំពោះការចែករំលែក!*

testimonial របស់អ្នកនឹងជួយមនុស្សដទៃធ្វើការសម្រេចចិត្តប្រែប្រួលជីវិតរបស់គេ។

✨ *ការចែករំលែករបស់អ្នកមានតម្លៃខ្ពស់!*

${this.getTestimonialThankYouBonus(dayNumber)}

បន្តដំណើររបស់អ្នកនៅថ្ងៃស្អែក! 💪`;

        await bot.sendMessage(chatId, thankYouMessage);

        // Send formatted testimonial to admin for review
        await this.sendTestimonialToAdmin(bot, {
          content,
          dayNumber,
          telegramId,
          userName: (await User.findOne({ telegramId }))?.username || 'Anonymous'
        });

      } else {
        await bot.sendMessage(chatId, 'សូមអភ័យទោស! មានបញ្ហាក្នុងការរក្សាទុក។ សូមសាកល្បងម្តងទៀត។');
      }

    } catch (error) {
      console.error('Error handling testimonial response:', error);
      await bot.sendMessage(chatId, 'សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។');
    }
  }

  /**
   * Get testimonial thank you bonus message
   * @param {number|string} dayNumber - Day number or 'complete'
   * @returns {string} Bonus message
   */
  getTestimonialThankYouBonus(dayNumber) {
    if (dayNumber === 'complete') {
      return `🎁 *Special Bonus:* អ្នកនឹងទទួលបាន exclusive access ដល់កម្មវិធីបន្ទាប់ជាមុនគេ!`;
    }

    const bonuses = {
      1: '🎁 *Bonus Quote:* អ្នកនឹងទទួលបាន premium quote ពិសេសនៅថ្ងៃស្អែក!',
      2: '🎁 *Bonus Tip:* សម្រាប់ការចែករំលែក អ្នកនឹងទទួលបាន advanced money leak detection!',
      3: '🎁 *Bonus Analysis:* អ្នកនឹងទទួលបាន detailed system analysis ពិសេស!',
      4: '🎁 *Bonus Template:* អ្នកនឹងទទួលបាន advanced income mapping template!',
      5: '🎁 *Bonus Guide:* អ្នកនឹងទទួលបាន survival vs growth advanced guide!',
      6: '🎁 *Bonus Planning:* អ្នកនឹងទទួលបាន action plan optimization bonus!',
      7: '🎁 *Bonus Mastery:* អ្នកនឹងទទួលបាន money flow mastery advanced techniques!'
    };

    return bonuses[dayNumber] || '🎁 *Thank You Bonus:* អ្នកនឹងទទួលបាន surprise bonus!';
  }

  /**
   * Send testimonial to admin for review
   * @param {Object} bot - Bot instance
   * @param {Object} testimonialData - Testimonial data
   */
  async sendTestimonialToAdmin(bot, testimonialData) {
    try {
      const adminChatId = process.env.ADMIN_CHAT_ID;
      if (!adminChatId) return;

      const { content, dayNumber, telegramId, userName } = testimonialData;
      const user = await User.findOne({ telegramId });
      const tier = user?.tier || 'essential';
      const tierBadge = this.revenueOptimizer.tierManager.getTierBadge(tier);

      const adminMessage = `📝 *New Testimonial Received*

👤 *User:* ${userName} (${telegramId})
${tierBadge} *Tier:* ${tier}
📅 *Day:* ${dayNumber}
📝 *Content:*

"${content}"

🔗 *Formatted for Social Media:*
${this.revenueOptimizer.formatTestimonialForSharing({
  content,
  userName,
  dayNumber,
  tier
})}

Use /admin_testimonials to manage all testimonials.`;

      await bot.sendMessage(adminChatId, adminMessage);

    } catch (error) {
      console.error('Error sending testimonial to admin:', error);
    }
  }

  /**
   * Get testimonial analytics
   * @returns {Promise<Object>} Testimonial analytics
   */
  async getTestimonialAnalytics() {
    try {
      const users = await User.findAll();
      
      const analytics = {
        totalTestimonials: 0,
        byDay: {},
        byTier: { essential: 0, premium: 0, vip: 0 },
        responseRate: 0,
        totalRequests: 0,
        averageLength: 0,
        topPerformingDays: []
      };

      let totalLength = 0;
      let responded = 0;

      users.forEach(user => {
        const tier = user.tier || 'essential';
        
        // Count testimonials
        if (user.testimonials) {
          analytics.totalTestimonials += user.testimonials.length;
          analytics.byTier[tier] += user.testimonials.length;
          
          user.testimonials.forEach(t => {
            const day = t.dayNumber || 'unknown';
            analytics.byDay[day] = (analytics.byDay[day] || 0) + 1;
            totalLength += t.content.length;
          });
        }

        // Count requests and responses
        if (user.testimonialRequests) {
          analytics.totalRequests += user.testimonialRequests.length;
          responded += user.testimonialRequests.filter(r => r.responded).length;
        }
      });

      // Calculate metrics
      analytics.responseRate = analytics.totalRequests > 0 ? 
        (responded / analytics.totalRequests * 100).toFixed(1) : 0;
      
      analytics.averageLength = analytics.totalTestimonials > 0 ? 
        Math.round(totalLength / analytics.totalTestimonials) : 0;

      // Find top performing days
      analytics.topPerformingDays = Object.entries(analytics.byDay)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([day, count]) => ({ day, count }));

      return analytics;

    } catch (error) {
      console.error('Error getting testimonial analytics:', error);
      return null;
    }
  }

  /**
   * Check if user should receive testimonial request
   * @param {number} telegramId - User's telegram ID
   * @param {number} dayNumber - Day number
   * @returns {Promise<boolean>} Should request testimonial
   */
  async shouldRequestTestimonial(telegramId, dayNumber) {
    try {
      const user = await User.findOne({ telegramId });
      if (!user) return false;

      // Check if already requested for this day
      const existingRequest = user.testimonialRequests?.find(
        req => req.dayNumber === dayNumber
      );

      return !existingRequest;

    } catch (error) {
      console.error('Error checking testimonial request:', error);
      return false;
    }
  }

  /**
   * Get testimonial statistics for admin
   * @returns {Promise<string>} Formatted statistics
   */
  async getTestimonialStatsMessage() {
    try {
      const analytics = await this.getTestimonialAnalytics();
      if (!analytics) return 'មានបញ្ហាក្នុងការទទួលយកទិន្នន័យ។';

      return `📊 *Testimonial Analytics*

📝 *Overview:*
• Total Testimonials: ${analytics.totalTestimonials}
• Response Rate: ${analytics.responseRate}%
• Average Length: ${analytics.averageLength} chars

📈 *By Tier:*
• Essential: ${analytics.byTier.essential}
• Premium: ${analytics.byTier.premium}
• VIP: ${analytics.byTier.vip}

🏆 *Top Performing Days:*
${analytics.topPerformingDays.map(d => `• Day ${d.day}: ${d.count} testimonials`).join('\n')}

📅 *By Day Distribution:*
${Object.entries(analytics.byDay).map(([day, count]) => `• Day ${day}: ${count}`).join('\n')}

Use /admin_testimonials to view all testimonials.`;

    } catch (error) {
      console.error('Error getting testimonial stats:', error);
      return 'សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។';
    }
  }
}

module.exports = TestimonialCollector;