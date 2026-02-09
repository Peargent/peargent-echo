// import OpenAI from "openai"; // Removed as we are using fetch directly

// OpenAI client removed


/**
 * Generate embedding for a text string using Cohere via OpenAI SDK
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = getCohereKey();
  
  const response = await fetch("https://api.cohere.com/v1/embed", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Client-Name": "peargent-echo"
    },
    body: JSON.stringify({
      texts: [text],
      model: "embed-english-v3.0",
      input_type: "search_document"
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cohere API Error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.embeddings[0]; // Cohere v3 returns array of floats directly for float embedding type
}

/**
 * Memory classification result
 */
export interface MemoryClassification {
  category: "persistent" | "ephemeral" | "irrelevant";
  reason: string;
  shouldStore: boolean;
}

/**
 * Classify whether a memory should be stored
 */
/**
 * Classify whether a memory should be stored
 */
export async function classifyMemory(content: string): Promise<MemoryClassification> {
  const apiKey = getCohereKey();
  
  const prompt = `You are a strict Memory Gatekeeper for an AI assistant.
Your goal is to decide if the user's input contains PERMANENT, VALUABLE information worth storing in long-term memory.

Input: "${content}"

Rules:
1. STORE ("persistent") ONLY if the input contains:
   - Explicit user preferences ("I like dark mode")
   - Personal facts ("My name is Tarun")
   - Specific future plans/goals ("I want to learn Rust")
   - Important constraints ("Don't use Tailwind")
2. IGNORE ("irrelevant") if the input is:
   - Casual chitchat ("Hello", "How are you", "Cool", "Thanks")
   - Immediate/transient requests ("Write code for this", "Fix this bug")
   - Questions without factual content ("What is the weather?")
   - Temporary states ("I'm tired")

Respond in JSON:
{
  "category": "persistent" | "irrelevant",
  "reason": "Short explanation",
  "shouldStore": boolean
}`;

  try {
    const response = await fetch("https://api.cohere.com/v2/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Client-Name": "peargent-echo"
      },
      body: JSON.stringify({
        model: "command-r-08-2024",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
        throw new Error(`Cohere Chat API Error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const text = data.message.content[0].text || "{}";
    const parsed = JSON.parse(text);
    
    console.log("Classification result for:", content, parsed);
    
    return {
      category: parsed.category === "persistent" ? "persistent" : "irrelevant",
      reason: parsed.reason || "AI decision",
      shouldStore: parsed.category === "persistent",
    };
  } catch (error) {
    console.error("Classification failed, defaulting to store", error);
    // Fail safe: Store it if we can't decide, better to have it than lose it
    return {
      category: "persistent",
      reason: "Error in classification",
      shouldStore: true,
    };
  }
}

/**
 * Analyze how to integrate new memory with existing similar memory
 */
export async function analyzeMemoryIntegration(
  newContent: string,
  existingContent: string
): Promise<{
    action: "add" | "update" | "merge" | "ignore";
    reason: string;
    refinedContent?: string; // The content to write (for update/merge)
}> {
    const apiKey = getCohereKey();
    
    const prompt = `You are a Memory Manager.
We have a NEW piece of information and an EXISTING memory that is semantically similar.
Decide how to handle the new information to keep the memory bank minimal and accurate.

Existing Memory: "${existingContent}"
New Information: "${newContent}"

Rules:
1. IGNORE if the New Information is already fully contained in Existing Memory (Duplicate).
2. UPDATE if the New Information CONTRADICTS or UPDATES the Existing Memory (e.g., "I moved to NY" updates "I live in SF").
3. MERGE if the New Information adds NEW DETAILS to the Existing Memory without contradiction.
4. ADD if the New Information is DISTINCT enough to be its own separate memory (rare, usually Merge).

For UPDATE or MERGE, provide the "refinedContent" which is the concise, combined truth.

Respond in JSON:
{
  "action": "add" | "update" | "merge" | "ignore",
  "reason": "Explanation",
  "refinedContent": "The final text to store (required for update/merge)"
}`;

    try {
        const response = await fetch("https://api.cohere.com/v2/chat", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "X-Client-Name": "peargent-echo"
            },
            body: JSON.stringify({
                model: "command-r-08-2024",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.1,
                response_format: { type: "json_object" }
            }),
        });

        if (!response.ok) {
            throw new Error(`Cohere Chat API Error: ${response.status} ${await response.text()}`);
        }

        const data = await response.json();
        const text = data.message.content[0].text || "{}";
        const parsed = JSON.parse(text);
        
        return {
            action: parsed.action || "add",
            reason: parsed.reason || "AI decision",
            refinedContent: parsed.refinedContent
        };
    } catch (error) {
        console.error("Integration analysis failed", error);
        return { action: "add", reason: "Error in analysis" };
    }
}

/**
 * Profile update result
 */
export interface ProfileUpdate {
  staticFacts: string[];     // New static facts to add
  dynamicContext: string[];  // New dynamic context to add/update
}

/**
 * Extract profile updates from new memory content
 */
export async function extractProfileUpdate(
  content: string,
  existingStatic: string[],
  existingDynamic: string[]
): Promise<ProfileUpdate> {
  const apiKey = getCohereKey();
  
  const prompt = `Extract user profile information from this text.

Static facts are PERMANENT: name, age, profession, location, skills, preferences (e.g., "User is 20 years old", "Prefers dark mode")
Dynamic context is TEMPORARY: current state, ongoing projects, recent interests (e.g., "Learning Rust", "Working on a startup")

Existing static facts:
${existingStatic.map(f => `- ${f}`).join('\n') || "None"}

Existing dynamic context:
${existingDynamic.map(c => `- ${c}`).join('\n') || "None"}

Rules:
1. Only extract NEW information not already in existing facts/context
2. If new info contradicts existing, include it as an update
3. Be concise - use short phrases
4. Return empty arrays if nothing new to add

Respond in JSON:
{
  "staticFacts": ["new fact 1", "new fact 2"],
  "dynamicContext": ["new context 1"]
}

Text to analyze:
"${content}"`;

  try {
    const response = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "X-Client-Name": "peargent-echo"
        },
        body: JSON.stringify({
            model: "command-r-08-2024",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            response_format: { type: "json_object" }
        }),
    });

    if (!response.ok) {
        throw new Error(`Cohere Chat API Error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const text = data.message.content[0].text || "{}";
    const parsed = JSON.parse(text);
    return {
      staticFacts: parsed.staticFacts || [],
      dynamicContext: parsed.dynamicContext || [],
    };
  } catch (error) {
    console.error("Profile extraction failed:", error);
    return {
      staticFacts: [],
      dynamicContext: [],
    };
  }
}

/**
 * Extract entities and facts from text using Gemini LLM
 */
export async function extractMemoryInfo(content: string): Promise<{
  entities: Array<{ name: string; type: string }>;
  facts: string[];
  importance: number;
}> {
  const apiKey = getCohereKey();

  const prompt = `Analyze the given text and extract:
1. Entities: Important people, places, concepts, or things mentioned
2. Facts: Key factual statements that should be remembered
3. Importance: A score from 0 to 1 indicating how important this information is to remember

Respond in this exact JSON format:
{
  "entities": [{"name": "entity name", "type": "person|place|concept|organization|thing"}],
  "facts": ["fact 1", "fact 2"],
  "importance": 0.7
}

Text to analyze:
${content}`;

  try {
    const response = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "X-Client-Name": "peargent-echo"
        },
        body: JSON.stringify({
            model: "command-r-08-2024",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            response_format: { type: "json_object" }
        }),
    });

    if (!response.ok) {
        throw new Error(`Cohere Chat API Error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const text = data.message.content[0].text || "{}";
    const parsed = JSON.parse(text);
    return {
      entities: parsed.entities || [],
      facts: parsed.facts || [],
      importance: Math.min(1, Math.max(0, parsed.importance || 0.5)),
    };
  } catch (error) {
    console.error("Info extraction failed:", error);
    return {
      entities: [],
      facts: [],
      importance: 0.5,
    };
  }
}

/**
 * Find related memories and suggest relationship types
 */
export async function findMemoryRelationships(
  newContent: string,
  existingMemories: Array<{ id: string; content: string }>
): Promise<Array<{ memoryId: string; type: "extends" | "contradicts" | "relates_to"; strength: number }>> {
  if (existingMemories.length === 0) return [];
  
  const apiKey = getCohereKey();

  const memorySummary = existingMemories
    .slice(0, 10) // Limit to 10 for context length
    .map((m, i) => `[${i}] "${m.content.slice(0, 100)}"`)
    .join('\n');

  const prompt = `Identify relationships between a new memory and existing memories.

Relationship types:
- "extends": New info adds to or elaborates on existing memory
- "contradicts": New info conflicts with or updates existing memory
- "relates_to": Topics are connected but neither extends nor contradicts

Existing memories:
${memorySummary}

New memory:
"${newContent}"

For each related memory, respond in JSON:
{
  "relationships": [
    {"index": 0, "type": "extends", "strength": 0.8},
    {"index": 2, "type": "relates_to", "strength": 0.5}
  ]
}

Only include memories with clear relationships. Use strength 0-1 (higher = stronger connection).`;

  try {
    const response = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "X-Client-Name": "peargent-echo"
        },
        body: JSON.stringify({
            model: "command-r-08-2024",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            response_format: { type: "json_object" }
        }),
    });

    if (!response.ok) {
        throw new Error(`Cohere Chat API Error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const text = data.message.content[0].text || "{}";
    const parsed = JSON.parse(text);
    
    return (parsed.relationships || [])
      .filter((r: { index: number }) => r.index >= 0 && r.index < existingMemories.length)
      .map((r: { index: number; type: string; strength: number }) => ({
        memoryId: existingMemories[r.index].id,
        type: r.type as "extends" | "contradicts" | "relates_to",
        strength: Math.min(1, Math.max(0, r.strength || 0.5)),
      }));
  } catch (error) {
    console.error("Relationship finding failed:", error);
    return [];
  }
}

// Helper to get API key (moved to top level if not already there, ensuring availability)
function getCohereKey(): string {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    throw new Error("COHERE_API_KEY environment variable is not set");
  }
  return apiKey;
}

/**
 * Calculate semantic similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Embeddings must have the same dimensions");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
