import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Credit costs per operation
export const CREDIT_COSTS = {
  add: 1,
  search: 1,
  update: 1,
  delete: 0,
  get: 0,
  list: 0,
} as const;

/**
 * Check if user has enough credits (internal version)
 */
export const checkCreditsInternal = internalQuery({
  args: {
    userId: v.id("users"),
    operation: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const cost = CREDIT_COSTS[args.operation as keyof typeof CREDIT_COSTS] || 0;
    const userCredits = user.credits ?? 0;
    return {
      hasEnough: userCredits >= cost,
      required: cost,
      available: userCredits,
    };
  },
});

/**
 * Deduct credits after an operation (internal version)
 */
export const deductCreditsInternal = internalMutation({
  args: {
    userId: v.id("users"),
    operation: v.string(),
    apiKeyId: v.optional(v.id("apiKeys")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const cost = CREDIT_COSTS[args.operation as keyof typeof CREDIT_COSTS] || 0;

    const userCredits = user.credits ?? 0;
    if (userCredits < cost) {
      throw new Error("Insufficient credits");
    }

    // Deduct credits
    await ctx.db.patch(args.userId, {
      credits: userCredits - cost,
    });

    // Log usage
    await ctx.db.insert("usageLogs", {
      userId: args.userId,
      apiKeyId: args.apiKeyId,
      operation: args.operation,
      creditsUsed: cost,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    return { creditsRemaining: userCredits - cost };
  },
});
