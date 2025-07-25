/**
 * Micro-Celebration Animations Service
 * This service adds engaging celebration animations for various user achievements
 * within the Telegram bot, using emoji patterns and custom messages.
 */

class CelebrationService {
  constructor() {
    // Define different animation patterns and emojis for various celebration types
    this.animations = {
      dayComplete: {
        emojis: ["🎉", "✨", "🌟", "🎊", "🏆", "💫"],
        patterns: [
          "🎉✨🎉✨🎉✨🎉",
          "🌟💫🌟💫🌟💫🌟",
          "🎊🏆🎊🏆🎊🏆🎊",
          "✨🎉🌟🎊💫🏆✨",
        ],
      },
      paymentConfirmed: {
        emojis: ["💰", "🎯", "🚀", "⭐", "🔥", "💎"],
        patterns: [
          "💰🎯🚀💰🎯🚀💰",
          "⭐🔥💎⭐🔥💎⭐",
          "🚀💰🎯🔥💎⭐🚀",
          "💎🔥⭐💰🎯🚀💎",
        ],
      },
      programComplete: {
        emojis: ["🏆", "🎊", "🌟", "🎉", "💫", "👑"],
        patterns: [
          "🏆🎊🌟🎉💫👑🏆",
          "🌟🎉🏆💫🎊👑🌟",
          "🎊👑🏆🌟💫🎉🎊",
          "💫🏆🎉🌟🎊👑💫",
        ],
      },
      vipUpgrade: {
        emojis: ["👑", "💎", "⭐", "🔥", "🚀", "🌟"],
        patterns: [
          "👑💎⭐🔥🚀🌟👑",
          "💎🌟👑⭐🔥🚀💎",
          "⭐🚀🔥👑💎🌟⭐",
          "🔥👑🌟💎⭐🚀🔥",
        ],
      },
      milestone: {
        emojis: ["🎯", "🌟", "💫", "✨", "🎉", "🏅"],
        patterns: [
          "🎯🌟💫✨🎉🏅🎯",
          "🌟🎉🏅💫✨🎯🌟",
          "💫🎯🌟🏅🎉✨💫",
          "✨🏅🎉🎯🌟💫✨",
        ],
      },
    };
  }

  /**
   * Creates a full animated celebration message with a header, main message, and footer.
   * @param {string} type - The type of celebration (e.g., 'dayComplete', 'paymentConfirmed').
   * @param {string} message - The main content of the celebration message.
   * @param {Object} options - Optional animation settings, e.g., { duration: 'short' | 'normal' | 'long' }.
   * @returns {string} The complete formatted animated message.
   */
  createCelebration(type, message, options = {}) {
    // Fallback to 'milestone' animation if the specified type is not found
    const animation = this.animations[type] || this.animations.milestone;
    const pattern = this.getRandomPattern(animation.patterns); // Select a random emoji pattern
    const duration = options.duration || "normal"; // Default duration is 'normal'

    let celebrationText = "";

    // Add animated header
    celebrationText += this.createAnimatedHeader(pattern, duration);
    celebrationText += "\n\n"; // Add spacing

    // Add the main message content
    celebrationText += message;
    celebrationText += "\n\n"; // Add spacing

    // Add animated footer (reversed pattern)
    celebrationText += this.createAnimatedFooter(pattern, duration);

    return celebrationText;
  }

  /**
   * Creates the animated header part of the celebration message.
   * @param {string} pattern - The emoji pattern string.
   * @param {string} duration - The desired animation duration ('short', 'normal', 'long').
   * @returns {string} The formatted header string.
   */
  createAnimatedHeader(pattern, duration) {
    switch (duration) {
      case "short":
        return pattern;
      case "long":
        return `${pattern}\n${pattern}\n${pattern}`;
      default: // 'normal'
        return `${pattern}\n${pattern}`;
    }
  }

  /**
   * Creates the animated footer part of the celebration message.
   * The footer uses a reversed version of the header pattern.
   * @param {string} pattern - The emoji pattern string used for the header.
   * @param {string} duration - The desired animation duration ('short', 'normal', 'long').
   * @returns {string} The formatted footer string.
   */
  createAnimatedFooter(pattern, duration) {
    const reversed = pattern.split("").reverse().join(""); // Reverse the pattern for the footer
    switch (duration) {
      case "short":
        return reversed;
      case "long":
        return `${reversed}\n${reversed}\n${reversed}`;
      default: // 'normal'
        return `${reversed}\n${reversed}`;
    }
  }

  /**
   * Gets a random pattern from a given array of patterns.
   * @param {Array<string>} patterns - An array of emoji pattern strings.
   * @returns {string} A randomly selected pattern string.
   */
  getRandomPattern(patterns) {
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  /**
   * Generates a celebration message for a completed day in the program.
   * @param {number} dayNumber - The number of the day that was completed.
   * @param {string} customMessage - An optional custom message to include.
   * @returns {string} The formatted celebration message for day completion.
   */
  dayCompleteCelebration(dayNumber, customMessage = "") {
    // Define specific achievements for each day
    const achievements = {
      1: "បានស្គាល់ Money Flow របស់អ្នក!",
      2: "បានរកឃើញ Money Leaks!",
      3: "បានវាយតម្លៃប្រព័ន្ធហិរញ្ញវត្ថុ!",
      4: "បានបង្កើតផែនទី Income & Cost!",
      5: "បានយល់ពី Survival vs Growth!",
      6: "បានបង្កើតផែនការសកម្មភាព!",
      7: "បានបញ្ចប់កម្មវិធីពេញលេញ!",
    };

    const baseMessage = `🎊 អបអរសាទរ! អ្នកបានបញ្ចប់ថ្ងៃទី ${dayNumber}!

🌟 ${achievements[dayNumber] || "សម្រេចបានជាពិសេស!"}

${customMessage}

💪 រក្សាភាពជោគជ័យនេះបន្ត!`;

    // Create the full celebration message using the 'dayComplete' animation type
    return this.createCelebration("dayComplete", baseMessage, {
      duration: "normal",
    });
  }

  /**
   * Generates a celebration message for a confirmed payment.
   * @param {string} customMessage - An optional custom message to include.
   * @returns {string} The formatted celebration message for payment confirmation.
   */
  paymentConfirmedCelebration(customMessage = "") {
    const baseMessage = `🎉 ការទូទាត់បានបញ្ជាក់!

🚀 សូមស្វាគមន៍ចូលរួមកម្មវិធី 7-Day Money Flow Reset™!

${customMessage}

💎 ការដំណើរផ្លាស់ប្តូរជីវិតចាប់ផ្តើមហើយ!`;

    // Create the full celebration message using the 'paymentConfirmed' animation type
    return this.createCelebration("paymentConfirmed", baseMessage, {
      duration: "long",
    });
  }

  /**
   * Generates a celebration message for completing the entire program.
   * @param {string} customMessage - An optional custom message to include.
   * @returns {string} The formatted celebration message for program completion.
   */
  programCompleteCelebration(customMessage = "") {
    const baseMessage = `🏆 អបអរសាទរ! អ្នកបានបញ្ចប់ 7-Day Money Flow Reset™!

🌟 អ្នកបានសម្រេច:
✅ ស្គាល់ Money Flow របស់អ្នក
✅ រកឃើញ Money Leaks
✅ វាយតម្លៃប្រព័ន្ធហិរញ្ញវត្ថុ
✅ បង្កើតផែនទី Income & Cost
✅ យល់ពី Survival vs Growth
✅ បង្កើតផែនការសកម្មភាព
✅ បញ្ចប់កម្មវិធីពេញលេញ

${customMessage}

🎯 ឥឡូវនេះអ្នកមានវិធីសាស្ត្រពិតប្រាកដសម្រាប់គ្រប់គ្រងលុយ!`;

    // Create the full celebration message using the 'programComplete' animation type
    return this.createCelebration("programComplete", baseMessage, {
      duration: "long",
    });
  }

  /**
   * Generates a celebration message for a VIP upgrade.
   * @param {string} customMessage - An optional custom message to include.
   * @returns {string} The formatted celebration message for VIP upgrade.
   */
  vipUpgradeCelebration(customMessage = "") {
    const baseMessage = `👑 អបអរសាទរ! អ្នកបានក្លាយជា VIP Member!

💎 អ្នកឥឡូវនេះមានសិទ្ធិចូលប្រើ:
✅ 1-on-1 coaching calls
✅ Advanced strategies
✅ Priority support 24/7
✅ Exclusive templates
✅ Private community

${customMessage}

🚀 ជំហានបន្ទាប់ទៅកាន់ជោគជ័យ!`;

    // Create the full celebration message using the 'vipUpgrade' animation type
    return this.createCelebration("vipUpgrade", baseMessage, {
      duration: "long",
    });
  }

  /**
   * Generates a generic milestone celebration message.
   * @param {string} milestone - The description of the milestone achieved.
   * @param {string} customMessage - An optional custom message to include.
   * @returns {string} The formatted celebration message for a general milestone.
   */
  milestoneCelebration(milestone, customMessage = "") {
    const baseMessage = `🎯 អបអរសាទរ!

🌟 ${milestone}

${customMessage}

💪 បន្តដំណើរជោគជ័យនេះ!`;

    // Create the full celebration message using the 'milestone' animation type
    return this.createCelebration("milestone", baseMessage, {
      duration: "normal",
    });
  }

  /**
   * Creates a quick, short celebration message with random emojis.
   * Useful for small, immediate acknowledgements.
   * @param {string} achievement - The text describing the achievement.
   * @returns {string} A short, emoji-decorated celebration message.
   */
  quickCelebration(achievement) {
    const emojis = ["🎉", "✨", "🌟", "🎊", "💫"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    return `${randomEmoji} ${achievement} ${randomEmoji}`;
  }

  /**
   * Sends an animated celebration message to a specific chat.
   * This is the main function to call from other modules to trigger a celebration.
   * @param {Object} bot - The Telegram bot instance.
   * @param {number} chatId - The chat ID where the message should be sent.
   * @param {string} type - The type of celebration (e.g., 'dayComplete', 'paymentConfirmed').
   * @param {string} message - The main content of the celebration message.
   * @param {Object} options - Optional settings, e.g., { duration: 'long', followUp: 'Great job!' }.
   */
  async sendCelebration(bot, chatId, type, message, options = {}) {
    // Generate the full celebration message
    const celebrationMessage = this.createCelebration(type, message, options);

    // Send the main celebration message
    await bot.sendMessage(chatId, celebrationMessage);

    // If a follow-up message is specified, send it after a short delay
    if (options.followUp) {
      setTimeout(async () => {
        await bot.sendMessage(chatId, this.quickCelebration(options.followUp));
      }, 2000); // 2-second delay for the follow-up
    }
  }

  /**
   * Gets a progress-based celebration message depending on the completion percentage.
   * @param {number} percentage - The completion percentage (0-100).
   * @returns {string} A motivational message based on the progress.
   */
  getProgressCelebration(percentage) {
    if (percentage >= 100) {
      return "🏆 ពេញលេញ! អ្នកអស្ចារ្យ!";
    } else if (percentage >= 75) {
      return "🌟 ស្ទើរបាន! បន្តិច!";
    } else if (percentage >= 50) {
      return "💪 កំពុងល្អ! បន្ត!";
    } else if (percentage >= 25) {
      return "🎯 ចាប់ផ្តើមល្អ!";
    } else {
      return "🚀 ចាប់ផ្តើម!";
    }
  }
}

// Export a singleton instance of the CelebrationService
module.exports = new CelebrationService();
