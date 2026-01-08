// convex/editorSync.ts
// Real-time collaborative editing sync API using @convex-dev/prosemirror-sync

import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import { Id } from "./_generated/dataModel";
import { checkPageAccess } from "./pageShares";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

export const {
    getSnapshot,
    submitSnapshot,
    latestVersion,
    getSteps,
    submitSteps,
} = prosemirrorSync.syncApi({
    // Check if user can read this document (throws if unauthorized)
    checkRead: async (ctx, id) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const userId = identity.subject;
        const documentId = id as Id<"documents">;

        // Get the document
        const document = await ctx.db.get(documentId);
        if (!document) throw new Error("Document not found");

        // Owner can always read
        if (document.userId === userId) return;

        // Check shared access
        const access = await checkPageAccess(ctx as any, documentId, userId);
        if (!access.hasAccess) throw new Error("Unauthorized");
    },

    // Check if user can write to this document (throws if unauthorized)
    checkWrite: async (ctx, id) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const userId = identity.subject;
        const documentId = id as Id<"documents">;

        // Get the document
        const document = await ctx.db.get(documentId);
        if (!document) throw new Error("Document not found");

        // Owner can always write
        if (document.userId === userId) return;

        // Check shared access - only "can_edit" or "full_access" can write
        const access = await checkPageAccess(ctx as any, documentId, userId);
        if (!access.hasAccess) throw new Error("Unauthorized");
        if (access.role !== "can_edit" && access.role !== "full_access") {
            throw new Error("Read-only access");
        }
    },
});

// Helper to create a new sync document (called when migrating existing content)
export const createSyncDocument = prosemirrorSync.create;
