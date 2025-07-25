/**
 * Interactive Emoji Reaction Animation Service
 * Adds animated emoji reactions for user interactions and achievements
 */

class EmojiReactionService {
  constructor() {
    this.reactionTypes = {
      LESSON_START: 'lesson_start',
      LESSON_COMPLETE: 'lesson_complete',
      PAYMENT_SUCCESS: 'payment_success',
      ACHIEVEMENT_UNLOCK: 'achievement_unlock',
      STREAK_MILESTONE: 'streak_milestone',
      ENCOURAGEMENT: 'encouragement',
      CELEBRATION: 'celebration',
      PROGRESS_UPDATE: 'progress_update'
    };

    this.emojiSets = {
      // Lesson interactions
      lesson_start: ['🚀', '📚', '💪', '🎯', '✨', '🌟', '⭐', '🔥'],
      lesson_complete: ['🎉', '✅', '🏆', '💯', '👏', '🎊', '🌟', '💎'],
      
      // Achievement reactions
      achievement_unlock: ['🏅', '🎖️', '🏆', '👑', '💎', '✨', '🌟', '⭐'],
      streak_milestone: ['🔥', '💪', '⚡', '🎯', '🚀', '💫', '🌟', '✨'],
      
      // Progress reactions
      progress_update: ['📈', '⬆️', '🎯', '💪', '🚀', '⭐', '✨', '💫'],
      
      // Emotional reactions
      encouragement: ['💪', '👍', '🙌', '👏', '✊', '💯', '🔥', '⭐'],
      celebration: ['🎉', '🎊', '🥳', '🎈', '🎁', '🌟', '✨', '💫'],
      
      // Payment reactions
      payment_success: ['💰', '💎', '🎉', '✨', '🌟', '🚀', '💯', '🏆']
    };

    this.animationPatterns = {
      WAVE: 'wave',
      PULSE: 'pulse',
      SPARKLE: 'sparkle',
      BURST: 'burst',
      FLOW: 'flow',
      BOUNCE: 'bounce'
    };
  }

  /**
   * Create animated emoji reaction
   * @param {string} type - Reaction type
   * @param {string} pattern - Animation pattern
   * @param {Object} options - Animation options
   * @returns {string} Animated emoji reaction
   */
  createReaction(type, pattern = 'wave', options = {}) {
    const {
      intensity = 'medium',
      duration = 'normal',
      customEmojis = null
    } = options;

    const emojis = customEmojis || this.emojiSets[type] || this.emojiSets.celebration;
    
    switch (pattern) {
      case 'wave':
        return this.createWaveAnimation(emojis, intensity);
      case 'pulse':
        return this.createPulseAnimation(emojis, intensity);
      case 'sparkle':
        return this.createSparkleAnimation(emojis, intensity);
      case 'burst':
        return this.createBurstAnimation(emojis, intensity);
      case 'flow':
        return this.createFlowAnimation(emojis, intensity);
      case 'bounce':
        return this.createBounceAnimation(emojis, intensity);
      default:
        return this.createWaveAnimation(emojis, intensity);
    }
  }

  /**
   * Create wave animation pattern
   * @param {Array} emojis - Emoji array
   * @param {string} intensity - Animation intensity
   * @returns {string} Wave animation
   */
  createWaveAnimation(emojis, intensity) {
    const count = this.getIntensityCount(intensity);
    const selectedEmojis = this.selectRandomEmojis(emojis, count);
    
    let animation = '';
    for (let i = 0; i < selectedEmojis.length; i++) {
      animation += selectedEmojis[i];
      if (i < selectedEmojis.length - 1) {
        animation += ' ';
      }
    }
    
    return animation;
  }

  /**
   * Create pulse animation pattern
   * @param {Array} emojis - Emoji array
   * @param {string} intensity - Animation intensity
   * @returns {string} Pulse animation
   */
  createPulseAnimation(emojis, intensity) {
    const mainEmoji = this.getRandomEmoji(emojis);
    const count = this.getIntensityCount(intensity);
    
    let animation = '';
    for (let i = 0; i < count; i++) {
      animation += mainEmoji;
      if (i < count - 1) {
        animation += ' ';
      }
    }
    
    return animation;
  }

  /**
   * Create sparkle animation pattern
   * @param {Array} emojis - Emoji array
   * @param {string} intensity - Animation intensity
   * @returns {string} Sparkle animation
   */
  createSparkleAnimation(emojis, intensity) {
    const mainEmoji = this.getRandomEmoji(emojis);
    const sparkles = ['✨', '🌟', '💫', '⭐'];
    const sparkle = this.getRandomEmoji(sparkles);
    
    return `${sparkle} ${mainEmoji} ${sparkle}`;
  }

  /**
   * Create burst animation pattern
   * @param {Array} emojis - Emoji array
   * @param {string} intensity - Animation intensity
   * @returns {string} Burst animation
   */
  createBurstAnimation(emojis, intensity) {
    const centerEmoji = this.getRandomEmoji(emojis);
    const surroundEmojis = this.selectRandomEmojis(emojis, 4);
    
    return `${surroundEmojis[0]} ${surroundEmojis[1]} ${centerEmoji} ${surroundEmojis[2]} ${surroundEmojis[3]}`;
  }

  /**
   * Create flow animation pattern
   * @param {Array} emojis - Emoji array
   * @param {string} intensity - Animation intensity
   * @returns {string} Flow animation
   */
  createFlowAnimation(emojis, intensity) {
    const count = this.getIntensityCount(intensity);
    const selectedEmojis = this.selectRandomEmojis(emojis, count);
    
    let animation = '';
    for (let i = 0; i < selectedEmojis.length; i++) {
      animation += selectedEmojis[i];
      if (i < selectedEmojis.length - 1) {
        animation += ' → ';
      }
    }
    
    return animation;
  }

  /**
   * Create bounce animation pattern
   * @param {Array} emojis - Emoji array
   * @param {string} intensity - Animation intensity
   * @returns {string} Bounce animation
   */
  createBounceAnimation(emojis, intensity) {
    const mainEmoji = this.getRandomEmoji(emojis);
    const count = this.getIntensityCount(intensity);
    
    let animation = '';
    for (let i = 0; i < count; i++) {
      animation += mainEmoji;
      if (i < count - 1) {
        animation += ' ↗️ ';
      }
    }
    
    return animation;
  }

  /**
   * Get intensity count
   * @param {string} intensity - Intensity level
   * @returns {number} Count based on intensity
   */
  getIntensityCount(intensity) {
    switch (intensity) {
      case 'low':
        return 3;
      case 'medium':
        return 5;
      case 'high':
        return 7;
      case 'extreme':
        return 10;
      default:
        return 5;
    }
  }

  /**
   * Select random emojis from array
   * @param {Array} emojis - Emoji array
   * @param {number} count - Number to select
   * @returns {Array} Selected emojis
   */
  selectRandomEmojis(emojis, count) {
    const selected = [];
    for (let i = 0; i < count; i++) {
      selected.push(this.getRandomEmoji(emojis));
    }
    return selected;
  }

  /**
   * Get random emoji from array
   * @param {Array} emojis - Emoji array
   * @returns {string} Random emoji
   */
  getRandomEmoji(emojis) {
    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  /**
   * Create lesson start reaction
   * @param {number} dayNumber - Day number
   * @returns {string} Lesson start reaction
   */
  lessonStartReaction(dayNumber) {
    const reactions = [
      this.createReaction('lesson_start', 'wave', { intensity: 'medium' }),
      this.createReaction('lesson_start', 'sparkle', { intensity: 'medium' }),
      this.createReaction('lesson_start', 'burst', { intensity: 'medium' })
    ];
    
    return this.getRandomEmoji(reactions);
  }

  /**
   * Create lesson complete reaction
   * @param {number} dayNumber - Day number
   * @returns {string} Lesson complete reaction
   */
  lessonCompleteReaction(dayNumber) {
    const intensity = dayNumber <= 2 ? 'medium' : dayNumber <= 5 ? 'high' : 'extreme';
    
    const reactions = [
      this.createReaction('lesson_complete', 'burst', { intensity }),
      this.createReaction('lesson_complete', 'sparkle', { intensity }),
      this.createReaction('lesson_complete', 'wave', { intensity })
    ];
    
    return this.getRandomEmoji(reactions);
  }

  /**
   * Create achievement unlock reaction
   * @param {string} achievementType - Achievement type
   * @returns {string} Achievement unlock reaction
   */
  achievementUnlockReaction(achievementType) {
    const patterns = ['burst', 'sparkle', 'pulse'];
    const pattern = this.getRandomEmoji(patterns);
    
    return this.createReaction('achievement_unlock', pattern, { intensity: 'high' });
  }

  /**
   * Create streak milestone reaction
   * @param {number} streakCount - Streak count
   * @returns {string} Streak milestone reaction
   */
  streakMilestoneReaction(streakCount) {
    const intensity = streakCount >= 7 ? 'extreme' : streakCount >= 5 ? 'high' : 'medium';
    
    return this.createReaction('streak_milestone', 'flow', { intensity });
  }

  /**
   * Create payment success reaction
   * @returns {string} Payment success reaction
   */
  paymentSuccessReaction() {
    return this.createReaction('payment_success', 'burst', { intensity: 'extreme' });
  }

  /**
   * Create progress update reaction
   * @param {number} percentage - Progress percentage
   * @returns {string} Progress update reaction
   */
  progressUpdateReaction(percentage) {
    const intensity = percentage >= 80 ? 'high' : percentage >= 50 ? 'medium' : 'low';
    
    return this.createReaction('progress_update', 'wave', { intensity });
  }

  /**
   * Create encouragement reaction
   * @returns {string} Encouragement reaction
   */
  encouragementReaction() {
    const patterns = ['pulse', 'wave', 'sparkle'];
    const pattern = this.getRandomEmoji(patterns);
    
    return this.createReaction('encouragement', pattern, { intensity: 'medium' });
  }

  /**
   * Create contextual reaction based on user action
   * @param {string} action - User action
   * @param {Object} context - Action context
   * @returns {string} Contextual reaction
   */
  createContextualReaction(action, context = {}) {
    switch (action) {
      case 'day_start':
        return this.lessonStartReaction(context.dayNumber);
      case 'day_complete':
        return this.lessonCompleteReaction(context.dayNumber);
      case 'achievement_unlock':
        return this.achievementUnlockReaction(context.achievementType);
      case 'streak_milestone':
        return this.streakMilestoneReaction(context.streakCount);
      case 'payment_success':
        return this.paymentSuccessReaction();
      case 'progress_update':
        return this.progressUpdateReaction(context.percentage);
      case 'encouragement':
        return this.encouragementReaction();
      default:
        return this.createReaction('celebration', 'wave');
    }
  }

  /**
   * Create multi-stage reaction sequence
   * @param {Array} stages - Reaction stages
   * @returns {Array} Reaction sequence
   */
  createReactionSequence(stages) {
    return stages.map(stage => {
      return {
        reaction: this.createContextualReaction(stage.action, stage.context),
        delay: stage.delay || 0,
        message: stage.message || ''
      };
    });
  }

  /**
   * Get reaction for specific milestone
   * @param {string} milestone - Milestone type
   * @param {Object} data - Milestone data
   * @returns {string} Milestone reaction
   */
  getMilestoneReaction(milestone, data = {}) {
    const reactionMap = {
      'first_lesson': () => this.createReaction('lesson_start', 'sparkle', { intensity: 'high' }),
      'halfway_point': () => this.createReaction('progress_update', 'wave', { intensity: 'high' }),
      'final_lesson': () => this.createReaction('lesson_complete', 'burst', { intensity: 'extreme' }),
      'program_complete': () => this.createReaction('celebration', 'burst', { intensity: 'extreme' }),
      'payment_confirmed': () => this.createReaction('payment_success', 'sparkle', { intensity: 'extreme' }),
      'vip_upgrade': () => this.createReaction('achievement_unlock', 'burst', { intensity: 'extreme' })
    };

    const reactionFunction = reactionMap[milestone];
    return reactionFunction ? reactionFunction() : this.createReaction('celebration', 'wave');
  }
}

module.exports = new EmojiReactionService();