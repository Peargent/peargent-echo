"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";

export default function UsagePage() {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        setToken(localStorage.getItem("peargent_echo_token"));
    }, []);

    const user = useQuery(api.auth.getCurrentUser, token ? { token } : "skip");

    if (!user) {
        return (
            <div className="p-8">
                <div className="animate-pulse text-muted">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Usage & Credits</h1>
                <p className="text-muted">Track your API usage and credit consumption.</p>
            </div>

            {/* Credit Balance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card border-primary/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{user.credits}</p>
                            <p className="text-sm text-muted">Credits remaining</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">—</p>
                            <p className="text-sm text-muted">Operations this month</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">—</p>
                            <p className="text-sm text-muted">Credits used this month</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Credit Costs */}
            <div className="card mb-8">
                <h2 className="text-lg font-semibold mb-4">Credit Costs</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted">Operation</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted">Credits</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-border/50">
                                <td className="py-3 px-4">
                                    <span className="font-medium">Add Memory</span>
                                    <p className="text-xs text-muted mt-1">Store a new memory with embedding generation</p>
                                </td>
                                <td className="py-3 px-4 text-right font-mono">1</td>
                            </tr>
                            <tr className="border-b border-border/50">
                                <td className="py-3 px-4">
                                    <span className="font-medium">Search Memories</span>
                                    <p className="text-xs text-muted mt-1">Semantic search across your memories</p>
                                </td>
                                <td className="py-3 px-4 text-right font-mono">1</td>
                            </tr>
                            <tr className="border-b border-border/50">
                                <td className="py-3 px-4">
                                    <span className="font-medium">Update Memory</span>
                                    <p className="text-xs text-muted mt-1">Modify content or metadata</p>
                                </td>
                                <td className="py-3 px-4 text-right font-mono">1</td>
                            </tr>
                            <tr className="border-b border-border/50">
                                <td className="py-3 px-4">
                                    <span className="font-medium">Get/List Memories</span>
                                    <p className="text-xs text-muted mt-1">Retrieve memories by ID or list</p>
                                </td>
                                <td className="py-3 px-4 text-right text-success font-mono">Free</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-4">
                                    <span className="font-medium">Delete Memory</span>
                                    <p className="text-xs text-muted mt-1">Remove a memory</p>
                                </td>
                                <td className="py-3 px-4 text-right text-success font-mono">Free</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                <div className="text-center py-8 text-muted">
                    <p>No recent activity</p>
                    <p className="text-sm mt-2">API usage will appear here</p>
                </div>
            </div>

            {/* Get More Credits */}
            <div className="card mt-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold mb-1">Need more credits?</h3>
                        <p className="text-sm text-muted">
                            Contact us to add more credits to your account.
                        </p>
                    </div>
                    <button className="btn btn-primary">
                        Get More Credits
                    </button>
                </div>
            </div>
        </div>
    );
}
