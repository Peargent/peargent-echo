import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Dev utility to add credits to a user by email
 */
export const addCredits = mutation({
  args: {
    email: v.string(),
    amount: v.number(),
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
        credits: (user.credits ?? 0) + args.amount,
      });
      updatedCount++;
    }

    return { success: true, updatedCount, newBalance: (users[0].credits ?? 0) + args.amount };
  },
});
