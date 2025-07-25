/**
 * Conversion Optimizer Service - Enhanced Version
 * Handles follow-up messaging and urgency for users who show interest but don't convert
 * Features: Dynamic pricing, error recovery, analytics tracking, personalization
 */

const { sendLongMessage } = require("../utils/message-splitter");
const User = require("../models/User"); // Import User model for follow-up checks

class ConversionOptimizer {
  constructor() {
    // Initialize active sequences tracking
    this.activeSequences = {};
    this.conversionAnalytics = {};

    // Promotional pricing configuration
    this.pricingConfig = {
      promo: 24,
      original: 47,
      premium: 97, // Assuming this is a higher tier price for comparison
      discount: 50, // Percentage
      savings: 23, // Calculated from original - promo
      promoCode: "LAUNCH50",
      availableSpots: 200,
      usedSpots: 53,
      priceIncreaseHours: 36, // Example: for the final urgency message
    };

    // Enhanced urgency messages with dynamic values - Cleaned and formatted
    this.urgencyMessages = {
      immediate:
        () => `⚠️ បន្ទាន់! មានតែ ${this.getRemainingSpots()} កន្លែង សម្រាប់ខែនេះ!

💸 រាល់ថ្ងៃដែលអ្នករង់ចាំ = លុយ $10-25 បាត់បង់ដោយមិនដឹងខ្លួន!

🔥 អ្នកដែលចូលរួម និងអនុវត្តបានល្អ តែងតែឃើញការកែប្រែ ក្នុង ៧ ថ្ងៃ!

🚨 LAUNCH SPECIAL: តែ $${this.pricingConfig.promo} (ធម្មតា $${this.pricingConfig.original}) - សន្សំបាន $${this.pricingConfig.savings}!
⏰ កូដ: ${this.pricingConfig.promoCode} - មានតែ ${this.getRemainingSpots()} កន្លែងប៉ុណ្ណោះ!

🎯 ចូលរួមឥឡូវនេះ ហើយចាប់ផ្តើមដំណើរ ៧ ថ្ងៃ!

📱 ទូទាត់ភ្លាមៗ:
• ABA: 000 194 742 (Reference: BOT[USER_ID])
• ACLEDA: 092 798 169 (Reference: BOT[USER_ID])
• Wing: 102 534 677 (Note: BOT[USER_ID])`,

      scarcity:
        () => `🚨 បន្ទាន់: មានតែ ${Math.max(1, this.getRemainingSpots())} កន្លែង ចុងក្រោយ!

💰 LAUNCH SPECIAL $${this.pricingConfig.promo} នឹងបាត់ក្នុងរយៈពេលបន្តិច! (ធម្មតា $${this.pricingConfig.original})
🔥 អ្នកសន្សំបាន $${this.pricingConfig.savings} ឥឡូវនេះ!

🤔 អ្នកនៅតែកំពុងបាត់បង់លុយរាល់ថ្ងៃ... មែនទេ?

✅ ចាប់ពីក្រោយ LAUNCH តម្លៃនឹងត្រឡប់ទៅ $${this.pricingConfig.original} វិញ!

🎯 សម្រេចចិត្តឥឡូវនេះ = សន្សំបាន $${this.pricingConfig.savings} + រកឃើញលុយដែលលេចធ្លាយក្នុង ៧ ថ្ងៃ!`,

      testimonial: () => `💬 អ្នកប្រើប្រាស់ថ្មីៗ និយាយដូចម្តេច:

"ខ្ញុំបានរកឃើញកន្លែងដែលលុយលេចធ្លាយ ដោយមិនដឹងខ្លួន! ការកែប្រែផ្នែកចំណាយជួយខ្ញុំ។" - សុវណ្ណ, Business Owner

"ពិតជាពិបាកជឿ! ៧ ថ្ងៃ ហើយខ្ញុំដឹងច្បាស់ហើយថាលុយទៅណាទាំងអស់។" - ជំរាន, Marketing Manager

"កម្មវិធីនេះពិតជាជួយបាន! ការគ្រប់គ្រងលុយកាន់តែប្រសើរឡើង។" - ស្រីពេជ្រ, Restaurant Owner

🤔 អ្នកចង់បន្តបាត់បង់លុយ ឬចង់ទទួលលទ្ធផលដូចគេ?

⏰ LAUNCH SPECIAL $${this.pricingConfig.promo} (៥០% OFF!) - មានតែ ${this.getRemainingSpots()} កន្លែង ចុងក្រោយ!`,
    };

    // Enhanced price anchoring with promotional calculations - Cleaned and formatted
    this.priceAnchoring = {
      daily:
        () => `💡 គិតមើលណា: $${this.pricingConfig.promo} ÷ ៧ ថ្ងៃ = $${(this.pricingConfig.promo / 7).toFixed(2)}/ថ្ងៃ តែប៉ុណ្ណោះ!

🚨 អ្នកសន្សំបាន $${this.pricingConfig.savings} ពីតម្លៃធម្មតា!

☕ ធៀបនឹង:
• កាហ្វេ ១ ពែង = $4-6
• នំបុ័ង ១ ចាន = $3-5
• ទឹកក្រូច ១ ដប = $2-3

💰 ថ្ងៃទី ១ ប៉ុណ្ណោះ អ្នកអាចសន្សំបានលើសពីតម្លៃកម្មវិធីទាំងមូល!

🎯 ប្រើ $${(this.getCurrentPrice() / 7).toFixed(2)} ដើម្បីរៀនគ្រប់គ្រងលុយ VS ទិញកាហ្វេ ១ ពែង?

💸 ធ្វើមិនបាន = បន្តបាត់បង់ $300-800 ក្នុង ១ ខែ = $3600-9600 ក្នុង ១ ឆ្នាំ!

🔥 ធ្វើបាន = សន្សំបាន $500-1500 ក្នុង ១ ខែ = $6000-18000 ក្នុង ១ ឆ្នាំ!

📈 ROI = ${Math.round((6000 / this.getCurrentPrice()) * 100)}% ក្នុង ១ ឆ្នាំ!`,

      comparison: () => `💰 ធៀបតម្លៃជាមួយវគ្គផ្សេងៗ:

❌ កម្មវិធីគ្រប់គ្រងលុយអន្តរជាតិ: $200-500
❌ ភ្នាក់ងារហិរញ្ញវត្ថុ: $100-300/ម៉ោង
❌ សៀវភៅហិរញ្ញវត្ថុ: $20-50 (ទ្រឹស្តីប៉ុណ្ណោះ)
❌ កម្មវិធីរៀនអនឡាញ: $150-400

✅ 7-Day Money Flow Reset™: $${this.getCurrentPrice()} (ទ្រឹស្តី + ការអនុវត្ត + ជំនួយផ្ទាល់)

🎯 ពិតជាសមរម្យខ្លាំងណាស់! សន្សំបាន $${this.pricingConfig.premium - this.getCurrentPrice()}!`,
    };

    // Enhanced loss aversion with personalized calculations - Cleaned and formatted
    this.lossAversion = {
      pain: () => `😰 គិតមើលណា... រាល់ថ្ងៃដែលរង់ចាំ:

💸 បាត់បង់ $5-15 ដោយមិនដឹងខ្លួន
💸 បាត់បង់ឱកាសរកឃើញ money leaks
💸 បាត់បង់ពេលវេលាដ៏មានតម្លៃ
💸 បាត់បង់ទំនុកចិត្តក្នុងការគ្រប់គ្រងលុយ

🔥 បើអ្នកចូលរួមថ្ងៃនេះ = ឈប់បាត់បង់ពីថ្ងៃស្អែក!

⏰ $${this.getCurrentPrice()} ឥឡូវនេះ = សន្សំបាន $200-500 ក្នុង ១ ខែ!

📊 Break-even ក្នុង ${Math.ceil(this.getCurrentPrice() / 15)} ថ្ងៃ ប៉ុណ្ណោះ!`,

      regret: () => `🤔 ៦ ខែចុងក្រោយ អ្នកបានចំណាយ:

• កាហ្វេ: $150-200
• ម្ហូបអាហារ: $300-500
• ការធ្វើដំណើរ: $100-300
• ការកំសាន្ត: $200-400

💰 សរុប: $750-1400 ក្នុង ៦ ខែ!

🎯 ហេតុអ្វីមិនចំណាយ $${this.pricingConfig.promo} ដើម្បីឈប់បាត់បង់លុយ $300-800 ក្នុង ១ ខែ?

💰 អ្នកសន្សំបាន $${this.pricingConfig.savings} ពីតម្លៃធម្មតា!

⚡ ប្រសិនបើមិនធ្វើអ្វីសោះ = បន្តបាត់បង់ $3600-9600 ក្នុង ១ ឆ្នាំ!

🔥 LAUNCH SPECIAL នេះនឹងបាត់! តម្លៃនឹងត្រឡប់ទៅ $${this.pricingConfig.original}!`,
    };
  }

  /**
   * Get current promotional pricing
   */
  getCurrentPrice() {
    return this.pricingConfig.promo;
  }

  /**
   * Get next price tier (after promotion ends)
   */
  getNextPrice() {
    return this.pricingConfig.original;
  }

  /**
   * Get remaining spots dynamically
   */
  getRemainingSpots() {
    return Math.max(
      0,
      this.pricingConfig.availableSpots - this.pricingConfig.usedSpots,
    );
  }

  /**
   * Get time remaining for current price
   */
  getTimeRemaining() {
    // This is a placeholder. In a real scenario, you'd calculate this based on a fixed expiry time.
    // For now, it returns the predefined priceIncreaseHours.
    return this.pricingConfig.priceIncreaseHours;
  }

  /**
   * Update spot usage (call when someone converts)
   */
  useSpot() {
    this.pricingConfig.usedSpots += 1;
    console.log(`Spot used. Remaining: ${this.getRemainingSpots()}`);
  }

  /**
   * Get urgency message based on user engagement level
   */
  getUrgencyMessage(type = "immediate") {
    const messageFunc = this.urgencyMessages[type];
    return messageFunc ? messageFunc() : this.urgencyMessages.immediate();
  }

  /**
   * Get price anchoring message to make current price seem reasonable
   */
  getPriceAnchoringMessage(type = "daily") {
    const messageFunc = this.priceAnchoring[type];
    return messageFunc ? messageFunc() : this.priceAnchoring.daily();
  }

  /**
   * Get loss aversion message to create pain of missing out
   */
  getLossAversionMessage(type = "pain") {
    const messageFunc = this.lossAversion[type];
    return messageFunc ? messageFunc() : this.lossAversion.pain();
  }

  /**
   * Get complete conversion sequence for follow-up with enhanced personalization - Cleaned and formatted
   */
  getConversionSequence(userId = null) {
    return [
      {
        delay: 300000, // 5 minutes
        message:
          () => `🚨 LAUNCH SPECIAL: $${this.pricingConfig.promo} = "ថ្លៃ"?

🤔 គិតមើលធៀបណា:

☕ កាហ្វេ ១ ពែង = $4-6 (រយៈពេល ៣០ នាទី)
🍜 ម្ហូប ១ ចាន = $5-8 (រយៈពេល ២០ នាទី)
🎬 រោងកុន ១ ដង = $8-12 (រយៈពេល ២ ម៉ោង)

💰 Money Flow Reset™ = តែ $${this.pricingConfig.promo} (ធម្មតា $${this.pricingConfig.original})
🔥 អ្នកសន្សំបាន $${this.pricingConfig.savings} + ផ្លាស់ប្តូរមួយជីវិត!

🧮 គណនាមើល:
• $${this.getCurrentPrice()} ÷ ៧ ថ្ងៃ = $${(this.getCurrentPrice() / 7).toFixed(2)}/ថ្ងៃ
• តម្លៃ = កាហ្វេ ១ ពែង
• លទ្ធផល = ការគ្រប់គ្រងលុយកាន់តែប្រសើរ

💰 ក្នុង ១ ខែ គោលដៅសន្សំ $200-600
💰 ក្នុង ១២ ខែ គោលដៅសន្សំ $2,400-7,200

🔥 អនុវត្តបានល្អ អាចសន្សំបានច្រើន!

🎯 តើអ្នកចង់ចំណាយ $${this.getCurrentPrice()} ដើម្បីរៀនគ្រប់គ្រងលុយ?

📱 ប្រើ /instructions ដើម្បីទទួលបាន payment details`,
        type: "price_anchoring",
        analytics: "price_comparison_5min",
      },
      {
        delay: 900000, // 15 minutes
        message:
          () => `🔥 បន្ទាន់! មានតែ ${this.getRemainingSpots()} កន្លែង សម្រាប់ខែនេះ!

📈 អ្នកដែលបានចូលរួម Money Flow Reset™ បាននិយាយថា:

"ថ្ងៃទី ៣ ខ្ញុំបានរកឃើញ subscriptions ដែលខ្ញុំភ្លេច! ឥឡូវបានលុបចេញ!" - សុវណ្ណា, ភ្នំពេញ

"ក្រោយពី ៧ ថ្ងៃ ខ្ញុំបានកាត់បន្ថយចំណាយ convenience ខ្លះ។ គ្រប់គ្រងបានល្អជាង!" - ដារ៉ា, សៀមរាប

"ឥឡូវនេះខ្ញុំដឹងច្បាស់ថាលុយខ្ញុំទៅណាទាំងអស់។ មានផែនការសន្សំច្បាស់លាស់!" - ណារ៉ា, បាត់ដំបង

💪 អ្នកចូលរួម និងអនុវត្តបានល្អ តែងតែឃើញការកែប្រែ!

⏰ Early Bird តម្លៃ $${this.getCurrentPrice()} នឹងអស់នៅ:
• ថ្ងៃនេះ: $${this.getCurrentPrice()}
• ថ្ងៃស្អែក: $${this.getNextPrice()}
• សប្តាហ៍ក្រោយ: $${this.pricingConfig.premium}

🎯 សន្សំបាន $${this.getNextPrice() - this.getCurrentPrice()}-${this.pricingConfig.premium - this.getCurrentPrice()} ដោយការចូលរួមថ្ងៃនេះ!

📱 ប្រើ /instructions ដើម្បីចាប់ផ្តើមភ្លាមៗ`,
        type: "social_proof_urgency",
        analytics: "social_proof_15min",
      },
      {
        delay: 1800000, // 30 minutes
        message: () => `😰 គិតមើលណា... រាល់ថ្ងៃដែលរង់ចាំ:

💸 $5-15 បាត់បង់ដោយ convenience spending
💸 $3-8 បាត់បង់ដោយ subscription ដែលភ្លេច
💸 $10-20 បាត់បង់ដោយ impulse buying
💸 $2-5 បាត់បង់ដោយ micro expenses

🔥 សរុប = ចំណាយតូចៗ បន្តិចម្តងៗ ប្រមូលផ្តុំ!

📊 ក្នុង ១ ខែ = ចំណាយបន្ថែម ពីការមិនដឹងខ្លួន!
📊 ក្នុង ១ ឆ្នាំ = ចំណាយបន្ថែម ច្រើនណាស់!

🤔 ១ ឆ្នាំចុងក្រោយ អ្នកបានបាត់បង់:
• Convenience spending: $1,800-3,600
• Forgotten subscriptions: $300-600
• Impulse purchases: $1,200-2,400
• Micro expenses: $600-1,200

💰 ចំណាយខ្ជះខ្ជាយ រៀងរាល់ឆ្នាំ!

🎯 $${this.getCurrentPrice()} ដើម្បីរៀនគ្រប់គ្រងចំណាយបានល្អ?

📈 វិនិយោគតូចដើម្បីរៀនជំនាញគ្រប់គ្រងលុយ!

⚡ ប្រសិនបើមិនធ្វើអ្វីឥឡូវនេះ = បន្តចំណាយដោយមិនដឹងខ្លួន!

📱 ប្រើ /instructions ដើម្បីបញ្ឈប់ការបាត់បង់លុយ`,
        type: "loss_aversion",
        analytics: "loss_aversion_30min",
      },
      {
        delay: 3600000, // 1 hour
        message:
          () => `🚨 ចុងក្រោយ: នៅសល់ ${this.getTimeRemaining()} ម៉ោង សម្រាប់ Early Bird តម្លៃ $${this.getCurrentPrice()}!

⏰ ចាប់ពីស្អែកព្រឹក:
• តម្លៃនឹងកើនឡើងទៅ $${this.getNextPrice()} (សន្សំបាន $${this.getNextPrice() - this.getCurrentPrice()}!)
• មានតែ ${Math.max(1, this.getRemainingSpots())} កន្លែង ចុងក្រោយ
• បន្ទាប់ពីនេះ waiting list ១ សប្តាហ៍

💡 ចំណុចសម្រេចចិត្ត នៅពេលនេះ:
• ចូលរួមថ្ងៃនេះ = $${this.getCurrentPrice()} + រៀនចាប់ពីថ្ងៃស្អែក
• រង់ចាំថ្ងៃស្អែក = $${this.getNextPrice()} + អាចមិនមានកន្លែង

🎯 អ្នកនៅតែបន្តបាត់បង់ $20-48 រាល់ថ្ងៃ...

🔥 កុំធ្វើដូច ៧០% ដែល "រង់ចាំ" ហើយសោកស្តាយនៅពេលក្រោយ!

💪 ធ្វើដូច ៣០% ដែល "ចាត់វិធានការ" ហើយជោគជ័យ!

📊 គណនាចុងក្រោយ:
• តម្លៃ: $${this.getCurrentPrice()}
• ការសន្សំខែទី ១: $400-800
• ROI ខែទី ១: ${Math.round((400 / this.getCurrentPrice()) * 100)}-${Math.round((800 / this.getCurrentPrice()) * 100)}%

📱 ប្រើ /instructions ដើម្បីទទួលបាន $${this.getCurrentPrice()} តម្លៃ
⏰ នៅសល់ ${this.getTimeRemaining()} ម៉ោង ប៉ុណ្ណោះ!

🎉 បន្ទាប់ពីទូទាត់ អ្នកនឹងទទួលបាន Day 1 ភ្លាមៗ!`,
        type: "final_urgency",
        analytics: "final_urgency_1hour",
      },
      // --- NEW MESSAGES ADDED BELOW ---
      {
        delay: 7200000, // 2 hours after initial view (1 hour after previous message)
        message: () => `🚀 តើអ្នកត្រៀមខ្លួនសម្រាប់សេរីភាពហិរញ្ញវត្ថុហើយឬនៅ?

💡 គិតអំពីអនាគតរបស់អ្នក:
• ជីវិតដែលគ្មានការព្រួយបារម្ភពីរឿងលុយ
• មានលុយសន្សំសម្រាប់ពេលបន្ទាន់
• អាចសម្រេចគោលដៅធំៗ (ផ្ទះ, ឡាន, អាជីវកម្ម)

🎯 7-Day Money Flow Reset™ នឹងផ្តល់ឱ្យអ្នកនូវ:
✅ ផែនទីផ្លូវច្បាស់លាស់
✅ ឧបករណ៍ជាក់ស្តែង
✅ ទំនុកចិត្តពេញលេញ

💰 ការវិនិយោគ $${this.getCurrentPrice()} ថ្ងៃនេះ = ការផ្លាស់ប្តូរជីវិតហិរញ្ញវត្ថុសម្រាប់រយៈពេលវែង!

📈 កុំឱ្យឱកាសនេះកន្លងផុតទៅ!

📱 ប្រើ /instructions ដើម្បីចាប់ផ្តើមការផ្លាស់ប្តូរ!`,
        type: "long_term_benefits",
        analytics: "long_term_benefits_2hour",
      },
      {
        delay: 14400000, // 4 hours after initial view (2 hours after previous message)
        message: () => `🤔 តើអ្នកនៅតែមានចម្ងល់ដែរឬទេ?

💡 សំណួរដែលគេសួរញឹកញាប់:
• "ខ្ញុំពិតជាអាចសន្សំបានច្រើនមែនទេ?"
  ✅ បាទ/ចាស! ៩២% នៃអ្នកចូលរួមរបស់យើងសន្សំបាន $200+ ក្នុង ៧ ថ្ងៃ។
• "ខ្ញុំមិនមានពេលច្រើនទេ?"
  ✅ គ្រាន់តែ ១៥-២០ នាទី/ថ្ងៃ សម្រាប់ ៧ ថ្ងៃប៉ុណ្ណោះ។
• "តើមានការធានាទេ?"
  ✅ បាទ/ចាស! ១០០% Money-Back Guarantee បើអ្នកមិនពេញចិត្ត។

🎯 យើងបានឃើញមនុស្សជាច្រើនផ្លាស់ប្តូរជីវិតហិរញ្ញវត្ថុរបស់ពួកគេ។
អ្នកក៏អាចធ្វើបានដែរ!

🔥 កុំឱ្យការសង្ស័យឃាត់អ្នកពីភាពជោគជ័យផ្នែកហិរញ្ញវត្ថុ!

📱 ប្រើ /instructions ដើម្បីទទួលបានចម្លើយច្បាស់លាស់ និងចាប់ផ្តើម!`,
        type: "faq_objection_handling",
        analytics: "faq_objection_4hour",
      },
      {
        delay: 86400000, // 24 hours after initial view (20 hours after previous message)
        message: () => `🚨 ការរំលឹកចុងក្រោយ - ឱកាសនេះជិតផុតកំណត់ហើយ!

⏰ ត្រឹមតែប៉ុន្មានម៉ោងទៀតប៉ុណ្ណោះ តម្លៃ $${this.pricingConfig.promo} នឹងបាត់បង់!
💰 តម្លៃនឹងត្រឡប់ទៅ $${this.pricingConfig.original} វិញ!

🔥 កុំឱ្យអ្នកក្លាយជា ៧០% ដែលសោកស្តាយនៅពេលក្រោយ។
💪 ធ្វើជា ៣០% ដែលចាត់វិធានការ ហើយទទួលបានលទ្ធផល!

🎯 ថ្ងៃនេះជាថ្ងៃដែលអ្នកសម្រេចចិត្តផ្លាស់ប្តូរ។

💸 រាល់ថ្ងៃដែលអ្នករង់ចាំ = លុយបាត់បង់ដោយមិនដឹងខ្លួន។

📱 ប្រើ /instructions ឥឡូវនេះ ដើម្បីធានាតម្លៃពិសេសរបស់អ្នក!
🎉 ចាប់ផ្តើមដំណើរផ្លាស់ប្តូរហិរញ្ញវត្ថុរបស់អ្នកភ្លាមៗ!`,
        type: "final_call_to_action",
        analytics: "final_cta_24hour",
      },
    ];
  }

  /**
   * Enhanced follow-up scheduling with error recovery and analytics
   */
  scheduleFollowUpSequence(bot, chatId, userId) {
    const sequence = this.getConversionSequence(userId);

    // Initialize analytics tracking for this user
    this.conversionAnalytics[userId] = {
      sequenceStarted: new Date(),
      messagesDelivered: 0,
      messagesFailed: 0,
      sequenceCompleted: false,
    };

    // Store the timeout IDs for potential cancellation
    const timeoutIds = [];

    sequence.forEach((step, index) => {
      const timeoutId = setTimeout(async () => {
        try {
          // Check if user is still unpaid before sending follow-up
          // User model is imported at the top now
          const user = await User.findOne({ telegramId: userId });

          if (!user || user.isPaid) {
            // User has already converted, cancel remaining messages
            console.log(
              `✅ User ${userId} converted, canceling remaining follow-ups`,
            );
            this.cancelFollowUpSequence(userId);
            return;
          }

          // Get dynamic message content
          const messageContent =
            typeof step.message === "function"
              ? step.message().replace(/\[USER_ID\]/g, userId)
              : step.message.replace(/\[USER_ID\]/g, userId);

          // Send with retry logic
          await this.sendWithRetry(bot, chatId, messageContent, 3);

          // Track successful delivery
          this.conversionAnalytics[userId].messagesDelivered += 1;

          // Update user analytics
          await User.findOneAndUpdate(
            { telegramId: userId },
            {
              lastFollowUp: new Date(),
              lastFollowUpType: step.analytics,
              $inc: { followUpCount: 1 },
            },
          );

          console.log(
            `✅ Follow-up ${step.type} (${step.analytics}) delivered to user ${userId}`,
          );

          // Mark sequence as completed if this is the last message
          if (index === sequence.length - 1) {
            this.conversionAnalytics[userId].sequenceCompleted = true;
            console.log(`🏁 Conversion sequence completed for user ${userId}`);
          }
        } catch (error) {
          console.error(
            `❌ Error sending follow-up ${step.type} to user ${userId}:`,
            error,
          );
          this.conversionAnalytics[userId].messagesFailed += 1;
        }
      }, step.delay);

      timeoutIds.push(timeoutId);
    });

    // Store timeout IDs for potential cancellation
    this.activeSequences[userId] = timeoutIds;

    console.log(
      `🚀 Enhanced conversion sequence scheduled for user ${userId} - ${sequence.length} messages over ${sequence[sequence.length - 1].delay / 1000 / 60} minutes`,
    );
  }

  /**
   * Send message with retry logic
   */
  async sendWithRetry(bot, chatId, message, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await sendLongMessage(bot, chatId, message, {}, 1000);
        return; // Success, exit retry loop
      } catch (error) {
        console.error(
          `Attempt ${attempt} failed for chatId ${chatId}:`,
          error.message,
        );

        if (attempt === maxRetries) {
          throw error; // Final attempt failed
        }

        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Cancel follow-up sequence for user (when they convert)
   */
  cancelFollowUpSequence(userId) {
    if (this.activeSequences && this.activeSequences[userId]) {
      this.activeSequences[userId].forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      delete this.activeSequences[userId];

      // Update analytics
      if (this.conversionAnalytics[userId]) {
        this.conversionAnalytics[userId].canceledAt = new Date();
      }

      console.log(`🛑 Follow-up sequence canceled for user ${userId}`);
    }
  }

  /**
   * Enhanced objection handlers with current pricing - Cleaned and formatted
   */
  getObjectionHandler(objection) {
    const handlers = {
      too_expensive: () => `💰 $${this.getCurrentPrice()} = "ថ្លៃពេក"?

🤔 បើអ្នកគិតថា $${this.getCurrentPrice()} ថ្លៃ... តើអ្នកមានអារម្មណ៍យ៉ាងណា ពេលដឹងថាអ្នកបាត់បង់:

💸 $50-100 ក្នុង ១ ខែ ដោយមិនដឹងខ្លួន?
💸 $600-1200 ក្នុង ១ ឆ្នាំ ដោយមិនដឹងខ្លួន?

🎯 $${this.getCurrentPrice()} ដើម្បីរកឃើញ money leaks = សន្សំបាន $200-500 ក្នុង ១ ខែ!

⚡ ROI = ${Math.round((200 / this.getCurrentPrice()) * 100)}-${Math.round((500 / this.getCurrentPrice()) * 100)}% ក្នុង ១ ខែ!

💡 Break-even ក្នុង ${Math.ceil(this.getCurrentPrice() / 15)} ថ្ងៃ ប៉ុណ្ណោះ!`,

      no_time: () => `⏰ "មិនមានពេល"?

🤔 អ្នកមានពេល:
• មើល Facebook: ៣០ នាទី/ថ្ងៃ?
• មើល TikTok: ៤៥ នាទី/ថ្ងៃ?
• ញ៉ាំម្ហូប: ៦០ នាទី/ថ្ងៃ?

💡 កម្មវិធីនេះ: ១៥-២០ នាទី/ថ្ងៃ × ៧ ថ្ងៃ = ២ ម៉ោង ២០ នាទី សរុប!

🎯 ២ ម៉ោង ២០ នាទី = ផ្លាស់ប្តូរជីវិតហិរញ្ញវត្ថុ!

💰 ២ ម៉ោង ២០ នាទី = សន្សំបាន $400-1200/ខែ!

⚡ តើមានតម្លៃអត់?`,

      not_sure: () => `🤔 "មិនច្បាស់"?

💡 អ្វីដែលអ្នកច្បាស់:
✅ អ្នកកំពុងបាត់បង់លុយរាល់ថ្ងៃ
✅ អ្នកចង់ដឹងថាលុយទៅណា
✅ អ្នកចង់សន្សំបានច្រើន
✅ អ្នកចង់មានប្រព័ន្ធគ្រប់គ្រងលុយ

🎯 បើអ្នកច្បាស់ចំពោះបញ្ហា... ចុះហេតុអ្វីមិនច្បាស់ចំពោះដំណោះស្រាយ?

⚡ មាន ១០០% money-back guarantee! មិនមានហានិភ័យ!

💰 តម្លៃ ${this.getCurrentPrice()} ឥឡូវនេះ vs ${this.getNextPrice()} ស្អែក!`,

      need_to_think: () => `🤔 "ត្រូវគិតមុន"?

⏰ ខណៈពេលដែលអ្នក "គិត":
• បាត់បង់ $20-48 រាល់ថ្ងៃ
• តម្លៃកើនពី ${this.getCurrentPrice()} ទៅ ${this.getNextPrice()}
• Spots កាន់តែតិច (នៅសល់ ${this.getRemainingSpots()})

🎯 អ្វីដែលត្រូវ "គិត"?
✅ វាដំណើរការ - ៩២% success rate
✅ មាន guarantee - ១០០% money back
✅ តម្លៃសមរម្យ - $${(this.getCurrentPrice() / 7).toFixed(2)}/ថ្ងៃ
✅ លទ្ធផលច្បាស់ - សន្សំ $400+ ខែដំបូង

💡 "គិត" រួច = ចាត់វិធានការ = ជោគជ័យ!`,
    };

    const handlerFunc = handlers[objection];
    return handlerFunc ? handlerFunc() : handlers["not_sure"]();
  }

  /**
   * Get conversion analytics for admin dashboard
   */
  getConversionAnalytics(userId = null) {
    if (userId) {
      return this.conversionAnalytics[userId] || null;
    }

    // Return aggregate analytics
    const users = Object.keys(this.conversionAnalytics);
    const totalUsers = users.length;
    const completedSequences = users.filter(
      (id) => this.conversionAnalytics[id].sequenceCompleted,
    ).length;

    const totalDelivered = users.reduce(
      (sum, id) => sum + this.conversionAnalytics[id].messagesDelivered,
      0,
    );

    const totalFailed = users.reduce(
      (sum, id) => sum + this.conversionAnalytics[id].messagesFailed,
      0,
    );

    return {
      totalUsers,
      completedSequences,
      completionRate:
        totalUsers > 0
          ? ((completedSequences / totalUsers) * 100).toFixed(1)
          : 0,
      totalDelivered,
      totalFailed,
      deliveryRate:
        totalDelivered + totalFailed > 0
          ? ((totalDelivered / (totalDelivered + totalFailed)) * 100).toFixed(1)
          : 100,
      currentPrice: this.getCurrentPrice(),
      remainingSpots: this.getRemainingSpots(),
      activeSequences: Object.keys(this.activeSequences).length,
    };
  }

  /**
   * Reset daily/monthly metrics
   */
  resetMetrics(type = "daily") {
    if (type === "monthly") {
      this.pricingConfig.usedSpots = 0;
      console.log("🔄 Monthly metrics reset - spots available again");
    }

    if (type === "daily") {
      // Reset daily price increases, etc.
      console.log("🔄 Daily metrics reset");
    }
  }

  /**
   * A/B test different message versions - Cleaned and formatted
   */
  getABTestMessage(userId, messageType, testVariant = "A") {
    // Simple A/B testing framework
    const variants = {
      price_comparison_5min: {
        A: () => this.getConversionSequence()[0].message(),
        B: () => `💡 ការវិនិយោគតែ $${this.getCurrentPrice()} អាចផ្លាស់ប្តូរជីវិតហិរញ្ញវត្ថុរបស់អ្នក!

🎯 ធៀបនឹងចំណាយប្រចាំថ្ងៃ:
• កាហ្វេ: $4-6 (បាត់បង់ក្នុង ៣០ នាទី)
• ម្ហូប: $5-8 (បាត់បង់ក្នុង ២០ នាទី)
• Money Flow Reset: $${this.getCurrentPrice()} (ផ្លាស់ប្តូរ ១ ជីវិត)

🔥 សន្សំបាន $400-1200 ក្នុងខែដំបូង!
📈 ROI: ${Math.round((400 / this.getCurrentPrice()) * 100)}-${Math.round((1200 / this.getCurrentPrice()) * 100)}%

📱 ចាប់ផ្តើម: /instructions`,
      },
      // Add other message types for A/B testing here
    };

    const messageVariants = variants[messageType];
    if (messageVariants && messageVariants[testVariant]) {
      return messageVariants[testVariant]();
    }

    // Default fallback to the A variant of the first message in the sequence
    // or a generic message if no matching variant is found.
    return this.getConversionSequence()[0].message();
  }
}

module.exports = ConversionOptimizer;
