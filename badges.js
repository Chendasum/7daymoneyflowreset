const User = require("../models/User");
const Progress = require("../models/Progress");
const progressBadges = require("../services/progress-badges"); // Service for generating badges and progress displays
const emojiReactions = require("../services/emoji-reactions"); // Service for sending emoji reactions

/**
 * Handles the /badges command to show a user's comprehensive progress badges and status.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function showBadges(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Get user data from the database
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.sendMessage(chatId, "សូមចុច /start ដើម្បីចាប់ផ្តើមកម្មវិធី។");
      return;
    }

    // Get progress data for the user
    const progress = await Progress.findOne({ userId: userId });
    if (!progress) {
      await bot.sendMessage(
        chatId,
        "រកមិនឃើញព័ត៌មានការរីកចម្រើន។ សូមចុច /start ដើម្បីចាប់ផ្តើម។",
      );
      return;
    }

    // Calculate completion percentage and send an initial emoji reaction
    const completedDays = progress.daysCompleted || []; // Ensure it's an array
    const progressPercentage = (completedDays.length / 7) * 100;
    const progressReaction =
      emojiReactions.progressUpdateReaction(progressPercentage);
    await bot.sendMessage(chatId, progressReaction);

    // Generate and send the comprehensive progress display after a short delay
    setTimeout(async () => {
      const progressDisplay =
        progressBadges.generateComprehensiveProgressDisplay(user, {
          currentDay: progress.currentDay,
          completedDays: completedDays,
          isPaid: user.isPaid,
        });

      await bot.sendMessage(chatId, progressDisplay);
    }, 500); // 0.5-second delay for better user experience

    // Update user's last active timestamp
    await User.findOneAndUpdate(
      { telegramId: userId },
      { lastActive: new Date() },
    );
  } catch (error) {
    console.error("Error in badges command:", error);
    await bot.sendMessage(
      chatId,
      "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។ សូមសាកល្បងម្តងទៀតនៅពេលក្រោយ។",
    ); // Improved Khmer error message
  }
}

/**
 * Handles the /progress command, which is an alias for /badges.
 * It calls the showBadges function to display the user's progress.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function showProgress(msg, bot) {
  await showBadges(msg, bot); // Delegate to showBadges function
}

/**
 * Handles the /milestones command to show all available milestones and the user's completion status for each.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function showMilestones(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Get user data
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.sendMessage(chatId, "សូមចុច /start ដើម្បីចាប់ផ្តើមកម្មវិធី។");
      return;
    }

    // Get user's progress data
    const progress = await Progress.findOne({ userId: userId });
    // Ensure completedDays is an array, even if not present in progress
    const completedDays = progress ? progress.daysCompleted || [] : [];

    let milestonesDisplay = "🏅 សមិទ្ធផលទាំងអស់:\n\n";

    // Loop through each day (1 to 7) to display its milestone status
    for (let day = 1; day <= 7; day++) {
      const milestone = progressBadges.milestones[`day${day}`];
      // Check if the current day is in the user's completedDays array
      const isCompleted = completedDays.includes(day);

      if (milestone) {
        // Ensure milestone data exists
        if (isCompleted) {
          milestonesDisplay += `✅ ${milestone.emoji} ${milestone.name}\n   ${milestone.reward}\n\n`;
        } else {
          milestonesDisplay += `⚪ ${milestone.emoji} ${milestone.name}\n   ${milestone.reward}\n\n`;
        }
      }
    }

    // Add special program-level milestones
    milestonesDisplay += "🎯 សមិទ្ធផលពិសេស:\n";
    milestonesDisplay += `${completedDays.length >= 3 ? "✅" : "⚪"} 🔥 អ្នកកំពុងធ្វើល្អណាស់ Badge - បាន ៣ ថ្ងៃ\n`;
    milestonesDisplay += `${completedDays.length >= 5 ? "✅" : "⚪"} 💪 អ្នកខ្លាំង Badge - បាន ៥ ថ្ងៃ\n`;
    milestonesDisplay += `${completedDays.length === 7 ? "✅" : "⚪"} 🏆 Champion Badge - បញ្ចប់ពេញលេញ\n`;

    await bot.sendMessage(chatId, milestonesDisplay);

    // Update user's last active timestamp
    await User.findOneAndUpdate(
      { telegramId: userId },
      { lastActive: new Date() },
    );
  } catch (error) {
    console.error("Error in milestones command:", error);
    await bot.sendMessage(
      chatId,
      "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។ សូមសាកល្បងម្តងទៀតនៅពេលក្រោយ។",
    ); // Improved Khmer error message
  }
}

/**
 * Handles the /streak command to show the user's current completion streak.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function showStreak(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Get user data
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.sendMessage(chatId, "សូមចុច /start ដើម្បីចាប់ផ្តើមកម្មវិធី។");
      return;
    }

    // Get user's progress data
    const progress = await Progress.findOne({ userId: userId });
    // Ensure completedDays is an array
    const completedDays = progress ? progress.daysCompleted || [] : [];

    // Calculate the current streak
    const streak = progressBadges.calculateStreak(completedDays);
    let streakDisplay = "🔥 ការធ្វើបន្តបន្ទាប់របស់អ្នក:\n\n";

    if (streak > 0) {
      // Generate and add the visual streak badge
      streakDisplay += progressBadges.generateStreakBadge(streak) + "\n\n";

      // Add motivational messages based on streak length
      if (streak >= 7) {
        streakDisplay += "🏆 អបអរសាទរ! អ្នកបានបញ្ចប់ទាំងអស់!";
      } else if (streak >= 5) {
        streakDisplay += "💪 អស្ចារ្យ! អ្នកជិតបាន!";
      } else if (streak >= 3) {
        streakDisplay += "🔥 ល្អណាស់! បន្តទៅ!";
      } else {
        streakDisplay += "👏 ការចាប់ផ្តើមល្អ!";
      }
    } else {
      streakDisplay +=
        "🎯 មិនទាន់មានការធ្វើបន្តបន្ទាប់។\nចាប់ផ្តើមរៀនដើម្បីបង្កើតការធ្វើបន្តបន្ទាប់!";
    }

    await bot.sendMessage(chatId, streakDisplay);

    // Update user's last active timestamp
    await User.findOneAndUpdate(
      { telegramId: userId },
      { lastActive: new Date() },
    );
  } catch (error) {
    console.error("Error in streak command:", error);
    await bot.sendMessage(
      chatId,
      "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។ សូមសាកល្បងម្តងទៀតនៅពេលក្រោយ។",
    ); // Improved Khmer error message
  }
}

// Export all functions that need to be accessible from other modules (e.g., index.js)
module.exports = { showBadges, showProgress, showMilestones, showStreak };
