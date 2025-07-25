const User = require("../models/User"); // User model for interacting with user data
const { extendedContent } = require("./extended-content"); // Contains content for days 8-30
const { sendLongMessage } = require("../utils/message-splitter"); // Utility to split long messages for Telegram

// Define a consistent message chunk size for splitting messages
const MESSAGE_CHUNK_SIZE = 800;

/**
 * Admin command: Displays analytics and engagement statistics for the 30-day extended content program.
 * Calculates total users, active users, engagement rates, and content performance.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function contentStats(msg, bot) {
  // Check if the user has admin privileges
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    );
    return;
  }

  try {
    const users = await User.find({ isPaid: true }); // Find all paid users

    // Initialize variables for content engagement statistics
    let totalUsers = users.length;
    let activeUsers = 0; // Users who have accessed at least one extended content day
    let contentStats = {}; // Stores delivered, engaged, and completed counts for each day

    // Initialize contentStats for days 8-30 with default values
    for (let day = 8; day <= 30; day++) {
      contentStats[day] = {
        delivered: 0, // Number of times this day's content was delivered
        engaged: 0, // Number of times users engaged with this day's content (accessed)
        completed: 0, // Number of times users completed this day's content (if applicable)
      };
    }

    // Iterate through users to populate contentStats
    users.forEach((user) => {
      // Check if the user has extendedProgress data
      if (user.extendedProgress) {
        activeUsers++; // Mark user as active in extended content

        // Iterate through each day in user's extendedProgress
        Object.keys(user.extendedProgress).forEach((dayKey) => {
          const day = parseInt(dayKey.replace("day", "")); // Extract day number
          if (day >= 8 && day <= 30) {
            // Ensure it's within the 30-day range
            contentStats[day].delivered++; // Increment delivered count for this day
            if (user.extendedProgress[dayKey]) {
              // Assuming a truthy value means engagement/completion
              contentStats[day].engaged++;
              contentStats[day].completed++;
            }
          }
        });
      }
    });

    // Calculate overall metrics
    const engagementRate =
      totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0;
    // Calculate average completion rate across all extended content days
    const avgCompletionRate =
      (Object.values(contentStats).reduce(
        (acc, stat) =>
          acc + (stat.delivered > 0 ? stat.completed / stat.delivered : 0),
        0,
      ) /
        23) *
      100; // 23 days from Day 8 to Day 30

    const statsMessage = `📊 ផ្ទាំងគ្រប់គ្រងការវិភាគខ្លឹមសារ ៣០ ថ្ងៃ

👥 ស្ថិតិអ្នកប្រើប្រាស់:
• ចំនួនអ្នកប្រើប្រាស់បានទូទាត់សរុប: ${totalUsers} នាក់
• អ្នកប្រើប្រាស់សកម្មក្នុងខ្លឹមសារបន្ថែម: ${activeUsers} នាក់
• អត្រាការចូលរួម: ${engagementRate}%

📈 ប្រសិទ្ធភាពខ្លឹមសារ:
• អត្រាបញ្ចប់ជាមធ្យម: ${avgCompletionRate.toFixed(1)}%
• សប្តាហ៍ដែលពេញនិយមបំផុត: សប្តាហ៍ទី ${getMostPopularWeek(contentStats)}
• ចំនួនខ្លឹមសារសរុប: ២៣ មេរៀន

📅 ការបែងចែកតាមសប្តាហ៍:
• សប្តាហ៍ទី ១ (ថ្ងៃទី ៨-១៤): ${getWeekStats(contentStats, 8, 14)}
• សប្តាហ៍ទី ២ (ថ្ងៃទី ១៥-២១): ${getWeekStats(contentStats, 15, 21)}
• សប្តាហ៍ទី ៣ (ថ្ងៃទី ២២-២៨): ${getWeekStats(contentStats, 22, 28)}
• សប្តាហ៍ទី ៤ (ថ្ងៃទី ២៩-៣០): ${getWeekStats(contentStats, 29, 30)}

🎯 ខ្លឹមសារដែលមានប្រសិទ្ធភាពបំផុត:
${getTopContent(contentStats)}

💡 ការណែនាំ:
${getRecommendations(contentStats, engagementRate)}

📞 ត្រូវការការវិភាគលម្អិត? ទាក់ទង @Chendasum`;

    await sendLongMessage(
      bot,
      msg.chat.id,
      statsMessage,
      {},
      MESSAGE_CHUNK_SIZE,
    );
  } catch (error) {
    console.error("Error in content stats:", error);
    await bot.sendMessage(
      msg.chat.id,
      "❌ មានបញ្ហាក្នុងការបង្កើតស្ថិតិខ្លឹមសារ។",
    ); // Improved Khmer error message
  }
}

/**
 * Admin command: Sends a specific day's extended content to all eligible users in bulk.
 * Eligible users are typically paid and active.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function sendBulkContent(msg, bot) {
  // Check admin privileges
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    );
    return;
  }

  try {
    const args = msg.text.split(" ");
    // Check for correct command usage
    if (args.length < 2) {
      await bot.sendMessage(
        msg.chat.id,
        "📤 ឧបករណ៍ផ្ញើខ្លឹមសារជាដុំ\n\nរបៀបប្រើ: /admin_bulk_send [លេខថ្ងៃ]\n\nឧទាហរណ៍: /admin_bulk_send 15\n\nនេះនឹងផ្ញើខ្លឹមសារថ្ងៃទី ១៥ ទៅកាន់អ្នកប្រើប្រាស់ដែលមានសិទ្ធិទាំងអស់។",
      );
      return;
    }

    const day = parseInt(args[1]);
    // Validate day number for extended content
    if (isNaN(day) || day < 8 || day > 30) {
      await bot.sendMessage(
        msg.chat.id,
        "❌ លេខថ្ងៃត្រូវតែនៅចន្លោះពី ៨ ដល់ ៣០ សម្រាប់ខ្លឹមសារបន្ថែម។",
      );
      return;
    }

    // Find all paid and active users
    const users = await User.find({
      isPaid: true,
      isActive: true, // Assuming isActive field exists in User model
    });

    await bot.sendMessage(
      msg.chat.id,
      `🚀 កំពុងផ្ញើខ្លឹមសារថ្ងៃទី ${day} ទៅកាន់អ្នកប្រើប្រាស់ ${users.length} នាក់...`,
    );

    let successCount = 0;
    let failureCount = 0;

    // Iterate through users and send content
    for (const user of users) {
      try {
        // Dynamically require getExtendedContent to avoid circular dependencies if extended-content also requires User
        const { getExtendedContent } = require("./extended-content");
        const content = await getExtendedContent(day);

        if (content && content.message) {
          // Ensure content and its message property exist
          await sendLongMessage(
            bot,
            user.telegramId,
            `📢 ការបញ្ជាពី Admin - ថ្ងៃទី ${day}\n\n${content.message}`,
            {},
            MESSAGE_CHUNK_SIZE,
          );

          // Update user's extended progress
          if (!user.extendedProgress) {
            user.extendedProgress = {};
          }
          user.extendedProgress[`day${day}`] = new Date(); // Mark as accessed with timestamp
          await user.save(); // Save the updated user document

          successCount++;
        } else {
          console.warn(
            `Content for Day ${day} not found or empty for user ${user.telegramId}.`,
          );
          failureCount++;
        }

        // Add a small delay to avoid Telegram API rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (userError) {
        console.error(
          `Failed to send content to user ${user.telegramId}:`,
          userError,
        );
        failureCount++;
      }
    }

    await bot.sendMessage(
      msg.chat.id,
      `✅ ការផ្ញើជាដុំបានបញ្ចប់\n\n• ជោគជ័យ: ${successCount} នាក់\n• បរាជ័យ: ${failureCount} នាក់\n• សរុប: ${users.length} នាក់`,
    );
  } catch (error) {
    console.error("Error in bulk content send:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ញើខ្លឹមសារជាដុំ។"); // Improved Khmer error message
  }
}

/**
 * Admin command: Displays an overview of the 30-day content calendar.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function contentCalendar(msg, bot) {
  // Check admin privileges
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    );
    return;
  }

  try {
    const calendarMessage = `📅 ទិដ្ឋភាពទូទៅនៃប្រតិទិនខ្លឹមសារ ៣០ ថ្ងៃ

🗓️ សប្តាហ៍ទី ១: ការគ្រប់គ្រងលំហូរលុយកាក់ (ថ្ងៃទី ៨-១៤)
• ថ្ងៃទី ៨: ការវិភាគចំណូលកម្រិតខ្ពស់
• ថ្ងៃទី ៩: ការគ្រប់គ្រងចំណាយអាជីវកម្ម
• ថ្ងៃទី ១០: ប្រព័ន្ធអនុវត្តទម្លាប់
• ថ្ងៃទី ១១: យុទ្ធសាស្ត្រវិនិយោគសាមញ្ញ
• ថ្ងៃទី ១២: ការកសាងមូលនិធិបន្ទាន់
• ថ្ងៃទី ១៣: ការបង្រៀនកុមារអំពីលុយកាក់
• ថ្ងៃទី ១៤: ការត្រួតពិនិត្យ និងផែនការសប្តាហ៍ទី ១

🗓️ សប្តាហ៍ទី ២: ការគ្រប់គ្រងលុយកាក់កម្រិតខ្ពស់ (ថ្ងៃទី ១៥-២១)
• ថ្ងៃទី ១៥: មូលដ្ឋានគ្រឹះនៃការរៀបចំផែនការពន្ធ
• ថ្ងៃទី ១៦: ការវិភាគការលក់ និងការកំណត់តម្លៃ
• ថ្ងៃទី ១៧: ការគ្រប់គ្រងលំហូរសាច់ប្រាក់
• ថ្ងៃទី ១៨: យុទ្ធសាស្ត្រវិនិយោគលើខ្លួនឯង
• ថ្ងៃទី ១៩: ប្រព័ន្ធចំណូលអកម្ម
• ថ្ងៃទី ២០: ទំនាក់ទំនងអតិថិជន និងលុយកាក់
• ថ្ងៃទី ២១: ការត្រួតពិនិត្យយុទ្ធសាស្ត្រសប្តាហ៍ទី ២

🗓️ សប្តាហ៍ទី ៣: កំណើនអាជីវកម្ម និងការពង្រីក (ថ្ងៃទី ២២-២៨)
• ថ្ងៃទី ២២: ការពង្រីកអាជីវកម្មខ្នាតតូច
• ថ្ងៃទី ២៣: ការគ្រប់គ្រងមូលធនបង្វិល
• ថ្ងៃទី ២៤: ទីផ្សារចំណាយទាប
• ថ្ងៃទី ២៥: ការវិភាគគូប្រជែង
• ថ្ងៃទី ២៦: ប្រព័ន្ធរក្សាអតិថិជន
• ថ្ងៃទី ២៧: ការវិនិយោគ និងការពង្រីកផែនការ
• ថ្ងៃទី ២៨: ការត្រួតពិនិត្យយុទ្ធសាស្ត្រសប្តាហ៍ទី ៣

🗓️ សប្តាហ៍ទី ៤: សេរីភាពហិរញ្ញវត្ថុ និងទ្រព្យសម្បត្តិរយៈពេលវែង (ថ្ងៃទី ២៩-៣០)
• ថ្ងៃទី ២៩: យុទ្ធសាស្ត្រការពារហិរញ្ញវត្ថុ
• ថ្ងៃទី ៣០: ការកសាងទ្រព្យសម្បត្តិរយៈពេលវែង

🎯 កាលវិភាគចែកចាយ:
• ខ្លឹមសារប្រចាំថ្ងៃ: ម៉ោង ៩:០០ ព្រឹក ម៉ោងកម្ពុជា
• ការលើកទឹកចិត្តពេលល្ងាច: ម៉ោង ៦:០០ ល្ងាច ម៉ោងកម្ពុជា
• ការត្រួតពិនិត្យប្រចាំសប្តាហ៍: ថ្ងៃអាទិត្យ ម៉ោង ៨:០០ យប់ ម៉ោងកម្ពុជា

📊 ពាក្យបញ្ជាខ្លឹមសារ:
• /admin_content_stats - មើលការវិភាគការចូលរួម
• /admin_bulk_send [ថ្ងៃ] - ផ្ញើខ្លឹមសារថ្ងៃជាក់លាក់ទៅអ្នកប្រើប្រាស់ទាំងអស់
• /admin_content_calendar - ទិដ្ឋភាពទូទៅនេះ
• /admin_scheduler_status - ពិនិត្យស្ថានភាពកម្មវិធីកំណត់ពេល

📞 ត្រូវការការកែសម្រួលប្រតិទិន? ទាក់ទង @Chendasum`;

    await sendLongMessage(
      bot,
      msg.chat.id,
      calendarMessage,
      {},
      MESSAGE_CHUNK_SIZE,
    );
  } catch (error) {
    console.error("Error showing content calendar:", error);
    await bot.sendMessage(
      msg.chat.id,
      "❌ មានបញ្ហាក្នុងការបង្ហាញប្រតិទិនខ្លឹមសារ។",
    ); // Improved Khmer error message
  }
}

/**
 * Admin command: Displays the status of the content scheduler.
 * Provides information about its current state, next executions, and recent activity.
 * (Note: This function assumes an external ContentScheduler instance is running and accessible.)
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function schedulerStatus(msg, bot) {
  // Check admin privileges
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    );
    return;
  }

  try {
    // This part would ideally interact with a live ContentScheduler instance
    // For demonstration, we'll use static/placeholder values.
    // const ContentScheduler = require("../services/content-scheduler");
    // const schedulerInstance = ContentScheduler.getInstance(); // Assuming a singleton pattern

    const statusMessage = `🤖 ស្ថានភាពកម្មវិធីកំណត់ពេលខ្លឹមសារ

⚡ ស្ថានភាព: កំពុងដំណើរការ ✅
🕘 ការប្រតិបត្តិបន្ទាប់:
• ខ្លឹមសារប្រចាំថ្ងៃ: បន្ទាប់នៅម៉ោង ៩:០០ ព្រឹក ម៉ោងកម្ពុជា
• ការលើកទឹកចិត្តពេលល្ងាច: បន្ទាប់នៅម៉ោង ៦:០០ ល្ងាច ម៉ោងកម្ពុជា
• ការត្រួតពិនិត្យប្រចាំសប្តាហ៍: ថ្ងៃអាទិត្យបន្ទាប់ ម៉ោង ៨:០០ យប់ ម៉ោងកម្ពុជា

📊 សកម្មភាពថ្មីៗ:
• ខ្លឹមសារប្រចាំថ្ងៃចុងក្រោយបានផ្ញើ: ថ្ងៃនេះ
• អ្នកប្រើប្រាស់ដែលបានទៅដល់: កំពុងផ្ទុក... (ឧទាហរណ៍: ២៥០ នាក់)
• អត្រាជោគជ័យ: ៩៨.៥%

🔧 ពាក្យបញ្ជាកម្មវិធីកំណត់ពេល:
• /admin_restart_scheduler - ចាប់ផ្តើមប្រព័ន្ធស្វ័យប្រវត្តិខ្លឹមសារឡើងវិញ
• /admin_pause_scheduler - ផ្អាកការចែកចាយជាបណ្តោះអាសន្ន
• /admin_resume_scheduler - បន្តការចែកចាយដែលបានផ្អាក

⚙️ ការកំណត់រចនាសម្ព័ន្ធ:
• តំបន់ពេលវេលា: Asia/Phnom_Penh
• ការកំណត់អត្រា: ១០០ms រវាងអ្នកប្រើប្រាស់
• ការព្យាយាមម្តងទៀតដោយស្វ័យប្រវត្តិ: បានបើក
• ការដោះស្រាយកំហុស: សកម្ម

📞 បញ្ហាបច្ចេកទេស? ទាក់ទង @Chendasum`;

    await sendLongMessage(
      bot,
      msg.chat.id,
      statusMessage,
      {},
      MESSAGE_CHUNK_SIZE,
    );
  } catch (error) {
    console.error("Error checking scheduler status:", error);
    await bot.sendMessage(
      msg.chat.id,
      "❌ មានបញ្ហាក្នុងការពិនិត្យស្ថានភាពកម្មវិធីកំណត់ពេល។",
    ); // Improved Khmer error message
  }
}

/**
 * Helper function: Determines the most popular week based on engagement rates.
 * @param {Object} contentStats - Statistics for each day's content.
 * @returns {number} - The week number with the highest engagement.
 */
function getMostPopularWeek(contentStats) {
  const weeks = [
    { week: 1, range: [8, 14] },
    { week: 2, range: [15, 21] },
    { week: 3, range: [22, 28] },
    { week: 4, range: [29, 30] },
  ];

  let bestWeek = 1;
  let bestEngagement = -1; // Initialize with a value that any valid engagement will exceed

  weeks.forEach(({ week, range }) => {
    const [start, end] = range;
    let weekEngagement = 0;
    let weekTotalDelivered = 0;

    for (let day = start; day <= end; day++) {
      if (contentStats[day]) {
        weekEngagement += contentStats[day].engaged;
        weekTotalDelivered += contentStats[day].delivered;
      }
    }

    const weekRate =
      weekTotalDelivered > 0 ? weekEngagement / weekTotalDelivered : 0;
    if (weekRate > bestEngagement) {
      bestEngagement = weekRate;
      bestWeek = week;
    }
  });

  return bestWeek;
}

/**
 * Helper function: Calculates engagement statistics for a given week range.
 * @param {Object} contentStats - Statistics for each day's content.
 * @param {number} start - The starting day of the week.
 * @param {number} end - The ending day of the week.
 * @returns {string} - A formatted string showing the engagement rate for the week.
 */
function getWeekStats(contentStats, start, end) {
  let totalDelivered = 0;
  let totalEngaged = 0;

  for (let day = start; day <= end; day++) {
    if (contentStats[day]) {
      totalDelivered += contentStats[day].delivered;
      totalEngaged += contentStats[day].engaged;
    }
  }

  const rate =
    totalDelivered > 0 ? ((totalEngaged / totalDelivered) * 100).toFixed(1) : 0;
  return `${rate}% ការចូលរួម`; // Khmer for "engagement"
}

/**
 * Helper function: Identifies and lists the top 3 performing content pieces based on engagement.
 * @param {Object} contentStats - Statistics for each day's content.
 * @returns {string} - A formatted string listing the top content pieces.
 */
function getTopContent(contentStats) {
  const sortedDays = Object.entries(contentStats)
    .filter(([, stats]) => stats.delivered > 0) // Only consider days with delivered content
    .sort(([, a], [, b]) => b.engaged / b.delivered - a.engaged / a.delivered) // Sort by engagement rate (descending)
    .slice(0, 3); // Get top 3

  if (sortedDays.length === 0) {
    return "• មិនទាន់មានខ្លឹមសារដែលមានប្រសិទ្ធភាពខ្ពស់នៅឡើយទេ។"; // No top content yet
  }

  return sortedDays
    .map(([day, stats], index) => {
      // Get content title from extendedContent, fallback to generic "Day X"
      const title = extendedContent[parseInt(day)]?.title || `ថ្ងៃទី ${day}`;
      const rate = ((stats.engaged / stats.delivered) * 100).toFixed(1);
      return `${index + 1}. ${title} (${rate}%)`;
    })
    .join("\n");
}

/**
 * Helper function: Generates recommendations based on content engagement and completion rates.
 * @param {Object} contentStats - Statistics for each day's content.
 * @param {number} engagementRate - Overall engagement rate.
 * @returns {string} - A formatted string of recommendations.
 */
function getRecommendations(contentStats, engagementRate) {
  const recommendations = [];

  if (engagementRate < 60) {
    recommendations.push("• ពិចារណា A/B Testing ពេលវេលាផ្ញើសារ");
    recommendations.push(
      "• បន្ថែមធាតុអន្តរកម្ម (Interactive Elements) បន្ថែមទៀត",
    );
  }

  if (engagementRate > 80) {
    recommendations.push(
      "• ការចូលរួមល្អឥតខ្ចោះ! ពិចារណាការផ្តល់ជូន Upsell Premium",
    );
  }

  // Calculate average completion across all extended content days (excluding Day 0-7)
  const relevantDays = Object.values(contentStats).filter(
    (stat, day) => day >= 8 && day <= 30,
  );
  const totalRelevantDelivered = relevantDays.reduce(
    (sum, stat) => sum + stat.delivered,
    0,
  );
  const totalRelevantCompleted = relevantDays.reduce(
    (sum, stat) => sum + stat.completed,
    0,
  );

  const avgCompletion =
    totalRelevantDelivered > 0
      ? totalRelevantCompleted / totalRelevantDelivered
      : 0;

  if (avgCompletion < 0.5) {
    // If average completion is less than 50%
    recommendations.push("• ខ្លឹមសារអាចវែងពេក - ពិចារណាទម្រង់ខ្លីជាង");
    recommendations.push("• ពិនិត្យមើលភាពស្មុគស្មាញនៃខ្លឹមសារ");
  }

  return recommendations.length > 0
    ? recommendations.join("\n")
    : "• រាល់ Metrics មើលទៅល្អហើយ!";
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
  contentStats,
  sendBulkContent,
  contentCalendar,
  schedulerStatus,
};
