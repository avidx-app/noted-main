---
description: End-to-end PM-driven feature workflow — brainstorm → spec → plan → implement → review → ship — with one Linear ticket / one branch / one PR enforced. Lighter than the Speckit suite, designed for PM-pace iteration.
summary: Interactive feature dev phases
---

<!--
DRAFT v0.1 — this is a starter version of Razii's personal /feature-workflow
skill, written from the description in the Vibe PM course adaptation plan.
Replace this file with the canonical version once it's available. Until then,
this draft gives the course a working command students can invoke.
-->

# /feature-workflow

The default command for taking a fuzzy feature idea to a shipped, instrumented PR — without the ceremony of full Speckit. Use this when you're the PM driving the change end-to-end (occasionally with engineering pairing) and you want one continuous loop instead of switching between separate `/speckit.specify`, `/speckit.plan`, `/speckit.tasks` invocations.

## When to use this vs Speckit

- **`/feature-workflow`** (this command): small-to-medium features (1–3 PRs), PM-led, where the brainstorm-to-ship loop is best handled in a single agent session with checkpoints. Default daily-driver.
- **`/speckit.specify` → `.clarify` → `.plan` → `.tasks` → `.implement`**: larger features (4+ PRs) where artifacts need to live independently and be reviewed by multiple stakeholders before code starts. Use Speckit when you want the spec to be a durable document people will reference for weeks, not a working memo.

## The ground rule: one Linear ticket → one branch → one PR

Before any code is written, this command **requires** a Linear ticket. If `$ARGUMENTS` does not contain a `NOT-XXXX` reference, the very first thing the agent does is help create one.

Branch naming: `feature/NOT-XXXX-short-slug` (e.g., `feature/NOT-142-document-presence`).

PR description must include the Linear ticket as a `Closes NOT-XXXX` line so Linear auto-transitions the ticket to Done on merge.

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

The text the user typed after `/feature-workflow` is either (a) a Linear ticket ID, (b) a free-form description of the feature, or (c) both. Assume it's available even if `$ARGUMENTS` appears literally below. Do not ask the user to repeat it unless they sent an empty command.

Walk through the six phases below. **Stop and prompt the user for confirmation between phases.** Do not skip ahead. The PM may iterate inside a phase before moving on.

---

### Phase 0 — Confirm or create the Linear ticket

1. Scan `$ARGUMENTS` for the pattern `NOT-[0-9]+` (case-insensitive, also in Linear URLs).
2. **If found:** fetch the ticket via the Linear MCP (or `gh` if Linear MCP not available — fall back to asking the user for the ticket title/description). Confirm with the user: *"Working on `NOT-XXX: <title>` — sound right?"*
3. **If not found:** propose a one-line ticket title + one-paragraph description based on the user's input. Ask the user to either (a) paste an existing ticket ID, or (b) approve the proposed ticket so the agent (or the user) can create it in Linear.

Do not proceed to Phase 1 until a ticket exists and is confirmed.

---

### Phase 1 — Brainstorm (10–20 minutes wall time)

Open with: *"Phase 1 — Brainstorm. I'll explore the problem space and surface options. Stop me when you have enough to choose a direction."*

Then:
1. Read the relevant `team-os/features/<slug>/` dossier if one exists. If not, scan `feature-index.yaml` for the feature.
2. Read any related PRDs in `team-os/product/prds/`.
3. Read recent ship-log entries in `team-os/features/*/ship-log.md` for context on what's recently shipped.
4. Generate **3 distinct options** for how to solve the problem, with trade-offs. Each option includes: rough scope (XS/S/M/L), the user-facing change, the technical approach (1–3 sentences), and the biggest risk.
5. Ask the user: *"Which option do you want to spec, or do you want to combine/iterate?"*

Output of this phase: a **brainstorm memo** saved to `team-os/features/<slug>/brainstorm-NOT-XXX.md` containing the three options and the selected direction.

---

### Phase 2 — Spec (20–40 minutes wall time)

Open with: *"Phase 2 — Spec. I'll draft a 1–2 page spec for the chosen direction. Then we red-team it together."*

Then:
1. Use the `prd-writer` skill (already in `.ai/skills/`) to draft a focused spec, NOT a full multi-stage PRD. Sections: problem, user, success criteria (1 metric), scope-in, scope-out, design notes, instrumentation plan, rollout plan, risks.
2. Save to `team-os/features/<slug>/spec-NOT-XXX.md`.
3. Red-team the draft using the `prd-writer` skill's red-team mode. Surface 3–5 substantive challenges. (`/pm-review` was planned for this and never built — see `.ai/commands/pm-review.md`.)
4. Iterate with the user. Loop until they say "ship it as the spec."

Output of this phase: an approved spec at `team-os/features/<slug>/spec-NOT-XXX.md`. Update the Linear ticket description with a link to the spec.

---

### Phase 3 — Plan (10–20 minutes)

Open with: *"Phase 3 — Plan. I'll decompose the spec into a buildable plan."*

Then:
1. Read the spec.
2. Read `convex/schema.ts`, the relevant `convex/*.ts` files, and `app/(main)/_components/` to understand the current architecture.
3. Produce a plan with:
   - **Schema changes** (additions to `convex/schema.ts` — call out new tables, fields, indexes)
   - **Convex handler changes** (new queries / mutations / actions, by file)
   - **API route changes** (if any)
   - **Component changes** (which components touched, which new ones added)
   - **Hook changes** (any new `hooks/use-*.tsx`)
   - **Test additions** (which `.test.ts(x)` files are required)
   - **Instrumentation events** (Amplitude events to add per the `event-tracking` skill)
   - **Commit / PR breakdown** (typically 1–3 PRs; for >3 PRs, use Speckit instead)
4. Save to `team-os/features/<slug>/plan-NOT-XXX.md`.
5. Confirm with the user before proceeding to implementation.

---

### Phase 4 — Implement (variable)

Open with: *"Phase 4 — Implement. I'll work through the plan one PR at a time."*

For each PR in the plan:
1. Decide whether to branch in place or create a worktree:
   - If the session is already inside a worktree, **do not create another worktree by default**. Branch in place with `git checkout -b feature/NOT-XXX-short-slug staging`.
   - If the session started from the main checkout and parallel isolation is useful, create a new worktree off `staging`.
   - If you create a fresh worktree, run the Phase 3.0 env-file sync from the `feature-workflow` skill before starting dev servers.
   - If you need multiple `noted-main` worktrees running at once, use the Phase 3.0.1 port-offset convention from the skill so the Next dev servers do not all collide on `3000`.
2. Implement the slice. Read the relevant skills before writing code in unfamiliar areas:
   - Convex changes → see `convex/` patterns; auth + ownership + indexes per `error-handling` skill
   - React changes → `derived-state` and `effect-to-event` skills are non-negotiable
   - Tests → `unit-testing` skill
3. Run the quality gate after every meaningful change: `npm run format && npm run lint:fix && npm run type:check && npm run test`. If any fails, fix before continuing.
4. Commit in small, semantic units. Commit messages reference the ticket: `feat(documents): add presence indicator (NOT-XXX)`.
5. When the slice is done, move to Phase 5 for that PR. Don't open multiple PRs in flight; ship one, then start the next.

---

### Phase 5 — Review

Open with: *"Phase 5 — Review. Running checks before we open the PR."*

Then:
1. Run `npm run format && npm run lint:fix && npm run type:check && npm run test` one more time.
2. Run the `code-quality-checklist` skill against the diff.
3. Run `/noted-review` on the staged changes for an opinionated multi-category review.
4. Surface findings to the user. Loop on fixes until the review comes back clean.

---

### Phase 6 — Ship

Open with: *"Phase 6 — Ship. Opening the PR."*

Then:
1. Use `/create-pr` to open a PR from the feature branch to `staging`.
2. PR description must include:
   - **What** — 2–3 sentence summary
   - **Why** — link to the spec at `team-os/features/<slug>/spec-NOT-XXX.md`
   - **How** — 3–6 bullet implementation summary
   - **Testing** — what was tested, what coverage looks like
   - **Screenshots / Loom** — for any user-facing change
   - `Closes NOT-XXX` — Linear auto-transitions on merge
3. After the PR is merged (out-of-band):
   - Use the `/ship-log` command to append an entry to `team-os/features/<slug>/ship-log.md`.
   - Update the feature dossier's status if it changed (`planned` → `in-development` → `live`).
   - If the spec needs amendments based on what shipped (it usually does), update it.

---

## Output of the whole flow

After a complete `/feature-workflow` run, the repo should contain:

```
team-os/features/<slug>/
├── brainstorm-NOT-XXX.md   ← Phase 1 output
├── spec-NOT-XXX.md         ← Phase 2 output
├── plan-NOT-XXX.md         ← Phase 3 output
└── ship-log.md             ← updated in Phase 6
```

Plus one or more merged PRs, each `Closes NOT-XXX`.

---

## Failure modes to watch for

- **Skipping Phase 0.** Do not let a feature start without a Linear ticket. The ticket is the spine of one-branch-one-PR.
- **Over-scoping in Phase 2.** If the spec is growing past 2 pages, stop and re-scope. Either split into two tickets, or switch to the heavier Speckit suite.
- **Plan that opens >3 PRs.** Same — split or switch to Speckit.
- **Skipping Phase 5.** Code that goes straight from "I think it works" to a PR description costs reviewers time. Run the quality gate and the review subagent first.
