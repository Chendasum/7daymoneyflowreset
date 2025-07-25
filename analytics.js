const { db } = require('../server/storage');
const { users, progress } = require('../shared/schema');
const { eq, gte, count, or, isNull, and } = require('drizzle-orm');

async function getStats() {
  try {
    const stats = {};
    
    // Total users
    const totalUsersResult = await db.select({ count: count() }).from(users);
    stats.totalUsers = totalUsersResult[0].count;
    
    // Paid users
    const paidUsersResult = await db.select({ count: count() }).from(users).where(eq(users.isPaid, true));
    stats.paidUsers = paidUsersResult[0].count;
    
    // VIP users
    const vipUsersResult = await db.select({ count: count() }).from(users).where(eq(users.isVip, true));
    stats.vipUsers = vipUsersResult[0].count;
    
    // Active users (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsersResult = await db.select({ count: count() }).from(users).where(gte(users.lastActive, sevenDaysAgo));
    stats.activeUsers = activeUsersResult[0].count;
    
    // Program completion rates
    const totalProgressResult = await db.select({ count: count() }).from(progress);
    const completedProgramsResult = await db.select({ count: count() }).from(progress).where(eq(progress.programCompleted, true));
    const totalProgress = totalProgressResult[0].count;
    const completedPrograms = completedProgramsResult[0].count;
    stats.completionRate = totalProgress > 0 ? (completedPrograms / totalProgress * 100).toFixed(2) : 0;
    
    // Day-by-day completion
    stats.dayCompletions = {};
    const dayResult0 = await db.select({ count: count() }).from(progress).where(eq(progress.day0Completed, true));
    const dayResult1 = await db.select({ count: count() }).from(progress).where(eq(progress.day1Completed, true));
    const dayResult2 = await db.select({ count: count() }).from(progress).where(eq(progress.day2Completed, true));
    const dayResult3 = await db.select({ count: count() }).from(progress).where(eq(progress.day3Completed, true));
    const dayResult4 = await db.select({ count: count() }).from(progress).where(eq(progress.day4Completed, true));
    const dayResult5 = await db.select({ count: count() }).from(progress).where(eq(progress.day5Completed, true));
    const dayResult6 = await db.select({ count: count() }).from(progress).where(eq(progress.day6Completed, true));
    const dayResult7 = await db.select({ count: count() }).from(progress).where(eq(progress.day7Completed, true));
    
    stats.dayCompletions = {
      day0: dayResult0[0].count,
      day1: dayResult1[0].count,
      day2: dayResult2[0].count,
      day3: dayResult3[0].count,
      day4: dayResult4[0].count,
      day5: dayResult5[0].count,
      day6: dayResult6[0].count,
      day7: dayResult7[0].count
    };
    
    // Revenue calculation by tier - handle null/undefined tiers
    const essentialTierResult = await db.select({ count: count() }).from(users).where(eq(users.tier, 'essential'));
    const premiumTierResult = await db.select({ count: count() }).from(users).where(eq(users.tier, 'premium'));
    const vipTierResult = await db.select({ count: count() }).from(users).where(eq(users.tier, 'vip'));
    
    // Handle legacy users without tier info - paid users without tier assumed to be essential
    const legacyPaidUsersResult = await db.select({ count: count() }).from(users)
      .where(and(eq(users.isPaid, true), or(isNull(users.tier), eq(users.tier, 'free'))));
    
    const essentialUsers = essentialTierResult[0].count + legacyPaidUsersResult[0].count;
    const premiumUsers = premiumTierResult[0].count;
    const vipUsers = vipTierResult[0].count;
    
    stats.tiers = {
      essential: essentialUsers,
      premium: premiumUsers,
      vip: vipUsers
    };
    
    stats.revenue = {
      essential: essentialUsers * 47,
      premium: premiumUsers * 97,
      vip: vipUsers * 197,
      total: (essentialUsers * 47) + (premiumUsers * 97) + (vipUsers * 197)
    };
    
    // User engagement by day - simplified for now
    stats.engagement = {};
    for (let i = 0; i <= 7; i++) {
      const dayResult = await db.select({ count: count() }).from(progress).where(eq(progress.currentDay, i));
      stats.engagement[`day${i}`] = dayResult[0].count;
    }
    
    // Recent sign-ups (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSignupsResult = await db.select({ count: count() }).from(users).where(gte(users.joinedAt, thirtyDaysAgo));
    stats.recentSignups = recentSignupsResult[0].count;
    
    // Monthly recurring revenue by tier
    const currentMonth = new Date();
    currentMonth.setDate(1);
    
    const monthlyEssentialResult = await db.select({ count: count() }).from(users)
      .where(eq(users.tier, 'essential'))
      .where(gte(users.paymentDate, currentMonth));
    const monthlyPremiumResult = await db.select({ count: count() }).from(users)
      .where(eq(users.tier, 'premium'))
      .where(gte(users.paymentDate, currentMonth));
    const monthlyVipResult = await db.select({ count: count() }).from(users)
      .where(eq(users.tier, 'vip'))
      .where(gte(users.paymentDate, currentMonth));
    
    // Handle legacy paid users for monthly calculation
    const monthlyLegacyResult = await db.select({ count: count() }).from(users)
      .where(and(
        eq(users.isPaid, true),
        or(isNull(users.tier), eq(users.tier, 'free')),
        gte(users.paymentDate, currentMonth)
      ));
    
    const monthlyEssential = monthlyEssentialResult[0].count + monthlyLegacyResult[0].count;
    const monthlyPremium = monthlyPremiumResult[0].count;
    const monthlyVip = monthlyVipResult[0].count;
    
    stats.monthlyRevenue = {
      essential: monthlyEssential * 47,
      premium: monthlyPremium * 97,
      vip: monthlyVip * 197,
      total: (monthlyEssential * 47) + (monthlyPremium * 97) + (monthlyVip * 197)
    };
    
    return stats;
    
  } catch (error) {
    console.error('Error getting analytics stats:', error);
    throw error;
  }
}

async function getUserJourney(userId) {
  try {
    const userResult = await db.select().from(users).where(eq(users.telegramId, userId));
    const progressResult = await db.select().from(progress).where(eq(progress.userId, userId));
    
    if (!userResult || userResult.length === 0 || !progressResult || progressResult.length === 0) {
      return null;
    }
    
    const user = userResult[0];
    const prog = progressResult[0];
    
    const journey = {
      user: {
        name: user.firstName || 'Anonymous',
        joinedAt: user.joinedAt,
        isPaid: user.isPaid,
        isVip: user.isVip,
        lastActive: user.lastActive
      },
      progress: {
        currentDay: prog.currentDay,
        completedDays: [],
        programCompleted: prog.programCompleted,
        programCompletedAt: prog.programCompletedAt
      },
      responses: prog.responses || {}
    };
    
    // Add completed days
    const dayFields = ['day0Completed', 'day1Completed', 'day2Completed', 'day3Completed', 'day4Completed', 'day5Completed', 'day6Completed', 'day7Completed'];
    const dayCompletedAts = ['day0CompletedAt', 'day1CompletedAt', 'day2CompletedAt', 'day3CompletedAt', 'day4CompletedAt', 'day5CompletedAt', 'day6CompletedAt', 'day7CompletedAt'];
    
    for (let i = 0; i <= 7; i++) {
      if (prog[dayFields[i]]) {
        journey.progress.completedDays.push({
          day: i,
          completedAt: prog[dayCompletedAts[i]]
        });
      }
    }
    
    return journey;
    
  } catch (error) {
    console.error('Error getting user journey:', error);
    throw error;
  }
}

async function getDailyReport() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newUsersResult = await db.select({ count: count() }).from(users)
      .where(gte(users.joinedAt, today));
    
    const newPaymentsResult = await db.select({ count: count() }).from(users)
      .where(gte(users.paymentDate, today))
      .where(eq(users.isPaid, true));
    
    const activeUsersResult = await db.select({ count: count() }).from(users)
      .where(gte(users.lastActive, today));
    
    const report = {
      date: today.toISOString().split('T')[0],
      newUsers: newUsersResult[0].count,
      activeUsers: activeUsersResult[0].count,
      messagesSent: activeUsersResult[0].count, // Simplified
      payments: newPaymentsResult[0].count
    };
    
    return report;
    
  } catch (error) {
    console.error('Error getting daily report:', error);
    const todayStr = new Date().toISOString().split('T')[0];
    return {
      date: todayStr,
      newUsers: 0,
      activeUsers: 0,
      messagesSent: 0,
      payments: 0
    };
  }
}

module.exports = { getStats, getUserJourney, getDailyReport };
