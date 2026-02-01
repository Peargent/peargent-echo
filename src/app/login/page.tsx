"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@/lib/convex";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const signIn = useMutation(api.auth.signIn);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const result = await signIn({ email, password });
            localStorage.setItem("peargent_echo_token", result.token);
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to sign in");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navigation */}
            <nav className="border-b border-border px-6 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-1">
                        <span className="text-foreground-muted font-medium">peargent.</span>
                        <span className="text-foreground font-medium">ECHO</span>
                    </Link>
                    <Link href="/signup" className="nav-link">
                        Sign Up
                    </Link>
                </div>
            </nav>

            {/* Login Form */}
            <main className="flex-1 flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-sm">
                    <h1 className="text-2xl font-normal mb-1 text-center">
                        Sign in to <span className="brand-text">Echo</span>
                    </h1>
                    <p className="text-foreground-muted text-center mb-8">
                        Access your memory dashboard
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded bg-error/10 border border-error/20 text-error text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm text-foreground-muted mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-foreground-muted mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full py-2.5"
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <p className="text-center text-foreground-muted text-sm mt-6">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
