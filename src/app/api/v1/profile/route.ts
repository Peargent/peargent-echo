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
 * GET /api/v1/profile - Get user profile with optional search
 * 
 * Query params:
 *   - q: Search query (optional) - if provided, also returns relevant memories
 *   - limit: Max results (optional, default 5)
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
    const query = searchParams.get("q") || undefined;
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    
    const result = await convex.action(api.profiles.profile, {
      userId: auth.userId as Id<"users">,
      query,
      limit: Math.min(limit, 20),
    });
    
    // Update last used timestamp
    await convex.mutation(api.keys.updateApiKeyLastUsed, {
      keyId: auth.apiKeyId as Id<"apiKeys">,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        profile: {
          static: result.profile.staticFacts,
          dynamic: result.profile.dynamicContext,
          updatedAt: result.profile.updatedAt,
        },
        searchResults: result.searchResults,
      },
      usage: { credits: 0 }, // Profile fetch is free
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get profile";
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/profile/dynamic - Clear dynamic context
 */
export async function DELETE(request: NextRequest) {
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
    await convex.action(api.profiles.clearDynamicContext, {
      userId: auth.userId as Id<"users">,
    });
    
    return NextResponse.json({
      success: true,
      message: "Dynamic context cleared",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to clear context";
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
