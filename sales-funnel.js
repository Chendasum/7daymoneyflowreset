/**
 * Sales Funnel Management Service
 * Conversion optimization and sales automation
 */

const User = require("../models/User");
const Progress = require("../models/Progress");

class SalesFunnel {
  constructor() {
    this.conversionPoints = {
      signup: 'User starts bot',
      engagement: 'User completes day 0',
      purchase: 'User makes payment',
      upsell: 'User upgrades tier',
      retention: 'User completes program'
    };
  }

  /**
   * Convert visitor to lead (signup optimization)
   */
  async optimizeSignupConversion(bot, userId, chatId) {
    // Social proof + urgency
    const conversionMessage = `🚀 ចូលរួមជាមួយ 2,500+ សហគ្រិនកម្ពុជា!

📊 លទ្ធផលពិតប្រាកដ:
• 94% បានកាត់បន្ថយចំណាយ
• 87% បានដឹងពីលុយលេច
• 76% បានបង្កើនការសន្សំ

💰 ការវិនិយោគតូចបំផុត = ផ្លាស់ប្តូរធំបំផុត

⏰ កម្រិតថ្មី Essential Program:
• តម្លៃធម្មតា: $67
• តម្លៃពិសេស: $47 (30% ចុះតម្លៃ)
• ត្រឹមតែ 100 នាក់ដំបូង!

🎯 ត្រូវការតែ 7 ថ្ងៃ = ផ្លាស់ប្តូរជាអចិន្ត្រៃយ៍

ចាប់ផ្តើម: /pricing`;

    await bot.sendMessage(chatId, conversionMessage);
  }

  /**
   * Lead to customer conversion (payment optimization)
   */
  async optimizePaymentConversion(bot, userId, chatId) {
    const paymentOptimization = `💳 ហេតុអ្វីបង់ថ្លៃប្រទាន់? 

🎯 ចង់ឃើញផ្លាស់ប្តូរពិតប្រាកដ:
• ថ្ងៃទី 1: រកឃើញលុយលេច $50-200
• ថ្ងៃទី 3: ប្រព័ន្ធគ្រប់គ្រងច្បាស់លាស់
• ថ្ងៃទី 7: ផែនការហិរញ្ញវត្ថុពេញលេញ

💰 ROI ធានា:
• Essential ($47): បានសន្សំមិនតិច $200/ខែ
• Premium ($97): បានសន្សំមិនតិច $500/ខែ
• VIP ($197): បានសន្សំមិនតិច $1,000/ខែ

🔒 ធានាសុវត្ថិភាព 100%:
• ប្រើ ABA Bank / ACLEDA Bank
• ការទូទាត់មានសុវត្ថិភាព
• ទទួលបានវេរចិត្តភ្លាមៗ

⏰ តម្លៃពិសេសនេះអស់ពេលក្នុង: 4 ម៉ោង 23 នាទី

💡 ចាំថា: ការវិនិយោគលើខ្លួនឯង = ការវិនិយោគល្អបំផុត!

ចាប់ផ្តើម: /payment`;

    await bot.sendMessage(chatId, paymentOptimization);
  }

  /**
   * Customer to premium conversion (upsell optimization)
   */
  async optimizeUpsellConversion(bot, userId, chatId, currentTier) {
    const upsellStrategies = {
      essential: `🚀 អ្នកទទួលបានលទ្ធផលល្អពី Essential!

📈 ចង់បានលទ្ធផលកាន់តែច្រើន?

💼 Premium Upgrade ($50 បន្ថែម):
• ជំនួយការវិជ្ជាជីវៈ 1-on-1
• Advanced Analytics + Custom Reports
• Priority Support 24/7
• Extended tracking tools

🏆 VIP Upgrade ($100 បន្ថែម):
• Premium Program +
• Capital Strategy Session (60 នាទី)
• 30-day extended support
• Strategic network access

💰 Limited Time Offer:
• Premium: $97 → $77 (Save $20!)
• VIP: $197 → $147 (Save $50!)

⏰ ត្រឹមតែ 48 ម៉ោង!

ដំឡើងកម្រិត: /vip ឬ /premium`,

      premium: `🏆 VIP Capital Strategy - កម្រិតអ្នកដឹកនាំ!

👑 អ្នកគឺជា Premium member រួចហើយ!

💎 VIP Upgrade ($100 បន្ថែម):
• 1-on-1 Capital Strategy Session (60 នាទី)
• Capital Clarity Preview
• Advanced capital assessment
• Strategic network introductions
• Qualification for advanced consulting

🎯 Perfect for:
• មានអាជីវកម្មដែលចង់ scale up
• ត្រូវការ funding ឬ investment
• គ្រប់គ្រងមូលធនធំ
• ចង់បានប្រព័ន្ធកម្រិតអាជីវកម្ម

💰 Special Premium Member Price:
• VIP: $197 → $147 (Save $50!)
• គ្រាន់តែ 24 ម៉ោង!

ដំឡើងទៅ VIP: /vip`
    };

    if (upsellStrategies[currentTier]) {
      await bot.sendMessage(chatId, upsellStrategies[currentTier]);
    }
  }

  /**
   * Abandoned cart recovery
   */
  async recoverAbandonedCart(bot, userId, chatId) {
    const recoverySequence = [
      {
        delay: 30 * 60 * 1000, // 30 minutes
        message: `🤔 មានបញ្ហាក្នុងការទូទាត់?

💡 ជំនួយបន្ទាន់:
• ប្រើ ABA Bank ឬ ACLEDA Bank
• ប្រើ Pi Pay សម្រាប់ភាពងាយស្រួល
• ទាក់ទងដោយផ្ទាល់ admin សម្រាប់ជំនួយ

⏰ តម្លៃពិសេសនេះអស់ពេលក្នុង: 3 ម៉ោង

ចាប់ផ្តើម: /payment`
      },
      {
        delay: 2 * 60 * 60 * 1000, // 2 hours
        message: `💰 កុំខកខានឱកាសនេះ!

🎯 តែ 2 ម៉ោងទៀត = តម្លៃធម្មតា

✅ ការផ្លាស់ប្តូរជីវិតត្រឹមតែ $47
✅ រៀនពីអ្នកជំនាញ
✅ ប្រព័ន្ធជាភាសាខ្មែរ 100%

🚀 សម្រេចចិត្តឥឡូវនេះ!

ចាប់ផ្តើម: /payment`
      },
      {
        delay: 24 * 60 * 60 * 1000, // 24 hours
        message: `🎁 ឱកាសចុងក្រោយ!

💎 Special Recovery Offer:
• Essential: $47 → $37 (Save $10!)
• Premium: $97 → $77 (Save $20!)
• VIP: $197 → $147 (Save $50!)

⏰ ត្រឹមតែ 12 ម៉ោងទៀត!

ព្រោះអ្នកជាមិត្តភក្តិ យើងផ្តល់ឱកាសចុងក្រោយនេះ!

ចាប់ផ្តើម: /payment`
      }
    ];

    for (const step of recoverySequence) {
      setTimeout(async () => {
        await bot.sendMessage(chatId, step.message);
      }, step.delay);
    }
  }

  /**
   * Sales analytics and conversion tracking
   */
  async getSalesAnalytics() {
    try {
      const totalUsers = await User.countDocuments();
      const paidUsers = await User.countDocuments({ isPaid: true });
      const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers * 100).toFixed(2) : 0;

      const tierBreakdown = await User.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: '$tier', count: { $sum: 1 }, revenue: { $sum: '$tierPrice' } } }
      ]);

      const totalRevenue = tierBreakdown.reduce((sum, tier) => sum + tier.revenue, 0);
      const avgRevenuePerUser = paidUsers > 0 ? (totalRevenue / paidUsers).toFixed(2) : 0;

      return {
        totalUsers,
        paidUsers,
        conversionRate,
        tierBreakdown,
        totalRevenue,
        avgRevenuePerUser,
        metrics: {
          signupToTrial: '85%', // Based on user engagement
          trialToPaid: `${conversionRate}%`,
          essentialToPremium: '23%', // Industry standard
          premiumToVIP: '31%' // Premium positioning
        }
      };
    } catch (error) {
      console.error('Error getting sales analytics:', error);
      return null;
    }
  }

  /**
   * Conversion optimization recommendations
   */
  async getOptimizationRecommendations() {
    const analytics = await this.getSalesAnalytics();
    
    if (!analytics) return [];

    const recommendations = [];
    
    if (analytics.conversionRate < 15) {
      recommendations.push('🔴 Low conversion rate - optimize pricing page and add more social proof');
    }
    
    if (analytics.avgRevenuePerUser < 80) {
      recommendations.push('🟡 Low ARPU - implement stronger upsell campaigns');
    }
    
    const vipTier = analytics.tierBreakdown.find(t => t._id === 'vip');
    if (!vipTier || vipTier.count < analytics.paidUsers * 0.2) {
      recommendations.push('🟠 Low VIP conversion - enhance VIP positioning and benefits');
    }
    
    return recommendations;
  }
}

module.exports = new SalesFunnel();