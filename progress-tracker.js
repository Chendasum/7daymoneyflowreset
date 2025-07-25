const User = require("../models/User");
const Progress = require("../models/Progress");
const { sendLongMessage } = require("../utils/message-splitter"); // Import sendLongMessage utility

// Define a consistent message chunk size for splitting messages
const MESSAGE_CHUNK_SIZE = 800;

/**
 * Admin command: Shows a report of paid users who are "stuck" on specific days.
 * A user is considered "stuck" if they are on a particular day and haven't been active for more than 2 days.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function showStuckUsers(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    );
    return;
  }

  try {
    const users = await User.find({ isPaid: true }); // Find all paid users
    let stuckReport = `🚨 អ្នកប្រើប្រាស់ដែលជាប់គាំងលើថ្ងៃជាក់លាក់\n\n`;

    for (let day = 1; day <= 7; day++) {
      // Iterate through each day of the 7-day program
      const stuckUsers = [];

      for (const user of users) {
        const progress = await Progress.findOne({ userId: user.telegramId });
        if (!progress) continue; // Skip if no progress data found for the user

        const daysSinceLastActive =
          (new Date() - user.lastActive) / (1000 * 60 * 60 * 24);

        // Check if user is currently on this day and has been inactive for more than 2 days
        if (progress.currentDay === day && daysSinceLastActive > 2) {
          stuckUsers.push({
            name: `${user.firstName || "N/A"} ${user.lastName || ""}`,
            id: user.telegramId,
            daysStuck: Math.floor(daysSinceLastActive), // Number of days inactive
          });
        }
      }

      if (stuckUsers.length > 0) {
        stuckReport += `📅 ថ្ងៃទី ${day} (${stuckUsers.length} នាក់ជាប់គាំង):\n`;
        stuckUsers.forEach((user) => {
          stuckReport += `• ${user.name} (ID: ${user.id}) - ជាប់គាំង ${user.daysStuck} ថ្ងៃ\n`;
        });
        stuckReport += `\n`;
      }
    }

    // If no users are found to be stuck, provide a positive message
    if (stuckReport === `🚨 អ្នកប្រើប្រាស់ដែលជាប់គាំងលើថ្ងៃជាក់លាក់\n\n`) {
      stuckReport += `✅ គ្មានអ្នកប្រើប្រាស់ណាម្នាក់ជាប់គាំងទេ! គ្រប់គ្នាដំណើរការបានល្អ។\n`;
    }

    await sendLongMessage(
      bot,
      msg.chat.id,
      stuckReport,
      {},
      MESSAGE_CHUNK_SIZE,
    );
  } catch (error) {
    console.error("Error in showStuckUsers:", error);
    await bot.sendMessage(
      msg.chat.id,
      "❌ មានបញ្ហាក្នុងការពិនិត្យអ្នកប្រើប្រាស់ដែលជាប់គាំង។",
    ); // Improved Khmer error message
  }
}

/**
 * Admin command: Shows completion rates for each day of the program.
 * Calculates the percentage of paid users who have completed each day.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function showCompletionRates(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    );
    return;
  }

  try {
    const paidUsers = await User.find({ isPaid: true }); // Get all paid users
    const totalPaidUsers = paidUsers.length;

    let completionReport = `📊 អត្រាបញ្ចប់តាមថ្ងៃ\n\n`;
    completionReport += `👥 ចំនួនអ្នកប្រើប្រាស់បានទូទាត់សរុប: ${totalPaidUsers}\n\n`;

    for (let day = 1; day <= 7; day++) {
      // Iterate through each day
      let completed = 0;
      let current = 0;

      for (const user of paidUsers) {
        const progress = await Progress.findOne({ userId: user.telegramId });
        if (!progress) continue;

        // Check if the day is marked as completed
        if (progress[`day${day}Completed`]) {
          // Using direct field for completion
          completed++;
        } else if (progress.currentDay === day) {
          current++; // User is currently on this day
        }
      }

      const completionRate =
        totalPaidUsers > 0 ? Math.round((completed / totalPaidUsers) * 100) : 0;

      completionReport += `📅 ថ្ងៃទី ${day}:\n`;
      completionReport += `• ✅ បានបញ្ចប់: ${completed} នាក់ (${completionRate}%)\n`;
      completionReport += `• 🔄 កំពុងដំណើរការ: ${current} នាក់\n`;
      completionReport += `• ❌ មិនទាន់ចាប់ផ្តើម: ${totalPaidUsers - completed - current} នាក់\n\n`;
    }

    await sendLongMessage(
      bot,
      msg.chat.id,
      completionReport,
      {},
      MESSAGE_CHUNK_SIZE,
    );
  } catch (error) {
    console.error("Error in showCompletionRates:", error);
    await bot.sendMessage(
      msg.chat.id,
      "❌ មានបញ្ហាក្នុងការពិនិត្យអត្រាបញ្ចប់។",
    ); // Improved Khmer error message
  }
}

/**
 * Admin command: Sends a manual reminder to users stuck on a specific day.
 * Allows for an optional custom message.
 * @param {Object} msg - The Telegram message object.
 * @param {Array} match - The regex match array containing the day number and optional custom message.
 * @param {Object} bot - The Telegram bot instance.
 */
async function sendManualReminder(msg, match, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    );
    return;
  }

  const parts = match[1].split(" ");
  const day = parseInt(parts[0]);
  const customMessage = parts.slice(1).join(" "); // Join remaining parts as custom message

  if (isNaN(day) || day < 1 || day > 7) {
    await bot.sendMessage(
      msg.chat.id,
      "❌ ទម្រង់មិនត្រឹមត្រូវ: /admin_remind [លេខថ្ងៃ] [សារផ្ទាល់ខ្លួន (ស្រេចតែចិត្ត)]",
    ); // Improved Khmer error message
    return;
  }

  try {
    const users = await User.find({ isPaid: true });
    let remindersSent = 0;

    for (const user of users) {
      const progress = await Progress.findOne({ userId: user.telegramId });
      if (!progress) continue;

      const daysSinceLastActive =
        (new Date() - user.lastActive) / (1000 * 60 * 60 * 24);

      // Send reminder to users currently on this day and inactive for more than 1 day
      if (progress.currentDay === day && daysSinceLastActive > 1) {
        const reminderMessage =
          customMessage ||
          `🔔 រំលឹក: 7-Day Money Flow Reset™

សួស្តី ${user.firstName || "មិត្ត"}! 👋

អ្នកកំពុងនៅលើ ថ្ងៃទី ${day} ហើយ! 📅
យើងកត់សម្គាល់ឃើញថា អ្នកមិនទាន់បញ្ចប់ ថ្ងៃទី ${day} នៅឡើយទេ។

🎯 ចាំបាច់ធ្វើថ្ងៃនេះ:
• បើកមើលមេរៀន ថ្ងៃទី ${day}
• ធ្វើតាមការណែនាំ
• សរសេរ "DAY ${day} COMPLETE" នៅពេលបញ្ចប់

💪 កុំបោះបង់! អ្នកនៅជិតដល់គោលដៅហើយ!

❓ ត្រូវការជំនួយ? សរសេរមក @Chendasum`;

        try {
          await bot.sendMessage(user.telegramId, reminderMessage);
          remindersSent++;
        } catch (error) {
          console.error(
            `Failed to send reminder to ${user.telegramId}:`,
            error,
          );
        }
      }
    }

    await bot.sendMessage(
      msg.chat.id,
      `✅ បានផ្ញើរំលឹកទៅអ្នកប្រើប្រាស់ ${remindersSent} នាក់ (ថ្ងៃទី ${day})។`,
    ); // Confirmation message
  } catch (error) {
    console.error("Error in sendManualReminder:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ញើរំលឹក។"); // Improved Khmer error message
  }
}

/**
 * Admin command: Shows a list of users who have completed the entire program.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function showCompletedUsers(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    );
    return;
  }

  try {
    const users = await User.find({ isPaid: true });
    const completedUsers = [];

    for (const user of users) {
      const progress = await Progress.findOne({ userId: user.telegramId });
      // Check if programComplete flag is true
      if (progress && progress.programCompleted) {
        completedUsers.push({
          name: `${user.firstName || "N/A"} ${user.lastName || ""}`,
          id: user.telegramId,
          completedAt: progress.programCompletedAt || "មិនស្គាល់", // Use "Unknown" if date not available
          isVip: user.isVip, // Assuming isVip field exists in User model
        });
      }
    }

    let completedReport = `🎉 អ្នកប្រើប្រាស់ដែលបានបញ្ចប់កម្មវិធី\n\n`;
    completedReport += `✅ ចំនួនសរុបបានបញ្ចប់: ${completedUsers.length} នាក់\n\n`;

    if (completedUsers.length > 0) {
      completedUsers.forEach((user) => {
        const vipStatus = user.isVip ? " 🌟 VIP" : "";
        completedReport += `• ${user.name} (ID: ${user.id})${vipStatus}\n`;
        completedReport += `  បានបញ្ចប់: ${user.completedAt instanceof Date ? user.completedAt.toDateString() : user.completedAt}\n\n`;
      });
    } else {
      completedReport += `😔 មិនទាន់មានអ្នកប្រើប្រាស់ណាម្នាក់បានបញ្ចប់កម្មវិធីនៅឡើយទេ។\n`; // Improved Khmer message
    }

    await sendLongMessage(
      bot,
      msg.chat.id,
      completedReport,
      {},
      MESSAGE_CHUNK_SIZE,
    );
  } catch (error) {
    console.error("Error in showCompletedUsers:", error);
    await bot.sendMessage(
      msg.chat.id,
      "❌ មានបញ្ហាក្នុងការពិនិត្យអ្នកប្រើប្រាស់ដែលបានបញ្ចប់។",
    ); // Improved Khmer error message
  }
}

/**
 * Admin command: Shows a summary of photo/document uploads by all paid users.
 * Tracks how many users have uploaded and the total number of uploads.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function showUploadTracking(msg, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    );
    return;
  }

  try {
    const users = await User.find({ isPaid: true });
    let uploadReport = `📸 របាយការណ៍តាមដានការផ្ទុកឡើង\n\n`;

    let totalUploads = 0;
    let usersWithUploads = 0;
    const userUploadDetails = []; // To store details for each user

    for (const user of users) {
      const progress = await Progress.findOne({ userId: user.telegramId });
      if (!progress) continue;

      let userUploadCount = 0;
      let uploadDetailsString = "";

      for (let day = 1; day <= 7; day++) {
        const photoUploadField = `day${day}PhotoUploaded`;
        const photoUploadTimeField = `day${day}PhotoUploadedAt`;

        if (progress[photoUploadField]) {
          userUploadCount++;
          totalUploads++;
          const uploadTime = progress[photoUploadTimeField];
          uploadDetailsString += `• ថ្ងៃទី ${day}: ✅ ${uploadTime ? new Date(uploadTime).toDateString() : "មិនស្គាល់"}\n`;
        }
      }

      if (userUploadCount > 0) {
        usersWithUploads++;
        userUploadDetails.push({
          name: `${user.firstName || "N/A"}`,
          id: user.telegramId,
          count: userUploadCount,
          details: uploadDetailsString,
        });
      }
    }

    // Construct the final report summary
    if (usersWithUploads === 0) {
      uploadReport += `😔 មិនទាន់មានអ្នកប្រើប្រាស់ណាម្នាក់បានផ្ទុកឡើងរូបភាព/ឯកសារនៅឡើយទេ។\n`;
    } else {
      uploadReport = `📸 របាយការណ៍តាមដានការផ្ទុកឡើង\n\n📊 សរុប:\n• អ្នកប្រើប្រាស់ដែលមានការផ្ទុកឡើង: ${usersWithUploads} នាក់\n• ចំនួនការផ្ទុកឡើងសរុប: ${totalUploads}\n\n`;
      userUploadDetails.forEach((user) => {
        uploadReport += `👤 ${user.name} (ID: ${user.id}) - ${user.count} ការផ្ទុកឡើង\n`;
        uploadReport += user.details + "\n";
      });
    }

    await sendLongMessage(
      bot,
      msg.chat.id,
      uploadReport,
      {},
      MESSAGE_CHUNK_SIZE,
    );
  } catch (error) {
    console.error("Error in showUploadTracking:", error);
    await bot.sendMessage(
      msg.chat.id,
      "❌ មានបញ្ហាក្នុងការពិនិត្យការផ្ទុកឡើង។",
    ); // Improved Khmer error message
  }
}

/**
 * Admin command: Shows detailed photo/document upload information for a specific user.
 * @param {Object} msg - The Telegram message object.
 * @param {Array} match - The regex match array containing the user ID.
 * @param {Object} bot - The Telegram bot instance.
 */
async function showUserPhotos(msg, match, bot) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    );
    return;
  }

  const userId = parseInt(match[1]); // Extract user ID from command

  try {
    const user = await User.findOne({ telegramId: userId });
    const progress = await Progress.findOne({ userId: userId });

    if (!user) {
      await bot.sendMessage(
        msg.chat.id,
        `❌ រកមិនឃើញអ្នកប្រើប្រាស់ ID: ${userId}។`,
      ); // User not found
      return;
    }

    let photosReport = `📸 របាយការណ៍ការផ្ទុកឡើងរូបភាព\n\n`;
    photosReport += `👤 អ្នកប្រើប្រាស់: ${user.firstName || "N/A"} ${user.lastName || ""} (ID: ${userId})\n\n`;

    if (!progress) {
      photosReport += `❌ មិនមានទិន្នន័យវឌ្ឍនភាពត្រូវបានរកឃើញទេ។\n`; // No progress data
      await bot.sendMessage(msg.chat.id, photosReport);
      return;
    }

    let hasUploads = false;

    for (let day = 1; day <= 7; day++) {
      const photoUploadField = `day${day}PhotoUploaded`;
      const photoUploadTimeField = `day${day}PhotoUploadedAt`;

      if (progress[photoUploadField]) {
        hasUploads = true;
        const uploadTime = progress[photoUploadTimeField];
        photosReport += `📅 ថ្ងៃទី ${day}: ✅ បានផ្ទុកឡើង\n`;
        photosReport += `• ពេលវេលា: ${uploadTime ? new Date(uploadTime).toLocaleString() : "មិនស្គាល់"}\n`;

        // Show additional upload details if available in uploadData
        if (progress.uploadData && progress.uploadData[`day${day}`]) {
          const uploadInfo = progress.uploadData[`day${day}`];
          if (uploadInfo.caption) {
            photosReport += `• ចំណងជើង: ${uploadInfo.caption}\n`;
          }
          if (uploadInfo.fileName) {
            photosReport += `• ឯកសារ: ${uploadInfo.fileName}\n`;
          }
        }
        photosReport += "\n";
      } else {
        photosReport += `📅 ថ្ងៃទី ${day}: ❌ មិនមានការផ្ទុកឡើង\n\n`;
      }
    }

    if (!hasUploads) {
      photosReport += `😔 មិនទាន់មានរូបភាព ឬឯកសារត្រូវបានផ្ទុកឡើងនៅឡើយទេ។\n`; // No uploads found for this user
    }

    await sendLongMessage(
      bot,
      msg.chat.id,
      photosReport,
      {},
      MESSAGE_CHUNK_SIZE,
    );
  } catch (error) {
    console.error("Error in showUserPhotos:", error);
    await bot.sendMessage(
      msg.chat.id,
      "❌ មានបញ្ហាក្នុងការពិនិត្យរូបភាពអ្នកប្រើប្រាស់។",
    ); // Improved Khmer error message
  }
}

/**
 * Helper function to check if a user is an admin.
 * @param {number} userId - The Telegram ID of the user.
 * @returns {boolean} - True if the user is an admin, false otherwise.
 */
function isAdmin(userId) {
  const adminIds = [176039, 484389665]; // Your admin IDs
  return adminIds.includes(userId);
}

// Export all functions that need to be accessible from other modules (e.g., index.js)
module.exports = {
  showStuckUsers,
  showCompletionRates,
  sendManualReminder,
  showCompletedUsers,
  showUploadTracking,
  showUserPhotos,
};
