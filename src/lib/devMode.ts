/**
 * Development Mode Utilities
 * 
 * When NEXT_PUBLIC_DEV_MODE=true, the dashboard bypasses Convex auth
 * and uses mock data. This lets frontend contributors work without
 * any backend setup.
 */

export function isDevMode(): boolean {
    return process.env.NEXT_PUBLIC_DEV_MODE === "true";
}

// Mock user matching the shape expected by dashboard components
export const DEV_USER = {
    _id: "dev_user_001" as any,
    email: "contributor@peargent.dev",
    name: "Dev Contributor",
    credits: 500,
    plan: "pro" as const,
    subscriptionStatus: "active" as const,
    memoriesStored: 42,
    searchesMade: 128,
    image: null,
    extraMemories: 0,
    extraSearches: 0,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
};

export const DEV_PLAN_LIMITS = {
    plan: "pro" as const,
    limits: {
        memories: 5000,
        searches: 5000,
    },
};

// 7-day mock analytics history
const generateHistory = (days: number = 7) => {
    const history = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        history.push({
            date: d.toISOString().split("T")[0],
            memories: Math.floor(Math.random() * 8) + 2,
            searches: Math.floor(Math.random() * 15) + 5,
            tokens: Math.floor(Math.random() * 500) + 100,
            requests: Math.floor(Math.random() * 20) + 3,
            retrievals: Math.floor(Math.random() * 12) + 1,
        });
    }
    return history;
};

export const DEV_ANALYTICS = {
    history: generateHistory(7),
    userInfo: {
        memoriesStored: 42,
        currentMonthRetrievals: 128,
        activeKeys: 2,
        searchesMade: 128,
        profileFactCount: 15,
    },
    recentActivity: [
        { _id: "act_1", operation: "add", details: "Added memory about user preferences", timestamp: Date.now() - 1 * 60 * 60 * 1000 },
        { _id: "act_2", operation: "search", details: "Searched for 'project deadlines'", timestamp: Date.now() - 3 * 60 * 60 * 1000 },
        { _id: "act_3", operation: "add", details: "Added memory about tech stack choices", timestamp: Date.now() - 8 * 60 * 60 * 1000 },
    ],
};

// Extended analytics for the usage page (365-day history)
export const DEV_ANALYTICS_FULL = {
    ...DEV_ANALYTICS,
    history: generateHistory(365),
};

export const DEV_MEMORIES = {
    items: [
        {
            _id: "mem_001",
            content: "The user prefers dark mode interfaces and minimalist design patterns. They mentioned using Tailwind CSS for most projects but are open to vanilla CSS for maximum control.",
            entities: [
                { name: "Dark Mode", type: "preference" },
                { name: "Tailwind CSS", type: "technology" },
            ],
            facts: ["Prefers dark mode", "Uses Tailwind CSS", "Likes minimalist design"],
            importance: 0.85,
            decay: 0.95,
            agentId: "agent-alpha",
            source: "conversation",
            createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        },
        {
            _id: "mem_002",
            content: "Project deadline is set for March 15th. The team is using Next.js 14 with App Router and Convex as the backend. Priority is on the billing integration.",
            entities: [
                { name: "Next.js 14", type: "technology" },
                { name: "Convex", type: "technology" },
                { name: "March 15th", type: "date" },
            ],
            facts: ["Deadline: March 15th", "Using Next.js 14 App Router", "Billing integration is priority"],
            importance: 0.92,
            decay: 0.98,
            agentId: "agent-beta",
            source: "api",
            createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
        },
        {
            _id: "mem_003",
            content: "User asked about implementing semantic search with Cohere embeddings. They want sub-200ms response times for retrieval queries.",
            entities: [
                { name: "Cohere", type: "service" },
                { name: "Semantic Search", type: "feature" },
            ],
            facts: ["Wants semantic search", "Using Cohere embeddings", "Target: <200ms response time"],
            importance: 0.78,
            decay: 0.90,
            source: "conversation",
            createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        },
    ],
    hasMore: false,
};

export const DEV_API_KEYS = [
    {
        _id: "key_001" as any,
        name: "Local Development",
        keyPrefix: "echo_sk_dev",
        permissions: ["read", "write", "delete"],
        createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
        lastUsedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    },
    {
        _id: "key_002" as any,
        name: "CI/CD Pipeline",
        keyPrefix: "echo_sk_ci",
        permissions: ["read", "write"],
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        lastUsedAt: null,
    },
];
