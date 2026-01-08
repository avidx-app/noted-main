"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const inviteUser = action({
    args: {
        email: v.string(),
        documentId: v.id("documents"),
        role: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // We need CLERK_SECRET_KEY in env variables
        const clerkSecretKey = process.env.CLERK_SECRET_KEY;
        if (!clerkSecretKey) {
            throw new Error("Missing CLERK_SECRET_KEY");
        }

        // 1. Check if user exists in Clerk
        // We use fetch because we are in V8 runtime (or node runtime, but fetch is standard)
        // Clerk API: GET /v1/users?email_address=...
        const usersResponse = await fetch(
            `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(args.email)}`,
            {
                headers: {
                    Authorization: `Bearer ${clerkSecretKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!usersResponse.ok) {
            throw new Error("Failed to check user existence in Clerk");
        }

        const users = await usersResponse.json();
        let userId = null;

        if (users && users.length > 0) {
            // User exists
            userId = users[0].id;
        } else {
            // User does not exist, send invitation
            // POST /v1/invitations
            const inviteResponse = await fetch(`https://api.clerk.com/v1/invitations`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${clerkSecretKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email_address: args.email,
                    public_metadata: {
                        invited_to_document_id: args.documentId,
                        role: args.role
                    },
                    // You can create a redirect_url here to point to the specific document
                    redirect_url: `${process.env.CONVEX_SITE_URL}/documents/${args.documentId}` // assuming site url env exists or hardcode
                })
            });

            if (!inviteResponse.ok) {
                // If invitation fails (e.g. already invited), maybe we just proceed?
                // Or we throw. Let's log and proceed with "pending" access.
                console.error("Clerk invitation failed", await inviteResponse.text());
            }

            // We don't have a userId yet. We use email as the ID for the share record
            // similar to our MVP plan.
            userId = args.email;
        }

        // 2. Grant access internally
        await ctx.runMutation(internal.pageShares.grantAccess, {
            documentId: args.documentId,
            email: args.email,
            role: args.role,
            userId: userId
        });

        return { success: true, userId };
    },
});
