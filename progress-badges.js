/**
 * Animated Progress Tracking Badges Service
 * Creates visual badges and progress indicators for user achievements
 */

class ProgressBadgesService {
  constructor() {
    this.badgeTypes = {
      DAILY_PROGRESS: 'daily_progress',
      PAYMENT_TIER: 'payment_tier',
      MILESTONE: 'milestone',
      COMPLETION: 'completion',
      STREAK: 'streak'
    };

    this.badgeStyles = {
      completed: {
        emoji: '✅',
        color: '🟢',
        animation: '✨'
      },
      current: {
        emoji: '🔄',
        color: '🟡',
        animation: '💫'
      },
      locked: {
        emoji: '🔒',
        color: '⚫',
        animation: '💤'
      },
      vip: {
        emoji: '👑',
        color: '🟣',
        animation: '💎'
      }
    };

    this.milestones = {
      day1: { name: 'Money Flow អ្នកស្គាល់', reward: 'បានចាប់ផ្តើម!', emoji: '🌊' },
      day2: { name: 'Money Leak Hunter', reward: 'បានរកឃើញ!', emoji: '🔍' },
      day3: { name: 'System Evaluator', reward: 'បានវាយតម្លៃ!', emoji: '⚡' },
      day4: { name: 'Income Mapper', reward: 'បានផែនទី!', emoji: '🗺️' },
      day5: { name: 'Balance Master', reward: 'បានជ្រើសរើស!', emoji: '⚖️' },
      day6: { name: 'Action Planner', reward: 'បានបង្កើត!', emoji: '🎯' },
      day7: { name: 'Money Flow Master', reward: 'បានជោគជ័យ!', emoji: '🏆' }
    };
  }

  /**
   * Generate daily progress badge display
   * @param {Object} progress - User progress data
   * @returns {string} Formatted badge display
   */
  generateDailyProgressBadges(progress) {
    const { currentDay, completedDays, isPaid } = progress;
    
    let badgeDisplay = '📊 ការរីកចម្រើនរបស់អ្នក:\n\n';
    
    // Header with overall progress
    const totalProgress = Math.round((completedDays.length / 7) * 100);
    badgeDisplay += `${this.generateProgressBar(totalProgress)} ${totalProgress}%\n\n`;
    
    // Daily badges
    for (let day = 1; day <= 7; day++) {
      const isCompleted = completedDays.includes(day);
      const isCurrent = day === currentDay;
      const isLocked = !isPaid || (day > currentDay && !isCompleted);
      
      let badge = this.createDayBadge(day, isCompleted, isCurrent, isLocked);
      badgeDisplay += badge + '\n';
    }
    
    // Add milestone section
    badgeDisplay += '\n🏅 សមិទ្ធផល:\n';
    badgeDisplay += this.generateMilestoneBadges(completedDays);
    
    return badgeDisplay;
  }

  /**
   * Create individual day badge
   * @param {number} day - Day number
   * @param {boolean} isCompleted - Is day completed
   * @param {boolean} isCurrent - Is current day
   * @param {boolean} isLocked - Is day locked
   * @returns {string} Day badge string
   */
  createDayBadge(day, isCompleted, isCurrent, isLocked) {
    let badge = '';
    
    if (isCompleted) {
      const milestone = this.milestones[`day${day}`];
      badge = `${this.badgeStyles.completed.animation} ${this.badgeStyles.completed.emoji} Day ${day}: ${milestone.name} ${milestone.emoji}`;
    } else if (isCurrent) {
      badge = `${this.badgeStyles.current.animation} ${this.badgeStyles.current.emoji} Day ${day}: កំពុងធ្វើ... ${this.badgeStyles.current.color}`;
    } else if (isLocked) {
      badge = `${this.badgeStyles.locked.emoji} Day ${day}: មិនទាន់ដល់ពេល`;
    } else {
      badge = `⭐ Day ${day}: ចាប់ផ្តើមបាន!`;
    }
    
    return badge;
  }

  /**
   * Generate milestone badges
   * @param {Array} completedDays - Array of completed days
   * @returns {string} Milestone badges display
   */
  generateMilestoneBadges(completedDays) {
    let milestoneDisplay = '';
    
    completedDays.forEach(day => {
      const milestone = this.milestones[`day${day}`];
      if (milestone) {
        milestoneDisplay += `${milestone.emoji} ${milestone.name} - ${milestone.reward}\n`;
      }
    });
    
    if (milestoneDisplay === '') {
      milestoneDisplay = '🎯 បញ្ចប់មេរៀនដើម្បីទទួលបាន badge!\n';
    }
    
    // Add special milestones
    if (completedDays.length >= 3) {
      milestoneDisplay += '🔥 មជ្ឈមភាព Badge - បាន 3 ថ្ងៃ!\n';
    }
    if (completedDays.length >= 5) {
      milestoneDisplay += '💪 អ្នកខ្លាំង Badge - បាន 5 ថ្ងៃ!\n';
    }
    if (completedDays.length === 7) {
      milestoneDisplay += '🏆 Champion Badge - បញ្ចប់ពេញលេញ!\n';
    }
    
    return milestoneDisplay;
  }

  /**
   * Generate payment tier badge
   * @param {Object} user - User data
   * @returns {string} Payment tier badge
   */
  generatePaymentTierBadge(user) {
    const { isPaid, paymentTier, isVip } = user;
    
    if (isVip) {
      return `${this.badgeStyles.vip.animation} ${this.badgeStyles.vip.emoji} VIP Member ${this.badgeStyles.vip.color}`;
    } else if (isPaid) {
      return `💎 Premium Member ✨`;
    } else {
      return `🆓 Free Trial Member`;
    }
  }

  /**
   * Generate animated progress bar
   * @param {number} percentage - Progress percentage
   * @returns {string} Animated progress bar
   */
  generateProgressBar(percentage) {
    const filled = Math.floor(percentage / 10);
    const empty = 10 - filled;
    
    let bar = '[';
    for (let i = 0; i < filled; i++) {
      bar += '=';
    }
    for (let i = 0; i < empty; i++) {
      bar += '-';
    }
    bar += ']';
    
    return bar;
  }

  /**
   * Create streak badge
   * @param {number} consecutiveDays - Number of consecutive days
   * @returns {string} Streak badge
   */
  generateStreakBadge(consecutiveDays) {
    if (consecutiveDays === 0) return '';
    
    let streakEmoji = '🔥';
    let streakText = 'ជាប់បន្ត';
    
    if (consecutiveDays >= 7) {
      streakEmoji = '🏆';
      streakText = 'Champion Streak';
    } else if (consecutiveDays >= 5) {
      streakEmoji = '💪';
      streakText = 'Strong Streak';
    } else if (consecutiveDays >= 3) {
      streakEmoji = '🔥';
      streakText = 'Fire Streak';
    }
    
    return `${streakEmoji} ${streakText}: ${consecutiveDays} ថ្ងៃ`;
  }

  /**
   * Generate comprehensive progress display
   * @param {Object} user - User data
   * @param {Object} progress - Progress data
   * @returns {string} Complete progress display
   */
  generateComprehensiveProgressDisplay(user, progress) {
    let display = '🎯 ការរីកចម្រើនពេញលេញ:\n\n';
    
    // Payment tier badge
    display += this.generatePaymentTierBadge(user) + '\n\n';
    
    // Daily progress badges
    display += this.generateDailyProgressBadges(progress) + '\n';
    
    // Streak badge
    const streak = this.calculateStreak(progress.completedDays);
    if (streak > 0) {
      display += '\n' + this.generateStreakBadge(streak) + '\n';
    }
    
    // Motivational message based on progress
    display += '\n' + this.generateMotivationalMessage(progress.completedDays.length);
    
    return display;
  }

  /**
   * Calculate user streak
   * @param {Array} completedDays - Array of completed days
   * @returns {number} Streak count
   */
  calculateStreak(completedDays) {
    if (completedDays.length === 0) return 0;
    
    const sortedDays = [...completedDays].sort((a, b) => a - b);
    let streak = 1;
    
    for (let i = 1; i < sortedDays.length; i++) {
      if (sortedDays[i] === sortedDays[i - 1] + 1) {
        streak++;
      } else {
        streak = 1;
      }
    }
    
    return streak;
  }

  /**
   * Generate motivational message based on progress
   * @param {number} completedCount - Number of completed days
   * @returns {string} Motivational message
   */
  generateMotivationalMessage(completedCount) {
    const messages = {
      0: '🚀 ចាប់ផ្តើមដំណើរហើយ!',
      1: '👏 ការចាប់ផ្តើមល្អ!',
      2: '🔥 បន្តទៅ! អ្នកកំពុងលេច!',
      3: '💪 អ្នកខ្លាំង! បន្តទៅ!',
      4: '🌟 ស្ទើរដល់ហើយ!',
      5: '🎯 បន្តិចទៀត!',
      6: '🏆 ថ្ងៃចុងក្រោយ!',
      7: '👑 អ្នកជា Champion!'
    };
    
    return messages[completedCount] || '💫 បន្តដំណើរ!';
  }

  /**
   * Create animated badge for specific achievement
   * @param {string} type - Badge type
   * @param {string} title - Badge title
   * @param {string} description - Badge description
   * @returns {string} Animated badge
   */
  createAnimatedBadge(type, title, description) {
    const animations = ['✨', '🌟', '💫', '⭐', '🔥', '💎'];
    const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
    
    return `${randomAnimation} ${title} ${randomAnimation}\n${description}`;
  }

  /**
   * Generate next milestone preview
   * @param {number} currentDay - Current day number
   * @returns {string} Next milestone preview
   */
  generateNextMilestonePreview(currentDay) {
    const nextDay = currentDay + 1;
    if (nextDay > 7) return '🏆 អ្នកបានបញ្ចប់ហើយ!';
    
    const nextMilestone = this.milestones[`day${nextDay}`];
    return `🎯 បន្ទាប់: ${nextMilestone.name} ${nextMilestone.emoji}`;
  }
}

module.exports = new ProgressBadgesService();