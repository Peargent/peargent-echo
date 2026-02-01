import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { 
  generateEmbedding, 
  extractMemoryInfo, 
  classifyMemory,
  findMemoryRelationships 
} from "./lib/embeddings";
import { Doc, Id } from "./_generated/dataModel";

const SIMILARITY_THRESHOLD = 0.92; // For duplicate detection

// Type for memory with score
interface MemoryWithScore extends Doc<"memories"> {
  _score: number;
}

// Type for ranked memory
interface RankedMemory extends MemoryWithScore {
  finalScore: number;
}

// Type for add memory result
interface AddMemoryResult {
  id?: Id<"memories">;
  action: "created" | "merged" | "filtered" | "error";
  message: string;
  filterReason?: string;
  profileUpdated?: boolean;
}

/**
 * Add a new memory (Action - can call external APIs)
 */
export const addMemory = action({
  args: {
    userId: v.id("users"),
    content: v.string(),
    agentId: v.optional(v.string()),
    runId: v.optional(v.string()),
    source: v.optional(v.string()),
    metadata: v.optional(v.any()),
    extract: v.optional(v.boolean()), // Whether to extract entities/facts
    filter: v.optional(v.boolean()),  // Whether to use smart filtering
    updateProfile: v.optional(v.boolean()), // Whether to update user profile
  },
  handler: async (ctx, args): Promise<AddMemoryResult> => {
    // Check credits first
    const creditCheck = await ctx.runQuery(internal.credits.checkCreditsInternal, {
      userId: args.userId,
      operation: "add",
    });

    if (!creditCheck.hasEnough) {
      throw new Error(`Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}`);
    }

    // Smart filtering (if enabled)
    if (args.filter !== false) {
      const classification = await classifyMemory(args.content);
      
      if (!classification.shouldStore) {
        return {
          action: "filtered",
          message: `Memory not stored: ${classification.category}`,
          filterReason: classification.reason,
        };
      }
    }

    // Generate embedding
    const embedding = await generateEmbedding(args.content);

    // Extract entities and facts if requested
    let entities: Array<{ name: string; type: string }> = [];
    let facts: string[] = [];
    let importance = 0.5;

    if (args.extract !== false) {
      try {
        const extracted = await extractMemoryInfo(args.content);
        entities = extracted.entities;
        facts = extracted.facts;
        importance = extracted.importance;
      } catch (error) {
        console.error("Failed to extract memory info:", error);
      }
    }

    // Check for similar memories (potential duplicates)
    const similar: Doc<"memories"> | null = await ctx.runQuery(internal.memories.findSimilarInternal, {
      userId: args.userId,
      embedding,
      threshold: SIMILARITY_THRESHOLD,
      agentId: args.agentId,
    });

    let memoryId: Id<"memories">;
    let actionType: "created" | "merged" = "created";

    if (similar) {
      // Update existing memory instead of creating duplicate
      await ctx.runMutation(internal.memories.mergeMemory, {
        memoryId: similar._id,
        newContent: args.content,
        newFacts: facts,
        newEntities: entities,
      });
      memoryId = similar._id;
      actionType = "merged";
    } else {
      // Create new memory
      memoryId = await ctx.runMutation(internal.memories.insertMemory, {
        userId: args.userId,
        content: args.content,
        embedding,
        entities,
        facts,
        importance,
        agentId: args.agentId,
        runId: args.runId,
        source: args.source,
        metadata: args.metadata,
      });

      // Find and create relationships with existing memories
      const recentMemories = await ctx.runQuery(internal.memories.getRecentMemories, {
        userId: args.userId,
        limit: 10,
        excludeId: memoryId,
      });

      if (recentMemories.length > 0) {
        const relationships = await findMemoryRelationships(
          args.content,
          recentMemories.map(m => ({ id: m._id, content: m.content }))
        );

        for (const rel of relationships) {
          await ctx.runMutation(internal.memories.createRelationship, {
            userId: args.userId,
            fromMemoryId: memoryId,
            toMemoryId: rel.memoryId as Id<"memories">,
            type: rel.type,
            strength: rel.strength,
          });
        }
      }
    }

    // Update user profile if requested
    let profileUpdated = false;
    if (args.updateProfile !== false) {
      try {
        // Get existing profile
        const existing = await ctx.runQuery(internal.profiles.getProfileInternal, {
          userId: args.userId,
        });

        const existingStatic = existing?.staticFacts || [];
        const existingDynamic = existing?.dynamicContext || [];

        // Extract profile updates from content (using the embeddings function)
        const { extractProfileUpdate } = await import("./lib/embeddings");
        const updates = await extractProfileUpdate(
          args.content,
          existingStatic,
          existingDynamic
        );

        if (updates.staticFacts.length > 0 || updates.dynamicContext.length > 0) {
          // Merge and deduplicate
          const newStatic = [...new Set([...existingStatic, ...updates.staticFacts])];
          const newDynamic = [...existingDynamic, ...updates.dynamicContext].slice(-20);

          // Update profile
          await ctx.runMutation(internal.profiles.upsertProfile, {
            userId: args.userId,
            staticFacts: newStatic,
            dynamicContext: newDynamic,
          });
          profileUpdated = true;
        }
      } catch (error) {
        console.error("Failed to update profile:", error);
      }
    }

    // Deduct credits
    await ctx.runMutation(internal.credits.deductCreditsInternal, {
      userId: args.userId,
      operation: "add",
    });

    return { 
      id: memoryId, 
      action: actionType,
      message: actionType === "merged" 
        ? "Memory merged with existing similar memory" 
        : "Memory created successfully",
      profileUpdated,
    };
  },
});

// Return type for search results
interface SearchResult {
  _id: Id<"memories">;
  content: string;
  entities: Array<{ name: string; type: string }>;
  facts: string[];
  importance: number;
  score: number;
  agentId?: string;
  runId?: string;
  source?: string;
  metadata?: unknown;
  createdAt: number;
  updatedAt: number;
  relatedMemories?: Array<{
    _id: Id<"memories">;
    content: string;
    relationshipType: string;
    strength: number;
  }>;
}

/**
 * Search memories semantically
 */
export const searchMemories = action({
  args: {
    userId: v.id("users"),
    query: v.string(),
    limit: v.optional(v.number()),
    agentId: v.optional(v.string()),
    runId: v.optional(v.string()),
    includeGraph: v.optional(v.boolean()), // Whether to include related memories
  },
  handler: async (ctx, args): Promise<SearchResult[]> => {
    // Check credits
    const creditCheck = await ctx.runQuery(internal.credits.checkCreditsInternal, {
      userId: args.userId,
      operation: "search",
    });

    if (!creditCheck.hasEnough) {
      throw new Error(`Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}`);
    }

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(args.query);

    // Vector search
    const limit = args.limit || 10;
    
    const results = await ctx.vectorSearch("memories", "by_embedding", {
      vector: queryEmbedding,
      limit: Math.min(limit * 2, 50),
      filter: (q) => q.eq("userId", args.userId),
    });

    // Get full memory documents
    const memories: (MemoryWithScore | null)[] = await Promise.all(
      results.map(async (result): Promise<MemoryWithScore | null> => {
        const memory: Doc<"memories"> | null = await ctx.runQuery(internal.memories.getMemoryById, {
          memoryId: result._id,
        });
        return memory ? { ...memory, _score: result._score } : null;
      })
    );

    // Filter nulls and apply custom ranking
    const rankedMemories: RankedMemory[] = memories
      .filter((m): m is MemoryWithScore => m !== null)
      .map((memory: MemoryWithScore): RankedMemory => {
        const vectorScore = memory._score;
        const recencyScore = calculateRecencyScore(memory.createdAt);
        const importanceScore = memory.importance;
        const decayScore = memory.decay;

        const finalScore =
          vectorScore * 0.6 +
          recencyScore * 0.15 +
          importanceScore * 0.15 +
          decayScore * 0.1;

        return { ...memory, finalScore };
      })
      .sort((a: RankedMemory, b: RankedMemory) => b.finalScore - a.finalScore)
      .slice(0, limit);

    // Update access count
    for (const memory of rankedMemories) {
      await ctx.runMutation(internal.memories.incrementAccessCount, {
        memoryId: memory._id,
      });
    }

    // Deduct credits
    await ctx.runMutation(internal.credits.deductCreditsInternal, {
      userId: args.userId,
      operation: "search",
    });

    // Build results with optional graph connections
    const searchResults: SearchResult[] = await Promise.all(
      rankedMemories.map(async (m: RankedMemory): Promise<SearchResult> => {
        let relatedMemories: SearchResult["relatedMemories"] = undefined;

        if (args.includeGraph) {
          const relationships = await ctx.runQuery(internal.memories.getRelationships, {
            memoryId: m._id,
          });

          relatedMemories = await Promise.all(
            relationships.map(async (rel) => {
              const relatedId = rel.fromMemoryId === m._id ? rel.toMemoryId : rel.fromMemoryId;
              const relatedMemory = await ctx.runQuery(internal.memories.getMemoryById, {
                memoryId: relatedId,
              });
              return relatedMemory ? {
                _id: relatedMemory._id,
                content: relatedMemory.content,
                relationshipType: rel.type,
                strength: rel.strength,
              } : null;
            })
          ).then(results => results.filter((r): r is NonNullable<typeof r> => r !== null));
        }

        return {
          _id: m._id,
          content: m.content,
          entities: m.entities,
          facts: m.facts,
          importance: m.importance,
          score: m.finalScore,
          agentId: m.agentId,
          runId: m.runId,
          source: m.source,
          metadata: m.metadata,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          relatedMemories,
        };
      })
    );

    return searchResults;
  },
});

/**
 * Get a single memory by ID
 */
export const getMemory = query({
  args: {
    memoryId: v.id("memories"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.memoryId);

    if (!memory || memory.userId !== args.userId) {
      return null;
    }

    const { embedding, ...rest } = memory;
    return rest;
  },
});

/**
 * List memories with pagination
 */
export const listMemories = query({
  args: {
    userId: v.id("users"),
    agentId: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const memoryQuery = ctx.db
      .query("memories")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc");

    const memories = await memoryQuery.take(limit + 1);

    const hasMore = memories.length > limit;
    const items = memories.slice(0, limit).map((m) => {
      const { embedding, ...rest } = m;
      return rest;
    });

    return {
      items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]._id : null,
    };
  },
});

/**
 * Update a memory
 */
export const updateMemory = mutation({
  args: {
    memoryId: v.id("memories"),
    userId: v.id("users"),
    content: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.memoryId);

    if (!memory || memory.userId !== args.userId) {
      throw new Error("Memory not found");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.content !== undefined) {
      updates.content = args.content;
    }
    if (args.metadata !== undefined) {
      updates.metadata = args.metadata;
    }

    await ctx.db.patch(args.memoryId, updates);
    return { success: true };
  },
});

/**
 * Delete a memory
 */
export const deleteMemory = mutation({
  args: {
    memoryId: v.id("memories"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.memoryId);

    if (!memory || memory.userId !== args.userId) {
      throw new Error("Memory not found");
    }

    // Delete related relationships
    const fromRelations = await ctx.db
      .query("relationships")
      .withIndex("by_from", (q) => q.eq("fromMemoryId", args.memoryId))
      .collect();

    const toRelations = await ctx.db
      .query("relationships")
      .withIndex("by_to", (q) => q.eq("toMemoryId", args.memoryId))
      .collect();

    for (const rel of [...fromRelations, ...toRelations]) {
      await ctx.db.delete(rel._id);
    }

    await ctx.db.delete(args.memoryId);
    return { success: true };
  },
});

// ============================================
// Internal functions
// ============================================

export const insertMemory = internalMutation({
  args: {
    userId: v.id("users"),
    content: v.string(),
    embedding: v.array(v.float64()),
    entities: v.array(v.object({ name: v.string(), type: v.string() })),
    facts: v.array(v.string()),
    importance: v.number(),
    agentId: v.optional(v.string()),
    runId: v.optional(v.string()),
    source: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<Id<"memories">> => {
    return await ctx.db.insert("memories", {
      userId: args.userId,
      content: args.content,
      embedding: args.embedding,
      entities: args.entities,
      facts: args.facts,
      importance: args.importance,
      decay: 1.0,
      accessCount: 0,
      agentId: args.agentId,
      runId: args.runId,
      source: args.source,
      metadata: args.metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const findSimilarInternal = internalQuery({
  args: {
    userId: v.id("users"),
    embedding: v.array(v.float64()),
    threshold: v.number(),
    agentId: v.optional(v.string()),
  },
  handler: async (_ctx, _args): Promise<Doc<"memories"> | null> => {
    // Simplified - in production use vectorSearch
    return null;
  },
});

export const getMemoryById = internalQuery({
  args: {
    memoryId: v.id("memories"),
  },
  handler: async (ctx, args): Promise<Doc<"memories"> | null> => {
    return await ctx.db.get(args.memoryId);
  },
});

export const getRecentMemories = internalQuery({
  args: {
    userId: v.id("users"),
    limit: v.number(),
    excludeId: v.optional(v.id("memories")),
  },
  handler: async (ctx, args): Promise<Doc<"memories">[]> => {
    const memories = await ctx.db
      .query("memories")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit + 1);

    return memories.filter(m => m._id !== args.excludeId).slice(0, args.limit);
  },
});

export const mergeMemory = internalMutation({
  args: {
    memoryId: v.id("memories"),
    newContent: v.string(),
    newFacts: v.array(v.string()),
    newEntities: v.array(v.object({ name: v.string(), type: v.string() })),
  },
  handler: async (ctx, args): Promise<void> => {
    const memory = await ctx.db.get(args.memoryId);
    if (!memory) return;

    const allFacts = [...new Set([...memory.facts, ...args.newFacts])];
    const entityMap = new Map(memory.entities.map((e) => [e.name, e]));
    for (const entity of args.newEntities) {
      entityMap.set(entity.name, entity);
    }

    await ctx.db.patch(args.memoryId, {
      content: `${memory.content}\n\n${args.newContent}`,
      facts: allFacts,
      entities: Array.from(entityMap.values()),
      updatedAt: Date.now(),
    });
  },
});

export const incrementAccessCount = internalMutation({
  args: {
    memoryId: v.id("memories"),
  },
  handler: async (ctx, args): Promise<void> => {
    const memory = await ctx.db.get(args.memoryId);
    if (memory) {
      await ctx.db.patch(args.memoryId, {
        accessCount: memory.accessCount + 1,
      });
    }
  },
});

export const createRelationship = internalMutation({
  args: {
    userId: v.id("users"),
    fromMemoryId: v.id("memories"),
    toMemoryId: v.id("memories"),
    type: v.string(),
    strength: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.insert("relationships", {
      userId: args.userId,
      fromMemoryId: args.fromMemoryId,
      toMemoryId: args.toMemoryId,
      type: args.type,
      strength: args.strength,
      createdAt: Date.now(),
    });
  },
});

export const getRelationships = internalQuery({
  args: {
    memoryId: v.id("memories"),
  },
  handler: async (ctx, args): Promise<Doc<"relationships">[]> => {
    const fromRels = await ctx.db
      .query("relationships")
      .withIndex("by_from", (q) => q.eq("fromMemoryId", args.memoryId))
      .collect();

    const toRels = await ctx.db
      .query("relationships")
      .withIndex("by_to", (q) => q.eq("toMemoryId", args.memoryId))
      .collect();

    return [...fromRels, ...toRels];
  },
});

// ============================================
// Helper functions
// ============================================

function calculateRecencyScore(createdAt: number): number {
  const now = Date.now();
  const ageMs = now - createdAt;
  const ageHours = ageMs / (1000 * 60 * 60);
  return Math.exp(-ageHours / 24);
}
