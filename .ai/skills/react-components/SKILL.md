---
name: react-components
description: React component patterns for noted-main including forwardRef, typed props with JSDoc, the cn() helper, cva variants for shadcn primitives, and the "almost never useMemo/useCallback" performance rule. Use when user asks to "build a component", "add a button variant", "style with Tailwind", or "should I memoize this". Also use when defining component props, organizing component files, or extending shadcn primitives. Applies implicitly when building any UI as part of a feature.
summary: forwardRef, cva, cn(), no premature memo
---

<!--
Adapted from heatseeker-next/.ai/skills/react-components/SKILL.md
Noted-specific adjustments:
- Examples grounded in noted's actual primitives (Button in components/ui/button.tsx)
- Kebab-case file naming (button.tsx, button.test.tsx) per noted's CLAUDE.md
- Single-file components (no barrel exports under each primitive directory —
  noted's components/ui/ flat layout matches stock shadcn)
- DESIGN.md reference added for new variants (the visual contract per Constitution §XVI)
-->

# React Component Patterns

## File location

```
components/
├── ui/                          # shadcn primitives — DO NOT MODIFY (Constitution §XII)
│   ├── button.tsx               # the primitive itself (cva variants live here)
│   ├── button.test.tsx          # colocated test
│   ├── dialog.tsx
│   └── ...
├── <feature>/                   # feature-scoped wrappers / compositions
│   ├── coworker-message.tsx
│   ├── coworker-message.test.tsx
│   └── coworker-panel.tsx
└── editor.tsx                   # top-level features that don't merit a folder
```

**File naming**: kebab-case files, PascalCase exports. So `coworker-message.tsx` exports `CoworkerMessage`. (See `file-naming` reflex in the Constitution.)

## The forwardRef pattern (when wrapping a primitive)

```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

export interface PresenceIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of active collaborators on this document */
  count: number;
  /** Show a pulsing dot when count > 0 */
  pulse?: boolean;
}

export const PresenceIndicator = React.forwardRef<
  HTMLDivElement,
  PresenceIndicatorProps
>(({ count, pulse, className, ...props }, ref) => {
  if (count === 0) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-1 rounded-full bg-muted px-2 py-0.5",
        pulse && "animate-pulse",
        className,
      )}
      {...props}
    >
      <span className="size-1.5 rounded-full bg-brand-blue" />
      <span className="text-xs">{count}</span>
    </div>
  );
});
PresenceIndicator.displayName = "PresenceIndicator";
```

`forwardRef` matters whenever the component might be passed a `ref` (e.g., used with `<Slot>` in shadcn, or as a tooltip trigger). When in doubt, use it for any leaf primitive.

## Typed props with JSDoc

Always document non-obvious props:

```typescript
export interface DocumentCardProps {
  /** Convex document ID — used for navigation and analytics. */
  documentId: Id<"documents">;
  /** Plain-text title, may be empty for "Untitled" docs. */
  title: string;
  /** Whether the doc is published to the web; affects share affordances. */
  isPublished: boolean;
  /** Optional callback — fires after the user confirms archive. */
  onArchive?: (id: Id<"documents">) => void;
}
```

For props that map directly to a Convex doc, prefer the generated `Doc<>` type:

```typescript
import type { Doc } from "@/convex/_generated/dataModel";

export interface DocumentCardProps {
  document: Doc<"documents">;
  onArchive?: (id: Doc<"documents">["_id"]) => void;
}
```

## `cn()` for conditional Tailwind

`cn()` from `@/lib/utils` merges classes via `clsx` + `tailwind-merge`. Always use it for conditionals or merging incoming `className`:

```typescript
import { cn } from "@/lib/utils";

// ✅ GOOD
<div
  className={cn(
    "rounded-md border px-3 py-2",
    isActive && "border-brand-blue bg-muted",
    isDisabled && "pointer-events-none opacity-50",
    className, // merges incoming className without conflict
  )}
/>

// ❌ BAD — string concat lets conflicting Tailwind classes "win" by source order, not by intent
<div className={`rounded-md border px-3 py-2 ${isActive ? "border-brand-blue" : ""}`} />
```

## Variants via cva (in shadcn primitives)

Variants for primitives live in `components/ui/<primitive>.tsx` using `class-variance-authority`. **Do not modify** the existing variants — add new ones. New variants must also be documented in `DESIGN.md` (`components:` block) per Constitution §XVI.

```typescript
// components/ui/button.tsx — current shipped pattern
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
```

When adding a variant, also add the corresponding entry to `DESIGN.md`:

```yaml
# DESIGN.md
components:
  button-cta-secondary:
    backgroundColor: "{colors.brand-violet}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    height: 48px
    padding: "0 32px"
```

## `useMemo` / `useCallback`: almost never

Stop the proliferation. React is fast. Re-creating functions and computing values on render is cheap. Memoization adds noise to your code and rarely improves real performance.

```typescript
// ❌ BAD — premature memoization
const handleClick = useCallback(() => archive({ id: doc._id }), [doc._id, archive]);
const archivedCount = useMemo(() => docs.filter((d) => d.isArchived).length, [docs]);

// ✅ GOOD — just write the code
const handleClick = () => archive({ id: doc._id });
const archivedCount = docs.filter((d) => d.isArchived).length;
```

The two situations where memoization is warranted:

1. **The value or function is a dependency of another hook** (`useEffect`, `useMemo`). The reference must be stable.
2. **You have measured a real performance regression** in a `React.memo`-wrapped component receiving a new prop reference each render.

Without one of those, drop the `useCallback`/`useMemo`.

## `React.memo`: also almost never

```typescript
// Acceptable only when:
// (a) the component is genuinely expensive (large tree, complex compute),
// (b) you've profiled and confirmed re-renders are the bottleneck,
// (c) parents pass stable references (otherwise memo is a no-op).

export const ExpensiveDocumentTree = React.memo(function ExpensiveDocumentTree({
  rootId,
}: {
  rootId: Id<"documents">;
}) {
  // ...
});
```

If two of those three aren't true, skip `React.memo`.

## Keys for lists

```typescript
// ✅ GOOD — unique, stable keys
{documents.map((doc) => <DocumentCard key={doc._id} document={doc} />)}

// ❌ BAD — array index as key (breaks reconciliation when items are reordered)
{documents.map((doc, i) => <DocumentCard key={i} document={doc} />)}
```

Convex `_id` is the right key for any list of Convex docs.

## Extract logic, unit-test it

Any non-trivial function inside a component should be extracted and unit-tested. Components render; logic lives in plain functions in plain files.

### Small helpers → util file next to the component

```
components/coworker/
├── coworker-panel.tsx
├── coworker-panel.utils.ts        # small helpers — formatters, predicates
└── coworker-panel.utils.test.ts
```

### Larger or reusable functions → their own file in `lib/`

```
lib/
├── format-document-title.ts       # used in many places
└── format-document-title.test.ts
```

### What MUST be extracted and tested

- Data transformations (mapping, filtering, reshaping Convex query results)
- Formatters (dates via date-fns, file sizes, document titles, AI provider labels)
- Validators (Clerk identity shape checks, BlockNote document content checks)
- Calculators (storage quota %, presence count, AI token estimates)
- Parsers (URL params, Markdown excerpts, AI response chunks)

### What can stay inline

- One-line predicates: `const isEmpty = documents.length === 0;`
- Direct event handler callbacks: `onClick={() => setOpen(true)}`
- Trivial derived values: `const title = doc.title || "Untitled";`

See the `unit-testing` skill for what to test once it's extracted.

## Server vs client component checklist

When you create a new component, decide before writing the first JSX line:

- [ ] Does this file use any of: `useState`, `useEffect`, `useQuery` (Convex), `useMutation`, `useUser` (Clerk), `onClick`/`onChange`/`onSubmit`, `window`/`document`?
  - **Yes** → start the file with `"use client";`
  - **No** → no directive needed; this is a Server Component
- [ ] Does it consume any prop that's a function from a Server Component? Server Components can't pass functions across the boundary — keep the handler in the client child or use a Server Action.

See the `nextjs-app-router` skill for the broader server/client decision tree.

## Anti-patterns

```typescript
// ❌ inline hex color in className
<div className="bg-[#2563EB] text-white">CTA</div>
// ✅ use a token-aware utility (or wrap in a primitive variant)
<Button variant="cta">CTA</Button>

// ❌ defining a one-off variant inline that should be in components/ui/
<button className="inline-flex h-10 items-center rounded-sm bg-brand-blue px-4 text-sm font-medium text-white hover:bg-brand-blue/90">…</button>
// ✅ add a variant to button.tsx via cva, document in DESIGN.md, then:
<Button variant="cta">…</Button>

// ❌ string concat for class names
<div className={`base ${isActive ? "active" : ""}`} />
// ✅ cn() with conditional pieces
<div className={cn("base", isActive && "active")} />

// ❌ syncing a useQuery result into local state via useEffect
const result = useQuery(api.documents.get, { id });
const [doc, setDoc] = useState<Doc<"documents"> | null>(null);
useEffect(() => { if (result) setDoc(result); }, [result]);
// ✅ just use the result directly — useQuery is reactive
const document = useQuery(api.documents.get, { id });
return document ? <Editor doc={document} /> : <Skeleton />;
```

(See `derived-state` and `effect-to-event` for the broader rules.)

## Checklist for a new component

- [ ] kebab-case filename, PascalCase export
- [ ] Server Component by default; `"use client"` only if needed
- [ ] Props typed via `interface` with JSDoc on non-obvious fields
- [ ] `cn()` for any conditional or merged className
- [ ] No `useMemo`/`useCallback` unless a hook dependency or a measured perf issue
- [ ] No `React.memo` unless profiled
- [ ] Stable keys for lists (`_id` for Convex docs)
- [ ] Non-trivial logic extracted to a `*.utils.ts` next to the component (or `lib/` if reused)
- [ ] If a new variant: added via `cva` in `components/ui/<primitive>.tsx` AND documented in `DESIGN.md`
- [ ] Colocated `*.test.tsx` if there's logic worth testing
