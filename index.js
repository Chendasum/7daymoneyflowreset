require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron"); // Used for scheduling tasks

// Database connection is assumed to be handled by Drizzle ORM with PostgreSQL
console.log(
  "🔍 Database configured with Drizzle ORM and PostgreSQL (via models)",
);
console.log("✅ Database ready for operations");

// Set proper UTF-8 encoding for the environment to handle Khmer characters correctly
process.env.NODE_ICU_DATA = "/usr/share/nodejs/node-icu-data";
process.env.LANG = "en_US.UTF-8";

// --- Import Database Models ---
const User = require("./models/User");
const Progress = require("./models/Progress");

// --- Import Command Modules ---
const startCommand = require("./commands/start");
const dailyCommands = require("./commands/daily");
const paymentCommands = require("./commands/payment");
const vipCommands = require("./commands/vip");
const adminCommands = require("./commands/admin");
const badgesCommands = require("./commands/badges");
const quotesCommands = require("./commands/quotes");
const bookingCommands = require("./commands/booking");
const tierFeatures = require("./commands/tier-features");
const marketingCommands = require("./commands/marketing");
const marketingContent = require("./commands/marketing-content");
const extendedContent = require("./commands/extended-content");
const thirtyDayAdmin = require("./commands/30day-admin");
const previewCommands = require("./commands/preview");
const freeTools = require("./commands/free-tools");
const financialQuiz = require("./commands/financial-quiz");
const toolsTemplates = require("./commands/tools-templates");

// --- Import Service Modules ---
const scheduler = require("./services/scheduler");
const analytics = require("./services/analytics");
const celebrations = require("./services/celebrations");
const progressBadges = require("./services/progress-badges");
const emojiReactions = require("./services/emoji-reactions");
const AccessControl = require("./services/access-control");
const ContentScheduler = require("./services/content-scheduler");
const ConversionOptimizer = require("./services/conversion-optimizer");

// --- Import Utility Modules ---
const { sendLongMessage } = require("./utils/message-splitter");
const { default: fetch } = require("node-fetch"); // Ensure node-fetch is imported correctly

// Define a consistent message chunk size for splitting long messages
const MESSAGE_CHUNK_SIZE = 800;

// Initialize Telegram bot for webhook mode
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: false,
  onlyFirstMatch: true,
});

// DUPLICATE PREVENTION SYSTEM: Optimized for webhook mode
const processedMessages = new Set();
let lastProcessTime = {};

function isDuplicateMessage(msg) {
  // DISABLED FOR WEBHOOK MODE - Let all messages through
  console.log(`[isDuplicateMessage] Processing message: ${msg.chat.id}-${msg.message_id}`);
  return false;
}

// Express app for handling webhooks
const app = express();
const accessControl = new AccessControl();
const conversionOptimizer = new ConversionOptimizer();

// Middleware for parsing JSON and URL-encoded data with UTF-8 support
app.use(
  express.json({
    limit: "10mb",
    charset: "utf-8",
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    charset: "utf-8",
  }),
);

// Set UTF-8 headers for all outgoing responses to ensure proper character encoding
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Function to get the Railway URL
function getRailwayUrl() {
  // Always return Railway domain for production
  return "https://7daymoneyflowreset-production.up.railway.app";
}

// Enhanced bot initialization for webhook mode
async function initBotWebhook() {
  console.log("Starting bot initialization process for webhooks...");

  if (!process.env.BOT_TOKEN) {
    console.error("❌ ERROR: BOT_TOKEN is not set in env.txt!");
    console.error("Please ensure env.txt exists and contains BOT_TOKEN.");
    process.exit(1);
  } else {
    console.log("✅ BOT_TOKEN loaded successfully.");
  }

  try {
    // 1. Stop polling if active (good practice)
    try {
      await bot.stopPolling();
      console.log("Polling stopped successfully (if active).");
    } catch (stopError) {
      console.log(
        "No active polling to stop or polling was already stopped (expected).",
      );
    }

    // 2. Delete existing webhook to clear any stale configurations
    try {
      const deleteResult = await bot.deleteWebHook();
      console.log(
        "Webhook deleted successfully (via bot.deleteWebHook()):",
        deleteResult,
      );
    } catch (deleteError) {
      console.log(
        "Failed to delete webhook (via bot.deleteWebHook()):",
        deleteError.message,
      );
    }

    // 3. Construct the webhook URL - CORRECT RAILWAY DOMAIN
    const correctDomain = getRailwayUrl();
    const actualWebhookUrl = `${correctDomain}/bot${process.env.BOT_TOKEN}`;

    // Debug: Show which domain we're using
    console.log("🔍 Domain check - getReplitUrl():", getReplitUrl());
    console.log("🔍 Forced correct domain:", correctDomain);
    console.log("🔍 Using domain:", correctDomain, "(FORCED)");

    console.log(`Attempting to set webhook to: ${actualWebhookUrl}`);
    const setWebhookResult = await bot.setWebHook(actualWebhookUrl);
    console.log("✅ Webhook set successfully:", setWebhookResult);

    console.log("✅ Bot initialized successfully for webhook mode.");
  } catch (error) {
    console.error("❌ Bot initialization error for webhooks:", error.message);
    process.exit(1);
  }
}

// Wrap the main startup logic in an async IIFE to ensure proper async flow
(async () => {
  await initBotWebhook();

  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || "0.0.0.0";

  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on ${HOST}:${PORT}`);
    console.log(`🔥 7-Day Money Flow automation ACTIVE!`);
    console.log(`✅ Server is fully listening for incoming requests.`);
  });

  cron.schedule("0 9 * * *", async () => {
    console.log("🕘 Sending daily messages...");
    try {
      await scheduler.sendDailyMessages(bot);
    } catch (error) {
      console.error("Error sending daily messages via cron:", error);
    }
  });

  const contentScheduler = new ContentScheduler(bot);
  contentScheduler.start();

  console.log("🤖 Bot started successfully with 7-Day + 30-Day automation!");
  console.log("🚀 Features added:");
  console.log("   • Auto next-day reminders (24h delay)");
  console.log("   • Day 3 upsell automation (1h delay)");
  console.log("   • 30-day follow-up for results");
  console.log("   • Enhanced welcome sequence");
  console.log("   • 30-day extended content automation");
  console.log("   • Daily content delivery (9 AM Cambodia)");
  console.log("   • Evening motivation (6 PM Cambodia)");
  console.log("   • Weekly reviews (Sunday 8 PM Cambodia)");
  console.log("🔱 7-Day Money Flow Reset™ + 30-Day Extended Content READY!");

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down gracefully");
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });

  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  });
})();

// ========================================
// TELEGRAM BOT COMMAND HANDLERS
// ========================================

// EMERGENCY START HANDLER - Direct response for testing
bot.onText(/\/emergency/i, async (msg) => {
  console.log("🚨 [EMERGENCY] Emergency command received from user:", msg.from.id);
  try {
    await bot.sendMessage(msg.chat.id, "🚨 EMERGENCY RESPONSE: Bot is working! /start should work now.");
    console.log("✅ [EMERGENCY] Emergency response sent successfully");
  } catch (error) {
    console.error("❌ [EMERGENCY] Error:", error);
  }
});

// Handle /start command: WORKING DIRECT RESPONSE
bot.onText(/\/start/i, async (msg) => {
  console.log("🚀 [START] Processing /start for user:", msg.from.id);
  
  try {
    const welcomeMessage = `🌟 សូមស្វាគមន៍មកកាន់ 7-Day Money Flow Reset™!

💰 កម្មវិធីគ្រប់គ្រងលុយ ៧ ថ្ងៃ ជាភាសាខ្មែរ

🎯 តម្លៃពិសេស: $24 USD (បញ្ចុះពី $47)
📱 ប្រើប្រាស់: /pricing ដើម្បីមើលលម្អិត
💳 ទូទាត់: /payment ដើម្បីចាប់ផ្តើម

👨‍💼 ទាក់ទង: @Chendasum សម្រាប់ជំនួយ

/help - ជំនួយពេញលេញ`;

    await bot.sendMessage(msg.chat.id, welcomeMessage);
    console.log("✅ [START] Welcome message sent to user:", msg.from.id);
  } catch (error) {
    console.error("❌ [START] Error sending message:", error.message);
  }
});

// Handle /help command: WORKING DIRECT RESPONSE
bot.onText(/\/help/i, async (msg) => {
  console.log("🔧 [HELP] Processing /help for user:", msg.from.id);
  
  try {
    const helpMessage = `📋 ជំនួយ 7-Day Money Flow Reset™

🎯 ពាក្យបញ្ជាមូលដ្ឋាន:
• /start - ចាប់ផ្តើម
• /pricing - មើលតម្លៃ ($24)
• /payment - ការទូទាត់
• /help - ជំនួយនេះ

📚 កម្មវិធី ៧ ថ្ងៃ:
• /day1 - ស្គាល់ Money Flow
• /day2 - ស្វែងរក Money Leaks
• /day3 - វាយតម្លៃប្រព័ន្ធ
• /day4 - បង្កើតផែនទីលុយ
• /day5 - Survival vs Growth
• /day6 - រៀបចំផែនការ
• /day7 - Integration

👨‍💼 ទាក់ទង: @Chendasum ២៤/៧
🌐 Website: 7daymoneyflow.com`;

    await bot.sendMessage(msg.chat.id, helpMessage);
    console.log("✅ [HELP] Help message sent to user:", msg.from.id);
  } catch (error) {
    console.error("❌ [HELP] Error sending message:", error.message);
  }
});

// Handle /pricing command: WORKING DIRECT RESPONSE
bot.onText(/\/pricing/i, async (msg) => {
  console.log("💰 [PRICING] Processing /pricing for user:", msg.from.id);
  
  try {
    const pricingMessage = `💰 7-Day Money Flow Reset™ - តម្លៃពិសេស!

🎯 កម្មវិធីសាមញ្ញ (ESSENTIAL)
💵 តម្លៃ: $24 USD (បញ្ចុះពី $47)
🎁 សន្សំបាន: $23 (50% បញ្ចុះ!)

📚 អ្វីដែលអ្នកទទួលបាន:
✅ មេរៀន ៧ ថ្ងៃពេញលេញ
✅ ការគ្រប់គ្រងលុយជាភាសាខ្មែរ
✅ ស្វែងរក Money Leaks
✅ បង្កើតផែនការហិរញ្ញវត្ថុ
✅ ជំនួយពី @Chendasum

💳 ការទូទាត់:
• ABA Bank
• ACLEDA Bank  
• Wing Payment

🚨 តម្លៃពិសេសនេះមិនមានយូរឡើយ!

👉 /payment - ការណែនាំទូទាត់លម្អិត
👨‍💼 ទាក់ទង: @Chendasum ម្រាប់ជំនួយ`;

    await bot.sendMessage(msg.chat.id, pricingMessage);
    console.log("✅ [PRICING] Pricing message sent to user:", msg.from.id);
  } catch (error) {
    console.error("❌ [PRICING] Error sending message:", error.message);
  }
});

// Handle /payment command: Shows payment instructions
bot.onText(/\/payment/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await paymentCommands.instructions(msg, bot);
  } catch (error) {
    console.error("Error handling /payment command:", error);
    await bot.sendMessage(
      msg.chat.id,
      "❌ មានបញ្ហាក្នុងការផ្ទុកការណែនាំទូទាត់។",
    );
  }
});

// Handle /day command (without number): Shows an introduction to the 7-Day program
bot.onText(/^\/day$/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await User.findOne({ telegramId: msg.from.id });
    const chatId = msg.chat.id;

    if (!user || !user.isPaid) {
      await bot.sendMessage(
        chatId,
        "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }

    const progress = (await Progress.findOne({ userId: msg.from.id })) || {};

    const introMessage = `✨ 7-Day Money Flow Reset™ ✨

🎯 សូមស្វាគមន៍មកកាន់កម្មវិធីដ៏មានតម្លៃរបស់អ្នក!

🏆 តម្រុយសម្រាប់អ្នក:
┌─────────────────────────┐
│  🔱 Day 1: Money Flow    │
│    ចាប់ផ្តើមស្គាល់       │
│   Money Flow របស់អ្នក    │
│  + ចាប់ផ្តើមកែប្រែ!      │
└─────────────────────────┘

📈 ថ្ងៃទី ១ នេះអ្នកនឹងរៀន:
• ស្វែងរកកន្លែងដែលលុយលេចធ្លាយ
• យល់ដឹងពី Money Flow របស់អ្នក
• កាត់បន្ថយចំណាយមិនចាំបាច់
• ចាប់ផ្តើមដំណើរកែប្រែ

🚀 ត្រៀមចាប់ផ្តើមហើយឬនៅ?

👉 ចុច /day1 ដើម្បីចាប់ផ្តើមការផ្សងព្រេងថ្ងៃទី ១!`;

    await sendLongMessage(
      bot,
      chatId,
      introMessage,
      { parse_mode: "Markdown" },
      MESSAGE_CHUNK_SIZE,
    );

    if (progress.currentDay && progress.currentDay > 1) {
      setTimeout(async () => {
        const progressMessage = `📊 វឌ្ឍនភាពរបស់អ្នក:

🔥 ថ្ងៃបានបញ្ចប់: ${progress.currentDay - 1}/7
📈 ភាគរយបញ្ចប់: ${progress.completionPercentage || 0}%

🎯 ថ្ងៃបន្ទាប់: /day${progress.currentDay}`;
        await bot.sendMessage(chatId, progressMessage);
      }, 1500);
    }
  } catch (error) {
    console.error("Error in /day command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Handle /day1 command: YOUR ORIGINAL COMPREHENSIVE CONTENT
bot.onText(/\/day1/i, async (msg) => {
  console.log("📚 [DAY1] Processing /day1 for user:", msg.from.id);
  
  try {
    // Your original comprehensive Day 1 content from daily.js
    const day1Content = `🔱 ថ្ងៃទី ១: ចាប់ផ្តើមស្គាល់លំហូរលុយរបស់អ្នក + រកលុយភ្លាម! 🔱
---

🔥 គោលដៅថ្ងៃនេះ: រកលុយ $30-$50+ ក្នុង ២០ នាទី តាមវិធីសាស្ត្រពិតប្រាកដ!

👋 ជំរាបសួរ! ថ្ងៃនេះយើងនឹងមកយល់ដឹងអំពីលុយរបស់អ្នកឱ្យបានច្បាស់លាស់ និងរកលុយភ្លាមៗ! ចូរគិតថាវាដូចជាការស្វែងរក 'ចំណុចលេចធ្លាយលុយ' តូចៗដែលអ្នកប្រហែលជាមិនធ្លាប់ដឹង!

💎 តំបន់សកម្មភាពបន្ទាន់ (២០ នាទី)

⚡ ជំហានភ្លាមៗ (៥ នាទី): ពិនិត្យមើលការជាវឌីជីថល (Digital Subscriptions)
→ បើក Phone Settings → Subscriptions/App Store
→ រកមើលកម្មវិធីដែលអ្នកលែងប្រើប្រាស់ហើយ
→ គោលដៅ: រកឃើញ $15+ ភ្លាមៗដែលអ្នកអាចសន្សំបានរៀងរាល់ខែ

💡 ចំណុចលេចធ្លាយលុយឌីជីថលទូទៅនៅកម្ពុជា:
• Netflix/YouTube Premium មិនបានមើល: $10-15/ខែ = $120-180/ឆ្នាំ
• Spotify មិនបានស្តាប់: $10/ខែ = $120/ឆ្នាំ
• កម្មវិធីហ្គេមមិនបានលេង (PUBG/FreeFire): $5-20/ខែ = $60-240/ឆ្នាំ
• VPN/Cloud storage ភ្លេចបន្ត: $5-15/ខែ = $60-180/ឆ្នាំ

🚗 ជំហានភ្លាមៗ (១០ នាទី): ពិនិត្យទម្លាប់ចំណាយប្រចាំថ្ងៃនៅកម្ពុជា
→ Grab ចម្ងាយខ្លីក្រោម ២ គីឡូម៉ែត្រ: គិត $3-5/ដង × 10ដង = $30-50/ខែ
→ កាហ្វេហាង (Brown/Amazon): គិត $2/ថ្ងៃ × 20ថ្ងៃ = $40/ខែ
→ ថ្លៃដឹកជញ្ជូនអាហារ (FoodPanda): គិត $1-2 ថ្លៃដឹក × 15ដង = $15-30/ខែ
→ ការទិញតាម Facebook ads: ពិនិត្យមើលការចំណាយក្នុងរយៈពេល ៧ ថ្ងៃចុងក្រោយ = ?

⚡ ជំហានភ្លាមៗ (៥ នាទី): អនុវត្តឥឡូវនេះ!
→ លុបចោល ឬ បោះបង់ការជាវ (Subscription) មួយមុខឥឡូវនេះ (អ្នកនឹងភ្ញាក់ផ្អើលថាតើអ្នកសន្សំបានប៉ុន្មាន!)
→ គ្រោងជំនួស Grab ដោយជិះម៉ូតូឬរថយន្តផ្ទាល់ខ្លួន ២-៣ ដងនៅថ្ងៃស្អែក
→ គ្រោងធ្វើកាហ្វេនៅផ្ទះសម្រាប់ ៣ ថ្ងៃនេះ

📊 គណនាភ្លាមៗ - សរសេរចំនួនពិតប្រាកដ:
- ការបោះបង់ការជាវ: $____/ខែ
- កាត់បន្ថយការជិះ Grab: $____/ខែ
- កាត់បន្ថយការទិញកាហ្វេនៅហាង: $____/ខែ
- កាត់បន្ថយថ្លៃដឹកជញ្ជូនអាហារ: $____/ខែ
សរុបប្រាក់ដែលបានរកឃើញ: $____/ខែ = $____/ឆ្នាំ! (នេះជាប្រាក់ដែលអ្នកទើបតែបានរកឃើញ!)

🏆 ការធានា: រកមិនបាន $30/ខែ? ទាក់ទង @Chendasum (Telegram/WhatsApp) នឹងទទួលបានការប្រឹក្សាឥតគិតថ្លៃ!

📈 របាយការណ៍ជោគជ័យពិត (អ្នកប្រើប្រាស់នៅកម្ពុជា):

👤 លោក វិចិត្រ (៣៥ ឆ្នាំ, បុគ្គលិកការិយាល័យ, សៀមរាប):
"ខ្ញុំបានរកឃើញការជាវដែលភ្លេចតាំងពី $65/ខែ - គិតឡើងវិញហើយឥឡូវសន្សំបានច្រើន!"

---

🎯 តើហេតុអ្វីបានជាលំហូរលុយសំខាន់?

💡 លំហូរលុយ = លុយចូល - លុយចេញ = ប្រាក់សេសសល់

ជីវិតរបស់យើងប្រៀបដូចជាបង្អួចមួយ... លុយចូលមកពីទ្វារមួយ ហើយចេញពីទ្វារមួយទៀត។ បញ្ហាគឺយើងភាគច្រើនមិនដឹងថាវាចេញតាមផ្លូវណាខ្លះនោះទេ!

💰 តើលុយចូលមកពីណាខ្លះ? (៤ ប្រភេទសំខាន់)

🟢 ចំណូលទៀងទាត់:
• ប្រាក់ខែ ឬ ប្រាក់ឈ្នួលប្រចាំថ្ងៃពីការងារ
• កម្រៃជើងសារពីការលក់
• ប្រាក់ចំណូលពីកិច្ចសន្យាការងារ

🔵 ចំណូលបន្ថែម:
• អាជីវកម្មខ្នាតតូចដែលធ្វើនៅពេលទំនេរ (តាក់ស៊ី, Grab)
• ការបង្រៀនបន្ថែម
• ការលក់ទំនិញតាមអនឡាញ (Facebook, TikTok Shop)

📞 ជំនួយ: @Chendasum ប្រសិនបើមានសំណួរ
➡️ ថ្ងៃស្អែក: /day2`;

    await bot.sendMessage(msg.chat.id, day1Content);
    console.log("✅ [DAY1] Full original Day 1 content sent to user:", msg.from.id);
  } catch (error) {
    console.error("❌ [DAY1] Error sending message:", error.message);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ទុកមេរៀនថ្ងៃទី ១។ សូមទាក់ទង @Chendasum");
  }
});

// Handle /day2 command: FULL ORIGINAL CONTENT RESTORED
bot.onText(/\/day2/i, async (msg) => {
  console.log("📚 [DAY2] Processing /day2 for user:", msg.from.id);
  
  try {
    // Use your original comprehensive Day 2 content
    await dailyCommands.handle(msg, ['/day2', '2'], bot);
    console.log("✅ [DAY2] Full Day 2 content sent to user:", msg.from.id);
  } catch (error) {
    console.error("❌ [DAY2] Error sending message:", error.message);
    // Fallback to simple message if module fails
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ទុកមេរៀនថ្ងៃទី ២។ សូមទាក់ទង @Chendasum");
  }
});

// Handle /day3-7 commands: FULL ORIGINAL CONTENT RESTORED
bot.onText(/\/day([3-7])/i, async (msg, match) => {
  const dayNumber = match[1];
  console.log(`📚 [DAY${dayNumber}] Processing /day${dayNumber} for user:`, msg.from.id);
  
  try {
    // Use your original comprehensive daily content
    await dailyCommands.handle(msg, [`/day${dayNumber}`, dayNumber], bot);
    console.log(`✅ [DAY${dayNumber}] Full Day ${dayNumber} content sent to user:`, msg.from.id);
  } catch (error) {
    console.error(`❌ [DAY${dayNumber}] Error sending message:`, error.message);
    // Fallback to simple message if module fails
    await bot.sendMessage(msg.chat.id, `❌ មានបញ្ហាក្នុងការផ្ទុកមេរៀនថ្ងៃទី ${dayNumber}។ សូមទាក់ទង @Chendasum`);
  }
});

// VIP command handlers: Both /vip_program_info and /vip trigger VIP information
bot.onText(/\/vip_program_info/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await User.findOne({ telegramId: msg.from.id });

    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }

    await vipCommands.info(msg, bot);
  } catch (error) {
    console.error("Error in VIP info command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ទុកព័ត៌មាន VIP។");
  }
});

bot.onText(/\/vip$/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await User.findOne({ telegramId: msg.from.id });

    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }

    await vipCommands.info(msg, bot);
  } catch (error) {
    console.error("Error in VIP command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការផ្ទុកព័ត៌មាន VIP។");
  }
});

// Admin Commands: Restricted access commands for bot administrators
bot.onText(/\/admin_users/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.showUsers(msg, bot);
  } catch (e) {
    console.error("Error /admin_users:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_progress (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.checkProgress(msg, match, bot);
  } catch (e) {
    console.error("Error /admin_progress:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_analytics/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.showAnalytics(msg, bot);
  } catch (e) {
    console.error("Error /admin_analytics:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_activity/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.showActivity(msg, bot);
  } catch (e) {
    console.error("Error /admin_activity:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_followup/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.showFollowup(msg, bot);
  } catch (e) {
    console.error("Error /admin_followup:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_message (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.sendMessage(msg, match, bot);
  } catch (e) {
    console.error("Error /admin_message:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_confirm_payment (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.confirmPayment(msg, match, bot);
  } catch (e) {
    console.error("Error /admin_confirm_payment:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_export/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.exportData(msg, bot);
  } catch (e) {
    console.error("Error /admin_export:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_help/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await adminCommands.showHelp(msg, bot);
  } catch (e) {
    console.error("Error /admin_help:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// VIP Apply Handler: Processes user's "VIP APPLY" message (case-insensitive) - FIXED DATABASE FIELDS
bot.on("message", async (msg) => {
  if (isDuplicateMessage(msg)) return;

  if (msg.text && msg.text.toUpperCase() === "VIP APPLY") {
    try {
      // FIXED: Use correct PostgreSQL field name
      const user = await User.findOne({ telegram_id: msg.from.id });

      // FIXED: Check is_paid properly (PostgreSQL stores as 't'/'f' strings)
      const isPaid = user?.is_paid === true || user?.is_paid === "t";

      if (!user || !isPaid) {
        await bot.sendMessage(
          msg.chat.id,
          "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
        );
        return;
      }
      await vipCommands.apply(msg, bot);
    } catch (error) {
      console.error("Error handling VIP APPLY message:", error);
      await bot.sendMessage(
        msg.chat.id,
        "❌ មានបញ្ហាក្នុងការដំណើរការសំណើ VIP។",
      );
    }
  }
});

// Progress Tracking Admin Commands
const progressTracker = require("./commands/progress-tracker");
bot.onText(/\/admin_stuck/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await progressTracker.showStuckUsers(msg, bot);
  } catch (e) {
    console.error("Error /admin_stuck:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_completion/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await progressTracker.showCompletionRates(msg, bot);
  } catch (e) {
    console.error("Error /admin_completion:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_remind (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await progressTracker.sendManualReminder(msg, match, bot);
  } catch (e) {
    console.error("Error /admin_remind:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_completed/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await progressTracker.showCompletedUsers(msg, bot);
  } catch (e) {
    console.error("Error /admin_completed:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_uploads/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await progressTracker.showUploadTracking(msg, bot);
  } catch (e) {
    console.error("Error /admin_uploads:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_photos (.+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await progressTracker.showUserPhotos(msg, match, bot);
  } catch (e) {
    console.error("Error /admin_photos:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Quick Admin Menu: Provides a quick list of admin commands
bot.onText(/\/admin_menu|\/admin/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  const adminId = parseInt(process.env.ADMIN_CHAT_ID);
  const secondaryAdminId = 484389665;
  if (![adminId, secondaryAdminId].includes(msg.from.id)) {
    await bot.sendMessage(
      msg.chat.id,
      "⚠️ អ្នកមិនមានសិទ្ធិប្រើពាក្យបញ្ជានេះទេ។",
    );
    return;
  }

  const menuMessage = `🔧 ADMIN QUICK MENU

📱 ការតាមដានប្រចាំថ្ងៃ:
• /admin_activity - អ្នកប្រើប្រាស់សកម្មថ្ងៃនេះ
• /admin_stuck - អ្នកប្រើប្រាស់ដែលជាប់គាំង
• /admin_uploads - ការតាមដានការផ្ទុកឡើងរូបភាព
• /admin_followup - អ្នកប្រើប្រាស់ដែលត្រូវការជំនួយ

📊 ការវិភាគ:
• /admin_analytics - ផ្ទាំងគ្រប់គ្រងពេញលេញ
• /admin_completion - អត្រាបញ្ចប់
• /admin_completed - អ្នកប្រើប្រាស់ដែលបានបញ្ចប់

💬 សកម្មភាព:
• /admin_progress [UserID] - ព័ត៌មានលម្អិតអ្នកប្រើប្រាស់
• /admin_message [UserID] [text] - ផ្ញើសារ
• /admin_remind [day] - ផ្ញើរំលឹក
• /admin_confirm_payment [UserID] - បញ្ជាក់ការទូទាត់

📋 របាយការណ៍:
• /admin_users - ទិដ្ឋភាពទូទៅអ្នកប្រើប្រាស់ទាំងអស់
• /admin_export - នាំចេញទិន្នន័យ CSV
• /admin_photos [UserID] - រូបភាពអ្នកប្រើប្រាស់

🆘 ជំនួយ:
• /admin_help - បញ្ជីពាក្យបញ្ជាពេញលេញ
• /whoami - ស្ថានភាព Admin របស់អ្នក

📋 ឧបករណ៍ & ទម្រង់:
• /admin_daily_template - ទម្រង់តាមដានប្រចាំថ្ងៃ
• /admin_weekly_template - ទម្រង់របាយការណ៍ប្រចាំសប្តាហ៍
• /admin_engagement_checklist - មគ្គុទេសក៍ការចូលរួមអ្នកប្រើប្រាស់
• /admin_onboarding_template - ទម្រង់អ្នកប្រើប្រាស់ថ្មី

វាយពាក្យបញ្ជាណាមួយដើម្បីប្រតិបត្តិភ្លាមៗ!`;

  await bot.sendMessage(msg.chat.id, menuMessage);
});

// Tools and Templates Admin Commands
bot.onText(/\/admin_daily_template/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await toolsTemplates.generateDailyTemplate(msg, bot);
  } catch (e) {
    console.error("Error /admin_daily_template:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_weekly_template/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await toolsTemplates.generateWeeklyTemplate(msg, bot);
  } catch (e) {
    console.error("Error /admin_weekly_template:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_engagement_checklist/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await toolsTemplates.generateEngagementChecklist(msg, bot);
  } catch (e) {
    console.error("Error /admin_engagement_checklist:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_onboarding_template/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await toolsTemplates.generateOnboardingTemplate(msg, bot);
  } catch (e) {
    console.error("Error /admin_onboarding_template:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Marketing Content Commands
bot.onText(/\/marketing_hub/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.marketingHub(msg, bot);
  } catch (e) {
    console.error("Error /marketing_hub:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/post_success_story/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.postSuccessStory(msg, bot);
  } catch (e) {
    console.error("Error /post_success_story:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/post_program_promo/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.postProgramPromo(msg, bot);
  } catch (e) {
    console.error("Error /post_program_promo:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/launch_flash_sale/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.launchFlashSale(msg, bot);
  } catch (e) {
    console.error("Error /launch_flash_sale:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/content_week/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.contentWeek(msg, bot);
  } catch (e) {
    console.error("Error /content_week:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/send_newsletter/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.sendNewsletter(msg, bot);
  } catch (e) {
    console.error("Error /send_newsletter:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/marketing_stats/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.marketingStats(msg, bot);
  } catch (e) {
    console.error("Error /marketing_stats:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/roi_analysis/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.roiAnalysis(msg, bot);
  } catch (e) {
    console.error("Error /roi_analysis:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/referral_program/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await marketingContent.referralProgram(msg, bot);
  } catch (e) {
    console.error("Error /referral_program:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// 30-Day Extended Content Commands: Access lessons from Day 8 to Day 30
bot.onText(/\/extended(\d+)/i, async (msg, match) => {
  if (isDuplicateMessage(msg)) return;
  const day = parseInt(match[1]);
  if (isNaN(day) || day < 8 || day > 30) {
    await bot.sendMessage(
      msg.chat.id,
      "❌ មាតិកាបន្ថែមអាចរកបានសម្រាប់ថ្ងៃទី ៨-៣០ ប៉ុណ្ណោះ។",
    );
    return;
  }
  try {
    const user = await User.findOne({ telegramId: msg.from.id });
    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីចូលប្រើមាតិកាបន្ថែម។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }
    await extendedContent.handleExtendedDay(msg, bot, day);
  } catch (error) {
    console.error("Error in /extended command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// 30-Day Admin Commands
bot.onText(/\/admin_content_stats/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await thirtyDayAdmin.contentStats(msg, bot);
  } catch (e) {
    console.error("Error /admin_content_stats:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_bulk_send/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await thirtyDayAdmin.sendBulkContent(msg, bot);
  } catch (e) {
    console.error("Error /admin_bulk_send:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_content_calendar/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await thirtyDayAdmin.contentCalendar(msg, bot);
  } catch (e) {
    console.error("Error /admin_content_calendar:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/admin_scheduler_status/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await thirtyDayAdmin.schedulerStatus(msg, bot);
  } catch (e) {
    console.error("Error /admin_scheduler_status:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Preview System Commands: Free access to preview content
bot.onText(/\/preview$/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await previewCommands.preview(msg, bot);
  } catch (e) {
    console.error("Error /preview:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/preview_day1/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await previewCommands.previewDay1(msg, bot);
  } catch (e) {
    console.error("Error /preview_day1:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/preview_tools/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await previewCommands.previewTools(msg, bot);
  } catch (e) {
    console.error("Error /preview_tools:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/preview_results/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await previewCommands.previewResults(msg, bot);
  } catch (e) {
    console.error("Error /preview_results:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/preview_journey/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await previewCommands.previewJourney(msg, bot);
  } catch (e) {
    console.error("Error /preview_journey:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/preview_before_after/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await previewCommands.previewBeforeAfter(msg, bot);
  } catch (e) {
    console.error("Error /preview_before_after:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/preview_transformation/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await previewCommands.previewTransformation(msg, bot);
  } catch (e) {
    console.error("Error /preview_transformation:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Financial Health Quiz Commands: Free assessment
bot.onText(/\/financial_quiz/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await financialQuiz.startQuiz(msg, bot);
  } catch (e) {
    console.error("Error /financial_quiz:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/health_check/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await financialQuiz.startQuiz(msg, bot);
  } catch (e) {
    console.error("Error /health_check:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Free Tools Commands: Available to all users without payment
bot.onText(/\/calculate_daily/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await freeTools.calculateDaily(msg, bot);
  } catch (e) {
    console.error("Error /calculate_daily:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/find_leaks/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await freeTools.findLeaks(msg, bot);
  } catch (e) {
    console.error("Error /find_leaks:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
  return;
});
bot.onText(/\/savings_potential/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await freeTools.savingsPotential(msg, bot);
  } catch (e) {
    console.error("Error /savings_potential:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/income_analysis/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await freeTools.incomeAnalysis(msg, bot);
  } catch (e) {
    console.error("Error /income_analysis:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Badge Commands: Requires payment to view
bot.onText(/\/badges/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await User.findOne({ telegramId: msg.from.id });
    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីមើល badges។ ប្រើ /pricing ដើម្បីមើលព័ត៌ណី។",
      );
      return;
    }
    await badgesCommands.showBadges(msg, bot);
  } catch (error) {
    console.error("Error in /badges command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Progress Command: Requires payment to view
bot.onText(/\/progress/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await User.findOne({ telegramId: msg.from.id });
    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីមើលការរីកចម្រើន។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }
    await badgesCommands.showProgress(msg, bot);
  } catch (error) {
    console.error("Error in /progress command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Milestones Command: Requires payment to view
bot.onText(/\/milestones/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await User.findOne({ telegramId: msg.from.id });
    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីមើលសមិទ្ធផល។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }
    await badgesCommands.showMilestones(msg, bot);
  } catch (error) {
    console.error("Error in /milestones command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Streak Command: Requires payment to view
bot.onText(/\/streak/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await User.findOne({ telegramId: msg.from.id });
    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីមើលការធ្វើបន្តបន្ទាប់។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }
    await badgesCommands.showStreak(msg, bot);
  } catch (error) {
    console.error("Error in /streak command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
});

// Quote Commands: Premium features (assuming these are premium/paid features)
bot.onText(/\/quote$/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await quotesCommands.dailyQuote(msg, bot);
  } catch (e) {
    console.error("Error /quote:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/wisdom/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await quotesCommands.randomWisdom(msg, bot);
  } catch (e) {
    console.error("Error /wisdom:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/quote_categories/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await quotesCommands.showCategories(msg, bot);
  } catch (e) {
    console.error("Error /quote_categories:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/quote_traditional/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await quotesCommands.categoryQuote(msg, bot, "traditional");
  } catch (e) {
    console.error("Error /quote_traditional:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/quote_financial/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await quotesCommands.categoryQuote(msg, bot, "financial");
  } catch (e) {
    console.error("Error /quote_financial:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/quote_motivation/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await quotesCommands.categoryQuote(msg, bot, "motivation");
  } catch (e) {
    console.error("Error /quote_motivation:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/quote_success/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await quotesCommands.categoryQuote(msg, bot, "success");
  } catch (e) {
    console.error("Error /quote_success:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Smart FAQ Command: Shows different content based on user's payment status
bot.onText(/\/faq|FAQ|faq/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await User.findOne({ telegramId: msg.from.id });
    const isPaid = user && user.isPaid;
    const isPremiumOrVip =
      user && (user.tier === "premium" || user.tier === "vip");
    const isVip = user && user.tier === "vip";

    let faqMessage;

    if (!isPaid) {
      faqMessage = `❓ សំណួរញឹកញាប់ (FAQ) - Welcome Guide

💰 អំពីតម្លៃ:
- តម្លៃប៉ុន្មាន? → $47 (Essential) / $97 (Premium) / $197 (VIP)
- ទូទាត់យ៉ាងដូចម្តេច? → ABA Bank, ACLEDA Bank, Wing Payment
- បញ្ជាក់ការទូទាត់រយៈពេលប៉ុន្មាន? → ១-២ ម៉ោង
- ទទួលបានអ្វីខ្លះ? → /pricing ដើម្បីមើលលម្អិត

⏰ អំពីពេលវេលា:
- ចំណាយពេលប៉ុន្មាននាទី? → ១៥-២០ នាទីក្នុងមួយថ្ងៃ
- អាចធ្វើលឿនជាងនេះបានទេ? → បាន តែណែនាំ ១ ថ្ងៃ/១ មេរៀន
- ធ្វើរួចហើយ ទើបធ្វើបន្តបានទេ? → គ្មានបញ្ហា! ធ្វើតាមល្បឿនខ្លួនឯង

🎯 អំពីមាតិកា:
- មេរៀនមានអ្វីខ្លះ? → ៧ ថ្ងៃ Money Management ពេញលេញ
- ភាសាអ្វី? → ភាសាខ្មែរ ១០០% (ពាក្យពេចន៍អំពីប្រាក់)
- ទទួលបានអ្វីខ្លះ? → ចំណេះដឹងគ្រប់គ្រងលុយ និងបង្កើនចំណូល

🔧 អំពីបច្ចេកទេស:
- ត្រូវការឧបករណ៍អ្វី? → គ្រាន់តែ Telegram app
- ទិន្នន័យរក្សាទុកណា? → Server សុវត្ថិភាព ១០០%
- បាត់ទិន្នន័យអត់? → មិនបាត់ - មាន backup ស្វ័យប្រវត្តិ

📱 ពាក្យបញ្ជាដែលអ្នកអាចប្រើ:
- 🏠 ចាប់ផ្តើម → /start
- 💰 មើលតម្លៃ → /pricing
- 💳 ការទូទាត់ → /payment
- 🛠 ជំនួយ → /help
- 📊 ស្ថានភាព → /status
- ❓ សំណួរនេះ → /faq
- 👤 ព័ត៌មានខ្ញុំ → /whoami

🔒 ពាក្យបញ្ជាពិសេស (បន្ទាប់ពីទូទាត់):
- 📚 មេរៀន Day 1-7 → /day1 ដល់ /day7
- 🏆 ការតាមដានការរីកចម្រើន → /badges, /progress
- 📚 សម្រង់ប្រាជ្ញាខ្មែរ → /quote, /wisdom
- 🌟 កម្មវិធីកម្រិតខ្ពស់ → VIP Programs

❓ ប្រើប្រាស់ពេលចម្លែក:
- ការទូទាត់មានបញ្ហា? → ផ្ញើរូបអេក្រង់មក @Chendasum
- ចង់បានជំនួយបន្ថែម? → ទាក់ទង @Chendasum ២៤/៧
- បាត់ការតភ្ជាប់? → គេហទំព័រ 7daymoneyflow.com
- Bot មិនដំណើរការ? → /start ម្តងទៀត

💡 ជំហានទូទាត់:
1. ពិនិត្យតម្លៃ → /pricing
2. ផ្ទេរលុយ → /payment
3. ថតរូបបញ្ជាក់ → ទៅ @Chendasum
4. រង់ចាំការបញ្ជាក់ → ១-២ ម៉ោង
5. ចាប់ផ្តើម Day 1 → /day1

🎯 វិធីអនុវត្ត:
- ចាប់ផ្តើមកែប្រែទម្លាប់ការចំណាយ
- គ្រប់គ្រងលុយបានល្អជាងមុន
- មានផែនការហិរញ្ញវត្ថុច្បាស់លាស់
- ស្វែងរកវិធីបង្កើនចំណូល

🔥 Ready to start?
👉 /pricing ដើម្បីមើលតម្លៃ
👉 /payment ដើម្បីទូទាត់
👉 /start ដើម្បីចាប់ផ្តើម

💬 ត្រូវការជំនួយ? ទាក់ទង @Chendasum ២៤/៧!`;
    } else {
      faqMessage = `❓ សំណួរញឹកញាប់ (FAQ) - Complete Member Guide

💰 អំពីតម្លៃ (អ្នកបានទូទាត់រួច ✅):
- តម្លៃរបស់អ្នក → ${user.tier === "vip" ? "$197 (VIP)" : user.tier === "premium" ? "$97 (Premium)" : "$47 (Essential)"}
- ទូទាត់ពេល → ${user.payment_date ? new Date(user.payment_date).toDateString() : "មិនទាន់បញ្ជាក់"}
- Upgrade ទៅកម្រិតខ្ពស់? → /pricing

⏰ អំពីពេលវេលា:
- ចំណាយពេលប៉ុន្មាននាទី? → ១៥-២០ នាទីក្នុងមួយថ្ងៃ
- អាចធ្វើលឿនជាងនេះបានទេ? → បាន តែណែនាំ ១ ថ្ងៃ/១ មេរៀន
- ធ្វើរួចហើយ ទើបធ្វើបន្តបានទេ? → បាន ធ្វើតាមល្បឿនខ្លួនឯង
- ភ្លេចធ្វើ Day ម្សិលមិញ? → គ្មានបញ្ហា! ធ្វើបន្តពីថ្ងៃបាត់បង់

🎯 អំពីមាតិកា:
- មេរៀនមានអ្វីខ្លះ? → ៧ ថ្ងៃ Money Management ពេញលេញ
- ភាសាអ្វី? → ភាសាខ្មែរ ១០០% (ពាក្យពេចន៍អំពីប្រាក់)
- ទទួលបានអ្វីខ្លះ? → ចំណេះដឹងគ្រប់គ្រងលុយ និងបង្កើនចំណូល

📱 ពាក្យបញ្ជាមូលដ្ឋាន:
- 🏠 ចាប់ផ្តើម → /start
- 💰 មើលតម្លៃ → /pricing
- 💳 ការទូទាត់ → /payment
- 🛠 ជំនួយ → /help
- 📊 ស្ថានភាព → /status
- ❓ សំណួរនេះ → /faq
- 👤 ព័ត៌មានខ្ញុំ → /whoami

🚀 ពាក្យបញ្ជាកម្មវិធី (៧ ថ្ងៃដំបូង):
- 📚 ថ្ងៃទី ១ → /day1 - ស្គាល់ Money Flow
- 🔍 ថ្ងៃទី ២ → /day2 - ស្វែងរក Money Leaks
- 📊 ថ្ងៃទី ៣ → /day3 - វាយតម្លៃប្រព័ន្ធ
- 🗺️ ថ្ងៃទី ៤ → /day4 - បង្កើតផែនទីលុយ
- 📈 ថ្ងៃទី ៥ → /day5 - Survival vs Growth (ការរស់រាន និងការលូតលាស់)
- 📋 ថ្ងៃទី ៦ → /day6 - រៀបចំផែនការ
- ✨ ថ្ងៃទី ៧ → /day7 - Integration (ការបញ្ចូលគ្នា)

📈 ពាក្យបញ្ជាកម្មវិធីបន្ថែម (៣០ ថ្ងៃ):
- /extended8 - ថ្ងៃទី ៨: ការវិភាគចំណូលកម្រិតខ្ពស់
- /extended9 - ថ្ងៃទី ៩: ការគ្រប់គ្រងចំណាយអាជីវកម្ម
- /extended10 - ថ្ងៃទី ១០: ការបង្កើតទម្លាប់ហិរញ្ញវត្ថុ
- /extended11 - ថ្ងៃទី ១១: ការវិនិយោគដំបូងសាមញ្ញ
- /extended12 - ថ្ងៃទី ១២: ការបង្កើតមូលនិធិសម្រាប់បន្ទាន់
- /extended13 - ថ្ងៃទី ១៣: ការវាយតម្លៃហានិភ័យហិរញ្ញវត្ថុ
- /extended14 - ថ្ងៃទី ១៤: ការបង្កើនប្រសិទ្ធភាពបំណុល
- /extended15 - ថ្ងៃទី ១៥: ការរៀបចំផែនការចូលនិវត្តន៍
- /extended16 - ថ្ងៃទី ១៦: ការគ្រប់គ្រងទ្រព្យសម្បត្តិ
- /extended17 - ថ្ងៃទី ១៧: ការវិនិយោគអចលនទ្រព្យ
- /extended18 - ថ្ងៃទី ១៨: ការវិនិយោគលើភាគហ៊ុន
- /extended19 - ថ្ងៃទី ១៩: ការវិនិយោគលើមូលបត្របំណុល
- /extended20 - ថ្ងៃទី ២០: ការវិនិយោគលើមូលនិធិរួម
- /extended21 - ថ្ងៃទី ២១: ការវិនិយោគលើមាស និងប្រាក់
- /extended22 - ថ្ងៃទី ២២: ការវិនិយោគលើរូបិយប័ណ្ណគ្រីបតូ
- /extended23 - ថ្ងៃទី ២៣: ការវិនិយោគលើអាជីវកម្មខ្នាតតូច
- /extended24 - ថ្ងៃទី ២៤: ការគ្រប់គ្រងហានិភ័យអាជីវកម្ម
- /extended25 - ថ្ងៃទី ២៥: ការរៀបចំផែនការពង្រីកអាជីវកម្ម
- /extended26 - ថ្ងៃទី ២៦: ការបង្កើតប្រភពចំណូលអកម្ម
- /extended27 - ថ្ងៃទី ២៧: ការបង្កើនប្រសិទ្ធភាពពន្ធ
- /extended28 - ថ្ងៃទី ២៨: ការរៀបចំផែនការអចលនទ្រព្យ
- /extended29 - ថ្ងៃទី ២៩: ការការពារទ្រព្យសម្បត្តិ
- /extended30 - ថ្ងៃទី ៣០: ការពិនិត្យឡើងវិញ និងគោលដៅអនាគត

🏆 ការតាមដានការរីកចម្រើន:
- 🎖️ សមិទ្ធផល → /badges
- 📈 ការរីកចម្រើន → /progress
- 🏁 សមិទ្ធផលសំខាន់ → /milestones
- 🔥 ការធ្វើបន្តបន្ទាប់ → /streak

📚 សម្រង់ប្រាជ្ញាខ្មែរ:
- 💬 សម្រង់ប្រចាំថ្ងៃ → /quote
- 🎭 ប្រាជ្ញាចៃដន្យ → /wisdom
- 📖 ប្រភេទសម្រង់ → /quote_categories
- 🏛️ ប្រាជ្ញាប្រពៃណី → /quote_traditional
- 💰 ចិត្តគំនិតហិរញ្ញវត្ថុ → /quote_financial
- 💪 ការលើកទឹកចិត្ត → /quote_motivation
- 🏆 ជោគជ័យ → /quote_success

${
  isPremiumOrVip
    ? `
🌟 Premium Features (អ្នកអាចប្រើបាន):
- 📞 ទាក់ទងផ្ទាល់ → /admin_contact
- 🆘 ជំនួយអាទិភាព → /priority_support
- 📊 វិភាគកម្រិតខ្ពស់ → /advanced_analytics
- 👑 ព័ត៌មាន VIP → /vip_program_info
- 🎯 VIP ចូលរួម → សរសេរ "VIP APPLY"
- 🏛️ Capital Strategy → សរសេរ "CAPITAL CLARITY"`
    : ""
}

${
  isVip
    ? `
👑 VIP Exclusive Features (អ្នកអាចប្រើបាន):
- 🗓️ មើលម៉ោងទំនេរ → /book_session
- 💼 Capital Assessment → /book_capital_assessment
- 🔍 Business Review → /book_business_review
- 📈 Investment Evaluation → /book_investment_evaluation
- 🎯 Custom Session → /book_custom_session
- 📋 របាយការណ៍ VIP → /vip_reports
- 📊 ការតាមដានពង្រីក → /extended_tracking`
    : ""
}

🎯 Assessment ឥតគិតថ្លៃ:
• /financial_quiz - ពិនិត្យសុខភាពហិរញ្ញវត្ថុ (២ នាទី)
• /health_check - ពិនិត្យសុខភាពហិរញ្ញវត្ថុ (២ នាទី)

💰 ឧបករណ៍គណនាឥតគិតថ្លៃ:
• /calculate_daily - គណនាចំណាយប្រចាំថ្ងៃ
• /find_leaks - រកកន្លែងលុយលេចធ្លាយ
• /savings_potential - គណនាសក្តានុពលសន្សំ
• /income_analysis - វិភាគចំណូល

❓ ប្រើប្រាស់ពេលចម្លែក:
- ការទូទាត់មានបញ្ហា? → ផ្ញើរូបអេក្រង់មក @Chendasum
- ចង់បានជំនួយបន្ថែម? → ទាក់ទាក់ @Chendasum ២៤/៧
- បាត់ការតភ្ជាប់? → គេហទំព័រ 7daymoneyflow.com
- Bot មិនដំណើរការ? → /start ម្តងទៀត
- ចង់ Upgrade? → /pricing

💡 Tips ពិសេស:
- ប្រើ /help ដើម្បីមើលពាក្យបញ្ជាទាំងអស់
- ប្រើ /status ដើម្បីពិនិត្យការរីកចម្រើន
- ប្រើ /whoami ដើម្បីមើលព័ត៌មានគណនី
- សរសេរសំណួរដោយផ្ទាល់ - Bot នឹងជួយ!

🎯 វិធីអនុវត្ត:
- ចាប់ផ្តើមកែប្រែទម្លាប់ការចំណាយ
- គ្រប់គ្រងលុយបានល្អជាងមុន
- មានផែនការហិរញ្ញវត្ថុច្បាស់លាស់
- ស្វែងរកវិធីបង្កើនចំណូល

🌟 ការគាំទ្រពិសេស:
- 📱 Telegram Bot Support: ២៤/៧
- 👨‍💼 Personal Support: @Chendasum
- 🌐 Website: 7daymoneyflow.com
- ⏰ Response Time: ១-២ ម៉ោង

💬 ត្រូវការជំនួយបន្ថែម? ទាក់ទង @Chendasum

🔥 Ready for your next lesson?
👉 Check /status to see your progress!`;
    }

    await sendLongMessage(
      bot,
      msg.chat.id,
      faqMessage,
      {
        parse_mode: "Markdown",
      },
      MESSAGE_CHUNK_SIZE,
    );
  } catch (error) {
    console.error("Error in FAQ command:", error);
    const basicHelp = `❓ ជំនួយ (Help):

📱 ពាក្យបញ្ជាសំខាន់:
- /start - ចាប់ផ្តើម
- /pricing - តម្លៃ
- /help - ជំនួយ
- /faq - សំណួរញឹកញាប់

💬 ជំនួយ: សរសេរមកដោយផ្ទាល់!`;

    await bot.sendMessage(bot, msg.chat.id, basicHelp); // Pass bot instance
  }
});

// Status Command: Displays user's account and program progress status
bot.onText(/\/status|ស្ថានភាព/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const userId = msg.from.id;
    const user = await User.findOne({ telegram_id: userId });

    if (!user) {
      await bot.sendMessage(
        msg.chat.id,
        "អ្នកមិនទាន់ចុះឈ្មោះ។ ប្រើ /start ដើម្បីចាប់ផ្តើម។",
      );
      return;
    }

    const progress = await Progress.findOne({ user_id: userId });
    const isPaid = user?.is_paid === true || user?.is_paid === 't';

    let statusMessage = `📊 ស្ថានភាពគណនីរបស់អ្នក:

👤 អ្នកប្រើប្រាស់: ${user.first_name || "មិនស្គាល់"}
📅 ចូលរួម: ${user.joined_at ? new Date(user.joined_at).toDateString() : "មិនស្គាល់"}
💰 ស្ថានភាព: ${isPaid ? "✅ បានទូទាត់" : "❌ មិនទាន់ទូទាត់"}`;

    if (isPaid) {
      statusMessage += `
📈 ថ្ងៃបច្ចុប្បន្ន: Day ${progress?.current_day || 0}
🎯 អ្នកអាចប្រើប្រាស់កម្មវិធីបានពេញលេញ!`;

      if (user.payment_date) {
        statusMessage += `
💰 ទូទាត់ពេល: ${new Date(user.payment_date).toDateString()}`;
      }

      if (progress) {
        const completedDays = [];
        for (let i = 1; i <= 7; i++) {
          if (progress[`day${i}_completed`]) {
            completedDays.push(`Day ${i}`);
          }
        }
        if (completedDays.length > 0) {
          statusMessage += `
✅ ថ្ងៃបញ្ចប់: ${completedDays.join(", ")}`;
        }
      }
    } else {
      statusMessage += `
🔒 សូមទូទាត់ដើម្បីចូលប្រើ Day 1-7
💡 ប្រើ /pricing ដើម្បីមើលតម្លៃ`;
    }

    await sendLongMessage(
      bot,
      msg.chat.id,
      statusMessage,
      {},
      MESSAGE_CHUNK_SIZE,
    );
  } catch (error) {
    console.error("Error in status command:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការទាញយកស្ថានភាព។");
  }
});

// Whoami Command: Provides user's Telegram and bot-specific information
bot.onText(/\/whoami/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const user = await User.findOne({ telegram_id: msg.from.id });
    const adminId = parseInt(process.env.ADMIN_CHAT_ID);
    const secondaryAdminId = 484389665;
    const isAdmin = msg.from.id === adminId || msg.from.id === secondaryAdminId;
    const isPaid = user?.is_paid === true || user?.is_paid === 't';

    let response = `🔍 ព័ត៌មានរបស់អ្នក:\n\n`;
    response += `• Chat ID: ${msg.chat.id}\n`;
    response += `• User ID: ${msg.from.id}\n`;
    response += `• ឈ្មោះ: ${msg.from.first_name || "N/A"}\n`;
    response += `• ត្រកូល: ${msg.from.last_name || "N/A"}\n`;
    response += `• ឈ្មោះអ្នកប្រើ: ${msg.from.username ? "@" + msg.from.username : "N/A"}\n`;
    response += `• ស្ថានភាព Admin: ${isAdmin ? "✅ ADMIN" : "❌ មិនមែន ADMIN"}\n`;
    response += `• ID Admin ដែលត្រូវការ: ${adminId}\n`;
    response += `• • ID របស់អ្នកត្រូវគ្នា: ${msg.from.id === adminId ? "✅ បាទ/ចាស" : "❌ ទេ"}\n`;

    if (user) {
      response += `• ស្ថានភាពមូលដ្ឋានទិន្នន័យ: ✅ បានចុះឈ្មោះ\n`;
      response += `• ស្ថានភាពទូទាត់: ${isPaid ? "✅ បានទូទាត់" : "❌ មិនទាន់ទូទាត់"}\n`;
      response += `• ស្ថានភាព VIP: ${user.is_vip ? "🌟 VIP" : "❌ មិនមែន VIP"}\n`;
      response += `• បានចូលរួម: ${user.joined_at ? new Date(user.joined_at).toDateString() : "មិនស្គាល់"}\n`;
      response += `• សកម្មភាពចុងក្រោយ: ${user.last_active ? new Date(user.last_active).toDateString() : "មិនស្គាល់"}\n`;
      if (isPaid && user.payment_date) {
        response += `• ថ្ងៃទូទាត់: ${new Date(user.payment_date).toDateString()}\n`;
      }
    } else {
      response += `• ស្ថានភាពមូលដ្ឋានទិន្នន័យ: ❌ មិនទាន់បានចុះឈ្មោះ\n`;
    }

    await sendLongMessage(bot, msg.chat.id, response, {}, MESSAGE_CHUNK_SIZE);
  } catch (error) {
    console.error("Error in whoami command:", error);
    await bot.sendMessage(
      msg.chat.id,
      `❌ មានបញ្ហាក្នុងការទាញយកព័ត៌មានអ្នកប្រើប្រាស់: ${error.message}`,
    );
  }
});

// Tier-based feature commands: These commands are typically restricted by user's tier (Premium/VIP)
// Premium tier commands
bot.onText(/\/admin_contact/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await tierFeatures.adminContact(msg, bot);
  } catch (e) {
    console.error("Error /admin_contact:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/priority_support/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await tierFeatures.prioritySupport(msg, bot);
  } catch (e) {
    console.error("Error /priority_support:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/advanced_analytics/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await tierFeatures.advancedAnalytics(msg, bot);
  } catch (e) {
    console.error("Error /advanced_analytics:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// VIP tier commands
bot.onText(/\/book_session/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await bookingCommands.showBookingSlots(msg, bot);
  } catch (e) {
    console.error("Error /book_session:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/book_capital_assessment/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await bookingCommands.bookCapitalClarity(msg, bot);
  } catch (e) {
    console.error("Error /book_capital_assessment:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/book_business_review/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await bookingCommands.bookBusinessReview(msg, bot);
  } catch (e) {
    console.error("Error /book_business_review:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/book_investment_evaluation/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await bookingCommands.bookInvestmentEvaluation(msg, bot);
  } catch (e) {
    console.error("Error /book_investment_evaluation:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/book_custom_session/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await bookingCommands.bookCustomSession(msg, bot);
  } catch (e) {
    console.error("Error /book_custom_session:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/vip_reports/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await tierFeatures.personalReports(msg, bot);
  } catch (e) {
    console.error("Error /vip_reports:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});
bot.onText(/\/extended_tracking/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    await tierFeatures.extendedTracking(msg, bot);
  } catch (e) {
    console.error("Error /extended_tracking:", e);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។");
  }
});

// Consolidated message handler with smart question detection and routing
bot.on("message", async (msg) => {
  if (isDuplicateMessage(msg)) return;

  if (!msg.text || msg.text.startsWith("/")) {
    return;
  }

  const text = msg.text.toLowerCase();
  const userId = msg.from.id;

  try {
    if (typeof User.updateLastActive === "function") {
      await User.updateLastActive(userId);
    } else {
      // FIXED: Use correct PostgreSQL field name
      await User.findOneAndUpdate(
        { telegram_id: userId },
        { last_active: new Date() },
        { new: true },
      );
    }
  } catch (error) {
    console.error("Error updating lastActive timestamp:", error);
  }

  if (await financialQuiz.processQuizResponse(msg, bot)) {
    return;
  }

  try {
    if (
      typeof freeTools.processToolResponse === "function" &&
      (await freeTools.processToolResponse(
        msg,
        bot,
        await User.findOne({ telegram_id: userId }),
      ))
    ) {
      return;
    }
  } catch (error) {
    console.error("Error processing free tools response:", error);
  }

  // FIXED: Don't return early for these text messages - process them properly
  if (
    text.includes("ready for day") ||
    (text.includes("day") && text.includes("complete")) ||
    text === "vip apply" ||
    text.includes("program complete") ||
    text.includes("capital clarity")
  ) {
    console.log("🎯🎯🎯 TEXT HANDLER TRIGGERED! 🎯🎯🎯");
    console.log("User ID:", userId);
    console.log("Original text:", msg.text);
    console.log("Lowercase text:", text);
    console.log("Calling handleTextResponse...");

    // Call the proper text response handler instead of returning
    await handleTextResponse(msg);
    return;
  }

  const questionWords = [
    "help",
    "problem",
    "issue",
    "question",
    "how",
    "why",
    "what",
    "where",
    "when",
    "error",
    "fail",
    "broken",
    "stuck",
    "cannot",
    "can't",
    "unable",
    "wrong",
    "fix",
    "repair",
    "troubleshoot",
    "បញ្ហា",
    "ជំនួយ",
    "សួរ",
    "យ៉ាងម៉េច",
    "ធ្វើម៉េច",
    "ហេតុអ្វី",
    "កំហុស",
    "ខូច",
    "មិនអាច",
    "ជួសជុល",
    "ដោះស្រាយ",
  ];

  const hasQuestionWord = questionWords.some((word) => text.includes(word));

  const endsWithQuestionMark = msg.text.trim().endsWith("?");

  if (hasQuestionWord || endsWithQuestionMark) {
    const investmentWords = [
      "វិនិយោគ",
      "ហ៊ុន",
      "ប្រាក់បញ្ញើ",
      "ភាគហ៊ុន",
      "មូលប័ត្រ",
      "គម្រោង",
      "ការលិតធ្វើ",
      "ពាណិជ្ជកម្ម",
      "investment",
      "company",
      "deposit",
      "stock",
      "fund",
      "business",
      "trading",
      "portfolio",
    ];
    const isInvestmentQuestion = investmentWords.some((word) =>
      text.includes(word),
    );

    if (isInvestmentQuestion) {
      const investmentResponse = `💼 ការវិនិយោគ និងអាជីវកម្ម

🎯 កម្មវិធីរបស់យើង:
កម្មវិធី 7-Day Money Flow Reset™ ផ្តោតលើការគ្រប់គ្រងប្រាក់កម្រាល់ មិនមែនការវិនិយោគដោយផ្ទាល់ទេ។

💡 ស្រាប់តែបានបញ្ចប់កម្មវិធី:
- អ្នកនឹងមានគ្រឹះល្អក្នុងការគ្រប់គ្រងប្រាក់
- យល់ពីលំហូរប្រាក់ និងការសន្សំ
- ត្រៀមខ្លួនសម្រាប់ការវិនិយោគនាពេលខាងមុខ

🔥 បើចង់ដឹងពីការវិនិយោគ:
- បញ្ចប់កម្មវិធី ៧ ថ្ងៃមុន
- ទាក់ទង @Chendasum សម្រាប់ការណែនាំបន្ត
- ឬ ពិនិត្យ VIP Program → /vip_program_info

✅ ចាប់ផ្តើមដំបូង → /start`;

      await sendLongMessage(
        bot,
        msg.chat.id,
        investmentResponse,
        {},
        MESSAGE_CHUNK_SIZE,
      );
      return;
    }

    let helpResponse = `🤔 ខ្ញុំឃើញអ្នកមានសំណួរ!

🔥 ជំនួយរហ័ស:
- បញ្ហាការទូទាត់ → ពិនិត្យ /faq ឬ ផ្ញើរូបបញ្ជាក់ការទូទាត់
- បញ្ហាបច្ចេកទេស → ស្វែងរក /help មុន
- សំណួរកម្មវិធី → ទាក់ទាក់ @Chendasum ដោយផ្ទាល់
- ព័ត៌មាន VIP → ប្រើ /vip_program_info

📱 ឬគ្រាន់តែសរសេរសំណួរអ្នក - ខ្ញុំនឹងជួយ!

💬 ជំនួយ ២៤/៧ ជាភាសាខ្មែរ និង English!`;

    await sendLongMessage(
      bot,
      msg.chat.id,
      helpResponse,
      {},
      MESSAGE_CHUNK_SIZE,
    );
    return;
  }

  await handleTextResponse(msg);
});

bot.onText(/CAPITAL CLARITY|capital clarity/i, async (msg) => {
  if (isDuplicateMessage(msg)) return;
  try {
    const userId = msg.from.id;
    const firstName = msg.from.first_name || "មិត្ត";

    const clarityResponse = `🏛️ វគ្គ Capital Clarity - យុទ្ធសាស្ត្រមូលធនឯកជន

ជំរាបសួរ ${firstName}!

🎯 តើអ្វីជាវគ្គ Capital Clarity?

ជាវគ្គយុទ្ធសាស្ត្រឯកជនដែលមានរចនាសម្ព័ន្ធរៀបចំឡើងដើម្បី:
- ពិនិត្យមើលកន្លែងដែលប្រព័ន្ធមូលធនរបស់អ្នកអាចត្រូវបានរារាំង ឬលេចធ្លាយ
- ពិភាក្សាអំពីរបៀបដែលកិច្ចព្រមព្រៀង និងទំនាក់ទំនងវិនិយោគិនរបស់អ្នកដំណើរការ
- ស្វែងយល់ពីគម្លាតទំនុកចិត្ត និងហានិភ័យនៃការដាក់ពង្រាយ
- បង្កើតផ្លូវអភិវឌ្ឍន៍សក្តានុពលជាមួយនឹងវិធីសាស្ត្រមានរចនាសម្ព័ន្ធ

💰 ការវិនិយោគ: $197 (តម្លៃធម្មតា: $497) - មានកំណត់ ៥ កន្លែង/ខែ

🔍 ក្របខ័ណ្ឌវិភាគស្នូល:
១. Opening Frame - កំណត់ទំនុកចិត្ត និងបរិបទយុទ្ធសាស្ត្រ
២. Capital X-Ray - ពិនិត្យរចនាសម្ព័ន្ធមូលនិធិ/កិច្ចព្រមព្រៀង និងលំហូរ
៣. Trust Mapping - កំណត់ការបែកបាក់ទំនាក់ទំនង
៤. System Readiness Score - វាយតម្លៃសមត្ថភាពដាក់ពង្រាយ
៥. Clarity Discussion - ផែនទីផ្លូវអភិវឌ្ឍន៍សក្តានុពល

🎯 ល្អឥតខ្ចោះសម្រាប់:
- ស្ថាបនិកដែលគ្រប់គ្រងមូលធនឯកជន ($100K+ ក្នុងមួយឆ្នាំ)
- អ្នកប្រតិបត្តិដែលមានរចនាសម្ព័ន្ធមូលនិធិ
- ម្ចាស់អាជីវកម្មដែលគ្រោងមូលនិធិសម្រាប់ការរីកចម្រើន
- វិនិយោគិនដែលត្រូវការការដាក់ពង្រាយមានរចនាសម្ព័ន្ធ
- សហគ្រិនដែលស្វែងរកការបង្កើនប្រសិទ្ធភាពមូលធន

🇰🇭 ការផ្តោតលើកម្ពុជា: យើងយល់ដឹងពីរចនាសម្ព័ន្ធអាជីវកម្មក្នុងស្រុក ប្រព័ន្ធធនាគារ និងឱកាសរីកចម្រើន។

⚠️ សំខានg��: នេះគឺជាយុទ្ធសាស្ត្រមូលធនកម្រិតខ្ពស់សម្រាប់ម្ចាស់អាជីវកម្មធ្ងន់ធ្ងរដែលគ្រប់គ្រងមូលធនសំខាន់ៗ។

ត្រៀមខ្លួនដើម្បីបង្កើនប្រសិទ្ធភាពប្រព័ន្ធមូលធនរបស់អ្នកហើយឬនៅ? សូមផ្តល់ព័ត៌មានលម្អិតអំពីលក្ខណៈសម្បត្តិខាងលើ។

មានសំណួរ? ទាក់ទង @Chendasum ដោយផ្ទាល់។`;

    await sendLongMessage(
      bot,
      userId,
      clarityResponse,
      { parse_mode: "Markdown" },
      MESSAGE_CHUNK_SIZE,
    );

    const adminId = parseInt(process.env.ADMIN_CHAT_ID);
    if (adminId) {
      await bot.sendMessage(
        adminId,
        `🏛️ NEW CAPITAL CLARITY INTEREST:

អ្នកប្រើប្រាស់: ${firstName} (${userId})
ពេលវេលា: ${new Date().toLocaleString()}
ប្រភេទ: វគ្គយុទ្ធសាស្ត្រមូលធនឯកជន ($197)

អ្នកចាប់អារម្មណ៍កម្រិតខ្ពស់ចង់បង្កើនប្រសិទ្ធភាពរចនាសម្ព័ន្ធមូលធន។

អ្នកប្រើប្រាស់ត្រូវផ្តល់ព័ត៌មានលក្ខណៈសម្បត្តិ។`,
      );
    }
  } catch (error) {
    console.error("Error handling Capital Clarity interest:", error);
    await bot.sendMessage(
      msg.chat.id,
      "❌ មានបញ្ហាក្នុងការដំណើរការសំណើ Capital Clarity។",
    );
  }
});

async function handleVipApply(msg) {
  try {
    const user = await User.findOne({ telegramId: msg.from.id });

    if (!user || !user.isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី VIP។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }

    const vipApplyMessage = `🌟 VIP PROGRAM + CAPITAL STRATEGY ACCESS

សូមផ្ញើព័ត៌មានដូចខាងក្រោម:

1️⃣ ឈ្មោះពេញ:
2️⃣ អាជីវកម្ម/ការងារ:
3️⃣ គោលដៅហិរញ្ញវត្ថុ:
4️⃣ បញ្ហា Capital Flow បច្ចុប្បន្ន:
5️⃣ ម៉ោងដែលអ្នកអាចពិគ្រោះ:
6️⃣ លេខទូរសព្ទ:

💰 តម្លៃ VIP: $197 (789,576 រៀល)
✅ Strategic Foundation Session 1-on-1 (60 នាទី)
✅ ការតាមដាន 30 ថ្ងៃ + Implementation Support
✅ Capital Foundation Development
✅ Capital Clarity Preview (15 នាទី)
✅ Readiness Assessment for Advanced Capital Systems
✅ Strategic Network Introductions
✅ Pathway to Advanced Capital Work

📞 បន្ទាប់ពីអ្នកផ្ញើព័ត៌មាន Admin នឹងទាក់ទងអ្នក`;

    await sendLongMessage(
      bot,
      msg.chat.id,
      vipApplyMessage,
      {},
      MESSAGE_CHUNK_SIZE,
    );

    const adminId = parseInt(process.env.ADMIN_CHAT_ID);
    if (adminId) {
      await bot.sendMessage(
        adminId,
        `🌟 VIP APPLICATION REQUEST:

អ្នកប្រើប្រាស់: ${user.firstName} ${user.lastName || ""}
ID: ${user.telegramId}
ស្ថានភាព: ${user.isPaid ? "បានទូទាត់" : "មិនទាន់ទូទាត់"} ${user.isVip ? "| VIP រួចហើយ" : ""}

អ្នកប្រើប្រាស់ចង់ដាក់ពាក្យសម្រាប់កម្មវិធី VIP។
តាមដានព័ត៌មានពាក្យសុំរបស់ពួកគេ។`,
      );
    }
  } catch (error) {
    console.error("Error in VIP Apply handler:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហាក្នុងការដំណើរការសំណើ VIP។");
  }
}

async function handleCapitalClarityApplicationRequest(msg) {
  const userId = msg.from.id;
  const firstName = msg.from.first_name || "សហគ្រិន";

  const applicationMessage = `📋 ទម្រង់ពាក្យសុំ Capital Clarity

ជំរាបសួរ ${firstName}!

ត្រៀមខ្លួនរួចរាល់ហើយឬនៅដើម្បីដាក់ពាក្យសុំ Capital Clarity របស់អ្នក? សូមផ្តល់ព័ត៌មានដែលត្រូវការទាំងអស់ក្នុងទម្រង់ខាងក្រោម:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAPITAL CLARITY APPLICATION
1. តួនាទី: [តួនាទីរបស់អ្នក - ស្ថាបនិក/អ្នកប្រតិបត្តិ/វិនិយោគិន]
2. ក្រុមហ៊ុន: [ឈ្មោះក្រុមហ៊ុន និងជួរចំណូលប្រចាំឆ្នាំ]
3. ស្ថានភាពមូលធន: [ស្ថានភាពមូលធន/មូលនិធិបច្ចុប្បន្ន]
4. បញ្ហាប្រឈមចម្បង: [បញ្ហាប្រឈមរចនាសម្ព័ន្ធចម្បងរបស់អ្នក]
5. កាលកំណត់: [កាលកំណត់ និងគោលដៅវិនិយោគ]
6. ទំនាក់ទំនង: [អ៊ីមែល និងលេខទូរសព្ទ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 ឧទាហរណ៍ពាក្យសុំ:
CAPITAL CLARITY APPLICATION
1. តួនាទី: ស្ថាបនិក
2. ក្រុមហ៊ុន: Tech Startup - ចំណូលប្រចាំឆ្នាំ $200K
3. ស្ថានភាពមូលធន: កំពុងគ្រប់គ្រងមូលធនបង្វិល $50K, ស្វែងរកមូលនិធិ $300K
4. បញ្ហាប្រឈមចម្បង: ត្រូវការយុទ្ធសាស្ត្រដាក់ពង្រាយមូលធនដែលមានរចនាសម្ព័ន្ធ
5. កាលកំណត់: ត្រៀមវិនិយោគក្នុងរយៈពេល ៣ ខែ
6. ទំនាក់ទំនង: chendasum168@fmail.com, +855-11-665-697

🎯 ការណែនាំ:
• ចម្លងទម្រង់ខាងលើ
• ជំនួសដោយព័ត៌មានពិតរបស់អ្នក
• ផ្ញើជាសារពេញលេញមួយ
• យើងនឹងពិនិត្យ និងឆ្លើយតបក្នុងរយៈពេល ២៤ ម៉ោង

💰 ការវិនិយោគ: $197 (តម្លៃធម្មតា: $497)
🔥 មានកំណត់: ៥ កន្លែងក្នុងមួយខែ

មានសំណួរ? ទាក់ទង @Chendasum ដោយផ្ទាល់។`;

  await sendLongMessage(
    bot,
    userId,
    applicationMessage,
    {},
    MESSAGE_CHUNK_SIZE,
  );

  const adminId = parseInt(process.env.ADMIN_CHAT_ID);
  if (adminId) {
    await bot.sendMessage(
      adminId,
      `📋 APPLICATION FORM REQUESTED:

អ្នកប្រើប្រាស់: ${firstName} (${userId})
សារ: "${msg.text}"
ពេលវេលា: ${new Date().toLocaleString()}

អ្នកប្រើប្រាស់ត្រៀមដាក់ពាក្យសុំ Capital Clarity។`,
    );
  }
}

async function handleTextResponse(msg) {
  const userId = msg.from.id;
  const text = msg.text.toUpperCase();

  try {
    // FIXED: Use correct PostgreSQL field name
    const user = await User.findOne({ telegram_id: userId });

    if (!user) {
      await bot.sendMessage(
        msg.chat.id,
        "សូមចុះឈ្មោះមុន។ ប្រើ /start ដើម្បីចាប់ផ្តើម។",
      );
      return;
    }

    const restrictedActions = ["READY FOR DAY 1", "DAY", "PROGRAM COMPLETE"];
    const isRestrictedAction = restrictedActions.some((action) =>
      text.includes(action),
    );

    // FIXED: Check is_paid properly (PostgreSQL stores as 't'/'f' strings)
    const isPaid = user.is_paid === "t" || user.is_paid === true;

    console.log(`Text response access check for user ${userId}:`, {
      text: text,
      user_found: !!user,
      is_paid_raw: user?.is_paid,
      is_paid_boolean: isPaid,
      is_restricted_action: isRestrictedAction,
      tier: user?.tier,
    });

    if (isRestrictedAction && !isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }

    if (text === "READY FOR DAY 1") {
      await handleReadyForDay1(msg);
    } else if (text.includes("DAY") && text.includes("COMPLETE")) {
      await handleDayComplete(msg);
    } else if (text === "PROGRAM COMPLETE") {
      await handleProgramComplete(msg);
    }
  } catch (error) {
    console.error("Error handling general text response:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
}

async function handleReadyForDay1(msg) {
  const userId = msg.from.id;

  try {
    console.log("🚀🚀🚀 HANDLEREADYFORDAY1 FUNCTION CALLED! 🚀🚀🚀");
    console.log("User ID:", userId);
    console.log("Message text:", msg.text);

    // FIXED: Use correct PostgreSQL field name
    const user = await User.findOne({ telegram_id: userId });

    // FIXED: Check is_paid properly (PostgreSQL stores as 't'/'f' strings)
    const isPaid = user?.is_paid === true || user?.is_paid === "t";

    console.log(`READY FOR DAY 1 access check for user ${userId}:`, {
      user_found: !!user,
      is_paid_raw: user?.is_paid,
      is_paid_boolean: isPaid,
      tier: user?.tier,
    });

    if (!user || !isPaid) {
      await bot.sendMessage(
        msg.chat.id,
        "🔒 សូមទូទាត់មុនដើម្បីចូលរួមកម្មវិធី។ ប្រើ /pricing ដើម្បីមើលព័ត៌មាន។",
      );
      return;
    }

    // FIXED: Use correct PostgreSQL field names for Progress table
    await Progress.findOneAndUpdate(
      { user_id: userId },
      {
        ready_for_day_1: true,
        current_day: 1,
      },
      { upsert: true },
    );

    await bot.sendMessage(
      msg.chat.id,
      `🎉 ល្អហើយ! អ្នកត្រៀមរួចហើយ!

ចាប់ផ្តើមថ្ងៃទី ១ ឥឡូវនេះ: /day1

ថ្ងៃទី ១ នឹងផ្ញើស្វ័យប្រវត្តិនៅម៉ោង ៩ ព្រឹកថ្ងៃស្អែកផងដែរ។

ជំនួយ ២៤/៧ ជាភាសាខ្មែរ! 💪`,
    );
  } catch (error) {
    console.error("Error handling ready for day 1:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
}

async function handleDayComplete(msg) {
  const dayMatch = msg.text.toUpperCase().match(/DAY\s*(\d+)\s*COMPLETE/);
  if (!dayMatch) return;

  const dayNumber = parseInt(dayMatch[1]);

  const updateField = `day${dayNumber}Completed`;
  const completedAtField = `day${dayNumber}CompletedAt`;
  const nextDay = dayNumber + 1;

  // FIXED: Use correct PostgreSQL field names for Progress table
  await Progress.findOneAndUpdate(
    { user_id: msg.from.id },
    {
      [updateField]: true,
      [completedAtField]: new Date(),
      current_day: nextDay <= 7 ? nextDay : 7,
    },
    { upsert: true },
  );

  const completeReaction = emojiReactions.lessonCompleteReaction(dayNumber);
  await bot.sendMessage(msg.chat.id, completeReaction);

  setTimeout(async () => {
    const celebrationMessage = celebrations.dayCompleteCelebration(dayNumber);
    await sendLongMessage(
      bot,
      msg.chat.id,
      celebrationMessage,
      {},
      MESSAGE_CHUNK_SIZE,
    );
  }, 500);

  setTimeout(async () => {
    await quotesCommands.sendMilestoneQuote(bot, msg.chat.id, "day_complete");
  }, 2000);

  const progressPercentage = (dayNumber / 7) * 100;
  const progressCelebration =
    celebrations.getProgressCelebration(progressPercentage);
  await bot.sendMessage(
    msg.chat.id,
    `📊 ការដំណើរ: ${Math.round(progressPercentage)}% - ${progressCelebration}`,
  );

  setTimeout(async () => {
    try {
      const user = await User.findOne({ telegramId: msg.from.id });
      const progress = await Progress.findOne({ userId: msg.from.id });

      if (user && progress) {
        const completedDays = [];
        for (let i = 1; i <= 7; i++) {
          if (progress[`day${i}Completed`]) {
            completedDays.push(i);
          }
        }

        const milestone = progressBadges.milestones[`day${dayNumber}`];
        if (milestone) {
          const badgeMessage = progressBadges.createAnimatedBadge(
            "milestone",
            `🏅 បានទទួល: ${milestone.name} ${milestone.emoji}`,
            `${milestone.reward}\n\n💫 ម្តងទៀត អ្នកខ្លាំង!`,
          );
          await sendLongMessage(
            bot,
            msg.chat.id,
            badgeMessage,
            {},
            MESSAGE_CHUNK_SIZE,
          );
        }

        if (completedDays.length === 3) {
          const specialBadge = progressBadges.createAnimatedBadge(
            "special",
            "🔥 មជ្ឈមភាព Badge បានទទួល!",
            "អ្នកបានបញ្ចប់ ៣ ថ្ងៃ! ការដំណើរកំពុងចាប់ផ្តើម!",
          );
          await sendLongMessage(
            bot,
            msg.chat.id,
            specialBadge,
            {},
            MESSAGE_CHUNK_SIZE,
          );
        } else if (completedDays.length === 5) {
          const specialBadge = progressBadges.createAnimatedBadge(
            "special",
            "💪 អ្នកខ្លាំង Badge បានទទួល!",
            "អ្នកបានបញ្ចប់ ៥ ថ្ងៃ! ស្ទើរតែបានហើយ!",
          );
          await sendLongMessage(
            bot,
            msg.chat.id,
            specialBadge,
            {},
            MESSAGE_CHUNK_SIZE,
          );
        } else if (completedDays.length === 7) {
          const specialBadge = progressBadges.createAnimatedBadge(
            "special",
            "🏆 Champion Badge បានទទួល!",
            "អ្នកបានបញ្ចប់ទាំងអស់! អ្នកកំពុងដំណើរការបានល្អ!",
          );
          await sendLongMessage(
            bot,
            msg.chat.id,
            specialBadge,
            {},
            MESSAGE_CHUNK_SIZE,
          );
        }
      }
    } catch (error) {
      console.error("Error showing badge achievement:", error);
    }
  }, 2000);

  if (dayNumber < 7) {
    setTimeout(async () => {
      const nextDay = dayNumber + 1;
      const nextDayMessage = `🌅 ថ្ងៃល្អ ${msg.from.first_name || "មិត្ត"}!

🎯 DAY ${nextDay} បានមកដល់! ត្រៀមខ្លួនសម្រាប់មេរៀនថ្មី!

ចុច /day${nextDay} ដើម្បីចាប់ផ្តើម។

រយៈពេល: ត្រឹមតែ ១៥-២០ នាទីប៉ុណ្ណោះ! 💪`;

      await sendLongMessage(
        bot,
        msg.chat.id,
        nextDayMessage,
        {},
        MESSAGE_CHUNK_SIZE,
      );
    }, 86400000);
  }

  if (dayNumber === 3) {
    setTimeout(async () => {
      const user = await User.findOne({ telegramId: msg.from.id });
      if (!user || user.tier === "premium" || user.tier === "vip") return;

      const upsellMessage = `🔥 ${msg.from.first_name || "មិត្ត"}, អ្នកកំពុងធ្វើបានល្អ!

បានដឹងទេថា Premium members ទទួលបាន:
🎯 ការណែនាំផ្ទាល់ខ្លួន
📊 ឧបករណ៍តាមដាន Financial
💰 ការចូលដំណើរការ Investment
🏆 VIP community access

Upgrade ទៅ Premium ($97) ឥឡូវនេះ!

ចុច /pricing សម្រាប់ព័ត៌មានបន្ថែម`;

      await sendLongMessage(
        bot,
        msg.chat.id,
        upsellMessage,
        {},
        MESSAGE_CHUNK_SIZE,
      );
    }, 3600000);
  }

  if (dayNumber === 7) {
    setTimeout(async () => {
      const followUpMessage = `👋 ${msg.from.first_name || "មិត្ត"}!

បាន 30 ថ្ងៃហើយចាប់តាំងពីអ្នកបានបញ្ចប់ 7-Day Money Flow Reset™!

🤔 តើអ្នកសន្សំបានប៉ុន្មាន?

ចូលរួមការស្ទង់មតិរហ័ស (២ នាទី):
✅ ចែករំលលទ្ធផលរបស់អ្នក
✅ ទទួលបានការណែនាំបន្ថែម
✅ ជួយកម្មវិធីកាន់តែប្រសើរ

សរសេរលទ្ធផលរបស់អ្នកមកឱ្យខ្ញុំ! 📊

ឧទាហរណ៍: "ខ្ញុំកែប្រែទម្លាប់ការចំណាយបានហើយ!"`;

      await sendLongMessage(
        bot,
        msg.chat.id,
        followUpMessage,
        {},
        MESSAGE_CHUNK_SIZE,
      );
    }, 2592000000);
  }

  if (dayNumber < 7) {
    await bot.sendMessage(
      msg.chat.id,
      `🚀 ត្រៀមរួចសម្រាប់ថ្ងៃទី ${nextDay}? ចុច /day${nextDay}`,
    );
  } else {
    setTimeout(async () => {
      await bot.sendMessage(
        msg.chat.id,
        `🎊 អ្នកបានបញ្ចប់កម្មវិធីពេញលេញ! សរសេរ "PROGRAM COMPLETE" ដើម្បីទទួលយកលទ្ធផលចុងក្រោយ!`,
      );
    }, 3000);
  }
}

async function handleProgramComplete(msg) {
  if (isDuplicateMessage(msg)) return;
  try {
    const programCelebration =
      celebrations.programCompleteCelebration(`🎯 ជំហានបន្ទាប់:
1️⃣ អនុវត្តផែនការ ៣០ ថ្ងៃ
2️⃣ ពិនិត្យដំណើរការប្រចាំសប្តាហ៍
3️⃣ មានសំណួរ? ទាក់ទងមកបាន!

🚀 ចង់បន្តកម្រិតបន្ទាប់?
VIP Advanced Program ចាប់ផ្តើមខែក្រោយ!
សួរ: "VIP PROGRAM INFO"`);

    await sendLongMessage(
      bot,
      msg.chat.id,
      programCelebration,
      {},
      MESSAGE_CHUNK_SIZE,
    );

    setTimeout(async () => {
      await quotesCommands.sendMilestoneQuote(
        bot,
        msg.chat.id,
        "program_complete",
      );
    }, 2000);

    await Progress.findOneAndUpdate(
      { userId: msg.from.id },
      {
        programCompleted: true,
        programCompletedAt: new Date(),
      },
      { upsert: true },
    );

    setTimeout(async () => {
      const achievement = celebrations.milestoneCelebration(
        "អ្នកបានបញ្ចប់កម្មវិធីជោគជ័យ!",
        "អ្នកឥឡូវនេះមានចំណេះដឹងគ្រឹះសម្រាប់គ្រប់គ្រងលុយ!",
      );
      await sendLongMessage(
        bot,
        msg.chat.id,
        achievement,
        {},
        MESSAGE_CHUNK_SIZE,
      );
    }, 2000);

    setTimeout(async () => {
      await vipCommands.offer(msg, bot);
    }, 5000);
  } catch (error) {
    console.error("Error handling PROGRAM COMPLETE:", error);
    await bot.sendMessage(msg.chat.id, "❌ មានបញ្ហា។ សូមសាកល្បងម្តងទៀត។");
  }
}

cron.schedule("0 9 * * *", async () => {
  console.log("🕘 Sending daily messages...");
  try {
    await scheduler.sendDailyMessages(bot);
  } catch (error) {
    console.error("Error sending daily messages via cron:", error);
  }
});

app.post("/webhook/payment", async (req, res) => {
  try {
    const { userId, amount, status, transactionId } = req.body;

    if (status === "completed" && amount >= 97) {
      await paymentCommands.confirmPayment(bot, userId, transactionId);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Payment webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post(`/bot${process.env.BOT_TOKEN}`, async (req, res) => {
  try {
    console.log("🔔 Webhook received:", JSON.stringify(req.body, null, 2));

    if (req.body && req.body.message) {
      const message = req.body.message;
      console.log(
        "📨 Message from user:",
        message.from.id,
        "text:",
        message.text,
      );

      // SPECIAL DEBUG: Check if this is the "READY FOR DAY 1" message
      if (message.text && message.text.toUpperCase() === "READY FOR DAY 1") {
        console.log(
          "🎯🎯🎯 READY FOR DAY 1 MESSAGE DETECTED IN WEBHOOK! 🎯🎯🎯",
        );
        console.log("User ID:", message.from.id);
        console.log("Chat ID:", message.chat.id);
        console.log("Message text:", message.text);
      }

      // Check if it's a command
      if (message.text && message.text.startsWith("/")) {
        console.log("🎯 Command detected:", message.text);

        // Add a direct test command to verify webhook is working
        if (message.text.toLowerCase() === "/test") {
          console.log("🧪 Direct test command triggered");
          try {
            await bot.sendMessage(
              message.chat.id,
              "✅ Webhook is working! Bot is receiving messages correctly.",
            );
            res.sendStatus(200);
            return;
          } catch (sendError) {
            console.error("❌ Error sending test message:", sendError.message);
          }
        }
      }
    }

    console.log("⚡ Processing update through bot.processUpdate...");
    await bot.processUpdate(req.body);
    console.log("✅ Update processed successfully");

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Telegram webhook error:", error.message);
    console.error("❌ Full error stack:", error.stack);
    res.sendStatus(500);
  }
});

app.get("/analytics", async (req, res) => {
  try {
    const stats = await analytics.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

app.get("/api", (req, res) => {
  res.json({
    name: "7-Day Money Flow Reset™ Telegram Bot",
    description:
      "A Telegram bot that delivers a 7-day financial education program in Khmer language",
    status: "Running",
    version: "2.0.0",
    domain: getReplitUrl(), // Use dynamic Replit URL
    timestamp: new Date().toISOString(),
    automation: "Enhanced with 7-Day Money Flow automation features",
    endpoints: {
      health: "/health",
      analytics: "/analytics",
      payment_webhook: "/webhook/payment",
      ping: "/ping", // Added ping endpoint
    },
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    name: "7-Day Money Flow Reset™ Telegram Bot",
    description:
      "A Telegram bot that delivers a 7-day financial education program in Khmer language",
    status: "Running",
    version: "2.0.0",
    domain: getReplitUrl(), // Use dynamic Replit URL
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    automation: "Enhanced with 7-Day Money Flow automation features",
    endpoints: {
      health: "/health",
      analytics: "/analytics",
      payment_webhook: "/webhook/payment",
      ping: "/ping", // Added ping endpoint
    },
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    automation: "7-Day automation active",
    webhookUrl: `${getReplitUrl()}/bot${process.env.BOT_TOKEN}`, // Use dynamic Replit URL
  });
});

// New /ping endpoint for direct server reachability test
app.get("/ping", (req, res) => {
  console.log("🏓 /ping endpoint hit!");
  res.status(200).send("Pong!");
});

app.post("/setup-webhook", async (req, res) => {
  try {
    const replitBaseUrl = getReplitUrl();
    const correctWebhookUrl = `${replitBaseUrl}/bot${process.env.BOT_TOKEN}`;
    console.log("🔧 Manual webhook setup to:", correctWebhookUrl);
    await bot.setWebHook(correctWebhookUrl);
    res.json({
      success: true,
      message: "Webhook set successfully",
      url: correctWebhookUrl,
    });
  } catch (error) {
    console.error("Manual webhook setup error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/healthz", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    automation: "Enhanced with 7-Day automation",
  });
});

app.get("/ready", (req, res) => {
  res.status(200).json({
    status: "ready",
    timestamp: new Date().toISOString(),
    features: "7-Day automation enabled",
  });
});

app.get("/webhook-info", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getWebhookInfo`,
    );
    const webhookInfo = await response.json();
    res.json(webhookInfo);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to get webhook info", details: error.message });
  }
});

app.get("/test-bot", async (req, res) => {
  try {
    const botInfo = await bot.getMe();
    res.json({ ok: true, result: botInfo });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to get bot info", details: error.message });
  }
});

app.get("/bot-status", async (req, res) => {
  try {
    const botInfo = await bot.getMe();

    const webhookResponse = await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getWebhookInfo`,
    );
    const webhookData = await webhookResponse.json();
    const webhookInfo = webhookData.result;

    res.json({
      bot_status: botInfo ? "✅ Online" : "❌ Offline",
      webhook_status: webhookInfo.url ? "✅ Active" : "❌ Not Set",
      webhook_url: webhookInfo.url || "None",
      pending_updates: webhookInfo.pending_update_count || 0,
      server_uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      bot_info: {
        id: botInfo.id,
        username: botInfo.username,
        first_name: botInfo.first_name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use("/public", express.static("public"));

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`🔥 7-Day Money Flow automation ACTIVE!`);
  console.log(`✅ Server is fully listening for incoming requests.`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

const contentScheduler = new ContentScheduler(bot);
contentScheduler.start();

console.log("🤖 Bot started successfully with 7-Day + 30-Day automation!");
console.log("🚀 Features added:");
console.log("   • Auto next-day reminders (24h delay)");
console.log("   • Day 3 upsell automation (1h delay)");
console.log("   • 30-day follow-up for results");
console.log("   • Enhanced welcome sequence");
console.log("   • 30-day extended content automation");
console.log("   • Daily content delivery (9 AM Cambodia)");
console.log("   • Evening motivation (6 PM Cambodia)");
console.log("   • Weekly reviews (Sunday 8 PM Cambodia)");
console.log("🔱 7-Day Money Flow Reset™ + 30-Day Extended Content READY!");
