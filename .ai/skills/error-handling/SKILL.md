---
name: error-handling
description: Error handling conventions for noted-main — using `throw new Error(message)` consistently, with naming conventions for messages (auth, not-found, ownership, validation) and the auth-then-ownership-then-validation order. Use when user asks to "add error handling", "throw the right error", or "handle failures". Also use when writing or reviewing any Convex handler, Next.js API route, or AI tool that can fail. Applies implicitly whenever writing server code — the auth + ownership + validation triad must always be in place.
summary: throw new Error() conventions
---

<!--
Adapted from heatseeker-next/.ai/skills/error-handling/SKILL.md
Major adaptation: noted uses plain `throw new Error(message)` everywhere
today (no custom error classes from a `lib/error` module). This skill
documents that pattern, with a "Future direction" sidebar for when the
team is ready to upgrade. Examples grounded in real noted handlers.
-->

# Error Handling

## Today's pattern: `throw new Error(message)`

noted-main currently uses native `Error` instances throughout, with conventional message strings that downstream code (Convex client, Next.js API routes, UI toasts) treats by string-matching when it needs to. There is **no** custom error-class hierarchy yet. This skill documents the convention so that what we throw stays consistent across new handlers, even though the structural type is uniform.

Real examples from the codebase (`convex/aiSettings.ts`, `convex/documents.ts`):

```typescript
throw new Error("Not authenticated");
throw new Error("Not authorized");
throw new Error("Document not found");
throw new Error("AI settings not found");
throw new Error(`No API key configured for ${targetProvider}`);
throw new Error(`Connection failed: ${msg}`);
throw new Error("ENCRYPTION_KEY environment variable is not set");
```

When you write a new handler, follow these conventions for what to throw and in what order.

## The auth → ownership → validation triad

Almost every Convex mutation/action that touches user data runs the same three checks at the top, in this order:

```typescript
// convex/documents.ts — archive (real example, slightly trimmed)
export const archive = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        // 1. Auth
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // 2. Existence (effectively also ownership-prep)
        const existingDocument = await ctx.db.get(args.id);
        if (!existingDocument) {
            throw new Error("Document not found");
        }

        // 3. Ownership
        if (existingDocument.userId !== userId) {
            throw new Error("Not authorized");
        }

        // ... business logic only AFTER all three checks pass
    },
});
```

**Order matters:**
- **Auth first** — never reveal whether a resource exists to an unauthenticated caller.
- **Existence next** — without the doc you can't check ownership.
- **Ownership last** — once you know the doc exists *and* who's asking, you can decide whether to allow access.
- **Then business logic** — once the triad passes, the rest of the handler can assume `existingDocument` is non-null and owned by the caller.

## Conventional messages

Use these exact strings whenever the situation matches. Drift in wording leaks into UI and breaks any string-matching downstream:

| Situation | Message |
|---|---|
| `ctx.auth.getUserIdentity()` returned null | `"Not authenticated"` |
| Resource exists but doesn't belong to caller | `"Not authorized"` |
| Resource doesn't exist | `"<Singular> not found"` (e.g., `"Document not found"`, `"AI settings not found"`) |
| Required env var is missing | `"<NAME> environment variable is not set"` |
| Format/parse failure on user input | `"Invalid <thing> format"` (mention expected format) |
| External API returned an error | <code>\`<thing> failed: ${err}\`</code> |
| User already in a state that blocks the action | `"Cannot <action> a <state> <thing>"` (e.g., `"Cannot publish an archived document"`) |

Treat these as a small, stable vocabulary — don't introduce new wording for a situation already covered by an existing one.

## Throw, don't return

```typescript
// ❌ BAD — caller might forget to check
async function getDocument(id: Id<'documents'>) {
    const doc = await ctx.db.get(id);
    if (!doc) return { success: false, error: 'Not found' };
    return { success: true, data: doc };
}

// ✅ GOOD — impossible to ignore, type narrows naturally after the check
async function getDocument(id: Id<'documents'>) {
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error('Document not found');
    return doc; // TS knows it's Doc<'documents'>, not null
}
```

## Fail fast

```typescript
// ❌ BAD — crashes deep with a confusing stack trace
function rename(args: { id: Id<'documents'>; title: string }) {
    // ... lots of code ...
    const truncated = args.title.trim().slice(0, 100);
    // What if args.title was undefined? You get a runtime crash 30 lines down.
}

// ✅ GOOD — fail at the top, message names the actual problem
function rename(args: { id: Id<'documents'>; title: string }) {
    if (!args.title || args.title.trim().length === 0) {
        throw new Error("Title is required");
    }
    if (args.title.length > 200) {
        throw new Error("Title must be at most 200 characters");
    }
    const truncated = args.title.trim().slice(0, 100);
    // Now safe.
}
```

The `args` validator on Convex handlers (`v.string()`, `v.id(...)`, `v.optional(...)`) catches most schema-level issues. This skill covers business-rule failures the validator can't see (empty string, length cap, status guard).

## Wrapping external API failures

```typescript
// ✅ Include the original error in the message — it gets logged automatically
try {
    const res = await fetch(amplitudeUrl, { ... });
    if (!res.ok) throw new Error(`Amplitude responded ${res.status}`);
} catch (err) {
    throw new Error(`Amplitude tracking failed: ${err}`);
}
```

The convention `"<thing> failed: ${err}"` (note the colon-space, then the original error) is used throughout `convex/aiSettingsActions.ts`. Match it.

## In Next.js API routes

API routes in `app/api/**/route.ts` should throw the same way. Next.js's default behavior turns thrown errors into 500s, which is fine for now. If a route needs to map an error to a specific HTTP status, do it explicitly:

```typescript
export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    if (!body) {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    // ... rest of the handler
}
```

When in doubt, `throw new Error(...)` and let the framework return 500. Callers should already be defensive against errors.

## On the client (toasts)

When a thrown error from a Convex mutation/action needs to surface to the user, catch in the handler and toast:

```typescript
import { toast } from 'sonner';

async function handleArchive() {
    try {
        await archive({ id: doc._id });
        toast.success('Archived');
    } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
}
```

The conventional messages above are intentionally short and user-readable — surfacing them directly in a toast is fine.

## Future direction — custom error classes (not adopted yet)

When noted-main outgrows plain `Error` (typically when we want HTTP-status mapping in API routes, structured error logging, or i18n on the client), the established upgrade is a small set of custom classes:

```typescript
// hypothetical lib/error.ts — NOT in noted today
export class NotFoundError extends Error { /* ... */ }
export class UnauthorizedError extends Error { /* ... */ }
export class ValidationError extends Error { /* ... */ }
export class RateLimitError extends Error { /* ... */ }
```

Don't add these preemptively. The right time is when at least one of these is true:
- We have ≥3 distinct API routes that each need different HTTP statuses for different failure modes.
- We're integrating with an error-logging service (Sentry, Datadog) and want classification.
- We're internationalizing the UI and need stable error codes, not strings.

Until then, keep the surface area small: `throw new Error(message)` with the conventions above is good enough.

## Quick reference

| Scenario | Throw |
|---|---|
| No Clerk identity | `throw new Error("Not authenticated");` |
| Doc/setting/file missing | `throw new Error("<Thing> not found");` |
| Wrong user | `throw new Error("Not authorized");` |
| Empty/missing required field | `throw new Error("<Field> is required");` |
| Field too long / wrong format | `throw new Error("<Field> must be <constraint>");` |
| State conflict | `throw new Error("Cannot <action> a <state> <thing>");` |
| External API error | <code>throw new Error(\`<service> failed: ${err}\`);</code> |
| Missing env var | `throw new Error("<NAME> environment variable is not set");` |

## Checklist

- [ ] Auth check is the **first** statement after the `args` block in any mutation/action that touches user data
- [ ] Existence check happens before ownership
- [ ] Ownership check happens before business logic
- [ ] Error messages match the conventional vocabulary (table above)
- [ ] No `return { success: false, error: ... }` — throw instead
- [ ] External API failures wrapped with `throw new Error(\`<service> failed: ${err}\`)` to preserve the original
- [ ] On the client, errors are caught at the handler boundary and surfaced via `sonner` toast using `err.message`
