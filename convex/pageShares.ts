import { v } from "convex/values";
import { mutation, query, QueryCtx, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to check if user has access to a specific document or its parents
export const checkPageAccess = async (
    ctx: QueryCtx,
    documentId: Id<"documents">,
    userId: string
): Promise<{ hasAccess: boolean; role?: string }> => {
    // 1. Check direct share
    const directShare = await ctx.db
        .query("pageShares")
        .withIndex("by_document_user", (q) =>
            q.eq("documentId", documentId).eq("userId", userId)
        )
        .first();

    if (directShare) {
        return { hasAccess: true, role: directShare.role };
    }

    // 2. Check parent inheritance (recursive)
    const document = await ctx.db.get(documentId);
    if (!document) return { hasAccess: false };

    if (document.parentDocument) {
        return checkPageAccess(ctx, document.parentDocument, userId);
    }

    return { hasAccess: false };
};

// Internal mutation called by the Clerk Action
export const grantAccess = internalMutation({
    args: {
        documentId: v.id("documents"),
        email: v.string(),
        role: v.string(), // "full_access" | "can_edit" | "can_view"
        userId: v.string() // Clerk User ID OR Email (for pending)
    },
    handler: async (ctx, args) => {
        // Note: We don't check identity here because it's an internal mutation called by a trusted Action.
        // The Action performs the auth check (or we should pass the inviter's identity if needed for audit).
        // But grantedBy implies we should know who did it. 
        // Ideally we pass authorized userId from action.

        // For simplicity, we'll fetch the doc owner or just mark it as "system" if we don't pass inviter.
        // Let's assume the action passes the inviter's ID too? 
        // Or we let the action context handle it? Actions run as the user.
        // Wait, internal mutations called from actions: `runMutation`.
        // We can't easily get `ctx.auth.getUserIdentity` inside internal mutation called from action?
        // Actually we can pass it as arg.

        // Let's keep it simple: We check if share exists and update, or insert.

        const existing = await ctx.db
            .query("pageShares")
            .withIndex("by_document_user", (q) =>
                q.eq("documentId", args.documentId).eq("userId", args.userId)
            )
            .first();

        if (existing) {
            return await ctx.db.patch(existing._id, {
                role: args.role,
                grantedAt: Date.now(),
            });
        }

        return await ctx.db.insert("pageShares", {
            documentId: args.documentId,
            userId: args.userId,
            email: args.email,
            role: args.role,
            grantedBy: "system", // distinct from user actions for now, or pass inviter in args
            grantedAt: Date.now(),
        });
    },
});

export const updateShareRole = mutation({
    args: {
        id: v.id("pageShares"),
        role: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const share = await ctx.db.get(args.id);
        if (!share) throw new Error("Share not found");

        const document = await ctx.db.get(share.documentId);
        if (!document) throw new Error("Document not found");

        const isOwner = document.userId === identity.subject;
        if (!isOwner) {
            const access = await checkPageAccess(ctx, share.documentId, identity.subject);
            if (access.role !== "full_access") {
                throw new Error("Unauthorized");
            }
        }

        await ctx.db.patch(args.id, {
            role: args.role,
        });
    },
});

export const removeShare = mutation({
    args: {
        id: v.id("pageShares"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const share = await ctx.db.get(args.id);
        if (!share) throw new Error("Share not found");

        const document = await ctx.db.get(share.documentId);
        if (!document) throw new Error("Document not found");

        const isOwner = document.userId === identity.subject;
        const isSelf = share.userId === identity.subject;

        if (!isOwner && !isSelf) {
            const access = await checkPageAccess(ctx, share.documentId, identity.subject);
            if (access.role !== "full_access") {
                throw new Error("Unauthorized");
            }
        }

        await ctx.db.delete(args.id);
    },
});

export const getPageShares = query({
    args: { documentId: v.id("documents") },
    handler: async (ctx, args) => {
        // Only return shares if user has access to the doc
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Simple check: owner or in the share list (including parents)
        const document = await ctx.db.get(args.documentId);
        if (!document) return [];

        if (document.userId !== identity.subject) {
            const access = await checkPageAccess(ctx, args.documentId, identity.subject);
            if (!access.hasAccess) return [];
        }

        const shares = await ctx.db
            .query("pageShares")
            .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
            .collect();

        return shares;
    },
});

// For sidebar: Get pages shared with me
export const getSharedPages = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const shares = await ctx.db
            .query("pageShares")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .collect();

        const documents = [];
        for (const share of shares) {
            const doc = await ctx.db.get(share.documentId);
            if (doc && !doc.isArchived) {
                documents.push({
                    ...doc,
                    sharedRole: share.role
                });
            }
        }

        return documents;
    },
});
