---
name: feature-workflow
description: End-to-end feature development workflow for noted-main — from ideation through merge and smoke test. Every feature MUST begin with user grounding against the noted Customer Understanding OS (personas, pain landscape, behavioral cohorts). Use when starting a new feature, planning implementation, or checking what step comes next in the dev process. Pairs with the `/feature-workflow` slash command, which walks an agent through the same phases interactively.
summary: Interactive feature dev phases
---

<!--
Adapted from Razii's personal feature-workflow skill (originally written for
heatseeker-next). This is the noted-main version. Three things changed:

1. The personas, pain themes and customer quotes are now noted's own, in
   `team-os/research/`. Amplitude cohorts per persona are still missing —
   see "Activating this skill" at the bottom.
2. Heatseeker conventions (pnpm, HST-XXXX, /heatseeker-review,
   docs/architecture/*) → noted conventions (npm, NOT-XXXX, /noted-review,
   noted skills as architecture docs).
3. Added the team-os ship-log reflex in Phase 7 — noted's CLAUDE.md treats
   features as "not done" until the dossier is updated.

Companion files:
- `.ai/commands/feature-workflow.md` — slash command that walks through the
  same phases interactively. Keep them in sync.
-->

# Feature Development Workflow

A complete end-to-end guide for shipping a feature in noted-main — from raw idea to production.

**Non-negotiable:** Every feature must be user-grounded before any planning begins. No feature gets built on a hunch. If Phase 0 cannot be completed, pause and flag it — do not proceed to Phase 1.

> **Status:** active. The phases match the rest of the `.ai` stack, and Phase 0 now grounds against
> [`team-os/research/`](../../../team-os/research/) — five personas, a ranked pain landscape, and eleven
> interview transcripts, all in the repo and readable with no connectors. Two things are still
> missing and are marked `[NEED: ...]`: per-persona Amplitude cohorts, and the population sizes that
> would let a persona support a claim about how many people it covers.

---

## Phase 0 — User Grounding (MANDATORY)

### The source of truth

Every feature starts by opening the customer evidence in this repo:

🔗 **[`team-os/research/`](../../../team-os/research/)** — [personas](../../../team-os/research/personas.md), [pain landscape](../../../team-os/research/pain-landscape.md), and the [interview transcripts](../../../team-os/research/interviews/) behind both.

**Required action:** read the personas and pain landscape at the start of every feature, then open at
least one transcript and take the quote from the transcript rather than from the summary. A summary
of a summary is how grounding quietly becomes assertion.

> **Provenance, every time:** the transcripts are **constructed** for a teaching simulation. They are
> valid for exercising this workflow and invalid as proof that demand exists. Any artifact that
> grounds on them must say so. See [interviews/CLAUDE.md](../../../team-os/research/interviews/CLAUDE.md).

If a Notion Customer Understanding OS exists for your team, fetch it with the Notion MCP as well —
but `team-os/research/` is the copy that ships with the repo and works with no connectors.

### Then answer these four questions in writing (Linear ticket is a good home):

### 1. Which persona is this for?

Pick one (or explicitly more than one, if unavoidable). Full descriptions in [personas.md](../../../team-os/research/personas.md):

- **01 — The Drafter** — comes to think, leaves before publishing. High AI use, near-zero publish.
- **02 — The Reviewer** — never drafts here; gets pulled into someone else's nearly-ready draft. Wants comment-only, will not create an account.
- **03 — The Newcomer** — got value in session one, stalled at anything needing setup.
- **04 — The Tinkerer** — configures providers and models on purpose. Most articulate, most likely to be over-served.
- **05 — The Expander** — already sold, trying to bring a team in, blocked by a missing step.

If the feature "is for everyone," it's probably for no one. Force a choice. Personas 01 and 04 want
opposite things from the same roadmap, so "everyone" resolves a real conflict by ignoring it.

`[NEED: Amplitude behavioral cohort per persona]` — the personas are qualitative only today. No
persona has a population size, so do not use one to argue a segment is big.

### 2. Which pain does it address?

Pick one, from [pain-landscape.md](../../../team-os/research/pain-landscape.md), ordered by how many
independent transcripts raise it:

1. No step between private draft and public page — 7 of 11
2. Squad asks for configuration before it gives value — 5 of 11
3. The reviewer has to be recruited into the product — 3 of 11
4. AI makes weak work sound finished — 2 of 11
5. Model and prompt attribution is opaque — 2 of 11

Quote the evidence. Which interview, which customer, which Amplitude signal surfaced this pain?

If you are not working pain #1, say why in writing. Working a lower-ranked pain is often correct —
it may be smaller, testable, or unblocked — but it should be a stated choice.

### 3. What customer quote or behavioral signal justifies this feature?

Real user words from a transcript, or a specific behavioral signal. **No quote = no grounding = stop.**

The quote must be copied from a file in
[interviews/](../../../team-os/research/interviews/), with the person and date attached, e.g.

- > _"There is no middle state. Right now I choose between secrecy and overexposure."_ — Mia, 2026-04-08
- > _"It just felt like configuration before value."_ — Ethan, 2026-04-24

Behavioral signals come from the events in [`lib/analytics.ts`](../../../lib/analytics.ts). Anything
sourced from `scripts/fixtures/` is **seeded, not production** — label it, and never quote a seeded
baseline as a real one.

### 4. What action should this feature trigger, and how will we measure it?

Map to the **Closed Loop: Insight → Action** table in the Customer OS. The framework is universal and usable today; the _specific Amplitude events_ will fill in as the SDK accumulates data (see `event-tracking` skill):

| Insight type       | Action                                | Amplitude signal to watch                                      |
| ------------------ | ------------------------------------- | -------------------------------------------------------------- |
| Usability friction | UX iteration                          | Reduced time-on-screen, higher conversion on the affected flow |
| Feature gap        | New feature                           | New `track*` event fires after ship (see `event-tracking`)     |
| JTBD misalignment  | Onboarding copy / CTA change          | Improved `Onboarding Completed`                                |
| Persona signal     | Cohort tag + research flag            | Org-level property in Amplitude                                |
| Blocking behavior  | Fix friction point                    | Drop-off event drops, success event rises                      |
| Champion loss      | Re-engagement + multi-user onboarding | Second user activated within 30 days                           |

### Output of Phase 0

Write a short **User Grounding block** into the Linear ticket description at the top:

```markdown
## User Grounding

- **Persona:** [01 / 02 / 03 / 04]
- **Pain:** [# from Pain Landscape + one-line rephrasing]
- **Evidence:** [Quote or Amplitude signal]
- **Expected action + signal:** [What changes in behavior, which `track*` event proves it]
```

If any of these four are hand-waved or blank, **stop**. Re-interview, re-read the OS, or pick a different feature. Do not proceed to Phase 1.

---

## Phase 1 — Ideation & Planning

### 1. Brainstorm with Claude Code

- Throw rough ideas, debate tradeoffs, ask for clarity and explanation.
- **Every idea must be traceable to the User Grounding block** from Phase 0. If you find yourself brainstorming in abstract terms, stop and re-open the Customer Understanding OS.
- Don't commit to an approach yet — this is exploration mode.

### 2. Plan with Claude Code Plan Mode

- Use `/plan` or enter Plan mode to develop a concrete implementation plan.
- **The plan must name the persona and pain it targets** — copy them from the User Grounding block. A plan that doesn't reference a persona is not ready.
- **Verify the plan understands you and you understand it** — iterate until aligned.
- Read the relevant skills before planning unfamiliar areas (these are noted's "architecture docs"):
  - Convex backend → `convex-handlers`, `convex-schema`, `convex-queries` skills
  - React + state → `react-components`, `state-management`, `derived-state`, `effect-to-event` skills
  - Component splitting → `component-composition` skill
  - Visual / styling → `design-system` skill (and `DESIGN.md` for the visual contract)
  - AI tool authoring → `agent-tool-authoring` skill
  - Picking server surfaces → `api-routes-and-actions` skill
  - Where files go → `repo-structure` and `file-naming` skills
  - Errors / quality → `error-handling` and `code-quality-checklist` skills

### 3. Update the Linear Ticket

- Use the **Linear MCP** to update the ticket description with the finalized plan.
- The ticket must include **both** the User Grounding block (Phase 0) and the implementation plan.
- Include a link back to the Customer Understanding OS in the ticket for future readers.

---

## Phase 2 — Decide Implementation Path

After the doc plan is written into the Linear ticket, choose one of two paths:

### Path A — Doc Plan Is Enough → Just Build

- Proceed directly to Phase 3.
- Best for smaller, well-understood features.

### Path B — Use Speckit for Structured Implementation

- The doc plan (already in the Linear ticket) becomes context for Speckit.
- Run the full Speckit workflow:
  1. `/speckit.specify` — generate spec from ticket + description
  2. `/speckit.clarify` — resolve underspecified areas (up to 5 questions)
  3. `/speckit.plan` — generate design artifacts and implementation plan
  4. `/speckit.tasks` — generate actionable, dependency-ordered `tasks.md`
  5. `/speckit.implement` — execute the plan task by task
- Best for larger, more complex features where structure prevents drift.

---

## Phase 3 — Build & Iterate Locally

### 3.0.0 Worktree decision (before branching or spinning up dev servers)

Do this check before you create a branch, create a worktree, or start copying env files:

- If the session is already inside a worktree, **do not create another worktree** by default. Branch in place.
- Only create a new worktree when the session started from the main checkout and you actually need parallel isolation.

**Why this rule exists:**

- The user has explicitly opted into a worktree by starting the session there. Creating another worktree inside a worktree fragments the work across two directories, requires moving files back, and wastes the env cascade + `npm install` time that the current worktree already paid.
- Worktree-from-worktree is also a common source of confusion when the user later opens an editor expecting all the work to be in the place they started.

**How to check (run before any branching decision):**

```bash
# Is the session in the main checkout, or in a worktree?
git rev-parse --git-common-dir
git rev-parse --git-dir
# If these two differ, the session is in a worktree (the git dir is a
# pointer at .git/worktrees/<name> inside the common dir). If they match,
# this is the main checkout.
```

A simpler heuristic that's almost always right: if `pwd` contains `worktrees/`, you're in a worktree.

**Decision matrix:**

| Where is the session?                           | What to do                                                                                                                                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Main checkout (`~/Documents/GitHub/noted-main`) | Create a new worktree off the base branch via `git worktree add` (or the `worktree` skill).                                                                                                                                                      |
| Already in a worktree                           | **Do not create another worktree.** `git checkout -b feature/NOT-XXXX-short-slug <base-branch>` in place. Skip 3.0 if env files are already cascaded, and skip 3.0.1 if the offset is already chosen, unless the base branch's env keys changed. |

If the user asks for a "new worktree" while already inside one, confirm before creating a nested worktree. Usually they meant "branch off here." The default is **branch in place**.

### 3.0 Sync env files from local main (mandatory on a fresh worktree, recommended after rebasing main)

Worktrees do **not** inherit `.env*` files — they're gitignored. Before you `npm run dev` (or run any quality gate), copy the latest env files from your local main checkout. **Re-run this whenever you sync with main**, because the source-of-truth env may have new keys for a feature you're about to use.

```bash
# From inside the worktree:
NOTED_MAIN="${NOTED_MAIN:-$HOME/Documents/GitHub/noted-main}"
[ -d "$NOTED_MAIN" ] || { echo "Main checkout not found at $NOTED_MAIN — set NOTED_MAIN."; exit 1; }
(cd "$NOTED_MAIN" && find . -maxdepth 4 -type f \( -name ".env" -o -name ".env.*" \) \
    -not -path "*/node_modules/*" -not -path "*/.git/*" \
    -not -path "*/.next/*" -not -path "*/.swc/*") \
| while IFS= read -r f; do
    mkdir -p "$(dirname "$f")"
    cp -p "$NOTED_MAIN/$f" "$f" && echo "✓ $f"
done
```

This `find`-based form picks up any new env files added to main automatically — you don't need to hand-maintain a list. `cp -p` preserves timestamps so `npm install`'s postinstall hook (`sync-ai`) doesn't re-fire unnecessarily. `.gitignore` already covers `.env*`, so nothing leaks into commits.

> **When you're prompted about it:** if Claude is helping you set up a new worktree, ask it to run this step automatically. The step is also valid as a one-off later if main's env changed (e.g. a new `NEXT_PUBLIC_AMPLITUDE_API_KEY` gets added).

### 3.0.1 Optional: assign a port offset (running dev servers in parallel worktrees)

If you only `npm run dev` in one worktree at a time, skip this step. Kill the other dev server and you're fine.

If you want to run `noted-main` concurrently across worktrees, each worktree needs its own web port so the `next dev` processes do not all collide on `3000`.

**Convention:** main worktree = offset `0` ("primary"), second = `+10`, third = `+20`, etc. Use multiples of `10` for headroom and to keep the mental math easy.

**One worktree should stay at offset 0**. Keep the worktree that needs any provider-registered localhost callback URI as primary. Secondary worktrees are still fine for pure UI and app-flow iteration.

```bash
# 1. In the non-primary worktree, declare an offset.
echo 10 > .worktree-port-offset   # next worktree uses 20, then 30...

# 2. After running 3.0's env cascade, apply the rewrite.
OFFSET=$(cat .worktree-port-offset 2>/dev/null || echo 0)
if [ "$OFFSET" != "0" ]; then
    # noted-main currently only hardcodes localhost callbacks around the web app.
    # Expand this list if the repo later adds more local services with fixed ports.
    BASE_PORTS=(3000)
    ENV_FILES=$(find . -maxdepth 4 -type f \( -name ".env" -o -name ".env.*" \) \
        -not -path "*/node_modules/*" -not -path "*/.git/*" \
        -not -path "*/.next/*" -not -path "*/.turbo/*")
    for f in $ENV_FILES; do
        for base in "${BASE_PORTS[@]}"; do
            new=$((base + OFFSET))
            # Rewrite localhost:<base> / 127.0.0.1:<base> (followed by non-digit OR EOL)
            sed -i.bak -E "s#(localhost|127\\.0\\.0\\.1):${base}([^0-9])#\\1:${new}\\2#g" "$f"
            sed -i.bak -E "s#(localhost|127\\.0\\.0\\.1):${base}\$#\\1:${new}#g" "$f"
            # Rewrite bare PORT=<base> lines
            sed -i.bak -E "s#^PORT=${base}([^0-9]|\$)#PORT=${new}\\1#" "$f"
        done
        rm -f "$f.bak"
    done
    echo "✓ Applied port offset +$OFFSET (web -> $((3000+OFFSET)))"
fi
```

### Starting dev with an offset

- **Next.js web app**: start the dev server on the offset port directly:

```bash
OFFSET=$(cat .worktree-port-offset 2>/dev/null || echo 0)
npm run dev -- --port $((3000 + OFFSET))
```

`npx convex dev` can keep running in the second terminal as usual. The offset is about the web server collision, not Convex.

Don't edit [package.json](/Users/raziiabraham/Documents/GitHub/noted-main/package.json) to hardcode the offset. That's per-worktree state and shouldn't be committed.

### Caveats — what breaks at offset != 0

- **Provider-registered localhost callbacks** break on non-primary offsets. If any OAuth or webhook redirect URI is registered upstream against `http://localhost:3000`, the rewritten secondary worktree URI will fail until the provider config is updated too.
- **Repo docs and ad hoc scripts** may still assume `http://localhost:3000`. Adjust them mentally when testing a secondary worktree.
- **Shared backend state** still applies. Multiple worktrees can point at the same Convex deployment and the same third-party accounts, so avoid destructive tests in parallel.

> **Sanity check:** before `npm run dev`, run `lsof -i -P | grep -E ':(3000|3010|3020)\\b' | grep LISTEN` to see what's already bound. If a port you expect to use is held by another worktree, kill that one first or pick a different offset.

### 3.1 Implement & test locally

- Implement using the plan (or `tasks.md` if using Speckit).
- Run `npm run dev` in one terminal and `npx convex dev` in a second — both must be running for noted to work end-to-end (per `README.md`).
- **Locally test the functionality** — keep iterating until it matches your vision.
- Run the full quality gate before moving on:
  ```bash
  npm run format && npm run lint:fix && npm run type:check && npm run test
  ```

---

## Phase 4 — Push & Preview

- Push branch to remote.
- **Test again on the preview branch** — Render builds a preview environment for every feature branch; verify the feature works end-to-end in the deployed environment, not just locally. Convex preview deployments mirror the schema/handlers automatically.

---

## Phase 5 — Code Review (Self)

1. Run `/noted-review` — reviews all diffs against all skills and best practices (see the `noted-review` command).
2. Read the review report carefully.
3. Address every flagged issue.
4. **Add nuance where needed** — if a suggestion is about refactoring existing code (not caused by your change), it's out of scope. Push back with that context.

---

## Phase 6 — Open PR & automated checklist

1. Open a PR with `/create-pr` (targets `staging`). GitHub applies `.github/pull_request_template.md` and posts an **AI playground checklist** comment — complete every item before requesting human review.
2. **PR description must include:**
   - The User Grounding block from Phase 0 (persona, pain, evidence, expected signal)
   - A link to the Customer Understanding OS so reviewers can verify the grounding
   - A link to the Linear ticket as a `Closes NOT-XXXX` line so Linear auto-transitions on merge
   - The **`/noted-review` verdict** (paste ✅ or 🛑 from Phase 5)
3. **BugBot** will automatically run on the PR (if enabled for the org).
4. Read BugBot comments and the AI playground checklist. Ask your agent to _"address all items in the AI playground checklist on this PR"_ if anything is incomplete.
5. Add context where needed (e.g. "this refactor suggestion is about pre-existing code, not my change — out of scope").
6. **Push back on invalid comments** with reasoning grounded in the feature's context.

---

## Phase 7 — Human Review, Merge & team-os update

1. Wait for human reviewer approval.
2. Address any additional comments from the reviewer.
3. Once approved → **Merge** (feature → staging → main, per noted's branch flow).
4. After deploy → **Smoke Test** in production.
5. **Update team-os** (per noted's CLAUDE.md — _"Feature not 'done' until team-os updated"_):
   - Use `/ship-log` to append an entry to `team-os/features/<slug>/ship-log.md` (PR link, merge date, coverage delta, deploy status).
   - Update the feature dossier's status if it changed (`planned` → `in-development` → `live`).
   - Add the feature to `team-os/feature-index.yaml` if it's a new entry.

---

## Quick Reference: Quality Gate

```bash
npm run format && npm run lint:fix && npm run type:check && npm run test
```

## Quick Reference: customer evidence

Always open at the start of a feature, and re-open whenever in doubt about persona, pain, or expected signal:
🔗 **[`team-os/research/`](../../../team-os/research/)** — [personas](../../../team-os/research/personas.md) · [pain landscape](../../../team-os/research/pain-landscape.md) · [transcripts](../../../team-os/research/interviews/)

## Quick Reference: Step Order

| #   | Step                                                                                                                 | Tool/Command                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 0   | **User ground against `team-os/research/`**                                                                          | Read personas + pain landscape + one transcript                            |
| 1   | Brainstorm (anchored to persona + pain)                                                                              | Claude Code                                                                |
| 2   | Plan (names persona + pain)                                                                                          | Claude Code Plan Mode                                                      |
| 3   | Update ticket (includes User Grounding block)                                                                        | Linear MCP                                                                 |
| 4   | Decide path                                                                                                          | Doc plan vs Speckit                                                        |
| 4.4 | **Worktree decision** — if already in a worktree, branch in place; only create a new worktree from the main checkout | Phase 3.0.0 snippet                                                        |
| 4.5 | **Sync env files from local main** (fresh worktree, or after rebase)                                                 | Phase 3.0 snippet                                                          |
| 4.6 | **Optional port offset** for concurrent worktrees                                                                    | Phase 3.0.1 snippet                                                        |
| 5   | Build & test locally (`npm run dev` + `npx convex dev`)                                                              | Claude Code                                                                |
| 6   | Quality gate                                                                                                         | `npm run format && npm run lint:fix && npm run type:check && npm run test` |
| 7   | Push + preview test (Render preview)                                                                                 | `git push`                                                                 |
| 8   | Self review                                                                                                          | `/noted-review`                                                            |
| 9   | Open PR + BugBot (PR body includes User Grounding + Customer OS link)                                                | `gh pr create` or `/create-pr`                                             |
| 10  | Human review                                                                                                         | GitHub                                                                     |
| 11  | Merge + smoke test + team-os update                                                                                  | GitHub + production + `/ship-log`                                          |

---

## Activating this skill

Phase 0 is live. Two gaps remain, and both need data rather than writing:

1. **Per-persona Amplitude behavioral cohorts.** The five personas are qualitative — synthesized
   from transcripts, with no population behind them. Until cohorts exist, a persona can tell you
   _what someone wants_ and never _how many_. Building them needs `track*` data accumulating in a
   real project (see the `event-tracking` skill); the seeded cohort in `scripts/fixtures/` cannot
   substitute, because it describes a fixture.
2. **A real interview.** All eleven transcripts are constructed. One real conversation, carrying
   `provenance: real`, would be worth more than all of them for any decision that leaves the team.

Until then the rule holds and is unchanged: **features without grounding don't get built.** What has
changed is that grounding is now possible offline for any feature these personas cover. If the
feature you are working on is not covered — a churn question, a pricing question, anything about
mobile — the landscape says so explicitly, and the feature gets paused while evidence is gathered
rather than proceeding on a plausible guess.
