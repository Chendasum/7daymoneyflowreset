/**
 * Marketing Commands for Admin
 * This module provides administrative commands for revenue optimization
 * through marketing automation, analytics, and campaign management.
 */

const User = require("../models/User");
const Progress = require("../models/Progress"); // Assuming Progress is used for user activity/status
const marketingAutomation = require("../services/marketing-automation"); // Service for sending automated marketing sequences
const salesFunnel = require("../services/sales-funnel"); // Service for sales analytics and recommendations
const { sendLongMessage } = require("../utils/message-splitter"); // Utility to split long messages

// Define a consistent message chunk size for splitting messages
const MESSAGE_CHUNK_SIZE = 800;

/**
 * Checks if a user has admin privileges based on their Telegram ID.
 * @param {number} userId - The Telegram ID of the user.
 * @returns {boolean} - True if the user is an admin, false otherwise.
 */
function isAdmin(userId) {
  const adminIds = [176039, 484389665]; // Replace with actual admin Telegram IDs
  return adminIds.includes(userId);
}

/**
 * Displays the marketing dashboard with key revenue and conversion metrics.
 * Provides an overview of the sales funnel and optimization recommendations.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function showMarketingDashboard(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "❌ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    ); // Admin access required
    return;
  }

  try {
    // Fetch sales analytics and optimization recommendations from respective services
    const analytics = await salesFunnel.getSalesAnalytics();
    const recommendations = await salesFunnel.getOptimizationRecommendations();

    const dashboard = `📊 MARKETING DASHBOARD

💰 REVENUE METRICS:
• ចំនួនអ្នកប្រើប្រាស់សរុប: ${analytics.totalUsers}
• ចំនួនអ្នកប្រើប្រាស់បានទូទាត់: ${analytics.paidUsers}
• អត្រា Conversion: ${analytics.conversionRate}%
• ចំណូលសរុប: $${analytics.totalRevenue}
• ARPU (ចំណូលមធ្យមក្នុងមួយអ្នកប្រើប្រាស់): $${analytics.avgRevenuePerUser}

📈 CONVERSION FUNNEL:
• ចុះឈ្មោះ → សាកល្បង: ${analytics.metrics.signupToTrial}
• សាកល្បង → ទូទាត់: ${analytics.metrics.trialToPaid}
• Essential → Premium: ${analytics.metrics.essentialToPremium}
• Premium → VIP: ${analytics.metrics.premiumToVIP}

🎯 TIER BREAKDOWN:
${analytics.tierBreakdown
  .map(
    (tier) => `• ${tier._id}: ${tier.count} អ្នកប្រើប្រាស់ ($${tier.revenue})`,
  )
  .join("\n")}

🔧 OPTIMIZATION RECOMMENDATIONS:
${recommendations.length > 0 ? recommendations.join("\n") : "✅ រាល់ Metrics មើលទៅល្អហើយ!"}

📱 MARKETING COMMANDS:
/marketing_campaigns - មើលយុទ្ធនាការកំពុងដំណើរការ
/marketing_nurture - ផ្ញើសារ Nurture Sequences
/marketing_upsell - ចាប់ផ្តើមយុទ្ធនាការ Upsell
/marketing_test - សាកល្បងសារ Marketing`;

    await sendLongMessage(bot, msg.chat.id, dashboard, {}, MESSAGE_CHUNK_SIZE);
  } catch (error) {
    console.error("Error showing marketing dashboard:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ទុក Dashboard។"); // Error message in Khmer
  }
}

/**
 * Displays information about active marketing campaigns and their performance.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function showMarketingCampaigns(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "❌ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    ); // Admin access required
    return;
  }

  const campaigns = `📢 ACTIVE MARKETING CAMPAIGNS

🎯 AUTOMATED SEQUENCES:
• Welcome Sequence: អ្នកប្រើប្រាស់ថ្មី (ថ្ងៃទី ០)
• Nurture Campaign: ថ្ងៃទី ១, ៣, ៧ (អ្នកមិនទាន់ទូទាត់)
• Upsell Campaign: រៀងរាល់ ១៤ ថ្ងៃ (អ្នកបានទូទាត់)
• Retention Campaign: ថ្ងៃទី ៣, ៧ (អ្នកមិនសកម្ម)
• Referral Campaign: ប្រចាំខែ (អ្នកប្រើប្រាស់សកម្ម)

📊 CAMPAIGN PERFORMANCE:
• Welcome: ៨៥% ការចូលរួម
• Nurture: ២៣% Conversion
• Upsell: ៣១% អត្រាជោគជ័យ
• Retention: ៦៧% ការធ្វើឱ្យសកម្មឡើងវិញ
• Referral: ១២% ការចូលរួម

🚀 OPTIMIZATION STRATEGIES:
• បន្ថែម Social Proof ក្នុង Welcome Sequence
• បង្កើនភាពបន្ទាន់ + កង្វះខាតក្នុង Nurture
• សារ Upsell ជាក់លាក់តាម Tier
• បន្ថែម Personal Touch ក្នុង Retention
• ប្រព័ន្ធ Referral ដែលមានការលើកទឹកចិត្ត

💡 NEXT ACTIONS:
• A/B test សារ Welcome
• បង្កើនប្រសិទ្ធភាព Upsell Positioning
• កែលម្អពេលវេលា Retention
• ពង្រីករង្វាន់ Referral`;

  await sendLongMessage(bot, msg.chat.id, campaigns, {}, MESSAGE_CHUNK_SIZE);
}

/**
 * Launches a nurture campaign for a specified target group (unpaid or inactive users).
 * @param {Object} msg - The Telegram message object.
 * @param {Array} match - The regex match array containing the target type.
 * @param {Object} bot - The Telegram bot instance.
 */
async function launchNurtureCampaign(msg, match, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "❌ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    ); // Admin access required
    return;
  }

  try {
    const targetType = match[1]; // 'unpaid' or 'inactive'
    let users = [];

    if (targetType === "unpaid") {
      // Find all unpaid users
      users = await User.find({ isPaid: false });
    } else if (targetType === "inactive") {
      // Find paid users who have been inactive for more than 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      users = await User.find({
        isPaid: true,
        lastActive: { $lt: threeDaysAgo },
      });
    } else {
      await bot.sendMessage(
        msg.chat.id,
        "❌ ប្រភេទគោលដៅមិនត្រឹមត្រូវ។ ប្រើ 'unpaid' ឬ 'inactive'។",
      );
      return;
    }

    // Iterate through target users and send appropriate marketing sequences
    for (const user of users) {
      if (targetType === "unpaid") {
        const daysSinceSignup = Math.floor(
          (new Date() - user.createdAt) / (1000 * 60 * 60 * 24),
        );
        // Send nurture sequence for unpaid users, passing days since signup
        await marketingAutomation.sendNurtureSequence(
          bot,
          user.telegramId,
          user.telegramId,
          daysSinceSignup || 1,
        );
      } else if (targetType === "inactive") {
        const daysSinceActive = Math.floor(
          (new Date() - user.lastActive) / (1000 * 60 * 60 * 24),
        );
        // Send retention campaign for inactive users, passing days since last active
        await marketingAutomation.sendRetentionCampaign(
          bot,
          user.telegramId,
          user.telegramId,
          daysSinceActive,
        );
      }
    }

    await bot.sendMessage(
      msg.chat.id,
      `🚀 យុទ្ធនាការ Nurture បានចាប់ផ្តើមសម្រាប់អ្នកប្រើប្រាស់ ${users.length} នាក់ (${targetType})។`,
    ); // Confirmation message
  } catch (error) {
    console.error("Error launching nurture campaign:", error);
    await bot.sendMessage(
      msg.chat.id,
      "❌ មានបញ្ហាក្នុងការចាប់ផ្តើមយុទ្ធនាការ។",
    ); // Error message
  }
}

/**
 * Launches an upsell campaign for a specified target tier (essential or premium).
 * @param {Object} msg - The Telegram message object.
 * @param {Array} match - The regex match array containing the target tier.
 * @param {Object} bot - The Telegram bot instance.
 */
async function launchUpsellCampaign(msg, match, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "❌ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    ); // Admin access required
    return;
  }

  try {
    const targetTier = match[1]; // 'essential' or 'premium'
    if (!["essential", "premium"].includes(targetTier)) {
      await bot.sendMessage(
        msg.chat.id,
        "❌ ប្រភេទ Tier មិនត្រឹមត្រូវ។ ប្រើ 'essential' ឬ 'premium'។",
      );
      return;
    }

    // Find paid users belonging to the target tier
    const users = await User.find({
      isPaid: true,
      tier: targetTier,
    });

    // Send upsell campaign to each target user
    for (const user of users) {
      await marketingAutomation.sendUpsellCampaign(
        bot,
        user.telegramId,
        user.telegramId,
        targetTier,
      );
    }

    await bot.sendMessage(
      msg.chat.id,
      `🚀 យុទ្ធនាការ Upsell បានចាប់ផ្តើមសម្រាប់អ្នកប្រើប្រាស់ ${users.length} នាក់ (${targetTier})។`,
    ); // Confirmation message
  } catch (error) {
    console.error("Error launching upsell campaign:", error);
    await bot.sendMessage(
      msg.chat.id,
      "❌ មានបញ្ហាក្នុងការចាប់ផ្តើមយុទ្ធនាការ។",
    ); // Error message
  }
}

/**
 * Sends test marketing messages to the admin for review.
 * This allows admins to preview how different marketing sequences appear to users.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function testMarketingMessages(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "❌ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    ); // Admin access required
    return;
  }

  const testMessage = `🧪 MARKETING MESSAGE TEST

📱 TESTING SEQUENCES:
• Welcome sequence (២ សារ)
• Nurture sequence (ថ្ងៃទី ១, ៣, ៧)
• Upsell sequence (Essential → Premium)
• Retention sequence (៣ ថ្ងៃមិនសកម្ម)
• Referral campaign

⚡ កំពុងដំណើរការការសាកល្បង...`;

  await sendLongMessage(bot, msg.chat.id, testMessage, {}, MESSAGE_CHUNK_SIZE);

  // Simulate sending each marketing sequence with delays
  setTimeout(async () => {
    await marketingAutomation.sendWelcomeSequence(
      bot,
      msg.from.id,
      msg.chat.id,
    );
    await bot.sendMessage(msg.chat.id, "✅ Welcome Sequence បានផ្ញើ!");
  }, 2000);

  setTimeout(async () => {
    await marketingAutomation.sendNurtureSequence(
      bot,
      msg.from.id,
      msg.chat.id,
      1,
    );
    await bot.sendMessage(msg.chat.id, "✅ Nurture Sequence (Day 1) បានផ្ញើ!");
  }, 10000);

  setTimeout(async () => {
    await marketingAutomation.sendUpsellCampaign(
      bot,
      msg.from.id,
      msg.chat.id,
      "essential",
    );
    await bot.sendMessage(
      msg.chat.id,
      "✅ Upsell Campaign (Essential) បានផ្ញើ!",
    );
  }, 20000);

  setTimeout(async () => {
    await marketingAutomation.sendRetentionCampaign(
      bot,
      msg.from.id,
      msg.chat.id,
      3,
    );
    await bot.sendMessage(
      msg.chat.id,
      "✅ Retention Campaign (3 ថ្ងៃមិនសកម្ម) បានផ្ញើ!",
    );
  }, 30000);

  setTimeout(async () => {
    await marketingAutomation.sendReferralCampaign(
      bot,
      msg.from.id,
      msg.chat.id,
    );
    await bot.sendMessage(msg.chat.id, "✅ Referral Campaign បានផ្ញើ!");
  }, 40000);
}

/**
 * Generates and displays a comprehensive marketing report for the current month/year.
 * Includes revenue performance, conversion metrics, tier performance, and growth opportunities.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function generateMarketingReport(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "❌ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    ); // Admin access required
    return;
  }

  try {
    const analytics = await salesFunnel.getSalesAnalytics();
    const now = new Date();
    const thisMonth = now.getMonth() + 1; // getMonth() is 0-indexed
    const thisYear = now.getFullYear();

    const report = `📈 MARKETING REPORT - ${thisMonth}/${thisYear}

💰 REVENUE PERFORMANCE:
• ចំណូលសរុប: $${analytics.totalRevenue}
• គោលដៅប្រចាំខែ: $5,000
• សមិទ្ធផល: ${((analytics.totalRevenue / 5000) * 100).toFixed(1)}%
• ARPU (ចំណូលមធ្យមក្នុងមួយអ្នកប្រើប្រាស់): $${analytics.avgRevenuePerUser}

📊 CONVERSION METRICS:
• Conversion ចុះឈ្មោះ: ${analytics.metrics.signupToTrial}
• Conversion ការទូទាត់: ${analytics.metrics.trialToPaid}
• ជោគជ័យ Upsell: ${analytics.metrics.essentialToPremium}
• Conversion VIP: ${analytics.metrics.premiumToVIP}

🎯 TIER PERFORMANCE:
• Essential: ${analytics.tierBreakdown.find((t) => t._id === "essential")?.count || 0} អ្នកប្រើប្រាស់
• Premium: ${analytics.tierBreakdown.find((t) => t._id === "premium")?.count || 0} អ្នកប្រើប្រាស់
• VIP: ${analytics.tierBreakdown.find((t) => t._id === "vip")?.count || 0} អ្នកប្រើប្រាស់

🚀 GROWTH OPPORTUNITIES:
• បង្កើនប្រសិទ្ធភាព VIP Positioning (+២៥% សក្តានុពល)
• កែលម្អ Nurture Sequence (+១៥% Conversion)
• ពង្រីកកម្មវិធី Referral (+២០% កំណើន)
• បន្ថែមយុទ្ធនាការ Retargeting (+១០% ការស្តារឡើងវិញ)

📅 NEXT MONTH TARGETS:
• ចំណូល: $6,000 (+២០%)
• អ្នកប្រើប្រាស់: ${Math.ceil(analytics.totalUsers * 1.3)}
• Conversion: ${parseFloat(analytics.conversionRate) + 3}%
• ARPU: $${parseFloat(analytics.avgRevenuePerUser) + 10}`;

    await sendLongMessage(bot, msg.chat.id, report, {}, MESSAGE_CHUNK_SIZE);
  } catch (error) {
    console.error("Error generating marketing report:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការបង្កើតរបាយការណ៍។"); // Error message
  }
}

// Export all functions that need to be accessible from other modules (e.g., index.js)
module.exports = {
  showMarketingDashboard,
  showMarketingCampaigns,
  launchNurtureCampaign,
  launchUpsellCampaign,
  testMarketingMessages,
  generateMarketingReport,
};
