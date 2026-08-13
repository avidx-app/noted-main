---
name: eslint-self-heal
description: Self-healing loop when ESLint guardrails fail — read the error message, apply the fix recipe, re-run lint until clean on touched files. Use when lint:check fails, noted/no-hardcoded-color or noted/no-inline-style fires, @typescript-eslint/no-explicit-any fires, or the user asks to fix ESLint warnings from the AI playground guardrails. Never disable rules without constitution-level justification.
summary: Fix ESLint guardrail failures in a loop until clean
---

# ESLint self-heal

When a guardrail fails, **fix the code** — do not `eslint-disable`, do not weaken the rule, do not stop until the touched files are clean.

## The loop (mandatory)

```bash
# 1. See failures
npm run lint:check
# or on changed files only:
echo "$CHANGED_TS_FILES" | xargs npx eslint

# 2. Read each error message — it names the skill and the fix
# 3. Apply the matching recipe below
# 4. Re-run lint on the same files
# 5. Repeat until zero errors (and zero new warnings on files you touched)
```

During `/commit`, Step 6 must run this loop automatically when the user says yes to fixing failures.

## Rule recipes

### `noted/no-hardcoded-color`

**Problem:** Hex or rgb in a string (usually `className`).

| Legacy pattern                         | Replace with                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `text-[#3F3F3F]`                       | `text-foreground`                                                            |
| `dark:text-[#CFCFCF]`                  | `dark:text-foreground`                                                       |
| `dark:bg-[#1F1F1F]`                    | `dark:bg-background` (DESIGN.md dark canvas `#0A0A0A`)                       |
| `bg-blue-600` on marketing mockups     | `bg-brand-blue` if token exists, else shadcn `bg-primary`                    |
| Hex in JS config for a third-party API | Import from `@/lib/design-tokens` — only that file may hold API hex literals |

**Steps:**

1. Open `app/globals.css` and pick the semantic token (`foreground`, `background`, `muted`, `brand-blue`).
2. Replace the hard-coded value in `className`.
3. If DESIGN.md needs a new token, add it to `globals.css`, `tailwind.config.ts`, and `DESIGN.md` in the **same PR** (self-healing docs).

### `noted/no-inline-style`

**Problem:** `style={{ ... }}` on JSX.

| Case                                            | Fix                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Fixed width/height                              | Tailwind: `w-[40%]`, `h-full`, `w-2/5`                                                                  |
| Animation delay/duration                        | Arbitrary utilities: `[animation-delay:200ms]`, `[animation-duration:1.4s]`                             |
| Tree indent from `level` prop                   | `getTreeIndentClass(level, basePx)` from `@/lib/tree-indent-class`                                      |
| Radix/shadcn vendored primitive                 | Do not edit `components/ui/` — rule is off there; wrap in a feature component instead                   |
| Truly dynamic value with no Tailwind equivalent | Extract to `lib/<feature>.utils.ts` with a JSDoc explaining why; prefer CSS variables over inline style |

### `@typescript-eslint/no-explicit-any`

**Problem:** `: any`, `as any`, `Array<any>`.

| Instead of        | Use                                               |
| ----------------- | ------------------------------------------------- |
| `any` param       | Proper interface, or `unknown` + narrow           |
| `as any` cast     | Fix the type at source; Zod parse at boundary     |
| Convex row        | `Doc<"tableName">`, `Id<"tableName">`             |
| External JSON     | Zod schema — see `zod-schemas` skill              |
| Test mock partial | `Partial<Props>`, `jest.Mocked<T>`, typed factory |

Read `typescript-patterns` skill — **no exceptions**.

## When docs must update (self-healing docs)

In the **same PR** as the code fix:

| You changed               | Also update                                                     |
| ------------------------- | --------------------------------------------------------------- |
| New canonical pattern     | `team-os/engineering/reference-implementations.md` row          |
| New semantic color token  | `app/globals.css`, `tailwind.config.ts`, `DESIGN.md`            |
| New ESLint rule or recipe | This skill + `reference-implementations.md` ESLint table        |
| New non-negotiable        | `team-os/engineering/constitution.md` + `/noted-review` trigger |

## Escalation (rare)

Only if the rule is genuinely wrong for a case:

1. Document why in the PR description.
2. Propose a rule tweak in `eslint-rules/noted/` with an AI-friendly message — never a file-level disable on product code.
