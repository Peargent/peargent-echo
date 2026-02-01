import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    passwordHash: v.optional(v.string()), // For email/password auth
    image: v.optional(v.string()),
    credits: v.number(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

  // API Keys for external access
  apiKeys: defineTable({
    userId: v.id("users"),
    name: v.string(),
    keyHash: v.string(), // Hashed API key
    keyPrefix: v.string(), // First 8 chars for display (echo_sk_)
    permissions: v.array(v.string()), // ["read", "write", "delete"]
    lastUsedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_key_hash", ["keyHash"]),

  // Memories - core data
  memories: defineTable({
    userId: v.id("users"),
    agentId: v.optional(v.string()), // Scope by agent
    runId: v.optional(v.string()), // Scope by run/session

    content: v.string(), // Raw content
    embedding: v.array(v.float64()), // Vector embedding (1536 dims)

    // Extracted metadata
    entities: v.array(
      v.object({
        name: v.string(),
        type: v.string(), // person, place, concept, etc.
      })
    ),
    facts: v.array(v.string()), // Extracted facts

    // Memory management
    importance: v.number(), // 0-1 importance score
    decay: v.number(), // Current decay factor (starts at 1.0)
    accessCount: v.number(), // Times accessed

    // Metadata
    source: v.optional(v.string()), // Where it came from
    metadata: v.optional(v.any()), // Custom user metadata

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_agent", ["userId", "agentId"])
    .index("by_user_run", ["userId", "runId"])
    .index("by_user_created", ["userId", "createdAt"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 768,
      filterFields: ["userId", "agentId"],
    }),

  // Memory relationships (graph)
  relationships: defineTable({
    userId: v.id("users"),
    fromMemoryId: v.id("memories"),
    toMemoryId: v.id("memories"),
    type: v.string(), // extends, contradicts, relates_to
    strength: v.number(), // 0-1 relationship strength
    createdAt: v.number(),
  })
    .index("by_from", ["fromMemoryId"])
    .index("by_to", ["toMemoryId"]),

  // Usage logs for billing/analytics
  usageLogs: defineTable({
    userId: v.id("users"),
    apiKeyId: v.optional(v.id("apiKeys")),
    operation: v.string(), // add, search, delete, etc.
    creditsUsed: v.number(),
    metadata: v.optional(v.any()), // Request details
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "createdAt"]),

  // Sessions for authentication
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // User profiles (static + dynamic context)
  profiles: defineTable({
    userId: v.id("users"),
    staticFacts: v.array(v.string()),      // Persistent facts: ["Age: 20", "Developer"]
    dynamicContext: v.array(v.string()),   // Evolving context: ["Learning Rust", "Working on project X"]
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),
});
