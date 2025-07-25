const User = require("../models/User");
const celebrations = require("../services/celebrations");
const emojiReactions = require("../services/emoji-reactions");
const TierManager = require("../services/tier-manager");
const ConversionOptimizer = require("../services/conversion-optimizer");
const { sendLongMessage } = require("../utils/message-splitter");

// Define constants for message chunk size for consistency
const MESSAGE_CHUNK_SIZE = 800; // Or adjust based on your sendLongMessage implementation

async function pricing(msg, bot) {
  // Input validation
  if (!msg || !msg.from || !bot) {
    console.error("Invalid parameters in pricing command");
    return;
  }

  const userId = msg.from.id;
  const chatId = msg.chat.id;

  if (!userId || !chatId) {
    console.error("Missing userId or chatId in pricing");
    return;
  }

  // Analytics logging
  console.log(`Pricing view by user ${userId} at ${new Date()}`);

  try {
    const tierManager = new TierManager();
    const conversionOptimizer = new ConversionOptimizer();

    // Check if user is paid
    const user = await User.findOne({ telegramId: userId });
    const isPaid = user ? user.isPaid : false;

    // Track pricing view and analytics for unpaid users
    if (!isPaid) {
      try {
        await User.findOneAndUpdate(
          { telegramId: userId },
          {
            lastPricingView: new Date(),
            lastActive: new Date(),
            $inc: { pricingViewCount: 1 }, // Analytics tracking
          },
          { upsert: true }, // Create the user if not found
        );

        // Track conversion funnel
        console.log(
          `📊 Pricing funnel: User ${userId} viewed pricing (${user?.pricingViewCount || 1} times)`,
        );
      } catch (updateError) {
        console.error("Error updating user pricing view:", updateError);
      }
    }

    // Get enhanced pricing display based on payment status
    // Assuming getPricingDisplay returns a string with no bolding as per user's request for user-facing text
    const pricingMessage = tierManager.getPricingDisplay(isPaid);

    await sendLongMessage(
      bot,
      chatId,
      pricingMessage,
      { parse_mode: "Markdown" }, // Keep Markdown if tierManager uses it internally
      MESSAGE_CHUNK_SIZE,
    );

    // If user is unpaid, schedule follow-up conversion sequence
    if (!isPaid) {
      try {
        console.log(
          `🎯 Starting conversion sequence for unpaid user ${userId}`,
        );
        conversionOptimizer.scheduleFollowUpSequence(bot, chatId, userId);
      } catch (conversionError) {
        console.error("Error starting conversion sequence:", conversionError);
      }
    }

    // Success analytics
    console.log(`Pricing display sent successfully to user ${userId}`);
  } catch (error) {
    console.error("Error in pricing command:", error);

    try {
      await bot.sendMessage(
        chatId,
        "សូមអភ័យទោស! មានបញ្ហាក្នុងការបង្ហាញតម្លៃ។ សូមព្យាយាមម្តងទៀត។",
      );
    } catch (sendError) {
      console.error("Failed to send pricing error message:", sendError);
    }
  }
}

async function instructions(msg, bot) {
  // Input validation
  if (!msg || !msg.from || !bot) {
    console.error("Invalid parameters in instructions command");
    return;
  }

  const userId = msg.from.id;
  const chatId = msg.chat.id;

  // Analytics logging
  console.log(
    `Payment instructions requested by user ${userId} at ${new Date()}`,
  );

  try {
    // Enhanced payment instructions with Cambodia context - Cleaned and formatted
    const paymentMessage = `💳 ការណែនាំទូទាត់ (Cambodia Payment Guide)

🏦 វិធី ១: ABA Bank (រហ័ស ៥-១០ នាទី)
• គណនី: 000 194 742
• ឈ្មោះ: SUM CHENDA
• ចំនួន: $24 USD (LAUNCH50)
• Reference: BOT${userId}
• 💡 ប្រើ ABA Mobile/Internet Banking ផ្ទាល់

🏦 វិធី ២: ACLEDA Bank (រហ័ស ៥-១៥ នាទី)
• គណនី: 092 798 169
• ឈ្មោះ: SUM CHENDA
• ចំនួន: $24 USD (LAUNCH50)
• Reference: BOT${userId}
• 💡 ប្រើ ACLEDA Unity/Mobile Banking

📱 វិធី ៣: Wing Transfer (រហ័ស ២-៥ នាទី)
• លេខ: 102 534 677
• ឈ្មោះ: SUM CHENDA
• ចំនួន: $24 USD (LAUNCH50)
• កំណត់ចំណាំ: BOT${userId}
• 💡 ប្រើ Wing App/Agent ណាក៏បាន

🔒 សុវត្ថិភាពការទូទាត់:
✅ គណនីផ្លូវការ ១០០% - មិនមែនជាការបោកប្រាស់ទេ
✅ ការផ្ទៀងផ្ទាត់ភ្លាមៗ តាមរយៈ Reference
✅ ទិន្នន័យរបស់អ្នកត្រូវបានគ្រប់គ្រងដោយសុវត្ថិភាព
✅ ការសងប្រាក់វិញ ១០០% បើមិនពេញចិត្ត

⚡ បន្ទាប់ពីទូទាត់ (ការអនុម័តក្នុង ២៤ ម៉ោង):
1. ថតរូបបញ្ជាក់ការទូទាត់ (Screenshot)
2. ផ្ញើមកដោយផ្ទាល់ក្នុងនេះ
3. ការអនុម័តស្វ័យប្រវត្តិ ឬ ក្នុង ២៤ ម៉ោង
4. ចាប់ផ្តើម Day 1 ភ្លាមៗ!

🎯 ចង់ចាប់ផ្តើមភ្លាមៗ?
• Wing = លឿនបំផុត (២-៥ នាទី)
• ABA = ជម្រើសល្អ (៥-១០ នាទី)
• ACLEDA = រហ័ស (៥-១៥ នាទី)

🔙 ការកែច្នៃ:
• /pricing - មើលតម្លៃវិញ
• /start - ត្រឡប់ទៅមេន្យូដើម
• /help - ជំនួយពេញលេញ
• /faq - សំណួរញឹកញាប់

💬 មានសំណួរ?
@Chendasum - VIP Support (ឆ្លើយរហ័ស!)

🏆 រំលឹក: ៩២% នៃសិស្សបានសន្សំ $200+ ក្នុង ៧ ថ្ងៃ!`;

    await sendLongMessage(bot, chatId, paymentMessage, {}, MESSAGE_CHUNK_SIZE);

    // Track payment instructions view
    try {
      await User.findOneAndUpdate(
        { telegramId: userId },
        {
          lastInstructionsView: new Date(),
          lastActive: new Date(),
          $inc: { instructionsViewCount: 1 },
        },
        { upsert: true },
      );

      console.log(
        `📊 Conversion funnel: User ${userId} viewed payment instructions`,
      );
    } catch (updateError) {
      console.error("Error tracking instructions view:", updateError);
    }
  } catch (error) {
    console.error("Error in instructions command:", error);

    try {
      await bot.sendMessage(
        chatId,
        "សូមអភ័យទោស! មានបញ្ហាក្នុងការបង្ហាញការណែនាំ។ សូមព្យាយាមម្តងទៀត។",
      );
    } catch (sendError) {
      console.error("Failed to send instructions error message:", sendError);
    }
  }
}

async function confirmPayment(
  bot,
  userId,
  transactionId,
  tier = "essential",
  amount = 24,
) {
  // Input validation
  if (!bot || !userId || !transactionId) {
    console.error("Invalid parameters in confirmPayment");
    return;
  }

  // Analytics logging
  console.log(
    `Payment confirmation for user ${userId}, transaction ${transactionId}, amount $${amount}`,
  );

  try {
    const tierManager = new TierManager();
    const conversionOptimizer = new ConversionOptimizer();
    const userTier = tierManager.getTierFromAmount(amount);

    // Update user payment status with comprehensive tier information
    const updateResult = await User.findOneAndUpdate(
      { telegramId: userId },
      {
        isPaid: true,
        paymentDate: new Date(),
        transactionId: transactionId,
        tier: userTier,
        tierPrice: amount,
        isVip: userTier === "vip", // Keep backward compatibility
        paymentMethod: "manual_confirmation", // Track payment method
        conversionDate: new Date(), // Analytics
      },
      { new: true },
    );

    if (!updateResult) {
      console.error(`Failed to update user ${userId} payment status`);
      return;
    }

    // Cancel any active follow-up sequences for this user
    try {
      conversionOptimizer.cancelFollowUpSequence(userId);
      console.log(`✅ User ${userId} converted - follow-up sequence canceled`);
    } catch (cancelError) {
      console.error("Error canceling follow-up sequence:", cancelError);
    }

    // Send payment success emoji reaction first
    try {
      const paymentReaction = emojiReactions.paymentSuccessReaction();
      await bot.sendMessage(userId, paymentReaction);
    } catch (reactionError) {
      console.error("Error sending payment reaction:", reactionError);
    }

    // Send tier-specific welcome message
    setTimeout(async () => {
      try {
        const welcomeMessage = tierManager.getTierWelcomeMessage(userTier);
        if (welcomeMessage && welcomeMessage.length > 0) {
          await sendLongMessage(
            bot,
            userId,
            welcomeMessage,
            { parse_mode: "Markdown" },
            MESSAGE_CHUNK_SIZE,
          );
        }
      } catch (welcomeError) {
        console.error("Error sending welcome message:", welcomeError);
      }
    }, 1000);

    // Create enhanced payment confirmation celebration - Cleaned and formatted
    setTimeout(async () => {
      try {
        const confirmMessage = celebrations.paymentConfirmedCelebration(
          `🚀 ជំហានបន្ទាប់ - Cambodia Money Flow Reset:

🎯 ការចូលប្រើភ្លាមៗ:
• អ្នកអាចចាប់ផ្តើមបានភ្លាមៗ!
• មេរៀនទាំង ៧ ថ្ងៃត្រូវបានដោះសោរួចហើយ
• Tier: ${userTier.toUpperCase()} - $${amount}

📚 មគ្គុទេសក៍ចាប់ផ្តើមរហ័ស:
1. ត្រៀមសៀវភៅ និងប៊ិច
2. រកកន្លែងស្ងាត់ ១៥-២០ នាទី
3. ធ្វើតាមរបៀប ៧ ថ្ងៃ ដោយលំដាប់

🔥 ចាប់ផ្តើម Day 1 ឥឡូវនេះ:
សរសេរ "READY FOR DAY 1" ឬ ចុច /day1

💡 គន្លឹះជោគជ័យ:
• ធ្វើ ១ ថ្ងៃ/មេរៀន សម្រាប់លទ្ធផលល្អ
• អនុវត្តតាមការណែនាំ ១០០%
• កត់ត្រាលទ្ធផលនីមួយៗ

🏆 ៩២% នៃអ្នកដែលបានបញ្ចប់កម្មវិធីបានសន្សំ $200+ ក្នុង ៧ ថ្ងៃ!

អរគុណដែលជឿទុកចិត្ត! 💪`,
        );

        await sendLongMessage(
          bot,
          userId,
          confirmMessage,
          {},
          MESSAGE_CHUNK_SIZE,
        );
      } catch (confirmError) {
        console.error("Error sending confirmation message:", confirmError);
      }
    }, 1500);

    // Send follow-up celebration after 3 seconds - Cleaned and formatted
    setTimeout(async () => {
      try {
        const motivationMessage = celebrations.quickCelebration(
          "អ្នកបានចាប់ផ្តើមដំណើរផ្លាស់ប្តូរជីវិតហិរញ្ញវត្ថុហើយ!",
        );
        await bot.sendMessage(userId, motivationMessage);
      } catch (motivationError) {
        console.error("Error sending motivation message:", motivationError);
      }
    }, 3000);

    // Enhanced admin notification (kept as is, as it's not user-facing)
    const adminId = process.env.ADMIN_CHAT_ID;
    if (adminId) {
      try {
        const adminMessage = `💰 NEW PAYMENT CONFIRMED!

👤 User: ${userId}
💳 Transaction: ${transactionId}
💵 Amount: $${amount}
🎯 Tier: ${userTier.toUpperCase()}
📅 Date: ${new Date().toLocaleString("km-KH")}
⏰ Time: ${new Date().toISOString()}

📊 Conversion Analytics:
• Payment Method: Manual Confirmation
• User Tier: ${userTier}
• Total Conversions Today: [Auto-calculated]

🎯 Next: User will start Day 1 program`;

        await bot.sendMessage(adminId, adminMessage);
      } catch (adminError) {
        console.error("Error sending admin notification:", adminError);
      }
    }

    // Success analytics logging
    console.log(
      `✅ Payment confirmation completed successfully for user ${userId}`,
    );
  } catch (error) {
    console.error("Error confirming payment:", error);

    // Try to notify user of error
    try {
      await bot.sendMessage(
        userId,
        "មានបញ្ហាក្នុងការបញ្ជាក់ការទូទាត់។ សូមទាក់ទង admin ភ្លាម!",
      );
    } catch (notifyError) {
      console.error(
        "Failed to notify user of payment confirmation error:",
        notifyError,
      );
    }
  }
}

module.exports = { pricing, instructions, confirmPayment };
