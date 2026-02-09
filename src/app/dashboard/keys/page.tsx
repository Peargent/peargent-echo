"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/lib/convex";
import type { Id } from "@/lib/convex";
import { PageLoader } from "@/components/ui/loading-spinner";

export default function APIKeysPage() {
    const [token, setToken] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [keyToRevoke, setKeyToRevoke] = useState<Id<"apiKeys"> | null>(null);
    const { isAuthenticated: isOAuthAuthenticated } = useConvexAuth();

    useEffect(() => {
        setToken(localStorage.getItem("peargent_echo_token"));
    }, []);

    // Get user from either auth method
    const emailPasswordUser = useQuery(api.auth.getCurrentUser, token ? { token } : "skip");
    const oauthUser = useQuery(api.auth.getOAuthUser, isOAuthAuthenticated ? {} : "skip");
    const user = token ? emailPasswordUser : oauthUser;

    const apiKeys = useQuery(
        api.keys.listApiKeys,
        user ? { userId: user._id } : "skip"
    );
    const generateAndCreateApiKey = useAction(api.keys.generateAndCreateApiKey);
    const revokeApiKeyMutation = useMutation(api.keys.revokeApiKey);

    const handleCreateKey = async () => {
        if (!user || !newKeyName.trim()) return;

        setIsCreating(true);
        try {
            const result = await generateAndCreateApiKey({
                userId: user._id,
                name: newKeyName.trim(),
                permissions: ["read", "write", "delete"],
            });
            setCreatedKey(result.key);
            setNewKeyName("");
            // setShowCreateModal(false); // Keep modal open to show key
        } catch (error) {
            console.error("Failed to create key:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleRevokeKey = (keyId: Id<"apiKeys">) => {
        setKeyToRevoke(keyId);
    };

    const confirmRevoke = async () => {
        if (!user || !keyToRevoke) return;

        try {
            await revokeApiKeyMutation({ keyId: keyToRevoke, userId: user._id });
            setKeyToRevoke(null);
        } catch (error) {
            console.error("Failed to revoke key:", error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    if (!user) {
        return <PageLoader />;
    }

    return (
        <div className="min-h-full flex flex-col bg-background font-sans">
            {/* Grid Background */}
            <div className="absolute inset-0 pointer-events-none z-0 grid-lines opacity-[0.03]" />

            {/* Header Area - Clean & Minimal */}
            <header className="h-20 px-8 flex items-end justify-between border-b border-border/40 relative z-10">
                <div className="pb-6">
                    <h1 className="text-sm font-medium tracking-widest uppercase opacity-70">
                        API Keys
                    </h1>
                </div>
                <div className="pb-4">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-[#4ade80] text-black text-xs font-medium uppercase tracking-wider hover:bg-[#4ade80]/90 transition-colors rounded-sm"
                    >
                        Create New Key
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-auto relative z-10 p-10">


                {/* API Keys List */}
                <div className="card bg-transparent border-0 p-0 shadow-none">
                    <h2 className="text-lg font-medium mb-6">Your API Keys</h2>

                    {apiKeys === undefined ? (
                        <PageLoader />
                    ) : apiKeys.length === 0 ? (
                        <div className="text-center py-20 border border-border/40 border-dashed rounded-lg bg-secondary/5">
                            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <p className="text-foreground-muted mb-4">No API keys yet</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-[#4ade80] text-black text-xs font-medium uppercase tracking-wider hover:bg-[#4ade80]/90 transition-colors rounded-sm"
                            >
                                Create Your First Key
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {apiKeys.map((key) => (
                                <div
                                    key={key._id}
                                    className="flex items-center justify-between p-6 bg-secondary/5 border border-border/40 hover:bg-secondary/10 transition-colors"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-lg mb-2">{key.name}</p>
                                        <div className="flex items-center gap-4 text-xs font-mono text-foreground-muted">
                                            <span className="bg-background px-2 py-1 rounded border border-border/20">{key.keyPrefix}...••••••••</span>
                                            <span className="opacity-50">•</span>
                                            <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                                            {key.lastUsedAt && (
                                                <>
                                                    <span className="opacity-50">•</span>
                                                    <span>Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRevokeKey(key._id)}
                                        className="text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/80 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 text-xs font-semibold uppercase tracking-wider px-4 py-2 border border-red-200/60 dark:border-red-800/40 rounded-sm transition-all shadow-sm hover:shadow"
                                    >
                                        Revoke
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Key Modal */}

            {/* Revoke Key Modal */}
            {keyToRevoke && (
                <div className="fixed top-0 right-0 bottom-0 left-[260px] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="card w-full max-w-md animate-in zoom-in-95 duration-200 border border-border/40 shadow-2xl bg-background p-6">
                        <h2 className="text-xl font-medium tracking-wide mb-2">Revoke API Key?</h2>
                        <p className="text-foreground-muted text-sm mb-6">
                            Are you sure you want to revoke this API key? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setKeyToRevoke(null)}
                                className="flex-1 px-4 py-2.5 bg-transparent border border-border/20 hover:bg-secondary/10 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRevoke}
                                className="flex-1 px-4 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm"
                            >
                                Revoke Key
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Key Modal */}
            {showCreateModal && (
                <div className="fixed top-0 right-0 bottom-0 left-[260px] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="card w-full max-w-md animate-in zoom-in-95 duration-200 border border-border/40 shadow-2xl bg-background p-6">
                        {!createdKey ? (
                            <>
                                <h2 className="text-xl font-medium tracking-wide mb-2">Create New API Key</h2>
                                <p className="text-foreground-muted text-sm mb-6">
                                    Give your API key a descriptive name to help you remember what it&apos;s used for.
                                </p>
                                <input
                                    type="text"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    placeholder="e.g., Production Server, Local Development"
                                    className="w-full px-4 py-3 bg-secondary/5 border border-border/40 rounded-sm focus:outline-none focus:border-[#4ade80]/50 focus:ring-1 focus:ring-[#4ade80]/20 transition-all mb-6 text-sm placeholder:text-foreground-muted/50"
                                    autoFocus
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setNewKeyName("");
                                        }}
                                        className="flex-1 px-4 py-2.5 bg-transparent border border-border/20 hover:bg-secondary/10 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateKey}
                                        disabled={!newKeyName.trim() || isCreating}
                                        className="flex-1 px-4 py-2.5 bg-[#4ade80] text-black hover:bg-[#4ade80]/90 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium uppercase tracking-wider transition-colors rounded-sm"
                                    >
                                        {isCreating ? "Creating..." : "Create Key"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <div className="w-12 h-12 bg-[#4ade80]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-medium tracking-wide mb-2">API Key Created!</h2>
                                <p className="text-foreground-muted text-sm mb-6">
                                    Make sure to copy your API key now. You won&apos;t be able to see it again!
                                </p>
                                <div className="relative mb-6">
                                    <code className="block w-full p-3 bg-secondary/5 rounded border border-border/40 text-sm font-mono break-all text-foreground text-center select-all">
                                        {createdKey}
                                    </code>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => copyToClipboard(createdKey)}
                                        className="flex-1 px-4 py-2.5 bg-transparent border border-border/20 hover:bg-secondary/10 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                        Copy
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCreatedKey(null);
                                            setShowCreateModal(false);
                                            setNewKeyName("");
                                        }}
                                        className="flex-1 px-4 py-2.5 bg-[#4ade80] text-black hover:bg-[#4ade80]/90 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
