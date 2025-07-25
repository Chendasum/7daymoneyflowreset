/**
 * Tier Management Service for 7-Day Money Flow Reset™ - Enhanced Version
 * Handles tier-based feature access, pricing logic, analytics, and Cambodia-specific benefits
 */

const { sendLongMessage } = require("../utils/message-splitter");

class TierManager {
  constructor() {
    // Enhanced tier configuration with dynamic pricing
    this.tiers = {
      free: {
        name: "ឥតគិតថ្លៃ",
        price: 0,
        features: [
          "មើលព័ត៌មានកម្មវិធី",
          "ពិនិត្យតម្លៃសេវាកម្ម",
          "ការណែនាំទូទាត់",
        ],
        cambodiaSuccessRate: "0%",
        maxUsers: null,
      },
      essential: {
        name: "Essential Program",
        price: 24,
        originalPrice: 47,
        discountPercent: 50,
        savings: 23,
        promoCode: "LAUNCH50",
        isPromotional: true,
        features: [
          "កម្មវិធីសិក្សា 7-Day Money Flow ពេញលេញ",
          "ទទួល Daily Lessons រាល់ថ្ងៃ",
          "Progress Tracking ឧបករណ៍តាមដាន",
          "កិច្ចការ និង Worksheets ប្រចាំថ្ងៃ",
          "ជំនួយដោះស្រាយបញ្ហា",
          "Support Team ទំនាក់ទំនង",
        ],
        cambodiaSuccessRate: "អ្នកប្រើប្រាស់ជាច្រើនរាយការណ៍ពីលទ្ធផលវិជ្ជមាន",
        averageSavings: "អ្នកប្រើប្រាស់ដែលអនុវត្តជាធម្មតាឃើញមានការផ្លាស់ប្តូរ",
        maxUsers: 50,
      },
      premium: {
        name: "Premium + Support",
        price: 97,
        originalPrice: 197,
        features: [
          "មានទាំងអស់ពី Essential Program",
          "ទាក់ទងផ្ទាល់ជាមួយ @Chendasum",
          "24/7 Priority Support",
          "ដោះស្រាយបញ្ហាជាអាទិភាព",
          "Advanced Progress Tracking",
          "Personal Reports និងស្ថិតិ",
          "Extended Support ពិសេស",
        ],
        cambodiaSuccessRate:
          "អ្នកប្រើប្រាស់ Premium តែងតែរាយការណ៍ពីលទ្ធផលល្អប្រសើរ",
        averageSavings:
          "អ្នកប្រើប្រាស់ដែលទទួលបានការគាំទ្រប្រសើរឡើងតែងតែឃើញមានការកែលម្អ",
        maxUsers: 25,
      },
      vip: {
        name: "VIP Capital Strategy",
        price: 197,
        originalPrice: 497,
        features: [
          "មានទាំងអស់ពី Premium Program",
          "Capital Clarity Session (៩០ នាទី)",
          "Opening Frame - ការកំណត់យុទ្ធសាស្ត្រ",
          "Capital X-Ray - ការវិភាគរចនាសម្ព័ន្ធមូលធន",
          "Trust Mapping - ការវាយតម្លៃទំនុកចិត្ត",
          "System Readiness Score - ការវាយតម្លៃភាពត្រៀមខ្លួន",
          "Clarity Prescription - ផែនការយុទ្ធសាស្ត្រ",
          "30-Day Implementation Support",
          "Private Capital Network Access",
          "VIP Priority Support",
        ],
        cambodiaSuccessRate: "សមាជិក VIP ជាធម្មតាសម្រេចបានគោលដៅរបស់ពួកគេ",
        averageSavings: "លទ្ធផលបុគ្គលប្រែប្រួលទៅតាមការអនុវត្ត",
        maxUsers: 10,
        qualificationRequired: true,
      },
    };

    // Enhanced feature matrix with granular permissions
    this.featureMatrix = {
      // Basic Bot Access
      daily_lessons: ["essential", "premium", "vip"],
      progress_tracking: ["essential", "premium", "vip"],
      quote_system: ["essential", "premium", "vip"],
      badges: ["essential", "premium", "vip"],
      help_system: ["essential", "premium", "vip"],
      progress: ["essential", "premium", "vip"],
      milestones: ["essential", "premium", "vip"],
      streak: ["essential", "premium", "vip"],
      extended_content: ["essential", "premium", "vip"],
      vip_info: ["essential", "premium", "vip"],

      // Premium Features
      admin_access: ["premium", "vip"],
      priority_support: ["premium", "vip"],
      upload_verification: ["premium", "vip"],
      advanced_analytics: ["premium", "vip"],
      extended_help: ["premium", "vip"],
      personal_reports: ["premium", "vip"],
      direct_chendasum_contact: ["premium", "vip"],

      // VIP Features
      booking_system: ["vip"],
      capital_clarity: ["vip"],
      capital_clarity_application: ["vip"],
      capital_clarity_booking: ["vip"],
      extended_tracking: ["vip"],
      vip_content: ["vip"],
      priority_queue: ["vip"],
      advanced_milestones: ["vip"],
      private_network: ["vip"],
      one_on_one_sessions: ["vip"],
    };

    // Cambodia-specific success stories by tier
    this.cambodiaSuccessStories = {
      essential: [
        {
          name: "A.",
          location: "ភ្នំពេញ",
          role: "Office Worker",
          result: "បានកែលម្អទម្លាប់តាមដានលុយរបស់ខ្ញុំ",
        },
        {
          name: "B.",
          location: "សៀមរាប",
          role: "Shop Owner",
          result: "បានរកឃើញការចំណាយដែលមិនចាំបាច់ជាច្រើនដើម្បីកាត់បន្ថយ",
        },
        {
          name: "C.",
          location: "បាត់ដំបង",
          role: "Teacher",
          result: "បានចាប់ផ្តើមកសាងទម្លាប់ហិរញ្ញវត្ថុល្អប្រសើរ",
        },
      ],
      premium: [
        {
          name: "D.",
          location: "ភ្នំពេញ",
          role: "Business Owner",
          result: "បានកោតសរសើរចំពោះការគាំទ្រអាទិភាពនៅពេលខ្ញុំមានសំណួរ",
        },
        {
          name: "E.",
          location: "កំពត",
          role: "Restaurant Owner",
          result:
            "បានរកឃើញថាការតាមដានកម្រិតខ្ពស់មានប្រយោជន៍សម្រាប់អាជីវកម្មរបស់ខ្ញុំ",
        },
        {
          name: "F.",
          location: "ព្រះសីហនុ",
          role: "Import/Export",
          result: "របាយការណ៍ផ្ទាល់ខ្លួនបានជួយខ្ញុំឱ្យរក្សាបាននូវរបៀបរៀបរយ",
        },
      ],
      vip: [
        {
          name: "G.",
          location: "ភ្នំពេញ",
          role: "Tech Startup CEO",
          result:
            "បានរកឃើញថាវគ្គ Capital Clarity មានប្រយោជន៍សម្រាប់ការរៀបចំផែនការយុទ្ធសាស្ត្រ",
        },
        {
          name: "H.",
          location: "សៀមរាប",
          role: "Hotel Chain Owner",
          result: "បានកោតសរសើរចំពោះការណែនាំរចនាសម្ព័ន្ធមូលធនដ៏ទូលំទូលាយ",
        },
        {
          name: "I.",
          location: "បាត់ដំបង",
          role: "Agricultural Business",
          result: "បានឱ្យតម្លៃលើវិធីសាស្រ្តផ្ទាល់ខ្លួន និងការគាំទ្របន្ថែម",
        },
      ],
    };

    // Analytics tracking
    this.tierAnalytics = {
      totalUsers: { essential: 0, premium: 0, vip: 0 },
      conversionRates: {
        free_to_essential: 0,
        essential_to_premium: 0,
        premium_to_vip: 0,
      },
      averageUpgradeTime: { essential: 0, premium: 0, vip: 0 },
    };

    // Payment configuration - consistent across all methods
    this.paymentConfig = {
      aba: { account: "000 194 742", name: "SUM CHENDA" },
      acleda: { account: "092 798 169", name: "SUM CHENDA" },
      wing: { number: "102 534 677", name: "SUM CHENDA" },
    };
  }

  /**
   * Check if user has access to a specific feature
   */
  hasFeatureAccess(userTier, feature) {
    const allowedTiers = this.featureMatrix[feature] || [];
    return allowedTiers.includes(userTier);
  }

  /**
   * Check if user qualifies for VIP tier
   */
  qualifiesForVIP(userProfile) {
    // VIP qualification criteria for Cambodia market
    const criteria = {
      monthlyRevenue: userProfile.monthlyRevenue >= 10000, // $10K+ monthly
      businessOwner:
        userProfile.role === "business_owner" || userProfile.role === "founder",
      completedBasic: userProfile.completedBasicProgram === true,
      hasCapitalNeeds:
        userProfile.seekingFunding === true ||
        userProfile.managingCapital === true,
    };

    const qualificationScore = Object.values(criteria).filter(Boolean).length;
    return qualificationScore >= 3; // Must meet at least 3 out of 4 criteria
  }

  /**
   * Get tier information by name
   */
  getTierInfo(tierName) {
    return this.tiers[tierName] || this.tiers.free;
  }

  /**
   * Determine tier from payment amount with VIP qualification check
   */
  getTierFromAmount(amount, userProfile = {}) {
    if (amount >= 197) {
      // Check VIP qualification
      if (this.qualifiesForVIP(userProfile)) {
        return "vip";
      } else {
        // Offer premium instead with VIP qualification path
        return "premium";
      }
    }
    if (amount >= 97) return "premium";
    if (amount >= 24) return "essential";
    return "free";
  }

  /**
   * Get features available for a tier
   */
  getTierFeatures(tierName) {
    return this.tiers[tierName]?.features || [];
  }

  /**
   * Get Cambodia success stories for tier
   */
  getCambodiaSuccessStories(tierName, limit = 3) {
    const stories = this.cambodiaSuccessStories[tierName] || [];
    return stories.slice(0, limit);
  }

  /**
   * Enhanced pricing display for unpaid users (Essential focus with Cambodia context) - Cleaned and formatted
   */
  getUnpaidPricingDisplay() {
    const essentialStories = this.getCambodiaSuccessStories("essential");

    return `💰 កម្មវិធី 7-Day Money Flow Reset™ - ប្រព័ន្ធគ្រប់គ្រងលុយលេខ ១ ក្នុងកម្ពុជា

🚨 LAUNCH SPECIAL - ៥០% OFF! 🚨
🔥 តម្លៃពិសេស: តែ $24 USD (ធម្មតា $47)
💰 អ្នកសន្សំបាន: $23 USD
🎯 កូដ: LAUNCH50
⏰ តែ ២០០ កន្លែងដំបូងប៉ុណ្ណោះ!

📊 តម្លៃក្នុង ១ ថ្ងៃ = $3.43 តែប៉ុណ្ណោះ!
☕ ធៀបនឹង: កាហ្វេ ១ ពែង = $4-5
🍕 ធៀបនឹង: Pizza ១ ចំណិត = $12-15

🏆 ចំណាប់អារម្មណ៍វិជ្ជមាន: អ្នកប្រើប្រាស់ជាច្រើនរាយការណ៍ពីការកែលម្អ
💰 លទ្ធផលធម្មតា: លទ្ធផលផ្ទាល់ខ្លួនអាស្រ័យលើការអនុវត្ត

📈 ឧទាហរណ៍បទពិសោធន៍ (អ្នកប្រើប្រាស់កម្ពុជា):
👤 "${essentialStories[0]?.result}" - ${essentialStories[0]?.name}, ${essentialStories[0]?.location}
👤 "${essentialStories[1]?.result}" - ${essentialStories[1]?.name}, ${essentialStories[1]?.location}
👤 "${essentialStories[2]?.result}" - ${essentialStories[2]?.name}, ${essentialStories[2]?.location}

🎯 លក្ខណៈពិសេសកម្មវិធី:
• អ្នកចូលរួមជាច្រើនបង្កើតទម្លាប់គ្រប់គ្រងលុយកាន់តែប្រសើរ
• ម្ចាស់អាជីវកម្មកម្ពុជារកឃើញថាមាតិកាទាក់ទងនឹងស្ថានការណ៍ពួកគេ
• អ្នកប្រើដែលអនុវត្តតាមមេរៀនតែងតែឃើញការកែលម្អ
• មានជម្រើសសុំលុយវិញប្រសិនបើអ្នកមិនពេញចិត្ត

💎 មេរៀនពេញលេញ ៧ ថ្ងៃ:
• ថ្ងៃទី ១: ស្គាល់លំហូរលុយ + ស្វែងរកកន្លែងដែលលុយលេចធ្លាយ
• ថ្ងៃទី ២: បិទកន្លែងលុយលេចធ្លាយដែលអ្នករកឃើញ
• ថ្ងៃទី ៣: ពិនិត្យសុខភាពហិរញ្ញវត្ថុផ្ទាល់ខ្លួន
• ថ្ងៃទី ៤: គណនាយន្តលំហូរលុយពិតប្រាកដ
• ថ្ងៃទី ៥: កែលម្អតុល្យភាពចំណាយ
• ថ្ងៃទី ៦: បង្កើតប្រព័ន្ធអាទិភាពសកម្មភាពផ្ទាល់ខ្លួន
• ថ្ងៃទី ៧: បញ្ចប់ និងចូលទៅកម្រិតបន្ទាប់

✅ អ្វីដែលអ្នកអាចធ្វើបាន:
• រៀនកំណត់កន្លែងលុយលេចធ្លាយក្នុងការចំណាយ
• ជំរុញជំនាញគ្រប់គ្រងលុយ
• បង្កើតប្រព័ន្ធតាមដានហិរញ្ញវត្ថុផ្ទាល់ខ្លួន
• បង្កើតទម្លាប់ហិរញ្ញវត្ថុកាន់តែប្រសើរ
• កាត់បន្ថយការព្រួយបារម្ភដែលទាក់ទងនឹងលុយ
• ធ្វើការឆ្ពោះទៅរកការកែលម្អហិរញ្ញវត្ថុ

🇰🇭 អត្ថប្រយោជន៍ពិសេសសម្រាប់កម្ពុជា:
• យល់ដឹងអំពីប្រព័ន្ធធនាគារ ABA/ACLEDA
• លំនាំចំណាយអាជីវកម្មក្នុងស្រុក
• យុទ្ធសាស្ត្រកែលម្អចំណូលកម្ពុជា
• ការគាំទ្រភាសាខ្មែរ ២៤/៧

🎯 សម្រាប់អ្នកដែល:
• បាត់បង់លុយដោយមិនដឹងថាទៅណា
• ចង់សន្សំបាន ប៉ុន្តែមិនដឹងចាប់ផ្តើម
• ចង់ឈប់ព្រួយបារម្ភអំពីលុយ
• ចង់មានប្រព័ន្ធគ្រប់គ្រងលុយ
• ចង់ដឹងថាតើទៅកាន់ហិរញ្ញវត្ថុបែបណា

💳 វិធីសាស្ត្រទូទាត់កម្ពុជា:
🏦 ធនាគារ ABA: ${this.paymentConfig.aba.account}
• ឈ្មោះ: ${this.paymentConfig.aba.name}
• Reference: BOT[YOUR_ID]

🏦 ធនាគារ ACLEDA: ${this.paymentConfig.acleda.account}
• ឈ្មោះ: ${this.paymentConfig.acleda.name}
• Reference: BOT[YOUR_ID]

📱 Wing Transfer: ${this.paymentConfig.wing.number}
• ឈ្មោះ: ${this.paymentConfig.wing.name}
• កំណត់ចំណាំ: BOT[YOUR_ID]

⚡ ប្រសិនបើអ្នកមិនពេញចិត្តនឹងកម្មវិធី ទាក់ទងយើងដើម្បីដោះស្រាយ!

💬 បន្ទាប់ពីទូទាត់ សូមផ្ញើរូបភាពបញ្ជាក់ការទូទាត់!

🚀 ចាប់ផ្តើមភ្លាមៗ - ទទួលមេរៀនថ្ងៃទី ១ ភ្លាមៗ!
⏰ អាចចុះឈ្មោះបានឥឡូវនេះ!

📈 ជោគជ័យរបស់អ្នកអាស្រ័យលើការអនុវត្តអ្វីដែលអ្នករៀន!`;
  }

  /**
   * Enhanced pricing display for paid users (all tiers with upgrade incentives) - Cleaned and formatted
   */
  getPaidPricingDisplay() {
    const premiumStories = this.getCambodiaSuccessStories("premium", 1);
    const vipStories = this.getCambodiaSuccessStories("vip", 1);

    return `💰 កម្មវិធី 7-Day Money Flow Reset™ - ជម្រើសដំឡើងកម្រិត

🎯 ESSENTIAL PROGRAM - $47 (អ្នកមានកម្មវិធីនេះហើយ!)
${this.tiers.essential.features.map((f) => `• ${f}`).join("\n")}
• អត្រាជោគជ័យ: ${this.tiers.essential.cambodiaSuccessRate}
• ការសន្សំជាមធ្យម: ${this.tiers.essential.averageSavings}

🚀 PREMIUM + SUPPORT - $97 (ដំឡើង +$50)
${this.tiers.premium.features.map((f) => `• ${f}`).join("\n")}
• អត្រាជោគជ័យ: ${this.tiers.premium.cambodiaSuccessRate}
• ការសន្សំជាមធ្យម: ${this.tiers.premium.averageSavings}

🏆 រឿងរ៉ាវជោគជ័យ Premium:
"${premiumStories[0]?.result}" - ${premiumStories[0]?.name}

👑 VIP CAPITAL STRATEGY - $197 (ដំឡើង +$150)
${this.tiers.vip.features.map((f) => `• ${f}`).join("\n")}
• អត្រាជោគជ័យ: ${this.tiers.vip.cambodiaSuccessRate}
• លទ្ធផលជាមធ្យម: ${this.tiers.vip.averageSavings}
• លក្ខខណ្ឌតម្រូវ: ម្ចាស់អាជីវកម្មដែលមានចំណូលប្រចាំខែ $10K+

🏆 រឿងរ៉ាវជោគជ័យ VIP:
"${vipStories[0]?.result}" - ${vipStories[0]?.name}

🎯 ការប្រៀបធៀបអត្ថប្រយោជន៍នៃការដំឡើងកម្រិត:
📊 Essential → Premium:
• ការចូលប្រើ @Chendasum ដោយផ្ទាល់
• ការគាំទ្រអាទិភាព ២៤/៧
• ការវិភាគកម្រិតខ្ពស់
• របាយការណ៍ផ្ទាល់ខ្លួន
• ការពេញចិត្តប្រសើរឡើងដែលបានរាយការណ៍ធៀបនឹងកម្មវិធីស្តង់ដារ

📊 Premium → VIP:
• វគ្គ Capital Clarity ១-ទល់-១ (តម្លៃ $197)
• ការចូលប្រើបណ្តាញមូលធនឯកជន
• ការគាំទ្រការអនុវត្តរយៈពេល ៣០ ថ្ងៃ
• សមាជិក VIP ជាធម្មតារាយការណ៍ពីលទ្ធផលល្អប្រសើរ
• សមាជិក VIP ធ្វើការឆ្ពោះទៅរកគោលដៅហិរញ្ញវត្ថុកម្រិតខ្ពស់

💳 ការទូទាត់សម្រាប់ការដំឡើងកម្រិត:
🏦 ABA: ${this.paymentConfig.aba.account} (${this.paymentConfig.aba.name})
🏦 ACLEDA: ${this.paymentConfig.acleda.account} (${this.paymentConfig.acleda.name})
📱 Wing: ${this.paymentConfig.wing.number} (${this.paymentConfig.wing.name})

Reference: UPGRADE-BOT[YOUR_ID]

📝 បន្ទាប់ពីទូទាត់ សូមផ្ញើការបញ្ជាក់ + បញ្ជាក់ជម្រើសដំឡើងកម្រិតរបស់អ្នក!

🎁 BONUS សម្រាប់ការដំឡើងកម្រិត: ដំឡើងក្នុងរយៈពេល ៤៨ ម៉ោង = ការវាយតម្លៃមូលធនដោយឥតគិតថ្លៃ (តម្លៃ $97)!`;
  }

  /**
   * Get pricing display based on user payment status
   */
  getPricingDisplay(isPaid = false) {
    return isPaid
      ? this.getPaidPricingDisplay()
      : this.getUnpaidPricingDisplay();
  }

  /**
   * Check if user can upgrade to a higher tier
   */
  canUpgrade(currentTier, targetTier) {
    const tierOrder = ["free", "essential", "premium", "vip"];
    const currentIndex = tierOrder.indexOf(currentTier);
    const targetIndex = tierOrder.indexOf(targetTier);
    return targetIndex > currentIndex;
  }

  /**
   * Enhanced upgrade message with specific incentives - Cleaned and formatted
   */
  getUpgradeMessage(currentTier) {
    const tierOrder = ["free", "essential", "premium", "vip"];
    const currentIndex = tierOrder.indexOf(currentTier);
    const nextTier = tierOrder[currentIndex + 1];

    if (!nextTier) {
      return `👑 អ្នកកំពុងប្រើកម្រិតខ្ពស់បំផុត!

🎯 អត្ថប្រយោជន៍ផ្តាច់មុខ VIP:
• ការចូលប្រើបណ្តាញមូលធនឯកជន
• ឱកាសវិនិយោគដែលអញ្ជើញតែប៉ុណ្ណោះ
• វគ្គយុទ្ធសាស្ត្រកម្រិតខ្ពស់
• ការចូលប្រើការណែនាំផ្ទាល់

អរគុណសម្រាប់ការជ្រើសរើស VIP! 🔱`;
    }

    const nextTierInfo = this.tiers[nextTier];
    const currentTierInfo = this.tiers[currentTier];
    const upgradePrice = nextTierInfo.price - currentTierInfo.price;

    const upgradeMessages = {
      essential: `🚀 ដំឡើងទៅ PREMIUM? (តែ +$50)

🏆 របាយការណ៍ពិតអ្នកប្រើប្រាស់ Premium នៅកម្ពុជា:
"${this.cambodiaSuccessStories.premium[0].result}" - ${this.cambodiaSuccessStories.premium[0].name}, ${this.cambodiaSuccessStories.premium[0].location}

✅ អ្វីដែលអ្នកនឹងទទួលបាន:
• ទាក់ទងផ្ទាល់ជាមួយ @Chendasum
• ការគាំទ្រអាទិភាព ២៤/៧ (ឆ្លើយក្នុង ២ ម៉ោង)
• ការវិភាគវឌ្ឍនភាពកម្រិតខ្ពស់
• របាយការណ៍ប្រចាំខែផ្ទាល់ខ្លួន
• ការគាំទ្រប្រសើរឡើង: សមាជិក Premium រាយការណ៍ពីការពេញចិត្តខ្ពស់ធៀបនឹងកម្មវិធីស្តង់ដារ
• សមាជិកដែលទទួលបានការគាំទ្រប្រសើរឡើងតែងតែរាយការណ៍ពីវឌ្ឍនភាពល្អប្រសើរ

💰 ការវិនិយោគ: តែ $50 បន្ថែម = ទទួលបានតម្លៃទ្វេដង!
📈 តម្លៃប្រសើរឡើង: អ្នកប្រើប្រាស់ Premium រាយការណ៍ពីការពេញចិត្តប្រសើរឡើងជាមួយនឹងការគាំទ្រ

🎁 BONUS សម្រាប់ការដំឡើងកម្រិតថ្ងៃនេះ:
• ការពិនិត្យសុខភាពហិរញ្ញវត្ថុកម្រិតខ្ពស់ដោយឥតគិតថ្លៃ (តម្លៃ $47)
• ជួរអាទិភាពសម្រាប់រាល់ការគាំទ្រ
• ការចូលប្រើបណ្តាញវិនិយោគិនផ្តាច់មុខនៅកម្ពុជា

💳 ការទូទាត់: ABA ${this.paymentConfig.aba.account}
Reference: PREMIUM-UPGRADE-BOT[YOUR_ID]

ចង់ដំឡើងកម្រិត? ប្រើ /upgrade_premium`,

      premium: `👑 ត្រៀមខ្លួនសម្រាប់ VIP CAPITAL STRATEGY ហើយឬនៅ? (+$100)

🏆 របាយការណ៍ពិតជោគជ័យ VIP នៅកម្ពុជា:
"${this.cambodiaSuccessStories.vip[0].result}" - ${this.cambodiaSuccessStories.vip[0].name}, ${this.cambodiaSuccessStories.vip[0].location}

✅ ការចូលប្រើផ្តាច់មុខ VIP:
• វគ្គ Capital Clarity ឯកជន ៩០ នាទី
• ក្របខ័ណ្ឌវិភាគមូលធន ៥ ដំណាក់កាល
• យុទ្ធសាស្ត្របង្កើនប្រសិទ្ធភាពមូលធនផ្ទាល់ខ្លួន
• ការបង្វឹកការអនុវត្តរយៈពេល ៣០ ថ្ងៃ
• បណ្តាញមូលធនឯកជននៅកម្ពុជា
• ការចូលប្រើឱកាសវិនិយោគដោយផ្ទាល់

📊 អត្ថប្រយោជន៍ VIP ធៀបនឹង PREMIUM:
• បទពិសោធន៍: សមាជិក VIP ជាធម្មតាសម្រេចបានគោលដៅរបស់ពួកគេ
• កម្រិតគាំទ្រ: ប្រសើរឡើងធៀបនឹងស្តង់ដារ
• ការចូលប្រើ: បណ្តាញឯកជនធៀបនឹងការគាំទ្រស្តង់ដារ
• សក្តានុពលលូតលាស់: លទ្ធផលបុគ្គលប្រែប្រួលទៅតាមការអនុវត្ត

⚠️ លក្ខខណ្ឌតម្រូវ VIP:
• ម្ចាស់អាជីវកម្ម/ស្ថាបនិក
• ចំណូលប្រចាំខែ $10K+ ឬកំពុងស្វែងរកមូលនិធិ
• បានបញ្ចប់កម្មវិធីមូលដ្ឋាន
• កំពុងគ្រប់គ្រងមូលធនសំខាន់ៗ

💰 ការវិនិយោគ: ការដំឡើងកម្រិត $100 = ការណែនាំយុទ្ធសាស្ត្រ និងការគាំទ្រប្រសើរឡើង
📈 លទ្ធផល VIP: លទ្ធផលបុគ្គលអាស្រ័យលើការអនុវត្ត និងការប្តេជ្ញាចិត្ត

🎁 BONUS ផ្តាច់មុខ VIP:
• ការវាយតម្លៃការត្រៀមខ្លួនមូលធនដោយឥតគិតថ្លៃ (តម្លៃ $197)
• ការណែនាំបណ្តាញវិនិយោគិននៅកម្ពុជា
• វគ្គពិនិត្យយុទ្ធសាស្ត្រប្រចាំត្រីមាស

តើអ្នកមានលក្ខណៈសម្បត្តិគ្រប់គ្រាន់សម្រាប់ VIP ដែរឬទេ? ប្រើ /vip_qualification`,
    };

    return (
      upgradeMessages[currentTier] ||
      `សូមទាក់ទងដើម្បីដំឡើងកម្រិតទៅកម្រិតបន្ទាប់!`
    );
  }

  /**
   * Enhanced tier-specific welcome message with success stories - Cleaned and formatted
   */
  getTierWelcomeMessage(tier) {
    const tierInfo = this.tiers[tier];
    const successStories = this.getCambodiaSuccessStories(tier, 1);

    const welcomeMessages = {
      essential: `🎯 ស្វាគមន៍ចូល Essential Program!

🏆 អ្នកបានចូលរួមកម្មវិធីគ្រប់គ្រងលុយលេខ ១ របស់កម្ពុជា!

✅ អ្នកទទួលបាន:
• កម្មវិធីសិក្សា ៧ ថ្ងៃពេញលេញ
• មេរៀនរាល់ថ្ងៃជាមួយនឹងសកម្មភាពភ្លាមៗ
• ឧបករណ៍តាមដានសមិទ្ធផល
• កិច្ចការ និងលំហាត់ប្រចាំថ្ងៃ
• ការគាំទ្រពីក្រុមជំនួយនៅកម្ពុជា

📈 អត្រាជោគជ័យ: ${tierInfo.cambodiaSuccessRate}
💰 ការសន្សំជាមធ្យម: ${tierInfo.averageSavings}

🎯 អ្នកដែលបានបញ្ចប់ Essential Program នៅកម្ពុជា:
"${successStories[0]?.result}" - ${successStories[0]?.name}, ${successStories[0]?.location}

🚀 ចាប់ផ្តើមជាមួយ /day1 ឥឡូវនេះ!
⏰ គោលដៅ: រកលុយ $30+ ថ្ងៃដំបូង!`,

      premium: `🚀 ស្វាគមន៍ចូល Premium Program!

👑 អ្នកឥឡូវមានការចូលប្រើ VIP ទៅកាន់អ្វីៗទាំងអស់!

✅ អ្នកទទួលបាន:
• កម្មវិធីមូលដ្ឋានពេញលេញ
• ទាក់ទងផ្ទាល់ជាមួយ @Chendasum (២៤/៧)
• ជំនួយបន្ទាន់ក្នុង ២ ម៉ោង
• ដោះស្រាយបញ្ហាជាអាទិភាព
• ការតាមដានលម្អិតខ្ពស់

📈 អត្រាជោគជ័យ: ${tierInfo.cambodiaSuccessRate}
💰 ការសន្សំជាមធ្យម: ${tierInfo.averageSavings}

🎯 អ្នកដែលបានបញ្ចប់ Premium Program នៅកម្ពុជា:
"${successStories[0]?.result}" - ${successStories[0]?.name}, ${successStories[0]?.location}

🔥 អ្នកអាចទាក់ទងអ្នកគ្រប់គ្រងដោយផ្ទាល់!
💪 ចាប់ផ្តើមជាមួយ /day1 + ការតាមដាន Premium!`,

      vip: `👑 ស្វាគមន៍ចូល VIP Capital Strategy!

🏛️ អ្នកឥឡូវជាសមាជិក VIP Capital Network Cambodia!

✅ អ្នកទទួលបាន:
• Premium Program ពេញលេញ
• ជួបផ្ទាល់ ១-ទល់-១ Capital Clarity Session
• វគ្គមូលដ្ឋានយុទ្ធសាស្ត្រ ៩០ នាទី
• ការតាមដានការអនុវត្តរយៈពេល ៣០ ថ្ងៃ
• ការគាំទ្រអាទិភាព VIP (ឆ្លើយតប ១ ម៉ោង)
• ចូលរួម Private Cambodia Capital Network

📈 អត្រាជោគជ័យ: ${tierInfo.cambodiaSuccessRate}
💰 លទ្ធផលជាមធ្យម: ${tierInfo.averageSavings}

🎯 សមិទ្ធផលអ្នកដែលបានបញ្ចប់ VIP Program នៅកម្ពុជា:
"${successStories[0]?.result}" - ${successStories[0]?.name}, ${successStories[0]?.location}

🔥 អ្នកទទួលបានការបម្រើពិសេសកម្រិតយុទ្ធសាស្ត្រមូលធន!
💎 ចាប់ផ្តើមជាមួយ /day1 + កំណត់ពេលវគ្គ VIP!

📞 VIP Direct Line: @Chendasum (បញ្ជាក់ការចូលប្រើ VIP)`,
    };

    return (
      welcomeMessages[tier] || `ស្វាគមន៍! ប្រើ /pricing ដើម្បីមើលកម្មវិធី។`
    );
  }

  /**
   * Get tier badge/icon
   */
  getTierBadge(tier) {
    const badges = {
      free: "🔓",
      essential: "🎯",
      premium: "🚀",
      vip: "👑",
    };
    return badges[tier] || "🔓";
  }

  /**
   * Get simple tier description for users
   */
  getSimpleTierDescription(tier) {
    const descriptions = {
      essential: "កម្មវិធី ៧ ថ្ងៃពេញលេញ + ការគាំទ្រ",
      premium: "Essential + ការគាំទ្រ Premium ២៤/៧",
      vip: "Premium + វគ្គយុទ្ធសាស្ត្រមូលធន",
    };
    return descriptions[tier] || "មិនមានកម្មវិធី";
  }

  /**
   * Track tier analytics
   */
  trackTierUsage(tier, action = "access") {
    if (!this.tierAnalytics.totalUsers[tier]) {
      this.tierAnalytics.totalUsers[tier] = 0;
    }

    if (action === "conversion") {
      this.tierAnalytics.totalUsers[tier] += 1;
    }

    // Log for admin analytics
    console.log(
      `📊 Tier Analytics: ${tier} ${action} - Total users: ${this.tierAnalytics.totalUsers[tier]}`,
    );
  }

  /**
   * Get tier analytics summary
   */
  getTierAnalytics() {
    return {
      tierDistribution: this.tierAnalytics.totalUsers,
      conversionRates: this.tierAnalytics.conversionRates,
      totalRevenue: {
        essential:
          this.tierAnalytics.totalUsers.essential * this.tiers.essential.price,
        premium:
          this.tierAnalytics.totalUsers.premium * this.tiers.premium.price,
        vip: this.tierAnalytics.totalUsers.vip * this.tiers.vip.price,
      },
      availableSpots: {
        essential:
          this.tiers.essential.maxUsers -
          this.tierAnalytics.totalUsers.essential,
        premium:
          this.tiers.premium.maxUsers - this.tierAnalytics.totalUsers.premium,
        vip: this.tiers.vip.maxUsers - this.tierAnalytics.totalUsers.vip,
      },
    };
  }

  /**
   * Check if tier has available spots
   */
  hasAvailableSpots(tier) {
    const tierInfo = this.tiers[tier];
    if (!tierInfo.maxUsers) return true; // Unlimited

    const usedSpots = this.tierAnalytics.totalUsers[tier] || 0;
    return usedSpots < tierInfo.maxUsers;
  }

  /**
   * Get remaining spots for tier
   */
  getRemainingSpots(tier) {
    const tierInfo = this.tiers[tier];
    if (!tierInfo.maxUsers) return "គ្មានកំណត់"; // Translated: Unlimited

    const usedSpots = this.tierAnalytics.totalUsers[tier] || 0;
    return Math.max(0, tierInfo.maxUsers - usedSpots);
  }

  /**
   * Generate tier comparison table - Cleaned and formatted
   */
  getTierComparison() {
    return `📊 ការប្រៀបធៀបកម្រិត - ជ្រើសរើសកម្រិតជោគជ័យរបស់អ្នក:

🎯 កម្មវិធីសាមញ្ញ - $47
• កម្មវិធី ៧ ថ្ងៃ ពេញលេញ
• មេរៀនរាល់ថ្ងៃ
• តាមដានការរីកចម្រើន
• ជំនួយមូលដ្ឋាន
• អត្រាជោគជ័យ: ៩២%
• សន្សំលុយជាមធ្យម: $400-800/ខែ
• ចម្លើយតបគាំទ្រ: ២៤ ម៉ោង
• សម្រាប់: អ្នកចាប់ផ្តើម
• កន្លែងនៅសល់: ${this.getRemainingSpots("essential")}

🚀 កម្មវិធីពេញលេញ - $97
• គ្រប់យ៉ាងពីកម្មវិធីសាមញ្ញ
• ទាក់ទង @Chendasum ផ្ទាល់
• ជំនួយអាទិភាព
• ការវិភាគកម្រិតខ្ពស់
• របាយការណ៍ផ្ទាល់ខ្លួន
• អត្រាជោគជ័យ: ៩៦%
• សន្សំលុយជាមធ្យម: $800-1500/ខែ
• ចម្លើយតបគាំទ្រ: ២ ម៉ោង
• សម្រាប់: អ្នករៀនពិតប្រាកដ
• កន្លែងនៅសល់: ${this.getRemainingSpots("premium")}

👑 កម្មវិធី VIP - $197
• គ្រប់យ៉ាងពីកម្មវិធីពេញលេញ
• វគ្គ Capital Clarity (៩០ នាទី)
• បណ្តាញឯកជនមូលធន
• សម្ភាសន៍ ១-ទល់-១
• ជំនួយ VIP
• អត្រាជោគជ័យ: ៩៨%
• លទ្ធផលជាមធ្យម: $2000-5000/ខែ
• ចម្លើយតបគាំទ្រ: ១ ម៉ោង
• សម្រាប់: ម្ចាស់អាជីវកម្ម
• កន្លែងនៅសល់: ${this.getRemainingSpots("vip")}

💡 ជ្រើសរើសកម្រិតដែលសមស្របនឹងគោលដៅរបស់អ្នក!`;
  }

  /**
   * Get personalized tier recommendation
   */
  getTierRecommendation(userProfile) {
    const { monthlyIncome, goals, experience, businessOwner } = userProfile;

    if (businessOwner && monthlyIncome >= 10000) {
      return {
        recommended: "vip",
        reason:
          "VIP Capital Strategy perfect for business owners with significant capital needs",
        upgrade:
          "Essential → VIP saves time and maximizes ROI for your business scale",
      };
    }

    if (monthlyIncome >= 3000 || goals.includes("advanced_tracking")) {
      return {
        recommended: "premium",
        reason: "Premium Support ensures faster results and direct guidance",
        upgrade: "Essential → Premium gives you 96% vs 92% success rate",
      };
    }

    return {
      recommended: "essential",
      reason:
        "Essential Program perfect starting point with proven 92% success rate",
      upgrade: "Start with Essential, upgrade later if needed",
    };
  }

  /**
   * Get limited time offer for tier - Cleaned and formatted
   */
  getLimitedTimeOffer(tier) {
    const offers = {
      essential: `🔥 ពេលវេលាមានកំណត់: Essential Program
• ⏰ តម្លៃ: $47 (ធម្មតា: $97) - សន្សំបាន $50!
• 🎁 BONUS: Free Money Leak Checklist (តម្លៃ $27)
• ⚡ ផុតកំណត់: ៤៨ ម៉ោង
• 📍 កន្លែង: នៅសល់ ${this.getRemainingSpots("essential")}`,

      premium: `🚀 ពេលវេលាមានកំណត់: Premium Upgrade
• ⏰ តម្លៃ: +$50 (ធម្មតា: +$100) - សន្សំបាន $50!
• 🎁 BONUS: Free Advanced Analytics Setup (តម្លៃ $47)
• ⚡ ផុតកំណត់: ២៤ ម៉ោង
• 📍 កន្លែង: នៅសល់ ${this.getRemainingSpots("premium")}`,

      vip: `👑 ផ្តាច់មុខ: VIP Capital Strategy
• ⏰ តម្លៃ: $197 (ធម្មតា: $497) - សន្សំបាន $300!
• 🎁 BONUS: Free Capital Assessment (តម្លៃ $197)
• ⚡ ផុតកំណត់: ៧២ ម៉ោង (តម្រូវឱ្យមានគុណវុឌ្ឍិ)
• 📍 កន្លែង: នៅសល់ ${this.getRemainingSpots("vip")}`,
    };

    return offers[tier] || "";
  }
}

module.exports = TierManager;
