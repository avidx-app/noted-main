<!--
  This file is read by /speckit.plan's Constitution Check.

  The ratified noted constitution lives at team-os/engineering/constitution.md.
  This file mirrors a condensed version below for the Constitution Check, but
  the full text — including governance, skill cross-references, and rationale —
  is at team-os/engineering/constitution.md. When the cohort version supersedes
  the current one in Module 4 of the Vibe PM course, both files update together.
-->

# Noted Engineering Constitution (condensed for Constitution Check)

**Full version**: [`team-os/engineering/constitution.md`](../../team-os/engineering/constitution.md)

The principles below are NON-NEGOTIABLE. `/speckit.plan`'s Constitution Check fails any plan that would violate them without a documented Complexity-Tracking justification.

1. **Convex separation.** Queries are reactive reads, mutations are transactional writes, actions are non-reactive (HTTP/AI/EdgeStore). Never mix.
2. **Auth → existence → ownership → validation.** Every Convex handler that touches user data runs the four checks in this order, top of the function, before any business logic.
3. **Errors are thrown, not returned.** Use `throw new Error(message)` with the conventional vocabulary. No `{ success: false, error }` returns.
4. **No `any`.** Use `unknown` + type guards, Zod, generics, or Convex's `Doc<>`/`Id<>` branded types.
5. **No derived state in `useEffect`.** Compute during render. Never sync `useQuery` results into local state.
6. **Interaction logic in handlers, not effects.** Side effects from user actions go in `onClick`/`onSubmit`/`onChange`/mutation callbacks.
7. **Convex `useQuery` is the only client reactive read.** No `fetch` in `useEffect` for Convex data. No TanStack Query.
8. **Linear ticket linkage.** Branches: `feature/not-XXX-slug`. PRs target `staging`. PR descriptions end with `Closes NOT-XXX`.
9. **Quality gates pass before merge.** `npm run format && npm run lint:fix && npm run type:check && npm run test`. Coverage ≥ 50% on touched files.
10. **File naming.** kebab-case files, PascalCase component exports, camelCase Convex modules.
11. **Server Components by default.** Add `'use client'` only when needed.
12. **shadcn primitives are read-only.** Do not modify `components/ui/`. Wrap in `components/<feature>/`.
13. **AI feature surface conventions.** AI prompts in `lib/agent/prompts/`, tools in `lib/agent/tools/`, persistence in `convex/`. Conversation contents never logged, tracked, or pasted.
14. **team-os reflex.** Feature dossier + `ship-log.md` entry + `feature-index.yaml` updated before a feature is "done."
15. **Analytics: track decisions, not clicks.** See the `event-tracking` skill.
16. **Visual identity contract (DESIGN.md).** Every PR that touches pixels updates `DESIGN.md` in the same commit. Brand accents scoped to AI/CTA only. shadcn primitives are read-only (wrap, don't edit). New tokens require both light and dark counterparts. `npm run design:lint` and `/noted-review`'s DESIGN.md binding-contract trigger enforce.
17. **Maps and generated indexes are checked, not trusted.** The `.ai/CONTRIBUTING.md` skill and command tables are generated from each asset's `summary:` frontmatter — never hand-edited between the `auto:` markers. Every markdown link and YAML path in the Team OS maps must resolve, or be declared absent in the row or in `team-os/INTENTIONAL-GAPS.md`. `npm run check:drift` enforces both, in CI and pre-commit.

For governance, the full rationale, and skill cross-references, read [`team-os/engineering/constitution.md`](../../team-os/engineering/constitution.md).
