import { mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Dev utility to add credits to a user by email
 */
export const addBonus = mutation({
  args: {
    email: v.string(),
    memories: v.number(),
    searches: v.number(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .collect();

    if (users.length === 0) {
      throw new Error("User not found");
    }

    let updatedCount = 0;
    for (const user of users) {
      await ctx.db.patch(user._id, {
        extraMemories: (user.extraMemories ?? 0) + args.memories,
        extraSearches: (user.extraSearches ?? 0) + args.searches,
      });
      updatedCount++;
    }

    return { 
        success: true, 
        updatedCount, 
        newExtraMemories: (users[0].extraMemories ?? 0) + args.memories,
        newExtraSearches: (users[0].extraSearches ?? 0) + args.searches
    };
  },
});

export const redeemCoupon = mutation({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; memories: number; searches: number }> => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.runMutation(internal.coupons.redeemCouponInternal, {
        userId: user._id,
        code: args.code,
    });
  },
});

export const migrateUsageLogsBatch = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("usageLogs")
      .paginate({ cursor: args.cursor ?? null, numItems: args.limit });

    let updated = 0;
    for (const log of results.page) {
      const { creditsUsed, ...rest } = log as any;
      if (creditsUsed !== undefined) {
        await ctx.db.replace(log._id, rest);
        updated++;
      }
    }

    return {
      updated,
      continueCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
});

export const migrateUsageLogs = action({
  args: {},
  handler: async (ctx) => {
    let cursor: string | null = null; // Start with null cursor
    let isDone = false;
    let totalUpdated = 0;

    console.log("Starting migration...");

    while (!isDone) {
      const result: any = await ctx.runMutation(internal.dev.migrateUsageLogsBatch, {
        cursor: cursor ?? undefined, // Pass undefined if null
        limit: 100,
      });

      totalUpdated += result.updated;
      cursor = result.continueCursor;
      isDone = result.isDone;
      
      console.log(`Processed batch. Updated: ${result.updated}. Total: ${totalUpdated}`);
    }

    return `Migration complete. Fixed ${totalUpdated} usage logs.`;
  },
});


