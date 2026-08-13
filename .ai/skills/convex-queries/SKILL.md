---
name: convex-queries
description: Convex query patterns for noted-main — efficient indexed reads, fan-out via `Promise.all`, in-handler "joins" between collections, pagination, the `.filter` vs `.withIndex` boundary, and the cost model (every `useQuery` is a live subscription). Use when writing a new Convex `query`, optimizing a slow query, joining two tables in a single read, paginating a list, or reviewing a query for performance. Companion to `convex-handlers` (handler-type selection) and `convex-schema` (table/index design).
summary: Indexed reads, joins, pagination
---

<!--
Noted-native skill — replaces heatseeker's `mongodb-aggregation`.
Mongo's pipeline operators ($lookup, $unwind, $group, $project) don't
exist in Convex; instead, joins happen in handler code via
`ctx.db.get(id)` and `Promise.all`. This skill documents that idiom and
the "filter pushdown to indexes" rule.

Companion skills:
- convex-handlers — when to use query/mutation/action and the auth triad
- convex-schema   — defineTable, indexes, validators
- error-handling  — auth → existence → ownership triad messages
-->

# Convex Queries

Convex queries are the read side of noted's backend. Every component that calls `useQuery(api.<module>.<fn>, args)` becomes a **live subscription** — when underlying tables change, all subscribers re-render. That property changes how you design queries: a wasteful query runs continuously, not just once per page load.

This skill is a depth pass on patterns mentioned in `convex-handlers`. Read that one first.

## The cost model

| Operation | What it costs | When it runs |
|---|---|---|
| Index lookup (`.withIndex(...).first()`) | One indexed seek | On call, and whenever the row changes |
| Range scan (`.withIndex(...).take(n)`) | n indexed reads | On call, and whenever any of the n rows changes |
| `.filter(...)` (post-index) | One read per row that passed the index, then a JS predicate | On call, and whenever any of those rows changes |
| `.collect()` (full result set) | One read per matching row | On call, and on **any** matching row's change |
| `ctx.db.get(id)` inside a query | One indexed get | Adds the gotten row to the subscription set |

**The reactive trap**: a query that calls `ctx.db.get(id)` for 50 children adds 50 rows to the subscription set. Any of those changing re-runs the entire query. Bound your reads.

## Filter pushdown to indexes

`.withIndex(...)` walks an index — fast, scales sub-linearly with subset size. `.filter(...)` evaluates a predicate against rows the index already returned — runs in JS. The rule:

> **Push every predicate you can into `.withIndex(...)`. Use `.filter(...)` only for the residual.**

```typescript
// Shipped pattern — convex/documents.ts:getSidebar
const documents = await ctx.db
  .query("documents")
  .withIndex("by_user_parent", (q) =>
    q.eq("userId", userId).eq("parentDocument", args.parentDocument),
  )                                            // <-- 2 columns indexed
  .filter((q) => q.eq(q.field("isArchived"), false))   // <-- residual
  .order("desc")
  .collect();
```

Why this shape: `(userId, parentDocument)` selects a small subtree (one user's children of one parent). Walking that and filtering on `isArchived` is cheap. Without the index, you'd scan every document the user has.

When the predicate isn't covered by an existing index, **add the index** in `convex/schema.ts`. See `convex-schema` for naming and the additive-only rule.

### What `.filter(...)` can do

`.filter` accepts a Convex query expression — `q.eq`, `q.neq`, `q.lt`, `q.gt`, `q.lte`, `q.gte`, `q.and`, `q.or`. It cannot run arbitrary JS. For complex predicates (e.g., string matching), filter into a small candidate set with `.withIndex(...)`, then post-filter the resulting array in plain JS:

```typescript
const candidates = await ctx.db
  .query("documents")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .filter((q) => q.eq(q.field("isArchived"), false))
  .collect();

// post-filter in JS — only safe because the index already bounded the set
const matching = candidates.filter((d) =>
  d.title.toLowerCase().includes(needle.toLowerCase()),
);
```

This is a fallback. If text search becomes a real feature, use Convex's `.search(...)` API or a search index (declared via `.searchIndex(...)` in `schema.ts`).

## Joins live in handler code

There is no `$lookup`. To attach related rows, fetch them explicitly with `ctx.db.get(id)`. Two patterns:

### Single-row attach (per-list-item)

```typescript
// Each row needs its parent doc resolved
return await Promise.all(
  files.map(async (file) => ({
    ...file,
    document: file.documentId ? await ctx.db.get(file.documentId) : null,
  })),
);
```

`Promise.all` parallelizes — N round-trips happen in a single tick. Don't `await` inside a loop:

```typescript
// ❌ N sequential round trips — slow at any scale
const enriched = [];
for (const file of files) {
  const doc = file.documentId ? await ctx.db.get(file.documentId) : null;
  enriched.push({ ...file, document: doc });
}

// ✅ N parallel round trips
const enriched = await Promise.all(
  files.map(async (file) => ({ ...file, document: file.documentId ? await ctx.db.get(file.documentId) : null })),
);
```

### Many-rows-attach (per-item with multiple foreign keys)

The shipped `convex/files.ts:get` query is the canonical example — each file may link to multiple documents:

```typescript
const filesWithDocuments = await Promise.all(
  files.map(async (file) => {
    let documents: any[] = [];
    const docIds = file.documentIds || (file.documentId ? [file.documentId] : []);

    if (docIds.length > 0) {
      const docs = await Promise.all(docIds.map((id) => ctx.db.get(id)));
      documents = docs.filter((doc) => doc !== null);
    }

    return { ...file, documents };
  }),
);
```

Two layers of `Promise.all` — outer over files, inner over each file's doc IDs. All round trips run in parallel.

### When to push the join down vs do it on the client

If the consuming component needs both rows together for every render, do the join in the handler. If only some renders need the related row (e.g., on hover), it's often cheaper to ship just the ID and let the consumer call `useQuery(api.documents.getById, { id })` lazily.

## Index-driven filter on a Set

A common shape: filter out a small "blocklist" of IDs after a list query. The shipped sidebar pattern excludes squad-agent instruction docs:

```typescript
// convex/documents.ts:getSidebar (real shipped code)
const documents = await ctx.db
  .query("documents")
  .withIndex("by_user_parent", (q) => q.eq("userId", userId).eq("parentDocument", args.parentDocument))
  .filter((q) => q.eq(q.field("isArchived"), false))
  .order("desc")
  .collect();

const squadAgents = await ctx.db
  .query("squadAgents")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .collect();

const instructionDocIds = new Set(squadAgents.map((a) => a.instructionsDocId));
return documents.filter((doc) => !instructionDocIds.has(doc._id));
```

The pattern: index-bounded read of the candidates, index-bounded read of the blocklist, in-memory `Set` lookup is O(1) per row. Don't try to express this exclusion in `.filter(...)` — the query expression language can't.

## Pagination

For lists that grow per user (chat history, document lists, file listings), use `.paginate(...)` with the standard validator:

```typescript
import { paginationOptsValidator } from "convex/server";

export const listMessages = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("coworkerMessages")
      .withIndex("by_user_time", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

Pair with the client hook `usePaginatedQuery(api.<module>.<fn>, args, { initialNumItems: 20 })` — it manages the cursor for you and returns `{ results, status, loadMore }`.

When NOT to paginate: if there's a natural ceiling (a user's settings = at most 1 row, an active session list bounded to ~5), `.first()` / `.take(n)` is cleaner.

## Result-set bounds — quick reference

| Need | Method | Returns |
|---|---|---|
| At most one row | `.first()` | `Doc | null` |
| Exactly one row, throw if 0 or >1 | `.unique()` | `Doc` |
| First N rows | `.take(n)` | `Doc[]` |
| All rows in a bounded set | `.collect()` | `Doc[]` |
| Cursor-paginated | `.paginate(opts)` | `{ page, isDone, continueCursor }` |

`.collect()` is for genuinely small bounded sets — a user's settings, a user's squadAgents (typically <10). Anything that grows per-user → `.take(n)` or `.paginate(...)`.

## Reactivity — what triggers a re-run

A subscription re-runs when **any of the rows it touched** changes. "Touched" includes:

- Rows returned by the index walk
- Rows returned by `ctx.db.get(id)`
- Rows that *would have matched* the index range and have now appeared (a new row inside `(userId, parentDocument=p)` triggers the sidebar query)

Implications:

1. **A query touching 1000 rows re-runs on any of their changes.** Bound the result set.
2. **A query joining doc → file → document → ... touches every row in every layer.** The deeper the join, the more triggers.
3. **An infinitely scrolling list adds rows to the subscription as it loads.** Use `.paginate(...)` so each page is a separate subscription with its own cursor.

If you find a query is too "live" — re-rendering on every adjacent change — split it into a coarse query + a per-item query. The Convex client deduplicates each subscription, so per-row queries cost less than they look.

## Public-read branching

When a query is partly public (e.g., `getById` returns published docs to anonymous viewers, private docs only to the owner), branch on the public flag **before** requiring auth. The shipped pattern in `convex/documents.ts:getById`:

```typescript
export const getById = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("Document not found");

    if (document.isPublished && !document.isArchived) {
      return document;                        // public path
    }

    if (!identity) throw new Error("Not authenticated");
    if (document.userId !== identity.subject) throw new Error("Not authorized");

    return document;
  },
});
```

Note the order: existence first (to know what we're deciding about), public-read branch, then the standard auth → ownership triad for the private path. This is the only handler shape where public reads are allowed — most queries throw on no identity at the very first line.

## Anti-patterns

```typescript
// ❌ filter on userId — scans, doesn't index
ctx.db.query("documents").filter((q) => q.eq(q.field("userId"), userId)).collect();

// ✅ index on userId
ctx.db.query("documents").withIndex("by_user", (q) => q.eq("userId", userId)).collect();

// ❌ sequential awaits in a join
const docs = [];
for (const id of ids) docs.push(await ctx.db.get(id));

// ✅ parallel via Promise.all
const docs = await Promise.all(ids.map((id) => ctx.db.get(id)));

// ❌ unbounded collect on a per-user list that grows
ctx.db.query("coworkerMessages").withIndex("by_user", (q) => q.eq("userId", userId)).collect();

// ✅ bound it
ctx.db.query("coworkerMessages")
  .withIndex("by_user_time", (q) => q.eq("userId", userId))
  .order("desc")
  .take(50);

// ❌ N+1: query inside a Promise.all without an index
await Promise.all(parents.map((p) =>
  ctx.db.query("documents")
    .filter((q) => q.eq(q.field("parentDocument"), p._id))   // scans every time
    .collect(),
));

// ✅ N+1 with an index — still N round trips, but each is O(matches)
await Promise.all(parents.map((p) =>
  ctx.db.query("documents")
    .withIndex("by_user_parent", (q) => q.eq("userId", userId).eq("parentDocument", p._id))
    .collect(),
));

// ❌ trying to write a "$or across two tables" via .filter
//    Convex .filter is per-table; this is a no-op or a syntax error.

// ✅ two queries + merge in JS
const [a, b] = await Promise.all([
  ctx.db.query("tableA").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
  ctx.db.query("tableB").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
]);
return [...a, ...b];

// ❌ throwing into a public-read query before checking publicness
const document = await ctx.db.get(args.documentId);
if (!document) throw new Error("Document not found");
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Not authenticated");        // anonymous can never read public docs
if (document.isPublished) return document;
// ✅ branch on publicness BEFORE requiring auth (see getById above)
```

## Checklist

- [ ] Every predicate that can sit on an indexed column is in `.withIndex(...)`, not `.filter(...)`
- [ ] Result set is bounded — `.first()` / `.take(n)` / `.paginate(...)`, not raw `.collect()` unless small
- [ ] Joins use `Promise.all([...])` over `ctx.db.get(...)` — never `await` in a loop
- [ ] When the query is reactive in the client (i.e., it's served by `useQuery`), the subscription set is small enough that incidental writes don't cause flicker
- [ ] `.unique()` only used when a single row is genuinely required — otherwise `.first()`
- [ ] Public-read queries branch on the public flag *before* requiring auth
- [ ] Any new index required is added in `convex/schema.ts` (see `convex-schema`)
