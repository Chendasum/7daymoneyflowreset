const cron = require("node-cron");
const User = require("../models/User");
const { getExtendedContent } = require("../commands/extended-content");

class ContentScheduler {
  constructor(bot) {
    this.bot = bot;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log("⚠️ Content scheduler already running");
      return;
    }

    console.log("🔄 Starting 30-day content scheduler...");

    // Daily content delivery at 9 AM Cambodia time
    cron.schedule("0 9 * * *", async () => {
      await this.sendDailyContent();
    }, {
      timezone: "Asia/Phnom_Penh"
    });

    // Evening motivation at 6 PM Cambodia time  
    cron.schedule("0 18 * * *", async () => {
      await this.sendEveningMotivation();
    }, {
      timezone: "Asia/Phnom_Penh"
    });

    // Weekly review on Sundays at 8 PM
    cron.schedule("0 20 * * 0", async () => {
      await this.sendWeeklyReview();
    }, {
      timezone: "Asia/Phnom_Penh"
    });

    this.isRunning = true;
    console.log("✅ 30-day content scheduler started successfully");
    console.log("   • Daily content: 9:00 AM Cambodia time");
    console.log("   • Evening motivation: 6:00 PM Cambodia time"); 
    console.log("   • Weekly review: Sunday 8:00 PM Cambodia time");
  }

  stop() {
    cron.destroy();
    this.isRunning = false;
    console.log("⏹️ Content scheduler stopped");
  }

  async sendDailyContent() {
    try {
      const users = await User.find({ 
        isPaid: true,
        isActive: true 
      });

      console.log(`📤 Sending daily content to ${users.length} users...`);

      for (const user of users) {
        try {
          const currentDay = this.calculateUserDay(user);
          
          if (currentDay > 7 && currentDay <= 37) {
            // Extended content (Days 8-37)
            const extendedDay = currentDay - 7;
            const content = await getExtendedContent(extendedDay);
            
            if (content) {
              await this.bot.sendMessage(
                user.telegramId,
                `🌅 ថ្ងៃល្អ ${user.firstName}!\n\n${content.message}`
              );
              
              // Update user progress
              if (!user.extendedProgress) {
                user.extendedProgress = {};
              }
              user.extendedProgress[`day${extendedDay}`] = new Date();
              await user.save();
            }
          } else if (currentDay > 37) {
            // Graduation message
            await this.sendGraduationMessage(user);
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (userError) {
          console.error(`Error sending to user ${user.telegramId}:`, userError);
        }
      }

      console.log("✅ Daily content delivery completed");

    } catch (error) {
      console.error("❌ Error in daily content delivery:", error);
    }
  }

  async sendEveningMotivation() {
    try {
      const users = await User.find({ 
        isPaid: true,
        isActive: true 
      });

      const motivationMessages = [
        "💪 ថ្ងៃនេះអ្នកបានធ្វើអ្វីខ្លះដើម្បីកែលម្អហិរញ្ញវត្ថុ?",
        "🎯 ការអនុវត្តតិចៗរាល់ថ្ងៃ នាំទៅរកលទ្ធផលធំ!",
        "💰 រំលឹក: ពិនិត្យមើលចំណាយថ្ងៃនេះ និងកត់ត្រាវា",
        "🌟 ការវិនិយោគក្នុងចំណេះដឹង ផ្តល់ផលប្រាក់ល្អបំផុត",
        "📊 តើអ្នកកំពុងតាមគោលដៅហិរញ្ញវត្ថុដែរឬទេ?",
        "🔥 រក្សាទម្លាប់ល្អ! ថ្ងៃស្អែកបន្តធ្វើបានកាន់តែល្អ",
        "💡 ពិចារណាមើល: តើមានចំណាយអ្វីដែលអាចកាត់បន្ថយបាន?"
      ];

      const randomMessage = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];

      for (const user of users) {
        try {
          await this.bot.sendMessage(
            user.telegramId,
            `🌆 សម្រាកពេលល្ងាច ${user.firstName}\n\n${randomMessage}\n\n💬 ចែករំលែកបទពិសោធន៍: @Chendasum`
          );

          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (userError) {
          console.error(`Error sending evening motivation to ${user.telegramId}:`, userError);
        }
      }

      console.log("✅ Evening motivation sent");

    } catch (error) {
      console.error("❌ Error sending evening motivation:", error);
    }
  }

  async sendWeeklyReview() {
    try {
      const users = await User.find({ 
        isPaid: true,
        isActive: true 
      });

      for (const user of users) {
        try {
          const currentDay = this.calculateUserDay(user);
          const weekNumber = Math.ceil((currentDay - 7) / 7);

          if (currentDay > 7 && currentDay <= 37) {
            const reviewMessage = `📊 ការពិនិត្យរកច្ចុប្បន្ន សប្តាហ៍ទី ${weekNumber}

🎯 អ្វីដែលអ្នកបានសម្រេច:
• បានរៀនមេរៀនថ្មីៗ
• បានអនុវត្តទម្លាប់ហិរញ្ញវត្ថុ
• បានកែលម្អការគ្រប់គ្រងលុយ

📈 សម្រាប់សប្តាហ៍ក្រោយ:
• បន្តអនុវត្តអ្វីដែលរៀនបាន
• ពង្រីកចំណេះដឹងថ្មី
• កំណត់គោលដៅថ្មី

💪 រក្សាវាបន្ត ${user.firstName}! អ្នកកំពុងធ្វើបានល្អ!

📞 ចង់ពិគ្រោះបន្ថែម? ទាក់ទង @Chendasum`;

            await this.bot.sendMessage(user.telegramId, reviewMessage);
          }

          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (userError) {
          console.error(`Error sending weekly review to ${user.telegramId}:`, userError);
        }
      }

      console.log("✅ Weekly reviews sent");

    } catch (error) {
      console.error("❌ Error sending weekly reviews:", error);
    }
  }

  async sendGraduationMessage(user) {
    const graduationMessage = `🎓 ជូនពរ ${user.firstName}! អ្នកបានបញ្ចប់កម្មវិធី 30 ថ្ងៃ!

🏆 អ្វីដែលអ្នកបានសម្រេច:
• បញ្ចប់កម្មវិធី 7-Day Money Flow Reset™
• រៀនបានចំណេះដឹងហិរញ្ញវត្ថុ 30 ថ្ងៃ
• បង្កើតទម្លាប់ហិរញ្ញវត្ថុដ៏រឹងមាំ
• កែលម្អការគ្រប់គ្រងលុយកាន់តែប្រសើរ

🚀 ជំហានបន្ទាប់:
• បន្តអនុវត្តអ្វីដែលរៀនបាន
• ចែករំលែកបទពិសោធន៍ជាមួយអ្នកដទៃ
• ពិចារណា VIP Capital Strategy ប្រសិនបើចង់ទៅកម្រិតខ្ពស់

👑 ចាប់អារម្មណ៍ VIP Capital Strategy?
សរសេរ "CAPITAL CLARITY" ដើម្បីដឹងព័ត៌មានលម្អិត

💝 អរគុណ ${user.firstName} ដែលជឿទុកចិត្តយើង!
📞 ទំនាក់ទំនង: @Chendasum`;

    await this.bot.sendMessage(user.telegramId, graduationMessage);
  }

  calculateUserDay(user) {
    if (!user.paymentDate) return 1;
    
    const paymentDate = new Date(user.paymentDate);
    const today = new Date();
    const diffTime = today - paymentDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      nextExecutions: {
        dailyContent: "9:00 AM Cambodia time",
        eveningMotivation: "6:00 PM Cambodia time",
        weeklyReview: "Sunday 8:00 PM Cambodia time"
      }
    };
  }
}

module.exports = ContentScheduler;