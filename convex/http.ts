import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { createDodoWebhookHandler } from "@dodopayments/convex";
import { internal } from "./_generated/api";

const http = httpRouter();

// Auth routes
auth.addHttpRoutes(http);

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
        await ctx.runMutation(internal.users.updateSubscription, {
          userId: user._id,
          plan: "pro",
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
        await ctx.runMutation(internal.users.updateSubscription, {
          userId: user._id,
          plan: "pro",
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
