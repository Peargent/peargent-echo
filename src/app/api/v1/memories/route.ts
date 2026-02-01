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
 * POST /api/v1/memories - Add a new memory
 * 
 * Body:
 *   - content: string (required)
 *   - agentId: string (optional)
 *   - runId: string (optional)
 *   - source: string (optional)
 *   - metadata: any (optional)
 *   - filter: boolean (optional, default true) - Use smart filtering
 *   - extract: boolean (optional, default true) - Extract entities/facts
 *   - updateProfile: boolean (optional, default true) - Update user profile
 */
export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request);
  
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing API key" },
      { status: 401 }
    );
  }
  
  if (!auth.permissions.includes("write")) {
    return NextResponse.json(
      { error: "Forbidden", message: "API key does not have write permission" },
      { status: 403 }
    );
  }
  
  try {
    const body = await request.json();
    
    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json(
        { error: "Bad Request", message: "content is required and must be a string" },
        { status: 400 }
      );
    }
    
    const result = await convex.action(api.memories.addMemory, {
      userId: auth.userId as Id<"users">,
      content: body.content,
      agentId: body.agentId,
      runId: body.runId,
      source: body.source,
      metadata: body.metadata,
      extract: body.extract !== false,
      filter: body.filter !== false,
      updateProfile: body.updateProfile !== false,
    });
    
    // If filtered out, return 200 but indicate it was not stored
    if (result.action === "filtered") {
      return NextResponse.json({
        success: true,
        stored: false,
        action: result.action,
        message: result.message,
        filterReason: result.filterReason,
        usage: { credits: 0 },
      });
    }
    
    // Update last used timestamp
    await convex.mutation(api.keys.updateApiKeyLastUsed, {
      keyId: auth.apiKeyId as Id<"apiKeys">,
    });
    
    return NextResponse.json({
      success: true,
      stored: true,
      data: {
        id: result.id,
        action: result.action,
        profileUpdated: result.profileUpdated,
      },
      message: result.message,
      usage: { credits: 1 },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add memory";
    
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

/**
 * GET /api/v1/memories - List memories
 */
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const agentId = searchParams.get("agentId") || undefined;
    
    const result = await convex.query(api.memories.listMemories, {
      userId: auth.userId as Id<"users">,
      limit: Math.min(limit, 100),
      agentId,
    });
    
    // Update last used timestamp
    await convex.mutation(api.keys.updateApiKeyLastUsed, {
      keyId: auth.apiKeyId as Id<"apiKeys">,
    });
    
    return NextResponse.json({
      success: true,
      data: result.items,
      hasMore: result.hasMore,
      usage: { credits: 0 },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list memories";
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
