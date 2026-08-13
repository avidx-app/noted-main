---
version: alpha
name: Noted
description: AI-native note-taking — neutral grayscale app shell, blue/violet brand accents for AI surfaces and primary CTAs.
colors:
  # Neutral palette (shadcn default — sourced from app/globals.css)
  background: "#FFFFFF"
  foreground: "#0A0A0A"
  primary: "#171717"
  primary-foreground: "#FAFAFA"
  secondary: "#F5F5F5"
  secondary-foreground: "#171717"
  muted: "#F5F5F5"
  muted-foreground: "#737373"
  accent: "#F5F5F5"
  accent-foreground: "#171717"
  border: "#E5E5E5"
  input: "#E5E5E5"
  ring: "#0A0A0A"
  destructive: "#EF4444"
  destructive-foreground: "#FAFAFA"
  card: "#FFFFFF"
  card-foreground: "#0A0A0A"
  popover: "#FFFFFF"
  popover-foreground: "#0A0A0A"
  # Brand accents — the AI Squad identity (used on the landing page, in
  # the editor's AI affordances, and in the primary CTA on marketing surfaces)
  brand-blue: "#2563EB"
  brand-blue-hover: "#1D4ED8"
  brand-violet: "#7C3AED"
  # Dark mode counterparts (shadcn convention; same tokens in `.dark` scope)
  background-dark: "#0A0A0A"
  foreground-dark: "#FAFAFA"
  primary-dark: "#FAFAFA"
  primary-foreground-dark: "#171717"
  secondary-dark: "#262626"
  secondary-foreground-dark: "#FAFAFA"
  muted-dark: "#262626"
  muted-foreground-dark: "#A3A3A3"
  border-dark: "#262626"
  input-dark: "#262626"
  ring-dark: "#D4D4D4"
  destructive-dark: "#7F1D1D"
  destructive-foreground-dark: "#FAFAFA"
  brand-blue-dark: "#60A5FA"
  brand-violet-dark: "#A78BFA"
typography:
  # Default sans-serif (Geist via next/font in app/layout.tsx; falls back to
  # system sans). No custom serif or display face yet.
  display:
    fontFamily: Geist, ui-sans-serif, system-ui, sans-serif
    fontSize: 4.5rem
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  h1:
    fontFamily: Geist, ui-sans-serif, system-ui, sans-serif
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  h2:
    fontFamily: Geist, ui-sans-serif, system-ui, sans-serif
    fontSize: 1.875rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  h3:
    fontFamily: Geist, ui-sans-serif, system-ui, sans-serif
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body-lg:
    fontFamily: Geist, ui-sans-serif, system-ui, sans-serif
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: Geist, ui-sans-serif, system-ui, sans-serif
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Geist, ui-sans-serif, system-ui, sans-serif
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: Geist, ui-sans-serif, system-ui, sans-serif
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.01em"
  mono:
    fontFamily: GeistMono, ui-monospace, SFMono-Regular, monospace
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  "2xl": 48px
components:
  button-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.sm}"
    height: 40px
    padding: "0 16px"
    typography: "{typography.body-sm}"
  button-default-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.sm}"
    height: 40px
    padding: "0 16px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    height: 40px
    padding: "0 16px"
  button-ghost:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    height: 40px
    padding: "0 16px"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
    rounded: "{rounded.sm}"
    height: 40px
    padding: "0 16px"
  button-cta:
    # The marketing-surface primary CTA (landing hero, sign-up flow).
    # Departs from the neutral shell deliberately — this is the brand voice.
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    height: 48px
    padding: "0 32px"
    typography: "{typography.body}"
  button-cta-hover:
    backgroundColor: "{colors.brand-blue-hover}"
    textColor: "{colors.primary-foreground}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: 40px
    padding: "0 12px"
  badge:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    typography: "{typography.caption}"
    padding: "2px 10px"
---

## Overview

Noted is a Notion-style note-taking app where AI is a first-class collaborator, not a sidebar. The visual identity follows from that: a **calm, near-monochrome app shell** that lets long-form writing breathe, with **blue/violet brand accents reserved for AI surfaces and primary marketing CTAs.**

The shell is built on the shadcn/ui defaults (neutral grayscale via HSL CSS custom properties, dark-mode-by-design) — chosen because the editor is the product. Anything else competing for attention is wrong. The brand accent appears in three places only: (1) the landing-page hero and primary CTA, (2) AI affordances inside the editor (the `/Ask AI` trigger, AI suggestion highlights, the Coworker chat panel), and (3) Squad agent identity badges. Every other surface is neutral.

This restraint is the point. When a user finally sees the brand color, it should always mean "this is AI doing something for you."

## Colors

The palette has two layers: the **neutral shell** (sourced from `app/globals.css` as HSL CSS custom properties — what every shadcn primitive consumes) and the **brand accent** (used outside the shell to signal AI presence and primary marketing intent).

### Neutral shell

- **Background (`#FFFFFF`)** — the editor canvas. Pure white in light mode; near-black (`#0A0A0A`) in dark mode.
- **Foreground (`#0A0A0A`)** — body text, headings. High contrast against background.
- **Primary (`#171717`)** — default button and emphasis surface. Inverts to `#FAFAFA` in dark mode.
- **Secondary (`#F5F5F5`)** — subtle surface for secondary buttons, muted card backgrounds, hover states. Inverts to `#262626`.
- **Muted (`#F5F5F5`)** + **Muted Foreground (`#737373`)** — captions, metadata, timestamps, less-important affordances. The "see-but-don't-stare-at" surface.
- **Border (`#E5E5E5`)** — every divider, every input outline, every card edge. Light enough to feel like air, defined enough to structure space.
- **Destructive (`#EF4444`)** — archive, delete, "are you sure" buttons. Light red, not blood-red. Reserved for actions that change user data irreversibly.

### Brand accent

The brand accents are **not in the shadcn token system** — they're applied directly via Tailwind utilities (e.g., `bg-blue-600`) where the brand voice should appear. They are deliberately scoped:

- **Brand Blue (`#2563EB`)** — primary marketing CTA backgrounds, AI feature affordances, "AI is doing X" indicators. Hover state: `#1D4ED8`. Dark-mode surface: `#60A5FA`.
- **Brand Violet (`#7C3AED`)** — gradient pairing for hero text on the landing page (`from-blue-600 to-violet-600`). Squad agent identity. Used sparingly. Dark-mode surface: `#A78BFA`.

**When in doubt, stay neutral.** New components should be a shadcn primitive on the neutral palette. Reach for brand-blue/violet only when the surface is explicitly an AI affordance or a marketing-conversion CTA.

### Off-palette hues

Anything outside those two layers — `sky`, `emerald`, `rose`, `amber`, `teal`, `indigo` and the rest of the Tailwind palette — is **off-palette**. An off-palette hue has no token, no hex in this file, and no dark-mode counterpart, so it can't be themed, audited, or changed in one place. There is no "success green" and no "info blue" in this contract; the statuses that need a color use `destructive`, and everything else is neutral.

`noted/no-hardcoded-color` enforces this: any `bg-`/`text-`/`border-`/`fill-`/`ring-`… class on an off-palette family is an ESLint **error**, including behind `dark:`/`hover:` variants and opacity suffixes. If a new hue is genuinely needed, add it here first — with both modes — and then wire it through `app/globals.css` and `tailwind.config.ts`.

**What the rule deliberately does not enforce** (both are `/noted-review` judgement calls, not static ones):

- **Raw neutral utilities.** `text-neutral-700`, `bg-zinc-900` and friends are the same hue as the shell but bypass its tokens. They're widespread on marketing surfaces and not flagged. Prefer the token (`text-muted-foreground`, `bg-background`) in new code.
- **Brand-accent context.** `bg-blue-600` is the sanctioned way to apply the brand accent, so the rule can't tell a legitimate AI affordance from a stray blue button. Scope is still binding — see the Don'ts below and Constitution §XVI.

A per-path allowlist in `eslint.config.mjs` carries the off-palette uses that predate the rule (marketing "check" chips, Coworker presence dots, the confirm-modal red that should be `bg-destructive`). That list ratchets to zero — it is debt, not a sanctioned exception, and new files get no exemption.

## Typography

Typography is **system-first**: Geist sans-serif (loaded via `next/font` in `app/layout.tsx`) for everything, GeistMono for code blocks. The hierarchy is intentionally short — most of the product is body text inside the editor; the hierarchy exists to support nav, document titles, and editor block-level styles.

- **Display** (4.5rem / `text-7xl` / 700) — landing hero only. Negative letter-spacing for visual density.
- **H1** (2.25rem / `text-4xl` / 700) — document title in the editor; primary marketing headline tier.
- **H2** (1.875rem / `text-3xl` / 600) — top-level section headings in long-form content.
- **H3** (1.5rem / `text-2xl` / 600) — sub-section headings in long-form content.
- **Body LG** (1.125rem / `text-lg` / 400) — landing subtitle, marketing prose.
- **Body** (1rem / `text-base` / 400) — editor default, in-app prose.
- **Body SM** (0.875rem / `text-sm` / 400) — UI labels, button text, navigation, sidebar items.
- **Caption** (0.75rem / `text-xs` / 400) — timestamps, metadata, helper text under inputs.
- **Mono** (0.875rem / `text-sm` / 400, GeistMono) — code blocks, AI-tool argument previews, file paths.

**Don't introduce new typography tokens for one-off styles.** The `text-7xl` hero exists because it does specific work on the landing page. New components reuse Body, Body SM, or Caption — the editor sets the rest.

## Layout

- **Container max-width** is 1400px at the `2xl` breakpoint, with horizontal padding of 32px (`px-8` / Tailwind `container` config). Most marketing surfaces honor this; the editor goes edge-to-edge inside its own scrollable surface.
- **Spacing scale**: 4 / 8 / 16 / 24 / 32 / 48 px (xs / sm / md / lg / xl / 2xl). The 8-px grid is the rhythm — spacing values that don't snap to it are findings.
- **Sidebar** (the document navigator on the left) is `w-60` (240px) by default, collapsible. Expanding to fullscreen via the rail is a recent affordance and stays in the same width band.
- **Vertical rhythm in long-form content**: paragraph spacing is `space-y-4` (16px); block-level elements (headings, callouts, dividers) get `space-y-6` (24px) above and below.

## Elevation & Depth

Noted uses **borders to structure space, not shadows.** Cards, popovers, and modals lean on the `border` token rather than box-shadow. The two exceptions:

- **Floating menus** (block toolbar, slash-menu, AI provider picker) get a subtle `shadow-md` to lift them above the editor surface — the visual cue that they're transient.
- **Dropdowns and popovers** from Radix primitives use the shadcn default elevation (`shadow-md`), themselves bordered.

The product reads as a 2D plane with clear edges, not a stack of paper. Shadows are reserved for transient surfaces.

## Shapes

Roundness is consistent and subtle:

- **`rounded.sm` (4px)** — buttons, badges, small interactive surfaces.
- **`rounded.md` (6px)** — inputs, smaller cards.
- **`rounded.lg` (8px)** — primary cards, the document container, the marketing-CTA button (taller height earns rounder corners).
- **`rounded.xl` (12px)** — large feature surfaces (the AI Squad agent cards on the landing).
- **`rounded.full`** — avatars, badges with text, "pill" affordances.

Avoid `rounded.xl+` on small interactive elements — large radii on small surfaces read as Cute, which is not the brand voice.

## Components

Tokens for the core components are in the YAML front matter. Key implementation notes:

- **Button variants** (`default`, `secondary`, `outline`, `ghost`, `destructive`, `link`, plus `cta` for marketing surfaces) live in `components/ui/button.tsx`. The shipped shadcn variants take `rounded-sm` (4px); the marketing CTA is the only variant that takes `rounded-lg` (8px) and `h-12 px-8` for visual weight on the landing.
- **Card** is the standard surface for grouping related content (document previews, settings sections). Always padded with `spacing.lg` (24px), bordered, no shadow.
- **Input** is `h-10` (40px) with `rounded.md` (6px). Tighter horizontal padding (12px) than buttons (16px) so labels and placeholder text aren't crowded.
- **Badge** is the pill-shaped indicator (`rounded.full`) used for status (Draft / Published), AI provider names, and Squad agent identity. Caption typography (`text-xs`).

When you need a variant that doesn't exist, **add it to `components/ui/<primitive>.tsx`** via shadcn's `cva` pattern; don't reach for inline Tailwind utilities to ad-hoc a new look. Variants are how the design system stays coherent.

## Do's and Don'ts

**Do**

- Default to the neutral shell. Reach for brand colors only when the surface is AI-related or a marketing CTA.
- Use shadcn primitives in `components/ui/` as the building blocks. Wrap them in feature-specific components under `components/<feature>/` when you need new behavior.
- Follow the 8-px spacing rhythm. If you write `gap-3` (12px) or `pt-7` (28px), you're probably about to break the grid — pause and pick the nearest 8-px value.
- Use the `border` token for structural separation. Use `shadow-md` only for transient surfaces (popovers, dropdowns, floating menus).
- Add new component variants via `cva` in the relevant `components/ui/<primitive>.tsx` file.
- When introducing a new color, typography, or component token, **update DESIGN.md in the same PR.** The contract drifts otherwise, and `/noted-review` will catch it.

**Don't**

- Don't use `bg-blue-*`, `bg-violet-*`, or any other branded color outside the AI-feature and marketing-CTA contexts. The brand accent is scarce on purpose.
- Don't reach for an off-palette hue (`text-sky-500`, `bg-emerald-100`, `text-rose-500`) for status, emphasis, or "it looked right". Use a token, or add the hue to this file with both modes first. ESLint errors on these.
- Don't introduce a new color token without updating the dark-mode counterpart. Every neutral and every brand accent has both modes.
- Don't write inline `style={{ color: '#hex' }}` or use raw hex, `rgb()` or literal `hsl()` in `className`. Always use the token.
- Don't modify files under `components/ui/` to change a primitive's appearance for one feature — wrap, don't edit. (See Constitution §XII.)
- Don't add typography tokens for one-off marketing surfaces. The hierarchy exists; reuse Body, Body SM, or Caption.
- Don't use box-shadows on permanent surfaces. Borders structure space; shadows lift transients.
- Don't ship a UI change without thinking about dark mode. Every new color or background needs both light and dark.

## Known lint warnings

Running `npm run design:lint` against this file emits ~25 warnings that are intentional:

- **Orphaned dark-mode tokens** (`background-dark`, `foreground-dark`, etc.) — the DESIGN.md spec at version `alpha` doesn't have first-class dark-variant references on components. We keep the dark counterparts as named tokens so future maintainers can see the full palette and so an export-to-Tailwind run produces both modes. Once the spec adds dark-variant support, these will be wired through.
- **Orphaned core shadcn tokens** (`popover`, `popover-foreground`, `accent`, `accent-foreground`, `border`, `input`, `ring`, `muted-foreground`) — these are consumed by shadcn primitives (Radix dropdowns, popovers, scroll-areas) and by inline Tailwind classes for captions/timestamps, not through DESIGN.md component entries. We document them so the contract is complete; they're not orphaned in the codebase.
- **`button-destructive` contrast 3.61:1** — below WCAG AA (4.5:1) but matches shadcn's shipped default. Documented as a known gap; revisit when we either tighten our accessibility bar or accept a darker destructive background. Until then: avoid using small text on destructive buttons (the variant is rarely used outside large-text confirm dialogs).

If you add a new orphan-token warning that *isn't* a dark counterpart or a documented shadcn primitive, that's a real finding — wire it through to a component or remove it.
