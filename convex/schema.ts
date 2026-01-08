import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    title: v.string(),
    userId: v.string(),
    isArchived: v.boolean(),
    parentDocument: v.optional(v.id("documents")),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_parent", ["userId", "parentDocument"]),
  aiSettings: defineTable({
    userId: v.string(),
    activeProvider: v.optional(v.string()), // Optional for migration
    activeModel: v.optional(v.string()),

    // Encrypted keys for each provider
    openaiKey: v.optional(v.string()),
    anthropicKey: v.optional(v.string()),
    googleKey: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  userStorage: defineTable({
    userId: v.string(),
    bytesUsed: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  files: defineTable({ // [NEW] Table to track uploaded files
    name: v.string(),
    type: v.string(), // MIME type
    url: v.string(),
    userId: v.string(),
    size: v.number(),
    documentId: v.optional(v.id("documents")),
    documentIds: v.optional(v.array(v.id("documents"))), // [NEW] Support multiple docs
    checksum: v.optional(v.string()), // [NEW] Content hash for deduplication
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_document", ["userId", "documentId"])
    .index("by_checksum", ["userId", "checksum"]), // [NEW] Fast lookup for dupes
  pageShares: defineTable({
    documentId: v.id("documents"),
    userId: v.string(), // Clerk user ID or Email for pending invites
    email: v.optional(v.string()), // For display purposes
    role: v.string(), // "full_access" | "can_edit" | "can_view"
    grantedBy: v.string(),
    grantedAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_user", ["userId"])
    .index("by_document_user", ["documentId", "userId"]),
});
