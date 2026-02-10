import { mutation } from "./_generated/server";
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

export const createCoupon = mutation({
  args: {
    code: v.string(),
    memories: v.number(),
    searches: v.number(),
    maxUses: v.number(),
  },
  handler: async (ctx, args): Promise<string> => {
    return await ctx.runMutation(internal.coupons.createCoupon, {
      code: args.code,
      memories: args.memories,
      searches: args.searches,
      maxUses: args.maxUses,
    });
  },
});


