import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword, verifyPassword, generateSessionToken } from "./lib/crypto";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";

// Convex Auth setup for OAuth providers
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub, Google],
});

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Get current OAuth user from Convex Auth session
 */
export const getOAuthUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      image: user.image,
      tokensProcessed: user.tokensProcessed ?? 0,
      searchesMade: user.searchesMade ?? 0,
      memoriesStored: user.memoriesStored ?? 0,
    };
  },
});


/**
 * Sign up a new user with email and password
 */
export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const passwordHash = await hashPassword(args.password);

    // Create user
    const userId = await ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      name: args.name,
      passwordHash,
      tokensProcessed: 0,
      searchesMade: 0,
      memoriesStored: 0,
      createdAt: Date.now(),
    });

    // Create session
    const token = generateSessionToken();
    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: Date.now() + SESSION_DURATION_MS,
      createdAt: Date.now(),
    });

    return { userId, token };
  },
});

/**
 * Sign in with email and password
 */
export const signInWithPassword = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user || !user.passwordHash) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isValid = await verifyPassword(args.password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // Create session
    const token = generateSessionToken();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: Date.now() + SESSION_DURATION_MS,
      createdAt: Date.now(),
    });

    return { userId: user._id, token };
  },
});

/**
 * Sign out - invalidate session (for email/password auth)
 */
export const signOutWithToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

/**
 * Get current user from session token
 */
export const getCurrentUser = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      return null;
    }

    // Check if session expired
    if (session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

    // Don't return password hash
    const { passwordHash, ...safeUser } = user;
    return {
      ...safeUser,
      tokensProcessed: user.tokensProcessed ?? 0,
      searchesMade: user.searchesMade ?? 0,
      memoriesStored: user.memoriesStored ?? 0,
    };
  },
});

/**
 * Validate session and return user ID
 */
export const validateSession = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    return { userId: session.userId };
  },
});
