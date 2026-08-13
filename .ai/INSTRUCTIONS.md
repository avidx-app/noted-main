# Noted

Collaborative, AI-native note-taking app (Notion-style) by avidx-app. This repo holds both the **code** that ships the product and the **Team OS** — a shared knowledge base every team member (engineering, product, design, customer service, leadership) reads, queries, and contributes to.

> This file is the source of truth for project-wide agent instructions. Root `CLAUDE.md` and `AGENTS.md` are auto-generated symlinks pointing here. Run `npm run sync-ai` to (re)materialize the symlinks across `.claude/`, `.cursor/`, and `.agents/`.

## Doc index

| Area                          | Path                                                                                                 | What lives here                                                                                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Team OS**                   | [team-os/](team-os/)                                                                                 | PRDs, feature dossiers, research, metrics, support knowledge, team rituals                                                                                                             |
| **Feature dossiers**          | [team-os/features/](team-os/features/)                                                               | One folder per live feature — status, FAQ, talking points, linked artifacts                                                                                                            |
| **Feature index**             | [team-os/feature-index.yaml](team-os/feature-index.yaml)                                             | Master map: every feature → dossier, code paths, owners, ship log                                                                                                                      |
| **Code**                      | `app/` `components/` `convex/` `hooks/` `lib/`                                                       | Next.js App Router frontend + Convex backend                                                                                                                                           |
| **Tech stack**                | [TECH_STACK.md](TECH_STACK.md)                                                                       | What each dependency does and where it's wired                                                                                                                                         |
| **Deployment**                | [DEPLOYMENT.md](DEPLOYMENT.md)                                                                       | How the app ships, env setup                                                                                                                                                           |
| **Setup**                     | [README.md](README.md)                                                                               | Local dev instructions                                                                                                                                                                 |
| **Agent config**              | [.ai/CONTRIBUTING.md](.ai/CONTRIBUTING.md)                                                           | Skills, slash commands, and how to add new ones                                                                                                                                        |
| **Reference implementations** | [team-os/engineering/reference-implementations.md](team-os/engineering/reference-implementations.md) | Canonical code paths for every enforced pattern                                                                                                                                        |
| **PM course**                 | [pm-course/](pm-course/)                                                                             | Onboarding simulation for a new PM. **Read [pm-course/CLAUDE.md](pm-course/CLAUDE.md) before working in there** — it sets a role-play frame and one hard limit on constructed evidence |
| **Claude playbook**           | [team-os/team/claude-playbook.md](team-os/team/claude-playbook.md)                                   | How we use Claude products (Chat, Cowork, Code, Design, Routines)                                                                                                                      |

## Team

See [team-os/ROSTER.md](team-os/ROSTER.md).

## Rules of the road

- **Cross-functional by default.** Non-engineers are first-class contributors to `team-os/`. If you're not sure where something goes, read [team-os/CONTRIBUTING.md](team-os/CONTRIBUTING.md).
- **Feature not "done" until team-os updated.** When a PR merges to `main`, append an entry to the feature's `ship-log.md` (PR link, merge date, coverage delta, deploy status). Use `/ship-log` to automate.
- **Prefer reading a folder's CLAUDE.md before opening files.** Nested CLAUDE.md files are navigation maps — they save everyone tokens and time.
- **When switching tasks, `/clear` first.** Leftover context pollutes results.
- **Never fabricate data, quotes, or metrics.** Flag gaps with `[NEED: data from X]`.

## Connected tools (MCP)

[`.mcp.json`](.mcp.json) declares two remote servers. Both are hosted, both authenticate per person
over OAuth on first use, and neither stores a credential in this repo. Your client will ask you to
approve them the first time you open the project.

| Server   | Used by                                                                                                   | If you do not have it                                                                                                                                                                                                                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `linear` | `/feature-workflow` Phase 0, every `/speckit.*`, `/worktree`, `/commit`, `/noted-review` ticket alignment | Work ticketless. `/speckit.specify --explore` drafts against an `EXP-N` id with no ticket required, and branches become `explore/EXP-N-<slug>`. Every other command must **say in its output** that ticket alignment was skipped rather than silently passing that check.                                                                                  |
| `notion` | `/feature-workflow` Phase 0 user grounding (the Customer Understanding OS)                                | Read [`team-os/research/`](team-os/research/) instead — personas, pain landscape and interview evidence live there for any feature that has been grounded. If the feature you are working on has no grounding there, Phase 0's stop rule applies: **no quote, no grounding, stop.** Do not substitute the model's general knowledge for customer evidence. |

The fallbacks are not second-class paths — most contributors will run this way. What is not
acceptable is a command that needs evidence, cannot reach it, and proceeds as though it could.

## AI playground (self-healing loop)

This repo is set up so humans and agents can ship compliant PRs without engineer babysitting. The loop:

1. **Skills + reference code** — follow `.ai/skills/`; copy patterns from [reference-implementations.md](team-os/engineering/reference-implementations.md).
2. **Deterministic guardrails** — CI runs Prettier, TypeScript, ESLint (including custom `noted/*` rules), tests, and build. Warnings on legacy debt ratchet to errors over time.
3. **Code self-healing** — when ESLint or CI fails, read the error message, apply the fix from [eslint-self-heal](.ai/skills/eslint-self-heal/SKILL.md), re-run lint, and **loop until clean** on every file you touched. Never `eslint-disable` on product code.
4. **Before opening a PR** — run `/noted-review` in Claude/Cursor or `$noted-review` in Codex, then follow the [code-quality-checklist](.ai/skills/code-quality-checklist/SKILL.md).
5. **Self-healing docs** — when you change code in an area covered by a skill or architecture doc, update that doc in the **same PR** if the change extends or contradicts the documented pattern. Update `reference-implementations.md` when you establish a new canonical example.

GitHub posts an [AI playground checklist](.github/pull_request_template.md) on every new PR. Non-engineers: ask the agent to _"address all items in the AI playground checklist."_

## Code conventions (all agents)

- **File naming**: kebab-case for files and directories (e.g., `coworker-message.tsx`).
- **Component exports**: PascalCase for React components.
- **Framework**: Next.js App Router (v16). Default to Server Components; use `'use client'` only for client hooks and browser APIs.
- **Styling**: Tailwind CSS + shadcn/ui. Reuse components from `components/ui/` before building custom ones. Avoid inline styles.
- **Tests**: Colocated (`foo.tsx` next to `foo.test.tsx`). Jest + React Testing Library. Mock Clerk and Convex at test top.
- **Coverage**: maintain >50% frontend coverage (`npm run test:coverage`).
- **Setup**: `npm install` → `npm run dev` (with `npx convex dev` in a second terminal). `npm install` also runs `npm run sync-ai`, which materializes `.ai/skills/` and `.ai/commands/` as symlinks under `.claude/`, `.cursor/`, and `.agents/`. Re-run manually with `npm run sync-ai` if you add or rename a skill/command without reinstalling.

## Merge policy

- `team-os/**` — PRs can be opened and merged by any teammate with write access. See `.github/CODEOWNERS`.
- Everything else — PRs require approval from `@avidx-app`.
- All merges go through PRs. Branch flow: feature → `staging` → `main`.
