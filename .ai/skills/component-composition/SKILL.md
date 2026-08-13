---
name: component-composition
description: Guidelines for splitting large components in noted-main into small, composable files with clear boundaries, minimal prop drilling, and localized state. Use when user asks to "split this component", "this file is too big", "extract a subcomponent", "reduce prop drilling", or "refactor component structure". Also use when creating new feature pages, reviewing component file sizes, or deciding whether state should be local or shared. Applies implicitly whenever building or modifying UI features.
summary: Split large components, reduce prop drilling
---

<!--
Adapted from heatseeker-next/.ai/skills/component-composition/SKILL.md
Noted-specific adjustments:
- TanStack Query → Convex useQuery (the same dedup-and-cache properties apply
  to "fetch where you use it"; even more so since Convex is reactive)
- File-role naming uses kebab-case (per noted's CLAUDE.md), not dot-separated
- Zustand stores live as hooks/use-<thing>.tsx, not in a stores/ folder
-->

# Component Composition & Splitting

## Core rules

1. **Max 100–200 lines per file.** Every component file should fit on one screen. The longer the file, the harder it is to reason about — and the more an agent will hallucinate behavior that isn't actually there.
2. **One exported component per file.** Two or three tiny utility helpers (a local type, a small formatter) are acceptable; anything comparable in importance or size gets its own file.
3. **Max 2–3 levels of prop passing.** If a prop would travel further, lift it to a Zustand store.
4. **State lives next to the callback that uses it.** `useState` in the component that owns the interaction.
5. **Shared UI state = Zustand store.** When two or more sibling components need the same UI value (modal state, selection, filters), move it to a Zustand store in `hooks/use-<thing>.tsx` instead of hoisting and drilling.
6. **Fetch data where you use it.** Call `useQuery(api.<module>.<fn>, args)` in the component that renders the data — Convex deduplicates subscriptions and caches automatically, so multiple `useQuery` calls for the same query share a single underlying subscription.
7. **Never mirror Convex data into Zustand.** If you need server data, use `useQuery` directly. Zustand is for UI interactions only (modals, selections, filters), or for sharing purely frontend state.

## Splitting decision tree

```
Is the component > 200 lines?
  └─ YES → Split it.

Does a section have its own state + handler (e.g., modal open/close, form draft)?
  └─ YES → Extract into a self-contained file.

Is a chunk of JSX purely presentational (no hooks, no event handlers)?
  └─ YES → Extract into its own file.

Is the same prop passed to 3+ descendant levels?
  └─ YES → Move it to a Zustand store in hooks/use-<thing>.tsx.

Is data being fetched at the top and passed down as props?
  └─ YES → Move the useQuery call down to where the data is rendered.
```

## Standard file roles

Split feature areas into files by **role**, not by visual size. Use kebab-case file names (per noted's `CLAUDE.md`):

| Role | Naming | Responsibility | Lines |
|---|---|---|---|
| **Main** | `<feature>.tsx` | Primary component — fetches its own data, renders UI | 40–120 |
| **Empty state** | `<feature>-empty-state.tsx` | Render when no data exists | 30–60 |
| **Skeleton** | `<feature>-skeleton.tsx` | Loading placeholder UI (returned while `useQuery` is undefined) | 20–40 |
| **Action section** | `<feature>-add-button.tsx` | Button that opens a modal, self-contained with its own Zustand store | 25–40 |
| **Modal/Dialog** | `<feature>-modal.tsx` | Full dialog with its own form state | 60–120 |
| **List item** | `<feature>-item.tsx` | Single item in a list/grid | 20–50 |
| **Utils** | `<feature>.utils.ts` | Pure helpers extracted from the component | 30–80 |
| **Test** | `<feature>.test.tsx` | Colocated test (Jest + RTL) | up to 150 |

## Fetch data where you use it

Every component that needs Convex data calls `useQuery` directly. Convex deduplicates subscriptions and caches results automatically — there's no overfetching concern, and the data is reactive (re-renders when underlying tables change).

```typescript
// components/sidebar/document-list.tsx — fetches its own data, no props needed
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DocumentItem } from "./document-item";
import { DocumentListSkeleton } from "./document-list-skeleton";
import { DocumentListEmptyState } from "./document-list-empty-state";

export const DocumentList = () => {
  const documents = useQuery(api.documents.getSidebar);

  if (documents === undefined) return <DocumentListSkeleton />;
  if (documents.length === 0) return <DocumentListEmptyState />;

  return (
    <ul className="flex flex-col gap-px">
      {documents.map((doc) => (
        <DocumentItem key={doc._id} document={doc} />
      ))}
    </ul>
  );
};
```

**Passing query data as props is fine for small/leaf components** — list items, cards, rows — up to 2 levels deep. The parent fetches, the child receives a slice:

```typescript
// document-item.tsx — leaf, receives the slice it needs
import type { Doc } from "@/convex/_generated/dataModel";

interface DocumentItemProps {
  document: Doc<"documents">;
}

export const DocumentItem = ({ document }: DocumentItemProps) => {
  return (
    <li className="px-3 py-1 hover:bg-muted">
      <Link href={`/documents/${document._id}`}>{document.title || "Untitled"}</Link>
    </li>
  );
};
```

If the leaf component needs OTHER data (e.g., the list of children for an expandable tree), it calls its own `useQuery`. Convex shares the subscription transparently.

## State lives next to the callback

Don't hoist state up just to make it accessible — if only one component owns the interaction, keep `useState` there:

```typescript
// ✅ GOOD — confirm dialog state lives in the component that opens it
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export const ArchiveButton = ({ documentId }: { documentId: Id<"documents"> }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const archive = useMutation(api.documents.archive);

  if (isConfirming) {
    return (
      <div>
        <Button onClick={() => archive({ id: documentId })}>Confirm archive</Button>
        <Button variant="ghost" onClick={() => setIsConfirming(false)}>Cancel</Button>
      </div>
    );
  }

  return <Button variant="ghost" onClick={() => setIsConfirming(true)}>Archive</Button>;
};
```

Only when a sibling component needs the same state (e.g., the sidebar's "is search open" state needs to be set from a header button AND read by the search modal) → lift to a Zustand store in `hooks/use-search.tsx`.

## Prop-drilling threshold

```typescript
// ❌ 3+ levels of drilling for shared UI state
<App>
  <Sidebar isSearchOpen={isOpen} onSearchToggle={toggle}>
    <SidebarHeader isSearchOpen={isOpen} onSearchToggle={toggle}>
      <SearchButton isSearchOpen={isOpen} onSearchToggle={toggle} />
    </SidebarHeader>
  </Sidebar>
</App>

// ✅ One Zustand store, every component reads what it needs
<App>
  <Sidebar>
    <SidebarHeader>
      <SearchButton />  {/* uses useSearch((s) => s.onOpen) */}
    </SidebarHeader>
  </Sidebar>
  <SearchModal />  {/* uses useSearch((s) => s.isOpen) */}
</App>
```

See the `state-management` skill for the Zustand pattern in noted.

## When to extract a subcomponent

A subcomponent is worth extracting when ANY of:

- It has its own state and handlers (it's a self-contained interaction unit)
- It's reused in 2+ places
- The parent file is over 150 lines
- The same chunk of JSX appears in 2+ branches of a conditional

A subcomponent is NOT worth extracting when:

- It's only used once and is < 20 lines of trivial JSX
- Extracting it would force prop drilling that wasn't there before
- The "subcomponent" is just a renaming of inline JSX without isolation

## When to extract a util file

If a component has a non-trivial pure function inside it (parsing, formatting, calculating), pull it into a `<feature>.utils.ts` next to the component, with a colocated `<feature>.utils.test.ts`. See `react-components` for the "extract logic, unit-test it" rule.

```
components/coworker/
├── coworker-panel.tsx
├── coworker-panel.utils.ts        # parseAIResponse, formatTokenCount, etc.
└── coworker-panel.utils.test.ts
```

## Anti-patterns

```typescript
// ❌ god-component that fetches everything and passes it down
export const DashboardPage = () => {
  const documents = useQuery(api.documents.getSidebar);
  const aiSettings = useQuery(api.aiSettings.get);
  const storage = useQuery(api.userStorage.get);
  return (
    <Sidebar
      documents={documents}
      aiSettings={aiSettings}
      storage={storage}
    >
      {/* drills these props down through 4 layers... */}
    </Sidebar>
  );
};

// ✅ each component fetches what it needs
export const DashboardPage = () => {
  return (
    <Sidebar>
      <DocumentList />  {/* fetches its own data */}
      <StorageMeter />  {/* fetches its own data */}
      <AISettingsButton />  {/* fetches its own data */}
    </Sidebar>
  );
};
```

```typescript
// ❌ component that's 350 lines because every variant lives in one file
// (look for big switch/case blocks or nested conditional rendering)

// ✅ split by role
components/coworker/
├── coworker-panel.tsx           # 80 lines, top-level component
├── coworker-message.tsx         # 50 lines, single message
├── coworker-empty-state.tsx     # 35 lines
├── coworker-skeleton.tsx        # 25 lines
└── coworker-input.tsx           # 90 lines, message composer
```

```typescript
// ❌ syncing useQuery into a Zustand store via useEffect
const documents = useQuery(api.documents.list);
useEffect(() => {
  if (documents) useDocumentsStore.getState().setDocuments(documents);
}, [documents]);

// ✅ Convex is your store. Just use the hook.
const documents = useQuery(api.documents.list);
```

## Checklist when reviewing a component file

- [ ] Under 200 lines? (open the file, count — if it scrolls, it's too long)
- [ ] One exported component? (multiple exports often signal a missed split)
- [ ] No prop drilling beyond 2–3 levels? (search for the prop name; how many files reference it?)
- [ ] Component fetches its own data via `useQuery`, not via a prop from the parent?
- [ ] State is in the component that owns the interaction (not lifted unnecessarily)?
- [ ] Shared UI state in a Zustand store at `hooks/use-<thing>.tsx`, not drilled?
- [ ] No Convex query results mirrored into Zustand?
- [ ] Non-trivial logic extracted to `<feature>.utils.ts` and unit tested?
