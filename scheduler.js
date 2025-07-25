const { db } = require('../server/storage');
const { users, progress } = require('../shared/schema');
const { eq } = require('drizzle-orm');
const { dailyMessages } = require('../commands/daily');

async function sendDailyMessages(bot) {
  try {
    // Get all users who should receive daily messages
    const paidUsers = await db.select().from(users).where(eq(users.isPaid, true));
    
    for (const user of paidUsers) {
      const userProgress = await db.select().from(progress).where(eq(progress.userId, user.telegramId));
      
      if (!userProgress || userProgress.length === 0) continue;
      
      const prog = userProgress[0];
      
      // Determine which day message to send (starting from day 1)
      let dayToSend = null;
      
      if (prog.readyForDay1 && !prog.day1Completed) {
        dayToSend = 1;
      } else if (prog.day1Completed && !prog.day2Completed) {
        dayToSend = 2;
      } else if (prog.day2Completed && !prog.day3Completed) {
        dayToSend = 3;
      } else if (prog.day3Completed && !prog.day4Completed) {
        dayToSend = 4;
      } else if (prog.day4Completed && !prog.day5Completed) {
        dayToSend = 5;
      } else if (prog.day5Completed && !prog.day6Completed) {
        dayToSend = 6;
      } else if (prog.day6Completed && !prog.day7Completed) {
        dayToSend = 7;
      }
      
      if (dayToSend && dailyMessages[dayToSend]) {
        try {
          await bot.sendMessage(user.telegramId, dailyMessages[dayToSend]);
          console.log(`✅ Sent day ${dayToSend} message to user ${user.telegramId}`);
          
          // Update last active
          await db.update(users)
            .set({ lastActive: new Date() })
            .where(eq(users.telegramId, user.telegramId));
          
        } catch (error) {
          console.error(`❌ Failed to send message to user ${user.telegramId}:`, error);
        }
      }
    }
    
  } catch (error) {
    console.error('Error in sendDailyMessages:', error);
  }
}

async function sendReminders(bot) {
  try {
    // Get users who haven't completed yesterday's task
    const paidUsers = await db.select().from(users).where(eq(users.isPaid, true));
    
    for (const user of paidUsers) {
      const userProgress = await db.select().from(progress).where(eq(progress.userId, user.telegramId));
      
      if (!userProgress || userProgress.length === 0) continue;
      
      const prog = userProgress[0];
      
      // Check if user is stuck on a day for more than 24 hours
      const now = new Date();
      const daysSinceLastActivity = (now - user.lastActive) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastActivity > 1) {
        const reminderMessage = `🔔 រំលឹក: 7-Day Money Flow Reset™

${user.firstName ? `សួស្តី ${user.firstName}!` : 'សួស្តី!'}

អ្នកមិនទាន់បានបន្តកម្មវិធីទេ។ កុំបាត់បង់ momentum!

ចុចនេះដើម្បីបន្ត: /day${prog.currentDay}

យើងនៅទីនេះជួយអ្នក! 💪`;

        try {
          await bot.sendMessage(user.telegramId, reminderMessage);
          console.log(`✅ Sent reminder to user ${user.telegramId}`);
        } catch (error) {
          console.error(`❌ Failed to send reminder to user ${user.telegramId}:`, error);
        }
      }
    }
    
  } catch (error) {
    console.error('Error in sendReminders:', error);
  }
}

module.exports = { sendDailyMessages, sendReminders };
