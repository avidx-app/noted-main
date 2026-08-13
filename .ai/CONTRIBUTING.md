# `.ai/` — Shared agent configuration

This folder is the source of truth for everything Claude Code, Codex, and Cursor pick up automatically when teammates open this repo. We use the `.ai/` convention so a single set of skills and commands works across every agent runtime — `.claude/`, `.cursor/`, and `.agents/` are auto-generated symlinks (see `scripts/sync-ai.mjs`).

## Structure

```
.ai/
├── INSTRUCTIONS.md     project-wide agent instructions (root CLAUDE.md and AGENTS.md symlink to this)
├── CONTRIBUTING.md     this file — what lives where and how to add new assets
├── CREDITS.md          attribution for skills/patterns adapted from public repos
├── skills/             auto-triggering and explicit-invocation skills
└── commands/           explicit slash commands for runtimes that support repo commands
```

## Skills

<!-- auto:skills:start -->

| Skill                    | Purpose                                                |
| ------------------------ | ------------------------------------------------------ |
| `agent-tool-authoring`   | AI Squad / Coworker tool shape and wiring              |
| `api-routes-and-actions` | Convex vs Next.js API route boundaries                 |
| `branch-commit`          | Branch + commit workflow                               |
| `code-quality-checklist` | Pre-commit / pre-PR quality gate                       |
| `commit`                 | Pre-commit quality gate                                |
| `competitive-analysis`   | Competitor teardown                                    |
| `component-composition`  | Split large components, reduce prop drilling           |
| `convex-handlers`        | query / mutation / action selection                    |
| `convex-queries`         | Indexed reads, joins, pagination                       |
| `convex-react-hooks`     | useQuery / useMutation / useAction patterns            |
| `convex-schema`          | defineTable, indexes, additive migrations              |
| `create-pr`              | Open PR to `staging`                                   |
| `date-handling`          | Store numbers, format with date-fns                    |
| `derived-state`          | Derive during render — never sync props via useEffect  |
| `design-diff`            | Compare UI against DESIGN.md                           |
| `design-lint`            | Run design.md linter                                   |
| `design-md`              | DESIGN.md visual contract                              |
| `design-system`          | shadcn + Tailwind tokens                               |
| `effect-to-event`        | Side effects in handlers, not useEffect                |
| `error-handling`         | throw new Error() conventions                          |
| `eslint-self-heal`       | Fix ESLint guardrail failures in a loop until clean    |
| `event-tracking`         | Amplitude event conventions                            |
| `feature-status`         | Feature status from dossier + ship log                 |
| `feature-workflow`       | Interactive feature dev phases                         |
| `file-naming`            | kebab-case files, PascalCase exports                   |
| `grill-me`               | Hard questions on a proposal                           |
| `launch-checklist`       | Pre/post launch checklist                              |
| `market-pulse`           | Market pulse for note-taking + AI space                |
| `market-scan`            | Market scan workflow                                   |
| `metrics-define`         | Define primary, secondary, guardrail, and anti-metrics |
| `metrics-definer`        | Primary/secondary/guardrail metrics                    |
| `nextjs-app-router`      | Server/client components, routing                      |
| `noted-review`           | PR review against skills + constitution                |
| `prd-new`                | Draft a new PRD                                        |
| `prd-writer`             | PRD structure                                          |
| `react-components`       | forwardRef, cva, cn(), no premature memo               |
| `repo-structure`         | Where code lives                                       |
| `ship-log`               | Append ship-log entry                                  |
| `sorting`                | Sort at Convex layer or toSorted() client-side         |
| `speckit.clarify`        | Speckit clarify phase                                  |
| `speckit.implement`      | Speckit implement phase                                |
| `speckit.plan`           | Speckit plan + constitution check                      |
| `speckit.specify`        | Speckit specify phase                                  |
| `speckit.tasks`          | Speckit tasks breakdown                                |
| `state-management`       | Convex for server data, Zustand for UI                 |
| `typescript-patterns`    | Strict types — no `any`                                |
| `unit-testing`           | Jest + RTL patterns                                    |
| `user-research`          | Synthesize research into insights                      |
| `weekly-digest`          | Team weekly digest                                     |
| `worktree`               | Git worktree helper                                    |
| `zod-schemas`            | Zod at HTTP/AI boundaries                              |

<!-- auto:skills:end -->

## Commands

<!-- auto:commands:start -->

| Command              | Purpose                                                         |
| -------------------- | --------------------------------------------------------------- |
| `/branch-commit`     | Branch + commit workflow                                        |
| `/commit`            | Pre-commit quality gate                                         |
| `/create-pr`         | Open PR to `staging`                                            |
| `/design-diff`       | Compare UI against DESIGN.md                                    |
| `/design-lint`       | Run design.md linter                                            |
| `/feature-status`    | Feature status from dossier + ship log                          |
| `/feature-workflow`  | Interactive feature dev phases                                  |
| `/grill-me`          | Hard questions on a proposal                                    |
| `/market-scan`       | Market scan workflow                                            |
| `/metrics-define`    | Define primary, secondary, guardrail, and anti-metrics          |
| `/noted-review`      | PR review against skills + constitution                         |
| `/pm-review`         | Tombstone — never built, points at prd-writer and /noted-review |
| `/prd-new`           | Draft a new PRD                                                 |
| `/ship-log`          | Append ship-log entry                                           |
| `/speckit.clarify`   | Speckit clarify phase                                           |
| `/speckit.implement` | Speckit implement phase                                         |
| `/speckit.plan`      | Speckit plan + constitution check                               |
| `/speckit.specify`   | Speckit specify phase                                           |
| `/speckit.tasks`     | Speckit tasks breakdown                                         |
| `/weekly-digest`     | Team weekly digest                                              |
| `/worktree`          | Git worktree helper                                             |

<!-- auto:commands:end -->

## Runtime parity

- **Claude Code / Cursor**: use repo slash commands from `.ai/commands/` and skills from `.ai/skills/`.
- **Codex**: use skills from `.ai/skills/`. Built-in slash commands are product-level, but repo-local command files are not a reliable invocation surface in Codex today.
- **Rule for parity**: if a workflow should be invokable everywhere, it must exist as a skill. Command files can remain as the canonical slash-command surface for Claude/Cursor, but Codex-compatible same-name skills must exist for command-only workflows.

Examples:

- Claude/Cursor: `/noted-review`, `/create-pr`, `/worktree`
- Codex: `$noted-review`, `$create-pr`, `$worktree`

## How it gets to each runtime

`scripts/sync-ai.mjs` — runs automatically after `npm install` (postinstall hook), and can be run manually with `npm run sync-ai`. It materializes `.ai/skills/` and `.ai/commands/` as symlinks at:

- `.claude/skills/` and `.claude/commands/` (Claude Code)
- `.cursor/skills/` and `.cursor/commands/` (Cursor)
- `.agents/skills/` and `.agents/commands/` (Codex)

It also creates root-level `CLAUDE.md` and `AGENTS.md` as symlinks to `.ai/INSTRUCTIONS.md`. All symlink targets are gitignored — only `.ai/` is tracked.

## When to use which

- **Skill** — you're in the middle of a task (writing a PRD, defining metrics, summarizing a market scan) and want the agent to follow a team-agreed structure automatically. Triggered by phrasing.
- **Command** — you want to run a named workflow explicitly (`/prd-new`, `/ship-log`, `/noted-review`). This is the repo-local slash-command surface for Claude Code and Cursor.
- **Command-mirror skill** — same workflow, but invokable in Codex as `$name` when repo slash commands are unavailable there.
- **`INSTRUCTIONS.md`** — passive context. Loaded every session so the agent knows the map.
- **Reference implementations** — [team-os/engineering/reference-implementations.md](../team-os/engineering/reference-implementations.md) — canonical code to copy, not prose alone.

## Adding a new skill

1. Create `.ai/skills/<name>/SKILL.md` with frontmatter: `name`, `description`, optional `trigger` patterns.
2. Add a row to [reference-implementations.md](../team-os/engineering/reference-implementations.md) if the skill introduces a pattern agents should copy from real code.
3. If it's credit-worthy (adapted from a public repo), add a line to `CREDITS.md`.
4. Run `npm run sync-ai` to materialize it across runtimes.
5. Open a PR. `.ai/` ownership follows the same merge policy as the rest of the repo (see `INSTRUCTIONS.md`).

## Adding a new command

1. Create `.ai/commands/<name>.md` with a clear "Instructions" section.
2. If there is no same-name skill already, create `.ai/skills/<name>/SKILL.md` as the Codex-compatible mirror. The skill should point to the command file as the source of truth and explicitly trigger on `/<name>` and `$<name>`.
3. Run `npm run sync-ai`.
4. Test it by typing `/<name>` in Claude Code and Cursor, and `$<name>` in Codex.

## Deterministic enforcement

Skills alone are not enough — pair new non-negotiables with:

- A row in [team-os/engineering/constitution.md](../team-os/engineering/constitution.md)
- A custom ESLint rule in `eslint-rules/noted/` with an AI-friendly error message (see [reference-implementations.md](../team-os/engineering/reference-implementations.md#eslint-guardrails-deterministic))
- A check in `/noted-review` if the rule is not automatable
