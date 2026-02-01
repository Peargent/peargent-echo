import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api, Id } from "@/lib/convex";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface AuthResult {
  userId: string;
  apiKeyId: string;
  permissions: string[];
  credits: number;
}

/**
 * Validate API key and return user info
 */
async function validateApiKey(request: NextRequest): Promise<AuthResult | null> {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  
  const apiKey = authHeader.slice(7);
  
  try {
    const result = await convex.action(api.keys.validateApiKey, { apiKey });
    return result as AuthResult | null;
  } catch {
    return null;
  }
}

/**
 * POST /api/v1/search - Semantic search memories
 * 
 * Body:
 *   - query: string (required)
 *   - limit: number (optional, default 10)
 *   - agentId: string (optional)
 *   - runId: string (optional)
 *   - includeGraph: boolean (optional) - Include related memories
 */
export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request);
  
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing API key" },
      { status: 401 }
    );
  }
  
  if (!auth.permissions.includes("read")) {
    return NextResponse.json(
      { error: "Forbidden", message: "API key does not have read permission" },
      { status: 403 }
    );
  }
  
  try {
    const body = await request.json();
    
    if (!body.query || typeof body.query !== "string") {
      return NextResponse.json(
        { error: "Bad Request", message: "query is required and must be a string" },
        { status: 400 }
      );
    }
    
    const result = await convex.action(api.memories.searchMemories, {
      userId: auth.userId as Id<"users">,
      query: body.query,
      limit: Math.min(body.limit || 10, 50),
      agentId: body.agentId,
      runId: body.runId,
      includeGraph: body.includeGraph || false,
    });
    
    // Update last used timestamp
    await convex.mutation(api.keys.updateApiKeyLastUsed, {
      keyId: auth.apiKeyId as Id<"apiKeys">,
    });
    
    return NextResponse.json({
      success: true,
      data: result,
      usage: { credits: 1 },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to search memories";
    
    if (message.includes("Insufficient credits")) {
      return NextResponse.json(
        { error: "Payment Required", message },
        { status: 402 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
