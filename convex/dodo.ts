import { DodoPayments, DodoPaymentsClientConfig } from "@dodopayments/convex";
import { components } from "./_generated/api";
import { internal } from "./_generated/api";

// Fallback mock or check for missing key to prevent crash without API key
const apiKey = process.env.DODO_PAYMENTS_API_KEY || "dummy_key_for_dev";

export const dodo = new DodoPayments(components.dodopayments, {
  // Map Convex user to Dodo Payments customer
  identify: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    // Lookup user by email
    const user = await ctx.runQuery(internal.users.getUserByAuthId, {
      authId: identity.subject,
    });
    
    if (!user || !user.dodoCustomerId) {
      return null;
    }
    
    return {
      dodoCustomerId: user.dodoCustomerId,
    };
  },
  apiKey: apiKey,
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode") as "test_mode" | "live_mode",
} as DodoPaymentsClientConfig);

// Export API methods
export const { checkout, customerPortal } = dodo.api();
