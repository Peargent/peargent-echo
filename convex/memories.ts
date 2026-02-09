import { action, mutation, query, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { 
  generateEmbedding, 
  extractMemoryInfo, 
  classifyMemory,
  findMemoryRelationships,
  analyzeMemoryIntegration
} from "./lib/embeddings";
import { Doc, Id } from "./_generated/dataModel";

const SIMILARITY_THRESHOLD = 0.65; // For duplicate/update detection

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
  action: "created" | "merged" | "filtered" | "error" | "updated" | "ignored";
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
    const MEMORY_LIMIT = 1000;

    // Check memory limit
    const canAdd = await ctx.runQuery(internal.memories.checkMemoryLimit, {
      userId: args.userId,
      limit: MEMORY_LIMIT,
    });

    if (!canAdd) {
      throw new Error(`Memory limit reached (${MEMORY_LIMIT}). Please upgrade to add more memories.`);
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

    // Generate embedding first to find similar
    const embedding = await generateEmbedding(args.content);

    // Check for similar memories (potential duplicates/updates)
    // We check this BEFORE extraction to save tokens if we Ignore/Update
    // Check for similar memories (potential duplicates/updates)
    // We check this BEFORE extraction to save tokens if we Ignore/Update
    // Vector search on EMBEDDINGS table
    const results = await ctx.vectorSearch("embeddings", "by_embedding", {
      vector: embedding,
      limit: 1,
      filter: (q) => q.eq("userId", args.userId),
    });

    let similar: Doc<"memories"> | null = null;
    if (results.length > 0 && results[0]._score >= SIMILARITY_THRESHOLD) {
       // Get the embedding doc to find the reference
       // We need to fetch the memory doc. Since we are in an action, we use the helper query.
       const memories = await ctx.runQuery(internal.memories.getMemoriesFromEmbeddingIds, {
          embeddingIds: [results[0]._id],
          scores: [results[0]._score]
       });
       if (memories.length > 0) {
           similar = memories[0];
       }
    }

    let memoryId: Id<"memories"> | undefined;
    let actionType: "created" | "merged" | "updated" | "ignored" = "created";
    let finalReason: string = "";

    // If we have a similar memory, use LLM to decide what to do
    if (similar) {
       const decision = await analyzeMemoryIntegration(args.content, similar.content);
       
       if (decision.action === "ignore") {
          return {
             action: "filtered",
             message: "Memory ignored: Duplicate or redundant information.",
             filterReason: "Redundant with existing memory: " + similar._id,
          };
       } else if (decision.action === "update" || decision.action === "merge") {
          // Update the existing memory with refined content
          const newContent = decision.refinedContent || args.content; // Fallback
          
          await ctx.runMutation(internal.memories.updateMemoryContent, {
             memoryId: similar._id,
             newContent: newContent,
             newEmbedding: decision.action === "update" ? await generateEmbedding(newContent) : undefined // Re-embed if content changed significantly
          });
          
          memoryId = similar._id;
          actionType = decision.action === "update" ? "updated" : "merged";
          finalReason = decision.reason;
       } 
       // If decision is "add", we fall through to creation
    }

    // Creating new memory (if not handled above)
    if (!memoryId) {
        // Extract entities and facts IF we are creating new
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

      // Increment memory count usage
      await ctx.runMutation(internal.memories.incrementMemoryCount, {
        userId: args.userId,
      });

      // Find relationships
       const recentMemories = await ctx.runQuery(internal.memories.getRecentMemories, {
        userId: args.userId,
        limit: 10,
        excludeId: memoryId,
      });

      if (recentMemories.length > 0) {
        const relationships = await findMemoryRelationships(
          args.content,
          recentMemories.map((m: Doc<"memories">) => ({ id: m._id, content: m.content }))
        );

        for (const rel of relationships) {
          await ctx.runMutation(internal.memories.createRelationship, {
            userId: args.userId,
            fromMemoryId: memoryId!,
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

    // Log usage with estimated tokens (approx 4 chars per token for input + output)
    const estimatedTokens = Math.ceil(args.content.length / 4);
    
    await ctx.runMutation(internal.memories.logMemoryUsage, {
      userId: args.userId,
      operation: "add",
      metadata: { action: actionType, memoryId },
      tokens: estimatedTokens,
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
    // Check search limit
    const SEARCH_LIMIT = 1000;
    const canSearch = await ctx.runQuery(internal.memories.checkSearchLimit, {
      userId: args.userId,
      limit: SEARCH_LIMIT,
    });

    if (!canSearch) {
      throw new Error(`Search limit reached (${SEARCH_LIMIT}). Please upgrade to search more.`);
    }



    // Generate query embedding
    const queryEmbedding = await generateEmbedding(args.query);

    // Vector search
    const limit = args.limit || 10;
    
    // Vector search on EMBEDDINGS table
    const results = await ctx.vectorSearch("embeddings", "by_embedding", {
      vector: queryEmbedding,
      limit: Math.min(limit * 2, 50),
      filter: (q) => q.eq("userId", args.userId),
    });

    // Get full memory documents using memoryId from embeddings
    // We cannot use ctx.db in an action, so we use a helper query
    const resultsWithScore = results.map(r => ({ id: r._id, score: r._score }));
    
    const memories: (MemoryWithScore | null)[] = await ctx.runQuery(internal.memories.getMemoriesFromEmbeddingIds, {
      embeddingIds: results.map(r => r._id),
      scores: results.map(r => r._score),
    });

    // Minimum relevance score - only return memories above this threshold
    const MIN_SEARCH_SCORE = 0.5;

    // Filter nulls and apply minimum score threshold
    const rankedMemories: RankedMemory[] = memories
      .filter((m): m is MemoryWithScore => m !== null)
      .filter((m: MemoryWithScore) => m._score >= MIN_SEARCH_SCORE)
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

    // Log search usage
    const estimatedTokens = Math.ceil(args.query.length / 4);
    
    await ctx.runMutation(internal.memories.logMemoryUsage, {
      userId: args.userId,
      operation: "search",
      metadata: { queryLength: args.query.length },
      tokens: estimatedTokens,
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
            relationships.map(async (rel: Doc<"relationships">) => {
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

    return memory;
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
        return m;
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
      await ctx.db.delete(rel._id);
    }

    // Delete embedding
    const embeddings = await ctx.db
        .query("embeddings")
        .withIndex("by_memory", (q) => q.eq("memoryId", args.memoryId))
        .collect();
    
    for (const emb of embeddings) {
        await ctx.db.delete(emb._id);
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
    const memoryId = await ctx.db.insert("memories", {
      userId: args.userId,
      content: args.content,
      // embedding stored separately
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

    // Store embedding in separate table
    await ctx.db.insert("embeddings", {
        userId: args.userId,
        memoryId: memoryId,
        agentId: args.agentId,
        embedding: args.embedding,
    });

    return memoryId;
  },
});

export const findSimilarInternal = internalQuery({
  args: {
    userId: v.id("users"),
    embedding: v.array(v.float64()),
    threshold: v.number(),
    agentId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Doc<"memories"> | null> => {
    // Deprecated: Logic moved to action
    return null;
  },
});

export const updateMemoryContent = internalMutation({
    args: {
        memoryId: v.id("memories"),
        newContent: v.string(),
        newEmbedding: v.optional(v.array(v.float64()))
    },
    handler: async (ctx, args) => {
        const updates: any = {
            content: args.newContent,
            updatedAt: Date.now()
        };
        if (args.newEmbedding) {
            // Update embedding in separate table
            const embeddings = await ctx.db
                .query("embeddings")
                .withIndex("by_memory", (q) => q.eq("memoryId", args.memoryId))
                .first();
            
            if (embeddings) {
                await ctx.db.patch(embeddings._id, { embedding: args.newEmbedding });
            } else {
                 // Should not happen, but create if missing
                 const memory = await ctx.db.get(args.memoryId);
                 if (memory) {
                    await ctx.db.insert("embeddings", {
                        userId: memory.userId,
                        memoryId: args.memoryId,
                        agentId: memory.agentId,
                        embedding: args.newEmbedding
                    });
                 }
            }
        }
        await ctx.db.patch(args.memoryId, updates);
    }
});

export const getMemoriesFromEmbeddingIds = internalQuery({
  args: {
    embeddingIds: v.array(v.id("embeddings")),
    scores: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const memories = await Promise.all(
      args.embeddingIds.map(async (id, index) => {
        const embeddingDoc = await ctx.db.get(id);
        if (!embeddingDoc) return null;
        
        const memory = await ctx.db.get(embeddingDoc.memoryId);
        if (!memory) return null;

        return { ...memory, _score: args.scores[index] };
      })
    );
    return memories;
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

export const checkMemoryLimit = internalQuery({
  args: {
    userId: v.id("users"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return false;
    return (user.memoriesStored ?? 0) < args.limit;
  },
});

export const incrementMemoryCount = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        memoriesStored: (user.memoriesStored ?? 0) + 1,
      });
    }
  },
});

export const checkSearchLimit = internalQuery({
  args: {
    userId: v.id("users"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return false;
    return (user.searchesMade ?? 0) < args.limit;
  },
});

export const logMemoryUsage = internalMutation({
  args: {
    userId: v.id("users"),
    operation: v.string(),
    metadata: v.optional(v.any()),
    tokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokens = args.tokens ?? 0;
    
    await ctx.db.insert("usageLogs", {
      userId: args.userId,
      operation: args.operation,
      metadata: { ...args.metadata, tokens },
      createdAt: Date.now(),
    });

    const user = await ctx.db.get(args.userId);
    if (user) {
      const updates: any = {
        tokensProcessed: (user.tokensProcessed ?? 0) + tokens,
      };

      if (args.operation === "search") {
        updates.searchesMade = (user.searchesMade ?? 0) + 1;
      }

      await ctx.db.patch(args.userId, updates);
    }
  },
});

/**
 * Migration helper: Update a memory's embedding
 */
export const updateMemoryEmbedding = internalMutation({
    args: {
      memoryId: v.id("memories"),
      embedding: v.array(v.float64()),
    },
    handler: async (ctx, args) => {
      // Find existing embedding record
      const embeddingDoc = await ctx.db
        .query("embeddings")
        .withIndex("by_memory", (q) => q.eq("memoryId", args.memoryId))
        .first();

       if (embeddingDoc) {
          await ctx.db.patch(embeddingDoc._id, { embedding: args.embedding });
       } else {
           // Migration support: create if missing
           const memory = await ctx.db.get(args.memoryId);
           if (memory) {
               await ctx.db.insert("embeddings", {
                   userId: memory.userId,
                   memoryId: args.memoryId,
                   agentId: memory.agentId,
                   embedding: args.embedding
               });
           }
       }
    },
  });

/**
 * Helper query to list all memories for migration
 */
export const listAllMemoriesInternal = internalQuery({
  args: {
    cursor: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("memories")
      .order("desc")
      .paginate({ cursor: args.cursor ?? null, numItems: args.limit });

    return {
      items: result.page,
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

/**
 * Migration Action: Re-embed all memories (paginated)
 */
export const reEmbedAllMemories = internalAction({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ processed: number; continueCursor: string | null; isDone: boolean }> => {
    const batchSize = args.batchSize ?? 10;
    
    // Fetch a batch of memories
    const result: { items: Doc<"memories">[]; continueCursor: string; isDone: boolean } = await ctx.runQuery(internal.memories.listAllMemoriesInternal, {
      cursor: args.cursor,
      limit: batchSize,
    });

    let processed = 0;
    
    for (const memory of result.items) {
      try {
        console.log(`Re-embedding memory ${memory._id}...`);
        const newEmbedding = await generateEmbedding(memory.content);
        
        await ctx.runMutation(internal.memories.updateMemoryEmbedding, {
          memoryId: memory._id,
          embedding: newEmbedding,
        });
        processed++;
      } catch (error) {
        console.error(`Failed to re-embed memory ${memory._id}:`, error);
      }
    }

    // Recursively schedule next batch if not done
    if (!result.isDone) {
      console.log(`Scheduling next batch (cursor: ${result.continueCursor})...`);
      await ctx.scheduler.runAfter(0, internal.memories.reEmbedAllMemories, {
        cursor: result.continueCursor,
        batchSize,
      });
    } else {
      console.log("Migration complete!");
    }

    return {
      processed,
      continueCursor: result.continueCursor ?? null,
      isDone: result.isDone,
    };
  },
});

/**
 * Public action to trigger the migration (Run this once)
 */
export const triggerMigration = action({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.memories.reEmbedAllMemories, {});
    return "Migration started! Check your logs in the Convex dashboard.";
  },
});
