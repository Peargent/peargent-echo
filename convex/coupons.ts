import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Redeem a coupon code
// Internal coupon redemption logic (reusable)
export const redeemCouponInternal = internalMutation({
  args: { 
    userId: v.id("users"),
    code: v.string() 
  },
  handler: async (ctx, { userId, code }): Promise<{ success: boolean; memories: number; searches: number; error?: string }> => {
    const user = await ctx.db.get(userId);
    if (!user) return { success: false, memories: 0, searches: 0, error: "User not found" };

    // 1. Find coupon
    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!coupon) {
      return { success: false, memories: 0, searches: 0, error: "Invalid coupon code" };
    }

    // 2. Validate coupon
    if (!coupon.isActive) return { success: false, memories: 0, searches: 0, error: "Coupon is inactive" };
    if (coupon.expiresAt && Date.now() > coupon.expiresAt) return { success: false, memories: 0, searches: 0, error: "Coupon expired" };
    if (coupon.maxUses !== Infinity && coupon.usedCount >= coupon.maxUses) return { success: false, memories: 0, searches: 0, error: "Coupon usage limit reached" };

    // 3. Check if already redeemed
    const redemption = await ctx.db
      .query("couponRedemptions")
      .withIndex("by_user_coupon", (q) => q.eq("userId", user._id).eq("couponId", coupon._id))
      .first();

    if (redemption) {
      return { success: false, memories: 0, searches: 0, error: "You have already redeemed this coupon" };
    }

    // 4. Grant bonus memories and searches
    const currentExtraMemories = (user.extraMemories || 0) as number;
    const currentExtraSearches = (user.extraSearches || 0) as number;

    const newExtraMemories = currentExtraMemories + (coupon.memories || 0);
    const newExtraSearches = currentExtraSearches + (coupon.searches || 0);

    await ctx.db.patch(user._id, {
      extraMemories: newExtraMemories,
      extraSearches: newExtraSearches,
    });

    // 5. Record redemption
    await ctx.db.insert("couponRedemptions", {
      userId: user._id,
      couponId: coupon._id,
      redeemedAt: Date.now(),
    });

    // 6. Update coupon stats
    await ctx.db.patch(coupon._id, {
      usedCount: coupon.usedCount + 1,
    });

    return {
      success: true,
      memories: coupon.memories || 0,
      searches: coupon.searches || 0,
    };
  },
});

// Calculate effective limits (Public)
export const redeemCoupon = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }): Promise<{ success: boolean; memories: number; searches: number; error?: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { success: false, memories: 0, searches: 0, error: "Not authenticated" };
    
    // Find authenticated user using the robust helper
    const user = await ctx.runQuery(internal.users.getUserByAuthId, {
      authId: identity.subject,
    });
    
    if (!user) return { success: false, memories: 0, searches: 0, error: "User not found" };

    // Delegate to internal mutation
    return await ctx.runMutation(internal.coupons.redeemCouponInternal, {
        userId: user._id,
        code,
    });
  },
});

// Admin: Create new coupons
export const createCoupon = internalMutation({
  args: {
    code: v.string(),
    memories: v.number(),
    searches: v.number(),
    maxUses: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (existing) throw new Error("Coupon code already exists");

    const couponId = await ctx.db.insert("coupons", {
      code: args.code,
      memories: args.memories,
      searches: args.searches,
      maxUses: args.maxUses ?? Infinity,
      usedCount: 0,
      expiresAt: args.expiresAt,
      isActive: true,
    });

    return couponId;
  },
});
