"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileMenu } from "@/components/MobileMenu";

import { useConvexAuth } from "convex/react";

interface NavbarProps {
    showAuthLinks?: boolean;
    showClose?: boolean;
}

export function Navbar({ showAuthLinks = true, showClose = false }: NavbarProps) {
    const { isAuthenticated, isLoading } = useConvexAuth();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center text-xs font-medium tracking-widest uppercase bg-background/80 backdrop-blur-md">
            <Link href="/" className="flex items-center gap-2 animate-reveal-up">
                <div className="w-3 h-3 bg-[#4ade80] rounded-sm animate-pulse" />
                <span className="text-2xl md:text-4xl lowercase tracking-normal font-semibold" style={{ fontFamily: 'var(--font-instrument-serif)' }}>
                    peargent<span className="text-[#4ade80]">.</span>
                </span>
                <span className="text-sm md:text-lg font-normal tracking-wider translate-y-1">ECHO</span>
            </Link>

            {showClose ? (
                <Link
                    href="/"
                    className="hover:text-[#4ade80] transition-colors"
                >
                    Close
                </Link>
            ) : (
                <>
                    {/* Desktop Nav */}
                    {showAuthLinks && (
                        <div className="hidden md:flex gap-6 items-center animate-reveal-up delay-100">
                            {isLoading ? (
                                // Loading state skeleton
                                <div className="h-4 w-20 bg-foreground/10 animate-pulse rounded" />
                            ) : isAuthenticated ? (
                                <Link
                                    href="/dashboard"
                                    className="px-4 py-2 border border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80] hover:text-black transition-all"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" className="hover:text-[#4ade80] transition-colors">Sign In</Link>
                                    <Link href="/signup" className="hover:text-[#4ade80] transition-colors">Sign Up</Link>
                                </>
                            )}
                            <ThemeToggle />
                        </div>
                    )}

                    {/* Mobile Nav */}
                    <MobileMenu />
                </>
            )}
        </header>
    );
}
