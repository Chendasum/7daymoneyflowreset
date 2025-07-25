const User = require("../models/User");
const Progress = require("../models/Progress");
const analytics = require("../services/analytics");
const RevenueOptimizer = require("../services/revenue-optimizer");
const UpsellAutomation = require("../services/upsell-automation");
const TestimonialCollector = require("../services/testimonial-collector");

const revenueOptimizer = new RevenueOptimizer();
const upsellAutomation = new UpsellAutomation();
const testimonialCollector = new TestimonialCollector();

// Get admin IDs from environment variable
const PRIMARY_ADMIN_ID = parseInt(process.env.ADMIN_CHAT_ID) || 176039;
const SECONDARY_ADMIN_ID = 484389665; // Additional admin for testing

// Check if user is admin
function isAdmin(userId) {
  console.log(`[ADMIN DEBUG] Checking admin access for user ${userId}, expected admin IDs: ${PRIMARY_ADMIN_ID}, ${SECONDARY_ADMIN_ID}`);
  const isAdminUser = userId === PRIMARY_ADMIN_ID || userId === SECONDARY_ADMIN_ID;
  console.log(`[ADMIN DEBUG] Admin check result: ${isAdminUser}`);
  return isAdminUser;
}

// Admin command: Show all users and revenue stats
async function showUsers(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, `⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។

🔒 Admin access required: 176039, 484389665
💡 Your ID: ${msg.from.id}

Use /whoami to see your information.`);
    return;
  }

  try {
    const stats = await analytics.getStats();
    const users = await User.findAll();
    
    let usersList = "👥 USER LIST & REVENUE STATS\n\n";
    usersList += `📊 OVERVIEW:\n`;
    usersList += `• Total Users: ${stats.totalUsers}\n`;
    usersList += `• Paid Users: ${stats.paidUsers}\n`;
    usersList += `• VIP Users: ${stats.vipUsers}\n`;
    usersList += `• Active Users: ${stats.activeUsers}\n\n`;
    
    usersList += `💰 TIER BREAKDOWN:\n`;
    usersList += `• Essential ($47): ${stats.tiers.essential} users = $${stats.revenue.essential}\n`;
    usersList += `• Premium ($97): ${stats.tiers.premium} users = $${stats.revenue.premium}\n`;
    usersList += `• VIP ($197): ${stats.tiers.vip} users = $${stats.revenue.vip}\n`;
    usersList += `• Total Revenue: $${stats.revenue.total}\n\n`;
    
    usersList += `👤 RECENT USERS:\n`;
    const recentUsers = users.slice(-10); // Show last 10 users
    
    for (const user of recentUsers) {
      const status = user.isPaid ? "✅ PAID" : "❌ UNPAID";
      const vipStatus = user.isVip ? " 🌟 VIP" : "";
      usersList += `• ID: ${user.telegramId} | ${status}${vipStatus}\n`;
      usersList += `  Name: ${user.firstName || 'N/A'} ${user.lastName || ''}\n`;
      usersList += `  Joined: ${user.joinedAt ? new Date(user.joinedAt).toDateString() : 'Unknown'}\n\n`;
    }
    
    await bot.sendMessage(msg.chat.id, usersList);
  } catch (error) {
    console.error('Error in admin users command:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការទាញយកទិន្នន័យអ្នកប្រើប្រាស់។');
  }
}

// Admin command: Check user progress
async function checkProgress(msg, match, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, `⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។

🔒 Admin access required: 176039, 484389665
💡 Your ID: ${msg.from.id}

Use /whoami to see your information.`);
    return;
  }

  const userId = parseInt(match[1]);
  
  try {
    const user = await User.findOne({ telegramId: userId });
    const progress = await Progress.findOne({ userId: userId });
    
    if (!user) {
      await bot.sendMessage(msg.chat.id, `❌ រកមិនឃើញអ្នកប្រើប្រាស់ ID: ${userId}`);
      return;
    }
    
    let progressReport = `📊 USER PROGRESS REPORT\n\n`;
    progressReport += `👤 USER INFO:\n`;
    progressReport += `• ID: ${user.telegramId}\n`;
    progressReport += `• Name: ${user.firstName || 'N/A'} ${user.lastName || ''}\n`;
    progressReport += `• Payment: ${user.isPaid ? '✅ PAID' : '❌ UNPAID'}\n`;
    progressReport += `• Tier: ${user.tier || 'essential'} ($${user.tierPrice || 47})\n`;
    progressReport += `• VIP: ${user.isVip ? '🌟 YES' : '❌ NO'}\n`;
    progressReport += `• Joined: ${user.createdAt.toDateString()}\n`;
    progressReport += `• Last Active: ${user.lastActive ? user.lastActive.toDateString() : 'Never'}\n\n`;
    
    if (progress) {
      progressReport += `📈 PROGRAM PROGRESS:\n`;
      progressReport += `• Current Day: ${progress.currentDay}\n`;
      progressReport += `• Ready for Day 1: ${progress.readyForDay1 ? '✅ YES' : '❌ NO'}\n`;
      progressReport += `• Days Completed: ${progress.daysCompleted.length}\n`;
      progressReport += `• Program Complete: ${progress.programComplete ? '✅ YES' : '❌ NO'}\n`;
      
      if (progress.daysCompleted.length > 0) {
        progressReport += `• Completed Days: ${progress.daysCompleted.join(', ')}\n`;
      }
    } else {
      progressReport += `📈 PROGRAM PROGRESS:\n`;
      progressReport += `• No progress data found\n`;
    }
    
    await bot.sendMessage(msg.chat.id, progressReport);
  } catch (error) {
    console.error('Error in admin progress command:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការពិនិត្យដំណើរការ។');
  }
}

// Admin command: Show analytics dashboard
async function showAnalytics(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  try {
    const stats = await analytics.getStats();
    const dailyReport = await analytics.getDailyReport();
    const conversionStats = await revenueOptimizer.getConversionStats();
    const upsellAnalytics = await upsellAutomation.getUpsellAnalytics();
    
    let dashboard = `📊 REVENUE OPTIMIZATION DASHBOARD\n\n`;
    dashboard += `👥 USER METRICS:\n`;
    dashboard += `• Total Users: ${stats.totalUsers}\n`;
    dashboard += `• Paid Users: ${stats.paidUsers}\n`;
    dashboard += `• Active Users: ${stats.activeUsers}\n`;
    dashboard += `• Recent Signups: ${stats.recentSignups}\n\n`;
    
    dashboard += `💰 TIER BREAKDOWN:\n`;
    dashboard += `• Essential ($47): ${stats.tiers.essential} users = $${stats.revenue.essential}\n`;
    dashboard += `• Premium ($97): ${stats.tiers.premium} users = $${stats.revenue.premium}\n`;
    dashboard += `• VIP ($197): ${stats.tiers.vip} users = $${stats.revenue.vip}\n`;
    dashboard += `• Total Revenue: $${stats.revenue.total}\n`;
    dashboard += `• Avg Revenue/User: $${stats.paidUsers > 0 ? Math.round(stats.revenue.total / stats.paidUsers) : 0}\n\n`;
    
    dashboard += `📅 MONTHLY REVENUE:\n`;
    dashboard += `• Essential: $${stats.monthlyRevenue.essential}\n`;
    dashboard += `• Premium: $${stats.monthlyRevenue.premium}\n`;
    dashboard += `• VIP: $${stats.monthlyRevenue.vip}\n`;
    dashboard += `• Monthly Total: $${stats.monthlyRevenue.total}\n\n`;
    
    if (conversionStats) {
      dashboard += `🎯 CONVERSION METRICS:\n`;
      dashboard += `• Conversion Rate: ${Math.round((stats.paidUsers / stats.totalUsers) * 100)}%\n`;
      dashboard += `• Testimonials: ${conversionStats.testimonials.total}\n`;
      dashboard += `• Testimonial Rate: ${Math.round((conversionStats.testimonials.total / stats.paidUsers) * 100)}%\n\n`;
    }
    
    if (upsellAnalytics) {
      dashboard += `📈 UPSELL PERFORMANCE:\n`;
      dashboard += `• Upsell Attempts: ${upsellAnalytics.upsellAttempts.total}\n`;
      dashboard += `• Conversions: ${upsellAnalytics.conversions.total}\n`;
      dashboard += `• Conversion Rate: ${upsellAnalytics.conversions.conversionRate}%\n`;
      dashboard += `• Upsell Revenue: $${upsellAnalytics.revenue.fromUpsells}\n`;
      dashboard += `• Essential→Premium: ${upsellAnalytics.conversions.byType.essential_to_premium}\n`;
      dashboard += `• Premium→VIP: ${upsellAnalytics.conversions.byType.premium_to_vip}\n\n`;
    }
    
    dashboard += `📝 TESTIMONIAL METRICS:\n`;
    if (conversionStats) {
      dashboard += `• Total Testimonials: ${conversionStats.testimonials.total}\n`;
      dashboard += `• By Day: ${Object.entries(conversionStats.testimonials.by_day).slice(0, 3).map(([day, count]) => `Day ${day}: ${count}`).join(', ')}\n\n`;
    }
    
    dashboard += `📈 COMPLETION RATES:\n`;
    dashboard += `• Overall Completion: ${stats.completionRate}%\n`;
    
    dashboard += `• Day Completions:\n`;
    for (let day = 0; day <= 7; day++) {
      dashboard += `  - Day ${day}: ${stats.dayCompletions[`day${day}`]}\n`;
    }
    
    dashboard += `\n📅 TODAY'S ACTIVITY:\n`;
    dashboard += `• New Users: ${dailyReport.newUsers}\n`;
    dashboard += `• Active Users: ${dailyReport.activeUsers}\n`;
    dashboard += `• Messages Sent: ${dailyReport.messagesSent}\n`;
    dashboard += `• Payments: ${dailyReport.payments}\n`;
    
    dashboard += `\n🔧 REVENUE TOOLS:\n`;
    dashboard += `• /admin_testimonials - Manage testimonials\n`;
    dashboard += `• /admin_upsell_analytics - Detailed upsell data\n`;
    dashboard += `• /admin_follow_up_upsells - Send follow-up upsells\n`;
    dashboard += `• /admin_conversion_stats - Tier conversion analytics\n`;
    
    await bot.sendMessage(msg.chat.id, dashboard);
  } catch (error) {
    console.error('Error in admin analytics command:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការទាញយកទិន្នន័យវិភាគ។');
  }
}

// Admin command: Show today's active users
async function showActivity(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeUsers = await User.findAll({
      where: {
        lastActive: {
          gte: today
        }
      },
      orderBy: {
        lastActive: 'desc'
      }
    });
    
    let activityReport = `📱 TODAY'S ACTIVITY\n\n`;
    activityReport += `🟢 ACTIVE USERS: ${activeUsers.length}\n\n`;
    
    if (activeUsers.length > 0) {
      activityReport += `👥 ACTIVE USER LIST:\n`;
      for (const user of activeUsers) {
        const status = user.isPaid ? "✅" : "❌";
        const vipStatus = user.isVip ? " 🌟" : "";
        activityReport += `• ${status} ID: ${user.telegramId}${vipStatus}\n`;
        activityReport += `  ${user.firstName || 'N/A'} ${user.lastName || ''}\n`;
        activityReport += `  Last: ${user.lastActive.toLocaleTimeString()}\n\n`;
      }
    } else {
      activityReport += `😴 No active users today\n`;
    }
    
    await bot.sendMessage(msg.chat.id, activityReport);
  } catch (error) {
    console.error('Error in admin activity command:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការពិនិត្យសកម្មភាព។');
  }
}

// Admin command: Show users needing follow-up
async function showFollowup(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // Users who haven't been active for 3+ days (ALL users, not just paid)
    const inactiveUsers = await User.findAll({
      where: {
        lastActive: {
          lt: threeDaysAgo
        }
      },
      orderBy: {
        lastActive: 'desc'
      }
    });
    
    // Users who paid but haven't started
    const paidButNotStarted = await User.findAll({
      where: {
        isPaid: true
      }
    });
    
    const notStartedUsers = [];
    for (const user of paidButNotStarted) {
      const progress = await Progress.findOne({ userId: user.telegramId });
      if (!progress || progress.currentDay === -1) {
        notStartedUsers.push(user);
      }
    }
    
    let followupReport = `🔔 FOLLOW-UP NEEDED\n\n`;
    
    followupReport += `😴 INACTIVE USERS (3+ days):\n`;
    if (inactiveUsers.length > 0) {
      for (const user of inactiveUsers.slice(0, 10)) {
        const paymentStatus = user.isPaid ? '✅' : '❌';
        followupReport += `• ${paymentStatus} ID: ${user.telegramId}\n`;
        followupReport += `  ${user.firstName || 'N/A'} ${user.lastName || ''}\n`;
        followupReport += `  Last: ${user.lastActive.toDateString()}\n\n`;
      }
    } else {
      followupReport += `✅ No inactive users\n\n`;
    }
    
    followupReport += `🚀 PAID BUT NOT STARTED:\n`;
    if (notStartedUsers.length > 0) {
      for (const user of notStartedUsers) {
        followupReport += `• ID: ${user.telegramId}\n`;
        followupReport += `  ${user.firstName || 'N/A'} ${user.lastName || ''}\n`;
        followupReport += `  Paid: ${user.paidAt ? user.paidAt.toDateString() : 'Unknown'}\n\n`;
      }
    } else {
      followupReport += `✅ All paid users have started\n`;
    }
    
    await bot.sendMessage(msg.chat.id, followupReport);
  } catch (error) {
    console.error('Error in admin followup command:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការពិនិត្យការតាមដាន។');
  }
}

// Admin command: Send message to user
async function sendMessage(msg, match, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  const parts = match[1].split(' ');
  const userId = parseInt(parts[0]);
  const message = parts.slice(1).join(' ');
  
  if (!userId || !message) {
    await bot.sendMessage(msg.chat.id, '❌ Format: /admin_message [userID] [message]');
    return;
  }
  
  try {
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.sendMessage(msg.chat.id, `❌ រកមិនឃើញអ្នកប្រើប្រាស់ ID: ${userId}`);
      return;
    }
    
    await bot.sendMessage(userId, `📧 សារពី Admin:\n\n${message}`);
    await bot.sendMessage(msg.chat.id, `✅ សារបានផ្ញើទៅ ${user.firstName || 'User'} (ID: ${userId})`);
  } catch (error) {
    console.error('Error sending admin message:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការផ្ញើសារ។');
  }
}

// Admin command: Confirm payment
async function confirmPayment(msg, match, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, `⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។

🔒 Admin access required: 176039, 484389665
💡 Your ID: ${msg.from.id}

Use /whoami to see your information.`);
    return;
  }
  
  const targetUserId = parseInt(match[1]);
  
  try {
    // Parse tier and amount from command
    const fullCommand = msg.text.split(' ');
    const tier = fullCommand[2] || 'essential';
    const amount = parseInt(fullCommand[3]) || 47;
    
    const user = await User.findOneAndUpdate(
      { telegramId: targetUserId },
      { 
        isPaid: true, 
        paymentDate: new Date(), 
        transactionId: `ADMIN_CONFIRM_${Date.now()}`,
        tier: tier,
        tierPrice: amount,
        isVip: tier === 'vip'
      },
      { upsert: false }
    );
    
    if (!user) {
      await bot.sendMessage(msg.chat.id, `❌ រកមិនឃើញអ្នកប្រើប្រាស់ ID: ${targetUserId}`);
      return;
    }
    
    await bot.sendMessage(msg.chat.id, `✅ បានបញ្ជាក់ការទូទាត់សម្រាប់ ${user.firstName || 'User'} (ID: ${targetUserId})
🎯 Tier: ${tier.toUpperCase()}
💰 Amount: $${amount}
🚀 User can now access tier-specific features`);
    
    // Notify the user
    try {
      await bot.sendMessage(targetUserId, `🎉 ការទូទាត់របស់អ្នកត្រូវបានបញ្ជាក់!

✅ អ្នកអាចចាប់ផ្តើមកម្មវិធីបានហើយ!
📚 ប្រើ /day1 ដើម្បីចាប់ផ្តើម

🔥 សូមអបអរសាទរ! ការផ្លាស់ប្តូរទាំងអស់ចាប់ផ្តើមពីថ្ងៃនេះ! 💪`);
    } catch (notifyError) {
      console.log('Could not notify user about payment confirmation:', notifyError);
    }
    
  } catch (error) {
    console.error('Error confirming payment:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការបញ្ជាក់ការទូទាត់។');
  }
}

// Admin command: Export user data
async function exportData(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  try {
    const users = await User.findAll();
    const progressData = await Progress.findAll();
    
    // Create progress lookup
    const progressLookup = {};
    progressData.forEach(p => {
      progressLookup[p.userId] = p;
    });
    
    let csvContent = "UserID,FirstName,LastName,IsPaid,IsVip,CreatedAt,LastActive,PaidAt,CurrentDay,DaysCompleted,ProgramComplete\n";
    
    users.forEach(user => {
      const progress = progressLookup[user.telegramId];
      csvContent += `${user.telegramId},`;
      csvContent += `"${user.firstName || ''}",`;
      csvContent += `"${user.lastName || ''}",`;
      csvContent += `${user.isPaid ? 'Yes' : 'No'},`;
      csvContent += `${user.isVip ? 'Yes' : 'No'},`;
      csvContent += `${user.createdAt.toISOString()},`;
      csvContent += `${user.lastActive ? user.lastActive.toISOString() : ''},`;
      csvContent += `${user.paidAt ? user.paidAt.toISOString() : ''},`;
      csvContent += `${progress ? progress.currentDay : -1},`;
      csvContent += `"${progress ? progress.daysCompleted.join(';') : ''}",`;
      csvContent += `${progress ? (progress.programComplete ? 'Yes' : 'No') : 'No'}\n`;
    });
    
    // Send CSV as text (since we can't send files directly)
    const exportText = `📊 USER DATA EXPORT\n\nTotal Users: ${users.length}\nExport Date: ${new Date().toISOString()}\n\n${csvContent}`;
    
    // Split into chunks if too long
    const chunks = exportText.match(/.{1,4000}/g) || [];
    for (let i = 0; i < chunks.length; i++) {
      await bot.sendMessage(msg.chat.id, `📄 Export Part ${i + 1}/${chunks.length}:\n\n${chunks[i]}`);
    }
    
  } catch (error) {
    console.error('Error exporting data:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការនាំចេញទិន្នន័យ។');
  }
}

// Admin command: Show help
async function showHelp(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, `⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។

🔒 Admin access required: 176039, 484389665
💡 Your ID: ${msg.from.id}

Use /whoami to see your information.`);
    return;
  }

  // Split admin menu into multiple messages to avoid Telegram length limits
  const helpText1 = `🔧 ADMIN QUICK MENU

📱 DAILY MONITORING:
• /admin_activity - Today's active users
• /admin_stuck - Users stuck on days  
• /admin_uploads - Photo uploads tracking
• /admin_followup - Users needing help

📊 ANALYTICS:
• /admin_analytics - Full dashboard
• /admin_completion - Completion rates
• /admin_completed - Finished users
• /admin_upsell_analytics - Upsell metrics
• /admin_conversion_stats - Tier conversions

💬 ACTIONS:
• /admin_progress [userID] - User details
• /admin_message [userID] [text] - Send message
• /admin_remind [day] - Send reminders
• /admin_confirm_payment [userID] - Confirm payment`;

  const helpText2 = `🚀 MARKETING AUTOMATION:
• /admin_marketing - Marketing dashboard
• /admin_campaigns - Active campaigns
• /admin_nurture unpaid - Launch nurture campaign
• /admin_upsell essential - Launch upgrade campaign
• /admin_marketing_test - Test all sequences
• /admin_marketing_report - Performance report

📈 REVENUE OPTIMIZATION:
• /admin_testimonials - Testimonial management
• /admin_follow_up_upsells - Send follow-up upsells
• /admin_export_testimonials - Export testimonials
• /admin_social_testimonials - Social media posts`;

  const helpText3 = `📋 REPORTS:
• /admin_users - All users overview
• /admin_export - Export CSV data
• /admin_photos [userID] - User photos

📋 TOOLS & TEMPLATES:
• /admin_daily_template - Daily tracking template
• /admin_weekly_template - Weekly report template
• /admin_engagement_checklist - User engagement guide
• /admin_onboarding_template - New user templates

🆘 HELP:
• /admin_help - Full command list
• /whoami - Your admin status

🔒 Access: Admin IDs 176039, 484389665
💰 Revenue: Tiers $47/$97/$197 with automated optimization

Type any command to execute instantly!`;

  await bot.sendMessage(msg.chat.id, helpText1);
  await bot.sendMessage(msg.chat.id, helpText2);
  await bot.sendMessage(msg.chat.id, helpText3);
}

// New revenue optimization admin commands
async function showUpsellAnalytics(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  try {
    const analyticsMessage = await upsellAutomation.getUpsellAnalyticsMessage();
    await bot.sendMessage(msg.chat.id, analyticsMessage);
  } catch (error) {
    console.error('Error getting upsell analytics:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការទាញយកទិន្នន័យ។');
  }
}

async function sendFollowUpUpsells(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  try {
    const sentCount = await upsellAutomation.sendFollowUpUpsells(bot, 3);
    await bot.sendMessage(msg.chat.id, `✅ Follow-up upsells sent to ${sentCount} users`);
  } catch (error) {
    console.error('Error sending follow-up upsells:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការផ្ញើ follow-up upsells។');
  }
}

async function showConversionStats(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  try {
    const stats = await revenueOptimizer.getConversionStats();
    if (!stats) {
      await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការទាញយកទិន្នន័យ។');
      return;
    }

    let conversionMessage = `📊 *Tier Conversion Statistics*\n\n`;
    conversionMessage += `👥 *User Distribution:*\n`;
    conversionMessage += `• Essential: ${stats.tiers.essential} users\n`;
    conversionMessage += `• Premium: ${stats.tiers.premium} users\n`;
    conversionMessage += `• VIP: ${stats.tiers.vip} users\n\n`;
    
    conversionMessage += `💰 *Revenue Breakdown:*\n`;
    conversionMessage += `• Essential Revenue: $${stats.revenue.essential}\n`;
    conversionMessage += `• Premium Revenue: $${stats.revenue.premium}\n`;
    conversionMessage += `• VIP Revenue: $${stats.revenue.vip}\n`;
    conversionMessage += `• Total Revenue: $${stats.revenue.total}\n\n`;
    
    conversionMessage += `📈 *Conversion Insights:*\n`;
    conversionMessage += `• Essential→Premium: ${stats.conversions.essential_to_premium}\n`;
    conversionMessage += `• Premium→VIP: ${stats.conversions.premium_to_vip}\n`;
    conversionMessage += `• Essential→VIP: ${stats.conversions.essential_to_vip}\n\n`;
    
    conversionMessage += `📝 *Testimonial Data:*\n`;
    conversionMessage += `• Total Testimonials: ${stats.testimonials.total}\n`;
    conversionMessage += `• Top Days: ${Object.entries(stats.testimonials.by_day).slice(0, 3).map(([day, count]) => `Day ${day}: ${count}`).join(', ')}\n`;

    await bot.sendMessage(msg.chat.id, conversionMessage);
  } catch (error) {
    console.error('Error showing conversion stats:', error);
    await bot.sendMessage(msg.chat.id, '❌ មានបញ្ហាក្នុងការទាញយកទិន្នន័យ។');
  }
}

module.exports = {
  showUsers,
  checkProgress,
  showAnalytics,
  showActivity,
  showFollowup,
  sendMessage,
  confirmPayment,
  exportData,
  showHelp,
  showUpsellAnalytics,
  sendFollowUpUpsells,
  showConversionStats
};