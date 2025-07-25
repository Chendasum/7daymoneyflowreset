/**
 * Financial Health Quiz - Interactive Assessment for Unpaid Users
 * Based on pre-learning trailer design to provide immediate value and build trust
 */

const User = require("../models/User"); // Assuming User model is available for user data

// User state storage for quiz flow: Stores current question and answers for each user
const quizState = new Map();

// Main quiz structure: title, subtitle, and an array of questions
const financialQuiz = {
  title: "🎯 ការពិនិត្យសុខភាពហិរញ្ញវត្ថុដោយឥតគិតថ្លៃ",
  subtitle: "ស្វែងយល់ពីស្ថានភាពហិរញ្ញវត្ថុរបស់អ្នកក្នុង ២ នាទី",

  questions: [
    {
      id: 1,
      question: "💰 ចំណូលប្រចាំខែរបស់អ្នកប្រហែលប៉ុន្មាន?",
      options: [
        { value: 300, text: "ក្រោម $300" },
        { value: 600, text: "$300-$600" },
        { value: 1000, text: "$600-$1000" },
        { value: 1500, text: "លើស $1000" },
      ],
    },
    {
      id: 2,
      question: "🏠 ចំណាយប្រចាំខែរបស់អ្នកប្រហែលប៉ុន្មាន?",
      options: [
        { value: 200, text: "ក្រោម $200" },
        { value: 400, text: "$200-$400" },
        { value: 700, text: "$400-$700" },
        { value: 1000, text: "លើស $700" },
      ],
    },
    {
      id: 3,
      question: "💳 តើអ្នកមានបំណុលអ្វីខ្លះទេ?",
      options: [
        { value: 0, text: "គ្មានបំណុល" },
        { value: 500, text: "បំណុលតិចៗ (<$500)" },
        { value: 2000, text: "បំណុលមធ្យម ($500-$2000)" },
        { value: 5000, text: "បំណុលច្រើន (>$2000)" },
      ],
    },
    {
      id: 4,
      question: "🏦 តើអ្នកមានលុយសន្សំប៉ុន្មាន?",
      options: [
        { value: 0, text: "គ្មានសន្សំ" },
        { value: 100, text: "តិចជាង $100" },
        { value: 500, text: "$100-$500" },
        { value: 1000, text: "លើស $500" },
      ],
    },
    {
      id: 5,
      question: "🎯 គោលដៅហិរញ្ញវត្ថុចម្បងរបស់អ្នកជាអ្វី?",
      options: [
        { value: "emergency", text: "បង្កើត Emergency Fund" },
        { value: "debt", text: "ការពារបំណុល" },
        { value: "save", text: "សន្សំលុយបន្ថែម" },
        { value: "invest", text: "ចាប់ផ្តើមវិនិយោគ" },
      ],
    },
  ],
};

// FinancialQuiz class to manage quiz logic and state
class FinancialQuiz {
  /**
   * Starts the financial health quiz for a user.
   * Initializes quiz state and sends the introductory message.
   * @param {Object} msg - The Telegram message object.
   * @param {Object} bot - The Telegram bot instance.
   */
  async startQuiz(msg, bot) {
    const userId = msg.from.id;

    // Initialize quiz state for the user
    quizState.set(userId, {
      currentQuestion: 1, // Start from the first question
      answers: {}, // Store user's answers
      startTime: new Date(), // Record quiz start time
    });

    const introMessage = `🎯 ការពិនិត្យសុខភាពហិរញ្ញវត្ថុដោយឥតគិតថ្លៃ

ស្វែងយល់ពីស្ថានភាពហិរញ្ញវត្ថុរបស់អ្នកក្នុង ២ នាទី

✅ បញ្ចប់ហើយអ្នកនឹងទទួលបាន:
• ពិន្ទុសុខភាពហិរញ្ញវត្ថុ /១០០
• ការវិភាគផ្ទាល់ខ្លួន
• គន្លឹះកែលម្អ ៣ យ៉ាង
• ផែនការសកម្មភាពឥតគិតថ្លៃ

🚀 តោះចាប់ផ្តើម!

សរសេរ "READY" ដើម្បីចាប់ផ្តើម Quiz`;

    await bot.sendMessage(msg.chat.id, introMessage);
  }

  /**
   * Processes a user's response during the quiz flow.
   * Checks if the message is a valid answer and moves to the next question or shows results.
   * @param {Object} msg - The Telegram message object.
   * @param {Object} bot - The Telegram bot instance.
   * @returns {boolean} - True if the message was processed as part of the quiz, false otherwise.
   */
  async processQuizResponse(msg, bot) {
    const userId = msg.from.id;
    const text = msg.text ? msg.text.toUpperCase() : ""; // Ensure text is uppercase, handle undefined msg.text

    const state = quizState.get(userId);
    if (!state) return false; // Not in a quiz session

    // Handle "READY" command to start the first question
    if (text === "READY" && state.currentQuestion === 1) {
      await this.askQuestion(msg, bot, 1);
      return true;
    }

    // Process answer for the current question
    const questionNum = state.currentQuestion;
    const question = financialQuiz.questions[questionNum - 1]; // Get the current question object

    if (question) {
      const answerIndex = parseInt(text) - 1; // Convert user input to 0-based index
      // Validate if the answer is a valid option number
      if (answerIndex >= 0 && answerIndex < question.options.length) {
        // Store the selected option's value
        state.answers[`q${questionNum}`] = question.options[answerIndex].value;
        state.currentQuestion++; // Move to the next question

        if (state.currentQuestion <= financialQuiz.questions.length) {
          // If there are more questions, ask the next one
          await this.askQuestion(msg, bot, state.currentQuestion);
        } else {
          // All questions answered, show results
          await this.showResults(msg, bot, state.answers);
          quizState.delete(userId); // Clear quiz state for the user
        }
        return true; // Message was handled by the quiz
      } else {
        // Invalid input for the current question
        await bot.sendMessage(
          msg.chat.id,
          `សូមបញ្ចូលលេខចម្លើយត្រឹមត្រូវ (1-${question.options.length})។`,
        );
        return true; // Message was handled (as an invalid input)
      }
    }

    return false; // Message was not part of the active quiz flow
  }

  /**
   * Sends a specific quiz question to the user.
   * @param {Object} msg - The Telegram message object.
   * @param {Object} bot - The Telegram bot instance.
   * @param {number} questionNum - The number of the question to ask.
   */
  async askQuestion(msg, bot, questionNum) {
    const question = financialQuiz.questions[questionNum - 1]; // Get question data

    // Format options for display
    let optionsText = question.options
      .map((option, index) => `${index + 1}. ${option.text}`)
      .join("\n");

    const questionMessage = `📝 សំណួរទី ${questionNum}/${financialQuiz.questions.length}:

${question.question}

${optionsText}

សរសេរលេខចម្លើយរបស់អ្នក (1-${question.options.length}):`;

    await bot.sendMessage(msg.chat.id, questionMessage);
  }

  /**
   * Calculates and displays the financial health quiz results to the user.
   * Provides a score, detailed analysis, strengths, and recommendations.
   * @param {Object} msg - The Telegram message object.
   * @param {Object} bot - The Telegram bot instance.
   * @param {Object} answers - An object containing the user's answers.
   */
  async showResults(msg, bot, answers) {
    const income = answers.q1 || 0;
    const expenses = answers.q2 || 0;
    const debt = answers.q3 || 0;
    const savings = answers.q4 || 0;
    const goal = answers.q5 || "save"; // Default goal if not answered

    // Calculate key financial metrics
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    const emergencyFundTarget = expenses * 3; // Target for 3 months of expenses
    const debtRatio = income > 0 ? (debt / income) * 100 : 0;

    let score = 0;
    let recommendations = [];
    let strengths = [];

    // Calculate score based on answers
    if (savingsRate >= 20) {
      score += 25;
      strengths.push("💪 អត្រាសន្សំល្អ");
    } else if (savingsRate >= 10) {
      score += 15;
    } else if (savingsRate > 0) {
      score += 10;
    }

    if (savings >= emergencyFundTarget) {
      score += 30;
      strengths.push("🛡️ Emergency Fund គ្រប់គ្រាន់");
    } else if (savings >= expenses) {
      // At least 1 month of expenses saved
      score += 20;
    } else if (savings > 0) {
      score += 10;
    }

    if (debt === 0) {
      score += 25;
      strengths.push("✅ គ្មានបំណុល");
    } else if (debtRatio < 30) {
      score += 15;
    } else if (debtRatio < 50) {
      score += 10;
    }

    if (income > expenses) {
      score += 20;
      strengths.push("📈 ចំណូលលើសចំណាយ");
    }

    // Generate personalized recommendations based on score and answers
    if (savingsRate < 10) {
      recommendations.push("🎯 បង្កើនអត្រាសន្សំដល់ ២០% នៃចំណូល");
    }
    if (savings < emergencyFundTarget) {
      recommendations.push(
        `🚨 បង្កើត Emergency Fund $${emergencyFundTarget.toFixed(0)}`,
      );
    }
    if (debt > 0) {
      recommendations.push("💳 ធ្វើផែនការសងបំណុល");
    }
    if (income <= expenses) {
      recommendations.push("⚡ ត្រូវការផែនការកែលម្អចំណូល");
    }
    // Add a recommendation based on their stated goal
    if (goal === "emergency" && savings < emergencyFundTarget) {
      recommendations.push("💡 ផ្តោតលើការបង្កើតមូលនិធិបន្ទាន់");
    } else if (goal === "debt" && debt > 0) {
      recommendations.push("💡 ផ្តោតលើការសងបំណុលជាអាទិភាព");
    } else if (goal === "save" && savingsRate < 20) {
      recommendations.push("💡 ផ្តោតលើការបង្កើនការសន្សំប្រចាំខែ");
    } else if (goal === "invest" && savings < emergencyFundTarget) {
      recommendations.push("💡 មុនវិនិយោគ សូមបង្កើតមូលនិធិបន្ទាន់សិន");
    }

    // Determine overall health level and corresponding emoji/color
    let healthLevel, healthEmoji;
    if (score >= 80) {
      healthLevel = "ល្អបំផុត";
      healthEmoji = "🟢";
    } else if (score >= 60) {
      healthLevel = "ល្អ";
      healthEmoji = "🟡";
    } else if (score >= 40) {
      healthLevel = "ត្រូវកែលម្អ";
      healthEmoji = "🟠";
    } else {
      healthLevel = "ត្រូវការអភិវឌ្ឍន៍";
      healthEmoji = "🔴";
    }

    // Construct the result message
    const resultMessage = `📊 លទ្ធផល Financial Health Check របស់អ្នក:

${healthEmoji} ពិន្ទុ: ${score}/100 (${healthLevel})

📈 ការវិភាគលម្អិត:
💰 អត្រាសន្សំ: ${savingsRate.toFixed(1)}%
🚨 Emergency Fund ត្រូវការ: $${emergencyFundTarget.toFixed(0)}
💳 Debt-to-Income Ratio: ${debtRatio.toFixed(1)}%

${strengths.length > 0 ? `💪 ចំណុចខ្លាំង:\n${strengths.join("\n")}\n` : ""}

🎯 ការណែនាំចម្បង:
${recommendations.length > 0 ? recommendations.join("\n") : "✅ អ្នកកំពុងធ្វើបានល្អ!"}

🚀 ជំហានបន្ទាប់:
• ប្រើឧបករណ៍ឥតគិតថ្លៃ: /calculate_daily
• រកកន្លែងលុយលេច: /find_leaks
• មើលកម្មវិធីពេញលេញ: /pricing

💡 ចង់ដឹងកម្មវិធីអាចជួយអ្នកយ៉ាងម៉េច? ប្រើ /preview`;

    await bot.sendMessage(msg.chat.id, resultMessage);

    // Follow up with a conversion hint after a delay (10 seconds)
    setTimeout(async () => {
      const followUpMessage = `🎁 រឿងពិសេសសម្រាប់អ្នក:

អ្នកបានបញ្ចប់ Quiz រួចហើយ! នេះបង្ហាញថាអ្នកពិតជាចង់កែលម្អហិរញ្ញវត្ថុ។

🔥 កម្មវិធី 7-Day Money Flow Reset™ អាចជួយអ្នក:
✅ កែលម្អពិន្ទុ Financial Health ដល់ ៨០+
✅ បង្កើនអត្រាសន្សំ ២-៣ ដង
✅ សន្សំបាន $300-800 ក្នុង ៣០ ថ្ងៃ
✅ ទទួលបានផែនការជាក់ស្តែង

🚨 LAUNCH SPECIAL: តែ $24 (ធម្មតា $47)
💰 អ្នកសន្សំបាន: $23 (៥០% OFF!)
⏰ តែ ២០០ កន្លែងដំបូងប៉ុណ្ណោះ!

ចង់ដឹងបន្ថែម? ប្រើ /pricing ឬ /preview`;

      await bot.sendMessage(msg.chat.id, followUpMessage);
    }, 10000); // 10-second delay
  }

  /**
   * Checks if a given message is related to the financial quiz.
   * This helps in routing messages to the correct handler.
   * @param {Object} msg - The Telegram message object.
   * @returns {boolean} - True if the message is quiz-related, false otherwise.
   */
  isQuizMessage(msg) {
    const userId = msg.from.id;
    const text = msg.text ? msg.text.toUpperCase() : ""; // Handle undefined msg.text

    // Check if user is currently in a quiz session
    if (quizState.has(userId)) return true;

    // Check for common quiz start commands/keywords
    if (text === "READY" || text === "START QUIZ" || text.includes("QUIZ"))
      return true;

    return false;
  }
}

// Export an instance of the FinancialQuiz class
module.exports = new FinancialQuiz();
