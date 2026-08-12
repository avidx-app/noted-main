---
name: convex-schema
description: Convex schema conventions for noted-main — `defineSchema`, `defineTable`, the `v.*` validator namespace, index design (`by_<col>`, `by_<col>_<col>`), nullable vs optional fields, and the additive-only migration rule. Use when user asks to "add a table", "add a column", "add an index", "should this be optional or required", or any time `convex/schema.ts` is being touched. Applies implicitly whenever introducing a new table, adding fields to an existing table, or designing query patterns that require a new index.
summary: defineTable, indexes, additive migrations
---

<!--
This is a noted-native skill — there's no heatseeker counterpart (heatseeker is on
MongoDB + mongoose). It documents the patterns already shipped in
`convex/schema.ts` for the documents, aiSettings, userStorage, files,
coworkerMessages, and squadAgents tables.

Companion skill:
- convex-handlers — owns picking query/mutation/action and using `.withIndex(...)`
- error-handling — owns the auth → existence → ownership triad
-->

# Convex Schema

`convex/schema.ts` is the single source of truth for noted's data model. Every table, every column, every index is declared here. No DDL elsewhere.

## The shape

```typescript
// convex/schema.ts (real shipped code, trimmed)
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
    activeProvider: v.optional(v.string()),
    activeModel: v.optional(v.string()),
    openaiKey: v.optional(v.string()),
    anthropicKey: v.optional(v.string()),
    googleKey: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
```

The pattern:

1. `defineSchema({ ... })` is the default export.
2. Each entry is `<tableName>: defineTable({ ...columns }).index(...).index(...)`.
3. Column values are `v.*` validators — they generate both runtime validation and TypeScript types in `_generated/dataModel.d.ts`.
4. Convex automatically adds `_id: Id<"<table>">` and `_creationTime: number` to every row — never declare these yourself.

## Naming

| Thing | Rule | Examples |
|---|---|---|
| Table name | camelCase plural noun | `documents`, `files`, `aiSettings`, `coworkerMessages`, `squadAgents` |
| Column name | camelCase | `userId`, `parentDocument`, `isArchived`, `coverImage`, `createdAt` |
| Boolean column | `is<Adjective>` or `has<Thing>` | `isArchived`, `isPublished`, `hasGoogleKey` |
| Foreign key | name of referenced table singular | `parentDocument: v.id("documents")`, `instructionsDocId: v.id("documents")` |
| Index name | `by_<col>` or `by_<col1>_<col2>` (camelCase columns dropped to snake_case) | `by_user`, `by_user_parent`, `by_user_time`, `by_checksum` |
| Timestamps | `createdAt`, `updatedAt` (numbers, ms since epoch) | `createdAt: v.number()` |

If the user-facing concept is a single noun, the table is its plural: `document` → `documents`. Don't add suffixes like `_table`, `_collection`, or `_data`.

## Validators (`v.*`)

```typescript
v.string()                              // string
v.number()                              // double-precision float (Convex has no separate int)
v.boolean()                             // boolean
v.id("<table>")                         // typed reference to another table
v.optional(<inner>)                     // makes the field optional (= field may be absent)
v.union(<a>, <b>, ...)                  // sum type
v.literal("user")                       // string literal — combine with v.union for enums
v.array(<inner>)                        // array
v.object({ ... })                       // nested object
v.bytes()                               // ArrayBuffer for binary data
v.null()                                // explicit null (rare — prefer v.optional)
v.any()                                 // last resort, opaque payloads only
```

### Optional vs required

`v.optional(v.string())` means the field can be absent — TypeScript emits `string | undefined`. Use it for:

- Genuinely optional fields the user may or may not set (`coverImage`, `icon`, `description`).
- Fields added in a later migration to an existing table (the additive-only rule below).
- Fields that depend on which provider/state the row is in (`openaiKey`, `anthropicKey` — only one set at a time).

`v.string()` (no `optional`) means every row **must** have it. Reach for required fields by default and add `v.optional` only with a reason. Required fields force you to think about defaults at write time, which is where you want that decision.

### Enums via `v.union(v.literal(...))`

```typescript
role: v.union(v.literal("user"), v.literal("assistant")),
```

This is the Convex enum pattern. TypeScript narrows it to `"user" | "assistant"` automatically. Don't store enum-like values as plain `v.string()` — that loses the narrowing on the consumer side.

### `v.any()` — last resort

```typescript
toolInvocations: v.optional(v.any()),  // AI tool call payloads — opaque, varies per provider
parts: v.optional(v.any()),            // Vercel AI SDK message parts — varies per version
```

`v.any()` is **only** for opaque payloads where the structure varies and is owned by an external library (AI SDK message parts, third-party webhook bodies). Never use it for first-party data. If you find yourself reaching for `v.any()` on something you control, you should be defining a `v.object({ ... })` or a `v.union(...)` instead.

## Indexes

### When to add an index

Every predicate that appears in a `.withIndex(...)` call in any handler needs a matching index in `schema.ts`. If you find yourself filtering with `.filter(...)` because the column isn't indexed, **add the index** rather than living with the scan.

### Index design rules

1. **First-position column is what scopes most queries.** In a per-user app, that's almost always `userId`. The shipped schema reflects this — every index in `schema.ts` starts with `["userId", ...]`.
2. **Compound indexes** support equality predicates on every column up to and including the one you order on, plus range predicates on the next one. So `by_user_time: ["userId", "createdAt"]` lets you do `q.eq("userId", uid).gt("createdAt", t)`.
3. **Don't over-index.** Each index has a write cost. Add an index only when there's a real query that needs it. Boolean columns rarely belong in an index (low selectivity); use `.filter(...)` for them after the index has narrowed the set.
4. **Name matches columns.** `by_user_parent` is `["userId", "parentDocument"]`. Drop verbose suffixes (no `Document` in the index name — the column itself is `parentDocument`).

### Index examples from the shipped schema

| Index | Columns | Used by |
|---|---|---|
| `by_user` (documents) | `["userId"]` | `getTrash`, `getSearch` — list all of a user's docs |
| `by_user_parent` (documents) | `["userId", "parentDocument"]` | `getSidebar`, `archive`, `restore` — fetch children of a node |
| `by_user` (aiSettings) | `["userId"]` | `getSettings` — at most one row per user, `.first()` |
| `by_user_time` (coworkerMessages) | `["userId", "createdAt"]` | `getMessages`, `getRecentMessages` — chronological chat history |
| `by_checksum` (files) | `["userId", "checksum"]` | `checkExists` — dedup file uploads |
| `by_user_document` (files) | `["userId", "documentId"]` | List files attached to a specific doc |

### Indexing on optional fields

`v.optional(v.id(...))` columns can still be indexed. `parentDocument` is optional (root docs have no parent), and `by_user_parent` indexes it — `parentDocument: undefined` becomes a valid index value. This is how the sidebar finds root-level documents:

```typescript
.withIndex("by_user_parent", (q) =>
  q.eq("userId", userId).eq("parentDocument", undefined),
)
```

## The additive-only rule

**Convex schemas are validated against existing rows.** If you change a required field to a different required type, or add a new required field to a table that already has rows, the next deploy fails because existing rows don't satisfy the new schema.

Therefore:

1. **New columns are always added as `v.optional(...)` first**, even if eventually they should be required. Backfill a value into existing rows via a migration script (Convex CLI), then a follow-up PR can flip it to required.
2. **Renaming a column = adding the new column + dual-writing + backfill + dropping the old.** Never rename in place.
3. **Changing a type** (e.g., `v.string()` → `v.union(v.literal("a"), v.literal("b"))`) is a migration — don't sneak it in.
4. **Adding indexes is safe.** They're built lazily after deploy.
5. **Removing indexes is safe.** Just delete the line.

The shipped `aiSettings` table demonstrates the pattern — `activeProvider` is `v.optional(v.string())` even though every active row has one, because earlier rows pre-dated the column. The comment in the source (`"// Optional for migration"`) captures the intent.

When a column is annotated `[NEW]` in the shipped `convex/schema.ts`, that's the project's convention for "added in a later migration, kept optional for backfill compatibility." Match the convention when adding new columns.

## Adding a table — the checklist

When a new feature needs a new table:

1. **Pick the singular concept** (`squadAgent`, not `squadAgentEntry`).
2. **Pluralize for the table name** (`squadAgents`).
3. **Required columns**: the foreign key scope (`userId: v.string()`), domain identity (`name: v.string()`, `instructionsDocId: v.id("documents")`), `createdAt: v.number()`, `updatedAt: v.number()`.
4. **Optional columns**: anything user-customizable (`description`, `icon`, `toolIds`).
5. **Indexes**: at minimum `by_user` (per-user scope). Add a compound index per query pattern you know you need (e.g., `by_user_time` for "recent X").
6. **Open `schema.ts`, append the table block.** Convex auto-generates `Doc<"squadAgents">` and `Id<"squadAgents">` after the next dev cycle.
7. **Write the handlers** in a new `convex/<table>.ts` (see `convex-handlers`).

```typescript
// the squadAgents shipped pattern in full
squadAgents: defineTable({
  userId: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  icon: v.optional(v.string()),
  instructionsDocId: v.id("documents"),
  toolIds: v.optional(v.array(v.string())),  // [FUTURE] — keep optional, even though we'll always set it eventually
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_user", ["userId"]),
```

## Reading the generated types

After the dev server has cycled (`npx convex dev`), `_generated/dataModel.d.ts` exposes:

```typescript
import type { Doc, Id } from "@/convex/_generated/dataModel";

type Document = Doc<"documents">;       // every column + _id + _creationTime
type DocumentId = Id<"documents">;      // branded string type

// Usage in components:
function DocumentCard({ document }: { document: Doc<"documents"> }) { ... }
function archiveById(id: Id<"documents">) { ... }
```

Always import `Doc` and `Id` from the generated file via the `@/` alias. Don't redeclare these types in `lib/` — they go stale the moment the schema changes.

## Anti-patterns

```typescript
// ❌ snake_case table or column names
defineSchema({
  document_versions: defineTable({ user_id: v.string() }),
});
// ✅ camelCase
defineSchema({
  documentVersions: defineTable({ userId: v.string() }),
});

// ❌ adding a required column to an existing table — breaks on deploy
documents: defineTable({
  // ... existing columns ...
  workspaceId: v.string(),  // existing rows don't have this — schema validation fails
})

// ✅ add as optional, backfill, then (optionally) flip to required in a later PR
documents: defineTable({
  // ... existing columns ...
  workspaceId: v.optional(v.string()),
})

// ❌ enum stored as plain string
role: v.string(),  // any string allowed; consumer must guard everywhere
// ✅ literal union — TS narrows it
role: v.union(v.literal("user"), v.literal("assistant")),

// ❌ no index on a column you query by
files: defineTable({ /* ... */ checksum: v.optional(v.string()) }),
// query: .filter((q) => q.eq(q.field("checksum"), checksum))   // scans the whole table per user
// ✅ add the index
files: defineTable({ /* ... */ checksum: v.optional(v.string()) })
  .index("by_checksum", ["userId", "checksum"]),

// ❌ overusing v.any() for first-party data
squadAgents: defineTable({
  config: v.any(),  // what's in here?? consumers can't tell
}),
// ✅ either v.object({ ... }) it, or split into named columns
squadAgents: defineTable({
  iconColor: v.optional(v.string()),
  iconStyle: v.optional(v.union(v.literal("emoji"), v.literal("svg"))),
}),

// ❌ declaring _id or _creationTime
documents: defineTable({
  _id: v.id("documents"),         // already provided by Convex
  _creationTime: v.number(),      // already provided by Convex
  // ...
})

// ❌ index named after a query rather than its columns
documents: defineTable({ /* ... */ }).index("for_sidebar_query", ["userId", "parentDocument"]),
// ✅ index named after the columns
documents: defineTable({ /* ... */ }).index("by_user_parent", ["userId", "parentDocument"]),
```

## Checklist when modifying `schema.ts`

- [ ] New columns added as `v.optional(...)` (the additive-only rule)
- [ ] Column names camelCase, table name camelCase plural
- [ ] Foreign keys typed via `v.id("<table>")`, not `v.string()`
- [ ] Enums modeled as `v.union(v.literal(...), v.literal(...))`
- [ ] No `v.any()` for first-party data — only for opaque external payloads
- [ ] Every `.withIndex(...)` call in a handler has a matching `.index(...)` here
- [ ] Index names follow `by_<col>` or `by_<col1>_<col2>` (no verb-based names like `for_sidebar_query`)
- [ ] No declaration of `_id` or `_creationTime` (Convex provides them)
- [ ] After saving, `npx convex dev` cycle ran without errors
