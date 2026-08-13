---
name: convex-react-hooks
description: React-side patterns for Convex in noted-main — `useQuery` (reactive read), `useMutation` (transactional write), `useAction` (network/Node call), `usePaginatedQuery` (cursor-based lists). Covers the loading-vs-empty-vs-data ternary, optimistic updates, mutation toasts, and the "no manual invalidation" rule. Use when wiring a component to Convex, when the user asks "how do I fetch from Convex" or "how do I call a mutation", or when migrating a `fetch` inside `useEffect` to `useQuery`. Replaces the heatseeker `tanstack-queries` skill.
summary: useQuery / useMutation / useAction patterns
---

<!--
Noted-native skill — replaces heatseeker's `tanstack-queries`.
Convex hooks are NOT TanStack Query — they're reactive subscriptions
managed by the Convex client. There is no query key, no invalidation
function, no staleTime. This skill documents the actual API and shipped
patterns from noted's components/, hooks/, and app/.
-->

# Convex React Hooks

The four hooks you'll reach for, with one clear rule for each:

| Hook | What it does | Use when |
|---|---|---|
| `useQuery(api.<m>.<fn>, args)` | Reactive read — re-renders when underlying rows change | Reading any Convex data |
| `useMutation(api.<m>.<fn>)` | Returns a function that runs a Convex mutation transactionally | Any user action that writes (create, update, archive, etc.) |
| `useAction(api.<m>.<fn>)` | Returns a function that runs a Convex action (HTTP, Node) | External API calls, encryption, anything `"use node"` |
| `usePaginatedQuery(api.<m>.<fn>, args, opts)` | Cursor-paginated reactive list | Per-user lists that grow (chat, file lists, search results) |

```typescript
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
```

## `useQuery` — the reactive read

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const documents = useQuery(api.documents.getSidebar);
//      ^? Doc<"documents">[] | undefined
```

The return value has three states:

| Value | Meaning | Render |
|---|---|---|
| `undefined` | Still loading on first mount | Skeleton |
| `[]` (or empty result) | Finished loading, no rows | Empty state |
| `[ ... ]` (or any value) | Finished loading, rows present | Data |

The canonical render:

```typescript
const documents = useQuery(api.documents.getSidebar);

if (documents === undefined) return <DocumentListSkeleton />;
if (documents.length === 0)  return <DocumentListEmptyState />;

return <ul>{documents.map((d) => <DocumentItem key={d._id} document={d} />)}</ul>;
```

### Skipping the query (`"skip"`)

If the args aren't ready yet (e.g., the user isn't loaded, the doc ID isn't in scope), pass the literal `"skip"` instead of args:

```typescript
const document = useQuery(
  api.documents.getById,
  documentId ? { documentId } : "skip",
);
```

`useQuery` returns `undefined` while skipped, just like during initial load. Components downstream still render their skeleton.

### Multiple subscriptions in one component are fine

Convex deduplicates: two `useQuery(api.documents.getSidebar)` calls in different components share a single subscription. Don't lift queries up just to "save" subscriptions — fetch where you use it. (See `component-composition`.)

## `useMutation` — transactional writes

```typescript
const archive = useMutation(api.documents.archive);

const onArchive = async () => {
  await archive({ id: doc._id });
};
```

The hook returns the mutation function. Calling it returns a `Promise<ReturnType>` of whatever the handler returned. Convex handles the round-trip and re-runs every relevant `useQuery` automatically — **you do not call any kind of invalidation**.

### The shipped pattern: toast + fire-and-forget-ish

```typescript
// app/(main)/_components/menu.tsx — real shipped code
const archive = useMutation(api.documents.archive);

const onArchive = () => {
  const promise = archive({ id: documentId });

  toast.promise(promise, {
    loading: "Moving to trash...",
    success: "Note moved to trash!",
    error: "Failed to archive note.",
  });

  router.push("/documents");
};
```

`toast.promise` (from `sonner`) handles the loading / success / error states, the user gets immediate feedback, and the navigation runs synchronously. Note: there's no `await` on the mutation here — the navigation should not block on it, and the toast already covers the failure case.

When you DO need the result (e.g., the new ID for navigation), use `.then(...)`:

```typescript
const create = useMutation(api.documents.create);

const onCreate = () => {
  const promise = create({ title: "Untitled" }).then((documentId) => {
    router.push(`/documents/${documentId}`);
  });

  toast.promise(promise, { loading: "Creating...", success: "Created!", error: "Failed." });
};
```

### Optimistic updates

`useMutation(...).withOptimisticUpdate(...)` lets you patch the local Convex store before the server confirms — the UI updates instantly, then reconciles when the server reply lands.

```typescript
const archive = useMutation(api.documents.archive).withOptimisticUpdate(
  (localStore, { id }) => {
    const sidebar = localStore.getQuery(api.documents.getSidebar, {});
    if (sidebar !== undefined) {
      localStore.setQuery(
        api.documents.getSidebar,
        {},
        sidebar.filter((d) => d._id !== id),
      );
    }
  },
);
```

Reach for this when:

- The mutation is on a hot path where waiting feels laggy (sidebar reorders, drag-drop).
- The optimistic state is trivially derivable from the inputs.

Skip it when:

- The mutation has server-side branching the client can't replicate (recursive cascades, ID generation, conflict resolution).
- The mutation is rare enough that the round trip is acceptable.

The shipped `archive` mutation in `convex/documents.ts` does a recursive cascade — replicating that optimistically would be brittle. Don't.

## `useAction` — for actions that touch the outside world

`useAction` calls a Convex `action` (the `"use node"` handler type — see `convex-handlers`). Use it when the work involves `fetch`, `crypto`, or any npm package that needs Node.

```typescript
const testConnection = useAction(api.aiSettingsActions.testConnection);

const onTest = async () => {
  const result = await testConnection({ provider: "openai", apiKey });
  if (result.success) toast.success("Connected!");
  else toast.error(result.error ?? "Connection failed");
};
```

`useAction` is **not** reactive — actions don't subscribe. The result is a one-shot Promise. If you need to "watch" some derived state of an action, the action should write to Convex, and a query should read it.

## `usePaginatedQuery` — cursor lists

```typescript
import { usePaginatedQuery } from "convex/react";

const { results, status, loadMore } = usePaginatedQuery(
  api.coworkerMessages.listPaginated,
  {},                                // args (other than paginationOpts — that's added by Convex)
  { initialNumItems: 20 },
);
```

| Return | Type | Meaning |
|---|---|---|
| `results` | `Doc[]` | Rows loaded so far (concatenated across pages) |
| `status` | `"LoadingFirstPage" \| "CanLoadMore" \| "LoadingMore" \| "Exhausted"` | Where in the cursor walk you are |
| `loadMore` | `(n: number) => void` | Triggers the next page |

A typical infinite-scroll consumer:

```typescript
return (
  <>
    {results.map((m) => <Message key={m._id} message={m} />)}
    {status === "CanLoadMore" && (
      <Button onClick={() => loadMore(20)}>Load more</Button>
    )}
  </>
);
```

Use `usePaginatedQuery` instead of `useQuery + .take(...)` whenever the list could meaningfully exceed the initial page. See the `convex-queries` skill for the server-side `.paginate(...)` you pair it with.

## The "no `useEffect` around fetches" rule

This is the single biggest anti-pattern when migrating from REST/TanStack thinking:

```typescript
// ❌ NEVER — useEffect + fetch + setState — the entire reactive layer ignored
useEffect(() => {
  fetch("/api/documents")
    .then((r) => r.json())
    .then((data) => setDocuments(data));
}, []);

// ❌ Also wrong — useEffect that "syncs" useQuery into local state
const docs = useQuery(api.documents.getSidebar);
const [local, setLocal] = useState<Doc<"documents">[]>([]);
useEffect(() => {
  if (docs) setLocal(docs);
}, [docs]);

// ✅ Just use it
const docs = useQuery(api.documents.getSidebar);
```

See the `derived-state` and `effect-to-event` skills for the broader rule. With Convex, the bias is even stronger: you almost never need `useEffect` for data — `useQuery` already gives you the live value.

## Authentication

Both `useQuery` and `useMutation` automatically pass the Clerk session token to Convex (the wiring lives in `components/providers/convex-provider.tsx`). On the server, `ctx.auth.getUserIdentity()` returns the Clerk identity. There's no manual token plumbing needed in components.

For server-side calls (`ConvexHttpClient` from a Next.js API route), see the `api-routes-and-actions` skill — those need explicit `convex.setAuth(token)`.

## Sharing state from a useQuery to other components

You don't. Each component that needs the data calls `useQuery` directly. Convex deduplicates the subscription, and the data is reactive everywhere consistently.

```typescript
// ❌ DON'T — mirror useQuery into Zustand
const docs = useQuery(api.documents.getSidebar);
useEffect(() => { useDocsStore.getState().set(docs); }, [docs]);

// ✅ Just call useQuery in the component that needs it
const docs = useQuery(api.documents.getSidebar);
```

See the `state-management` skill — Zustand is for UI state (modal open, selected item, filters). Convex hooks are for data. The boundary is strict.

## Server-only consumption: `ConvexHttpClient`

Inside a Next.js API route or a server action, you can't use the React hooks. Use `ConvexHttpClient` directly — same API surface (`.query`, `.mutation`, `.action`), just one-shot:

```typescript
// app/api/edgestore/[...edgestore]/route.ts — shipped pattern
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const result = await convex.query(api.storage.canUpload, { userId, fileSize });
```

For authenticated calls, set the bearer token first:

```typescript
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
convex.setAuth(token);
const settings = await convex.action(api.aiSettingsActions.getDecryptedApiKey, { provider });
```

See `api-routes-and-actions` for the broader picture.

## Anti-patterns

```typescript
// ❌ querying inside an event handler (fires once, no reactivity, blocks the click)
const onClick = async () => {
  const docs = await convex.query(api.documents.getSidebar);   // wrong tool
};

// ✅ subscribe at the component level
const docs = useQuery(api.documents.getSidebar);

// ❌ awaiting a mutation when you don't need the result
const archive = useMutation(api.documents.archive);
const onArchive = async () => {
  await archive({ id });            // unnecessary await; user sees a frozen UI for the round-trip
};
// ✅ fire and forget, surface via toast.promise
const onArchive = () => {
  const promise = archive({ id });
  toast.promise(promise, { ... });
};

// ❌ calling the Convex API from useEffect after every render
useEffect(() => {
  archive({ id });
}, [id]);
// ✅ call from the event handler that triggered the action

// ❌ trying to "invalidate" or "refetch" — there's nothing to invalidate
queryClient.invalidateQueries(["documents"]);  // not a Convex API

// ✅ Convex re-runs every dependent useQuery on commit. Do nothing.

// ❌ caching a useQuery result in useState
const docs = useQuery(api.documents.getSidebar);
const [cached, setCached] = useState(docs ?? []);
useEffect(() => { if (docs) setCached(docs); }, [docs]);
// ✅ just read docs

// ❌ skip-vs-undefined confusion
const data = useQuery(api.documents.getById, !documentId ? undefined : { documentId });
// `undefined` here means "fetch with no args" — not "skip"
// ✅ use the literal "skip"
const data = useQuery(api.documents.getById, documentId ? { documentId } : "skip");
```

## Quick reference

| Need | Hook |
|---|---|
| Reactive read | `useQuery(api.<m>.<fn>, args)` |
| Skip the query conditionally | second arg = `"skip"` |
| Transactional write | `useMutation(api.<m>.<fn>)` |
| Optimistic update | `useMutation(...).withOptimisticUpdate(fn)` |
| External call | `useAction(api.<m>.<fn>)` |
| Cursor list | `usePaginatedQuery(api.<m>.<fn>, args, { initialNumItems: N })` |
| Server-side one-shot | `new ConvexHttpClient(...).query/.mutation/.action` |
| Toast on mutation | `toast.promise(promise, { loading, success, error })` from `sonner` |

## Checklist

- [ ] Every server data read in a client component uses `useQuery` (not `fetch`, not `ConvexHttpClient` from React)
- [ ] No `useEffect` synchronizes `useQuery` into local or Zustand state
- [ ] Loading state handled via `data === undefined`; empty state handled separately
- [ ] Conditional fetch uses `"skip"`, not undefined args
- [ ] Mutations follow `toast.promise(promise, { ... })` for any non-trivial action
- [ ] Optimistic updates only when the optimistic state is trivially derivable
- [ ] Server-only Convex calls use `ConvexHttpClient` with `.setAuth(token)` when authenticated
- [ ] No "invalidation" or "refetch" calls — Convex handles propagation automatically
