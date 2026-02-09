"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/lib/convex";
import Link from "next/link";
import { VercelAreaChart } from "@/components/dashboard/charts";

export default function DashboardPage() {
    const [token, setToken] = useState<string | null>(null);
    const { isAuthenticated: isOAuthAuthenticated } = useConvexAuth();

    useEffect(() => {
        setToken(localStorage.getItem("peargent_echo_token"));
    }, []);

    // Get user from either auth method
    const emailPasswordUser = useQuery(api.auth.getCurrentUser, token ? { token } : "skip");
    const oauthUser = useQuery(api.auth.getOAuthUser, isOAuthAuthenticated ? {} : "skip");
    const user = token ? emailPasswordUser : oauthUser;

    // Get Analytics Data
    const analytics = useQuery(api.analytics.getDashboardStats, user ? { days: 30 } : "skip");

    if (!user) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-foreground-muted text-sm">Loading...</div>
            </div>
        );
    }

    // Extract recent 7 days for mini charts
    // Extract recent 7 days for mini charts
    const recentHistory = analytics?.history.slice(-7) || [];

    // Format data for Vercel Charts ({ value, label })
    const formatData = (data: any[], key: string) => {
        // If no data, return empty structure for last 7 days mockup
        if (!data.length) {
            return Array.from({ length: 7 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return {
                    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    value: 0
                };
            });
        }
        return data.map(d => ({
            label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            value: d[key]
        }));
    };

    const memoryChartData = formatData(recentHistory, 'memories');

    return (
        <div className="min-h-full flex flex-col bg-background font-sans">
            {/* Grid Background */}
            <div className="absolute inset-0 pointer-events-none z-0 grid-lines opacity-[0.03]" />

            {/* Header Area - Clean & Minimal */}
            <header className="h-20 px-8 flex items-end justify-between border-b border-border/40 relative z-10">
                <div className="pb-6">
                    <h1 className="text-sm font-medium tracking-widest uppercase opacity-70">
                        Overview
                    </h1>
                </div>
            </header>

            {/* Main Content - Veltrix Grid Style */}
            <div className="flex-1 overflow-auto relative z-10">

                {/* Welcome Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-border/40">
                    <div className="p-10 lg:p-14 border-r border-border/40">
                        <h2 className="text-5xl lg:text-7xl font-semibold tracking-tight leading-[0.9] mb-6">
                            Hello <span className="text-stroke">{user.name ? user.name.split(" ")[0] : "User"}</span>
                        </h2>
                        <p className="text-xl text-foreground-muted max-w-md leading-relaxed">
                            Your memory bank is active. <span className="text-[#4ade80]">Ready to recall.</span>
                        </p>
                    </div>

                    {/* Primary Stats - Integrated into grid */}
                    <div className="grid grid-rows-2">
                        <div className="p-8 border-b border-border/40 flex items-center justify-between hover:bg-secondary/5 transition-colors group">
                            <div>
                                <span className="text-xs font-medium tracking-widest uppercase text-foreground-muted mb-2 block">Retrievals (This Month)</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl lg:text-5xl font-light">{analytics?.userInfo?.currentMonthRetrievals?.toLocaleString() ?? 0}</span>
                                    <span className="text-lg text-foreground-muted font-light">/ 1,000</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-full border border-border/40 flex items-center justify-center text-[#4ade80] group-hover:border-[#4ade80]/50 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="grid grid-cols-2">
                            <Link href="/dashboard/memories" className="p-8 border-r border-border/40 flex flex-col justify-between hover:bg-secondary/5 transition-colors group">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-medium tracking-widest uppercase text-foreground-muted">Total Memories</span>
                                    <svg className="w-4 h-4 text-foreground-muted group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                                <div className="mt-4">
                                    <span className="text-3xl font-light">{analytics?.userInfo?.memoriesStored?.toLocaleString() ?? user.memoriesStored ?? 0}</span>
                                    <span className="text-sm text-foreground-muted font-light ml-2">/ 1,000</span>
                                </div>
                            </Link>
                            <Link href="/dashboard/keys" className="p-8 flex flex-col justify-between hover:bg-secondary/5 transition-colors group">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-medium tracking-widest uppercase text-foreground-muted">Active Keys</span>
                                    <svg className="w-4 h-4 text-foreground-muted group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                                <span className="text-3xl font-light mt-4">{analytics?.userInfo?.activeKeys ?? 0}</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Secondary Section - Actions */}
                {/* Memory Analytics */}
                <div className="border-b border-border/40">
                    <div className="p-10">
                        <Link href="/dashboard/memories" className="block">
                            <h3 className="text-lg font-medium mb-8 flex items-center gap-2 group">
                                Memory Growth
                                <span className="text-xs text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">View All Memories &rarr;</span>
                            </h3>
                        </Link>
                        <div className="flex flex-col h-96 bg-secondary/5 border border-border/40 rounded-sm p-6 relative group overflow-hidden">
                            <div className="absolute inset-0 pointer-events-none z-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-400 to-transparent" />
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div>
                                    <p className="text-xs font-medium tracking-widest uppercase text-foreground-muted mb-1">Memories Stored (7 Days)</p>
                                    <p className="text-3xl font-light">{analytics?.userInfo?.memoriesStored?.toLocaleString() ?? user.memoriesStored ?? 0}</p>
                                </div>
                                <div className="text-purple-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1 w-full relative z-10">
                                <VercelAreaChart
                                    data={memoryChartData}
                                    color="#c084fc"
                                    id="memories-chart"
                                    height="100%"
                                    showXAxis={true}
                                    showYAxis={false}
                                    showGrid={false}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions - Compact */}
                <div className="border-b border-border/40">
                    <div className="p-10 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Link href="/dashboard/keys" className="flex items-center gap-4 group cursor-pointer p-4 border border-border/40 rounded-lg hover:bg-secondary/5 transition-colors opacity-80 hover:opacity-100">
                                <div className="text-foreground-muted group-hover:text-[#4ade80] transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                </div>
                                <div className="text-sm font-medium group-hover:text-[#4ade80] transition-colors">Create API Key</div>
                            </Link>
                            <Link href="/docs" className="flex items-center gap-4 group cursor-pointer p-4 border border-border/40 rounded-lg hover:bg-secondary/5 transition-colors opacity-80 hover:opacity-100">
                                <div className="text-foreground-muted group-hover:text-blue-400 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div className="text-sm font-medium group-hover:text-blue-400 transition-colors">Documentation</div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


