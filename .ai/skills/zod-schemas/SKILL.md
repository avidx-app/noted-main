---
name: zod-schemas
description: Zod validation conventions for noted-main — Zod is the boundary guard for anything that crosses into TypeScript from outside (API request bodies, AI tool inputs, env vars, URL params, third-party webhooks). Convex's `v.*` validators (NOT Zod) handle Convex handler arguments. Use when user asks to "validate this", "parse the response", "add form validation", or any time external/untrusted data is being processed. Applies implicitly whenever a feature handles API request bodies, AI tool calls, or other external input.
summary: Zod at HTTP/AI boundaries
---

<!--
Adapted from heatseeker-next/.ai/skills/zod-schemas/SKILL.md
Major adaptations:
- Convex handler args use v.* validators, NOT Zod — see convex-schema /
  convex-handlers skills. Zod is only for the *non-Convex* boundaries.
- Examples grounded in noted's actual Zod usage:
  - lib/agent/tools/workspace.ts (AI tool inputSchemas)
  - app/api/edgestore/[...edgestore]/route.ts (file upload schema)
- Dropped the heatseeker-specific shared/web type-folder structure.
- Noted has no react-hook-form, so the form-validation example targets a
  simpler pattern.
-->

# Zod Validation

**Zod is the boundary guard for non-Convex inputs.** Anywhere data crosses into noted's TypeScript code from outside, validate it with Zod and infer the type.

## Where Zod belongs in noted

| Source | Use Zod? | Notes |
|---|---|---|
| **AI tool inputs** (`lib/agent/tools/`) | ✅ Yes | The AI SDK's `tool({ inputSchema })` is Zod — already shipped pattern |
| **Next.js API route bodies** (`app/api/.../route.ts`) | ✅ Yes | EdgeStore route already does this |
| **Env vars** (process.env) | ✅ Yes (when there's a config of more than ~3 vars) | Fail fast at boot |
| **URL search params** (the rare time noted reads them) | ✅ Yes | Coerce + default |
| **Third-party webhooks** | ✅ Yes | You don't control the payload shape |
| **Form inputs** | ✅ Yes | When the form has more than 1–2 fields |
| **localStorage / Zustand-rehydrated state** | ✅ Yes | Local data can be corrupted/stale |
| **Convex handler `args`** | ❌ NO — use `v.*` from `convex/values` | See `convex-handlers` and `convex-schema` skills |
| **Convex query/mutation results** | ❌ No | Type-safe via the generated `Doc<>` types |
| **Internal function calls inside the app** | ❌ No | TypeScript is enough |

## Already shipped patterns

### AI tool input schema (`lib/agent/tools/workspace.ts`)

```typescript
import { tool } from "ai";
import { z } from "zod";

writeDocument: tool({
  description: "Create a new document in the workspace. Use Markdown for content formatting.",
  inputSchema: z.object({
    title: z.string().describe("Title of the new document"),
    content: z.string().optional().describe("Document content in Markdown format. Use # for headings, - for lists, **bold**, etc."),
    icon: z.string().optional().describe("Document icon - either an emoji (e.g. '📝') or leave empty"),
    parentId: z.string().optional().describe("Parent document ID for nesting"),
  }),
  execute: async ({ title, content, icon, parentId }) => { /* ... */ },
}),
```

The `.describe(...)` calls do double duty: Zod uses them for parsing errors, the AI SDK uses them in the tool-calling JSON schema given to the model. **Always describe AI tool inputs** — the descriptions are part of the tool's prompt surface.

### API route body validation (`app/api/edgestore/[...edgestore]/route.ts`)

```typescript
import { z } from "zod";

const router = ezsServer.router({
  publicFiles: ezsServer.publicFiles({
    accept: ["image/*", "application/pdf", /* ... */],
    maxSize: 10 * 1024 * 1024,
    metadata: z.object({
      name: z.string(),
      type: z.string(),
      lastModified: z.number(),
    }),
  }),
});
```

The same shape works for any custom API route — declare a schema at the top of the file, parse the body once, work with typed data after.

## Basic patterns

```typescript
import { z } from "zod";

// 1. Define the schema
const newDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  parentDocument: z.string().optional(),
});

// 2. Infer the type — never hand-write a parallel `type` declaration
type NewDocumentInput = z.infer<typeof newDocumentSchema>;

// 3a. parse() — throws on invalid (use when bad input is genuinely a bug)
const parsed = newDocumentSchema.parse(unknownData);

// 3b. safeParse() — returns a result object (use at trust boundaries)
const result = newDocumentSchema.safeParse(unknownData);
if (!result.success) {
  return Response.json({ error: result.error.issues }, { status: 400 });
}
const data = result.data;
```

**Rule of thumb:** at trust boundaries (HTTP request, webhook, AI tool input) use `safeParse()` and return a 4xx with `result.error.issues`. Inside the app, when you've already validated once, `parse()` is fine — a failure means the contract is broken.

## Common patterns by scenario

### Next.js API route body

```typescript
// app/api/<route>/route.ts
import { z } from "zod";
import { NextRequest } from "next/server";

const bodySchema = z.object({
  documentId: z.string(),
  prompt: z.string().min(1).max(4000),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const result = bodySchema.safeParse(json);
  if (!result.success) {
    return Response.json(
      { error: "Invalid request body", issues: result.error.issues },
      { status: 400 },
    );
  }

  const { documentId, prompt } = result.data;
  // ... safe to use
}
```

### Env vars (when noted's config grows)

There's no `lib/env.ts` today — when there are more than ~3 env vars to validate, introduce one:

```typescript
// lib/env.ts (proposed)
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_CONVEX_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_AMPLITUDE_API_KEY: z.string().optional(),
  ENCRYPTION_KEY: z.string().min(32),
});

export const env = envSchema.parse(process.env);
```

### URL search params

```typescript
// app/(public)/(routes)/preview/[documentId]/page.tsx-style usage
const searchParamsSchema = z.object({
  ref: z.string().optional(),
  utm_source: z.string().optional(),
});

const params = searchParamsSchema.parse(Object.fromEntries(searchParams));
```

### Form input (no react-hook-form needed for small forms)

```typescript
"use client";

import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";

const titleSchema = z
  .string()
  .min(1, "Title is required")
  .max(200, "Title must be at most 200 characters");

export const RenameForm = ({ onSubmit }: { onSubmit: (title: string) => void }) => {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = titleSchema.safeParse(title);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Invalid title");
      return;
    }
    onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
    </form>
  );
};
```

## Schema shape patterns

### Optionals and defaults

```typescript
z.object({
  title: z.string(),
  description: z.string().optional(),         // string | undefined
  count: z.number().default(0),               // 0 if missing
  tags: z.array(z.string()).default([]),
});
```

### Enums via literals

Inside an app boundary, prefer `z.enum`. For cross-boundary work where you want to share the literal list, use `z.union(z.literal(...))`:

```typescript
z.enum(["openai", "anthropic", "google"]);

z.union([z.literal("user"), z.literal("assistant")]);
```

### Coercion (env vars, search params, form inputs)

```typescript
z.coerce.number();      // "123" → 123
z.coerce.boolean();     // "true" → true; "false" → true (!!) — use enum + transform for safer
z.coerce.date();        // "2026-04-29" → Date
```

`z.coerce.boolean()` is famously surprising — `Boolean("false") === true`. For boolean env vars use `z.enum(["true", "false"]).transform((s) => s === "true")` instead.

### Discriminated unions

```typescript
const aiResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), text: z.string() }),
  z.object({ status: z.literal("error"), message: z.string() }),
  z.object({ status: z.literal("rate_limited"), retryAfterMs: z.number() }),
]);

type AiResponse = z.infer<typeof aiResponseSchema>;
// → { status: "success"; text: string }
//   | { status: "error"; message: string }
//   | { status: "rate_limited"; retryAfterMs: number }
```

The discriminator (here `status`) makes the union narrow correctly via switch / if-blocks — far better than a flat union.

### Refinements (custom validation)

```typescript
const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .refine((v) => /[A-Z]/.test(v), "Must contain an uppercase letter")
  .refine((v) => /\d/.test(v), "Must contain a digit");
```

## Where schemas live

- **One-shot schemas (used in one file)** — declared at the top of that file, just above the handler/component.
- **Schemas reused across two or more files** — extracted to a `*.schemas.ts` file colocated with the consumers, or to `lib/<domain>.schemas.ts` if the consumers span folders.
- **Tool input schemas** — stay inside the tool definition file; the AI SDK couples them to the tool itself.

There is **no** `types/` directory today and the convention is to colocate. Don't create a top-level `schemas/` folder unless three or more domains accumulate.

## Anti-patterns

```typescript
// ❌ Zod for Convex handler args — use v.* instead
import { mutation } from "./_generated/server";
import { z } from "zod";
const argsSchema = z.object({ id: z.string() });   // not how Convex handlers work
// ✅ use v.* (see convex-handlers skill)
import { v } from "convex/values";
export const archive = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => { /* ... */ },
});

// ❌ z.coerce.boolean() on a string env var — counter-intuitive truthy
NEXT_PUBLIC_FLAG: z.coerce.boolean(),   // "false" → true
// ✅ explicit
NEXT_PUBLIC_FLAG: z.enum(["true", "false"]).transform((s) => s === "true"),

// ❌ hand-written type alongside the schema — drifts the moment the schema changes
const userSchema = z.object({ id: z.string(), name: z.string() });
type User = { id: string; name: string };       // duplicate source of truth
// ✅ infer
type User = z.infer<typeof userSchema>;

// ❌ parse() at a trust boundary, throwing into the framework's default 500
export async function POST(req: Request) {
  const body = bodySchema.parse(await req.json());   // → 500 with stack trace; should be 400
}
// ✅ safeParse + 400
const result = bodySchema.safeParse(await req.json());
if (!result.success) return Response.json({ error: result.error.issues }, { status: 400 });

// ❌ shipping the entire ZodIssue tree in user-facing error messages
toast.error(JSON.stringify(result.error.issues));
// ✅ first issue is usually enough; full tree is fine in API responses
toast.error(result.error.issues[0]?.message ?? "Invalid input");
```

## Quick reference

| Need | API |
|---|---|
| Throw on invalid | `schema.parse(data)` |
| Return `{ success, data | error }` | `schema.safeParse(data)` |
| Infer the TS type | `z.infer<typeof schema>` |
| Optional field | `.optional()` |
| Default value | `.default(value)` |
| Coerce string → number | `z.coerce.number()` |
| Coerce string → boolean (carefully) | use enum + transform, not `z.coerce.boolean()` |
| Tagged union | `z.discriminatedUnion("status", [ ... ])` |
| Custom check | `.refine((v) => ..., message)` |
| Trim / lowercase | `z.string().trim().toLowerCase()` |

## Checklist

- [ ] External boundary (HTTP body, webhook, AI tool input, env, search params, localStorage) is parsed through Zod
- [ ] Convex handler args use `v.*`, NOT Zod
- [ ] No hand-written types that duplicate a Zod schema — use `z.infer`
- [ ] At trust boundaries: `safeParse()` + 400-style error response (not bare `parse()`)
- [ ] AI tool inputs include `.describe(...)` on every field
- [ ] No `z.coerce.boolean()` on env vars or search params
- [ ] Schemas reused in 2+ places extracted to `*.schemas.ts`
