---
name: convex-handlers
description: Picking the right Convex handler type for noted-main — `query` for reactive reads, `mutation` for transactional writes, `action` for external calls (HTTP, npm, encryption), and the `internalQuery` / `internalMutation` variants for server-only entry points. Covers indexes vs filters, recursion patterns, pagination, calling across handlers, and the `"use node"` boundary. Use when user asks to "create a Convex function", "should this be a query/mutation/action", "how do I call an API from Convex", "filter vs index", or when adding any new file under `convex/`. Applies implicitly whenever writing or reviewing Convex backend code.
summary: query / mutation / action selection
---

<!--
This is a noted-native skill — there's no heatseeker counterpart. It documents
the patterns already shipped in `convex/documents.ts`, `convex/aiSettings.ts`,
`convex/aiSettingsActions.ts`, `convex/coworkerMessages.ts`, and `convex/files.ts`.

Companion skills:
- error-handling — owns the auth → existence → ownership → validation triad in depth
- convex-schema — owns `defineTable`, `defineSchema`, indexes, and `v.*` validators
-->

# Convex Handlers

## The four handler types

| Type | Reads DB? | Writes DB? | Network/Node APIs? | Use when |
|---|---|---|---|---|
| `query` | ✅ | ❌ | ❌ | A client component needs reactive data. Re-runs automatically when underlying tables change. |
| `mutation` | ✅ | ✅ | ❌ | A client component needs to write — single transaction, ACID, deterministic. |
| `action` | ❌ (only via `ctx.runQuery`) | ❌ (only via `ctx.runMutation`) | ✅ | You need `fetch`, `crypto`, an npm package, or any external API call. |
| `internalQuery` / `internalMutation` | same as above | same as above | ❌ | Same as query/mutation, but **only callable from another handler**, never from the client. Use for sensitive reads/writes (encrypted keys, internal state). |

**The deciding test**: where does the data come from / go to?

- Pure DB read → `query`
- Pure DB write or DB write + trivial reads → `mutation`
- HTTP request, AI provider call, file encryption (Node `crypto`), reading env vars → `action`
- Same as the above but I don't want clients calling it directly → prefix with `internal`

## Picking by example

```typescript
// ✅ query — reactive list of the sidebar tree
// convex/documents.ts
export const getSidebar = query({
  args: { parentDocument: v.optional(v.id("documents")) },
  handler: async (ctx, args) => { /* ... */ },
});

// ✅ mutation — transactional archive (writes, no external calls)
export const archive = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => { /* ... */ },
});

// ✅ action — needs `crypto` (Node) and an outbound `fetch` to OpenAI
// convex/aiSettingsActions.ts
"use node";
export const saveSettings = action({
  args: { provider: v.string(), apiKey: v.optional(v.string()), /* ... */ },
  handler: async (ctx, args) => {
    const encrypted = encrypt(args.apiKey);   // Node crypto
    await ctx.runMutation(internal.aiSettings.updateSettings, { /* ... */ });
  },
});

// ✅ internalMutation — only the action above is allowed to write encrypted keys
// convex/aiSettings.ts
export const updateSettings = internalMutation({ /* ... */ });
```

## Why actions are different

Convex queries and mutations run in a deterministic V8 environment with no `fetch`, no `setTimeout`, and no Node APIs. Anything that depends on the outside world (network, randomness from npm libs, file system, env vars exposed at import time) **must** be an action.

Actions live alongside other handlers, but a file containing an action that uses Node-only APIs (`crypto`, `Buffer`, `fs`) must declare `"use node";` at the top:

```typescript
// convex/aiSettingsActions.ts
"use node";

import crypto from "crypto";
import { action } from "./_generated/server";
// ...
```

**File convention**: when a module is `"use node"`, name it `<domain>Actions.ts` (e.g., `aiSettingsActions.ts`) so the boundary is obvious in the file tree. Don't mix `"use node"` and non-Node handlers in the same file — split them.

## Actions can't read or write the DB directly

Inside an action you have `ctx.auth` and `ctx.runQuery` / `ctx.runMutation` / `ctx.runAction`, but **not** `ctx.db`. To touch data, call out to a query or mutation — typically an `internalQuery` / `internalMutation` so the action is the only caller:

```typescript
// convex/aiSettingsActions.ts (action)
export const getDecryptedApiKey = action({
  args: { provider: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const settings = await ctx.runQuery(api.aiSettings.getSettings);
    const fullSettings = await ctx.runQuery(internal.aiSettings.getSettingsWithKeys);
    // ...decrypt and return
  },
});

// convex/aiSettings.ts (internalQuery — can return secrets, only callable internally)
export const getSettingsWithKeys = internalQuery({
  handler: async (ctx) => { /* returns the encrypted keys */ },
});
```

The reason for the `internal*` variant: `getSettingsWithKeys` returns encrypted API keys. We don't want the client to ever call it directly — only the action that knows how to decrypt them. Hide it behind `internalQuery`.

## Indexes vs filters

`.withIndex(...)` uses a database index — fast, scales with the matching subset.
`.filter(...)` walks every row that the index already returned — fine for small post-filter, expensive at scale.

**Rule of thumb**: any predicate on a column that's part of an index goes inside `.withIndex(...)`. Use `.filter(...)` only for residual conditions on a much smaller set, or for fields you can't index (booleans toggled often, computed values).

```typescript
// ✅ index everything we can; filter only on residual `isArchived`
const documents = await ctx.db
  .query("documents")
  .withIndex("by_user_parent", (q) =>
    q.eq("userId", userId).eq("parentDocument", args.parentDocument),
  )
  .filter((q) => q.eq(q.field("isArchived"), false))
  .order("desc")
  .collect();

// ❌ scans every doc owned by the user before filtering — bad once the user has 10k docs
const documents = await ctx.db
  .query("documents")
  .filter((q) => q.eq(q.field("userId"), userId))
  .filter((q) => q.eq(q.field("parentDocument"), args.parentDocument))
  .filter((q) => q.eq(q.field("isArchived"), false))
  .collect();
```

When the predicate you need isn't covered by an existing index, **add an index** in `convex/schema.ts` rather than reaching for `.filter(...)`. Index naming convention is `by_<col>` or `by_<col>_<col>` (e.g., `by_user`, `by_user_parent`, `by_user_time`). See the `convex-schema` skill.

## Result-set bounds

`.collect()` loads every matching row into memory. Bound the result set on any query that could grow:

| Need | Use |
|---|---|
| All rows for a small, bounded list (e.g., a single user's settings) | `.collect()` |
| First match | `.first()` (returns row or `null`) |
| First match, throw if not found | `.unique()` (throws if 0 or >1 — use sparingly) |
| First N rows | `.take(n)` |
| Paginated | `.paginate(opts)` with a `paginationOptsValidator` arg |

```typescript
// settings — at most one row per user, .first() is correct
const settings = await ctx.db
  .query("aiSettings")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .first();

// chat history — bound it, the user might have thousands
const messages = await ctx.db
  .query("coworkerMessages")
  .withIndex("by_user_time", (q) => q.eq("userId", userId))
  .order("desc")
  .take(limit);
```

For paginated lists (search results, file lists), use `.paginate(...)` with the standard validator:

```typescript
import { paginationOptsValidator } from "convex/server";

export const listFiles = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("files")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

Pair with the `usePaginatedQuery` hook on the client.

## Recursion (parent-child trees)

When a mutation needs to cascade through a tree (archive a document and all its children, restore the same), the shipped pattern is a **recursive helper inside the handler** that reuses the same `userId` scope and the same index:

```typescript
// convex/documents.ts — archive (real shipped code)
export const archive = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);
    if (!existingDocument) throw new Error("Document not found");
    if (existingDocument.userId !== userId) throw new Error("Not authorized");

    const recursiveArchive = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q.eq("userId", userId).eq("parentDocument", documentId),
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, { isArchived: true });
        await recursiveArchive(child._id);
      }
    };

    const document = await ctx.db.patch(args.id, { isArchived: true });
    await recursiveArchive(args.id);
    return document;
  },
});
```

Notes on the pattern:

- The recursion runs **inside** the same mutation, so the whole archive is one transaction. If anything inside fails, the parent's `isArchived: true` rolls back too.
- `userId` is captured in the closure — every recursive query stays scoped to the caller's data; never trust an arbitrary `documentId` to point to your own subtree without the index check.
- **`await` the recursion**. The current shipped code in `restore`/`archive` does `recursiveArchive(args.id)` without `await`, which leaves a dangling promise. Don't copy that — `await` it.

## Calling across handlers

| From | To | API |
|---|---|---|
| client (React) | `query` | `useQuery(api.<module>.<fn>, args)` |
| client (React) | `mutation` | `useMutation(api.<module>.<fn>)` |
| client (React) | `action` | `useAction(api.<module>.<fn>)` |
| `action` | `query` (public) | `await ctx.runQuery(api.<module>.<fn>, args)` |
| `action` | `internalQuery` | `await ctx.runQuery(internal.<module>.<fn>, args)` |
| `action` | `mutation` / `internalMutation` | `await ctx.runMutation(...)` |
| `action` | another `action` | `await ctx.runAction(...)` |
| `mutation` | `query` (inside same txn) | direct call: `await getSomething(ctx, args)` (extract a plain helper) — **mutations cannot run another query handler**; just inline the read |
| `mutation` | `mutation` | extract shared logic into a plain helper function — don't chain handlers |

A mutation **cannot** call `ctx.runMutation` or `ctx.runQuery`. Inside a mutation you already have `ctx.db`; just read or write directly. If logic is shared between two mutations, extract a regular `async` helper that takes `ctx` as its first arg.

## Argument validators (`v.*`)

Every handler must validate its arguments. The `v.*` namespace from `convex/values` is the only allowed source:

```typescript
import { v } from "convex/values";

export const update = mutation({
  args: {
    id: v.id("documents"),                     // typed Convex ID
    title: v.optional(v.string()),             // optional string
    isPublished: v.optional(v.boolean()),      // optional boolean
    role: v.union(v.literal("user"), v.literal("assistant")),  // string union
  },
  handler: async (ctx, args) => { /* ... */ },
});
```

Common validators in noted: `v.string()`, `v.number()`, `v.boolean()`, `v.id("<table>")`, `v.optional(...)`, `v.union(...)`, `v.literal(...)`, `v.array(...)`, `v.any()` (sparingly — last-resort for opaque AI tool payloads only). See the `convex-schema` skill for the full list.

`args` doesn't need a TypeScript interface declaration — `v.*` validators generate the types automatically.

## Auth, ownership, validation

Every handler that touches user data starts with the auth → existence → ownership triad. That's owned by the **`error-handling` skill** — read it before writing a new handler. The triad in one line:

```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Not authenticated");
const userId = identity.subject;

const existing = await ctx.db.get(args.id);
if (!existing) throw new Error("<Thing> not found");
if (existing.userId !== userId) throw new Error("Not authorized");
```

Public reads (e.g., `getById` for a published document) are the rare exception — they branch on `isPublished` *before* requiring auth. See `convex/documents.ts:getById` for the canonical pattern.

## File and naming conventions

```
convex/
├── documents.ts            # query + mutation handlers for a domain
├── aiSettings.ts           # public + internal handlers (no Node)
├── aiSettingsActions.ts    # "use node" file — actions only
├── coworkerMessages.ts
├── files.ts
├── squadAgents.ts
├── schema.ts               # defineSchema (see convex-schema skill)
└── _generated/             # do not edit
```

Naming:

- **File**: camelCase domain noun (`aiSettings.ts`, `coworkerMessages.ts`). Plural when the table is plural.
- **Action-only file**: `<domain>Actions.ts` and `"use node"` at the top.
- **Exported handlers**: camelCase verb-first (`getSettings`, `addMessage`, `archive`, `restore`, `removeIcon`).
- **Index name on a query**: matches the index defined in `schema.ts` (`by_user`, `by_user_parent`, `by_user_time`).

## Anti-patterns

```typescript
// ❌ filtering on a column that has an index
const docs = await ctx.db
  .query("documents")
  .filter((q) => q.eq(q.field("userId"), userId))
  .collect();
// ✅ use the index
const docs = await ctx.db
  .query("documents")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .collect();

// ❌ unbounded .collect() on a table that will grow per-user
const messages = await ctx.db
  .query("coworkerMessages")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .collect();
// ✅ bound it
const messages = await ctx.db
  .query("coworkerMessages")
  .withIndex("by_user_time", (q) => q.eq("userId", userId))
  .order("desc")
  .take(limit);

// ❌ doing fetch() inside a mutation — Convex queries/mutations are deterministic
export const sendWebhook = mutation({
  handler: async (ctx, args) => {
    await fetch("https://hooks.example.com/...", { method: "POST" });  // crashes
  },
});
// ✅ move the network call into an action
export const sendWebhook = action({
  handler: async (ctx, args) => {
    await fetch("https://hooks.example.com/...", { method: "POST" });
  },
});

// ❌ exposing an internalQuery as a public query just to call it from the action
//    — leaks the secret-returning shape to any client.
export const getSettingsWithKeys = query({ /* returns encrypted keys */ });
// ✅ keep it internal; the action calls it via ctx.runQuery(internal.<module>.<fn>)
export const getSettingsWithKeys = internalQuery({ /* ... */ });

// ❌ recursion that doesn't reuse the userId scope
const recursiveArchive = async (documentId: Id<"documents">) => {
  const children = await ctx.db
    .query("documents")
    .filter((q) => q.eq(q.field("parentDocument"), documentId))  // scans across users!
    .collect();
};
// ✅ index on (userId, parentDocument) and reuse the scope
const recursiveArchive = async (documentId: Id<"documents">) => {
  const children = await ctx.db
    .query("documents")
    .withIndex("by_user_parent", (q) =>
      q.eq("userId", userId).eq("parentDocument", documentId),
    )
    .collect();
};

// ❌ mixing "use node" with non-node handlers in one file
// (the bundler will refuse it; split into two files)

// ❌ a mutation that calls ctx.runQuery — Convex doesn't allow this
export const archiveAndCount = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isArchived: true });
    const count = await ctx.runQuery(api.documents.getTrash);  // not allowed inside mutation
  },
});
// ✅ inline the read OR move the orchestration up to the client
```

## Checklist for a new handler

- [ ] Right type chosen: `query` (reactive read), `mutation` (transactional write), `action` (network/Node), or `internal*` (server-only entry point)
- [ ] If using Node APIs (`crypto`, `Buffer`, `fs`) or npm imports → file starts with `"use node";` and is named `<domain>Actions.ts`
- [ ] `args` validated with `v.*` — no `args: any`, no `args` block omitted
- [ ] Auth → existence → ownership triad in place (see `error-handling`)
- [ ] Reads use `.withIndex(...)` for any predicate on an indexed column
- [ ] Result set is bounded (`.first()`, `.take(n)`, `.paginate(...)` — not `.collect()` unless small)
- [ ] No `fetch` / `crypto` / npm libs in a query or mutation
- [ ] Recursion (if any) is inside the same handler, scoped by `userId`, and `await`ed
- [ ] Actions delegate DB access via `ctx.runQuery` / `ctx.runMutation`, not by reaching for `ctx.db` (which doesn't exist on actions)
- [ ] Errors thrown follow the conventional vocabulary (see `error-handling`)
