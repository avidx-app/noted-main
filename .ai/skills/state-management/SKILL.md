---
name: state-management
description: 'State management patterns for noted-main — `useState` for component-local UI, Zustand stores in `hooks/use-*.tsx` for shared UI state across components, and Convex `useQuery`/`useMutation` for ALL remote data. Use when user asks to "add state", "create a store", "should this be local or global state", or "share state between components". Applies implicitly whenever a feature involves shared UI state. The strict rule: never mirror Convex data into Zustand.'
summary: Convex for server data, Zustand for UI
---

<!--
Adapted from heatseeker-next/.ai/skills/state-management/SKILL.md
MAJOR adaptation: noted's Zustand pattern is much simpler than heatseeker's.
- noted uses `create<T>` directly from zustand (no middleware factory)
- Stores live as `hooks/use-<thing>.tsx`, not in a `stores/` directory
- No definition/store/provider triplet — single-file pattern
- TanStack Query → Convex useQuery/useMutation/useAction (the boundary that matters)
- No "server component initialization via Provider" pattern needed since
  Convex queries are reactive and read identity from Clerk directly
-->

# State Management

## When to use what

| Need | Solution |
|---|---|
| UI state in one component (form input, hover state, accordion open) | `useState` |
| UI state shared across components (search modal open, settings panel, file picker) | Zustand store as a hook in `hooks/use-<thing>.tsx` |
| Reactive read of Convex data | `useQuery(api.<module>.<fn>, args)` — **NEVER mirror into Zustand** |
| Transactional write to Convex | `useMutation(api.<module>.<fn>)` |
| External call (AI provider, EdgeStore) from the client | `useAction(api.<module>.<fn>)` (when the action is exposed) |
| Computed value from existing state | Derive inline during render — don't store. See `derived-state` skill. |

## The boundary that matters

**Zustand is for UI-only state.** **Convex hooks are for data.** They never overlap. Mirroring is the most common mistake.

```typescript
// ❌ NEVER — mirroring Convex data into Zustand
const documents = useQuery(api.documents.getSidebar);
useEffect(() => {
  if (documents) useDocumentsStore.getState().setDocuments(documents);
}, [documents]);

// ✅ — read directly where you need it. Convex deduplicates and caches.
const documents = useQuery(api.documents.getSidebar);
```

`useQuery` is reactive by default — when the underlying Convex data changes, every component subscribed re-renders automatically. There's no overfetching concern; multiple components calling the same query share a single subscription.

## Zustand pattern in noted

noted's stores are simple Zustand `create<T>` calls living as files in `hooks/use-<thing>.tsx`. Each store is a single file, exports a single hook, and follows kebab-case naming.

```typescript
// hooks/use-search.tsx — the actual shipped pattern
import { create } from "zustand";

type SearchStore = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  toggle: () => void;
};

export const useSearch = create<SearchStore>((set, get) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),
}));
```

```typescript
// hooks/use-cover-image.tsx — same pattern, different surface
import { create } from "zustand";
import type { Id } from "@/convex/_generated/dataModel";

type CoverImageStore = {
  url?: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onReplace: (url: string) => void;
};

export const useCoverImage = create<CoverImageStore>((set) => ({
  url: undefined,
  isOpen: false,
  onOpen: () => set({ isOpen: true, url: undefined }),
  onClose: () => set({ isOpen: false, url: undefined }),
  onReplace: (url) => set({ isOpen: true, url }),
}));
```

**That's the whole pattern.** No middleware factory, no provider component, no `*.definition.ts` split.

### Naming convention

- File: `hooks/use-<thing>.tsx` (kebab-case)
- Hook export: `use<Thing>` (camelCase)
- Type: `<Thing>Store` (PascalCase)

Examples already in the repo: `useSearch`, `useCoverImage`, `useSettings`, `useFilePicker`, `useCoworker`, `useCoworkerConfig`, `useScrollTop`, `useOrigin`, `useTrackedUpload`.

### Selecting state in a component

```typescript
"use client";

import { useSearch } from "@/hooks/use-search";

export const SearchTrigger = () => {
  // ✅ Select the specific field you need — Zustand re-renders only when it changes
  const isOpen = useSearch((s) => s.isOpen);
  const onOpen = useSearch((s) => s.onOpen);

  return <button onClick={onOpen}>Open search ({isOpen ? "open" : "closed"})</button>;
};
```

**Always select specific fields.** Avoid `useSearch((s) => s)` — it re-renders the component on any store change, including unrelated fields.

### Reading state outside React (e.g., in event handlers, side effects)

```typescript
import { useSearch } from "@/hooks/use-search";

// In a non-React function or event handler outside the component tree:
const isCurrentlyOpen = useSearch.getState().isOpen;
useSearch.getState().onClose();
```

Zustand stores expose `getState()` and `setState()` for outside-React access. Use sparingly — most state reads should be inside components via the hook.

## When to use `useState` vs Zustand

The split:

- **`useState` if**: only one component reads/writes the value AND the value doesn't need to outlive that component's mount cycle.
- **Zustand if**: two or more sibling/cousin components need the same value, OR the value needs to persist across mounts (e.g., a modal that should remember its last-opened state when reopened from elsewhere), OR you'd otherwise have to drill the prop through 3+ levels.

Most form fields, hover states, accordion open/close inside one card → `useState`. Most "modal/picker is open" state shared between a trigger button and the modal itself → Zustand.

## Don't initialize Zustand from a server component via `useEffect`

If you need to seed a store with data from a server component, do it synchronously inside a client wrapper using `useRef` — never `useEffect` (which runs after first render):

```typescript
"use client";

import { useRef } from "react";
import { useDocumentDraft } from "@/hooks/use-document-draft";

export const DocumentDraftProvider = ({
  children,
  initialDraft,
}: {
  children: React.ReactNode;
  initialDraft: string;
}) => {
  const initializedRef = useRef(false);

  if (!initializedRef.current) {
    useDocumentDraft.setState({ draft: initialDraft });
    initializedRef.current = true;
  }

  return <>{children}</>;
};
```

This pattern is rare in noted — most data flows through Convex `useQuery`, which doesn't need a Zustand bridge. Reach for it only when you have static server-rendered data that needs to seed a client-only store.

## What Zustand is for in noted

Looking at the actual shipped stores, the pattern is consistently:

- **Modals / pickers / panels open-state**: `useSearch`, `useCoverImage`, `useFilePicker`, `useSettings`
- **Coworker UI session state**: `useCoworker`, `useCoworkerConfig`
- **DOM / browser values that don't fit React**: `useScrollTop`, `useOrigin`
- **Transient upload progress**: `useTrackedUpload`

If you find yourself reaching for Zustand to store anything that came from Convex, **stop** — read it directly via `useQuery` instead.

## Anti-patterns

```typescript
// ❌ mirroring Convex into Zustand
const documents = useQuery(api.documents.list);
useEffect(() => {
  if (documents) useDocumentsStore.getState().setDocuments(documents);
}, [documents]);

// ❌ selecting the entire store (re-renders on every change)
const search = useSearch((s) => s);

// ❌ over-globalizing single-component state
// (a `useFormFieldValue` Zustand store for one form field — just use useState)

// ❌ over-localizing shared state via prop drilling
//   <App> → <Sidebar isSearchOpen={...} onSearchToggle={...}>
//     → <SidebarHeader isSearchOpen={...} onSearchToggle={...}>
//       → <SearchButton isSearchOpen={...} onSearchToggle={...} />
// (3+ levels of drilling for shared UI state — use a Zustand store instead)

// ❌ deriving in state instead of in render
const docs = useQuery(api.documents.list);
const [archivedCount, setArchivedCount] = useState(0);
useEffect(() => {
  if (docs) setArchivedCount(docs.filter((d) => d.isArchived).length);
}, [docs]);
// ✅ derive inline during render
const docs = useQuery(api.documents.list);
const archivedCount = docs?.filter((d) => d.isArchived).length ?? 0;
```

## Rules

### MUST DO

- Put Zustand stores in `hooks/use-<thing>.tsx` using `create<T>` from `zustand`
- Select specific fields: `useSearch((s) => s.isOpen)`, never the whole store
- Use Convex hooks (`useQuery`, `useMutation`, `useAction`) for ALL Convex data
- Use `useState` for component-local UI when no other component needs it
- Reach for Zustand when shared UI state would otherwise drill 3+ levels

### NEVER DO

- Mirror Convex query results into a Zustand store
- Initialize a Zustand store from a server component via `useEffect` (use `useRef` synchronously)
- `fetch` Convex data via `useEffect` — use `useQuery`
- Select the entire store (`(s) => s`) — re-renders on every change
- Add Zustand middleware (devtools, immer, persist) without a clear reason — most stores don't need it
