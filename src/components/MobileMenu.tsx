"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

import { useConvexAuth } from "convex/react";

export function MobileMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const { isAuthenticated } = useConvexAuth();

    return (
        <>
            {/* ... (hamburger button same) ... */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden w-10 h-10 flex flex-col justify-center items-end gap-[6px] z-[60]"
                aria-label="Toggle Menu"
            >
                <span className={`block h-[2px] bg-foreground transition-all duration-300 ${isOpen ? 'w-6 rotate-45 translate-y-[8px]' : 'w-8'}`} />
                <span className={`block h-[2px] bg-foreground transition-all duration-300 ${isOpen ? 'opacity-0 w-0' : 'w-6'}`} />
                <span className={`block h-[2px] bg-foreground transition-all duration-300 ${isOpen ? 'w-6 -rotate-45 -translate-y-[8px]' : 'w-8'}`} />
            </button>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 bg-background z-[55] md:hidden transition-all duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <nav className="h-full flex flex-col justify-end px-8 pb-24">
                    <ul className="space-y-12">
                        <li>
                            <Link
                                href="/"
                                className="text-4xl font-medium text-foreground hover:text-[#4ade80] transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="#abilities"
                                className="text-4xl font-medium text-foreground hover:text-[#4ade80] transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                Abilities
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="#how-it-works"
                                className="text-4xl font-medium text-foreground hover:text-[#4ade80] transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                How it works
                            </Link>
                        </li>
                        <li>
                            {isAuthenticated ? (
                                <Link
                                    href="/dashboard"
                                    className="text-4xl font-medium text-[#4ade80] hover:opacity-80 transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href="/signup"
                                    className="text-4xl font-medium text-[#4ade80] hover:opacity-80 transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Get started
                                </Link>
                            )}
                        </li>
                    </ul>

                    <div className="mt-16">
                        <ThemeToggle />
                    </div>
                </nav>
            </div>
        </>
    );
}
