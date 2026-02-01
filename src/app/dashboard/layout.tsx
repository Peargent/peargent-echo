"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem("peargent_echo_token");
        if (!savedToken) {
            router.push("/login");
        } else {
            setToken(savedToken);
        }
        setIsLoading(false);
    }, [router]);

    const user = useQuery(api.auth.getCurrentUser, token ? { token } : "skip");
    const signOut = useMutation(api.auth.signOut);

    useEffect(() => {
        if (!isLoading && token && user === null) {
            localStorage.removeItem("peargent_echo_token");
            router.push("/login");
        }
    }, [isLoading, token, user, router]);

    const handleSignOut = async () => {
        if (token) {
            await signOut({ token });
        }
        localStorage.removeItem("peargent_echo_token");
        router.push("/login");
    };

    if (isLoading || (token && user === undefined)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-foreground-muted">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border flex flex-col">
                {/* Logo */}
                <div className="p-4 border-b border-border">
                    <Link href="/dashboard" className="flex items-center gap-1">
                        <span className="text-foreground-muted font-medium">peargent.</span>
                        <span className="text-foreground font-medium">ECHO</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    <NavLink href="/dashboard" icon="home">
                        Overview
                    </NavLink>
                    <NavLink href="/dashboard/memories" icon="brain">
                        Memories
                    </NavLink>
                    <NavLink href="/dashboard/keys" icon="key">
                        API Keys
                    </NavLink>
                    <NavLink href="/dashboard/usage" icon="chart">
                        Usage
                    </NavLink>
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-primary text-sm font-medium">
                                {user.email[0].toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {user.name || user.email}
                            </p>
                            <p className="text-xs text-foreground-muted truncate">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-muted">Credits:</span>
                        <span className="font-medium text-primary">{user.credits}</span>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="btn btn-ghost w-full mt-3 text-sm"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto">{children}</main>
        </div>
    );
}

function NavLink({
    href,
    icon,
    children,
}: {
    href: string;
    icon: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground-muted hover:bg-secondary hover:text-foreground transition-colors"
        >
            <NavIcon name={icon} />
            <span className="text-sm">{children}</span>
        </Link>
    );
}

function NavIcon({ name }: { name: string }) {
    const icons: Record<string, React.ReactNode> = {
        home: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
        brain: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        ),
        key: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
        ),
        chart: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    };

    return <>{icons[name] || null}</>;
}
