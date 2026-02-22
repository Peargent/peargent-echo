import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { createDodoWebhookHandler } from "@dodopayments/convex";
import { internal } from "./_generated/api";
import { PRODUCT_TO_PLAN } from "./payments";

const http = httpRouter();

// Auth routes
auth.addHttpRoutes(http);

/**
 * Resolve plan name from webhook subscription payload.
 * Checks product IDs in the payload against the PRODUCT_TO_PLAN mapping.
 */
function resolvePlanFromPayload(payload: any): string {
  // Try to extract product_id from items/cart in the payload
  const items = payload.data?.items || payload.data?.product_cart || [];
  for (const item of items) {
    const productId = item.product_id || item.productId;
    if (productId && PRODUCT_TO_PLAN[productId]) {
      return PRODUCT_TO_PLAN[productId];
    }
  }

  // Fallback: check top-level product_id
  const topProductId = payload.data?.product_id;
  if (topProductId && PRODUCT_TO_PLAN[topProductId]) {
    return PRODUCT_TO_PLAN[topProductId];
  }

  // Default to "pro" if we can't determine the plan
  return "pro";
}

// Dodo Payments webhook handler
http.route({
  path: "/dodopayments-webhook",
  method: "POST",
  handler: createDodoWebhookHandler({
    // Payment succeeded - link customer ID to user
    onPaymentSucceeded: async (ctx, payload) => {
      console.log("🎉 Payment Succeeded!");
      
      const customerId = payload.data?.customer?.customer_id;
      const email = payload.data?.customer?.email;
      
      if (customerId && email) {
        const user = await ctx.runQuery(internal.users.getUserByAuthId, {
          authId: email,
        });
        
        if (user) {
          await ctx.runMutation(internal.users.setDodoCustomerId, {
            userId: user._id,
            dodoCustomerId: customerId,
          });
        }
      }
    },

    // Subscription became active
    onSubscriptionActive: async (ctx, payload) => {
      console.log("🎉 Subscription Activated!");
      
      const customerId = payload.data?.customer?.customer_id;
      if (!customerId) return;
      
      const user = await ctx.runQuery(internal.users.getUserByDodoCustomerId, {
        dodoCustomerId: customerId,
      });
      
      if (user) {
        const plan = resolvePlanFromPayload(payload);
        await ctx.runMutation(internal.users.updateSubscription, {
          userId: user._id,
          plan,
          subscriptionStatus: "active",
          subscriptionId: payload.data?.subscription_id,
        });
      }
    },

    // Subscription renewed
    onSubscriptionRenewed: async (ctx, payload) => {
      console.log("🔄 Subscription Renewed!");
      
      const customerId = payload.data?.customer?.customer_id;
      if (!customerId) return;
      
      const user = await ctx.runQuery(internal.users.getUserByDodoCustomerId, {
        dodoCustomerId: customerId,
      });
      
      if (user) {
        const plan = resolvePlanFromPayload(payload);
        await ctx.runMutation(internal.users.updateSubscription, {
          userId: user._id,
          plan,
          subscriptionStatus: "active",
        });
      }
    },

    // Subscription cancelled
    onSubscriptionCancelled: async (ctx, payload) => {
      console.log("❌ Subscription Cancelled!");
      
      const customerId = payload.data?.customer?.customer_id;
      if (!customerId) return;
      
      const user = await ctx.runQuery(internal.users.getUserByDodoCustomerId, {
        dodoCustomerId: customerId,
      });
      
      if (user) {
        await ctx.runMutation(internal.users.updateSubscription, {
          userId: user._id,
          plan: "free",
          subscriptionStatus: "cancelled",
        });
      }
    },

    // Subscription on hold (payment failed)
    onSubscriptionOnHold: async (ctx, payload) => {
      console.log("⚠️ Subscription On Hold!");
      
      const customerId = payload.data?.customer?.customer_id;
      if (!customerId) return;
      
      const user = await ctx.runQuery(internal.users.getUserByDodoCustomerId, {
        dodoCustomerId: customerId,
      });
      
      if (user) {
        await ctx.runMutation(internal.users.updateSubscription, {
          userId: user._id,
          plan: user.plan || "free",
          subscriptionStatus: "on_hold",
        });
      }
    },

    // Subscription expired
    onSubscriptionExpired: async (ctx, payload) => {
      console.log("⏰ Subscription Expired!");
      
      const customerId = payload.data?.customer?.customer_id;
      if (!customerId) return;
      
      const user = await ctx.runQuery(internal.users.getUserByDodoCustomerId, {
        dodoCustomerId: customerId,
      });
      
      if (user) {
        await ctx.runMutation(internal.users.updateSubscription, {
          userId: user._id,
          plan: "free",
          subscriptionStatus: "expired",
        });
      }
    },
  }),
});

export default http;
