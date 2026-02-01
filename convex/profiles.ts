import { action, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { extractProfileUpdate, generateEmbedding } from "./lib/embeddings";
import { Doc, Id } from "./_generated/dataModel";

// Type for profile response
interface ProfileResponse {
  staticFacts: string[];
  dynamicContext: string[];
  updatedAt: number;
}

// Type for full profile with search
interface ProfileWithSearch {
  profile: ProfileResponse;
  searchResults: Array<{
    _id: Id<"memories">;
    content: string;
    entities: Array<{ name: string; type: string }>;
    facts: string[];
    importance: number;
    score: number;
    createdAt: number;
  }>;
}

/**
 * Get or create user profile
 */
export const getProfile = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<ProfileResponse> => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      return {
        staticFacts: [],
        dynamicContext: [],
        updatedAt: Date.now(),
      };
    }

    return {
      staticFacts: profile.staticFacts,
      dynamicContext: profile.dynamicContext,
      updatedAt: profile.updatedAt,
    };
  },
});

/**
 * Internal: get profile for use in actions
 */
export const getProfileInternal = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<Doc<"profiles"> | null> => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Internal: upsert profile
 */
export const upsertProfile = internalMutation({
  args: {
    userId: v.id("users"),
    staticFacts: v.array(v.string()),
    dynamicContext: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<void> => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        staticFacts: args.staticFacts,
        dynamicContext: args.dynamicContext,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("profiles", {
        userId: args.userId,
        staticFacts: args.staticFacts,
        dynamicContext: args.dynamicContext,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Update profile from new memory content
 */
export const updateProfileFromMemory = action({
  args: {
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args): Promise<{ updated: boolean; newFacts: string[]; newContext: string[] }> => {
    // Get existing profile
    const existing = await ctx.runQuery(internal.profiles.getProfileInternal, {
      userId: args.userId,
    });

    const existingStatic = existing?.staticFacts || [];
    const existingDynamic = existing?.dynamicContext || [];

    // Extract profile updates from content
    const updates = await extractProfileUpdate(
      args.content,
      existingStatic,
      existingDynamic
    );

    if (updates.staticFacts.length === 0 && updates.dynamicContext.length === 0) {
      return { updated: false, newFacts: [], newContext: [] };
    }

    // Merge and deduplicate
    const newStatic = [...new Set([...existingStatic, ...updates.staticFacts])];
    
    // For dynamic context, keep last 20 items and add new ones
    const newDynamic = [...existingDynamic, ...updates.dynamicContext].slice(-20);

    // Update profile
    await ctx.runMutation(internal.profiles.upsertProfile, {
      userId: args.userId,
      staticFacts: newStatic,
      dynamicContext: newDynamic,
    });

    return {
      updated: true,
      newFacts: updates.staticFacts,
      newContext: updates.dynamicContext,
    };
  },
});

/**
 * Combined profile + search action (like Supermemory's profile endpoint)
 */
export const profile = action({
  args: {
    userId: v.id("users"),
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<ProfileWithSearch> => {
    // Get profile
    const existingProfile = await ctx.runQuery(internal.profiles.getProfileInternal, {
      userId: args.userId,
    });

    const profileResponse: ProfileResponse = {
      staticFacts: existingProfile?.staticFacts || [],
      dynamicContext: existingProfile?.dynamicContext || [],
      updatedAt: existingProfile?.updatedAt || Date.now(),
    };

    // If query provided, search memories
    let searchResults: ProfileWithSearch["searchResults"] = [];

    if (args.query) {
      const queryEmbedding = await generateEmbedding(args.query);
      const limit = args.limit || 5;

      const results = await ctx.vectorSearch("memories", "by_embedding", {
        vector: queryEmbedding,
        limit: limit,
        filter: (q) => q.eq("userId", args.userId),
      });

      // Get full memory documents
      searchResults = await Promise.all(
        results.map(async (result) => {
          const memory: Doc<"memories"> | null = await ctx.runQuery(
            internal.memories.getMemoryById,
            { memoryId: result._id }
          );
          
          if (!memory) return null;

          return {
            _id: memory._id,
            content: memory.content,
            entities: memory.entities,
            facts: memory.facts,
            importance: memory.importance,
            score: result._score,
            createdAt: memory.createdAt,
          };
        })
      ).then(results => results.filter((r): r is NonNullable<typeof r> => r !== null));
    }

    return {
      profile: profileResponse,
      searchResults,
    };
  },
});

/**
 * Clear dynamic context (useful for resetting session state)
 */
export const clearDynamicContext = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const existing = await ctx.runQuery(internal.profiles.getProfileInternal, {
      userId: args.userId,
    });

    if (!existing) {
      return { success: true };
    }

    await ctx.runMutation(internal.profiles.upsertProfile, {
      userId: args.userId,
      staticFacts: existing.staticFacts,
      dynamicContext: [],
    });

    return { success: true };
  },
});
