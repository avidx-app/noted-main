---
type: reference
last_updated: 2026-05-26
---

# Reference implementations

Canonical code paths for patterns enforced by `.ai/skills/`, `/noted-review`, and custom ESLint rules. When adding a feature, **copy the closest row** — do not invent a parallel pattern.

When you change one of these files in a way that establishes a new pattern, update the linked skill and this table in the same PR (self-healing docs).

| Pattern                                              | Canonical file(s)                                                         | Skill / command                                                                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Convex auth → existence → ownership → validation     | `convex/documents.ts` (mutations), `convex/files.ts`                      | [convex-handlers](../../.ai/skills/convex-handlers/SKILL.md), [error-handling](../../.ai/skills/error-handling/SKILL.md)                 |
| Convex indexed query + in-handler join               | `convex/files.ts:get`                                                     | [convex-queries](../../.ai/skills/convex-queries/SKILL.md)                                                                               |
| Convex action calling external HTTP / AI SDK         | `convex/aiSettingsActions.ts`                                             | [convex-handlers](../../.ai/skills/convex-handlers/SKILL.md), [api-routes-and-actions](../../.ai/skills/api-routes-and-actions/SKILL.md) |
| Schema + index design                                | `convex/schema.ts`                                                        | [convex-schema](../../.ai/skills/convex-schema/SKILL.md)                                                                                 |
| Client reactive read (`useQuery`)                    | `hooks/use-search.tsx`, `app/(main)/_components/navigation.tsx`           | [convex-react-hooks](../../.ai/skills/convex-react-hooks/SKILL.md)                                                                       |
| Zustand for UI-only shared state                     | `hooks/use-origin.tsx`                                                    | [state-management](../../.ai/skills/state-management/SKILL.md)                                                                           |
| React component (Server default, client when needed) | `components/coworker/coworker-message.tsx` (structure — not type quality) | [react-components](../../.ai/skills/react-components/SKILL.md), [component-composition](../../.ai/skills/component-composition/SKILL.md) |
| Design tokens + shadcn wrapping                      | `app/globals.css`, `components/ui/button.tsx` (wrap, don't edit)          | [design-system](../../.ai/skills/design-system/SKILL.md), [DESIGN.md](../../DESIGN.md)                                                   |
| API hex literals (BlockNote, charts)                 | `lib/design-tokens.ts`                                                    | [eslint-self-heal](../../.ai/skills/eslint-self-heal/SKILL.md)                                                                           |
| BlockNote JSON parsing                               | `lib/blocknote-content.ts`                                                | [eslint-self-heal](../../.ai/skills/eslint-self-heal/SKILL.md)                                                                           |
| Coworker markdown + tool labels                      | `lib/coworker-message-ui.tsx`                                             | [eslint-self-heal](../../.ai/skills/eslint-self-heal/SKILL.md)                                                                           |
| Tree row indent (no inline padding)                  | `lib/tree-indent-class.ts` → `app/(main)/_components/item.tsx`            | [eslint-self-heal](../../.ai/skills/eslint-self-heal/SKILL.md)                                                                           |
| AI agent tool factory                                | `lib/agent/tools/workspace.ts`                                            | [agent-tool-authoring](../../.ai/skills/agent-tool-authoring/SKILL.md)                                                                   |
| AI streaming API route                               | `app/api/ai/coworker/route.ts`                                            | [api-routes-and-actions](../../.ai/skills/api-routes-and-actions/SKILL.md)                                                               |
| Zod at HTTP boundary                                 | `app/api/ai/coworker/route.ts` (request body parse)                       | [zod-schemas](../../.ai/skills/zod-schemas/SKILL.md)                                                                                     |
| Unit test (utility)                                  | `lib/utils.test.ts`                                                       | [unit-testing](../../.ai/skills/unit-testing/SKILL.md)                                                                                   |
| Unit test (hook)                                     | `hooks/use-search.test.tsx`                                               | [unit-testing](../../.ai/skills/unit-testing/SKILL.md)                                                                                   |
| Date formatting at render site                       | grep `formatDistanceToNow` in `components/`                               | [date-handling](../../.ai/skills/date-handling/SKILL.md)                                                                                 |
| Feature ship log entry                               | `team-os/features/*/ship-log.md`                                          | [ship-log](../../.ai/skills/ship-log/SKILL.md)                                                                                           |
| PR compliance review                                 | —                                                                         | [/noted-review](../../.ai/commands/noted-review.md)                                                                                      |
| Pre-commit quality gate                              | —                                                                         | [code-quality-checklist](../../.ai/skills/code-quality-checklist/SKILL.md)                                                               |

## ESLint guardrails (deterministic)

Custom rules in `eslint-rules/noted/` enforce patterns that skills alone cannot guarantee:

| Rule                                 | What it catches                                                                                                               | Fix guidance                                                                                                                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `noted/no-hardcoded-color`           | Hex / rgb / literal hsl in strings (e.g. `text-[#3F3F3F]`), plus off-palette Tailwind hues (`text-sky-500`, `bg-emerald-100`) | Use Tailwind tokens from `app/globals.css` — see design-system skill and DESIGN.md § Off-palette hues (error; legacy uses carry a per-path allowlist in `eslint.config.mjs` that ratchets to zero) |
| `noted/no-inline-style`              | `style={{…}}` on JSX                                                                                                          | Use Tailwind classes; see design-system skill                                                                                                                                                      |
| `@typescript-eslint/no-explicit-any` | `: any`, `as any`                                                                                                             | Use `unknown`, Zod, `Doc<>`, `Id<>` — see typescript-patterns skill (warn today, error after cleanup)                                                                                              |

## Code self-healing loop

When any rule above fires:

1. Read the ESLint message (it names the skill).
2. Open [eslint-self-heal](../../.ai/skills/eslint-self-heal/SKILL.md) and apply the matching recipe.
3. Re-run `npm run lint:check` (or `npx eslint <file>`).
4. Repeat until clean on every file you touched.
5. Update this doc if you introduced a new canonical fix pattern.

`/commit` and the [code-quality-checklist](../../.ai/skills/code-quality-checklist/SKILL.md) embed the same loop automatically.

## Architecture docs (planned)

As cross-cutting architecture docs land in `team-os/engineering/architecture/`, they become binding contracts checked first by `/noted-review`. Add a row here when each doc ships.
