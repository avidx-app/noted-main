import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Check Adology integration status
 */
export const getAdologyStatus = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const userId = identity.subject;
        const config = await ctx.db
            .query("coworkerConfig")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!config) {
            return { enabled: false, connected: false };
        }

        return {
            enabled: config.adologyEnabled ?? false,
            connected: !!config.adologyTokens?.accessToken,
        };
    },
});

/**
 * Enable/Disable Adology integration
 */
export const setAdologyEnabled = mutation({
    args: { enabled: v.boolean() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const userId = identity.subject;
        const config = await ctx.db
            .query("coworkerConfig")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!config) throw new Error("Configuration not found");

        const updates: any = {
            adologyEnabled: args.enabled,
            updatedAt: Date.now(),
        };

        // If disabling, also clear tokens
        if (!args.enabled) {
            updates.adologyTokens = undefined;
        }

        await ctx.db.patch(config._id, updates);
        return true;
    },
});

/**
 * Save OAuth tokens
 */
export const saveAdologyTokens = mutation({
    args: {
        accessToken: v.string(),
        refreshToken: v.optional(v.string()),
        expiresIn: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const userId = identity.subject;
        const config = await ctx.db
            .query("coworkerConfig")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!config) throw new Error("Configuration not found");

        const expiresAt = args.expiresIn ? Date.now() + args.expiresIn * 1000 : undefined;

        await ctx.db.patch(config._id, {
            adologyEnabled: true,
            adologyTokens: {
                accessToken: args.accessToken,
                refreshToken: args.refreshToken,
                expiresAt,
            },
            adologyCodeVerifier: undefined, // Clear usage of verifier
            updatedAt: Date.now(),
        });

        return true;
    },
});

/**
 * Clear tokens (disconnect)
 */
export const clearAdologyTokens = mutation({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const userId = identity.subject;
        const config = await ctx.db
            .query("coworkerConfig")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!config) throw new Error("Configuration not found");

        await ctx.db.patch(config._id, {
            adologyTokens: undefined,
            adologyEnabled: false,
            updatedAt: Date.now(),
        });

        return true;
    },
});

/**
 * Save PKCE code verifier
 */
export const saveCodeVerifier = mutation({
    args: { verifier: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const userId = identity.subject;
        const config = await ctx.db
            .query("coworkerConfig")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (config) {
            await ctx.db.patch(config._id, {
                adologyCodeVerifier: args.verifier,
                updatedAt: Date.now(),
            });
        }
    },
});

/**
 * Get and clear PKCE code verifier
 */
export const getCodeVerifier = mutation({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const userId = identity.subject;
        const config = await ctx.db
            .query("coworkerConfig")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!config || !config.adologyCodeVerifier) {
            return null;
        }

        const verifier = config.adologyCodeVerifier;

        // Optionally keep it until token exchange is confirmed, 
        // but typically we read it once.
        return verifier;
    },
});
