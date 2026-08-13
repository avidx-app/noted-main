---
name: api-routes-and-actions
description: Picking the right server surface in noted-main — Convex `query`/`mutation`/`action` for almost all backend logic, vs Next.js API routes (`app/api/.../route.ts`) for HTTP-specific boundaries (third-party webhooks, AI streaming endpoints, file-upload service handlers). Use when the user asks "should this be a Convex action or an API route", "where do I put this webhook", or any time new server-side functionality is added. Replaces the heatseeker `api-endpoints` skill (which assumed every server feature is an API route — noted's split is different).
summary: Convex vs Next.js API route boundaries
---

<!--
Noted-native skill — replaces heatseeker's `api-endpoints` skill.
Heatseeker is API-route-first because it has no Convex; noted has only
3 API routes today (edgestore, ai/chat, ai/coworker), and almost all
server logic lives in Convex queries/mutations/actions. This skill
documents the picking rule and the conventions for the three real routes.

Companion skills:
- convex-handlers — query vs mutation vs action vs internal*
- error-handling   — auth and error conventions
- zod-schemas      — request body validation
-->

# API Routes and Actions

Noted has two server surfaces:

1. **Convex handlers** — `convex/<module>.ts` files exporting `query`, `mutation`, or `action`. Almost everything goes here.
2. **Next.js API routes** — `app/api/<route>/route.ts` files exporting `GET` / `POST` / etc. Reserved for HTTP-specific boundaries.

If you can do it as a Convex `action`, **do it as a Convex action**. The boundary checklist below explains the exceptions.

## When to pick which

```
Need to talk to the database?
  └─ Convex query (read) or mutation (write).

Need to call an external API or use Node-only APIs (crypto, Buffer)?
  └─ Convex action ("use node"), called from React via useAction.

Need an HTTP endpoint that something other than the noted client will hit?
   ── A third-party webhook? ......... Next.js API route (must be HTTP).
   ── A signed-URL service handler? .. Next.js API route (the SDK is HTTP-shaped).
   ── A streaming response (SSE)? .... Next.js API route (Convex actions don't stream).
   └─ Otherwise →                      Convex action.

Need server-rendered HTML or a Server Component?
  └─ Next.js — but no API route needed; the page IS the surface.
```

The three Next.js API routes that currently exist:

| Route | Why HTTP and not Convex |
|---|---|
| `app/api/edgestore/[...edgestore]/route.ts` | EdgeStore SDK ships an HTTP-shaped handler. Webhooks from EdgeStore land here. |
| `app/api/ai/chat/route.ts` | Returns a streaming UI message stream (SSE). Convex actions can't stream HTTP responses to the browser. |
| `app/api/ai/coworker/route.ts` | Same — streaming AI responses. |

Anything else added today should default to Convex.

## Why default to Convex

Convex actions get four things "for free" that you'd build by hand in an API route:

1. **Auth context** — `ctx.auth.getUserIdentity()` returns the Clerk identity automatically; no Authorization header parsing.
2. **Typed I/O** — args validated by `v.*`, return type inferred end-to-end into `useAction`.
3. **DB access** — `ctx.runQuery` / `ctx.runMutation` are typed and stay inside the Convex transaction model.
4. **Reactivity in adjacent surfaces** — a mutation call from inside an action automatically re-fans subscriptions.

An API route gets none of those. You build the auth check, the body validator, the typed response, and the Convex client wiring yourself.

So an API route is justified only when one of the three "Why HTTP" reasons above applies.

## API route conventions (when you do need one)

The shipped patterns are short and consistent. Match them.

### Auth via Clerk bearer token

The client sends the Clerk JWT as `Authorization: Bearer <token>`. Verify and forward to Convex:

```typescript
// app/api/ai/chat/route.ts — shipped pattern
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const token = authHeader.substring(7);

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  convex.setAuth(token);
  // now convex.{query,mutation,action} runs as the user
}
```

The auth message string `"Not authenticated"` matches the convention from the `error-handling` skill.

### Body validation via Zod

```typescript
import { z } from "zod";

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
  // ...
}
```

`safeParse` + 400 — never `parse` (which throws into the framework's default 500 handler with a stack trace). See `zod-schemas`.

### Standard response shapes

| Outcome | Shape |
|---|---|
| Success with JSON body | `Response.json(data)` |
| Success, no body (e.g., webhook ack) | `new Response(null, { status: 204 })` |
| Streaming (AI) | `result.toUIMessageStreamResponse()` (Vercel AI SDK) |
| 4xx (validation, auth) | `Response.json({ error: "<message>", ... }, { status: 400|401|403|404 })` |
| 5xx (unexpected) | `Response.json({ error: "Failed to process request" }, { status: 500 })` — log the underlying error server-side |

Don't wrap responses in custom envelope objects (`{ success: true, data: ... }`). The HTTP status code is the success signal; a flat data shape is easier to consume.

### Streaming responses

For AI streaming, lean on the Vercel AI SDK's `streamText` + `result.toUIMessageStreamResponse()`. Don't try to wire SSE manually.

```typescript
// app/api/ai/chat/route.ts — shipped pattern
const result = streamText({
  model,
  system: aiDocumentFormats.html.systemPrompt,
  messages: modelMessages,
  tools: toolDefinitionsToToolSet(toolDefinitions) as any,
  toolChoice: "required",
});

return result.toUIMessageStreamResponse();
```

`maxDuration` exported at module scope tells Vercel/Render to allow longer responses:

```typescript
export const maxDuration = 30;   // seconds
```

### Talking to Convex from a route

`ConvexHttpClient` is the server-side counterpart of the React hooks. Same API surface — `.query`, `.mutation`, `.action`.

```typescript
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
convex.setAuth(token);

const settings = await convex.action(
  api.aiSettingsActions.getDecryptedApiKey,
  { provider: "openai" },
);
```

Always set auth before any user-scoped call. For server-only paths that don't need a user identity (cron jobs, internal services), call without `.setAuth(...)` — but most things need it.

## Picking the file path

```
app/api/<service-or-feature>/route.ts                 # single resource
app/api/<service>/[...slug]/route.ts                  # catch-all (EdgeStore SDK pattern)
app/api/<feature>/<sub>/route.ts                      # nested feature
```

Real noted layout:

```
app/api/
├── edgestore/[...edgestore]/route.ts   # EdgeStore SDK adapter
└── ai/
    ├── chat/route.ts                   # in-editor AI streaming
    └── coworker/route.ts               # coworker chat streaming
```

Group by feature (`ai/`), not by HTTP method.

## When to add a route vs add to an existing one

If the new endpoint is:

- **The same SDK boundary** as an existing route (e.g., another EdgeStore handler) → live inside the existing catch-all.
- **A new variant of streaming AI** → new file under `app/api/ai/<name>/route.ts`.
- **Anything else** → almost certainly a Convex action, not a new route.

Don't create generic `app/api/v1/<resource>/route.ts` — noted isn't a public REST API.

## Why we don't use `withApiHandler` / response envelopes

Heatseeker has a `withApiHandler` wrapper that standardizes auth, body validation, error formatting, and `successResponse(...)` envelopes. **Noted does not have this and won't add it for 3 routes** — the cost of the abstraction is bigger than the duplication it removes.

Each of noted's three routes is short and reads top-to-bottom: auth → parse → call → return. Match the shape, don't introduce a wrapper.

## Anti-patterns

```typescript
// ❌ adding an API route for something that should be a Convex action
// app/api/documents/[id]/route.ts
export async function POST(req: NextRequest) {
  const { id } = await req.json();
  await convex.mutation(api.documents.archive, { id });
  return Response.json({ success: true });
}
// ✅ skip the route entirely — call the mutation directly from the client via useMutation

// ❌ envelope responses
return Response.json({ success: true, data: result });
// ✅ flat
return Response.json(result);

// ❌ using `parse` and crashing into the default 500 handler
const body = bodySchema.parse(await req.json());
// ✅ safeParse + 400
const result = bodySchema.safeParse(await req.json());
if (!result.success) return Response.json({ error: "Invalid body" }, { status: 400 });

// ❌ reading process.env directly inside the route handler every call
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
// ✅ read once at module scope (server start-time)
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
export async function POST() { /* uses convex */ }

// ❌ swallowing the error string into a user-facing message
catch (error) {
  return Response.json({ error: error.message }, { status: 500 });
}
// ✅ generic 5xx, log server-side
catch (error) {
  console.error("AI chat error:", error);
  return Response.json({ error: "Failed to process request" }, { status: 500 });
}

// ❌ exporting a route that talks to ctx.db
import { ctx } from "convex/server";
// ctx doesn't exist in Next.js routes — there's no Convex context. Use ConvexHttpClient.
```

## Quick reference

| Need | Use |
|---|---|
| Read DB reactively | Convex `query` + `useQuery` |
| Write DB transactionally | Convex `mutation` + `useMutation` |
| Call external API | Convex `action` (`"use node"`) + `useAction` |
| Receive a third-party webhook | Next.js API route |
| Stream AI response to browser | Next.js API route + Vercel AI SDK `streamText` |
| Handle file-upload SDK callbacks | Next.js API route (the SDK ships an HTTP handler) |
| Auth in a route | Bearer token → `ConvexHttpClient.setAuth(token)` |
| Validate route body | Zod `safeParse` + 400 on failure |
| Talk to Convex from a route | `ConvexHttpClient` |

## Checklist when adding a new server endpoint

- [ ] Confirmed this can't be a Convex `action` — there's a real HTTP-specific reason for the route
- [ ] File lives at `app/api/<feature>/<sub?>/route.ts`, grouped by feature
- [ ] Body validated with Zod `safeParse`; failures return 400 with the issues
- [ ] Auth via `Authorization: Bearer <token>` header, forwarded with `convex.setAuth(token)`
- [ ] No envelope wrappers — flat JSON responses
- [ ] `parse()` not called on untrusted input (use `safeParse`)
- [ ] Module-scope `ConvexHttpClient` reused across requests
- [ ] Errors logged server-side; user gets a generic 5xx with no stack details
- [ ] Streaming endpoints export `maxDuration` and return `result.toUIMessageStreamResponse()`
