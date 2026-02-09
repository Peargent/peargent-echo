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
import type * as credits from "../credits.js";
import type * as crons from "../crons.js";
import type * as dev from "../dev.js";
import type * as http from "../http.js";
import type * as keys from "../keys.js";
import type * as lib_crypto from "../lib/crypto.js";
import type * as lib_embeddings from "../lib/embeddings.js";
import type * as maintenance from "../maintenance.js";
import type * as memories from "../memories.js";
import type * as profiles from "../profiles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  credits: typeof credits;
  crons: typeof crons;
  dev: typeof dev;
  http: typeof http;
  keys: typeof keys;
  "lib/crypto": typeof lib_crypto;
  "lib/embeddings": typeof lib_embeddings;
  maintenance: typeof maintenance;
  memories: typeof memories;
  profiles: typeof profiles;
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

export declare const components: {};
