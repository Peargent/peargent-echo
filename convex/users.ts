import { internalQuery, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current authenticated user (for frontend)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

// Get user by auth subject ID (from identity.subject)
export const getUserByAuthId = internalQuery({
  args: { authId: v.string() },
  handler: async (ctx, { authId }) => {
    // The authId from identity.subject might be in format "convex|userId" or just email
    // Try to find by id first, then by email
    const users = await ctx.db.query("users").collect();
    
    for (const user of users) {
      // Check if authId matches the user's ID token
      if (user._id.toString() === authId || 
          authId.includes(user._id.toString()) ||
          user.email === authId) {
        return user;
      }
    }
    
    return null;
  },
});

// Get user by Dodo customer ID
export const getUserByDodoCustomerId = internalQuery({
  args: { dodoCustomerId: v.string() },
  handler: async (ctx, { dodoCustomerId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_dodo_customer", (q) => q.eq("dodoCustomerId", dodoCustomerId))
      .first();
  },
});

// Update user's Dodo customer ID
export const setDodoCustomerId = internalMutation({
  args: { 
    userId: v.id("users"), 
    dodoCustomerId: v.string() 
  },
  handler: async (ctx, { userId, dodoCustomerId }) => {
    await ctx.db.patch(userId, { dodoCustomerId });
  },
});

// Update subscription status
export const updateSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    plan: v.string(),
    subscriptionStatus: v.string(),
    subscriptionId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      plan: args.plan,
      subscriptionStatus: args.subscriptionStatus,
      subscriptionId: args.subscriptionId,
      currentPeriodEnd: args.currentPeriodEnd,
    });
  },
});

// Get user's current plan limits
export const getPlanLimits = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    
    const plan = user.plan || "free";
    
    // Plan limits
    const limits: Record<string, { memories: number; searches: number }> = {
      free: { memories: 1000, searches: 1000 },
      pro: { memories: 5000, searches: 5000 },
      pro_plus: { memories: 10000, searches: 10000 },
    };
    
    const baseLimits = limits[plan as keyof typeof limits] || limits.free;
    const extraMemories = user.extraMemories || 0;
    const extraSearches = user.extraSearches || 0;

    return {
      plan,
      limits: {
        memories: typeof baseLimits.memories === 'number' ? baseLimits.memories + extraMemories : baseLimits.memories,
        searches: typeof baseLimits.searches === 'number' ? baseLimits.searches + extraSearches : baseLimits.searches,
      },
      current: {
        memories: user.memoriesStored || 0,
        searches: user.searchesMade || 0,
      },
    };
  },
});
