---
description: PR review — the team's single source of truth for code review on noted-main. Reviews EVERY changed file in the PR (regardless of path) against six categories: architecture-doc compliance (HIGHEST PRIORITY — when binding contracts exist in `team-os/engineering/architecture/`), cross-chunk architecture, per-feature design quality, `.ai/skills/` compliance, Linear ticket alignment (NOT-XXXX), and recurring "other concerns" (custom parsers, icons, lodash re-impls, Convex auth ordering, BlockNote extension safety). Chunked multi-agent approach scales to 150-file PRs; emits a binary verdict + per-category scorecard + grouped fix list. Always produces a report — even on tiny meta/docs PRs. Non-interactive: never asks the user for direction.
summary: PR review against skills + constitution
allowed-tools: Read, Grep, Glob, Agent, Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(git rev-parse:*), Bash(git fetch:*), Bash(git merge-base:*), Bash(gh pr view:*), Bash(gh pr checkout:*)
---

<!--
Adapted from heatseeker-next/.ai/commands/heatseeker-review.md
Noted-specific adjustments:
- HST → NOT (Linear prefix)
- Branch base: main → staging (noted's flow is feature → staging → main)
- Path-to-skill mapping rewritten for noted's structure (convex/, app/,
  components/, hooks/, lib/agent/) — heatseeker's monorepo+DAL patterns
  do not apply
- Architecture docs live under team-os/engineering/architecture/ when
  they exist (currently empty — framework is in place; trigger table
  will populate as architecture docs are added)
- Cross-cutting skills limited to those present in noted today:
  typescript-patterns, code-quality-checklist, unit-testing,
  derived-state, effect-to-event
- Other-concerns extended with noted-specific recurring traps:
  Convex auth ordering, .filter()-vs-withIndex(), BlockNote extension
  safety, useEffect data fetching when Convex useQuery exists
-->

## User Input

```text
$ARGUMENTS
```

## Overview

> **🛑 READ-ONLY. THE DELIVERABLE IS THE REPORT TEXT — NOTHING ELSE.**
>
> You are reviewing, not authoring. The report text is the only artifact this command produces. You MUST NOT, under any circumstance:
>
> - **Edit, create, or delete any file.** No `Edit`, no `Write`, no `NotebookEdit`. Not "obvious" typo fixes, not "while I'm here" tweaks, not formatter/linter runs, not regenerating snapshots.
> - **Mutate git state.** No `git add`, `git commit`, `git push`, `git rebase`, `git restore`, `git stash`, `git reset`, `git tag`, `git branch -d/-D`. The only git commands allowed are reads: `git diff`, `git log`, `git status`, `git rev-parse`, `git fetch`, `git merge-base`. Cloud-agent setup may use `gh pr checkout` once at the start of Step 2 — that is the only branch-state command permitted, and it must not run again afterwards.
> - **Mutate PR / issue state.** No `gh pr edit`, `gh pr merge`, `gh pr close`, `gh pr ready`, `gh issue edit`, `gh issue close`, `gh api … -X POST/PUT/PATCH/DELETE`, `gh api … -F …`. Read-only `gh` commands (`gh pr view`, `gh pr checkout`) are allowed; anything that writes is forbidden.
> - **Post comments, reviews, statuses, labels, or reactions to GitHub.** No `gh pr comment`, `gh pr review`, `gh api …/comments`, `…/reviews`, `…/labels`, `…/statuses`, `…/reactions`. The OUTPUT is the deliverable; the user reads it and acts on it.
> - **Generate, modify, or "fix" any code, config, doc, or workflow.** Even if you are 100% certain a one-line fix would resolve a finding. Even if Bugbot or another reviewer flagged it. Even if it's a typo, a missing import, or a clearly wrong glob pattern. The fix belongs to the AUTHOR, after they read the report.
>
> **There is no exception.** If you find yourself reaching for `Edit`, `Write`, `git commit`, `git push`, `gh pr comment`, or any equivalent — **STOP**. The thing you want to do belongs in the Things-to-fix section as a finding, not in the working tree.
>
> Why this rule is non-negotiable: if you fix something yourself, you have shipped unreviewed code into the PR you were supposed to be reviewing. The author never saw the finding. The team never agreed the fix is right. The reasoning is invisible. That is **strictly worse** than missing the issue entirely — you've actively introduced changes while everyone thinks they're getting a review. Do not do this. Ever.

You are acting as a technical manager and principal engineer reviewing a pull request. Your job is NOT to catch lint errors or style issues — CI handles that. Your job is to evaluate the PR from the perspective of systems design, architectural coherence, long-term maintainability, and alignment with the team's documented contract. You are the last line of defense before code ships.

Be strict but not nitpicky — flag what genuinely needs fixing or rethinking before merge, nothing more. Stylistic preferences and "could be cleaner" thoughts that aren't blockers are not findings.

**Scope: every changed file in the PR.** This includes app code, Convex handlers, hooks, components, configs, scripts, infra, docs, root files — everything. The path-to-skill mapping in Step 3a determines which **rules** apply to which file. It does NOT determine which files get reviewed. Files that don't match any skill pattern still go through cross-cutting checks (Step 6) and the four non-skill categories (Architecture, Design, Ticket alignment, Other concerns).

**Always produce the report.** Even if the PR is tiny, all-meta, or all-docs, the report is still emitted (verdict ✅ Ready to merge, scorecard mostly empty, no Things-to-fix section). Never stop early. Never ask the user for direction.

> **Branch flow reminder**: noted-main flows `feature/* → staging → main`. The diff base for review is `staging`, not `main`.

Findings come from six categories, in order of how the report presents them:

1. **Architecture-doc compliance (HIGHEST PRIORITY — no deviation)** — files in subsystems with a documented architecture (under `team-os/engineering/architecture/`) MUST follow the matching doc. The doc is a binding contract; deviation is a finding regardless of size or "the code works" (Step 3e + per-chunk Step 5). *Currently the trigger table is empty — noted has not yet codified architecture docs. The framework lights up automatically as docs land.*
2. **Architecture** — cross-chunk patterns visible only when you can see the whole diff: shared-module consumer drift, schema changes that didn't propagate to handlers, removed symbols, new env vars (Step 6a).
3. **Design** — per-feature judgment: abstraction level, separation of concerns, maintainability, scope creep within the PR (per-chunk, Step 5).
4. **Skill compliance** — the diff must follow rules in the relevant `.ai/skills/<name>/SKILL.md` files (per-chunk in Step 5; cross-cutting skills in Step 6b).
5. **Ticket alignment** — does the PR implement what the Linear ticket asked for? Are acceptance criteria met? Has scope expanded beyond the ticket? (Step 6c).
6. **Other concerns** — a fixed list of recurring traps the team has decided not to repeat (Step 6d).

Runs **non-interactively** — designed for cloud agents. No confirmation gates, no walkthroughs, no PR comment posting. Output is a binary verdict (✅ ready to merge / ❌ has issues) + a per-category pass/fail scorecard + a grouped list of things to fix. That's it.

Review proceeds in four phases — **gather → triage → per-chunk review → synthesis** — so PRs of 100+ files can be reviewed without the middle files getting half-attention.

## Outline

### 1. Parse Arguments

`$ARGUMENTS` may be:

- A **GitHub PR URL** (`https://github.com/avidx-app/noted-main/pull/<N>`) — typical cloud-agent invocation. The command sets up the working tree itself.
- **Empty** — local mode. Review the current branch against `staging`. The user is expected to have the branch already checked out.

After the working tree is set up (Step 2), use local git / Read / Grep for everything — diffs, file reads, cross-references. `gh` is only used to fetch PR metadata and to check out the branch on first run.

### 2. Set Up and Verify the Working Tree

#### PR URL mode

1. Fetch PR metadata:

    ```bash
    gh pr view <PR_NUMBER> --json title,headRefName,baseRefName,headRepository,changedFiles,additions,deletions
    ```

    Extract `headRefName` and `baseRefName` (typically `staging`).

2. Check whether the branch is already checked out:

    ```bash
    git rev-parse --abbrev-ref HEAD
    ```

    - If equals `headRefName`, skip step 3.
    - Otherwise: `gh pr checkout <PR_NUMBER>`.

3. Verify clean working tree:

    ```bash
    git status --porcelain
    ```

    If non-empty, **STOP** with: `"Working tree has uncommitted changes; refusing to run on a dirty tree."`

4. Fetch the Linear ticket. Look for `NOT-\d+` in (in order): the PR title, the branch name (`headRefName`), the PR body. Fetch via Linear MCP `get_issue` and capture: `title`, `description`, `acceptance criteria`, `status`, `priority`, `labels`. Best-effort — if Linear MCP unavailable, warn but proceed; the ticket-alignment category falls back to "no ticket fetched" handling.

    If no ticket ID found, proceed without — the absence is itself a definite finding under `ticket-alignment`.

#### Local mode (no `$ARGUMENTS`)

1. Verify we're not on the base branch:

    ```bash
    git rev-parse --abbrev-ref HEAD
    ```

    If `staging` or `main`: **STOP** with `"On <branch> — nothing to review. Check out a feature branch first."`

2. Verify clean working tree (same `git status --porcelain` check; same stop condition).

3. Set `baseRefName` = `staging`.

4. Look for `NOT-\d+` in branch name. If found, fetch via Linear MCP. Otherwise proceed without — the absence triggers a definite ticket-alignment finding.

#### Then in both modes, gather the diff

```bash
git fetch origin <baseRefName>
git diff --numstat origin/<baseRefName>...HEAD
git log --oneline origin/<baseRefName>..HEAD
```

### 3. Build the Chunk Plan

Goal: group changed files into **skill-domain chunks**. Each chunk has one applicable skill set.

#### 3a. Path-to-skill mapping

This determines **which skill rules apply to which file** — it is NOT a scope filter. Every changed file gets reviewed.

| File pattern | Chunk | Per-chunk skills to load |
|---|---|---|
| `convex/*.ts` (excluding schema, test, generated) | **Convex handlers** | `error-handling`, `typescript-patterns` |
| `convex/schema.ts` | **Convex schema** | `typescript-patterns` |
| `app/api/**/route.ts` | **API routes** | `error-handling`, `typescript-patterns` |
| `app/**/{page,layout,loading,error,not-found}.tsx` | **App router** | `derived-state`, `effect-to-event`, `typescript-patterns` |
| `components/**/*.tsx` (excluding `components/ui/`) | **Components** | `derived-state`, `effect-to-event`, `typescript-patterns` |
| `components/ui/**/*.tsx` | **UI primitives** | `typescript-patterns` *(noted convention: do not modify shadcn primitives — wrap in `components/<feature>/` instead. Modifications here are a design finding.)* |
| `hooks/use-*.tsx` | **Hooks** | `derived-state`, `effect-to-event`, `typescript-patterns`, `unit-testing` |
| `lib/agent/**` | **AI agent code** | `typescript-patterns`, `error-handling` |
| `lib/**/*.ts` (excluding lib/agent and tests) | **Utilities** | `typescript-patterns`, `unit-testing` |
| Files importing from `@/lib/analytics` or `track*` calls | **Analytics** | `event-tracking` *(installed in Wave 1 Step 7)* |
| `*.schema.ts` or files using `z.object` outside layers above | **Schemas** | `typescript-patterns` |
| `scripts/**`, `kebab_rename.py`, root config files | **Scripts/configs** | `typescript-patterns` |

If a file matches multiple patterns, put it in the **most specific** chunk (Convex schema beats Convex handlers; UI primitives beats Components).

#### 3b. Skip chunk

Files where the diff itself usually carries no review signal — glance at the diff for sanity, no full reads, no per-chunk skill review. **Still count toward the PR**: cross-cutting checks (Step 6), Architecture, Design, Ticket alignment, and Other concerns ALL apply, and the report is produced regardless.

- Lockfiles: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- Generated artifacts: `convex/_generated/**`, `*.snap`, generated `.d.ts`, `next-env.d.ts`, `tsconfig.tsbuildinfo`
- Test files: `*.test.*`, `*.spec.*`, `__tests__/`, `__mocks__/`, fixtures
- Pure barrel files: `index.ts` / `index.tsx` that only re-export
- Docs: `*.md`, except `SKILL.md` edits which deserve a glance

Test coverage is checked at the cross-cutting layer (`unit-testing` skill in Step 6b), not in the test chunk itself.

A skip-chunk-only PR (e.g. all docs, all lockfile bumps) still gets the full Step 6 + Step 7 treatment. Verdict in that case is almost always ✅ Ready to merge with an empty Things-to-fix section — but the report is always emitted.

#### 3c. Uncategorized chunk

Files that match no pattern in 3a (e.g. `team-os/`, root configs, things in `public/`). They get reviewed against cross-cutting skills (Step 6b), Design (per-chunk in Step 5), and the four non-skill categories. The lack of a skill-domain match never means "skip the file."

#### 3d. Chunk plan record (INTERNAL — never shown to the user)

Produce one entry per chunk in your own working scratchpad. **Do not emit this to the user.** Drives Step 5 only.

```
### Chunk N: <name>
- Files (count): <list>
- Applicable skills: <skill names>
- Hypothesis: <one sentence — what is this chunk doing?>
```

Forbidden behaviors at this step:

- Emitting a "Pre-flight summary", "Proposed chunk plan", "Plan preview", or any heading the user reads.
- Asking "Reply go to proceed" or any equivalent confirmation.
- Listing the chosen mode, file counts, or chunk breakdown to the user.
- Requesting permission to fan out, re-cluster, or proceed.

#### 3e. Architecture-doc loading (HIGHEST PRIORITY — no deviation)

For every changed file in scope, also check whether its path matches one of the architecture-doc triggers below. If it does, the listed architecture doc(s) are loaded as **binding contracts** for the per-chunk review (Step 5) — in addition to the SKILL.md files from 3a, not instead.

| Path trigger | Architecture docs (BINDING) |
|---|---|
| `components/**/*.tsx`, `app/**/*.tsx`, `app/globals.css`, `tailwind.config.ts`, `components.json` | `DESIGN.md` (visual identity contract) |

> **Status note for noted**: the trigger table currently has one entry — `DESIGN.md`. As more architecture docs land in `team-os/engineering/architecture/<doc>.md`, add their triggers here. Examples likely to land:
> - `lib/agent/**` → `team-os/engineering/architecture/ai-agent-architecture.md`
> - `convex/coworkerMessages.ts`, `convex/squadAgents.ts` → `team-os/engineering/architecture/coworker-chat.md`

When a UI file matches the DESIGN.md trigger, the linter treats it as a binding contract: any visual change (new color, new typography, new component variant, new spacing) must be reflected in DESIGN.md in the same PR. Common findings:

- A new `bg-blue-*`, `bg-violet-*`, or other branded color used outside an AI-affordance or marketing-CTA context (DESIGN.md §Brand accent restricts these).
- An inline `style={{ color: '#hex' }}` or raw hex/rgb in a `className` (DESIGN.md §Don't).
- A modified file under `components/ui/` (shadcn primitives are read-only per DESIGN.md and Constitution §XII; wrap, don't edit).
- A new typography size hardcoded as `text-[2.125rem]` (DESIGN.md §Typography requires reusing `Body`, `Body SM`, or `Caption`).
- A new color, typography, radius, or spacing value used in code without the corresponding token added to DESIGN.md.
- A box-shadow on a permanent surface (DESIGN.md §Elevation: borders, not shadows).

When a trigger does match, findings emit with the literal `architecture-compliance` in the `Skill:` field, plus a `Doc:` field naming the architecture doc, plus a `Rule:` paraphrasing the specific rule violated. These are the highest-priority findings — they appear FIRST in the scorecard and Things-to-fix sections.

### 4. Pick the Mode

Count files in non-skip chunks. Pick automatically — no announcement.

| Reviewed files | Mode | Behavior |
|---|---|---|
| 0 | **Skip-only** | No per-chunk review. Go to Step 6 (cross-cutting + Architecture + Ticket alignment still apply). Then Step 7. |
| 1–29 | **Single-pass** | Skip per-chunk fan-out. Load all relevant skills in main context, read all changed files, review inline. Jump to Step 6. |
| 30–100 | **Chunked sequential** | Walk chunks one at a time in main context (Step 5a). Accumulate findings. Then Step 6. |
| 100+ | **Fan-out** | Spawn one subagent per chunk via the Agent tool, all in a single message (Step 5b). Then Step 6. |

### 5. Per-Chunk Skill Compliance Review

#### 5a. Single-pass / chunked-sequential mode

For each chunk, in order:

1. Read every `SKILL.md` in the chunk's `Applicable skills` list. Inline contents into working context.
2. **(HIGHEST PRIORITY)** Read every architecture doc whose path trigger (Step 3e) matches files in this chunk. Inline contents as binding contracts.
3. Read every file in the chunk in full using the Read tool. Skip exclusions per Step 3b.
4. For each file, evaluate against (in order):
    - **Architecture-doc compliance (HIGHEST PRIORITY)** — implementation must literally match documented contracts. Cite `Skill: architecture-compliance`, `Doc: <doc-name>`, `Rule: <quoted/paraphrased rule>`.
    - **Design quality** — abstraction level, separation of concerns, maintainability, data flow clarity. Cite `Skill: design`, `Rule: <one-line description>`.
    - **Each loaded skill rule** — cite `Skill: <name>`, `Rule: <quoted/paraphrased>`.

    Every finding needs a specific file/line and a concrete fix.

5. Emit findings using the format in 5c. Do not write the user-facing report yet.

#### 5b. Fan-out mode

Before spawning, for each chunk:

1. Slice the diff: `git diff origin/<baseRefName>...HEAD -- <files>`.
2. Read each applicable `SKILL.md` and inline full contents into the subagent prompt under `## Skill rules`.
3. **(HIGHEST PRIORITY)** For every file in the chunk whose path matches an architecture-doc trigger, read each matching arch doc and inline its full contents into the subagent prompt under `## Architecture-doc contracts (BINDING — highest priority)`.
4. Send all subagent calls in a single message so they run concurrently.

Subagent prompt template (substitute the bracketed parts):

```
You are acting as a senior engineer reviewing one chunk of a larger PR. Stay strictly within your chunk's scope; sibling agents are reviewing other chunks.

The working tree is checked out at the PR's HEAD. Use Read on the local tree, Grep/Glob for cross-references inside your chunk's scope. Do NOT call `gh`. Do NOT review files outside your chunk.

## Your chunk
- Name: <chunk name>
- Files in scope (Read each in full):
  - path/a.ts
  - path/b.ts
- Diff for these files:
<diff slice>

## Architecture-doc contracts (BINDING — highest priority)

The architecture docs below are NOT advisory. They are binding contracts for the subsystems your chunk touches. **Any deviation is a finding** — no carve-outs for "code works", "design preference", "this is just a tweak", or PR size. Implementation is expected to literally match the documented contract, not "achieve the same goal differently". Surface architecture-doc findings BEFORE design and skill findings.

When a violation is found, emit a finding with `Skill: architecture-compliance`, `Doc: <doc-name>`, `Rule: <quoted/paraphrased rule from the doc>`.

If the section below is empty, the chunk has no files matching an arch-doc trigger — skip this check.

### Doc: <doc-name-1>

<verbatim contents>

### Doc: <doc-name-2>

<verbatim contents>

## Design quality

Evaluate the chunk's design AFTER arch-doc compliance but BEFORE individual skill rules.

- **Abstraction:** appropriate level? Not over-engineered, not under-engineered.
- **Separation of concerns:** logic in the right layer/file? Convex handlers contain business logic; components stay presentational; hooks bridge between them.
- **Data flow:** easy to follow? No god-objects threaded through layers, no hidden side effects.
- **Maintainability:** will this be easy to change in 6 months? Naming clear? Sharp edges?

Findings use `Skill: design`, `Rule: <one-line description>`. Same fix-or-not bar.

## Skill rules to enforce

### Skill: <skill-name-1>
<verbatim SKILL.md contents>

### Skill: <skill-name-2>
<verbatim SKILL.md contents>

## Hard rules
- **READ-ONLY. The deliverable is your findings list — NOTHING ELSE.** Do NOT edit/create/delete files. Do NOT run any git write. Do NOT run any `gh` write. Do NOT run formatters/linters/tests/codegen. If you spot a bug — even an "obvious" one — file it as a finding; you NEVER fix it yourself.
- You are NOT a linter. Skip formatting, import order, JSDoc presence, raw `any` (CI handles those — except where a skill explicitly addresses them, e.g. `typescript-patterns` no-`any`).
- **No severity. No warnings. No suggestions.** A finding is "fix before merge" or it doesn't exist. Do NOT use 🔴 / 🟡 / 🟢 or labels like Critical / Warning / Minor.
- **Only flag things worth fixing before merge.** Phrasings like "could be cleaner", "would be nice", "consider", "optional" are tells you're about to write a non-finding — stop. **Exception:** the nitpick filter does NOT apply to `architecture-compliance` findings.
- Every finding cites a source: a loaded skill rule, an arch-doc rule (`Skill: architecture-compliance` + `Doc:` + `Rule:`), or `Skill: design`.
- Every finding references a specific file and line range from your scope.
- If a concern points to code outside your scope, list it under "Cross-chunk concerns" — don't flag it as your finding.
- Be honest: zero findings is the expected outcome for a well-written PR. Don't pad.
- Do not post comments to the PR. Do not call `gh`.

## Required output format
Return ONLY a markdown document with this structure (no preamble, no closing summary):

# Chunk: <name>

## Findings

### Finding 1
- **Skill:** <skill name, or one of `architecture-compliance` / `design`>
- **Doc:** <arch-doc name — REQUIRED when Skill is `architecture-compliance`; omit otherwise>
- **Rule:** <specific rule violated>
- **File:** <path>
- **Line:** <n or n-m>
- **Why:** <one short sentence: reason it's a problem AND what breaks if not fixed>
- **Fix:** <one-line concrete fix>
- **Rationale (internal):** <1–2 sentences for synthesis dedupe>

(Order findings within the chunk: arch-compliance first, then design, then skills.)

### Finding 2
...

## Cross-chunk concerns

(Things you noticed in files outside your scope. Empty list is fine.)

- <file outside your chunk> — <one-sentence concern + which skill it touches>
```

When all subagents return, parse outputs into a unified findings list (chunk → findings[]).

#### 5c. Findings format (also for 5a)

```
- **Skill:** <name>
- **Doc:** <arch-doc name — REQUIRED when Skill is `architecture-compliance`; omit otherwise>
- **Rule:** <rule paraphrased or quoted>
- **File:** <path>
- **Line:** <n or n-m>
- **Why:** <one short sentence: reason it's a problem AND what breaks if not fixed>
- **Fix:** <one-line concrete fix>
- **Rationale (internal):** <1–2 sentences for synthesis dedupe>
```

**Calibration:** A finding means "fix before merge." There is no severity tier. Drop anything stylistic, future-improvement, or "could be cleaner." Skill rules that ESLint/Prettier already enforce are not findings. **Exception:** `architecture-compliance` findings are binding contracts — calibration above (drop nitpicks, drop preferences) does NOT apply.

### 6. Cross-Cutting Checks + Synthesis

Run in main context after all chunks reported. Whole-PR view comes together — cross-cutting skills, recurring trap detection, cross-chunk architecture verification, ticket alignment, dedupe, nitpick pruning.

#### 6a. Architecture concerns

Cross-chunk patterns visible only with the whole diff. Findings here use literal `architecture` in `Skill:` field, with `Rule:` matching one of the bullets below.

**A finding requires concrete evidence verified by Grep against the local working tree** — the un-updated consumer, the missing layer, the orphaned reference. Don't guess.

- **Convex schema → handler propagation.** A change in `convex/schema.ts` (new table, new field, new index) must be reflected in handlers that read/write that data. Grep for the changed table/field across `convex/*.ts`; missing handler updates = finding.

- **Convex handler → client propagation.** A change in a Convex query/mutation/action signature must propagate to client call sites. Grep for `useQuery(api.<module>.<fn>...)` / `useMutation(api.<module>.<fn>...)` / `useAction(api.<module>.<fn>...)`; consumers left behind = finding.

- **Removed symbols.** For any function, component, hook, Convex handler, or export removed by the diff, Grep for remaining references. Live references = unfinished cleanup.

- **API contract changes.** Breaking changes in `app/api/*/route.ts` request/response shapes. Grep for callers (`fetchJson('/api/...')`, route imports) and verify they were updated. Missing version bump or feature flag for a breaking change is a separate finding.

- **New env vars / config.** Grep for any new `process.env.X` reference. Verify it's present in `.env.example`, in deploy configs (`render.yaml`), in setup docs. Missing → undocumented config.

- **Convex migrations.** Schema changes that drop or rename existing fields must be backwards-compatible during deploy (read-old-write-new pattern) or include a documented migration. Existing rows must be handled.

- **AI tool registration drift.** New AI tools added under `lib/agent/tools/` must be registered with the agent infrastructure (squadAgents, coworker chat, etc.). Grep tool names against registration sites; missing registrations = unreachable code.

#### 6b. Cross-cutting skills

Read each `SKILL.md` once and check the entire PR. Applied centrally for consistent bar.

- `typescript-patterns` — `any`, unsafe assertions, missing narrowing? Branded `Doc<>`/`Id<>` types preferred over plain strings?
- `code-quality-checklist` — pre-commit checklist items missed?
- `unit-testing` — new utilities/hooks/services without tests? Mocks of Clerk and Convex at the top of any test that touches them?
- `derived-state` — applies broadly to React; any new component syncing props or `useQuery` results into state via `useEffect`?
- `effect-to-event` — applies broadly; any new component running side effects (mutations, navigation, toasts) inside `useEffect` instead of event handlers?

For each violation, emit a finding using the same format as Step 5c.

> **`file-naming` and `monorepo-structure` are not yet codified for noted** — they're in Wave 3 of the course adaptation. Skip these as cross-cutting checks until the SKILL.md files land.

#### 6c. Ticket alignment

If a Linear ticket was fetched in Step 2, compare diff against it. Findings here use `Skill: ticket-alignment` and a `Rule:` from the list below.

- **Implements the ticket intent.** Does the diff actually do what the ticket describes? If a chunk has no obvious connection, that's either scope creep (finding) or the ticket is missing context (note in report, not a finding).
- **Acceptance criteria met.** For each AC in the ticket, find evidence in the diff. Missing AC = finding. Cite the AC verbatim and explain what's not covered.
- **No undocumented scope creep.** Substantial work outside the ticket (a refactor, a separate bug fix, an unrelated feature) → flag. Small drive-by improvements (a typo fix, an obvious rename in a touched file) are fine; new features, new endpoints, new data models are not.
- **No missing functionality.** If ticket describes A, B, C and diff only covers A and B, that's a finding even if A and B are correctly implemented.

If no ticket was found in Step 2: always emit a single finding under `ticket-alignment` with the rule "Every PR must reference a Linear ticket" — regardless of PR size or type. The finding's `Why:` explains that without a ticket, reviewers and future readers can't see why this change exists, what scope it covers, or what "done" means. Fix bullet instructs the author to open a Linear ticket capturing **the problem being solved, the goal/outcome, and the scope (what's in vs out)**, and reference it via the branch name (`feature/not-1234-...`), the PR title, or the PR body.

#### 6d. Other concerns

Project-specific recurring patterns flagged in PR review that aren't backed by a SKILL.md. Run at cross-cutting layer (main agent only). Findings use literal `other-concerns` in `Skill:` field.

The list is intentionally short; if a pattern keeps showing up, promote it to its own SKILL.md.

- **Custom parsers for well-known formats.** Regex-based parsing of HTML, JSX, Markdown, or DOM is brittle. Use the established library:
    - **Markdown →** `marked` or `react-markdown` (both already dependencies)
    - **HTML / DOM (server) →** `node-html-parser` or `cheerio`. **(Browser →** `DOMParser`.)
    - **JSX / TypeScript source →** an AST parser (`@babel/parser`, `typescript`)

    Detection: search changed files for regex literals targeting `<...>` tags or Markdown syntax (`#{1,6}`, `\*\*...\*\*`, `\[...\]\(...\)`).

- **Icons in React files.** New icons must come from `lucide-react`:

    ```tsx
    import { ArrowRight } from 'lucide-react';
    ```

    Inline `<svg>` is acceptable only for bespoke artwork (brand logos, illustrations). Imports from other icon libraries (`react-icons`, `@heroicons/*`, `phosphor`, `@radix-ui/react-icons`) are findings — `lucide-react` is the project's icon library.

- **Re-implementing utilities.** Hand-rolled versions of common utilities. Use `lodash` (already a dependency) or noted's existing helpers. Operations with a clean JS-native equivalent stay native — `.trim()`, `Array.from(new Set(arr))`, `Object.entries`/`Object.fromEntries`, plain `.map`/`.filter`/`.reduce`.

- **Convex auth ordering.** Mutations and actions touching user data must check `ctx.auth.getUserIdentity()` BEFORE any data access. Detection: in changed Convex handlers, look for `await ctx.db.get(...)` or `await ctx.db.query(...)` BEFORE the auth check, or for missing auth check entirely on user-data handlers. See `error-handling` skill for the canonical triad.

- **`.filter(...)` on un-indexed fields in Convex.** Convex queries should use `.withIndex(...)` for any field that's queried frequently. Detection: in changed `convex/*.ts`, look for `.query("table").filter((q) => q.eq(q.field("X"), ...))` where `X` is a userId or other field that ought to be indexed. Cross-reference against `convex/schema.ts` to see if an index exists.

- **`useEffect` for data fetching when Convex `useQuery` exists.** noted's data layer is reactive by default — fetch via `useQuery(api.<module>.<fn>, ...)`, not via `useEffect(() => { /* fetch */ }, [])`. Detection: in changed components/hooks, look for `useEffect` containing `fetch(...)`, manual data fetching, or syncing of `useQuery` results into local state. The `derived-state` and `effect-to-event` skills already cover most of this — this row is the cross-cutting catch.

- **BlockNote extension safety.** Editor extensions in `lib/agent/` or referenced from `components/editor.tsx` must handle the empty-document and partial-content cases. Detection: in changed BlockNote-related code, look for unconditional access to `editor.document[0]`, missing length checks, or assumption that the editor has any blocks.

- **Modifying `components/ui/`.** Files under `components/ui/` are shadcn primitives — do not modify. Wrap with project-specific variants in `components/<feature>/`. Detection: any change to a file under `components/ui/`. (This is a Design finding too, but the explicit recurring-concern entry makes it impossible to miss.)

#### 6e. Dedupe

Two chunks can flag the same root concern from different angles. For each pair across chunks, compare rationales — if they describe the same underlying root cause, **merge** into a single finding citing both file locations.

Repeated violations of the same skill rule across many files (e.g. 8 files with `useEffect` data-fetching) collapse into ONE finding with a list of locations.

#### 6f. Nitpick filter

Walk every finding and drop anything a reasonable engineer wouldn't insist on fixing before merge.

**Exclusion: this filter does NOT apply to `architecture-compliance` findings.** Arch-doc deviations are binding contract violations — drop-list checks don't apply.

**Hard drop list — if a finding contains any of these phrasings, delete it:**

- "Optional:" / "could" / "consider" / "you might want to"
- "Cosmetic" / "nice-to-have" / "polish"
- "Suggestion" / "warning" / "minor" / "small"
- "No code change needed" / "no fix required"
- "Stylistic" / "could be cleaner" / "could be tighter"
- "Inconsistent formatting" between things that already work
- Anything starting with "It would be nice if..." or "Ideally..."

**Severity self-check:** there are no severity tiers. Strip 🔴 / 🟡 / 🟢 or labels like Critical / Warning / Suggestion / Minor — every surviving finding is "fix before merge."

#### 6g. Cross-chunk concerns

Each "Cross-chunk concern" raised by a subagent is the main agent's responsibility. Promote to one of: a skill finding, an other-concerns finding, an architecture finding, a design finding, or a ticket-alignment finding — whichever fits. If none fit, drop it.

### 7. Produce the Report

**This is the FIRST and ONLY user-facing output.** Steps 1–6 are silent. The first thing the user sees is `# PR Review`. Output exactly the three sections below in order.

**The output structure is fixed and non-negotiable.** Every report — without exception — contains, in this exact order:

1. `# PR Review` (literal H1)
2. `PR: <title or "local diff"> · Files: <N> reviewed, <M> skipped` (one line)
3. `**Verdict:** ✅ Ready to merge.` OR `**Verdict:** ❌ <N> issue(s) to fix before merge — see below.`
4. Scorecard table (Step 7b — REQUIRED on every run)
5. `## Things to fix` section (Step 7c — only when verdict is ❌; omitted entirely when ✅)

**Forbidden in the output:**

- Skipping the `# PR Review` header.
- Skipping the scorecard — even on tiny PRs, all-docs PRs, zero-finding PRs. Mandatory.
- Renaming `## Things to fix` to `## Findings`, `## Issues`, `## Concerns`, etc.
- Adding sections not listed above. Specifically forbidden: `## Findings`, `## Open questions`, `## Open questions / assumptions`, `## Assumptions`, `## Change summary`, `## Summary`, `## Notes`, `## Validation`, `## Verification`, `## Recommendations`, `## Suggestions`, `## Observations`, `## Context`, `## Background`, `## Next steps`.
- Editorial commentary anywhere: "Latest CI is green", "I validated against...", "I confirmed that...", "Assumed the current behavior...", "no additional code changes were required".
- Writing `## Things to fix\n\n*None.*` or any equivalent placeholder when verdict is ✅ — section is omitted.
- Any text after the scorecard (when ✅) or after the last `## Things to fix` bullet (when ❌). The report ends there.

#### 7a. Header + verdict

```
# PR Review

PR: <title or "local diff"> · Files: <total> reviewed, <skipped> skipped

**Verdict:** ✅ Ready to merge.
```

OR:

```
**Verdict:** ❌ <N> issue(s) to fix before merge — see below.
```

Two states only. No "warnings", no "minor".

#### 7b. Scorecard

**Required in every report.** Six-category order: **Architecture-doc compliance (per-doc rows), Architecture, Design, Skills (per-skill rows), Ticket alignment, Other concerns**. Items with zero applicable files are omitted entirely.

| Category | Files | Status |
|---|---|---|
| `arch:<doc>` | <N> | ✅/❌ |
| Architecture | <N> (all) | ✅/❌ |
| Design | <N> (all) | ✅/❌ |
| `<skill-name>` | <N> | ✅/❌ |
| Ticket alignment | vs NOT-XXXX | ✅/❌ |
| Other concerns | <N> (all) | ✅/❌ |

**Files-column rules:**

- **Architecture-doc compliance rows** — one row per arch doc loaded. Row name is `arch:<doc-name>`. If zero arch docs were loaded (currently always — see Step 3e note), omit all arch rows.
- **Skill rows** — count of changed files matching skill's pattern. If zero, omit.
- **Architecture / Design / Other concerns** — `<N> (all)` total reviewed file count.
- **Ticket alignment** — `vs NOT-XXXX` when ticket fetched, `— No ticket` if none. Always shown. `— No ticket` always pairs with `❌ Fail`.

#### 7c. Things to fix

**Section heading is exactly `## Things to fix`.** Appears ONLY when verdict is ❌. When verdict is ✅, omit entirely.

Group findings by category in the same order as the scorecard. Show only categories that failed. Within each group, one bullet per finding. Architecture-doc compliance findings always come first when present.

**Bullet format**: every bullet states (a) what's wrong + where, (b) **why it matters / what breaks if unfixed**, and (c) the concrete fix. One short paragraph, no padding.

Pattern: `<file:line> — <what's wrong>. <why it matters / what breaks>. Fix: <action>.`

```
## Things to fix

### Architecture

- `convex/schema.ts:24` adds a `presence` table but `convex/documents.ts:get` still returns documents without joining presence — UI components consuming the query won't see presence info even after the schema lands. Fix: add the lookup in `get` or expose a separate `getPresence` query.
- `convex/aiSettings.ts` removed `getProviderById` but `app/api/ai/chat/route.ts:18` still imports it — the build will fail on deploy. Fix: remove the call sites or restore the export.

### Design

- `components/editor.tsx:42-118` — 76 lines of branching with 6 nested conditionals for AI mode handling. Future edits to any AI mode will touch the whole function and risk regressing siblings. Fix: extract per-mode handlers into named functions (`handleAskAI`, `handleSlashCommand`, `handleCoworkerInsert`).

### `error-handling`

- `convex/presence.ts:18` — handler queries `ctx.db.get(args.id)` BEFORE auth check. If the document doesn't exist, the function returns null without ever asking who's calling, leaking existence information. Fix: move `await ctx.auth.getUserIdentity()` and the not-authenticated throw to the top of the handler.

### `derived-state`

- `components/coworker/coworker-panel.tsx:58` — `useEffect` syncs the result of `useQuery(api.squadAgents.list)` into local state. The Convex query is already reactive; copying it into state introduces a render-extra-render loop and risks state drift. Fix: read `useQuery` result directly; remove the local state.

### Ticket alignment

- PR has no Linear ticket reference (no `NOT-NNNN` in branch, title, or body). Without one, reviewers and future readers can't see why this change exists, what scope it covers, or what "done" means. Fix: open a Linear ticket capturing the **problem being solved, the goal/outcome, and the scope (what's in vs out)**, then reference it via the branch name (`feature/not-1234-...`), the PR title, or the PR body.
- NOT-2537 acceptance criterion #3 ("emit Amplitude `Document Published` event") has no corresponding analytics call in the diff — the dashboard the PM relies on for adoption will report zeros for this flow. Fix: add `track('Document Published', { documentId })` in the `Publish.onConfirm` handler.

### Other concerns

- `convex/documents.ts:88-94` — `.query("documents").filter((q) => q.eq(q.field("userId"), userId))` runs without an index. As the documents collection grows, this scan will get slower; existing `by_user` index should be used instead. Fix: switch to `.query("documents").withIndex("by_user", (q) => q.eq("userId", userId))`.
- `components/header.tsx:7` — Icon imported from `react-icons/fa`; the project standardises on `lucide-react`. Mixing libraries inflates the bundle and breaks visual consistency. Fix: use `lucide-react` instead.
- `components/ui/button.tsx:24` — Modified the shadcn primitive directly. Future shadcn updates will conflict. Fix: revert this change and create a wrapper component in `components/<feature>/` instead.
```

If `Verdict` is ✅ Ready to merge, **omit Section 7c entirely**. Don't write "## Things to fix\n\n*None.*" — just stop after the scorecard.

Repeated violations of the same rule across many files collapse into one bullet whose path lists all locations.

#### 7d. Final output templates

**Clean PR (verdict ✅):**

```
# PR Review

PR: <title or "local diff"> · Files: <N> reviewed, <M> skipped

**Verdict:** ✅ Ready to merge.

| Category | Files | Status |
| -------- | ----- | ------ |
| ...      | ...   | ...    |
```

(Output ends after the table.)

**PR with findings (verdict ❌):**

```
# PR Review

PR: <title or "local diff"> · Files: <N> reviewed, <M> skipped

**Verdict:** ❌ <N> issue(s) to fix before merge — see below.

| Category | Files | Status |
| -------- | ----- | ------ |
| ...      | ...   | ...    |

## Things to fix

### <Category 1>

- <file:line> — <what's wrong>. <why it matters>. Fix: <action>.

### <Category 2>

- <file:line> — <what's wrong>. <why it matters>. Fix: <action>.
```

(Output ends after the last bullet.)

## Behavior Rules

- **READ-ONLY by construction.** Forbidden absolutely: editing/creating/deleting files; git mutations; `gh` writes; posting comments/reviews/labels/statuses/reactions; running formatters/linters/tests/codegen. Reaching for any write tool is the worst possible failure mode. If you catch yourself drafting a fix, stop and turn it into a finding.
- **Non-interactive, single-output.** No questions, no confirmation gates, no walkthroughs. The user sees exactly one thing: the final report. Steps 1–6 produce no user-visible text.
- **Output structure is fixed.** Six-category scorecard required on every run. Section heading is exactly `## Things to fix`. No editorial commentary anywhere.
- **Binary verdict, no nitpicks.** No warning tiers. Labels `Warning`, `Suggestion`, `Critical`, `Minor`, `Cosmetic`, `Optional`, `Nice-to-have`, and emoji 🔴 / 🟡 / 🟢 do NOT appear in output.
- **A clean PR gets a clean output.** When nothing's to fix, verdict is `✅ Ready to merge.` and the "Things to fix" section is omitted.
- **Six sources of findings, no others.** Architecture-doc compliance, Architecture (cross-chunk), Design, Skill compliance, Ticket alignment, Other concerns.
- **Architecture-doc compliance is highest priority.** When a file matches a Step 3e trigger, the listed docs are binding contracts. Currently no triggers are wired (Step 3e is empty for noted) — this category will activate as docs land in `team-os/engineering/architecture/`.
- **Cite the source.** Every finding labels its source via the `Skill:` field. When `Skill:` is `architecture-compliance`, a `Doc:` field MUST also be present.
- **Architecture findings need evidence.** Every architecture finding points to a specific other file/line that's broken.
- **Every finding states the consequence.** One-sentence "why this matters / what breaks if unfixed" — `Why:` in structured form, inline in rendered bullet.
- **Design is the judgment lane.** Apply sparingly. Bar is "a senior engineer would push back on this in code review."
- **Read full files.** Use the Read tool on the local working tree. Subagents do the same.
- **Local working tree is the source of truth.** `gh` is only used in Step 2.
- **Refuse to run on a dirty tree.** A dirty tree produces wrong diffs.
- **Don't double the linter.** Skip plain formatting, import order, JSDoc presence.
- **Subagents stay in their lane.** Out-of-scope concerns go to "Cross-chunk concerns".
- **Dedupe before reporting.** Same rule violated in 8 files = one bullet listing 8 locations.
- **No PR comments.** Never call `gh api ... /comments`. The output IS the deliverable.
- **Out of scope, skip it.** If a concern isn't backed by one of the six sources, drop it.
