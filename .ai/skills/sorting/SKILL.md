---
name: sorting
description: Sorting conventions for noted-main — sort at the Convex query layer with `.order("asc"|"desc")` whenever possible (cheap, indexed, reactive). Use native `Array.prototype.toSorted()` for client-only sorts; never `.sort()` mutating in place. Use when user asks to "sort this list", "order results", "newest first", or anywhere ordering is involved. Applies implicitly whenever code orders an array — server- or client-side.
summary: Sort at Convex layer or toSorted() client-side
---

<!--
Adapted from heatseeker-next/.ai/skills/sorting/SKILL.md
MAJOR adaptation: heatseeker recommends Lodash `orderBy` because it's a
big monorepo with lodash already installed. noted has no lodash dependency
and almost all sorting happens server-side in Convex queries via
`.order(...)`. This skill documents that reality and gives a clean
client-side fallback (`toSorted()`) for the rare cases where it's needed.
-->

# Sorting

**Default: sort at the Convex query.** Convex's `.order("asc"|"desc")` runs against an index, returns sorted results, and stays reactive. The client just renders what it gets.

```typescript
// convex/documents.ts — shipped pattern
const documents = await ctx.db
  .query("documents")
  .withIndex("by_user_parent", (q) =>
    q.eq("userId", userId).eq("parentDocument", args.parentDocument),
  )
  .filter((q) => q.eq(q.field("isArchived"), false))
  .order("desc")          // <-- by `_creationTime` desc — newest first
  .collect();
```

Convex sorts by `_creationTime` by default (descending). For other orderings, the column needs to be in the index — see the `convex-schema` skill on indexing.

## Decision tree

```
Is the data coming from a Convex query?
  └─ YES → sort there with .order(...). Don't re-sort on the client.
           (Already shipped: `getSidebar`, `getTrash`, `getMessages`, `files.get`.)

Is the data assembled on the client (combined from two queries, computed)?
  └─ YES → use Array.prototype.toSorted() with a comparator.
           toSorted() is immutable — same shape as the rest of the codebase.

Is the data a Convex result you want to display in a different order
locally (e.g., a search result the user can re-sort)?
  └─ Prefer extending the Convex query with the right index + .order().
     Fall back to toSorted() only when the user is interactively
     re-sorting and a round-trip would be wasteful.
```

## Client-side sorting

Use the immutable `Array.prototype.toSorted()` (Node 20+ / modern browsers — already supported by noted's runtime). It returns a new sorted array without mutating the input.

```typescript
// ✅ string sort — case-insensitive
const sorted = items.toSorted((a, b) =>
  a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
);

// ✅ numeric sort — newest first
const sorted = items.toSorted((a, b) => b.createdAt - a.createdAt);

// ✅ multi-level — primary by date desc, secondary by title asc
const sorted = items.toSorted((a, b) => {
  if (b.createdAt !== a.createdAt) return b.createdAt - a.createdAt;
  return a.title.localeCompare(b.title);
});

// ✅ nullable — push undefined to the end
const sorted = items.toSorted((a, b) => {
  if (a.position == null) return 1;
  if (b.position == null) return -1;
  return a.position - b.position;
});
```

## Why not `.sort()`?

`Array.prototype.sort()` **mutates the original array in place**. In React, mutating a `useQuery` result will throw (Convex returns frozen arrays in dev). Even when it doesn't throw, mutating shared data is a foot-gun: another component reading the same query gets the rearranged copy. `toSorted()` returns a new array — same intent, no mutation.

```typescript
// ❌ BAD — mutates the array, breaks Convex reactivity
const docs = useQuery(api.documents.getSidebar) ?? [];
docs.sort((a, b) => a.title.localeCompare(b.title));   // throws on a frozen array

// ✅ GOOD
const docs = useQuery(api.documents.getSidebar) ?? [];
const sortedByTitle = docs.toSorted((a, b) => a.title.localeCompare(b.title));
```

## Why not Lodash `orderBy`?

The heatseeker codebase uses `import orderBy from "lodash/orderBy"` for declarative multi-column sort. **Noted does not depend on lodash** and there's no plan to add it for one helper — `toSorted()` covers every case lodash does, with a comparator that's two lines longer at most. If you find yourself writing the same comparator three or more times, extract it into a `<feature>.utils.ts` next to the component (see `react-components`).

```typescript
// e.g., components/sidebar/sidebar.utils.ts
export const byTitleAsc = <T extends { title: string }>(a: T, b: T): number =>
  a.title.localeCompare(b.title, undefined, { sensitivity: "base" });

export const byCreatedAtDesc = <T extends { createdAt: number }>(
  a: T,
  b: T,
): number => b.createdAt - a.createdAt;
```

Then call sites read like:

```typescript
const sorted = docs.toSorted(byTitleAsc);
```

## When native `.sort()` is fine

Three cases where mutating sort is acceptable:

1. **You constructed the array yourself in the same scope** and nothing else holds a reference to it.
2. **Building a stable cache key**: `[...ids].sort().join(",")` — the spread creates the local copy that gets mutated.
3. **Object keys for stringification**: `Object.keys(obj).sort()` — the array returned by `Object.keys` is fresh every call.

In a component, you almost never want `.sort()` — `toSorted()` is the same length and immutable.

## Anti-patterns

```typescript
// ❌ sorting client-side what Convex could sort
const docs = useQuery(api.documents.list);          // returns whatever order Convex picked
const sorted = docs?.toSorted((a, b) => b.createdAt - a.createdAt);
// ✅ extend the Convex query with the right index + .order("desc"); the
//    client just renders the result.

// ❌ mutating a useQuery result
const messages = useQuery(api.coworkerMessages.getMessages) ?? [];
messages.sort((a, b) => a.createdAt - b.createdAt);  // throws

// ❌ reaching for lodash for one helper
import orderBy from "lodash/orderBy";                 // not installed; don't add it for sorting

// ❌ duplicating the same comparator inline three times across three files
docs.toSorted((a, b) => a.title.localeCompare(b.title))
// ✅ extract once
docs.toSorted(byTitleAsc)
```

## Quick reference

| Need | Use |
|---|---|
| Sort a Convex query result | `.order("asc"|"desc")` on the query (server-side) |
| Sort a client-assembled array | `arr.toSorted(comparator)` |
| Sort by a single string field | `arr.toSorted((a, b) => a.x.localeCompare(b.x))` |
| Sort by a numeric field, newest first | `arr.toSorted((a, b) => b.x - a.x)` |
| Multi-level sort | comparator with early-return on non-zero diff |
| Sort with nullables | comparator that pushes nulls/undefined to the end |
| Stable cache key | `[...ids].sort().join(",")` (in-place sort on the local copy is fine) |

## Checklist

- [ ] Sorting is done server-side in the Convex query when possible
- [ ] Client-side sorts use `arr.toSorted(...)`, never `arr.sort(...)`
- [ ] No `import { orderBy } from "lodash"` (lodash isn't a dependency)
- [ ] Comparators reused across components extracted into a `*.utils.ts`
- [ ] Comparators handle nullable values explicitly (no `undefined - undefined === NaN` surprises)
