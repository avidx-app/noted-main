---
name: design-system
description: Design system and styling rules for noted-main — shadcn primitives in `components/ui/` (do not modify), HSL CSS custom properties in `app/globals.css` mapped to Tailwind in `tailwind.config.ts`, the `brand-blue` / `brand-violet` AI/marketing accent layer, dark mode via `next-themes`, and the strict "everything new must round-trip through DESIGN.md" rule. Use when adding any UI component, picking a color, building a form, choosing icon/typography, or wrapping a primitive. Applies implicitly whenever building any frontend.
summary: shadcn + Tailwind tokens
---

<!--
Adapted from heatseeker-next/.ai/skills/design-system/SKILL.md
Major adaptations:
- Heatseeker has a design-tokens skill + token files; noted has shadcn's
  HSL custom properties in app/globals.css and the DESIGN.md doc as the
  visual contract (Constitution §XVI). Different shape, same intent.
- Drop heatseeker-specific primitives. Anchor on the actual primitives
  shipped under noted's components/ui/ (button, dialog, popover, etc.)
- Brand accents in noted are 'brand-blue' (CTA / AI surfaces) and
  'brand-violet' (secondary AI/marketing). Document where each is used.
-->

# Design System

Noted's UI is built on three layers that you should be able to name without thinking:

1. **CSS custom properties** in `app/globals.css` — HSL triples for `--background`, `--foreground`, `--primary`, etc., with a `:root` (light) and `.dark` scope. This is the source of truth for color.
2. **Tailwind tokens** in `tailwind.config.ts` — utility classes (`bg-primary`, `text-foreground`, `border-input`) that read those custom properties via `hsl(var(--<name>))`. This is what you write in JSX.
3. **shadcn primitives** in `components/ui/` — `Button`, `Dialog`, `Popover`, `DropdownMenu`, etc., styled with the Tailwind tokens via `cva`. This is what you compose.

Plus a fourth, separate layer: `DESIGN.md` at the repo root — the human-readable visual contract that names every color, typography token, layout rule, and component variant. **Anything new must show up here as well as in code.** (Constitution §XVI; see the `design-md` skill.)

## The color palette (semantic, not literal)

You almost never write a color value directly — you write a token:

| Token                                            | When to use                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `bg-background` / `text-foreground`              | The default page background and primary text                        |
| `bg-primary` / `text-primary-foreground`         | Default-variant button, primary CTA on light surfaces               |
| `bg-secondary` / `text-secondary-foreground`     | Soft button background, sidebar items                               |
| `bg-muted` / `text-muted-foreground`             | Subdued surfaces, secondary copy, skeleton placeholders             |
| `bg-accent` / `text-accent-foreground`           | Hover states on ghost buttons, dropdown highlights                  |
| `bg-card` / `text-card-foreground`               | Raised surfaces — modals, cards, popovers                           |
| `bg-popover` / `text-popover-foreground`         | Popover and tooltip surfaces                                        |
| `bg-destructive` / `text-destructive-foreground` | Delete buttons, error states                                        |
| `border-border` / `border-input`                 | Default and form-input borders                                      |
| `ring-ring`                                      | Focus rings — already wired into shadcn primitives' `focus-visible` |

Source: `app/globals.css` (HSL triples) + `tailwind.config.ts` (token mapping). Light/dark counterparts are tied to `.dark` scope, and `next-themes` toggles the class — see `components/providers/theme-provider.tsx`.

### Brand accents

Two non-shadcn colors live alongside the neutral palette:

| Token                                                 | Use                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `brand-blue` (#2563EB) / `brand-blue-hover` (#1D4ED8) | AI affordances inside the editor (suggestion banner, "Ask AI" buttons), primary CTA on landing surfaces |
| `brand-violet` (#7C3AED)                              | Secondary AI/marketing — squad-agent badges, AI feature cards, accent links                             |

These are **not** in the shadcn neutral palette by default — they're added via DESIGN.md and exposed as Tailwind utilities in `tailwind.config.ts`. Use them only on AI / marketing surfaces. The default app shell is grayscale.

## Use shadcn primitives — don't reach for raw HTML

```typescript
// ❌ raw button — no token wiring, no hover/focus, no consistent height
<button className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>

// ✅ shadcn Button — picks up tokens, has variants, accessible
import { Button } from "@/components/ui/button";

<Button>Save</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost" size="icon"><Trash className="h-4 w-4" /></Button>
```

Shipped primitives in `components/ui/` (this list will grow — check the folder before importing):

```
alert-dialog  avatar  badge  button  command  dialog  dropdown-menu
input  label  popover  progress  scroll-area  select  skeleton
switch  tabs  textarea
```

If a primitive is missing, install it via shadcn CLI rather than coding from scratch:

```bash
npx shadcn@latest add accordion
```

Don't hand-roll an `Accordion` that doesn't match the rest of the system.

## The Button — primitive of primitives

Look at the shipped `Button` (in `components/ui/button.tsx`) before adding any new variant or size. It tells you the shape every other primitive follows:

- `cva` defines `variants.variant` and `variants.size`, plus `defaultVariants`.
- Variants compose Tailwind utility classes that read tokens (`bg-primary`, `hover:bg-primary/90`).
- The component is `forwardRef` for ref interop; `asChild` swaps the rendered element via Radix's `Slot`.
- Both `Button` and `buttonVariants` are exported — the variant function lets other components reuse the same class set.

## Adding a new variant

When you need a button (or any primitive) variant that doesn't exist, do all four of these:

1. **Add it to the `cva` block in `components/ui/<primitive>.tsx`.**
2. **Add an entry to `DESIGN.md` under `components:`** describing the variant in tokens (background, text, height, padding, rounded). See the `design-md` skill.
3. **Use the variant via the typed prop** at the call site — never inline the raw class set.
4. **Run `npm run design:lint`** to confirm DESIGN.md still validates.

Example — adding a `cta` variant for the marketing landing page CTA:

```typescript
// components/ui/button.tsx — extend the existing cva
const buttonVariants = cva("...", {
  variants: {
    variant: {
      default: "...",
      destructive: "...",
      outline: "...",
      secondary: "...",
      ghost: "...",
      link: "...",
      // NEW
      cta: "bg-brand-blue text-white hover:bg-brand-blue-hover",
    },
    size: {
      /* ... unchanged ... */
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});
```

Then in `DESIGN.md`:

```yaml
components:
  button-cta:
    backgroundColor: "{colors.brand-blue}"
    textColor: "#FFFFFF"
    hoverBackgroundColor: "{colors.brand-blue-hover}"
    rounded: "{rounded.sm}"
    height: 40px
    padding: "0 16px"
```

Then call sites read like:

```typescript
<Button variant="cta">Try Noted free</Button>
```

## Wrapping a primitive (feature-scoped composition)

When a feature needs a primitive plus extra behavior, **wrap don't fork**. The wrapper goes in the feature folder; the primitive stays in `components/ui/`.

```typescript
// components/coworker/agent-pill.tsx — wraps Badge with fixed icon + size
"use client";

import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export const AgentPill = ({
  name,
  className,
}: { name: string; className?: string }) => (
  <Badge variant="secondary" className={cn("gap-1.5", className)}>
    <Bot className="h-3 w-3 text-brand-violet" />
    {name}
  </Badge>
);
```

The wrapper takes `className` and forwards via `cn(...)` so consumers can still tweak. The base primitive is untouched.

## Conditional classes — always `cn()`

Conditional / merged classes go through `cn()` from `@/lib/utils` (`clsx` + `tailwind-merge`):

```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "rounded-md border px-3 py-2",
  isActive && "border-brand-blue bg-muted",
  isDisabled && "pointer-events-none opacity-50",
  className,                       // forward incoming className last
)} />
```

`tailwind-merge` resolves Tailwind conflicts intentionally — later classes win, regardless of source order, so `cn("p-4 px-2", "p-8")` correctly resolves to `p-8`. String concat (`base + " " + extra`) does not, and the wrong class wins by source order.

## Icons — `lucide-react`, sized via Tailwind

Icons come from `lucide-react`. Size them via Tailwind, not via the `size` prop, so they pick up the surrounding type rhythm:

```typescript
import { Trash, Globe } from "lucide-react";

<Trash className="h-4 w-4" />          // 16px — buttons, list items
<Globe className="h-5 w-5" />          // 20px — section icons
<Bot className="size-3 text-brand-violet" />   // 12px — pill/badge accents
```

Default semantic sizes: `h-4 w-4` (16px) inside buttons and inline next to text; `h-5 w-5` (20px) for medium accents; `h-6 w-6` (24px) for hero/empty-state. Anything else, ask whether it earns its place.

## Dark mode

Dark mode is class-based (`<html class="dark">`), driven by `next-themes` via `<ThemeProvider />` mounted in `app/layout.tsx`. **You don't write `dark:` modifiers on tokens** — the tokens themselves swap their HSL values when the `.dark` class is set. Write `bg-background`, get the right shade in either theme.

```typescript
// ❌ both branches manual; will drift from the rest of the app
<div className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50" />

// ✅ tokens
<div className="bg-background text-foreground" />
```

Use `dark:` modifiers only when you need a value the tokens don't expose (rare — usually means the design needs a new token in `globals.css` first).

## Forms

Forms use shadcn primitives composed by hand — there's no `react-hook-form` integration today. Validate with Zod (see `zod-schemas` skill), submit on click/Enter, surface errors via `sonner` toasts.

```typescript
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

<form onSubmit={handleSubmit} className="space-y-3">
  <div className="space-y-1.5">
    <Label htmlFor="title">Title</Label>
    <Input id="title" name="title" autoFocus />
  </div>
  <Button type="submit">Save</Button>
</form>
```

The `space-y-3` rhythm and `space-y-1.5` between label/input is the shipped pattern — match it.

## Typography

There's no custom font weight ramp beyond Tailwind's defaults. The visual hierarchy is driven by:

- Sizes: `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px) — set explicitly per surface
- Weights: `font-medium` (500) for buttons and pills, `font-semibold` (600) for headings, `font-bold` (700) for marketing display
- Color: `text-foreground` for primary copy, `text-muted-foreground` for secondary

The body font is `Inter` (loaded via `next/font/google` in `app/layout.tsx`). DESIGN.md documents the type ramp under `typography:`.

## Anti-patterns

```typescript
// ❌ raw hex / Tailwind color literal
<div className="bg-[#2563EB] text-white">CTA</div>
// ✅ token
<Button variant="cta">CTA</Button>

// ❌ inline a one-off variant rather than adding it to the cva
<button className="inline-flex h-10 items-center rounded-sm bg-brand-blue px-4 text-sm font-medium text-white hover:bg-brand-blue/90">…</button>
// ✅ add the variant in cva, document in DESIGN.md, use the prop
<Button variant="cta">…</Button>

// ❌ string concat for class names
<div className={"base " + (isActive ? "active " : "") + className} />
// ✅ cn()
<div className={cn("base", isActive && "active", className)} />

// ❌ dark: modifier wherever
<div className="bg-white dark:bg-neutral-950" />
// ✅ token
<div className="bg-background" />

// ❌ icon sized via the `size` prop (lucide doesn't accept this consistently)
<Trash size={16} />
// ✅ Tailwind
<Trash className="h-4 w-4" />

// ❌ hand-rolled accordion / dialog / popover
<div role="dialog" className="...">…</div>
// ✅ shadcn primitive — accessibility, focus management, all done
<Dialog><DialogContent>…</DialogContent></Dialog>

// ❌ modifying components/ui/<primitive>.tsx to change a default style
//    (the file is a vendored shadcn primitive — drift makes upgrades painful)
// ✅ wrap the primitive in your feature folder and override via className+cn()
```

## ESLint guardrail fixes (self-healing)

When `noted/no-hardcoded-color` or `noted/no-inline-style` fires, apply these replacements then re-run lint:

| Violation                                           | Fix                                                                                    |
| --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `text-[#3F3F3F]` / `dark:text-[#CFCFCF]`            | `text-foreground`                                                                      |
| `dark:bg-[#1F1F1F]`                                 | `dark:bg-background` (DESIGN.md dark canvas)                                           |
| `text-sky-500` / `bg-emerald-100` (off-palette hue) | A token (`text-muted-foreground`, `bg-destructive`) — see DESIGN.md § Off-palette hues |
| `style={{ width: "40%" }}`                          | `w-2/5` or `w-[40%]`                                                                   |
| `style={{ animationDelay: "200ms" }}`               | `[animation-delay:200ms]`                                                              |
| Tree `paddingLeft` from `level`                     | `getTreeIndentClass(level, basePx)` from `@/lib/tree-indent-class`                     |
| Hex required by third-party JS API                  | `@/lib/design-tokens` only                                                             |

Full loop: [eslint-self-heal](../eslint-self-heal/SKILL.md).

## Checklist for new UI

- [ ] Built on a shadcn primitive from `components/ui/`, not raw HTML
- [ ] All colors via tokens (`bg-primary`, `text-foreground`, `border-input`; raw `blue-600` / `violet-600` for AI/CTA only)
- [ ] No inline hex; no `bg-[#...]`; no off-palette hue (`sky`, `emerald`, `rose`, `amber`, …)
- [ ] Conditional / merged classes use `cn()` from `@/lib/utils`
- [ ] Icons from `lucide-react`, sized via Tailwind utilities
- [ ] If a new variant was added: it's in the primitive's `cva` block AND in `DESIGN.md`
- [ ] Dark mode comes for free via tokens; no `dark:` overrides unless the token doesn't exist yet
- [ ] No modifications to existing primitives in `components/ui/<name>.tsx` — wrap, don't fork
- [ ] `npm run design:lint` passes
