const { db } = require('../server/storage');
const { progress } = require('../shared/schema');
const { eq } = require('drizzle-orm');

class Progress {
  static async findOne(condition) {
    if (condition.userId) {
      const result = await db.select().from(progress).where(eq(progress.userId, condition.userId));
      return result[0] || null;
    }
    return null;
  }

  static async findOneAndUpdate(condition, updates, options = {}) {
    const { upsert = false } = options;
    
    if (condition.userId) {
      const existing = await this.findOne(condition);
      
      if (existing) {
        // Update existing progress
        const result = await db
          .update(progress)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(progress.userId, condition.userId))
          .returning();
        return result[0];
      } else if (upsert) {
        // Insert new progress
        const result = await db
          .insert(progress)
          .values({ ...condition, ...updates })
          .returning();
        return result[0];
      }
    }
    
    return null;
  }

  static async findAll(options = {}) {
    return await db.select().from(progress);
  }
}

module.exports = Progress;
