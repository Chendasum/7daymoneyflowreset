/**
 * Revenue Optimization Service
 * Manages tier-based features, upsells, and testimonial collection
 */

const User = require('../models/User');
const TierManager = require('./tier-manager');

class RevenueOptimizer {
  constructor() {
    this.tierManager = new TierManager();
  }

  /**
   * Check if user can access premium features
   * @param {number} telegramId - User's telegram ID
   * @param {string} featureName - Feature to check
   * @returns {Promise<{hasAccess: boolean, tier: string, message?: string}>}
   */
  async checkFeatureAccess(telegramId, featureName) {
    const user = await User.findOne({ telegramId });
    if (!user) {
      return {
        hasAccess: false,
        tier: 'none',
        message: 'សូមចុច /start ដើម្បីចាប់ផ្តើម។'
      };
    }

    const userTier = user.tier || 'free';
    const hasAccess = this.tierManager.hasFeatureAccess(userTier, featureName);

    if (!hasAccess) {
      const upgradeMessage = this.getUpgradeMessage(userTier, featureName);
      return {
        hasAccess: false,
        tier: userTier,
        message: upgradeMessage
      };
    }

    return {
      hasAccess: true,
      tier: userTier
    };
  }

  /**
   * Get upgrade message for specific feature
   * @param {string} currentTier - User's current tier
   * @param {string} featureName - Feature they're trying to access
   * @returns {string} Upgrade message
   */
  getUpgradeMessage(currentTier, featureName) {
    const featureUpgrades = {
      quotes: {
        tier: 'premium',
        message: '🔒 សម្រង់ប្រាជ្ញា ត្រូវការកម្រិត Premium ($97)\n\nប្រើ /pricing ដើម្បីមើលព័ត៌មានកំណែទម្រង់។'
      },
      mood_tracking: {
        tier: 'premium',
        message: '🔒 ការតាមដានអារម្មណ៍ ត្រូវការកម្រិត Premium ($97)\n\nប្រើ /pricing ដើម្បីមើលព័ត៌មានកំណែទម្រង់។'
      },
      admin_access: {
        tier: 'premium',
        message: '🔒 ការទាក់ទងអ្នកគ្រប់គ្រង ត្រូវការកម្រិត Premium ($97)\n\nប្រើ /pricing ដើម្បីមើលព័ត៌មានកំណែទម្រង់។'
      },
      booking_system: {
        tier: 'vip',
        message: '🔒 ប្រព័ន្ធកក់ជួបផ្ទាល់ ត្រូវការកម្រិត VIP ($197)\n\nប្រើ /pricing ដើម្បីមើលព័ត៌មានកំណែទម្រង់។'
      },
      extended_tracking: {
        tier: 'vip',
        message: '🔒 ការតាមដានពង្រីក ត្រូវការកម្រិត VIP ($197)\n\nប្រើ /pricing ដើម្បីមើលព័ត៌មានកំណែទម្រង់។'
      }
    };

    return featureUpgrades[featureName]?.message || 
           '🔒 មុខងារនេះត្រូវការកំណែទម្រង់។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។';
  }

  /**
   * Get upsell message for specific day
   * @param {number} dayNumber - Day number (1-7)
   * @param {string} currentTier - User's current tier
   * @returns {string|null} Upsell message or null if none
   */
  getUpsellMessage(dayNumber, currentTier) {
    const upsellMessages = {
      3: {
        essential: `🚀 *ការកំណែទម្រង់ពិសេសសម្រាប់ថ្ងៃទី 3!*

អ្នកកំពុងធ្វើបានល្អ! បើចង់បន្តភាពជោគជ័យ សូមពិចារណា Premium:

✨ *Premium ($97) បន្ថែម:*
• សម្រង់ប្រាជ្ញាប្រចាំថ្ងៃ
• ការតាមដានអារម្មណ៍
• ទាក់ទងអ្នកគ្រប់គ្រងផ្ទាល់
• ការគាំទ្រពិសេស

📊 *ទិន្នន័យជោគជ័យ:*
• 85% អ្នកប្រើ Premium បញ្ចប់កម្មវិធី
• ស្ថិរភាពហិរញ្ញវត្ថុកើនឡើង 40%

💬 *testimonials:*
"Premium features ជួយខ្ញុំស្វែងយល់ការគ្រប់គ្រងលុយកាក់យ៉ាងស៊ីជម្រៅ" - មីម៉ា

សាកល្បង Premium ឥឡូវ? /pricing`,
        premium: null
      },
      5: {
        essential: `👑 *VIP Program - ជម្រើសស្វែងយល់ជម្រៅ*

នៅថ្ងៃទី 5 អ្នកបានចាប់ផ្តើមយល់ពីសក្តានុពលរបស់អ្នក។ VIP Program នឹងដឹកនាំអ្នកទៅកាន់ជោគជ័យពិតប្រាកដ:

👑 *VIP ($197) បន្ថែម:*
• ប្រព័ន្ធកក់ជួបផ្ទាល់ 1-on-1
• Capital Clarity Sessions
• ការតាមដានពង្រីក (30 ថ្ងៃ)
• របាយការណ៍ផ្ទាល់ខ្លួន

🎯 *សម្រាប់អ្នកដែល:*
• ចង់ការណែនាំផ្ទាល់ខ្លួន
• មានគម្រោងអាជីវកម្ម
• ត្រូវការយុទ្ធសាស្ត្រហិរញ្ញវត្ថុ

មានតែ 5 កន្លែងក្នុង 1 ខែ! /pricing`,
        premium: `👑 *VIP Upgrade - ការណែនាំផ្ទាល់ខ្លួន*

អ្នកកំពុងប្រើ Premium ប្រកបដោយប្រសិទ្ធភាព! VIP នឹងដាក់អ្នកទៅកម្រិតបន្ទាប់:

👑 *VIP ($197) បន្ថែមលើ Premium:*
• ប្រព័ន្ធកក់ជួបផ្ទាល់ 1-on-1
• Capital Clarity Sessions
• ការតាមដានពង្រីក (30 ថ្ងៃ)
• របាយការណ៍ផ្ទាល់ខ្លួន

🚀 *ផលប្រយោជន៍ VIP:*
• ការណែនាំផ្ទាល់ខ្លួន
• ប្រព័ន្ធទាក់ទងអាទិភាព
• ការគាំទ្រជម្រៅ

Upgrade ទៅ VIP ឥឡូវ? /pricing`
      },
      7: {
        essential: `🎯 *កម្មវិធីបន្ទាប់ - ការរីកចម្រើនបន្ត*

អបអរសាទរ! អ្នកបានបញ្ចប់ Money Flow Reset។ ឥឡូវជាពេលដើម្បីចាប់ផ្តើមដំណើរថ្មី:

🚀 *កម្មវិធីបន្ទាប់:*
• Advanced Money Management (30 ថ្ងៃ)
• Business Finance Mastery (45 ថ្ងៃ)
• Investment Strategy Program (60 ថ្ងៃ)

👑 *VIP Members ទទួលបាន:*
• ចុះបញ្ចូលពិសេស
• ការណែនាំផ្ទាល់ខ្លួន
• កម្មវិធីប្រកបដោយសក្តានុពល

ចង់ដឹងពីកម្មវិធីបន្ទាប់? /pricing`,
        premium: `🎯 *កម្មវិធីបន្ទាប់ - ការរីកចម្រើនបន្ត*

អបអរសាទរ Premium Member! ឥឡូវជាពេលដើម្បីចាប់ផ្តើមដំណើរថ្មី:

🚀 *កម្មវិធីបន្ទាប់:*
• Advanced Money Management (30 ថ្ងៃ)
• Business Finance Mastery (45 ថ្ងៃ)
• Investment Strategy Program (60 ថ្ងៃ)

👑 *VIP Members ទទួលបាន:*
• ចុះបញ្ចូលពិសេស
• ការណែនាំផ្ទាល់ខ្លួន
• កម្មវិធីប្រកបដោយសក្តានុពល

Upgrade ទៅ VIP ឥឡូវ? /pricing`,
        vip: `🎯 *កម្មវិធីបន្ទាប់ - ការរីកចម្រើនបន្ត*

អបអរសាទរ VIP Member! ឥឡូវជាពេលដើម្បីចាប់ផ្តើមដំណើរថ្មី:

🚀 *កម្មវិធីបន្ទាប់សម្រាប់ VIP:*
• Advanced Money Management (30 ថ្ងៃ)
• Business Finance Mastery (45 ថ្ងៃ)
• Investment Strategy Program (60 ថ្ងៃ)

👑 *VIP Benefits:*
• ចុះបញ្ចូលពិសេស
• ការណែនាំផ្ទាល់ខ្លួន
• កម្មវិធីប្រកបដោយសក្តានុពល

ចង់ចាប់ផ្តើម? ទាក់ទងអ្នកគ្រប់គ្រងរបស់អ្នក!`
      }
    };

    return upsellMessages[dayNumber]?.[currentTier] || null;
  }

  /**
   * Get testimonial request message
   * @param {number} dayNumber - Day number or 'complete' for program completion
   * @param {string} userName - User's name
   * @returns {string} Testimonial request message
   */
  getTestimonialRequest(dayNumber, userName) {
    if (dayNumber === 'complete') {
      return `🎉 *អបអរសាទរ ${userName}!*

អ្នកបានបញ្ចប់ 7-Day Money Flow Reset™ ដោយជោគជ័យ! 

📝 *សូមចែករំលែកបទពិសោធន៍របស់អ្នក:*

1. តើអ្នកបានរៀនអ្វីខ្លះដែលពិសេសបំផុត?
2. ការផ្លាស់ប្តូរអ្វីកើតឡើងក្នុងជីវិតរបស់អ្នក?
3. តើអ្នកនឹងសុំរាប់ដល់មិត្តភក្តិទេ?

testimonial របស់អ្នកនឹងជួយមនុស្សដទៃកែប្រែជីវិតដូចអ្នក! 💪

*សូមប្រាប់ពីបទពិសោធន៍របស់អ្នក:*`;
    }

    const dayMessages = {
      1: `👏 *ល្អមាក់ថ្ងៃទី 1!*

${userName} តើអ្នកចង់ចែករំលែកអ្វីអំពីថ្ងៃទី 1 ទេ?

*សំណួរខ្លីៗ:*
• ការរៀនថ្មីអ្វីបំផុត?
• វាបានជួយអ្នកយល់ដឹងអ្វី?`,
      2: `🔍 *ថ្ងៃទី 2 បានសម្រេច!*

${userName} តើអ្នកបានរកឃើញ Money Leaks ដែលមិនដឹងពីមុន?

*ចែករំលែកបទពិសោធន៍:*
• Money Leaks អ្វីខ្លះដែលអ្នករកឃើញ?
• វាមានអានុភាពយ៉ាងណា?`,
      3: `⚡ *ថ្ងៃទី 3 ជោគជ័យ!*

${userName} ការវាយតម្លៃប្រព័ន្ធរបស់អ្នកជាយ៉ាងណា?

*ចែករំលែកជាមួយអ្នកដទៃ:*
• ការរកឃើញសំខាន់បំផុត?
• ផ្នែកណាត្រូវកែប្រែបន្ទាន់?`,
      4: `🗺️ *ថ្ងៃទី 4 បញ្ចប់!*

${userName} ការធ្វើ Income & Cost Map បានជួយអ្នកយ៉ាងណា?

*ចែករំលែកឱ្យដឹង:*
• ការស្វែងយល់ថ្មីអ្វីខ្លះ?
• ផែនការអ្វីដែលនឹងផ្លាស់ប្តូរ?`,
      5: `⚖️ *ថ្ងៃទី 5 ជោគជ័យ!*

${userName} ការយល់ដឹង Survival vs Growth បានផ្លាស់ប្តូរអ្នកយ៉ាងណា?

*ចែករំលែកបទពិសោធន៍:*
• ការផ្លាស់ប្តូរកំនិតថ្មីៗ?
• គោលដៅថ្មីអ្វីបាន?`,
      6: `🎯 *ថ្ងៃទី 6 បានសម្រេច!*

${userName} Action Plan របស់អ្នកត្រៀមរួចហើយ?

*ចែករំលែកផែនការ:*
• ការសកម្មភាពសំខាន់បំផុត?
• ទំនុកចិត្តកម្រិតណា?`,
      7: `🏆 *ថ្ងៃទី 7 ពេញលេញ!*

${userName} ការធ្វើ Money Flow Mastery អ្នកមានអារម្មណ៍យ៉ាងណា?

*ចែករំលែកជោគជ័យ:*
• ការផ្លាស់ប្តូរធំបំផុត?
• ទំនុកចិត្តសម្រាប់អនាគត?`
    };

    return dayMessages[dayNumber] || `✨ *ថ្ងៃទី ${dayNumber} ជោគជ័យ!*

${userName} សូមចែករំលែកបទពិសោធន៍របស់អ្នក!`;
  }

  /**
   * Format testimonial for social media sharing
   * @param {Object} testimonial - Testimonial data
   * @returns {string} Formatted testimonial
   */
  formatTestimonialForSharing(testimonial) {
    const { content, userName, dayNumber, tier } = testimonial;
    
    const tierBadge = this.tierManager.getTierBadge(tier);
    const dayText = dayNumber === 'complete' ? '7-Day Program' : `Day ${dayNumber}`;
    
    return `🌟 *Success Story - ${dayText}*

"${content}"

- ${userName} ${tierBadge}

#7DayMoneyFlowReset #FinancialSuccess #MoneyMindset #Cambodia`;
  }

  /**
   * Store testimonial in database
   * @param {number} telegramId - User's telegram ID
   * @param {string} content - Testimonial content
   * @param {number|string} dayNumber - Day number or 'complete'
   * @returns {Promise<boolean>} Success status
   */
  async storeTestimonial(telegramId, content, dayNumber) {
    try {
      const user = await User.findOne({ telegramId });
      if (!user) return false;

      const testimonial = {
        content,
        dayNumber,
        createdAt: new Date(),
        tier: user.tier || 'essential',
        userName: user.username || 'Anonymous'
      };

      await User.findOneAndUpdate(
        { telegramId },
        { 
          $push: { testimonials: testimonial },
          lastActive: new Date()
        }
      );

      return true;
    } catch (error) {
      console.error('Error storing testimonial:', error);
      return false;
    }
  }

  /**
   * Get conversion tracking data
   * @returns {Promise<Object>} Conversion statistics
   */
  async getConversionStats() {
    try {
      const users = await User.findAll();
      
      const stats = {
        total: users.length,
        tiers: {
          essential: 0,
          premium: 0,
          vip: 0
        },
        revenue: {
          essential: 0,
          premium: 0,
          vip: 0,
          total: 0
        },
        conversions: {
          essential_to_premium: 0,
          premium_to_vip: 0,
          essential_to_vip: 0
        },
        testimonials: {
          total: 0,
          by_day: {}
        }
      };

      users.forEach(user => {
        const tier = user.tier || 'essential';
        const tierPrice = user.tierPrice || 47;
        
        stats.tiers[tier]++;
        stats.revenue[tier] += tierPrice;
        stats.revenue.total += tierPrice;

        // Count testimonials
        if (user.testimonials) {
          stats.testimonials.total += user.testimonials.length;
          user.testimonials.forEach(t => {
            const day = t.dayNumber || 'unknown';
            stats.testimonials.by_day[day] = (stats.testimonials.by_day[day] || 0) + 1;
          });
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting conversion stats:', error);
      return null;
    }
  }
}

module.exports = RevenueOptimizer;