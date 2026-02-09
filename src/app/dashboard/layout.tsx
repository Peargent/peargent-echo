"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/lib/convex";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageLoader } from "@/components/ui/loading-spinner";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // OAuth auth state
    const { isAuthenticated: isOAuthAuthenticated, isLoading: oauthLoading } = useConvexAuth();
    const { signOut: oauthSignOut } = useAuthActions();

    useEffect(() => {
        const savedToken = localStorage.getItem("peargent_echo_token");
        setToken(savedToken);
        setIsLoading(false);
    }, []);

    // For email/password users, get user from token
    const emailPasswordUser = useQuery(api.auth.getCurrentUser, token ? { token } : "skip");

    // For OAuth users, get current user from session
    const oauthUser = useQuery(api.auth.getOAuthUser, isOAuthAuthenticated ? {} : "skip");

    const signOutWithToken = useMutation(api.auth.signOutWithToken);

    // Determine which user to use
    const user = token ? emailPasswordUser : oauthUser;
    const hasToken = !!token;
    const hasOAuth = isOAuthAuthenticated;
    const isAuthLoading = isLoading || oauthLoading || (hasToken && emailPasswordUser === undefined) || (hasOAuth && !hasToken && oauthUser === undefined);

    // PREFETCH DATA FOR SEAMLESS NAVIGATION
    // 1. Analytics (365 days)
    useQuery(api.analytics.getDashboardStats, user ? { days: 365 } : "skip");

    // 2. Memories (Limit 50)
    useQuery(api.memories.listMemories, user ? { userId: user._id, limit: 50 } : "skip");

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !oauthLoading && !hasToken && !hasOAuth) {
            router.push("/login");
        }
    }, [isLoading, oauthLoading, hasToken, hasOAuth, router]);

    const handleSignOut = async () => {
        if (token) {
            await signOutWithToken({ token });
            localStorage.removeItem("peargent_echo_token");
        }
        if (isOAuthAuthenticated) {
            await oauthSignOut();
        }
        router.push("/login");
    };

    if (isAuthLoading) {
        return (
            <div className="h-screen bg-background flex items-center justify-center">
                <PageLoader />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="h-screen overflow-hidden bg-background flex">
            {/* Navigation Sidebar */}
            <aside className="w-[260px] flex flex-col bg-background/50 relative z-10 pb-4 border-r border-foreground/5 h-full">
                {/* Logo */}
                <div className="h-24 flex items-center px-6">
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-all duration-300">
                            <div className="w-2 h-2 bg-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                        </div>
                        <span className="font-medium text-base tracking-tight text-foreground/90">Echo</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-6 py-4 overflow-y-auto">
                    {/* Main Links */}
                    <div className="space-y-1">
                        <NavLink href="/dashboard" icon="link" active={pathname === "/dashboard"}>
                            Overview
                        </NavLink>
                        <NavLink href="/dashboard/memories" icon="brain" active={pathname === "/dashboard/memories"}>
                            Memories
                        </NavLink>
                    </div>

                    {/* Insights Group */}
                    <div>
                        <div className="px-6 mb-2">
                            <span className="text-[10px] font-semibold text-foreground/40 uppercase tracking-[0.2em] pl-1">Insights</span>
                        </div>
                        <div className="space-y-1">
                            <NavLink href="/dashboard/usage" icon="analytics" active={pathname === "/dashboard/usage"}>
                                Analytics
                            </NavLink>
                            <NavLink href="/dashboard/keys" icon="key" active={pathname === "/dashboard/keys"}>
                                API Keys
                            </NavLink>
                        </div>
                    </div>

                    {/* Library Group */}
                    <div>
                        <div className="px-6 mb-2">
                            <span className="text-[10px] font-semibold text-foreground/40 uppercase tracking-[0.2em] pl-1">Library</span>
                        </div>
                        <div className="space-y-1">
                            <NavLink href="/dashboard/docs" icon="docs" active={pathname === "/dashboard/docs"}>
                                Documentation
                            </NavLink>
                        </div>
                    </div>
                </nav>

                {/* Bottom Section - Detailed Usage & Profile */}
                <div className="mt-auto px-4 pb-0 space-y-3">
                    {/* Usage Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-foreground-muted">Usage</h3>

                        {/* Memories Stats */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[13px]">
                                <span className="flex items-center gap-2 text-foreground-muted">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    Memories
                                </span>
                                <span className="font-medium text-foreground">
                                    {user.memoriesStored ?? 0} of 1.0K
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-foreground/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-foreground rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(((user.memoriesStored ?? 0) / 1000) * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Searches Stats */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[13px]">
                                <span className="flex items-center gap-2 text-foreground-muted">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Searches
                                </span>
                                <span className="font-medium text-foreground">
                                    {user.searchesMade ?? 0} of 1.0K
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-foreground/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-foreground rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(((user.searchesMade ?? 0) / 1000) * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        <p className="text-[11px] text-foreground-muted pt-1">
                            Usage will reset {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>

                    <div className="h-px bg-foreground/10 w-full" />

                    {/* User Profile - Custom Dropdown */}
                    <ProfileDropdown user={user} signOut={handleSignOut} />
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto bg-background relative z-0">{children}</main>
        </div>
    );
}

function ProfileDropdown({ user, signOut }: { user: any; signOut: () => void }) {
    const [isOpen, setIsOpen] = useState(false);

    // Close on escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    return (
        <div className="relative">
            {/* Backdrop for click-outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 w-full group outline-none overflow-hidden relative z-50 text-left"
            >
                <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 overflow-hidden border border-foreground/10">
                    {user.image ? (
                        <img src={user.image} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-xs font-medium text-foreground">{user.name?.[0] ?? "U"}</span>
                    )}
                </div>
                <div className="flex-1 text-left overflow-hidden min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-foreground-muted truncate">{user.email}</p>
                </div>
                <svg
                    className={`w-4 h-4 text-foreground-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-background border border-foreground/10 shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-bottom-left">
                    <button
                        onClick={() => {
                            signOut();
                            setIsOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-foreground/5 transition-colors group"
                    >
                        <div className="flex flex-col min-w-0 mr-3">
                            <span className="text-[13px] font-medium text-foreground truncate">{user.name}</span>
                            <span className="text-[11px] text-foreground-muted truncate">{user.email}</span>
                        </div>
                        <svg className="w-4 h-4 text-foreground-muted group-hover:text-foreground transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                    <div className="p-2 border-t border-foreground/10">
                        <div className="flex items-center justify-between px-2 py-1.5">
                            <span className="text-xs font-medium text-foreground-muted">Theme</span>
                            <div onClick={(e) => e.stopPropagation()}>
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function NavLink({
    href,
    icon,
    children,
    active,
}: {
    href: string;
    icon: string;
    children: React.ReactNode;
    active?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-2.5 mx-3 text-sm group transition-all ${active
                ? "bg-[#4ade80]/10 text-[#4ade80] font-medium border-l-2 border-[#4ade80]"
                : "text-foreground-muted hover:bg-foreground/5 hover:text-foreground border-l-2 border-transparent"
                }`}
        >
            <span className={`${active ? "text-foreground" : "text-foreground-muted/70 group-hover:text-foreground"}`}>
                <NavIcon name={icon} active={active} />
            </span>
            <span>{children}</span>
        </Link>
    );
}

function NavIcon({ name, active }: { name: string; active?: boolean }) {
    const iconClass = `w-4 h-4`;

    const icons: Record<string, React.ReactNode> = {
        link: (
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        ),
        brain: (
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        ),
        analytics: (
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        key: (
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
        ),
        docs: (
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        ),
    };

    return <>{icons[name] || null}</>;
}
