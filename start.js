const User = require("../models/User"); // User model for interacting with user data
const Progress = require("../models/Progress"); // Progress model for tracking user program progress
const TierManager = require("../services/tier-manager"); // Service to manage user tiers and get tier-specific messages
const { sendLongMessage } = require("../utils/message-splitter"); // Utility to split long messages for Telegram

const tierManager = new TierManager(); // Instantiate TierManager
const MESSAGE_CHUNK_SIZE = 800; // Define as a constant for consistency in message splitting

// Enhanced message for unpaid users (Telegram bot) - Cleaned and formatted
const unpaidStartMessage = `🎉 ស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

🚨 ចង់ដឹងទេ? អ្នកកំពុងខាតបង់លុយរាល់ថ្ងៃដោយមិនដឹងខ្លួន...

💸 ជាមធ្យម អ្នកប្រើប្រាស់នៅកម្ពុជាបាត់បង់ $300-800 ក្នុង ១ ខែ ដោយមិនដឹងខ្លួន!

តើរឿងទាំងនេះកើតឡើងដែរឬទេ?
❌ ចំណាយហើយ... មិនដឹងថាទៅកន្លែងណា
❌ ចង់សន្សំ ប៉ុន្តែលុយអស់ជានិច្ច
❌ មិនដឹងថាលុយនឹងគ្រប់ ឬអត់គ្រប់
❌ ចង់បានជីវិតហិរញ្ញវត្ថុជាថ្មី

💡 គន្លឹះឥតគិតថ្លៃភ្លាមៗ: បោះបង់ការជាវ (Subscription) ដែលមិនប្រើ ១ = សន្សំ $120+/ឆ្នាំ!

🏆 រឿងរ៉ាវជោគជ័យពីអ្នកប្រើប្រាស់នៅកម្ពុជា:
👤 "ខ្ញុំបានរកឃើញ money leaks កន្លែងលុយលេចធ្លាយ ដែលមិនបានដឹងខ្លួន!" - សុខា, ភ្នំពេញ
👤 "ការគ្រប់គ្រងលុយរបស់ខ្ញុំកាន់តែប្រសើរឡើងៗ!" - សុភី, សៀមរាប

🔥 អ្នកដែលចូលរួម និងអនុវត្តបានល្អ តែងតែឃើញការកែប្រែ!

🚨 ការផ្តល់ជូនពិសេសសម្រាប់ការចាប់ផ្តើម: តែ $24 USD (ធម្មតា $47)
💰 អ្នកសន្សំបាន: $23 (បញ្ចុះ ៥០%!)
🔥 តែ ២០០ កន្លែងដំបូងប៉ុណ្ណោះ!

បើអ្នកចង់ផ្លាស់ប្តូរជីវិតហិរញ្ញវត្ថុ...
បើអ្នកចង់រកឃើញលុយដែលលេចធ្លាយ...

🎯 ប្រើ /pricing ដើម្បីមើលកម្មវិធី (បញ្ចុះ ៥០%!)
📞 ប្រើ /help ដើម្បីទទួលជំនួយ

⚡ បន្ទាន់! តម្លៃនេះមិនមានយូរឡើយ!`;

// Enhanced message for paid users who need preparation (Day 0) - Cleaned and formatted
const paidPreparationMessage = `🎉 ស្វាគមន៍ត្រឡប់មកវិញ សិស្ស Money Flow កម្ពុជា!

✨ អ្នកបានចូលរួម 7-Day Money Flow Reset™ ហើយ!

🚀 ក្នុងរយៈពេលតែ ៧ ថ្ងៃ (១៥-២០ នាទី/ថ្ងៃ) អ្នកនឹងទទួលបាន:

💰 លទ្ធផលភ្លាមៗ:
✅ រកឃើញកន្លែងដែលលុយលេចធ្លាយនៅថ្ងៃដំបូង
✅ បិទ money leaks ដែលធ្វើឱ្យលុយលេចធ្លាយដោយមិនដឹងខ្លួន
✅ ប្រព័ន្ធគ្រប់គ្រងលុយដែលពិតជាដំណើរការ

📊 ការផ្លាស់ប្តូររយៈពេលវែង:
✅ ផែនទីហិរញ្ញវត្ថុច្បាស់លាស់សម្រាប់អនាគត
✅ ការយល់ដឹងពីចំណាយ "រស់រាន" ទល់នឹង "លូតលាស់"
✅ ផែនការហិរញ្ញវត្ថុដែលអនុវត្តបាន
✅ ទំនុកចិត្តពេញលេញក្នុងការគ្រប់គ្រងលុយ

🎯 ជំហានសំខាន់មុនចាប់ផ្តើម:

មុនពេលចាប់ផ្តើមមេរៀនថ្ងៃទី១ អ្នកត្រូវត្រៀមចិត្តជាមុនសិន:

💭 ពិចារណាសំណួរទាំងនេះ:
• តើអ្នកត្រៀមខ្លួនរួចរាល់សម្រាប់ការផ្លាស់ប្តូរហើយឬនៅ?
• តើអ្នកមានពេល ១៥-២០ នាទីរាល់ថ្ងៃដែរឬទេ?
• តើអ្នកពិតជាចង់ដោះស្រាយបញ្ហាលុយហើយឬនៅ?
• តើអ្នកចង់ក្លាយជាអ្នកគ្រប់គ្រងលុយ (Money Manager) ឬ អ្នកកសាងទ្រព្យសម្បត្តិ (Wealth Builder)?

🔥 ត្រៀមខ្លួនរួចរាល់ហើយ? សរសេរ "READY FOR DAY 1" ដើម្បីចាប់ផ្តើម!`;

// Enhanced message for paid users who are already prepared - Cleaned and formatted
const paidReadyMessage = `🎉 ស្វាគមន៍ត្រឡប់មកវិញ Money Flow Graduate!

✨ អ្នកបានចូលរួម 7-Day Money Flow Reset™ ហើយ!

🚀 ចាប់ផ្តើមដំណើរផ្លាស់ប្តូរជីវិតហិរញ្ញវត្ថុ:

📚 ការចូលប្រើរហ័ស:
• /day1 - ចាប់ផ្តើមមេរៀនដំបូង (រកលុយភ្លាមៗ!)
• /day2 - ការកំណត់អត្តសញ្ញាណការលេចធ្លាយលុយកម្រិតខ្ពស់
• /day3 - ការពិនិត្យសុខភាពហិរញ្ញវត្ថុផ្ទាល់ខ្លួន
• /progress - មើលការរីកចម្រើនរបស់អ្នក

🏆 ការតាមដាន:
• /badges - មើលសមិទ្ធផលរបស់អ្នក
• /leaderboard - ចំណាត់ថ្នាក់អ្នកដែលមានលទ្ធផលល្អបំផុត

📞 ការគាំទ្រ:
• /help - ទទួលជំនួយភ្លាមៗ
• @Chendasum - ការគាំទ្រ VIP ដោយផ្ទាល់

🔥 ចាប់ផ្តើមឥឡូវនេះ: /day1 ឥឡូវនេះ!

💎 នៅថ្ងៃទី៧ អ្នកនឹងមានប្រព័ន្ធគ្រប់គ្រងលុយពេញលេញ!`;

/**
 * Handles the /start command. This is the entry point for users interacting with the bot.
 * It registers/updates user information, checks their payment status, and directs them
 * to the appropriate welcome message or program content.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function handle(msg, bot) {
  // Input validation: Ensure essential parameters are present
  if (!msg || !msg.from || !bot) {
    console.error("Invalid parameters in start command");
    return;
  }

  const userId = msg.from.id;
  const chatId = msg.chat.id;

  if (!userId || !chatId) {
    console.error("Missing userId or chatId");
    return;
  }

  // Analytics logging: Log when the start command is triggered
  console.log(`Start command triggered by user ${userId} at ${new Date()}`);

  try {
    // Perform database operations in parallel for better performance:
    // 1. Find and update user information (or create new user if not exists)
    // 2. Find and update user's progress (or create new progress entry if not exists)
    const [user, userProgress] = await Promise.all([
      User.findOneAndUpdate(
        { telegramId: userId },
        {
          telegramId: userId,
          username: msg.from.username,
          firstName: msg.from.first_name,
          lastName: msg.from.last_name,
          lastActive: new Date(), // Update last active timestamp
        },
        { upsert: true, new: true }, // upsert: create if not exists; new: return updated document
      ),
      Progress.findOneAndUpdate(
        { userId: userId },
        { userId: userId },
        { upsert: true, new: true },
      ),
    ]);

    // Conditional logic based on user's payment status
    if (user.isPaid) {
      // If user is paid, check if they have completed Day 0 preparation (readyForDay1)
      if (!userProgress || !userProgress.readyForDay1) {
        // Send the preparation message for paid users
        await sendLongMessage(
          bot,
          chatId,
          paidPreparationMessage,
          {},
          MESSAGE_CHUNK_SIZE,
        );
      } else {
        // If user is paid and already prepared for Day 1, send a quick access message
        await sendLongMessage(
          bot,
          chatId,
          paidReadyMessage,
          {},
          MESSAGE_CHUNK_SIZE,
        );
      }
    } else {
      // If user is not paid, show the unpaid user welcome message
      await sendLongMessage(
        bot,
        chatId,
        unpaidStartMessage,
        {},
        MESSAGE_CHUNK_SIZE,
      );
    }

    // Success logging: Confirm command completion
    console.log(`Start command completed successfully for user ${userId}`);
  } catch (error) {
    // Error handling: Log the error and send a user-friendly error message
    console.error("Error in start command:", error);

    let errorMessage =
      "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។ សូមសាកល្បងម្តងទៀតនៅពេលក្រោយ។"; // Generic error message

    // More specific error messages based on error type
    if (error.code === "ETELEGRAM") {
      errorMessage = "បញ្ហាទំនាក់ទំនងជាមួយ Telegram ។ សូមព្យាយាមម្តងទៀត។";
    } else if (error.name === "MongoError") {
      errorMessage = "បញ្ហាទិន្នន័យ។ សូមព្យាយាមម្តងទៀត។";
    }

    try {
      await bot.sendMessage(chatId, errorMessage);
    } catch (sendError) {
      // Fallback error logging if sending the error message also fails
      console.error("Failed to send error message:", sendError);
    }
  }
}

// Export the handle function to be used by the main bot file (e.g., index.js)
module.exports = { handle };
