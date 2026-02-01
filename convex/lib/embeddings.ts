import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy initialization of Gemini client
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Generate embedding for a text string using Gemini
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: "text-embedding-004" });
  
  const result = await model.embedContent(text);
  const embedding = result.embedding.values;
  
  return embedding;
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
export async function classifyMemory(content: string): Promise<MemoryClassification> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  const prompt = `Classify this text for a persistent memory system.

Categories:
- "persistent": Important facts, preferences, personal info, skills, relationships that should be remembered long-term
- "ephemeral": Temporary states (battery level, current mood, weather), transient info that will change soon
- "irrelevant": Greetings, filler words, system messages, or meaningless content

Respond in JSON:
{
  "category": "persistent" | "ephemeral" | "irrelevant",
  "reason": "brief explanation"
}

Text to classify:
"${content}"`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    return {
      category: parsed.category || "persistent",
      reason: parsed.reason || "",
      shouldStore: parsed.category === "persistent",
    };
  } catch {
    // Default to storing (fail open)
    return {
      category: "persistent",
      reason: "Classification failed, defaulting to store",
      shouldStore: true,
    };
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
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

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
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    return {
      staticFacts: parsed.staticFacts || [],
      dynamicContext: parsed.dynamicContext || [],
    };
  } catch {
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
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

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

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  try {
    const parsed = JSON.parse(responseText);
    return {
      entities: parsed.entities || [],
      facts: parsed.facts || [],
      importance: Math.min(1, Math.max(0, parsed.importance || 0.5)),
    };
  } catch {
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
  
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

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
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    
    return (parsed.relationships || [])
      .filter((r: { index: number }) => r.index >= 0 && r.index < existingMemories.length)
      .map((r: { index: number; type: string; strength: number }) => ({
        memoryId: existingMemories[r.index].id,
        type: r.type as "extends" | "contradicts" | "relates_to",
        strength: Math.min(1, Math.max(0, r.strength || 0.5)),
      }));
  } catch {
    return [];
  }
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
