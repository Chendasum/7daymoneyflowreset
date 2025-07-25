/**
 * Marketing Automation Service
 * Automated marketing campaigns and lead nurturing for revenue optimization
 */

const User = require("../models/User");
const Progress = require("../models/Progress");

class MarketingAutomation {
  constructor() {
    this.campaigns = {
      welcome: 'Welcome sequence for new users',
      nurture: 'Lead nurturing for unpaid users',
      upsell: 'Tier upgrade campaigns',
      retention: 'Customer retention campaigns',
      referral: 'Referral incentive campaigns'
    };
  }

  /**
   * Welcome sequence for new users (immediate after /start)
   */
  async sendWelcomeSequence(bot, userId, chatId) {
    const welcomeMessages = [
      {
        delay: 2000,
        message: `🎯 សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

💡 អ្នកនឹងរៀនពីរបៀបគ្រប់គ្រងលុយកាក់ដូចជា:
• ការរកមើលលុយលេច (Money Leaks)
• ប្រព័ន្ធសន្សំប្រកបដោយប្រសិទ្ធភាព
• ការគ្រប់គ្រងចំណូល និងចំណាយ
• ផែនការសម្រាប់ការលូតលាស់

🚀 ក្នុងរយៈពេល 7 ថ្ងៃ អ្នកនឹងបានលទ្ធផល!`
      },
      {
        delay: 5000,
        message: `📊 ជ្រើសរើសកម្រិតសេវាកម្ម:

💰 Essential Program ($47)
- មេរៀនប្រចាំថ្ងៃទាំង 7
- ឧបករណ៍គ្រប់គ្រងហិរញ្ញវត្ថុ
- ការតាមដានដោយខ្លួនឯង

💼 Premium + Support ($97)
- Essential Program +
- ជំនួយការវិជ្ជាជីវៈ
- ការតាមដានដោយផ្ទាល់
- Advanced Analytics

🏆 VIP Capital Strategy ($197)
- Premium Program +
- 1-on-1 Strategy Session (60 នាទី)
- ការតាមដាន 30 ថ្ងៃ
- Capital Clarity Preview

ប្រើ /pricing ដើម្បីមើលព័ត៌មានលម្អិត!`
      }
    ];

    for (const msg of welcomeMessages) {
      setTimeout(async () => {
        await bot.sendMessage(chatId, msg.message);
      }, msg.delay);
    }
  }

  /**
   * Lead nurturing sequence for unpaid users
   */
  async sendNurtureSequence(bot, userId, chatId, daysSinceSignup) {
    const nurtureMessages = {
      1: `🤔 មានសំណួរអំពីកម្មវិធី 7-Day Money Flow Reset™?

✅ វាជាកម្មវិធីអប់រំហិរញ្ញវត្ថុ 100% ជាភាសាខ្មែរ
✅ រចនាសម្រាប់សហគ្រិនកម្ពុជា
✅ ប្រើប្រាស់ក្នុងជីវិតប្រចាំថ្ងៃ

💡 តើដឹងទេថា 90% នៃមនុស្សបាត់លុយដោយសារមិនដឹងពីលុយលេច?

ចង់ដឹងពីរបៀបដោះស្រាយ? ប្រើ /pricing`,

      3: `🎯 ការផ្លាស់ប្តូរពិតប្រាកដក្នុង 7 ថ្ងៃ!

👥 អ្នកចូលរួមកម្មវិធីរបស់យើងបាននិយាយថា:
"ខ្ញុំបានកាត់បន្ថយចំណាយ 30% ក្នុងសប្តាហ៍ទី 1!"
"ឥឡូវនេះ ខ្ញុំអាចសន្សំបាន $200/ខែ!"
"ខ្ញុំមានគម្រោងហិរញ្ញវត្ថុច្បាស់លាស់ហើយ!"

🚀 តើអ្នកចង់ទទួលបានលទ្ធផលស្រដៀងគ្នាដែរទេ?

ចាប់ផ្តើម: /pricing`,

      7: `⏰ ឱកាសចុងក្រោយ! សម្រាប់ការផ្លាស់ប្តូរជីវិតរបស់អ្នក

💰 តម្លៃពិសេស Early Bird:
• Essential Program: $47 → $37 (20% ចុះតម្លៃ)
• Premium + Support: $97 → $77 (21% ចុះតម្លៃ)
• VIP Capital Strategy: $197 → $147 (25% ចុះតម្លៃ)

🔥 ត្រឹមតែ 24 ម៉ោង!

ចង់ចាប់ផ្តើម? ប្រើ /pricing ឥឡូវនេះ!`
    };

    if (nurtureMessages[daysSinceSignup]) {
      await bot.sendMessage(chatId, nurtureMessages[daysSinceSignup]);
    }
  }

  /**
   * Upsell campaigns for existing customers
   */
  async sendUpsellCampaign(bot, userId, chatId, currentTier) {
    const upsellMessages = {
      essential: `🚀 ត្រៀមរួចសម្រាប់កម្រិតបន្ទាប់?

អ្នកកំពុងធ្វើបានល្អនៅក្នុង Essential Program! 

💼 Premium Upgrade ($50 បន្ថែម):
✅ ជំនួយការវិជ្ជាជីវៈដោយផ្ទាល់
✅ Advanced Analytics + Reports
✅ Priority Support 24/7
✅ Extended tracking tools

🏆 VIP Upgrade ($100 បន្ថែម):
✅ Premium Program +
✅ 1-on-1 Strategy Session (60 នាទី)
✅ Capital Clarity Preview
✅ 30-day extended support

ចង់ដំឡើងកម្រិត? ប្រើ /vip ឬ /premium`,

      premium: `🏆 VIP Capital Strategy - កម្រិតពិសេសបំផុត!

អ្នកកំពុងទទួលបានលទ្ធផលល្អពី Premium Program!

💎 VIP Upgrade ($100 បន្ថែម):
✅ 1-on-1 Capital Strategy Session (60 នាទី)
✅ Capital Clarity Preview (15 នាទី)
✅ Advanced capital assessment
✅ 30-day extended tracking
✅ Strategic network introductions
✅ Qualification for advanced consulting

🎯 សម្រាប់សហគ្រិនដែលគ្រប់គ្រងមូលធនធំ
🎯 ត្រៀមរួចសម្រាប់ private funding
🎯 ចង់បានប្រព័ន្ធគ្រប់គ្រងមូលធនកម្រិតអាជីវកម្ម

ចង់ដំឡើងទៅ VIP? ប្រើ /vip`
    };

    if (upsellMessages[currentTier]) {
      await bot.sendMessage(chatId, upsellMessages[currentTier]);
    }
  }

  /**
   * Retention campaigns for customers at risk
   */
  async sendRetentionCampaign(bot, userId, chatId, daysInactive) {
    const retentionMessages = {
      3: `💪 កុំបោះបង់! អ្នកកំពុងធ្វើបានល្អ!

តើមានបញ្ហាអ្វីកំពុងរារាំងដំណើរការរបស់អ្នក?

🆘 ជំនួយបន្ទាន់:
• ប្រើ /help ដើម្បីមើលពាក្យបញ្ជាទាំងអស់
• ប្រើ /status ដើម្បីមើលវឌ្ឍនភាព
• ប្រើ /day[X] ដើម្បីបន្តមេរៀន

👥 ឬទាក់ទងដោយផ្ទាល់: admin ត្រៀមជួយអ្នកតែម្តង!`,

      7: `🎯 តើអ្នកបានបោះបង់ការផ្លាស់ប្តូរជីវិតរបស់អ្នក?

📊 សម្ងាត់សម្រាប់ជោគជ័យ:
• 80% នៃមនុស្សជោគជ័យ = និរន្តរភាព
• គ្រាន់តែ 10 នាទី/ថ្ងៃ = ផ្លាស់ប្តូរធំ
• ទាល់តែបញ្ចប់ = ទទួលបានលទ្ធផលពេញលេញ

🚀 បន្តឥឡូវនេះ: /day${await this.getUserCurrentDay(userId)}

💡 ចាំថា: ការផ្លាស់ប្តូរត្រូវការពេលវេលា តែលទ្ធផលនឹងនៅជាមួយអ្នកជាអចិន្ត្រៃយ៍!`
    };

    if (retentionMessages[daysInactive]) {
      await bot.sendMessage(chatId, retentionMessages[daysInactive]);
    }
  }

  /**
   * Referral incentive campaigns
   */
  async sendReferralCampaign(bot, userId, chatId) {
    const referralMessage = `🎁 ចែកចាយ = ទទួលបានរង្វាន់!

💰 កម្មវិធីណែនាំមិត្តភក្តិ:
• ណែនាំ 1 មិត្ត = $10 credit
• ណែនាំ 3 មិត្ត = $35 credit (FREE Essential Program!)
• ណែនាំ 5 មិត្ត = $75 credit (FREE Premium Program!)
• ណែនាំ 10 មិត្ត = $150 credit (FREE VIP Program!)

🔗 របៀបណែនាំ:
1. ចែកចាយ link របស់ bot នេះ
2. ប្រាប់មិត្តភក្តិអ្នកបញ្ជូនពួកគាត់
3. ពេលពួកគាត់ទូទាត់ អ្នកទទួលបាន credit!

📱 ចែកចាយ: t.me/SmartMoneyResetBot
💬 ឬផ្ញើ contact របស់ bot នេះដល់មិត្តភក្តិ

ចាប់ផ្តើមឥឡូវនេះ!`;

    await bot.sendMessage(chatId, referralMessage);
  }

  /**
   * Get user's current day for retention messaging
   */
  async getUserCurrentDay(userId) {
    try {
      const progress = await Progress.findOne({ userId });
      return progress ? progress.currentDay : 1;
    } catch (error) {
      return 1;
    }
  }

  /**
   * Automated campaign scheduler
   */
  async runAutomatedCampaigns(bot) {
    try {
      const users = await User.findAll();
      const now = new Date();

      for (const user of users) {
        const daysSinceSignup = Math.floor((now - user.createdAt) / (1000 * 60 * 60 * 24));
        
        // Welcome sequence
        if (daysSinceSignup === 0) {
          await this.sendWelcomeSequence(bot, user.telegramId, user.telegramId);
        }
        
        // Nurture sequence for unpaid users
        if (!user.isPaid && [1, 3, 7].includes(daysSinceSignup)) {
          await this.sendNurtureSequence(bot, user.telegramId, user.telegramId, daysSinceSignup);
        }
        
        // Upsell campaigns for paid users
        if (user.isPaid && user.tier && daysSinceSignup % 14 === 0) {
          await this.sendUpsellCampaign(bot, user.telegramId, user.telegramId, user.tier);
        }
        
        // Retention campaigns
        const daysSinceActive = Math.floor((now - user.lastActive) / (1000 * 60 * 60 * 24));
        if (user.isPaid && [3, 7].includes(daysSinceActive)) {
          await this.sendRetentionCampaign(bot, user.telegramId, user.telegramId, daysSinceActive);
        }
        
        // Referral campaigns (monthly for active users)
        if (user.isPaid && daysSinceSignup % 30 === 0 && daysSinceActive < 7) {
          await this.sendReferralCampaign(bot, user.telegramId, user.telegramId);
        }
      }
    } catch (error) {
      console.error('Error in automated campaigns:', error);
    }
  }
}

module.exports = new MarketingAutomation();