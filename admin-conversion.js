const User = require("../models/User");
const ConversionOptimizer = require("../services/conversion-optimizer");

/**
 * Admin commands for conversion tracking and optimization
 */

async function conversionStats(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Admin verification
  const adminIds = [176039, 484389665];
  if (!adminIds.includes(userId)) {
    await bot.sendMessage(chatId, "អ្នកមិនមានសិទ្ធិប្រើប្រាស់ពាក្យបញ្ជានេះទេ។");
    return;
  }

  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const paidUsers = await User.countDocuments({ isPaid: true });
    const unpaidUsers = await User.countDocuments({ isPaid: false });
    
    // Get users by tier
    const essentialUsers = await User.countDocuments({ tier: 'essential' });
    const premiumUsers = await User.countDocuments({ tier: 'premium' });
    const vipUsers = await User.countDocuments({ tier: 'vip' });
    
    // Calculate conversion rate
    const conversionRate = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : 0;
    
    // Calculate revenue
    const totalRevenue = (essentialUsers * 47) + (premiumUsers * 97) + (vipUsers * 197);
    const averageRevenue = paidUsers > 0 ? (totalRevenue / paidUsers).toFixed(0) : 0;
    
    // Get recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentUsers = await User.countDocuments({ 
      createdAt: { $gte: yesterday } 
    });
    
    const recentPaid = await User.countDocuments({ 
      isPaid: true,
      paymentDate: { $gte: yesterday } 
    });
    
    const recentConversionRate = recentUsers > 0 ? ((recentPaid / recentUsers) * 100).toFixed(1) : 0;

    const statsMessage = `📊 CONVERSION ANALYTICS

👥 TOTAL USERS: ${totalUsers}
💰 PAID USERS: ${paidUsers}
🔓 UNPAID USERS: ${unpaidUsers}
📈 CONVERSION RATE: ${conversionRate}%

💎 TIER BREAKDOWN:
• Essential ($47): ${essentialUsers} users
• Premium ($97): ${premiumUsers} users  
• VIP ($197): ${vipUsers} users

💰 REVENUE METRICS:
• Total Revenue: $${totalRevenue}
• Average Revenue/User: $${averageRevenue}
• Monthly Target: $5,000-6,000

📅 LAST 24 HOURS:
• New Users: ${recentUsers}
• New Conversions: ${recentPaid}
• Recent Conversion Rate: ${recentConversionRate}%

🎯 OPTIMIZATION NOTES:
• Target: 18-25% conversion rate
• Current: ${conversionRate}% (${conversionRate < 18 ? 'NEEDS IMPROVEMENT' : 'GOOD'})
• Follow-up system: ${unpaidUsers > 0 ? 'ACTIVE' : 'STANDBY'}

⚡ Use /admin_interested to see users who viewed pricing
⚡ Use /admin_urgent to send urgent message to unpaid users`;

    await bot.sendMessage(chatId, statsMessage);
  } catch (error) {
    console.error("Error in conversion stats:", error);
    await bot.sendMessage(chatId, "មានបញ្ហាក្នុងការទាញយកស្ថិតិ។");
  }
}

async function interestedUsers(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Admin verification
  const adminIds = [176039, 484389665];
  if (!adminIds.includes(userId)) {
    await bot.sendMessage(chatId, "អ្នកមិនមានសិទ្ធិប្រើប្រាស់ពាក្យបញ្ជានេះទេ។");
    return;
  }

  try {
    // Get users who are not paid but have been active recently
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const interestedUsers = await User.find({
      isPaid: false,
      lastActive: { $gte: threeDaysAgo }
    }).sort({ lastActive: -1 }).limit(10);

    if (interestedUsers.length === 0) {
      await bot.sendMessage(chatId, "🎯 មិនមានអ្នកប្រើប្រាស់ដែលចាប់អារម្មណ៍ថ្មីៗទេ។");
      return;
    }

    let message = `🎯 INTERESTED USERS (Last 3 days)\n\n`;
    
    interestedUsers.forEach((user, index) => {
      const lastActive = user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Unknown';
      const username = user.username ? `@${user.username}` : user.firstName || 'Unknown';
      
      message += `${index + 1}. ${username} (ID: ${user.telegramId})\n`;
      message += `   Last Active: ${lastActive}\n`;
      message += `   Status: UNPAID\n\n`;
    });

    message += `📊 Total interested users: ${interestedUsers.length}\n`;
    message += `⚡ Use /admin_urgent to send follow-up message\n`;
    message += `💬 Use /admin_message [userID] [message] to send personal message`;

    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error("Error getting interested users:", error);
    await bot.sendMessage(chatId, "មានបញ្ហាក្នុងការទាញយកទិន្នន័យ។");
  }
}

async function sendUrgentMessage(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Admin verification
  const adminIds = [176039, 484389665];
  if (!adminIds.includes(userId)) {
    await bot.sendMessage(chatId, "អ្នកមិនមានសិទ្ធិប្រើប្រាស់ពាក្យបញ្ជានេះទេ។");
    return;
  }

  try {
    const conversionOptimizer = new ConversionOptimizer();
    
    // Get all unpaid users who have been active in last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const unpaidUsers = await User.find({
      isPaid: false,
      lastActive: { $gte: weekAgo }
    });

    if (unpaidUsers.length === 0) {
      await bot.sendMessage(chatId, "🎯 មិនមានអ្នកប្រើប្រាស់ unpaid ដែលសកម្មទេ។");
      return;
    }

    const urgentMessage = conversionOptimizer.getUrgencyMessage('scarcity');
    let successCount = 0;
    let errorCount = 0;

    // Send urgent message to all unpaid users
    for (const user of unpaidUsers) {
      try {
        await bot.sendMessage(user.telegramId, urgentMessage);
        successCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error sending urgent message to ${user.telegramId}:`, error);
        errorCount++;
      }
    }

    const resultMessage = `🚀 URGENT MESSAGE SENT

✅ Successfully sent: ${successCount} users
❌ Failed: ${errorCount} users
📊 Total targeted: ${unpaidUsers.length} users

💰 Message type: SCARCITY + URGENCY
⏰ Expected conversion boost: 5-15%

📈 Monitor conversion stats in next 24 hours!`;

    await bot.sendMessage(chatId, resultMessage);
  } catch (error) {
    console.error("Error sending urgent message:", error);
    await bot.sendMessage(chatId, "មានបញ្ហាក្នុងការផ្ញើសាររបស់ប្រព័ន្ធ។");
  }
}

// Test conversion system with specific user
async function testConversionSystem(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Check admin permissions
  if (!isAdmin(userId)) {
    await bot.sendMessage(chatId, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  // Parse command to get test user ID
  const args = msg.text.split(' ');
  if (args.length < 2) {
    await bot.sendMessage(chatId, "Usage: /test_conversion [userID]");
    return;
  }

  const testUserId = parseInt(args[1]);
  
  try {
    const ConversionOptimizer = require("../services/conversion-optimizer");
    const conversionOptimizer = new ConversionOptimizer();
    
    // Get user to test
    const testUser = await User.findOne({ telegramId: testUserId });
    if (!testUser) {
      await bot.sendMessage(chatId, `❌ User ${testUserId} not found`);
      return;
    }
    
    if (testUser.isPaid) {
      await bot.sendMessage(chatId, `❌ User ${testUserId} is already paid`);
      return;
    }
    
    // Start conversion sequence
    console.log(`🧪 Admin testing conversion sequence for user ${testUserId}`);
    conversionOptimizer.scheduleFollowUpSequence(bot, testUserId, testUserId);
    
    await bot.sendMessage(chatId, `🧪 Test conversion sequence started for user ${testUserId}
    
📊 Sequence details:
• Message 1: 5 minutes (Price anchoring)
• Message 2: 15 minutes (Social proof + urgency)
• Message 3: 30 minutes (Loss aversion)
• Message 4: 1 hour (Final urgency)

🔍 Monitor console logs for delivery confirmation`);
    
  } catch (error) {
    console.error("Error in test conversion:", error);
    await bot.sendMessage(chatId, "❌ Error testing conversion system");
  }
}

// Show conversion system status
async function conversionStatus(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Check admin permissions
  if (!isAdmin(userId)) {
    await bot.sendMessage(chatId, "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះ។");
    return;
  }

  try {
    const ConversionOptimizer = require("../services/conversion-optimizer");
    const conversionOptimizer = new ConversionOptimizer();
    
    // Get users with recent pricing views
    const recentViewers = await User.find({
      isPaid: false,
      lastPricingView: { $exists: true, $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ lastPricingView: -1 });
    
    const activeSequences = conversionOptimizer.activeSequences || {};
    const activeCount = Object.keys(activeSequences).length;
    
    const statusMessage = `🎯 CONVERSION SYSTEM STATUS

📊 Active Follow-up Sequences: ${activeCount}
👥 Recent Pricing Viewers (24h): ${recentViewers.length}

🔥 Recent Viewers:
${recentViewers.slice(0, 5).map(user => 
  `• ${user.telegramId}: ${user.pricingViews || 0} views, last: ${user.lastPricingView.toLocaleString()}`
).join('\n')}

⚡ System Features:
• Auto-trigger on /pricing for unpaid users
• 4-message sequence: 5min → 15min → 30min → 1hour
• Auto-cancel when user converts
• Tracks pricing views and follow-up counts

🧪 Test Commands:
• /test_conversion [userID] - Test with specific user
• /conversion_stats - View conversion analytics
• /admin_interested - See users who viewed pricing`;

    await bot.sendMessage(chatId, statusMessage);
  } catch (error) {
    console.error("Error in conversion status:", error);
    await bot.sendMessage(chatId, "❌ Error getting conversion status");
  }
}

module.exports = {
  conversionStats,
  interestedUsers,
  sendUrgentMessage,
  testConversionSystem,
  conversionStatus
};