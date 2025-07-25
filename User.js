const { db } = require('../server/storage');
const { users } = require('../shared/schema');
const { eq, gte, desc, asc } = require('drizzle-orm');

class User {
  static async findOne(condition) {
    if (condition.telegramId) {
      const result = await db.select().from(users).where(eq(users.telegramId, condition.telegramId));
      return result[0] || null;
    }
    return null;
  }

  static async findOneAndUpdate(condition, updates, options = {}) {
    const { upsert = false } = options;
    
    if (condition.telegramId) {
      try {
        const existing = await this.findOne(condition);
        
        if (existing) {
          // Update existing user - only update if there are valid updates
          const validUpdates = Object.fromEntries(
            Object.entries(updates).filter(([key, value]) => 
              key !== '$inc' && value !== undefined && value !== null
            )
          );
          
          if (Object.keys(validUpdates).length > 0) {
            const result = await db
              .update(users)
              .set({ ...validUpdates, lastActive: new Date() })
              .where(eq(users.telegramId, condition.telegramId))
              .returning();
            return result[0];
          }
          return existing;
        } else if (upsert) {
          // Insert new user
          const result = await db
            .insert(users)
            .values({ ...condition, ...updates, lastActive: new Date() })
            .returning();
          return result[0];
        }
      } catch (error) {
        console.error('Database error in findOneAndUpdate:', error.message);
        return null;
      }
    }
    
    return null;
  }

  static async updateLastActive(telegramId) {
    await db
      .update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.telegramId, telegramId));
  }

  static async findAll(options = {}) {
    let query = db.select().from(users);
    
    // Add where conditions if provided
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (key === 'lastActive' && value.gte) {
          query = query.where(gte(users.lastActive, value.gte));
        }
      });
    }
    
    // Add ordering if provided
    if (options.orderBy) {
      Object.entries(options.orderBy).forEach(([key, direction]) => {
        if (key === 'lastActive') {
          query = query.orderBy(direction === 'desc' ? desc(users.lastActive) : asc(users.lastActive));
        }
      });
    }
    
    return await query;
  }
}

module.exports = User;
