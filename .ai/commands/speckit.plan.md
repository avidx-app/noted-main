---
description: Execute the implementation planning workflow using the plan template to generate design artifacts (research.md, data-model.md, contracts/, quickstart.md).
summary: Speckit plan + constitution check
handoffs:
    - label: Create Tasks
      agent: speckit.tasks
      prompt: Break the plan into tasks
      send: true
---

<!--
Adapted from heatseeker-next/.ai/commands/speckit.plan.md
Noted-specific adjustments:
- HST- → NOT-
- Stack defaults: Next.js + Convex + Clerk + EdgeStore + BlockNote
- Removed monorepo / packages references
- Linear sync best-effort, doesn't block on failure
-->

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/setup-plan.sh --json` from repo root and parse JSON for `FEATURE_SPEC`, `IMPL_PLAN`, `SPECS_DIR`, `BRANCH`. For single quotes in args (e.g., "I'm Groot"), use escape syntax.

2. **Load context**:
   - Read `FEATURE_SPEC` (the feature spec).
   - Read `.specify/memory/constitution.md` (project non-negotiables).
   - Read the plan template (already copied to `IMPL_PLAN` by the setup script).
   - Read relevant skill files: `.ai/skills/code-quality-checklist/`, `.ai/skills/error-handling/`, `.ai/skills/typescript-patterns/`, `.ai/skills/derived-state/`, `.ai/skills/effect-to-event/`, `.ai/skills/unit-testing/`. The plan must respect them.

3. **Execute plan workflow**:
    - Fill **Technical Context** in the plan. Default values for noted-main:
        - Language: TypeScript 5 + React 19
        - Frontend: Next.js 16 App Router
        - Backend/Data: Convex
        - Auth: Clerk
        - File storage: EdgeStore
        - Editor: BlockNote
        - Client state: Zustand (UI) + Convex hooks (server data)
        - Testing: Jest + React Testing Library
        - Only mark NEEDS CLARIFICATION if a technical row truly requires a decision the spec doesn't already settle.
    - Fill **Constitution Check** from the constitution.
    - **Evaluate gates**: ERROR if any constitution principle is violated and the violation isn't justified in the Complexity Tracking section.
    - **Phase 0 — Outline & Research**: produce `research.md`, resolving all NEEDS CLARIFICATION.
    - **Phase 1 — Design & Contracts**: produce `data-model.md`, `contracts/`, `quickstart.md`.
    - **Re-evaluate Constitution Check** after Phase 1 design (post-design gate).

4. **Stop and report**: command ends after Phase 1. Report branch, IMPL_PLAN path, and the generated artifacts. Hand off to `/speckit.tasks` to create the task list.

## Phases

### Phase 0 — Outline & Research

1. **Extract unknowns from Technical Context**:
    - For each NEEDS CLARIFICATION → research task
    - For each new dependency proposed → best-practices task
    - For each integration → patterns task

2. **Generate and dispatch research agents**:

    ```text
    For each unknown:
      Task: "Research <unknown> for <feature context>"
    For each technology choice:
      Task: "Find best practices for <tech> in noted-main's stack"
    ```

3. **Consolidate findings** in `research.md`:
    - Decision: [what was chosen]
    - Rationale: [why]
    - Alternatives considered: [what else evaluated]

**Output**: `research.md` with all NEEDS CLARIFICATION resolved.

### Phase 1 — Design & Contracts

**Prerequisites**: `research.md` complete.

1. **Schema (`data-model.md`)** — extract entities from the spec and translate to Convex:
    - For each new table: `defineTable({...})` shape with `v.*` validators
    - Indexes: `.index("by_<field>", ["userId", ...])` per access pattern
    - Note any cross-references via `v.id("table")`
    - State of state transitions if applicable
    - Validation rules from functional requirements
    - **noted convention**: every user-scoped table has a `userId: v.string()` field and a `by_user` index.

2. **Convex contracts (`contracts/`)** — for each new query/mutation/action:
    - File: `contracts/<handler-name>.md`
    - Args schema (Convex `v.*`)
    - Auth check pattern (per `error-handling` skill: `ctx.auth.getUserIdentity()` first)
    - Ownership check (existing doc's `userId === identity.subject`)
    - Validation step
    - Return shape (or void)
    - Error cases using the conventional vocabulary from `error-handling`
    - Whether this is a query (reactive read), mutation (transactional write), or action (external/non-reactive — used for HTTP, AI provider calls, EdgeStore, etc.)

3. **Client contracts (`contracts/client.md`)**:
    - New hooks (`use-*.tsx`) — what data they expose, which Convex handlers they consume
    - Components that consume those hooks
    - Analytics events the feature emits (per `event-tracking` skill — name, properties, when fired)

4. **Quickstart (`quickstart.md`)** — one-page user journey: the happy-path click sequence in the deployed app to exercise this feature.

5. **Re-evaluate Constitution Check.** Anything that drifted? Update.

**Output**: `data-model.md`, `contracts/*`, `quickstart.md`.

## Linear Document Sync

After Phase 1 completes, sync the plan to Linear (best-effort).

**Detect explore mode**: if BRANCH starts with `explore/` or spec dir starts with `EXP-`, skip the sync and show the link recommendation.

**Ticket-linked mode**:

1. Extract `NOT-XXXX` from BRANCH.
2. Read final `plan.md` content.
3. Search for existing `[NOT-XXXX] plan` document via `list_documents(query: "NOT-XXXX")`.
4. If exists: `update_document(id, content)`. If not: `create_document(title: "[NOT-XXXX] plan", content, issue: "NOT-XXXX")`.
5. Report: `✓ Synced plan to Linear as [NOT-XXXX] plan`
6. On Linear MCP failure: `⚠️ Could not sync plan to Linear. Run /speckit.sync later to retry.` (don't block)

**Explore mode**:

```
💡 This is an explore plan. To link it to a Linear ticket:
   /speckit.link EXP-N NOT-XXXX   ← link to an existing ticket
   /speckit.link EXP-N             ← create a new ticket and link
```

## Key rules

- Use absolute paths.
- ERROR on Constitution Check failures or unresolved NEEDS CLARIFICATION markers.
- Don't propose adding TanStack Query, custom error classes, or a service layer — these aren't in noted today; adding any is a separate decision (`error-handling` skill explains the upgrade criteria).
- Default to **single-app Next.js + Convex** structure. Don't propose monorepo splits.
- For features that need a binding architecture decision (e.g., real-time presence, comments threading, sharing roles), produce a brief ADR section in `research.md` with the decision and the alternatives.
