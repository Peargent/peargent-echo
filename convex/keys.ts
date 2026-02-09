import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { generateApiKey, hashApiKey } from "./lib/crypto";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Type for API key validation result
interface ApiKeyValidationResult {
  userId: Id<"users">;
  apiKeyId: Id<"apiKeys">;
  permissions: string[];
  credits: number;
}

/**
 * Create a new API key for the user (internal, used by action)
 */
export const createApiKey = internalMutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    permissions: v.array(v.string()),
    keyHash: v.string(),
    keyPrefix: v.string(),
  },
  handler: async (ctx, args) => {
    // Store the hashed key
    await ctx.db.insert("apiKeys", {
      userId: args.userId,
      name: args.name,
      keyHash: args.keyHash,
      keyPrefix: args.keyPrefix,
      permissions: args.permissions,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Create a new API key (action that can do async hashing)
 */
export const generateAndCreateApiKey = action({
  args: {
    userId: v.id("users"),
    name: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<{ key: string; prefix: string }> => {
    // Generate a new API key
    const rawKey = generateApiKey();
    const keyHash = await hashApiKey(rawKey);
    const keyPrefix = rawKey.substring(0, 12); // "echo_sk_XXXX"

    // Store the hashed key via mutation
    await ctx.runMutation(internal.keys.createApiKey, {
      userId: args.userId,
      name: args.name,
      keyHash,
      keyPrefix,
      permissions: args.permissions,
    });

    // Return the raw key (only time it's visible)
    return { key: rawKey, prefix: keyPrefix };
  },
});

/**
 * List API keys for a user (masked)
 */
export const listApiKeys = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Return keys without the hash
    return keys.map((key) => ({
      _id: key._id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      permissions: key.permissions,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
    }));
  },
});

/**
 * Revoke (delete) an API key
 */
export const revokeApiKey = mutation({
  args: {
    keyId: v.id("apiKeys"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db.get(args.keyId);

    if (!key) {
      throw new Error("API key not found");
    }

    // Verify ownership
    if (key.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.keyId);
    return { success: true };
  },
});

/**
 * Validate an API key and return user info (action - can do async hashing)
 */
export const validateApiKey = action({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args): Promise<ApiKeyValidationResult | null> => {
    const keyHash = await hashApiKey(args.apiKey);

    const result: ApiKeyValidationResult | null = await ctx.runQuery(internal.keys.findApiKeyByHash, {
      keyHash,
    });

    return result;
  },
});

/**
 * Internal query to find API key by hash
 */
export const findApiKeyByHash = internalQuery({
  args: {
    keyHash: v.string(),
  },
  handler: async (ctx, args): Promise<ApiKeyValidationResult | null> => {
    const apiKeyRecord = await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", args.keyHash))
      .first();

    if (!apiKeyRecord) {
      return null;
    }

    const user = await ctx.db.get(apiKeyRecord.userId);
    if (!user) {
      return null;
    }

    return {
      userId: user._id,
      apiKeyId: apiKeyRecord._id,
      permissions: apiKeyRecord.permissions,
      credits: user.credits ?? 0,
    };
  },
});

/**
 * Update last used timestamp for an API key
 */
export const updateApiKeyLastUsed = mutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.keyId, {
      lastUsedAt: Date.now(),
    });
  },
});
