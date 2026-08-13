---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
summary: Speckit implement phase
---

<!--
Adapted from heatseeker-next/.ai/commands/speckit.implement.md
Noted-specific adjustments: HST- → NOT-, npm not pnpm, Convex/Clerk-aware
verification, default tech-stack pattern table simplified for noted's
single Node.js + TypeScript surface.
-->

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse `FEATURE_DIR` and `AVAILABLE_DOCS`. All paths absolute.

2. **Check checklists status** (if `FEATURE_DIR/checklists/` exists):
    - Scan all checklist files.
    - For each, count: total items (lines matching `- [ ]`/`- [X]`/`- [x]`), completed (`- [X]`/`- [x]`), incomplete (`- [ ]`).
    - Display status table:

        | Checklist | Total | Completed | Incomplete | Status |
        |---|---|---|---|---|
        | requirements.md | 12 | 12 | 0 | ✓ PASS |
        | ux.md | 8 | 5 | 3 | ✗ FAIL |

    - Overall: PASS if all 0 incomplete, else FAIL.
    - **If FAIL**: display table; ask "Some checklists are incomplete. Proceed anyway? (yes/no)". Wait for response. Halt on no/wait/stop.
    - **If PASS**: display table, proceed.

3. **Load implementation context**:
    - **REQUIRED**: `tasks.md` (full task list)
    - **REQUIRED**: `plan.md` (tech stack, structure)
    - **IF EXISTS**: `data-model.md`, `contracts/`, `research.md`, `quickstart.md`

4. **Project setup verification**:
    - The repo is already initialized (this is noted-main). Verify:
        - `.gitignore` covers `node_modules/`, `.next/`, `.env*.local`, `coverage/` (it does — heritage from Next.js + Convex defaults)
        - `.prettierignore` and ESLint config in place (they are)
    - **If the feature requires NEW external tools** (rare — most features are pure code):
        - Document them in `plan.md` Technical Context, NOT here.
        - Add to `package.json` deps in a setup task, not silently in implementation.

5. Parse `tasks.md` and extract:
    - Task phases (Setup, Foundational, User Stories, Polish)
    - Task dependencies (sequential vs parallel `[P]`)
    - Task details (ID, description, file paths, story labels)
    - Execution flow

6. **Execute implementation following the plan**:
    - **Phase-by-phase**: complete each phase before the next.
    - **Respect dependencies**: sequential tasks in order, `[P]` tasks can run together.
    - **TDD if requested**: tests before implementation.
    - **File-based coordination**: tasks affecting the same file run sequentially.
    - **Validation checkpoints**: verify each phase before proceeding.

7. **Execution rules for noted-main**:
    - **Setup first**: feature dossier, ticket confirmation, branch confirmation.
    - **Foundational next**: schema changes (`convex/schema.ts`); run `npx convex dev` once after to push the schema. Verify no migration warnings.
    - **Per user story** (in priority order):
        - Convex handlers first (queries, mutations, actions) — auth + ownership + validation per `error-handling` skill.
        - Hooks next (`hooks/use-*.tsx`).
        - Components next (`components/<feature>/...`).
        - Wire into routes (`app/...`).
        - Analytics events at the user-action call sites (per `event-tracking`).
        - Tests where required.
    - **After every meaningful change**: run `npm run lint:fix && npm run type:check && npm run test`. Fix before continuing.
    - **Polish & cross-cutting**:
        - Final quality gate: `npm run format && npm run lint:fix && npm run type:check && npm run test`.
        - Update `team-os/features/<slug>/` dossier.
        - Append `team-os/features/<slug>/ship-log.md` entry.
        - Update `team-os/feature-index.yaml` if status changed.
        - PR description with `Closes NOT-XXXX`.

8. **Progress tracking & error handling**:
    - Report progress after each completed task.
    - Halt if a non-parallel task fails.
    - For `[P]` tasks, continue with successful ones, report failed.
    - Provide clear error messages with context.
    - Suggest next steps if implementation cannot proceed.
    - **Mark completed tasks with `[X]` in `tasks.md`**.

9. **Completion validation**:
    - All required tasks completed.
    - Implemented features match the spec.
    - Tests pass; coverage meets the ≥50% rule on touched files.
    - Implementation follows `plan.md`.
    - Final status reported with summary.

## Verification commands (noted-main)

Run frequently during implementation:

```bash
npm run type:check    # Fast — catches most regressions
npm run lint:fix      # Autofixes most issues
npm run test          # Jest + React Testing Library
```

Full pre-merge gate:

```bash
npm run format && npm run lint:fix && npm run type:check && npm run test
```

If a Convex schema change was made, also:

```bash
# In a separate terminal — keep this running during implementation
npx convex dev
```

## When the spec / plan / tasks need to change mid-implementation

It happens. Don't push through — pause and:

1. Note the surprise (what differed from the plan; quote the actual code/data shape).
2. Update `plan.md` and/or `tasks.md` to reflect the new reality.
3. If Convex schema needs to change, update `data-model.md` and re-run `npx convex dev`.
4. Resume implementation.

This is preferable to silently diverging — `/noted-review` will surface plan/code drift in PR review and you'll fix it later anyway.

Note: this command assumes a complete task breakdown exists in `tasks.md`. If tasks are incomplete or missing, run `/speckit.tasks` first.
