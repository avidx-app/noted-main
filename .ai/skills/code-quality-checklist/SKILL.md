---
name: code-quality-checklist
description: Pre-commit quality checklist covering formatting, linting, type checking, testing, and DRY compliance. Use when user asks to "check code quality", "verify before commit", "run the checklist", or "make sure everything passes". Also use before completing any coding task to verify new Convex handlers, hooks, components, and shared utilities follow conventions and have proper tests.
summary: Pre-commit / pre-PR quality gate
---

<!--
Adapted from heatseeker-next/.ai/skills/code-quality-checklist/SKILL.md
Noted-specific adjustments: npm scripts (not pnpm), Convex-specific checks,
removed TanStack/API-handler/design-tokens sections that don't apply here.
-->

# Code Quality Checklist

## Before Committing

Run all four. All must pass before opening a PR. CI runs the same gate (`format:check` instead of `format` — no file writes in CI).

```bash
npm run format          # Prettier (writes fixes locally)
npm run lint:fix        # ESLint (autofix)
npm run type:check      # TypeScript compilation
npm run test            # Jest
```

CI parity check (no writes — scoped to playground infra until repo-wide Prettier lands):

```bash
npm run format:check && npm run test:eslint-rules && npm run lint:check && npm run type:check && npm run test:coverage
```

Full-repo format check (will fail until legacy files are formatted):

```bash
npm run format:check:repo
```

One-liner (local pre-commit):

```bash
npm run format && npm run lint:fix && npm run type:check && npm run test
```

## Before Opening a PR

After the quality gate passes:

1. Run **`/noted-review`** — compliance review against all skills and the [engineering constitution](../../team-os/engineering/constitution.md).
2. Fill in the [PR template](../../.github/pull_request_template.md) — GitHub also posts an AI playground checklist comment automatically.
3. Copy patterns from [reference-implementations.md](../../team-os/engineering/reference-implementations.md), not from memory.

Custom ESLint rules in `eslint-rules/noted/` enforce design tokens and `no-explicit-any` (warn today, error after legacy cleanup). When a rule fires, run the [eslint-self-heal](../eslint-self-heal/SKILL.md) loop until changed files are clean — never disable rules on product code.

## Required for New Code

### New shared utilities (in `lib/`)

- [ ] Unit tests written and colocated (`foo.ts` next to `foo.test.ts`)
- [ ] Edge cases covered (null, undefined, empty arrays, malformed input)
- [ ] JSDoc comments on exported functions
- [ ] Consumed via `@/lib/...` import alias

### New Convex handlers (`convex/*.ts`)

- [ ] Auth check at the top of every mutation/action that touches user data: `const identity = await ctx.auth.getUserIdentity(); if (!identity) throw new Error("Not authenticated");`
- [ ] Ownership check before reads/writes on user-scoped tables: `if (existing.userId !== identity.subject) throw new Error("Not authorized");`
- [ ] Uses an index (`.withIndex(...)`) — not `.filter(...)` — when querying by an indexed field
- [ ] If the schema changed, the corresponding `defineTable` and indexes are updated in `convex/schema.ts`
- [ ] If the change is breaking for clients, surfaced in the PR description

### New hooks (`hooks/`)

- [ ] Named `use-<thing>.tsx` (kebab-case)
- [ ] Colocated test if there's any logic worth testing
- [ ] Uses Convex's reactive `useQuery` for server data — never `fetch` inside `useEffect`
- [ ] Uses Zustand only for UI state, never for server data

### New components (`components/`)

- [ ] Named `kebab-case.tsx`, exported as PascalCase
- [ ] Server Component by default; only adds `"use client"` if it actually uses hooks or browser APIs
- [ ] Reuses primitives from `components/ui/` before building custom
- [ ] No `any`. No type assertions (`as`) without justification
- [ ] No derived state in `useEffect` (see `derived-state` skill)
- [ ] No interaction logic in `useEffect` (see `effect-to-event` skill)

### New tests

- [ ] Mock Clerk and Convex at the top of any test that imports a component touching them
- [ ] One `describe` per function/component under test
- [ ] Each `it()` tests a distinct behavior, not the same behavior with different values
- [ ] No logic in tests (no loops, no conditionals)
- [ ] See the `unit-testing` skill for the full bar

### Coverage

- [ ] On any file you touched, total line coverage stays ≥ 50% (`npm run test:coverage`)
- [ ] Coverage applies to `components/**`, `lib/**`, `app/**` per `jest.config.ts` — `components/ui/**` is intentionally excluded

## Cleanup Checks

- [ ] No commented-out code
- [ ] No `TODO` without a Linear ticket reference (`NOT-XXXX`)
- [ ] No magic values — extract to a named constant
- [ ] No duplicate logic — if it appears 2+ places, extract to `lib/`

## DRY Checklist

Before writing new code:

1. Search `lib/` for similar utility
2. Search `hooks/` for similar hook
3. If logic appears 2+ places → extract to `lib/` (or `hooks/` for stateful)

## Common Issues

| Issue                                                       | Fix                                                                                    |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Prettier CI failure                                         | `npm run format` locally, then `npm run format:check` to verify                        |
| ESLint `noted/no-hardcoded-color`                           | Replace hex/rgb with Tailwind tokens — see `design-system` and `eslint-self-heal`      |
| ESLint `noted/no-inline-style`                              | Tailwind utilities or `getTreeIndentClass` — see `eslint-self-heal`                    |
| ESLint `@typescript-eslint/no-explicit-any`                 | Use `unknown`, Zod, `Doc<>`, `Id<>` — see `typescript-patterns` and `eslint-self-heal` |
| Type errors                                                 | `npm run type:check` and read the message — usually missing import or wrong arg type   |
| Convex handler crashes after deploy                         | Schema change without re-running `npx convex dev` to push it                           |
| Test fails with "useUser" or "useQuery" undefined           | Missing Clerk/Convex mock at top of test file                                          |
| Symlinks broken (CLAUDE.md missing on a teammate's machine) | `npm run sync-ai`                                                                      |

## Branch Flow Reminder

Branch naming: `feature/NOT-XXXX-short-slug`. Branches merge **into `staging` first**, never directly into `main`. See `INSTRUCTIONS.md` for the merge policy.

## Quick Commands

```bash
# Full check before commit
npm run format && npm run lint:fix && npm run type:check && npm run test

# Format + types only (faster smoke-test during dev)
npm run format && npm run type:check

# Coverage
npm run test:coverage
```
