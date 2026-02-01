"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import Link from "next/link";

export default function DashboardPage() {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        setToken(localStorage.getItem("peargent_echo_token"));
    }, []);

    const user = useQuery(api.auth.getCurrentUser, token ? { token } : "skip");

    if (!user) {
        return (
            <div className="p-8">
                <div className="text-foreground-muted">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Welcome back{user.name ? `, ${user.name}` : ""}!</h1>
                <p className="text-foreground-muted">Here&apos;s an overview of your memory usage.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Credits Remaining"
                    value={user.credits.toString()}
                    icon="credits"
                    color="primary"
                />
                <StatCard
                    title="Total Memories"
                    value="—"
                    icon="memories"
                    color="success"
                    subtitle="View memories →"
                    href="/dashboard/memories"
                />
                <StatCard
                    title="API Keys"
                    value="—"
                    icon="keys"
                    color="warning"
                    subtitle="Manage keys →"
                    href="/dashboard/keys"
                />
            </div>

            {/* Quick Actions */}
            <div className="card mb-8">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                        href="/dashboard/keys"
                        className="flex items-center gap-4 p-4 rounded-lg bg-secondary hover:bg-border transition-colors"
                    >
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">Create API Key</p>
                            <p className="text-sm text-foreground-muted">Generate a new key for your application</p>
                        </div>
                    </Link>
                    <Link
                        href="/docs"
                        className="flex items-center gap-4 p-4 rounded-lg bg-secondary hover:bg-border transition-colors"
                    >
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">View Documentation</p>
                            <p className="text-sm text-foreground-muted">Learn how to integrate Echo</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* API Example */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4">Quick Start</h2>
                <div className="bg-background rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm">
                        <code className="text-foreground-muted">
                            {`# Install the SDK
pip install peargent-echo

# Use in your code
from peargent_echo import Echo

echo = Echo(api_key="your_api_key_here")

# Add a memory
echo.add("User prefers dark mode")

# Search memories
results = echo.search("What are user preferences?")`}
                        </code>
                    </pre>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    color,
    subtitle,
    href,
}: {
    title: string;
    value: string;
    icon: string;
    color: "primary" | "success" | "warning" | "error";
    subtitle?: string;
    href?: string;
}) {
    const colorClasses = {
        primary: "bg-primary/20 text-primary",
        success: "bg-success/20 text-success",
        warning: "bg-warning/20 text-warning",
        error: "bg-error/20 text-error",
    };

    const content = (
        <div className="card hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
                    <StatIcon name={icon} />
                </div>
            </div>
            <p className="text-3xl font-bold mb-1">{value}</p>
            <p className="text-sm text-foreground-muted">{title}</p>
            {subtitle && (
                <p className="text-xs text-primary mt-2">{subtitle}</p>
            )}
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
}

function StatIcon({ name }: { name: string }) {
    const icons: Record<string, React.ReactNode> = {
        credits: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        memories: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        ),
        keys: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
        ),
    };

    return <>{icons[name] || null}</>;
}
