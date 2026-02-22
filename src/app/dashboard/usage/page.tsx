"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/lib/convex";
import { VercelAreaChart, VercelBarChart } from "@/components/dashboard/charts";
import { PageLoader } from "@/components/ui/loading-spinner";
import { isDevMode, DEV_USER, DEV_ANALYTICS_FULL } from "@/lib/devMode";

export default function UsagePage() {
    const devMode = isDevMode();
    const [token, setToken] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<number>(30); // Default 30 days
    const { isAuthenticated: isOAuthAuthenticated } = useConvexAuth();

    useEffect(() => {
        if (devMode) return;
        setToken(localStorage.getItem("peargent_echo_token"));
    }, [devMode]);

    // Get user from either auth method
    const emailPasswordUser = useQuery(api.auth.getCurrentUser, !devMode && token ? { token } : "skip");
    const oauthUser = useQuery(api.auth.getOAuthUser, !devMode && isOAuthAuthenticated ? {} : "skip");
    const user = devMode ? DEV_USER : (token ? emailPasswordUser : oauthUser);

    // Get Analytics Data (Fetch all year data once)
    const analyticsQuery = useQuery(api.analytics.getDashboardStats, !devMode && user ? { days: 365 } : "skip");
    const analytics = devMode ? DEV_ANALYTICS_FULL : analyticsQuery;

    if (!user) {
        return <PageLoader />;
    }

    // Show loading only on initial fetch
    if (!analytics) {
        return <PageLoader />;
    }

    // Prepare Data
    // Prepare Data for Charts (Filter client-side for instant updates)
    const fullHistory = analytics?.history || [];
    const history = fullHistory.slice(-timeRange);

    // Format helper
    const formatData = (data: any[], key: string) => data.map(d => ({
        label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: d[key]
    }));

    const tokenChartData = formatData(history, 'tokens');
    const requestChartData = formatData(history, 'requests');
    const memoryChartData = formatData(history, 'memories');

    // Values for totals
    const tokenData = history.map(d => d.tokens);
    const requestData = history.map(d => d.requests);
    const memoryData = history.map(d => d.memories);

    // Calculate totals
    const totalTokens = tokenData.reduce((a, b) => a + b, 0);
    const totalRequests = requestData.reduce((a, b) => a + b, 0);
    const totalMemories = memoryData.reduce((a, b) => a + b, 0);

    return (
        <div className="min-h-full flex flex-col bg-background font-sans">
            {/* Grid Background */}
            <div className="absolute inset-0 pointer-events-none z-0 grid-lines opacity-[0.03]" />

            {/* Header Area */}
            <header className="h-20 px-8 flex items-end justify-between border-b border-border/40 relative z-10">
                <div className="pb-6">
                    <h1 className="text-sm font-medium tracking-widest uppercase opacity-70">
                        Analytics & Logs
                    </h1>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-auto relative z-10 p-10">
                <div className="max-w-6xl mx-auto space-y-12">

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatsCard label="Total Tokens" value={totalTokens} color="text-[#4ade80]" />
                        <StatsCard label="Total Requests" value={totalRequests} color="text-blue-400" />
                        <StatsCard label="Memories Added" value={totalMemories} color="text-purple-400" />
                        <StatsCard label="Total Retrievals" value={analytics.userInfo.searchesMade} color="text-yellow-400" />
                        <StatsCard label="Profile Knowledge" value={analytics.userInfo.profileFactCount} color="text-pink-400" />
                    </div>

                    {/* Main Graphs Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex bg-secondary/10 p-1 rounded-sm border border-border/40">
                            {[
                                { label: '30D', value: 30 },
                                { label: '3M', value: 90 },
                                { label: '6M', value: 180 },
                                { label: 'ALL', value: 365 }
                            ].map((option) => (
                                <button
                                    key={option.label}
                                    onClick={() => setTimeRange(option.value)}
                                    className={`px-3 py-1 text-[10px] font-medium transition-all rounded-sm ${timeRange === option.value
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-foreground-muted hover:text-foreground'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Graphs */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Token Usage */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium uppercase tracking-wider text-foreground-muted">Token Usage Trend</h3>
                            <div className="h-64 bg-secondary/5 border border-border/40 rounded-sm p-6 relative">
                                <VercelAreaChart
                                    data={tokenChartData}
                                    color="#4ade80"
                                    id="tokens-main"
                                    height={200}
                                />
                            </div>
                        </div>

                        {/* Request Volume */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium uppercase tracking-wider text-foreground-muted">Request Volume</h3>
                            <div className="h-64 bg-secondary/5 border border-border/40 rounded-sm p-6 relative">
                                <VercelAreaChart
                                    data={requestChartData}
                                    color="#60a5fa"
                                    id="requests-main"
                                    height={200}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Memory Growth (Bar Chart) */}
                    {/* Memory & Retrieval Graphs */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Memory Growth */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium uppercase tracking-wider text-foreground-muted">Memories Added (Daily)</h3>
                            <div className="h-64 bg-secondary/5 border border-border/40 rounded-sm p-6 relative">
                                <VercelBarChart
                                    data={memoryChartData}
                                    color="#a78bfa"
                                    height={200}
                                />
                            </div>
                        </div>

                        {/* Retrieval Trend */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium uppercase tracking-wider text-foreground-muted">Retrieval Volume</h3>
                            <div className="h-64 bg-secondary/5 border border-border/40 rounded-sm p-6 relative">
                                <VercelAreaChart
                                    data={formatData(history, 'retrievals')}
                                    color="#facc15"
                                    id="retrievals-main"
                                    height={200}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-foreground-muted">Recent Activity Log</h3>
                        <div className="border border-border/40 bg-secondary/5 rounded-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-foreground-muted uppercase bg-secondary/10 border-b border-border/40">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Operation</th>
                                        <th className="px-6 py-3 font-medium">Details</th>
                                        <th className="px-6 py-3 font-medium text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {analytics?.recentActivity?.length ? (
                                        analytics.recentActivity.map((log: any) => (
                                            <tr key={log._id} className="hover:bg-secondary/10 transition-colors">
                                                <td className="px-6 py-4 font-medium capitalize">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] tracking-wider uppercase border ${log.operation === 'add' ? 'border-green-500/30 text-green-500 bg-green-500/5' :
                                                        log.operation === 'search' ? 'border-blue-500/30 text-blue-500 bg-blue-500/5' :
                                                            'border-foreground/20 text-foreground-muted'
                                                        }`}>
                                                        {log.operation}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-foreground-muted truncate max-w-md">
                                                    {log.details}
                                                </td>
                                                <td className="px-6 py-4 text-right text-foreground-muted tabular-nums">
                                                    {new Date(log.timestamp).toLocaleString(undefined, {
                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-foreground-muted">
                                                No recent activity found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className="p-6 bg-secondary/5 border border-border/40 rounded-none">
            <p className="text-xs font-medium tracking-widest uppercase text-foreground-muted mb-2">{label}</p>
            <p className={`text-4xl font-light ${color}`}>{value.toLocaleString()}</p>
        </div>
    );
}


