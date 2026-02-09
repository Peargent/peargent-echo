"use client";

import { useState } from "react";

type Tab = "rest" | "typescript" | "python";

export default function DocsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("rest");

    return (
        <div className="min-h-screen p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Documentation</h1>
                <p className="text-foreground-muted">
                    Learn how to integrate Echo with your AI agents.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-8 bg-foreground/5 p-1 rounded-lg w-fit">
                {[
                    { id: "rest" as Tab, label: "REST API" },
                    { id: "typescript" as Tab, label: "TypeScript" },
                    { id: "python" as Tab, label: "Python" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === tab.id
                            ? "bg-foreground text-background"
                            : "text-foreground-muted hover:text-foreground"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-8">
                {activeTab === "rest" && <RestDocs />}
                {activeTab === "typescript" && <TypeScriptDocs />}
                {activeTab === "python" && <PythonDocs />}
            </div>
        </div>
    );
}

function CodeBlock({ title, code, language = "bash" }: { title: string; code: string; language?: string }) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-lg border border-foreground/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-foreground/5 border-b border-foreground/10">
                <span className="text-sm font-medium text-foreground-muted">{title}</span>
                <button
                    onClick={copyToClipboard}
                    className="text-xs text-foreground-muted hover:text-foreground transition-colors"
                >
                    {copied ? "Copied!" : "Copy"}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
                <code>{code}</code>
            </pre>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            {children}
        </div>
    );
}

function RestDocs() {
    return (
        <>
            <Section title="Base URL">
                <p className="text-foreground-muted mb-4">
                    All API requests should be made to:
                </p>
                <CodeBlock
                    title="Base URL"
                    code="https://echo.peargent.online/api/v1"
                />
            </Section>

            <Section title="Authentication">
                <p className="text-foreground-muted mb-4">
                    Include your API key in the Authorization header:
                </p>
                <CodeBlock
                    title="Header"
                    code='Authorization: Bearer YOUR_API_KEY'
                />
            </Section>

            <Section title="Add Memory">
                <p className="text-foreground-muted mb-4">
                    Store a new memory. Similar memories are automatically merged.
                </p>
                <CodeBlock
                    title="POST /memories"
                    code={`curl -X POST https://echo.peargent.online/api/v1/memories \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
  "content": "I prefer TypeScript over JavaScript.",
  "filter": true,
  "extract": true
}'`}
                />
                <div className="mt-4 p-4 bg-foreground/5 rounded-lg">
                    <h4 className="font-medium mb-2">Options</h4>
                    <table className="w-full text-sm">
                        <tbody className="divide-y divide-foreground/10">
                            <tr><td className="py-2 font-mono text-foreground-muted">content</td><td className="py-2">Required. The memory text.</td></tr>
                            <tr><td className="py-2 font-mono text-foreground-muted">filter</td><td className="py-2">Filter irrelevant content (default: true)</td></tr>
                            <tr><td className="py-2 font-mono text-foreground-muted">extract</td><td className="py-2">Extract entities & facts (default: true)</td></tr>
                            <tr><td className="py-2 font-mono text-foreground-muted">agentId</td><td className="py-2">Optional agent identifier</td></tr>
                            <tr><td className="py-2 font-mono text-foreground-muted">metadata</td><td className="py-2">Optional JSON metadata</td></tr>
                        </tbody>
                    </table>
                </div>
            </Section>

            <Section title="Search Memories">
                <p className="text-foreground-muted mb-4">
                    Semantically search through stored memories.
                </p>
                <CodeBlock
                    title="POST /search"
                    code={`curl -X POST https://echo.peargent.online/api/v1/search \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
  "query": "What programming language does the user prefer?",
  "limit": 10
}'`}
                />
                <div className="mt-4 p-4 bg-foreground/5 rounded-lg">
                    <h4 className="font-medium mb-2">Options</h4>
                    <table className="w-full text-sm">
                        <tbody className="divide-y divide-foreground/10">
                            <tr><td className="py-2 font-mono text-foreground-muted">query</td><td className="py-2">Required. Your search query.</td></tr>
                            <tr><td className="py-2 font-mono text-foreground-muted">limit</td><td className="py-2">Max results (default: 10)</td></tr>
                            <tr><td className="py-2 font-mono text-foreground-muted">includeGraph</td><td className="py-2">Include related memories (default: false)</td></tr>
                        </tbody>
                    </table>
                </div>
            </Section>

            <Section title="Get Profile">
                <p className="text-foreground-muted mb-4">
                    Retrieve the user&apos;s auto-generated profile from stored memories.
                </p>
                <CodeBlock
                    title="GET /profile"
                    code={`curl -X GET https://echo.peargent.online/api/v1/profile \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                />
            </Section>
        </>
    );
}

function TypeScriptDocs() {
    return (
        <>
            <Section title="Installation">
                <CodeBlock title="npm" code="npm install @peargent/echo" />
            </Section>

            <Section title="Quick Start">
                <CodeBlock
                    title="index.ts"
                    language="typescript"
                    code={`import { PeargentEcho } from "@peargent/echo";

const client = new PeargentEcho({
  apiKey: "YOUR_API_KEY"
});

// Add a memory
await client.addMemory("I prefer dark mode in my apps.");

// Search memories
const results = await client.search("user preferences");
console.log(results);

// Get profile
const profile = await client.getProfile();
console.log(profile);`}
                />
            </Section>

            <Section title="API Reference">
                <div className="space-y-6 text-sm">
                    <div className="p-4 bg-foreground/5 rounded-lg">
                        <code className="font-mono font-medium">addMemory(content, options?)</code>
                        <p className="mt-2 text-foreground-muted mb-3">Store a new memory with optional filtering and extraction.</p>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-foreground/10">
                                <tr><td className="py-1.5 font-mono text-foreground-muted w-32">filter?</td><td className="py-1.5">boolean - Filter irrelevant content (default: true)</td></tr>
                                <tr><td className="py-1.5 font-mono text-foreground-muted">extract?</td><td className="py-1.5">boolean - Extract entities & facts (default: true)</td></tr>
                                <tr><td className="py-1.5 font-mono text-foreground-muted">agentId?</td><td className="py-1.5">string - Agent identifier</td></tr>
                                <tr><td className="py-1.5 font-mono text-foreground-muted">runId?</td><td className="py-1.5">string - Conversation run ID</td></tr>
                                <tr><td className="py-1.5 font-mono text-foreground-muted">metadata?</td><td className="py-1.5">object - Custom JSON metadata</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-foreground/5 rounded-lg">
                        <code className="font-mono font-medium">search(query, options?)</code>
                        <p className="mt-2 text-foreground-muted mb-3">Semantically search memories. Returns ranked results with scores.</p>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-foreground/10">
                                <tr><td className="py-1.5 font-mono text-foreground-muted w-32">limit?</td><td className="py-1.5">number - Max results (default: 10)</td></tr>
                                <tr><td className="py-1.5 font-mono text-foreground-muted">includeGraph?</td><td className="py-1.5">boolean - Include related memories (default: false)</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-foreground/5 rounded-lg">
                        <code className="font-mono font-medium">getProfile()</code>
                        <p className="mt-2 text-foreground-muted">Get the auto-generated user profile from stored memories.</p>
                    </div>
                </div>
            </Section>
        </>
    );
}

function PythonDocs() {
    return (
        <>
            <Section title="Installation">
                <CodeBlock title="pip" code="pip install peargent-echo" />
            </Section>

            <Section title="Quick Start">
                <CodeBlock
                    title="main.py"
                    language="python"
                    code={`from peargent_echo import PeargentEcho

client = PeargentEcho(api_key="YOUR_API_KEY")

# Add a memory
client.add_memory("I prefer dark mode in my apps.")

# Search memories
results = client.search("user preferences")
print(results)

# Get profile
profile = client.get_profile()
print(profile)`}
                />
            </Section>

            <Section title="API Reference">
                <div className="space-y-6 text-sm">
                    <div className="p-4 bg-foreground/5 rounded-lg">
                        <code className="font-mono font-medium">add_memory(content, **options)</code>
                        <p className="mt-2 text-foreground-muted mb-3">Store a new memory with optional filtering and extraction.</p>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-foreground/10">
                                <tr><td className="py-1.5 font-mono text-foreground-muted w-32">filter</td><td className="py-1.5">bool - Filter irrelevant content (default: True)</td></tr>
                                <tr><td className="py-1.5 font-mono text-foreground-muted">extract</td><td className="py-1.5">bool - Extract entities & facts (default: True)</td></tr>
                                <tr><td className="py-1.5 font-mono text-foreground-muted">agent_id</td><td className="py-1.5">str - Agent identifier</td></tr>
                                <tr><td className="py-1.5 font-mono text-foreground-muted">run_id</td><td className="py-1.5">str - Conversation run ID</td></tr>
                                <tr><td className="py-1.5 font-mono text-foreground-muted">metadata</td><td className="py-1.5">dict - Custom JSON metadata</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-foreground/5 rounded-lg">
                        <code className="font-mono font-medium">search(query, **options)</code>
                        <p className="mt-2 text-foreground-muted mb-3">Semantically search memories. Returns ranked results with scores.</p>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-foreground/10">
                                <tr><td className="py-1.5 font-mono text-foreground-muted w-32">limit</td><td className="py-1.5">int - Max results (default: 10)</td></tr>
                                <tr><td className="py-1.5 font-mono text-foreground-muted">include_graph</td><td className="py-1.5">bool - Include related memories (default: False)</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-foreground/5 rounded-lg">
                        <code className="font-mono font-medium">get_profile()</code>
                        <p className="mt-2 text-foreground-muted">Get the auto-generated user profile from stored memories.</p>
                    </div>
                </div>
            </Section>
        </>
    );
}
