---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
summary: Speckit tasks breakdown
handoffs:
    - label: Implement Project
      agent: speckit.implement
      prompt: Start the implementation in phases
      send: true
---

<!--
Adapted from heatseeker-next/.ai/commands/speckit.tasks.md
Noted-specific adjustments: HST- → NOT-, single-app structure (no monorepo
phases), best-effort Linear sync, file paths reflect noted's tree.
-->

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/check-prerequisites.sh --json` from repo root and parse `FEATURE_DIR` and `AVAILABLE_DOCS`. All paths must be absolute.

2. **Load design documents** from `FEATURE_DIR`:
    - **Required**: `plan.md`, `spec.md` (with prioritized user stories)
    - **Optional**: `data-model.md`, `contracts/`, `research.md`, `quickstart.md`
    - Generate tasks based on what's available.

3. **Execute task generation**:
    - Extract tech stack and project structure from `plan.md`.
    - Extract user stories with priorities (P1, P2, P3...) from `spec.md`.
    - If `data-model.md` exists: map each schema addition to the user story that needs it.
    - If `contracts/` exists: map each Convex handler / API route to the user story that needs it.
    - If `research.md` exists: extract decisions for setup tasks.
    - Generate tasks organized by user story (see Task Generation Rules below).
    - Build a dependency graph showing user-story completion order.
    - Surface parallel execution opportunities per story.
    - Validate completeness — each user story has all needed tasks and is independently testable.

4. **Generate tasks.md** using `.specify/templates/tasks-template.md`:
    - Correct feature name from `plan.md`.
    - Phase 1: Setup (project initialization specific to this feature).
    - Phase 2: Foundational (Convex schema additions, shared types — blocking prerequisites).
    - Phase 3+: One phase per user story (priority order from spec.md). Each phase: story goal, independent test criteria, tests (if requested), implementation tasks.
    - Final phase: Polish & cross-cutting (quality gates, dossier updates, ship-log entry, PR description).
    - All tasks follow the strict checklist format below.
    - Clear file paths for each task.
    - Dependencies section showing story completion order.
    - Parallel execution examples per story.
    - Implementation strategy (MVP first, incremental delivery).

5. **Report**:
    - Path to generated `tasks.md`.
    - Total task count.
    - Task count per user story.
    - Parallel opportunities identified.
    - Independent test criteria per story.
    - Suggested MVP scope (typically just User Story 1).
    - Format validation: confirm all tasks follow the checklist format.

The tasks.md must be immediately executable — each task must be specific enough that an LLM can complete it without additional context.

## Task Generation Rules

**CRITICAL**: tasks MUST be organized by user story to enable independent implementation and testing.

**Tests are OPTIONAL**: only generate test tasks if (a) the spec explicitly requests TDD, (b) the touched code lives in `lib/` or `hooks/` (which always need tests), or (c) the touched Convex handler has non-trivial branching beyond the auth + ownership triad.

### Checklist format (REQUIRED)

```text
- [ ] [TaskID] [P?] [Story?] Description with file path
```

1. **Checkbox**: ALWAYS start with `- [ ]`
2. **Task ID**: Sequential `T001`, `T002`, ... in execution order
3. **[P]**: Include if task is parallelizable (different files, no incomplete dependencies)
4. **[Story]**: REQUIRED for user-story phase tasks (`[US1]`, `[US2]`, ...). Setup, Foundational, and Polish phases have NO story label.
5. **Description**: clear action with exact file path

**Examples**:
- ✅ `- [ ] T001 Create feature dossier directory at team-os/features/document-presence/`
- ✅ `- [ ] T005 [P] Add "presence" table to convex/schema.ts`
- ✅ `- [ ] T012 [P] [US1] Add usePresence hook in hooks/use-presence.tsx`
- ✅ `- [ ] T014 [US1] Wire PresenceIndicator into app/(main)/(routes)/documents/[documentId]/page.tsx`
- ❌ `- [ ] Create presence hook` (missing ID, story label, file path)

### Task organization

1. **From user stories** (PRIMARY):
    - Each user story gets its own phase.
    - Map related Convex handlers, hooks, components, tests to that story.
    - Mark dependencies (most stories should be independent).

2. **From data-model.md**:
    - Each new table/field/index → schema task in Phase 2 (Foundational) since stories depend on schema.
    - If a table is used by exactly one story, place its index/migration tasks within that story's phase.

3. **From contracts/**:
    - Each new query/mutation/action → implementation task in the right user story phase.
    - If TDD requested: paired test task before implementation.

4. **From plan.md project structure**:
    - Hook tasks: `hooks/use-<feature>.tsx`
    - Component tasks: `components/<feature>/<thing>.tsx`
    - Route wiring: `app/.../page.tsx` updates
    - Analytics events: per the `event-tracking` skill, in the call site

5. **Cross-cutting (Polish phase)**:
    - Quality gates: `npm run format && npm run lint:fix && npm run type:check && npm run test`
    - Dossier update: `team-os/features/<slug>/`
    - Ship-log entry via `/ship-log`
    - Feature index update: `team-os/feature-index.yaml`
    - PR description with `Closes NOT-XXXX`

### Phase Structure

- **Phase 1**: Setup (feature dossier creation, Linear ticket confirmation, branch confirmation)
- **Phase 2**: Foundational (schema additions, shared types, analytics event names — blocking prerequisites)
- **Phase 3+**: User stories in priority order
- **Final phase**: Polish & cross-cutting

## Linear Document Sync

After generating `tasks.md` and reporting, sync to Linear (best-effort).

**Detect explore mode**: if branch starts with `explore/` or spec dir starts with `EXP-`, skip sync and show link recommendation.

**Ticket-linked mode**:
1. Extract `NOT-XXXX` from branch name.
2. Read final `tasks.md`.
3. Search for `[NOT-XXXX] tasks` document via `list_documents(query: "NOT-XXXX")`.
4. If exists: `update_document(id, content)`. If not: `create_document(title: "[NOT-XXXX] tasks", content, issue: "NOT-XXXX")`.
5. Report: `✓ Synced tasks to Linear as [NOT-XXXX] tasks`
6. On failure: `⚠️ Could not sync tasks to Linear. Run /speckit.sync later to retry.`

**Explore mode**:

```
💡 This is an explore tasks list. To link it to a Linear ticket:
   /speckit.link EXP-N NOT-XXXX   ← link to an existing ticket
   /speckit.link EXP-N             ← create a new ticket and link
```

Context for task generation: $ARGUMENTS
