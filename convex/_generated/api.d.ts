/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as coupons from "../coupons.js";
import type * as crons from "../crons.js";
import type * as dev from "../dev.js";
import type * as dodo from "../dodo.js";
import type * as http from "../http.js";
import type * as keys from "../keys.js";
import type * as lib_crypto from "../lib/crypto.js";
import type * as lib_embeddings from "../lib/embeddings.js";
import type * as maintenance from "../maintenance.js";
import type * as memories from "../memories.js";
import type * as payments from "../payments.js";
import type * as profiles from "../profiles.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  coupons: typeof coupons;
  crons: typeof crons;
  dev: typeof dev;
  dodo: typeof dodo;
  http: typeof http;
  keys: typeof keys;
  "lib/crypto": typeof lib_crypto;
  "lib/embeddings": typeof lib_embeddings;
  maintenance: typeof maintenance;
  memories: typeof memories;
  payments: typeof payments;
  profiles: typeof profiles;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  dodopayments: {
    lib: {
      checkout: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          environment: "test_mode" | "live_mode";
          payload: {
            allowed_payment_method_types?: Array<string>;
            billing_address?: {
              city?: string;
              country: string;
              state?: string;
              street?: string;
              zipcode?: string;
            };
            billing_currency?: string;
            confirm?: boolean;
            customer?:
              | { email: string; name?: string; phone_number?: string }
              | { customer_id: string };
            customization?: {
              force_language?: string;
              show_on_demand_tag?: boolean;
              show_order_details?: boolean;
              theme?: string;
            };
            discount_code?: string;
            feature_flags?: {
              allow_currency_selection?: boolean;
              allow_discount_code?: boolean;
              allow_phone_number_collection?: boolean;
              allow_tax_id?: boolean;
              always_create_new_customer?: boolean;
            };
            force_3ds?: boolean;
            metadata?: Record<string, string>;
            product_cart: Array<{
              addons?: Array<{ addon_id: string; quantity: number }>;
              amount?: number;
              product_id: string;
              quantity: number;
            }>;
            return_url?: string;
            show_saved_payment_methods?: boolean;
            subscription_data?: {
              on_demand?: {
                adaptive_currency_fees_inclusive?: boolean;
                mandate_only: boolean;
                product_currency?: string;
                product_description?: string;
                product_price?: number;
              };
              trial_period_days?: number;
            };
          };
        },
        { checkout_url: string }
      >;
      customerPortal: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          dodoCustomerId: string;
          environment: "test_mode" | "live_mode";
          send_email?: boolean;
        },
        { portal_url: string }
      >;
    };
  };
};
