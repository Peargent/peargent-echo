import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

import { getAuthUserId } from "@convex-dev/auth/server";

interface DailyStat {
  date: string; // YYYY-MM-DD
  tokens: number;
  requests: number;
  memories: number;
  retrievals: number;
}

export const getDashboardStats = query({
  args: {
    days: v.optional(v.number()), // Default 30
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const days = args.days || 30;
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    const startDate = now - (days * msPerDay);

    // 1. Get usage logs for the period
    const logs = await ctx.db
      .query("usageLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id).gte("createdAt", startDate))
      .collect();

    // 2. Aggregate by day
    const statsMap = new Map<string, DailyStat>();

    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
        const date = new Date(now - (i * msPerDay)).toISOString().split('T')[0];
        statsMap.set(date, { date, tokens: 0, requests: 0, memories: 0, retrievals: 0 });
    }

    // Fill with data
    for (const log of logs) {
        const date = new Date(log.createdAt).toISOString().split('T')[0];
        const stat = statsMap.get(date);
        
        if (stat) {
            // Count requests (any operation)
            stat.requests++;

            // Count tokens (if tracked in metadata or creditsUsed)
            // Assuming creditsUsed might map to tokens or we store it in metadata
            // For now, let's look at logs metadata or default to estimation
            const tokens = (log.metadata as any)?.tokens || 0;
            stat.tokens += tokens;

            // Count memories added
            if (log.operation === "add") {
                stat.memories++;
            }
            
            // Count retrievals
            if (log.operation === "search") {
                stat.retrievals++;
            }
        }
    }

    // Convert map to sorted array (oldest first)
    const history = Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // 3. Get Recent Activity
    const recentActivity = await ctx.db
        .query("usageLogs")
        .withIndex("by_user_date", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(20);

    // 4. Get Current Month Retrievals
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const currentMonthLogs = await ctx.db
        .query("usageLogs")
        .withIndex("by_user_date", (q) => q.eq("userId", user._id).gte("createdAt", startOfMonth.getTime()))
        .collect();

    const currentMonthRetrievals = currentMonthLogs.filter(l => l.operation === "search").length;

    return {
        userInfo: {
            credits: user.credits || 0,
            memoriesStored: user.memoriesStored || 0,
            tokensProcessed: user.tokensProcessed || 0,
            searchesMade: (await ctx.db.query("usageLogs").withIndex("by_user", q => q.eq("userId", user._id)).filter(q => q.eq(q.field("operation"), "search")).collect()).length,
            activeKeys: (await ctx.db.query("apiKeys").withIndex("by_user", q => q.eq("userId", user._id)).collect()).length,
            currentMonthRetrievals,
            profileFactCount: await (async () => {
                const profile = await ctx.db.query("profiles").withIndex("by_user", q => q.eq("userId", user._id)).first();
                return (profile?.staticFacts.length || 0) + (profile?.dynamicContext.length || 0);
            })(),
        },
        history,
        recentActivity: recentActivity.map(log => ({
            _id: log._id,
            operation: log.operation,
            details: formatLogDetails(log),
            timestamp: log.createdAt
        }))
    };
  },
});

function formatLogDetails(log: Doc<"usageLogs">) {
    const meta = log.metadata as any;
    if (log.operation === "add") return `Added memory ${meta?.memoryId ? `(${meta.memoryId})` : ''}`;
    if (log.operation === "search") return `Search query`; // Use meta.query if safe to log
    return log.operation;
}
