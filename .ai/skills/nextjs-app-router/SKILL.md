---
name: nextjs-app-router
description: Next.js 16 App Router conventions for noted-main including server/client components, file conventions, route groups, import order, and the `@/` path alias. Use when user asks to "create a page", "add a layout", "should this be a server or client component", or "set up an error boundary". Also use when adding 'use client' directives, creating loading.tsx or error.tsx files, organizing import order, or implementing dynamic imports for code splitting. Applies implicitly when implementing any feature that involves new pages, routing, or UI rendering.
summary: Server/client components, routing
---

<!--
Adapted from heatseeker-next/.ai/skills/nextjs-app-router/SKILL.md
Noted-specific adjustments:
- TanStack Query → Convex useQuery/useMutation/useAction (noted's reactive data layer)
- Dropped withApiHandler reference (noted doesn't have that pattern; see error-handling skill)
- Single @/ path alias (noted's tsconfig.json has just one)
- Examples grounded in noted's actual route groups: (landing), (main), (public)
-->

# Next.js 16 App Router Patterns

## Server Components by default

No directive needed — components are Server Components by default:

```typescript
// app/(landing)/page.tsx — Server Component
import { Heroes } from "./_components/heroes";
import { Features } from "./_components/features";

export default function LandingPage() {
  return (
    <>
      <Heroes />
      <Features />
    </>
  );
}
```

## When to use `'use client'`

Add `'use client'` ONLY when the file uses:

- React hooks (`useState`, `useEffect`, `useContext`)
- Convex client hooks (`useQuery`, `useMutation`, `useAction`) — these require client context
- Clerk client hooks (`useUser`, `useAuth`, `useSignIn`)
- Event handlers (`onClick`, `onChange`, `onSubmit`)
- Browser APIs (`window`, `localStorage`, `document`)
- Third-party libraries that internally use client-side features (BlockNote, Mantine, EdgeStore client SDK)

```typescript
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function DocumentList() {
  const [filter, setFilter] = useState<"all" | "archived">("all");
  const documents = useQuery(api.documents.getSidebar);

  if (!documents) return <Skeleton />;

  return <ul>{documents.map((d) => <li key={d._id}>{d.title}</li>)}</ul>;
}
```

**The reflex test**: would this file be useful if rendered on the server with no JavaScript? If yes, leave it server. If it needs interactivity or reactive data, mark `'use client'`.

## File conventions

```
app/
├── page.tsx              # Page component for this route
├── layout.tsx            # Layout wrapper (persists across child routes)
├── loading.tsx           # Suspense fallback for async server components
├── error.tsx             # Error boundary (must be 'use client')
├── not-found.tsx         # 404 UI
└── api/<route>/route.ts  # API route handler
```

## Route groups

noted uses three route groups to organize page-level concerns without affecting URLs:

```
app/
├── (landing)/                     # marketing surfaces — public, no auth
│   ├── layout.tsx
│   ├── page.tsx                   # / — the landing page
│   ├── _components/               # landing-only components (underscore = private)
│   └── features/                  # /features/ai-writing, /features/editor, etc.
├── (main)/                        # authenticated app surfaces
│   ├── layout.tsx                 # auth check + sidebar shell
│   ├── (routes)/
│   │   ├── documents/
│   │   │   ├── page.tsx           # /documents
│   │   │   └── [documentId]/
│   │   │       └── page.tsx       # /documents/<id>
│   │   └── coworkers/
│   │       └── page.tsx
│   └── _components/               # main-app-only components
└── (public)/                      # publicly-shared documents
    └── (routes)/
        └── preview/
            └── [documentId]/
                └── page.tsx       # /preview/<id>
```

**Underscore-prefixed folders** (`_components/`) are private — Next.js excludes them from routing. Use them for components scoped to a single route group.

## Import order

```typescript
// 1. React + Next
import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 2. Third-party libraries
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { z } from "zod";
import { toast } from "sonner";

// 3. noted-internal absolute imports (using @/)
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// 4. Relative imports (siblings only — never traverse upward more than ../)
import { DocumentItem } from "./document-item";
```

## Path alias

noted has a single `@/*` alias mapped to the repo root via `tsconfig.json`. Use it for any internal import:

```typescript
// ✅ GOOD
import { Button } from "@/components/ui/button";
import { useSearch } from "@/hooks/use-search";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

// ❌ BAD — relative path-traversal across folders
import { Button } from "../../../components/ui/button";
```

## Error boundary (`error.tsx`)

`error.tsx` MUST be `'use client'` — Next.js requires it for the error boundary to capture client errors.

```typescript
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 p-8">
      <h2 className="text-xl font-semibold">Something went wrong.</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

## Loading state (`loading.tsx`)

```typescript
import { Spinner } from "@/components/spinner";

export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Spinner size="md" />
    </div>
  );
}
```

## Layouts

Layouts persist across navigation within their subtree. Use them for chrome (sidebar, header) that shouldn't re-render on route change:

```typescript
// app/(main)/layout.tsx — auth + sidebar shell for the whole authenticated app
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Navigation } from "@/components/navigation";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  return (
    <div className="flex h-full">
      <Navigation />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
```

## Dynamic imports for code splitting

Use `next/dynamic` for components that are expensive, only used on certain interactions, or that contain client-only libraries:

```typescript
"use client";

import dynamic from "next/dynamic";

// BlockNote is heavy — only load when the editor renders
const Editor = dynamic(() => import("@/components/editor").then((m) => m.Editor), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

export const DocumentPage = ({ doc }: { doc: Doc<"documents"> }) => {
  return <Editor initialContent={doc.content} />;
};
```

## API routes vs Convex actions

noted has two server-side surfaces. Pick the right one:

| Need | Use |
|---|---|
| Reactive data read from the client | Convex `query` + `useQuery` |
| Transactional write triggered by a user action | Convex `mutation` + `useMutation` |
| Server-only logic that calls external HTTP/AI/EdgeStore | Convex `action` + `useAction` |
| Webhooks from external services (EdgeStore upload callback) | `app/api/.../route.ts` |
| AI streaming endpoint (Server-Sent Events to the browser) | `app/api/ai/.../route.ts` (current pattern in `app/api/ai/chat/`) |

If the data could live in Convex, use Convex. API routes are for boundaries that have to be HTTP. See the `convex-handlers` skill for the full picking-the-right-handler-type guide.

## Quick reference

| Need | Use |
|---|---|
| Reactive read | Convex `useQuery` (always reactive — never `fetch` in `useEffect`) |
| Mutation | Convex `useMutation` |
| External call (AI provider, EdgeStore signed URL) | Convex `action` + `useAction` |
| HTTP webhook / streaming | Next.js API route in `app/api/.../route.ts` |
| Auth on the server | `auth()` from `@clerk/nextjs/server` |
| Auth on the client | `useUser()` / `useAuth()` from `@clerk/nextjs` |
| Path alias | `@/*` (single alias to repo root) |
| Private route folder | underscore prefix: `_components/`, `_lib/` |
| Error UI | `error.tsx` with `'use client'` |
| Loading UI | `loading.tsx` (server component is fine) |
