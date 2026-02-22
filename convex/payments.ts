import { action } from "./_generated/server";
import { v } from "convex/values";
import { checkout, customerPortal } from "./dodo";

// Plan configuration — limits for memories & searches (retrievals)
export const PLANS: Record<string, { memories: number; searches: number; price: number }> = {
  free: { memories: 1000, searches: 1000, price: 0 },
  pro: { memories: 5000, searches: 5000, price: 9 },
  pro_plus: { memories: 10000, searches: 10000, price: 19 },
};

// Map Dodo product IDs → plan names (set in Convex env vars)
export const PRODUCT_TO_PLAN: Record<string, string> = {
  [process.env.DODO_PRO_PRODUCT_ID || ""]: "pro",
  [process.env.DODO_PRO_PLUS_PRODUCT_ID || ""]: "pro_plus",
};

// Create checkout session for a subscription plan
export const createCheckoutSession = action({
  args: {
    productId: v.string(), // Dodo product ID for the plan
    returnUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const session = await checkout(ctx, {
      payload: {
        product_cart: [{ product_id: args.productId, quantity: 1 }],
        return_url: args.returnUrl || "https://echo.peargent.online/dashboard/billing?success=true",
        billing_currency: "USD",
        feature_flags: {
          allow_discount_code: true,
        },
      },
    });

    if (!session?.checkout_url) {
      throw new Error("Failed to create checkout session");
    }

    return { url: session.checkout_url };
  },
});

// Open customer portal for subscription management
export const openCustomerPortal = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const result = await customerPortal(ctx, { send_email: false });
    
    return { url: result.portal_url };
  },
});
