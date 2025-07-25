/**
 * Response Caching Service for Bot Performance Optimization
 * Caches frequently used content to achieve sub-1 second response times
 */

class ResponseCache {
  constructor() {
    this.cache = new Map();
    this.hitCount = 0;
    this.missCount = 0;
    this.maxSize = 1000;
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get cached response
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.missCount++;
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return item.data;
  }

  /**
   * Set cached response
   */
  set(key, data, ttl = this.defaultTTL) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entries
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
      created: Date.now()
    });
  }

  /**
   * Generate cache key for user-specific content
   */
  generateKey(userId, command, params = {}) {
    return `${userId}:${command}:${JSON.stringify(params)}`;
  }

  /**
   * Generate cache key for global content
   */
  generateGlobalKey(command, params = {}) {
    return `global:${command}:${JSON.stringify(params)}`;
  }

  /**
   * Clear expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.hitCount / (this.hitCount + this.missCount) * 100,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Estimate memory usage
   */
  getMemoryUsage() {
    let totalSize = 0;
    for (const [key, item] of this.cache.entries()) {
      totalSize += JSON.stringify(key).length + JSON.stringify(item.data).length;
    }
    return totalSize;
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Preload frequently used content
   */
  preloadContent() {
    // Preload help content
    const helpContent = {
      free: this.generateFreeHelpContent(),
      premium: this.generatePremiumHelpContent(),
      vip: this.generateVipHelpContent()
    };
    
    this.set('global:help:free', helpContent.free, 30 * 60 * 1000); // 30 minutes
    this.set('global:help:premium', helpContent.premium, 30 * 60 * 1000);
    this.set('global:help:vip', helpContent.vip, 30 * 60 * 1000);

    // Preload pricing content
    const pricingContent = this.generatePricingContent();
    this.set('global:pricing', pricingContent, 60 * 60 * 1000); // 1 hour

    // Preload quotes
    const quoteCategories = ['traditional', 'financial', 'motivation', 'success'];
    quoteCategories.forEach(category => {
      const quotes = this.generateQuoteContent(category);
      this.set(`global:quotes:${category}`, quotes, 60 * 60 * 1000);
    });
  }

  generateFreeHelpContent() {
    return `🛠 កម្មវិធីផ្លាស់ប្ដូរ 7-Day Money Flow Reset™ - ជំនួយការណែនាំ

📱 ពាក្យបញ្ជាទូទៅ:
• /start - ចាប់ផ្តើមកម្មវិធី
• /pricing - មើលតម្លៃកម្មវិធី
• /payment - របៀបទូទាត់
• /help - ជំនួយការណែនាំ
• /whoami - ព័ត៌មានគណនី

💳 ការទូទាត់:
• Essential: $47 - កម្មវិធី 7 ថ្ងៃពេញលេញ
• Premium: $97 - Essential + បន្ថែមពិសេស
• VIP: $197 - Premium + Capital Strategy

🔒 ដើម្បីចូលរួមកម្មវិធី សូមទូទាត់មុន។

❓ មានសំណួរអ្វី? ចុច /start ដើម្បីចាប់ផ្តើម`;
  }

  generatePremiumHelpContent() {
    return `🛠 កម្មវិធីផ្លាស់ប្ដូរ 7-Day Money Flow Reset™ - ជំនួយការណែនាំ

📱 ពាក្យបញ្ជាទូទៅ:
• /start - ចាប់ផ្តើមកម្មវិធី
• /day1 - /day7 - មេរៀនរាល់ថ្ងៃ
• /badges - បង្ហាញប្រវត្តិរបស់អ្នក
• /quote - សម្រង់ប្រាជ្ញាខ្មែរ

💎 Premium Features:
• /admin_contact - ទាក់ទងម្ចាស់ផ្ទាល់
• /priority_support - ជំនួយមុនអ្នកដទៃ
• /advanced_analytics - ស្ថិតិលម្អិត

🎯 ការរីកចម្រើន:
• បានបញ្ចប់: [progress]% នៃកម្មវិធី
• ថ្ងៃបច្ចុប្បន្ន: Day [current]

❓ មានសំណួរអ្វី? ចុច /start ដើម្បីចាប់ផ្តើម`;
  }

  generateVipHelpContent() {
    return `🛠 កម្មវិធីផ្លាស់ប្ដូរ 7-Day Money Flow Reset™ - ជំនួយការណែនាំ

📱 ពាក្យបញ្ជាទូទៅ:
• /start - ចាប់ផ្តើមកម្មវិធី
• /day1 - /day7 - មេរៀនរាល់ថ្ងៃ
• /badges - បង្ហាញប្រវត្តិរបស់អ្នក
• /quote - សម្រង់ប្រាជ្ញាខ្មែរ

💎 Premium Features:
• /admin_contact - ទាក់ទងម្ចាស់ផ្ទាល់
• /priority_support - ជំនួយមុនអ្នកដទៃ
• /advanced_analytics - ស្ថិតិលម្អិត

🏆 VIP Features:
• /book_session - ណាត់ជួបផ្ទាល់មុខ
• /vip_reports - របាយការណ៍ផ្ទាល់ខ្លួន
• /extended_tracking - តាមដាន 30 ថ្ងៃ
• /capital_clarity - Capital Strategy Session

🎯 ការរីកចម្រើន:
• បានបញ្ចប់: [progress]% នៃកម្មវិធី
• ថ្ងៃបច្ចុប្បន្ន: Day [current]

❓ មានសំណួរអ្វី? ចុច /start ដើម្បីចាប់ផ្តើម`;
  }

  generatePricingContent() {
    return `💰 កម្មវិធីផ្លាស់ប្ដូរ Money Flow Reset™ - តម្លៃនិងកម្រិត

🥉 កម្មវិធីសាមញ្ញ - $47
• មេរៀន ៧ថ្ងៃ ពេញលេញ
• ទទួលមេរៀនរាល់ថ្ងៃ
• តាមដានការរីកចម្រើន
• ទទួលលទ្ធផលជោគជ័យ

🥈 កម្មវិធីពេញលេញ - $97
• គ្រប់យ៉ាងពីកម្មវិធីសាមញ្ញ
• ជជែកផ្ទាល់ជាមួយម្ចាស់
• ជំនួយមុនអ្នកដទៃ
• ការរីកចម្រើនលម្អិត

🥇 កម្មវិធី VIP - $197
• គ្រប់យ៉ាងពីកម្មវិធីពេញលេញ
• ណាត់ជួបផ្ទាល់មុខ
• វគ្គ Capital Clarity
• តាមដាន ៣០ថ្ងៃ

💳 វិធីសាស្ត្រទូទាត់:
• ABA Bank: 001 234 567
• ACLEDA: 123-4-56789-0
• Pi Pay: 012 345 678

ទូទាត់រួច? ភ្ជាប់រូបភាព + ID របស់អ្នក`;
  }

  generateQuoteContent(category) {
    const quotes = {
      traditional: [
        "ទឹកដាច់ថ្ងៃក្តៅ ទឹកជ្រាបថ្ងៃត្រជាក់។",
        "ព្រះអាទិត្យរះក្នុងចិត្ត ទ្រព្យសម្បត្តិរុះក្នុងដៃ។",
        "ដំបូងលំបាក ចុងក្រោយសុខសាន្ត។"
      ],
      financial: [
        "លុយទិញសុភមង្គលមិនបាន តែទិញសេរីភាពបាន។",
        "វិនិយោគល្អបំផុតគឺការវិនិយោគលើខ្លួនឯង។",
        "ចំណូលធំ មិនមានន័យថាមានលុយ។"
      ],
      motivation: [
        "ថ្ងៃនេះកែប្រែ ស្អែកនឹងប្រសើរ។",
        "ជំហានតូចៗ នាំទៅជោគជ័យ។",
        "ចាប់ផ្តើមគឺជាការបញ្ចប់ការភ័យខ្លាច។"
      ],
      success: [
        "ទទួលបានអ្វីដែលបានផ្តល់។",
        "បរាជ័យជាគ្រូបង្រៀន។",
        "ភ្ញាក់ដោយក្តីសង្ឃឹម ដេកដោយក្តីសុភមង្គល។"
      ]
    };
    return quotes[category] || [];
  }
}

// Export singleton instance
module.exports = new ResponseCache();