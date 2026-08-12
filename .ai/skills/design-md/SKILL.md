---
name: design-md
description: Visual-identity contract for noted-main, codified in DESIGN.md per the google-labs-code/design.md spec. Use when adding/modifying colors, typography, spacing, radii, or component styles; when designing a new component variant; when building marketing surfaces; when reviewing UI changes against the brand. Applies implicitly whenever a change touches `components/`, `app/(landing)/`, `app/globals.css`, `tailwind.config.ts`, or any Tailwind class affecting visual presentation — DESIGN.md must stay in sync.
summary: DESIGN.md visual contract
---

<!--
Adapted from the design.md spec at https://github.com/google-labs-code/design.md
Apache-2.0 licensed. Spec is at version 'alpha'; expect changes as it matures.

Noted-specific adaptation:
- Token extraction from app/globals.css (shadcn HSL custom properties)
  + Tailwind brand accent classes used on the landing
- Component tokens limited to shadcn variants we actually ship
- Known lint warnings documented in DESIGN.md itself (orphan dark
  counterparts, orphan shadcn primitives, button-destructive contrast)
- Wired into /noted-review as a binding-contract trigger for
  components/** files (Step 3e of that command)
-->

# DESIGN.md — Visual Identity Contract

Noted's visual identity lives at the repo root in `DESIGN.md`. It's a single file with two layers:

1. **YAML front matter** — machine-readable design tokens (colors, typography, rounded, spacing, components). The normative values.
2. **Markdown body** — human-readable rationale: when to use which token, what the brand means, do's and don'ts.

`DESIGN.md` is a **binding contract**, not advisory reading. It governs every visual change in the codebase. When you add a feature that affects pixels, you update DESIGN.md in the same PR — or `/noted-review` flags the drift.

## When this skill applies

- Adding or modifying a color, typography style, radius, or spacing value
- Building a new component or component variant
- Designing a marketing surface (landing page, learn-more pages)
- Choosing whether to use the neutral shell vs. brand accent
- Reviewing UI changes against the visual contract
- Implicitly: any PR that touches `components/`, `app/(landing)/`, `app/globals.css`, `tailwind.config.ts`, or Tailwind classes affecting pixels

## The three-layer rule

When you make a visual change, three things must stay in sync:

1. **The code change** itself (Tailwind classes, CSS, new component variants in `components/ui/<thing>.tsx`).
2. **`app/globals.css`** if the change introduces or modifies a CSS custom property (`--background`, `--primary`, etc.).
3. **`DESIGN.md`** — token added/updated in YAML front matter, rationale added/updated in markdown body.

Skipping (3) is the most common drift. The lint catches some of it (broken refs, orphan tokens, contrast); the `/noted-review` binding-contract check catches the rest.

## Picking the right token

### Color

| Surface | Use |
|---|---|
| Default text | `colors.foreground` |
| Default background | `colors.background` |
| Default button | `components.button-default` (which uses `colors.primary`) |
| Secondary button | `components.button-secondary` |
| Subtle hover/muted area | `colors.secondary` or `colors.muted` |
| Caption / metadata text | `colors.muted-foreground` (note: ≥4.5:1 only on light bg) |
| Border / divider | `colors.border` |
| Destructive action | `colors.destructive` (button), `colors.destructive-foreground` (text on it) |
| Primary marketing CTA | `colors.brand-blue` (the only marketing-only token) |
| AI affordance ("AI is doing X") | `colors.brand-blue` for surfaces; `colors.brand-violet` paired in gradients sparingly |
| Anything else | **Stop and reconsider.** New tokens earn their place. |

### Typography

| Need | Use |
|---|---|
| Document title in editor | `typography.h1` |
| Section heading in long-form content | `typography.h2`, `typography.h3` |
| Landing hero | `typography.display` |
| Body in editor / app | `typography.body` |
| Marketing prose (landing page) | `typography.body-lg` |
| UI labels, button text, sidebar | `typography.body-sm` |
| Captions, timestamps, helper text | `typography.caption` |
| Code blocks, file paths, AI tool args | `typography.mono` |

If your need doesn't map to one of these, **don't add a new token for one feature.** Reuse `body`, `body-sm`, or `caption` and let the design system stay coherent.

### Radii and spacing

- Radii: `rounded.sm` (4px) for buttons/badges, `rounded.md` (6px) for inputs/small cards, `rounded.lg` (8px) for large cards/marketing CTA, `rounded.xl` (12px) for feature surfaces, `rounded.full` for pills/avatars.
- Spacing: 8-px rhythm (`xs` 4 / `sm` 8 / `md` 16 / `lg` 24 / `xl` 32 / `2xl` 48). Values that don't snap to this are findings.

## Adding a new component variant

1. **Decide if it's actually new.** Check `components/ui/<primitive>.tsx` for an existing variant that fits. Most new "looks" are existing variants you missed.
2. **Add it via `cva`** in `components/ui/<primitive>.tsx`, not as inline Tailwind utilities in a feature component. Variants are how the design system stays coherent.
3. **Document it in DESIGN.md.** Add a new component entry under the `components:` YAML block:

    ```yaml
    components:
      button-cta-secondary:
        backgroundColor: "{colors.brand-violet}"
        textColor: "{colors.primary-foreground}"
        rounded: "{rounded.lg}"
        height: 48px
        padding: "0 32px"
    ```

4. **Run the lint:** `npm run design:lint`. Fix any new findings before merge.

## Adding a new color or typography token

This is rarer than adding a component variant. When in doubt, don't.

If you must:

1. **Justify it in the PR description.** What surface needs this token? What existing token did you try first and why doesn't it fit?
2. **Add both light and dark counterparts.** Every neutral and brand color has both modes.
3. **Wire it through `app/globals.css`** as a CSS custom property if it's part of the shell.
4. **Update DESIGN.md** YAML and add a paragraph in the appropriate section explaining when to use it.
5. **Run the lint and the `/noted-review`.** Both should pass.

## Anti-patterns

```typescript
// ❌ inline hex in className — breaks the contract
<button className="bg-[#2563EB] text-white">Save</button>

// ❌ inline style with raw hex
<div style={{ backgroundColor: '#F5F5F5' }}>...</div>

// ❌ branding outside the AI / marketing-CTA scope
<aside className="bg-blue-600 text-white p-4">Info panel</aside>

// ❌ adding a new typography size for one feature
<h2 className="text-[2.125rem] font-bold">Special Section</h2>

// ❌ box-shadow on a permanent surface
<div className="bg-card shadow-xl rounded-lg p-6">Settings card</div>


// ✅ shadcn primitive + token
<Button>Save</Button>

// ✅ branding where it belongs — primary marketing CTA
<Button variant="cta" asChild><Link href="/sign-up">Get started</Link></Button>

// ✅ neutral surface for an info panel
<aside className="bg-muted text-muted-foreground p-4 border rounded-lg">Info</aside>

// ✅ existing typography
<h2 className="text-3xl font-semibold tracking-tight">Special Section</h2>

// ✅ border, not shadow, on a permanent surface
<div className="bg-card border rounded-lg p-6">Settings card</div>
```

## CLI reference

The design.md CLI runs via `npx`:

```bash
# Validate DESIGN.md against the spec (WCAG, broken refs, structural)
npm run design:lint

# Diff two versions (e.g., before/after a UI refactor)
npx @google/design.md diff DESIGN.md DESIGN-old.md

# Export tokens to Tailwind v3 / v4 / DTCG (when we want to drive
# tailwind.config.ts FROM DESIGN.md instead of the other way around)
npx @google/design.md export --format css-tailwind DESIGN.md > theme.css
npx @google/design.md export --format json-tailwind DESIGN.md > tailwind.theme.json
npx @google/design.md export --format dtcg DESIGN.md > tokens.json
```

## Known warnings — don't try to "fix" these

`npm run design:lint` emits ~24 warnings against the current DESIGN.md. They are **intentional** and documented in DESIGN.md's "Known lint warnings" section. The categories:

- Orphan dark-mode tokens (spec at `alpha` doesn't yet wire dark variants through components)
- Orphan core shadcn tokens (`popover`, `accent`, `border`, `input`, `ring`) consumed by shadcn primitives directly via Tailwind, not through component entries
- `button-destructive` contrast 3.61:1 (matches shadcn's default; documented as a known gap)

If a NEW warning appears that isn't one of these categories, it's a real finding — wire the token through to a component or remove it.

## Checklist before merging a UI-touching PR

- [ ] `npm run design:lint` passes (no new errors; no new warnings outside the documented categories)
- [ ] If a new color / typography / radii / spacing token was added: light **and** dark counterparts both present, rationale in the markdown body, mode shown in PR description
- [ ] If a new component variant was added: defined in `components/ui/<primitive>.tsx` via `cva`, documented in DESIGN.md `components:`
- [ ] Inline hex / rgb / hsl: zero
- [ ] Brand-blue / brand-violet usage: scoped to AI affordances or marketing CTAs (not general UI)
- [ ] Dark mode tested for any new background-on-foreground combination
- [ ] `/noted-review` run on the diff — DESIGN.md compliance findings addressed
