const User = require("../models/User"); // Assuming User model is available for user data
const KhmerQuoteGenerator = require("../services/khmer-quotes"); // Import the KhmerQuoteGenerator service

const quoteGenerator = new KhmerQuoteGenerator(); // Instantiate the quote generator

/**
 * Handles the /quote command: Shows a daily motivational quote.
 * Requires user to be paid.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function dailyQuote(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Get user data to check payment status
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.sendMessage(chatId, "សូមចុច /start ដើម្បីចាប់ផ្តើម។");
      return;
    }

    // Check if user has paid (quotes are considered a premium feature)
    if (!user.isPaid) {
      await bot.sendMessage(
        chatId,
        "🔒 សម្រង់ប្រាជ្ញាប្រចាំថ្ងៃ សម្រាប់តែសមាជិកដែលបានទូទាត់ប៉ុណ្ណោះ។\n\nប្រើ /pricing ដើម្បីមើលព័ត៌មានការចូលរួម។",
      );
      return;
    }

    // Get the daily quote from the generator
    const quoteData = quoteGenerator.getDailyQuote();
    // Format the quote for Telegram display
    const formattedQuote = quoteGenerator.formatQuote(quoteData);

    await bot.sendMessage(chatId, formattedQuote);

    // Update user's last active timestamp
    await User.findOneAndUpdate(
      { telegramId: userId },
      { lastActive: new Date() },
    );
  } catch (error) {
    console.error("Error in daily quote command:", error);
    await bot.sendMessage(
      chatId,
      "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។ សូមសាកល្បងម្តងទៀតនៅពេលក្រោយ។",
    ); // Improved error message
  }
}

/**
 * Handles the /wisdom command: Shows a random wisdom quote from any category.
 * Requires user to be paid.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function randomWisdom(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Get user data
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.sendMessage(chatId, "សូមចុច /start ដើម្បីចាប់ផ្តើម។");
      return;
    }

    // Check if user has paid
    if (!user.isPaid) {
      await bot.sendMessage(
        chatId,
        "🔒 សម្រង់ប្រាជ្ញា សម្រាប់តែសមាជិកដែលបានទូទាត់ប៉ុណ្ណោះ។\n\nប្រើ /pricing ដើម្បីមើលព័ត៌មានការចូលរួម។",
      );
      return;
    }

    // Get a random wisdom quote
    const quoteData = quoteGenerator.getRandomWisdom();
    const formattedQuote = quoteGenerator.formatQuote(quoteData);

    await bot.sendMessage(chatId, formattedQuote);

    // Update user's last active timestamp
    await User.findOneAndUpdate(
      { telegramId: userId },
      { lastActive: new Date() },
    );
  } catch (error) {
    console.error("Error in wisdom command:", error);
    await bot.sendMessage(
      chatId,
      "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។ សូមសាកល្បងម្តងទៀតនៅពេលក្រោយ។",
    ); // Improved error message
  }
}

/**
 * Handles the /quote_categories command: Shows available quote categories and usage instructions.
 * Requires user to be paid.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 */
async function showCategories(msg, bot) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Get user data
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.sendMessage(chatId, "សូមចុច /start ដើម្បីចាប់ផ្តើម។");
      return;
    }

    // Check if user has paid
    if (!user.isPaid) {
      await bot.sendMessage(
        chatId,
        "🔒 សម្រង់ប្រាជ្ញា សម្រាប់តែសមាជិកដែលបានទូទាត់ប៉ុណ្ណោះ។\n\nប្រើ /pricing ដើម្បីមើលព័ត៌មានការចូលរួម។",
      );
      return;
    }

    // Get statistics about available quotes and categories
    const stats = quoteGenerator.getQuoteStats();

    let categoriesMessage = `📚 ប្រភេទសម្រង់ប្រាជ្ញា:

🏛️ ប្រាជ្ញាប្រពៃណី (${stats.traditional} សម្រង់)
   ភាពប្រាជ្ញាពីបុរាណកាលអំពីលុយកាក់ និងជោគជ័យ

💰 គំនិតហិរញ្ញវត្ថុ (${stats.financial} សម្រង់)
   គោលការណ៍គ្រប់គ្រងលុយកាក់ និងការវិនិយោគ

🌟 ការលើកទឹកចិត្ត (${stats.motivation} សម្រង់)
   ការជំរុញចិត្ត និងការផ្លាស់ប្តូរជីវិត

🏆 ជោគជ័យ (${stats.success} សម្រង់)
   ការសម្រេចគោលដៅ និងភាពជោគជ័យ

📊 សរុប: ${stats.total} សម្រង់ក្នុង ${stats.categories} ប្រភេទ

🎯 របៀបប្រើ:
• /quote - សម្រង់ប្រចាំថ្ងៃ
• /wisdom - សម្រង់ចៃដន្យ
• /quote_traditional - ប្រាជ្ញាប្រពៃណី
• /quote_financial - គំនិតហិរញ្ញវត្ថុ
• /quote_motivation - ការលើកទឹកចិត្ត
• /quote_success - ជោគជ័យ`;

    await bot.sendMessage(chatId, categoriesMessage);

    // Update user's last active timestamp
    await User.findOneAndUpdate(
      { telegramId: userId },
      { lastActive: new Date() },
    );
  } catch (error) {
    console.error("Error in categories command:", error);
    await bot.sendMessage(
      chatId,
      "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។ សូមសាកល្បងម្តងទៀតនៅពេលក្រោយ។",
    ); // Improved error message
  }
}

/**
 * Handles category-specific quote commands (e.g., /quote_traditional).
 * Requires user to be paid.
 * @param {Object} msg - The Telegram message object.
 * @param {Object} bot - The Telegram bot instance.
 * @param {string} category - The specific category of quotes to retrieve.
 */
async function categoryQuote(msg, bot, category) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Get user data
    const user = await User.findOne({ telegramId: userId });
    if (!user) {
      await bot.sendMessage(chatId, "សូមចុច /start ដើម្បីចាប់ផ្តើម។");
      return;
    }

    // Check if user has paid
    if (!user.isPaid) {
      await bot.sendMessage(
        chatId,
        "🔒 សម្រង់ប្រាជ្ញា សម្រាប់តែសមាជិកដែលបានទូទាត់ប៉ុណ្ណោះ។\n\nប្រើ /pricing ដើម្បីមើលព័ត៌មានការចូលរួម។",
      );
      return;
    }

    // Get a quote from the specified category
    const quoteData = quoteGenerator.getQuoteByCategory(category);
    const formattedQuote = quoteGenerator.formatQuote(quoteData);

    await bot.sendMessage(chatId, formattedQuote);

    // Update user's last active timestamp
    await User.findOneAndUpdate(
      { telegramId: userId },
      { lastActive: new Date() },
    );
  } catch (error) {
    console.error("Error in category quote command:", error);
    await bot.sendMessage(
      chatId,
      "សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេស។ សូមសាកល្បងម្តងទៀតនៅពេលក្រោយ។",
    ); // Improved error message
  }
}

/**
 * Sends a motivational quote for a specific user milestone (e.g., day completion, payment confirmation).
 * This function is typically called by other modules (e.g., daily.js, payment.js).
 * @param {Object} bot - The Telegram bot instance.
 * @param {number} chatId - The chat ID to send the message to.
 * @param {string} milestone - The type of milestone (e.g., 'day_complete', 'payment_confirmed').
 */
async function sendMilestoneQuote(bot, chatId, milestone) {
  try {
    const quoteData = quoteGenerator.getMilestoneQuote(milestone);
    const formattedQuote = quoteGenerator.formatQuote(quoteData);

    await bot.sendMessage(chatId, formattedQuote);
  } catch (error) {
    console.error("Error sending milestone quote:", error);
    // No user-facing message here as this is an internal function
  }
}

/**
 * Sends a quote relevant to a specific day's lesson.
 * This function is typically called by the daily lesson module.
 * @param {Object} bot - The Telegram bot instance.
 * @param {number} chatId - The chat ID to send the message to.
 * @param {number} dayNumber - The day number (1-7) for which to get the quote.
 */
async function sendDayQuote(bot, chatId, dayNumber) {
  try {
    const quoteData = quoteGenerator.getQuoteForDay(dayNumber);
    const formattedQuote = quoteGenerator.formatQuote(quoteData);

    await bot.sendMessage(chatId, formattedQuote);
  } catch (error) {
    console.error("Error sending day quote:", error);
    // No user-facing message here as this is an internal function
  }
}

// Export all functions that need to be accessible from other modules (e.g., index.js)
module.exports = {
  dailyQuote,
  randomWisdom,
  showCategories,
  categoryQuote,
  sendMilestoneQuote,
  sendDayQuote,
};
