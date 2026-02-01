import { internalMutation } from "./_generated/server";

const DECAY_RATE = 0.99; // 1% decay per day
const MIN_DECAY_THRESHOLD = 0.1; // Below this, memory can be deleted
const MIN_IMPORTANCE_FOR_KEEP = 0.5; // Keep important memories even if decayed

/**
 * Apply decay to all memories (run daily)
 */
export const applyMemoryDecay = internalMutation({
  handler: async (ctx) => {
    const memories = await ctx.db.query("memories").collect();

    let updated = 0;
    for (const memory of memories) {
      const newDecay = memory.decay * DECAY_RATE;

      // Boost decay if memory was recently accessed
      const hoursSinceAccess = memory.accessCount > 0 ? 0 : 24;
      const accessBoost = Math.min(1, memory.accessCount * 0.01);
      const adjustedDecay = Math.min(1, newDecay + accessBoost);

      await ctx.db.patch(memory._id, {
        decay: adjustedDecay,
        // Reset access count after considering it
        accessCount: 0,
      });
      updated++;
    }

    console.log(`Applied decay to ${updated} memories`);
  },
});

/**
 * Cleanup old, low-value memories (run weekly)
 */
export const cleanupOldMemories = internalMutation({
  handler: async (ctx) => {
    const memories = await ctx.db.query("memories").collect();

    let deleted = 0;
    for (const memory of memories) {
      // Delete if decay is very low AND importance is low
      if (
        memory.decay < MIN_DECAY_THRESHOLD &&
        memory.importance < MIN_IMPORTANCE_FOR_KEEP
      ) {
        // Delete related relationships first
        const fromRelations = await ctx.db
          .query("relationships")
          .withIndex("by_from", (q) => q.eq("fromMemoryId", memory._id))
          .collect();

        const toRelations = await ctx.db
          .query("relationships")
          .withIndex("by_to", (q) => q.eq("toMemoryId", memory._id))
          .collect();

        for (const rel of [...fromRelations, ...toRelations]) {
          await ctx.db.delete(rel._id);
        }

        await ctx.db.delete(memory._id);
        deleted++;
      }
    }

    console.log(`Cleaned up ${deleted} old memories`);
  },
});

/**
 * Cleanup expired sessions (run daily)
 */
export const cleanupExpiredSessions = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const sessions = await ctx.db.query("sessions").collect();

    let deleted = 0;
    for (const session of sessions) {
      if (session.expiresAt < now) {
        await ctx.db.delete(session._id);
        deleted++;
      }
    }

    console.log(`Cleaned up ${deleted} expired sessions`);
  },
});
