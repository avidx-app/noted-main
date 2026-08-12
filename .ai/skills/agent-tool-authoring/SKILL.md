---
name: agent-tool-authoring
description: How to author and wire up new AI Squad / Coworker tools in noted-main — the `tool({ description, inputSchema, execute })` shape from the Vercel AI SDK, where files live (`lib/agent/tools/<name>.ts`, `lib/agent/prompts/squad-prompts.ts`), how the streaming chat route assembles the toolset, the `createXxxTools(convex)` factory pattern, and the rules for return shapes that LLMs handle well. Use when adding a new capability the AI agents can call, rewriting a tool's prompt, or reviewing existing tool definitions. Replaces heatseeker's `generate-tool` skill.
summary: AI Squad / Coworker tool shape and wiring
---

<!--
Noted-native skill — replaces heatseeker's `generate-tool`. Heatseeker has
a Core+Consumer split (mcp/schema, mcp/services, per-app handler).
Noted is much smaller: tools are AI-SDK `tool()` definitions in
lib/agent/tools/<name>.ts, instantiated via a factory taking a Convex
HTTP client, and registered into the streaming AI route. Examples
grounded in lib/agent/tools/workspace.ts (the only shipped tools file
today) and the coworker streaming route.

Companion skills:
- zod-schemas — the inputSchema validators
- error-handling — return-vs-throw conventions for tools
- api-routes-and-actions — how the streaming AI route is wired
-->

# Agent Tool Authoring

When the AI Squad / Coworker needs a new capability — read a doc, write a doc, schedule a task, call an external API — the work is: (1) declare a tool, (2) implement its `execute`, (3) make sure the system prompt knows when to use it. This skill walks the loop.

## The shape of a tool

Every tool follows the Vercel AI SDK's `tool({ description, inputSchema, execute })` contract:

```typescript
import { tool } from "ai";
import { z } from "zod";

readDocument: tool({
  description: "Read the content of a document in the workspace by its ID",
  inputSchema: z.object({
    documentId: z.string().describe("The ID of the document to read"),
  }),
  execute: async ({ documentId }) => {
    // ... do the work, return a JSON-serializable result
  },
}),
```

Three fields, three jobs:

| Field | Audience | Job |
|---|---|---|
| `description` | The LLM | "When should I call this?" — concise, action-first, present tense |
| `inputSchema` | The LLM (and runtime validator) | "What arguments does it take?" — Zod schema with `.describe()` on every field |
| `execute` | The runtime | "What does it do?" — async function returning a JSON-serializable result |

## Where the files live

```
lib/agent/
├── prompts/
│   └── squad-prompts.ts      # system prompts + TOOL_CALLING_INSTRUCTIONS
└── tools/
    └── workspace.ts          # one factory per tool group: createWorkspaceTools(convex)
```

When adding a tool to an **existing** group, edit the factory in `lib/agent/tools/<group>.ts`. When adding a **new** group (e.g., calendar tools, web-search tools), create a new file `lib/agent/tools/<group>.ts` exporting `createXxxTools(...)`. Then update the streaming route(s) in `app/api/ai/<route>/route.ts` to compose the new toolset.

There is no separation between "schema" and "service" and "handler" (heatseeker has this). Noted's tools are short — keep the whole thing in one file.

## The factory pattern

Tools that need server-side resources (the Convex client, an external SDK) are produced by a factory:

```typescript
// lib/agent/tools/workspace.ts — shipped pattern
import { tool } from "ai";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function createWorkspaceTools(convexClient: ConvexHttpClient) {
  return {
    readDocument: tool({ /* ... */ }),
    writeDocument: tool({ /* ... */ }),
    editDocument: tool({ /* ... */ }),
    searchWorkspace: tool({ /* ... */ }),
    listDocuments: tool({ /* ... */ }),
  };
}
```

The factory closes over the `ConvexHttpClient` (already authenticated at the route level via `convex.setAuth(token)`) so each tool can call into Convex without re-plumbing auth. The route consumes it like:

```typescript
// app/api/ai/coworker/route.ts — shipped pattern
const tools = createWorkspaceTools(convex);

const result = streamText({
  model,
  system: systemPrompt,
  messages: formattedMessages,
  tools: tools as any,
  stopWhen: stepCountIs(5),
});
```

Use the factory pattern for any tool that needs the Convex client, an API key, or any other per-request context. Use plain `tool({...})` exports only for tools that are pure (e.g., date math, no I/O) — there are none of those today.

## Writing a good `description`

The description is the only thing the LLM sees when deciding *whether* to call the tool. It must be:

- **Action-first, present tense.** Not "This tool reads…" but "Read…".
- **One sentence.** Two if you must — the LLM is reading dozens of these.
- **Free of implementation detail.** No "uses Convex", "BlockNote", "internal helper". The model doesn't care.

Compare the shipped tools:

```typescript
description: "Read the content of a document in the workspace by its ID",
description: "Create a new document in the workspace. Use Markdown for content formatting.",
description: "Edit/update an existing document. Use Markdown for content formatting.",
description: "Search for documents in the workspace by title",
description: "List all documents in the workspace or under a specific parent",
```

Patterns: verb + object + the qualifying clause that disambiguates. When two tools could overlap (`searchWorkspace` vs `listDocuments`), the description tells the model which one to reach for first.

When a tool requires content in a particular shape (Markdown, JSON, ISO date), say so in the description, not just the schema — the description is what affects the model's draft of the call.

## Writing a good `inputSchema`

Every field gets a `.describe(...)`. The descriptions are part of the tool's JSON schema sent to the model — they directly influence what arguments come back.

```typescript
// shipped pattern — workspace.ts:writeDocument
inputSchema: z.object({
  title: z.string().describe("Title of the new document"),
  content: z.string().optional().describe(
    "Document content in Markdown format. Use # for headings, - for lists, **bold**, etc."
  ),
  icon: z.string().optional().describe(
    "Document icon - either an emoji (e.g. '📝') or leave empty"
  ),
  parentId: z.string().optional().describe("Parent document ID for nesting"),
}),
```

Conventions:

- **`.describe(...)` on EVERY field**, not just the optional ones.
- **Use `z.string().optional()` for everything that genuinely can be omitted.** Don't mark `.optional()` with a default — defaults change behavior the LLM can't see.
- **For ID fields, accept `z.string()` and cast inside `execute`** (`as Id<"documents">`). Convex IDs are branded TypeScript types but the LLM sees them as strings.
- **For enum-like values, use `z.enum(["a", "b", "c"])`** — narrows the model's draft to valid options.

See the `zod-schemas` skill for the full Zod patterns.

## Writing the `execute` body

```typescript
execute: async ({ documentId }) => {
  console.log(`[Tool Exec] readDocument called with documentId: ${documentId}`);
  try {
    const doc = await convexClient.query(api.documents.getById, {
      documentId: documentId as Id<"documents">,
    }) as DocumentResult | null;

    if (!doc) {
      return { error: "Document not found" };
    }

    console.log(`[Tool Result] readDocument completed`);
    return {
      id: doc._id,
      title: doc.title,
      content: doc.content || "(empty document)",
      icon: doc.icon,
      isPublished: doc.isPublished,
    };
  } catch (error) {
    return { error: `Failed to read document: ${error}` };
  }
},
```

Five things to match in any new tool:

1. **`[Tool Exec] <name>` and `[Tool Result] <name>` console logs** — these show up in server logs and make tool-call tracing readable.
2. **Cast string IDs to `Id<"<table>">`** at the Convex call site, not in the schema. The schema stays simple.
3. **Return data, not throw, on expected failures.** `return { error: "Document not found" }` — the LLM can read it and recover. (See "Return shapes" below.)
4. **Wrap unexpected failures** in `try/catch` and return `{ error: \`Failed to <verb>: ${error}\` }`. Don't let exceptions bubble — they crash the stream.
5. **Keep success and error returns shape-distinct** — success returns the resource (e.g., `{ id, title, content }`), error returns `{ error: "..." }`. The LLM uses the shape to branch.

## Return shapes the LLM handles well

The model reads the tool result as JSON in the next turn. Optimize for "the LLM understands what happened":

| Pattern | When to use |
|---|---|
| `{ id, title, content, ... }` (resource) | Successful read or modification — return the relevant fields |
| `{ success: true, documentId, message }` | Successful create — confirm and identify the new resource |
| `{ count: N, results: [...] }` (list) | Successful search/list — wrap in `{ count, ... }` so the LLM knows the size |
| `{ error: "<message>" }` | Expected failure (not found, validation) — let the model react |
| `{ error: \`Failed to <verb>: ${err}\` }` | Unexpected failure (network, exception) — preserves the underlying error |

Don't return raw nulls or empty strings as success values — the LLM will assume something is broken. Be explicit:

```typescript
// ❌ — model sees null and gets confused
return doc;   // returns null when not found

// ✅ — explicit error shape
if (!doc) return { error: "Document not found" };
return { id: doc._id, title: doc.title, /* ... */ };
```

For very large blobs (entire document content), return them — but **truncate previews** in list/search results:

```typescript
// shipped pattern — searchWorkspace truncates content to a 200-char preview
results.map((doc) => ({
  id: doc._id,
  title: doc.title,
  preview: doc.content?.substring(0, 200) || "(no content)",
}))
```

The model doesn't need 50KB of doc content to decide whether to read it in full.

## Tool calling instructions in the system prompt

The model needs to know when to use each tool. The shipped pattern lives at `lib/agent/prompts/squad-prompts.ts`:

```typescript
export const TOOL_CALLING_INSTRUCTIONS = `
<tool_calling>
You have access to workspace tools that let you interact with the user's documents. ALWAYS use these tools when appropriate.

## When to Use Tools

**writeDocument**: Use this when the user asks you to:
- Create a document, brief, plan, report, or any written content
- "Write me a...", "Create a...", "Draft a...", "Make a..."
- Generate any content that should be saved as a document

**editDocument**: Use this when the user wants to:
- Update, modify, or change an existing document
- ...

(...one section per tool...)
</tool_calling>
`;

export function buildSystemPrompt(instructionContent?: string): string {
  const basePrompt = (instructionContent && instructionContent.trim())
    ? instructionContent
    : DEFAULT_SQUAD_PROMPT;

  return `${basePrompt}\n\n${TOOL_CALLING_INSTRUCTIONS}`;
}
```

When you add a new tool, add a corresponding `**<toolName>**: Use this when...` block with concrete trigger phrases the user might say. Keep it short — bullets, not paragraphs.

## Wiring the tool into a streaming route

The streaming routes in `app/api/ai/<route>/route.ts` compose the toolset and pass it to `streamText`:

```typescript
// app/api/ai/coworker/route.ts — shipped pattern
import { createWorkspaceTools } from "@/lib/agent/tools/workspace";
import { buildSystemPrompt } from "@/lib/agent/prompts/squad-prompts";

const tools = createWorkspaceTools(convex);

const result = streamText({
  model,
  system: buildSystemPrompt(instructionContent),
  messages: formattedMessages,
  tools: tools as any,
  stopWhen: stepCountIs(5),
});

return result.toUIMessageStreamResponse();
```

`stepCountIs(5)` is the safety stop — the model can chain up to 5 tool calls before being forced to respond. If your new tool typically needs to be called in a chain (e.g., search → read → write), bump the limit at the route, not by calling tools inside other tools.

When you add a new tool group, the route changes from one factory to a merge:

```typescript
const tools = {
  ...createWorkspaceTools(convex),
  ...createCalendarTools(convex, googleClient),
};
```

## Where Convex fits

Tools call Convex via `convexClient.query` / `convexClient.mutation` / `convexClient.action`. The route already sets `convex.setAuth(token)` before constructing the toolset — so every Convex call from a tool runs as the user, hitting the auth → existence → ownership triad in the handler. (See `error-handling`.)

If a tool needs Node-only APIs (`crypto`, `fetch` to a third-party with custom headers), do **not** put that logic in the tool's `execute` directly — wrap it in a Convex action with `"use node"` and have the tool call `convexClient.action(api.<module>.<fn>, args)`. Reasons:

- Keeps secrets server-side (the action accesses env vars via Convex, not the route).
- Reuses the action's auth context (Clerk identity automatically scoped).
- The Vercel AI SDK's tool-calling loop runs in the route's edge/serverless runtime — it's not the right place for heavy Node work.

## Anti-patterns

```typescript
// ❌ throwing inside execute — crashes the stream and the user sees a generic error
execute: async ({ id }) => {
  const doc = await convexClient.query(api.documents.getById, { documentId: id });
  if (!doc) throw new Error("Not found");      // crashes the model run
}

// ✅ return a structured error so the model can recover
execute: async ({ id }) => {
  try {
    const doc = await convexClient.query(api.documents.getById, { documentId: id as Id<"documents"> });
    if (!doc) return { error: "Document not found" };
    return { id: doc._id, title: doc.title /* ... */ };
  } catch (error) {
    return { error: `Failed to read document: ${error}` };
  }
}

// ❌ description that explains internals
description: "Calls api.documents.getById in the Convex backend to fetch a row"
// ✅ describes the capability
description: "Read the content of a document in the workspace by its ID"

// ❌ inputSchema without .describe()
inputSchema: z.object({ id: z.string() })
// ✅ every field documented
inputSchema: z.object({ id: z.string().describe("The ID of the document to read") })

// ❌ returning the full BlockNote JSON in a list result
results.map((d) => ({ id: d._id, title: d.title, content: d.content }))
// ✅ truncate to a preview
results.map((d) => ({ id: d._id, title: d.title, preview: d.content?.substring(0, 200) || "(no content)" }))

// ❌ baking secrets into the tool
execute: async ({ q }) => {
  const res = await fetch("https://api.example.com/search", {
    headers: { "x-api-key": process.env.SEARCH_KEY! },   // route runtime may not have access
  });
}
// ✅ wrap in a Convex action where env access + auth are handled
execute: async ({ q }) => convexClient.action(api.search.run, { q })

// ❌ chaining tools inside execute
execute: async ({ q }) => {
  const found = await searchWorkspace.execute({ query: q });  // can't call other tools directly
  // ...
}
// ✅ let the model chain — bump stopWhen if needed
```

## Adding a new tool — checklist

- [ ] Decided whether it joins an existing factory (`workspace.ts`) or warrants a new one (`<group>.ts`)
- [ ] `description` is one sentence, action-first, present-tense, no internals
- [ ] `inputSchema` is a `z.object(...)` and **every** field has `.describe(...)`
- [ ] `execute` logs `[Tool Exec] <name>` and `[Tool Result] <name>` for traceability
- [ ] Convex IDs are accepted as `z.string()` and cast inside `execute`
- [ ] Returns `{ error: "..." }` on expected failure; wraps unexpected failures with `try/catch` returning `{ error: \`Failed to <verb>: ${err}\` }`
- [ ] Success returns are shape-distinct from error returns (resource fields vs `{ error }`)
- [ ] Large blobs are truncated in list/search returns (e.g., 200-char preview)
- [ ] System prompt section in `lib/agent/prompts/squad-prompts.ts` updated with a new `**<toolName>**: Use this when...` block
- [ ] Streaming route(s) in `app/api/ai/<route>/route.ts` updated if you added a new factory
- [ ] If the tool needs Node APIs or external secrets, the work lives in a Convex action — the tool just calls it
