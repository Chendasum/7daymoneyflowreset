/**
 * Access Control Service for Tier-Based Features
 * Manages user access based on payment tier levels
 */

const User = require("../models/User");
const TierManager = require("./tier-manager");

class AccessControl {
  constructor() {
    this.tierManager = new TierManager();
  }

  /**
   * Check if user has access to a specific feature
   * @param {number} telegramId - User's telegram ID
   * @param {string} feature - Feature name
   * @returns {Promise<{hasAccess: boolean, userTier: string, message?: string}>}
   */
  async checkAccess(telegramId, feature) {
    try {
      const user = await User.findOne({ telegramId });

      if (!user) {
        return {
          hasAccess: false,
          userTier: "free",
          message: "🔒 សូមចុះឈ្មោះជាមុនសិន។ ប្រើ /start ដើម្បីចាប់ផ្តើម។",
        };
      }

      if (!user.isPaid) {
        return {
          hasAccess: false,
          userTier: "free",
          message:
            "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
        };
      }

      const userTier = user.tier || "essential";
      const hasAccess = this.tierManager.hasFeatureAccess(userTier, feature);

      if (!hasAccess) {
        const tierBadge = this.tierManager.getTierBadge(userTier);
        return {
          hasAccess: false,
          userTier,
          message: `${tierBadge} មុខងារនេះត្រូវការកម្រិតខ្ពស់ជាង។ ប្រើ /pricing ដើម្បីមើលការ upgrade។`,
        };
      }

      return {
        hasAccess: true,
        userTier,
        user,
      };
    } catch (error) {
      console.error("Access control error:", error);
      return {
        hasAccess: false,
        userTier: "free",
        message: "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។",
      };
    }
  }

  /**
   * Get user's current tier information
   * @param {number} telegramId - User's telegram ID
   * @returns {Promise<Object>} User tier information
   */
  async getUserTierInfo(telegramId) {
    try {
      const user = await User.findOne({ telegramId });

      if (!user || !user.isPaid) {
        return {
          tier: "free",
          tierInfo: this.tierManager.getTierInfo("free"),
          badge: this.tierManager.getTierBadge("free"),
        };
      }

      const userTier = user.tier || "essential";
      return {
        tier: userTier,
        tierInfo: this.tierManager.getTierInfo(userTier),
        badge: this.tierManager.getTierBadge(userTier),
        price: user.tierPrice || 0,
        paidAt: user.paymentDate,
      };
    } catch (error) {
      console.error("Error getting user tier info:", error);
      return {
        tier: "free",
        tierInfo: this.tierManager.getTierInfo("free"),
        badge: this.tierManager.getTierBadge("free"),
      };
    }
  }

  /**
   * Create tier-specific help message
   * @param {number} telegramId - User's telegram ID
   * @returns {Promise<string>} Customized help message
   */
  async getTierSpecificHelp(telegramId) {
    console.log(
      `[getTierSpecificHelp] Starting for Telegram ID: ${telegramId}`,
    );
    try {
      console.log("[getTierSpecificHelp] Step 1: Getting tier info...");
      const tierInfo = await this.getUserTierInfo(telegramId);
      console.log("[getTierSpecificHelp] Step 1 Result: tierInfo =", tierInfo);

      const { tier, badge, tierInfo: tierDetails } = tierInfo;
      console.log(
        `[getTierSpecificHelp] Step 2 Details: tierDetails =`,
        tierDetails,
        `tierDetails.name =`,
        tierDetails?.name
      );
      console.log(
        `[getTierSpecificHelp] Step 2: Extracted tier = ${tier}, badge = ${badge}`,
      );

      // Payment-status-aware pricing display
      console.log(
        "[getTierSpecificHelp] Step 3: Finding user for payment status...",
      );
      const user = await User.findOne({ telegramId });
      const isPaid = user ? user.isPaid : false;
      console.log(
        `[getTierSpecificHelp] Step 3 Result: User found = ${!!user}, isPaid = ${isPaid}`,
      );

      const pricingText = isPaid
        ? "មើលតម្លៃ ($47 / $97 / $197)"
        : "មើលតម្លៃ ($47)";
      console.log(
        `[getTierSpecificHelp] Step 4: Pricing text = ${pricingText}`,
      );

      const baseCommands = `
🎯 ពាក្យបញ្ជាទូទៅ
/start - ចាប់ផ្តើមកម្មវិធី
/pricing - ${pricingText}
/payment - ការណែនាំទូទាត់
/help - ជំនួយនេះ
/whoami - មើលព័ត៌មានគណនី`;
      console.log("[getTierSpecificHelp] Step 5: Base commands generated.");

      let helpMessageContent = ""; // Initialize the variable to build the content

      if (tier === "free") {
        console.log(
          "[getTierSpecificHelp] Step 6: Generating FREE tier help content.",
        );
        helpMessageContent = `${badge} កម្មវិធីផ្លាស់ប្ដូរ 7-Day Money Flow Reset™${baseCommands}

🎯 ការពិនិត្យសុខភាពហិរញ្ញវត្ថុ (ឥតគិតថ្លៃ)
/financial_quiz - ពិនិត្យសុខភាពហិរញ្ញវត្ថុ ២ នាទី
/health_check - ការវាយតម្លៃហិរញ្ញវត្ថុ

🎬 ការមើលជាមុនកម្មវិធី (ឥតគិតថ្លៃ)
/preview - ការមើលជាមុនទាំងអស់
/preview_day1 - សាកល្បងមេរៀនទី១
/preview_results - លទ្ធផលអ្នកប្រើពិតប្រាកដ
/preview_journey - ៧ ថ្ងៃពេញលេញ

💰 ឧបករណ៍គណនាឥតគិតថ្លៃ
/calculate_daily - គណនាចំណាយប្រចាំថ្ងៃ
/find_leaks - រកកន្លែងលុយលេច
/savings_potential - គណនាសក្តានុពលសន្សំ
/income_analysis - វិភាគចំណូល

🔒 ចង់ចូលរៀន? ប្រើ /pricing ដើម្បីមើលកម្មវិធី

🛠 ជំនួយបន្ថែម
មានសំណួរអ្វី? អ្នកអាចសរសេរសារមក ខ្ញុំ`;
      } else {
        console.log(
          "[getTierSpecificHelp] Step 6: Generating PAID tier help content.",
        );
        const paidCommands = `
🎯 ពាក្យបញ្ជាមេរៀន
/day1 - ថ្ងៃទី១: Money Flow Basics
/day2 - ថ្ងៃទី២: Money Leaks
/day3 - ថ្ងៃទី៣: System Evaluation
/day4 - ថ្ងៃទី៤: Income/Cost Mapping
/day5 - ថ្ងៃទី៥: Survival vs Growth
/day6 - ថ្ងៃទី៦: Action Planning
/day7 - ថ្ងៃទី៧: Integration

📈 កម្មវិធីបន្ថែម (30 ថ្ងៃ)
/30day - ទិដ្ឋភាពទូទៅកម្មវិធី 30 ថ្ងៃ
/30day_calendar - ប្រតិទិនពេញលេញ 30 ថ្ងៃ
/extended8 - ថ្ងៃទី៨: ការវិភាគចំណូលកម្រិតខ្ពស់
/extended9 - ថ្ងៃទី៩: ការគ្រប់គ្រងចំណាយអាជីវកម្ម
/extended10 - ថ្ងៃទី១០: ការបង្កើតទម្លាប់ហិរញ្ញវត្ថុ
... និងច្រើនទៀតរហូតដល់ /extended30

🏆 ការតាមដាន
/badges - មើលការរីកចម្រើន
/progress - ការរីកចម្រើនពេញលេញ
/milestones - សមិទ្ធផលទាំងអស់
/streak - មើលការធ្វើបន្តបន្ទាប់

📚 សម្រង់ប្រាជ្ញាខ្មែរ
/quote - សម្រង់ប្រាជ្ញាប្រចាំថ្ងៃ
/wisdom - សម្រង់ចៃដន្យ
/quote_categories - ប្រភេទសម្រង់ទាំងអស់`;

        let specificFeatures = "";

        if (tier === "premium" || tier === "vip") {
          specificFeatures += `
🚀 មុខងារ Premium
/admin_contact - ទាក់ទងអ្នកគ្រប់គ្រង
/priority_support - ការជំនួយពិសេស
/advanced_analytics - ទិន្នន័យលម្អិត`;
        }

        if (tier === "vip") {
          specificFeatures += `
👑 មុខងារ VIP
/book_session - កក់ពេលជួប 1-on-1
/capital_clarity - Capital Clarity Sessions
/vip_reports - របាយការណ៍ផ្ទាល់ខ្លួន
/extended_tracking - ការតាមដាន 30 ថ្ងៃ`;
        }

        const tierName = (tierDetails && tierDetails.name) ? tierDetails.name : tier;
        helpMessageContent = `${badge} កម្មវិធីផ្លាស់ប្ដូរ 7-Day Money Flow Reset™
កម្រិតបច្ចុប្បន្ន: ${tierName}${baseCommands}${paidCommands}${specificFeatures}

🛠 ជំនួយបន្ថែម
មានសំណួរអ្វី? អ្នកអាចសរសេរសារមក ខ្ញុំ`;
      }
      console.log(
        "[getTierSpecificHelp] Step 7: Help message content generated.",
      );
      return helpMessageContent; // Correctly return the string
    } catch (error) {
      console.error("Error in getTierSpecificHelp:", error.message, error.stack); // Enhanced error logging
      // Ensure the fallback message is a direct string, not using an undefined variable
      return `❌ មានបញ្ហាក្នុងការផ្ទុកជំនួយ។ សូមសាកល្បងម្តងទៀត។

🎯 ពាក្យបញ្ជាមូលដ្ឋាន
/start - ចាប់ផ្តើមកម្មវិធី
/pricing - មើលតម្លៃ
/help - ជំនួយនេះ

🛠 ជំនួយបន្ថែម
មានសំណួរអ្វី? អ្នកអាចសរសេរសារមក ខ្ញុំ`;
    }
  }

  /**
   * Middleware function for command protection
   * @param {string} feature - Feature name
   * @returns {Function} Middleware function
   */
  requiresFeature(feature) {
    return async (msg, bot, next) => {
      const access = await this.checkAccess(msg.from.id, feature);

      if (!access.hasAccess) {
        await bot.sendMessage(msg.chat.id, access.message);
        return;
      }

      // Add user and tier info to message object
      msg.userTier = access.userTier;
      msg.user = access.user;

      if (next) next();
    };
  }

  /**
   * Check if user can access admin features
   * @param {number} telegramId - User's telegram ID
   * @returns {Promise<boolean>} Whether user has admin access
   */
  async hasAdminAccess(telegramId) {
    const access = await this.checkAccess(telegramId, "admin_access");
    return access.hasAccess;
  }

  /**
   * Check if user can book 1-on-1 sessions
   * @param {number} telegramId - User's telegram ID
   * @returns {Promise<boolean>} Whether user can book sessions
   */
  async canBookSessions(telegramId) {
    const access = await this.checkAccess(telegramId, "booking_system");
    return access.hasAccess;
  }

  /**
   * Get tier-specific support message
   * @param {string} tier - User tier
   * @returns {string} Support message
   */
  getTierSupportMessage(tier) {
    const messages = {
      free: "🔓 សូមទូទាត់ដើម្បីទទួលបានការជំនួយពេញលេញ។",
      essential: "🎯 ប្រើ /help សម្រាប់ការជំនួយ ឬសរសេរសំណួរមកដោយផ្ទាល់។",
      premium:
        "🚀 អ្នកទទួលបានការជំនួយពិសេស! ប្រើ /admin_contact ដើម្បីទាក់ទងអ្នកគ្រប់គ្រង។",
      vip: "👑 អ្នកទទួលបានការបម្រើពិសេស! ប្រើ /book_session ដើម្បីកក់ពេលជួប 1-on-1។",
    };

    return messages[tier] || messages.free;
  }
}

module.exports = AccessControl;
