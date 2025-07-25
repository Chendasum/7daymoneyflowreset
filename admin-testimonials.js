/**
 * Admin Testimonial Management Commands
 * Revenue optimization through testimonial collection and management
 */

const User = require('../models/User');
const TestimonialCollector = require('../services/testimonial-collector');
const RevenueOptimizer = require('../services/revenue-optimizer');

const testimonialCollector = new TestimonialCollector();
const revenueOptimizer = new RevenueOptimizer();

/**
 * Check if user is admin
 */
function isAdmin(userId) {
  const adminIds = [176039, 484389665];
  return adminIds.includes(userId);
}

/**
 * Show testimonial analytics and management
 */
async function showTestimonials(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    await bot.sendMessage(chatId, "🔒 Access denied. Admin only.");
    return;
  }

  try {
    const statsMessage = await testimonialCollector.getTestimonialStatsMessage();
    await bot.sendMessage(chatId, statsMessage);

    // Show recent testimonials
    const recentTestimonials = await getRecentTestimonials(5);
    if (recentTestimonials.length > 0) {
      let recentMessage = `📝 *Recent Testimonials (Last 5):*\n\n`;
      
      recentTestimonials.forEach((t, index) => {
        const tierBadge = revenueOptimizer.tierManager.getTierBadge(t.tier);
        recentMessage += `${index + 1}. ${tierBadge} *${t.userName}* (Day ${t.dayNumber})\n`;
        recentMessage += `"${t.content.substring(0, 100)}..."\n\n`;
      });

      await bot.sendMessage(chatId, recentMessage);
    }

    // Show management options
    const managementMessage = `🔧 *Testimonial Management:*

• /admin_testimonials_export - Export all testimonials
• /admin_testimonials_social - Get social media ready posts
• /admin_testimonials_stats - Detailed statistics
• /admin_testimonials_requests - View testimonial requests
• /admin_testimonials_search [keyword] - Search testimonials
• /admin_testimonials_tier [tier] - View by tier

Use these commands to manage testimonials for marketing.`;

    await bot.sendMessage(chatId, managementMessage);

  } catch (error) {
    console.error('Error showing testimonials:', error);
    await bot.sendMessage(chatId, 'មានបញ្ហាក្នុងការទទួលយកទិន្នន័យ។');
  }
}

/**
 * Export testimonials for marketing use
 */
async function exportTestimonials(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    await bot.sendMessage(chatId, "🔒 Access denied. Admin only.");
    return;
  }

  try {
    const users = await User.findAll();
    let exportData = [];

    users.forEach(user => {
      if (user.testimonials && user.testimonials.length > 0) {
        user.testimonials.forEach(testimonial => {
          exportData.push({
            userName: user.username || 'Anonymous',
            telegramId: user.telegramId,
            tier: user.tier || 'essential',
            dayNumber: testimonial.dayNumber,
            content: testimonial.content,
            createdAt: testimonial.createdAt,
            socialMediaReady: revenueOptimizer.formatTestimonialForSharing({
              content: testimonial.content,
              userName: user.username || 'Anonymous',
              dayNumber: testimonial.dayNumber,
              tier: user.tier || 'essential'
            })
          });
        });
      }
    });

    // Sort by most recent
    exportData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Create CSV format
    let csvContent = 'Date,User,Tier,Day,Content,Social Media Ready\n';
    exportData.forEach(item => {
      csvContent += `"${item.createdAt}","${item.userName}","${item.tier}","${item.dayNumber}","${item.content.replace(/"/g, '""')}","${item.socialMediaReady.replace(/"/g, '""')}"\n`;
    });

    // Send as file (simplified version for chat)
    const exportMessage = `📊 *Testimonial Export (${exportData.length} total)*

Recent testimonials ready for marketing:

${exportData.slice(0, 10).map((item, index) => `${index + 1}. ${revenueOptimizer.tierManager.getTierBadge(item.tier)} *${item.userName}* (Day ${item.dayNumber})
"${item.content.substring(0, 150)}..."

Social Media Ready:
${item.socialMediaReady}

---`).join('\n')}

Full data exported. Use for marketing campaigns.`;

    await bot.sendMessage(chatId, exportMessage);

  } catch (error) {
    console.error('Error exporting testimonials:', error);
    await bot.sendMessage(chatId, 'មានបញ្ហាក្នុងការនាំចេញទិន្នន័យ។');
  }
}

/**
 * Get social media ready testimonials
 */
async function getSocialMediaPosts(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    await bot.sendMessage(chatId, "🔒 Access denied. Admin only.");
    return;
  }

  try {
    const users = await User.findAll();
    let socialPosts = [];

    users.forEach(user => {
      if (user.testimonials && user.testimonials.length > 0) {
        user.testimonials.forEach(testimonial => {
          socialPosts.push({
            post: revenueOptimizer.formatTestimonialForSharing({
              content: testimonial.content,
              userName: user.username || 'Anonymous',
              dayNumber: testimonial.dayNumber,
              tier: user.tier || 'essential'
            }),
            tier: user.tier,
            createdAt: testimonial.createdAt
          });
        });
      }
    });

    // Sort by most recent and get top 5
    socialPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const topPosts = socialPosts.slice(0, 5);

    let socialMessage = `📱 *Social Media Ready Posts (Top 5):*\n\n`;
    
    topPosts.forEach((item, index) => {
      socialMessage += `*Post ${index + 1}:*\n${item.post}\n\n---\n\n`;
    });

    socialMessage += `📈 *Usage Tips:*
• Copy and paste to Facebook, Instagram, LinkedIn
• Use hashtags: #7DayMoneyFlowReset #FinancialSuccess
• Post during peak hours (6-9 PM Cambodia time)
• Engage with comments to build community

Total available posts: ${socialPosts.length}`;

    await bot.sendMessage(chatId, socialMessage);

  } catch (error) {
    console.error('Error getting social media posts:', error);
    await bot.sendMessage(chatId, 'មានបញ្ហាក្នុងការទទួលយកទិន្នន័យ។');
  }
}

/**
 * Show testimonial requests status
 */
async function showTestimonialRequests(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    await bot.sendMessage(chatId, "🔒 Access denied. Admin only.");
    return;
  }

  try {
    const users = await User.findAll();
    let requestStats = {
      totalRequests: 0,
      responded: 0,
      pending: 0,
      byDay: {},
      pendingUsers: []
    };

    users.forEach(user => {
      if (user.testimonialRequests && user.testimonialRequests.length > 0) {
        user.testimonialRequests.forEach(request => {
          requestStats.totalRequests++;
          const day = request.dayNumber || 'unknown';
          requestStats.byDay[day] = (requestStats.byDay[day] || 0) + 1;
          
          if (request.responded) {
            requestStats.responded++;
          } else {
            requestStats.pending++;
            requestStats.pendingUsers.push({
              userName: user.username || 'Anonymous',
              telegramId: user.telegramId,
              dayNumber: request.dayNumber,
              requestedAt: request.requestedAt
            });
          }
        });
      }
    });

    const responseRate = requestStats.totalRequests > 0 ? 
      (requestStats.responded / requestStats.totalRequests * 100).toFixed(1) : 0;

    let requestMessage = `📋 *Testimonial Requests Status*

📊 *Overview:*
• Total Requests: ${requestStats.totalRequests}
• Responded: ${requestStats.responded}
• Pending: ${requestStats.pending}
• Response Rate: ${responseRate}%

📅 *By Day:*
${Object.entries(requestStats.byDay).map(([day, count]) => `• Day ${day}: ${count} requests`).join('\n')}

⏰ *Pending Responses:*
${requestStats.pendingUsers.slice(0, 10).map(user => `• ${user.userName} (${user.telegramId}) - Day ${user.dayNumber}`).join('\n')}

${requestStats.pendingUsers.length > 10 ? `... and ${requestStats.pendingUsers.length - 10} more` : ''}

💡 *Follow-up Strategy:*
• Send reminder messages to pending users
• Offer incentives for testimonial completion
• Follow up after 24-48 hours`;

    await bot.sendMessage(chatId, requestMessage);

  } catch (error) {
    console.error('Error showing testimonial requests:', error);
    await bot.sendMessage(chatId, 'មានបញ្ហាក្នុងការទទួលយកទិន្នន័យ។');
  }
}

/**
 * Search testimonials by keyword
 */
async function searchTestimonials(msg, match, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    await bot.sendMessage(chatId, "🔒 Access denied. Admin only.");
    return;
  }

  const keyword = match[1]?.toLowerCase();
  if (!keyword) {
    await bot.sendMessage(chatId, 'សូមបញ្ចូលពាក្យគន្លឹះ៖ /admin_testimonials_search [keyword]');
    return;
  }

  try {
    const users = await User.findAll();
    let searchResults = [];

    users.forEach(user => {
      if (user.testimonials && user.testimonials.length > 0) {
        user.testimonials.forEach(testimonial => {
          if (testimonial.content.toLowerCase().includes(keyword)) {
            searchResults.push({
              userName: user.username || 'Anonymous',
              telegramId: user.telegramId,
              tier: user.tier || 'essential',
              dayNumber: testimonial.dayNumber,
              content: testimonial.content,
              createdAt: testimonial.createdAt
            });
          }
        });
      }
    });

    if (searchResults.length === 0) {
      await bot.sendMessage(chatId, `🔍 រកមិនឃើញលទ្ធផលសម្រាប់ "${keyword}"`);
      return;
    }

    // Sort by most recent
    searchResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let searchMessage = `🔍 *Search Results for "${keyword}" (${searchResults.length} found)*\n\n`;
    
    searchResults.slice(0, 10).forEach((result, index) => {
      const tierBadge = revenueOptimizer.tierManager.getTierBadge(result.tier);
      searchMessage += `${index + 1}. ${tierBadge} *${result.userName}* (Day ${result.dayNumber})\n`;
      searchMessage += `"${result.content}"\n\n`;
    });

    if (searchResults.length > 10) {
      searchMessage += `... and ${searchResults.length - 10} more results`;
    }

    await bot.sendMessage(chatId, searchMessage);

  } catch (error) {
    console.error('Error searching testimonials:', error);
    await bot.sendMessage(chatId, 'មានបញ្ហាក្នុងការស្វែងរក។');
  }
}

/**
 * View testimonials by tier
 */
async function viewTestimonialsByTier(msg, match, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    await bot.sendMessage(chatId, "🔒 Access denied. Admin only.");
    return;
  }

  const tier = match[1]?.toLowerCase();
  if (!tier || !['essential', 'premium', 'vip'].includes(tier)) {
    await bot.sendMessage(chatId, 'សូមបញ្ចូលកម្រិត៖ /admin_testimonials_tier [essential|premium|vip]');
    return;
  }

  try {
    const users = await User.findAll();
    let tierTestimonials = [];

    users.forEach(user => {
      if ((user.tier || 'essential') === tier && user.testimonials && user.testimonials.length > 0) {
        user.testimonials.forEach(testimonial => {
          tierTestimonials.push({
            userName: user.username || 'Anonymous',
            telegramId: user.telegramId,
            dayNumber: testimonial.dayNumber,
            content: testimonial.content,
            createdAt: testimonial.createdAt
          });
        });
      }
    });

    if (tierTestimonials.length === 0) {
      await bot.sendMessage(chatId, `${revenueOptimizer.tierManager.getTierBadge(tier)} រកមិនឃើញ testimonials សម្រាប់ ${tier} tier`);
      return;
    }

    // Sort by most recent
    tierTestimonials.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let tierMessage = `${revenueOptimizer.tierManager.getTierBadge(tier)} *${tier.toUpperCase()} Tier Testimonials (${tierTestimonials.length} total)*\n\n`;
    
    tierTestimonials.slice(0, 8).forEach((result, index) => {
      tierMessage += `${index + 1}. *${result.userName}* (Day ${result.dayNumber})\n`;
      tierMessage += `"${result.content.substring(0, 150)}..."\n\n`;
    });

    if (tierTestimonials.length > 8) {
      tierMessage += `... and ${tierTestimonials.length - 8} more testimonials`;
    }

    await bot.sendMessage(chatId, tierMessage);

  } catch (error) {
    console.error('Error viewing testimonials by tier:', error);
    await bot.sendMessage(chatId, 'មានបញ្ហាក្នុងការទទួលយកទិន្នន័យ។');
  }
}

/**
 * Helper function to get recent testimonials
 */
async function getRecentTestimonials(limit = 5) {
  const users = await User.findAll();
  let recentTestimonials = [];

  users.forEach(user => {
    if (user.testimonials && user.testimonials.length > 0) {
      user.testimonials.forEach(testimonial => {
        recentTestimonials.push({
          userName: user.username || 'Anonymous',
          telegramId: user.telegramId,
          tier: user.tier || 'essential',
          dayNumber: testimonial.dayNumber,
          content: testimonial.content,
          createdAt: testimonial.createdAt
        });
      });
    }
  });

  return recentTestimonials
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

module.exports = {
  showTestimonials,
  exportTestimonials,
  getSocialMediaPosts,
  showTestimonialRequests,
  searchTestimonials,
  viewTestimonialsByTier
};