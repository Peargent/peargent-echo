"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";

export default function MemoriesPage() {
    const [token, setToken] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        setToken(localStorage.getItem("peargent_echo_token"));
    }, []);

    const user = useQuery(api.auth.getCurrentUser, token ? { token } : "skip");
    const memories = useQuery(
        api.memories.listMemories,
        user ? { userId: user._id, limit: 50 } : "skip"
    );

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
                    <h1 className="text-2xl font-bold mb-2">Memories</h1>
                    <p className="text-muted">Browse and search your stored memories.</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="card mb-6">
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search memories semantically..."
                        className="input flex-1"
                    />
                    <button
                        onClick={() => {
                            // TODO: Implement search action call
                            setIsSearching(true);
                            setTimeout(() => setIsSearching(false), 1000);
                        }}
                        disabled={isSearching || !searchQuery.trim()}
                        className="btn btn-primary"
                    >
                        {isSearching ? "Searching..." : "Search"}
                    </button>
                </div>
                <p className="text-xs text-muted mt-2">
                    Search uses semantic understanding - try natural language queries like &quot;user preferences&quot; or &quot;what did they say about...&quot;
                </p>
            </div>

            {/* Memories List */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4">All Memories</h2>

                {memories === undefined ? (
                    <div className="text-muted animate-pulse">Loading memories...</div>
                ) : memories.items.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium mb-2">No memories yet</h3>
                        <p className="text-muted mb-4 max-w-sm mx-auto">
                            Start adding memories through the API to see them here.
                        </p>
                        <div className="bg-secondary rounded-lg p-4 max-w-md mx-auto text-left">
                            <p className="text-xs text-muted mb-2">Quick example:</p>
                            <code className="text-sm text-muted">
                                {`curl -X POST /api/v1/memories \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -d '{"content": "User likes Python"}'`}
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
    );
}

interface MemoryData {
    _id: string;
    content: string;
    entities: Array<{ name: string; type: string }>;
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
        <div className="p-4 bg-secondary rounded-lg">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <p className="text-sm mb-2 whitespace-pre-wrap">
                        {isExpanded || memory.content.length <= 200
                            ? memory.content
                            : `${memory.content.slice(0, 200)}...`}
                    </p>
                    {memory.content.length > 200 && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-xs text-primary hover:underline"
                        >
                            {isExpanded ? "Show less" : "Show more"}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{
                            backgroundColor: `hsl(${memory.importance * 120}, 70%, 50%)`,
                        }}
                        title={`Importance: ${(memory.importance * 100).toFixed(0)}%`}
                    />
                </div>
            </div>

            {/* Entities */}
            {memory.entities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {memory.entities.map((entity, i) => (
                        <span
                            key={i}
                            className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary"
                        >
                            {entity.name}
                            <span className="text-primary/60 ml-1">({entity.type})</span>
                        </span>
                    ))}
                </div>
            )}

            {/* Facts */}
            {memory.facts.length > 0 && (
                <div className="mt-3">
                    <p className="text-xs text-muted mb-1">Extracted facts:</p>
                    <ul className="list-disc list-inside text-xs text-muted space-y-1">
                        {memory.facts.slice(0, isExpanded ? undefined : 2).map((fact, i) => (
                            <li key={i}>{fact}</li>
                        ))}
                        {!isExpanded && memory.facts.length > 2 && (
                            <li className="text-primary cursor-pointer" onClick={() => setIsExpanded(true)}>
                                +{memory.facts.length - 2} more...
                            </li>
                        )}
                    </ul>
                </div>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted">
                <span>Created {new Date(memory.createdAt).toLocaleString()}</span>
                {memory.agentId && <span>Agent: {memory.agentId}</span>}
                {memory.source && <span>Source: {memory.source}</span>}
                <span>Decay: {(memory.decay * 100).toFixed(0)}%</span>
            </div>
        </div>
    );
}
