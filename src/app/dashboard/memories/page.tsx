"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/lib/convex";

export default function MemoriesPage() {
    const [token, setToken] = useState<string | null>(null);
    // const [searchQuery, setSearchQuery] = useState("");
    // const [isSearching, setIsSearching] = useState(false);
    const { isAuthenticated: isOAuthAuthenticated } = useConvexAuth();

    useEffect(() => {
        setToken(localStorage.getItem("peargent_echo_token"));
    }, []);

    // Get user from either auth method
    const emailPasswordUser = useQuery(api.auth.getCurrentUser, token ? { token } : "skip");
    const oauthUser = useQuery(api.auth.getOAuthUser, isOAuthAuthenticated ? {} : "skip");
    const user = token ? emailPasswordUser : oauthUser;

    const memories = useQuery(
        api.memories.listMemories,
        user ? { userId: user._id, limit: 50 } : "skip"
    );

    if (!user) {
        return (
            <div className="p-8">
                <div className="animate-pulse text-foreground-muted">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-full flex flex-col bg-background font-sans">
            {/* Grid Background */}
            <div className="absolute inset-0 pointer-events-none z-0 grid-lines opacity-[0.03]" />

            {/* Header Area - Clean & Minimal */}
            <header className="h-20 px-8 flex items-end justify-between border-b border-border/40 relative z-10">
                <div className="pb-6">
                    <h1 className="text-sm font-medium tracking-widest uppercase opacity-70">
                        Memories
                    </h1>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-auto relative z-10 p-10">
                {/* Search Bar - Commented Out */}
                {/* <div className="card mb-6 bg-transparent border-0 p-0 shadow-none">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search memories semantically..."
                            className="input flex-1 bg-secondary/20 border-border/40 focus:border-[#4ade80]/50 h-12"
                        />
                        <button
                            onClick={() => {
                                setIsSearching(true);
                                setTimeout(() => setIsSearching(false), 1000);
                            }}
                            disabled={isSearching || !searchQuery.trim()}
                            className="px-6 bg-[#4ade80] text-black font-medium text-sm hover:bg-[#4ade80]/90 transition-colors rounded-sm"
                        >
                            {isSearching ? "SEARCHING..." : "SEARCH"}
                        </button>
                    </div>
                    <p className="text-xs text-foreground-muted mt-3 ml-1">
                        Search uses semantic understanding - try natural language queries like &quot;user preferences&quot;
                    </p>
                </div> */}

                {/* Memories List */}
                <div className="card bg-transparent border-0 p-0 shadow-none">
                    <h2 className="text-lg font-medium mb-6">All Memories</h2>

                    {memories === undefined ? (
                        <div className="text-foreground-muted animate-pulse">Loading memories...</div>
                    ) : memories.items.length === 0 ? (
                        <div className="text-center py-20 border border-border/40 border-dashed rounded-lg bg-secondary/5">
                            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium mb-2">No memories yet</h3>
                            <p className="text-foreground-muted mb-6 max-w-sm mx-auto">
                                Start adding memories through the API to see them here.
                            </p>
                            <div className="bg-[#050505] border border-border/40 rounded-lg p-6 max-w-md mx-auto text-left">
                                <div className="flex items-center gap-1.5 mb-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                </div>
                                <code className="text-xs font-mono text-foreground-muted block leading-relaxed">
                                    <span className="text-purple-400">curl</span> -X POST /api/v1/memories \<br />
                                    &nbsp;&nbsp;-H <span className="text-green-400">"Authorization: Bearer YOUR_KEY"</span> \<br />
                                    &nbsp;&nbsp;-d <span className="text-yellow-400">{'\'{"content": "User likes Python"}\''}</span>
                                </code>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {memories.items.map((memory) => (
                                <MemoryCard key={memory._id} memory={memory} />
                            ))}
                            {memories.hasMore && (
                                <div className="text-center pt-4">
                                    <button className="btn btn-secondary">Load More</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface MemoryData {
    _id: string;
    content: string;
    entities: { name: string; type: string }[];
    facts: string[];
    importance: number;
    decay: number;
    agentId?: string;
    source?: string;
    createdAt: number;
    updatedAt: number;
}

function MemoryCard({ memory }: { memory: MemoryData }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="group py-4 border-b border-border/40 hover:bg-secondary/5 transition-colors -mx-4 px-4">
            <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0 space-y-2">
                    {/* Content */}
                    <div className="text-sm leading-relaxed text-foreground/90 font-light">
                        {isExpanded || memory.content.length <= 200
                            ? memory.content
                            : `${memory.content.slice(0, 200)}...`}

                        {memory.content.length > 200 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="ml-2 text-xs text-[#4ade80] hover:underline font-mono"
                            >
                                {isExpanded ? "[-]" : "[+]"}
                            </button>
                        )}
                    </div>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-4 text-[10px] text-foreground-muted font-mono uppercase tracking-wider pt-1">
                        <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
                        {yearOfDate(memory.createdAt) !== yearOfDate(Date.now()) && <span>• {yearOfDate(memory.createdAt)}</span>}

                        <span className="w-1 h-1 rounded-full bg-foreground/20"></span>
                        <span>{new Date(memory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                        {memory.agentId && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-foreground/20"></span>
                                <span>AGENT: {memory.agentId}</span>
                            </>
                        )}

                        {/* Importance Indicator */}
                        <div className="ml-auto flex items-center gap-2" title={`Importance: ${(memory.importance * 100).toFixed(0)}%`}>
                            <div className="h-1 w-16 bg-foreground/10 overflow-hidden">
                                <div
                                    className="h-full bg-[#4ade80]"
                                    style={{ width: `${memory.importance * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Entities - subtle tags */}
                    {(memory.entities.length > 0 || memory.facts.length > 0) && isExpanded && (
                        <div className="mt-4 pt-3 border-t border-border/20 grid grid-cols-2 gap-4">
                            {memory.entities.length > 0 && (
                                <div>
                                    <span className="text-[10px] text-foreground-muted uppercase tracking-wider block mb-2">Entities</span>
                                    <div className="flex flex-wrap gap-2">
                                        {memory.entities.map((entity, i) => (
                                            <span
                                                key={i}
                                                className="px-1.5 py-0.5 text-[10px] border border-border/40 text-foreground-muted/80 backdrop-blur-sm"
                                            >
                                                {entity.name}
                                                <span className="opacity-50 ml-1">:{entity.type}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {memory.facts.length > 0 && (
                                <div>
                                    <span className="text-[10px] text-foreground-muted uppercase tracking-wider block mb-2">Facts</span>
                                    <ul className="space-y-1">
                                        {memory.facts.map((fact, i) => (
                                            <li key={i} className="text-[11px] text-foreground-muted truncate pl-2 border-l border-border/20">
                                                {fact}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function yearOfDate(ms: number) {
    return new Date(ms).getFullYear();
}
