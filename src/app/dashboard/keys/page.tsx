"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/lib/convex";
import type { Id } from "@/lib/convex";

export default function APIKeysPage() {
    const [token, setToken] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        setToken(localStorage.getItem("peargent_echo_token"));
    }, []);

    const user = useQuery(api.auth.getCurrentUser, token ? { token } : "skip");
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
            setShowCreateModal(false);
        } catch (error) {
            console.error("Failed to create key:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleRevokeKey = async (keyId: Id<"apiKeys">) => {
        if (!user) return;

        if (confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
            try {
                await revokeApiKeyMutation({ keyId, userId: user._id });
            } catch (error) {
                console.error("Failed to revoke key:", error);
            }
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    if (!user) {
        return (
            <div className="p-8">
                <div className="animate-pulse text-muted">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-2">API Keys</h1>
                    <p className="text-muted">Manage your API keys for accessing the Echo API.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary"
                >
                    + Create New Key
                </button>
            </div>

            {/* Created Key Alert */}
            {createdKey && (
                <div className="card border-success/50 bg-success/10 mb-6 animate-fadeIn">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-semibold text-success mb-2">API Key Created!</h3>
                            <p className="text-sm text-muted mb-3">
                                Make sure to copy your API key now. You won&apos;t be able to see it again!
                            </p>
                            <code className="block p-3 bg-background rounded-lg text-sm font-mono break-all">
                                {createdKey}
                            </code>
                        </div>
                        <button
                            onClick={() => setCreatedKey(null)}
                            className="text-muted hover:text-foreground"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <button
                        onClick={() => copyToClipboard(createdKey)}
                        className="btn btn-secondary mt-4"
                    >
                        Copy to Clipboard
                    </button>
                </div>
            )}

            {/* API Keys List */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4">Your API Keys</h2>

                {apiKeys === undefined ? (
                    <div className="text-muted animate-pulse">Loading keys...</div>
                ) : apiKeys.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <p className="text-muted mb-4">No API keys yet</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary"
                        >
                            Create Your First Key
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {apiKeys.map((key) => (
                            <div
                                key={key._id}
                                className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                            >
                                <div className="flex-1">
                                    <p className="font-medium">{key.name}</p>
                                    <div className="flex items-center gap-4 text-sm text-muted mt-1">
                                        <code className="font-mono">{key.keyPrefix}...••••••••</code>
                                        <span>•</span>
                                        <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                                        {key.lastUsedAt && (
                                            <>
                                                <span>•</span>
                                                <span>Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRevokeKey(key._id)}
                                    className="btn btn-ghost text-error hover:bg-error/10"
                                >
                                    Revoke
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Key Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="card w-full max-w-md animate-fadeIn">
                        <h2 className="text-xl font-bold mb-4">Create New API Key</h2>
                        <p className="text-muted text-sm mb-4">
                            Give your API key a descriptive name to help you remember what it&apos;s used for.
                        </p>
                        <input
                            type="text"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            placeholder="e.g., Production Server, Local Development"
                            className="input mb-4"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewKeyName("");
                                }}
                                className="btn btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateKey}
                                disabled={!newKeyName.trim() || isCreating}
                                className="btn btn-primary flex-1"
                            >
                                {isCreating ? "Creating..." : "Create Key"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
