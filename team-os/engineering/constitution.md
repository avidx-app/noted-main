---
type: constitution
last_ratified: 2026-05-06
last_amended: 2026-08-13
version: 1.2.0
owner: avidx-app
---

<!--
SYNC IMPACT REPORT — v1.1.0 → v1.2.0 (MINOR: added §XVII, no existing principle changed)

Added principles:
- XVII. Maps and generated indexes are checked, not trusted

Modified principles: none
Removed principles: none

Dependent artifacts verified in sync:
✅ .ai/CONTRIBUTING.md — skills/commands tables now generated; auto markers in place
✅ .ai/INSTRUCTIONS.md — Connected tools (MCP) section added with no-MCP fallbacks
✅ .github/workflows/ci.yml — `npm run check:drift` step added to the validate job
✅ scripts/install-git-hooks.mjs — pre-commit runs both drift checks
✅ team-os/INTENTIONAL-GAPS.md — created; named as the register §XVII points at
✅ .specify/memory/constitution.md — condensed mirror; §XVII summary added
⚠️ .specify/templates/plan-template.md — Constitution Check gate unchanged; §XVII is
   repo hygiene rather than a per-feature design constraint, so no gate entry is needed

Follow-up TODOs: none

Why this convention: an amendment that updates the principle but not the things that
enforce it leaves the constitution describing a repo that no longer exists. Recording
the propagation audit in the document makes skipping it visible.
-->

# Noted Engineering Constitution

The small, stable list of non-negotiables that govern how this codebase grows. These rules are read by `/speckit.plan`'s Constitution Check and are binding for every change. They are not best-practice suggestions — deviation is a finding in `/noted-review` and a blocker for merge unless explicitly justified.

The principles below were drafted as part of Wave 1 of the Vibe PM course adaptation, seeded from the existing `.ai/skills/` and `.ai/INSTRUCTIONS.md`. They will be refined live with the first cohort in Module 4 of the course; the cohort version supersedes this one when ratified.

---

## I. Convex separation (NON-NEGOTIABLE)

Convex is the data layer. Queries, mutations, and actions each have one job:

- **Queries** are reactive reads. They never mutate state. They may read user data only after auth + ownership checks. They are subscribed to by `useQuery` on the client and re-render automatically when underlying data changes.
- **Mutations** are transactional writes. They run server-side, atomically, and are the only way to change Convex data. They must check auth → existence → ownership → validation in that order before writing.
- **Actions** are non-reactive. They are the only handler type that can call external HTTP services, the AI provider SDKs, or EdgeStore. They cannot directly mutate Convex tables — they call mutations as needed.

Picking the wrong type is a finding. A read that doesn't need to be reactive is fine as a query (Convex makes reactive reads cheap); a write hidden inside a query is a bug.

## II. Auth → existence → ownership → validation (NON-NEGOTIABLE)

Every Convex mutation or action that touches user data starts with the same four-line check, in this order:

```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Not authenticated");

const existing = await ctx.db.get(args.id);
if (!existing) throw new Error("<Thing> not found");

if (existing.userId !== identity.subject) throw new Error("Not authorized");

// validation of args here, then business logic
```

Order matters: never reveal whether a resource exists to an unauthenticated caller. Never check ownership before existence. The triad is the single most-violated rule in production code reviews; the `error-handling` skill lays out the canonical pattern.

## III. Errors are thrown, not returned (NON-NEGOTIABLE)

Use `throw new Error(message)` with the conventional vocabulary in the `error-handling` skill (`"Not authenticated"`, `"Not authorized"`, `"<Thing> not found"`, `"<Field> is required"`, etc.). Do not return `{ success: false, error: ... }` — callers will forget to check, and TypeScript can't help them.

Wrapping external API failures: `throw new Error(\`<service> failed: ${err}\`)` to preserve the original error in logs.

## IV. TypeScript strict, no `any` (NON-NEGOTIABLE)

`any` is forbidden. Use `unknown` + type guards, Zod parse, generics, or Convex's branded `Doc<>` / `Id<>` types. Type assertions (`as`) are a last resort after attempting to deduce the correct type via type guards or schema validation. The `typescript-patterns` skill enumerates the alternatives.

## V. No derived state in `useEffect` (NON-NEGOTIABLE)

If a value can be computed from props or existing state, compute it during render. Do not store it in state. Do not sync it via `useEffect`. The `derived-state` skill is the contract; `/noted-review` flags violations as a hard finding.

Specific noted corollary: **never sync `useQuery` results into local state**. Convex queries are already reactive — copying their result into `useState` introduces a render-extra-render loop and risks state drift.

## VI. Interaction logic in handlers, not effects (NON-NEGOTIABLE)

Side effects caused by user actions belong in `onClick`, `onSubmit`, `onChange`, mutation `onSuccess`, and library callbacks — never in `useEffect` watching a flag. The `effect-to-event` skill is the contract.

`useEffect` is for synchronization with external systems (DOM measurements, browser APIs, one-time mount initialization with a ref guard). It is not for reacting to user actions modeled as state.

## VII. Convex `useQuery` is the only reactive read on the client

Don't `fetch` inside `useEffect` for data that lives in Convex. Don't roll your own cache. Don't add TanStack Query — Convex's reactive subscriptions cover the client data-fetching surface noted needs today, and adding a parallel system means two sources of truth.

The exception: routes under `app/api/` that don't talk to Convex (e.g., the EdgeStore webhook). For those, plain `fetch` from the client into the route is fine.

## VIII. Linear ticket linkage (NON-NEGOTIABLE)

Every PR must reference a Linear ticket. The ticket prefix is `NOT-` (e.g., `NOT-142`). The branch name must include the ticket: `feature/not-142-document-presence` (or `bugfix/`, `hotfix/`). The PR description ends with `Closes NOT-142` so Linear auto-transitions the ticket to Done on merge.

Branches that don't follow this convention fail `/noted-review`'s ticket-alignment check. Drive-by commits (typo fixes, formatting) are fine inside a ticketed PR; standalone untracked work is not.

Branch flow: `feature/* → staging → main`. Features merge into `staging` first; `main` is the production line.

## IX. Quality gates pass before merge (NON-NEGOTIABLE)

```bash
npm run format && npm run lint:fix && npm run type:check && npm run test
```

All four must pass on every commit before merge. Coverage on touched files stays at or above 50% (per `jest.config.ts`'s `collectCoverageFrom`). The `code-quality-checklist` skill is the canonical pre-commit checklist.

CI catches plain formatting and lint; you fix it locally with `npm run format && npm run lint:fix`. Don't merge a red CI.

## X. File naming

- Files and directories: **kebab-case** (`coworker-message.tsx`, `use-search.tsx`).
- React component exports: **PascalCase**.
- Convex modules: **camelCase** (`aiSettings.ts`, `coworkerMessages.ts`) — this is Convex's own convention; module names become parts of the public API surface (`api.aiSettings.update`).
- Tests colocated as `<source>.test.ts(x)` next to the source file.

## XI. Server Components by default

In `app/`, default to React Server Components. Add `'use client'` only when a file uses hooks (`useState`, `useQuery`, `useEffect`, etc.) or browser APIs. This keeps bundles small and lets us push more rendering to the server.

## XII. shadcn primitives are read-only

Do not modify files under `components/ui/`. They are shadcn primitives and any modification will conflict with future shadcn updates. Wrap, don't edit: create variants in `components/<feature>/` that compose the primitive.

## XIII. AI feature surface conventions

AI-related code is concentrated in:

- `lib/agent/prompts/` — system prompts and prompt templates
- `lib/agent/tools/` — LLM-callable tools (Zod-validated input schemas, typed handlers)
- `convex/aiSettings.ts` / `aiSettingsActions.ts` — encrypted BYOK key storage and provider testing
- `convex/coworkerMessages.ts` — Coworker chat persistence
- `convex/squadAgents.ts` — Squad agent definitions

New AI tools follow the existing pattern: Zod schema for input, typed handler, registration with the agent that consumes it. AI conversation contents and tool inputs that contain user data are NEVER logged, NEVER tracked in analytics, and NEVER pasted into PRs or external services.

## XIV. team-os reflex

A feature is not "done" until:

1. The feature's dossier under `team-os/features/<slug>/` has been updated (status, what shipped, talking points).
2. A `ship-log.md` entry has been appended via the `/ship-log` command.
3. `team-os/feature-index.yaml` reflects the new status (e.g., `planned` → `live`).

This is what makes team-os work as a self-service knowledge base: every shipped feature lands in it, automatically. PRs that ship product code without these updates fail `/noted-review`'s ticket-alignment check.

## XV. Analytics: track decisions, not clicks

Major user-facing features and key interactions emit Amplitude events. Trivial UI interactions do not. The `event-tracking` skill defines the canonical event names, properties, and the DO/DON'T table. Events fire from event handlers (per principle VI), never from `useEffect`. Sensitive content (document body text, AI conversation contents, file contents, PII) NEVER goes into event properties — IDs only.

## XVI. Visual identity contract (DESIGN.md) (NON-NEGOTIABLE)

Noted's visual identity lives at the repo root in `DESIGN.md`, following the [google-labs-code/design.md](https://github.com/google-labs-code/design.md) spec. It is a **binding contract**, not advisory reading.

Every PR that touches pixels — anything under `components/`, `app/(landing)/`, `app/globals.css`, `tailwind.config.ts`, `components.json`, or Tailwind classes affecting visual presentation — must keep three things in sync:

1. The code change itself.
2. `app/globals.css` if a CSS custom property is added or modified.
3. `DESIGN.md` — the YAML token added or updated, the markdown rationale added or updated.

Skipping (3) is the single most common drift. `npm run design:lint` catches some of it (broken refs, contrast, structural). `/noted-review` catches the rest by treating DESIGN.md as a binding contract for files in the trigger paths above.

Specific non-negotiables:

- No inline hex/rgb/hsl in `className` or `style` props. Always use a token.
- Brand accents (`bg-blue-*`, `bg-violet-*`) are scoped to AI affordances and marketing CTAs only. Anywhere else is a finding.
- shadcn primitives in `components/ui/` are read-only (already principle XII). Wrap; don't edit. New variants are added via `cva` in the primitive file AND documented in DESIGN.md `components:`.
- New color/typography/radii/spacing tokens require both light AND dark counterparts, justified in the PR description.
- Permanent surfaces (cards, sidebars, navigation) use the `border` token for separation, not box-shadows. Shadows are reserved for transient surfaces (popovers, dropdowns, floating menus).
- See the `design-md` skill for the full picking-the-right-token guide and the merge checklist.

## XVII. Maps and generated indexes are checked, not trusted

This repo asks agents to read a map instead of the whole tree: `team-os/feature-index.yaml`, the
nested `CLAUDE.md` doc indexes, and the skills and commands tables in `.ai/CONTRIBUTING.md`. That
trade only pays while the maps are true. A map pointing at a file nobody wrote is worse than no map,
because it costs a read and returns nothing — and neither a human reviewer nor a passing test suite
ever notices.

So the maps are enforced rather than maintained by good intentions:

- The skills and commands tables in `.ai/CONTRIBUTING.md` are **generated** from each asset's own
  `summary:` frontmatter, between `<!-- auto:skills -->` and `<!-- auto:commands -->` markers. Do
  not hand-edit between the markers. Change the asset's frontmatter and run `npm run check:index`.
- Every markdown link and YAML path in those maps must resolve. `npm run check:links` fails if one
  does not.
- Both run in CI (`npm run check:drift`) and in the pre-commit hook.

Deliberately empty is allowed; silently wrong is not. A path that does not exist yet must either say
so in the row (`not created yet`, `null`, `[NEED: ...]`) or be listed in
[`team-os/INTENTIONAL-GAPS.md`](../INTENTIONAL-GAPS.md) with the condition that would justify
creating it.

Adding a skill or command without regenerating the index is a finding. So is deleting a file that a
map still points at.

---

## Governance

This constitution is amended by PR. The current owner is `@avidx-app`. Material changes (adding/removing a principle) require sign-off from product and engineering leads. Stylistic changes (clarifying examples, tightening language) can be merged by any teammate with write access.

When `/speckit.plan` runs its Constitution Check and a feature's plan would violate one of the principles above, the plan must include a "Complexity Tracking" entry justifying the deviation, or the plan must be revised. There is no "we'll fix it later" — once a constitutional principle is ratified, deviations either revise the principle (via PR amendment) or get reverted.

When `/noted-review` finds a violation, the finding cites this constitution by section number (e.g., `Rule: Constitution §II — auth check missing before db.get`).

---

## Skills referenced

This constitution is enforced via these `.ai/skills/<name>/SKILL.md` files:

- `error-handling` (§II, §III)
- `typescript-patterns` (§IV)
- `derived-state` (§V)
- `effect-to-event` (§VI)
- `code-quality-checklist` (§IX)
- `event-tracking` (§XV)
- `design-md` (§XVI)
- `unit-testing` (cross-cutting; covers test-coverage portion of §IX)

Plus these cross-cutting commands:

- `/feature-workflow` — daily-driver feature workflow that enforces §VIII (Linear linkage)
- `/speckit.specify` → `.plan` → `.tasks` → `.implement` — spec-driven workflow with Constitution Check
- `/noted-review` — multi-agent quality-check that surfaces constitution violations as findings (DESIGN.md is loaded as a binding contract for UI files per §XVI)
- `/design-lint`, `/design-diff` — DESIGN.md validation and diffing (§XVI)
