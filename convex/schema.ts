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

  // Marketing Co-worker Agent Configuration
  coworkerConfig: defineTable({
    userId: v.string(),

    // Agent status
    isActive: v.boolean(),

    // Persona configuration
    persona: v.object({
      name: v.optional(v.string()), // e.g., "Max"
      systemPrompt: v.string(), // Custom instructions
      tone: v.string(), // professional, casual, creative
      focusAreas: v.array(v.string()), // Content strategy, Ads, Social, etc.
    }),

    // Linked instructions document
    instructionsDocId: v.optional(v.id("documents")),

    // Adology MCP integration
    adologyEnabled: v.optional(v.boolean()),
    adologyTokens: v.optional(v.object({
      accessToken: v.string(),
      refreshToken: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
    })),
    adologyCodeVerifier: v.optional(v.string()), // PKCE verifier

    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Marketing Co-worker Chat Messages
  coworkerMessages: defineTable({
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    reasoning: v.optional(v.string()), // Store reasoning tokens
    toolInvocations: v.optional(v.any()), // Store tool calls and results
    parts: v.optional(v.any()), // [NEW] Store full interleaved message parts
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_time", ["userId", "createdAt"]),
});
