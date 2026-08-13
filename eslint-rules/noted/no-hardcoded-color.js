import path from "node:path";

/**
 * Tailwind palette families, grouped by their standing in DESIGN.md.
 *
 * - NEUTRAL: the grayscale shell. DESIGN.md defines the shell as tokens
 *   (`background`, `muted`, `border`, …) but marketing surfaces still reach for
 *   raw `neutral-*` utilities. Same hue as the contract, so not flagged — see
 *   the "known limit" note in DESIGN.md § Colors.
 * - BRAND: DESIGN.md § Brand accent says these are applied *as raw utilities*
 *   ("e.g. `bg-blue-600`", "`from-blue-600 to-violet-600`") because the brand
 *   accents are deliberately not in the shadcn token system. Whether a given
 *   use sits in an AI/marketing context is a judgement call `/noted-review`
 *   makes, not something a lint rule can decide.
 * - OFF_PALETTE: hues that appear nowhere in DESIGN.md — no token, no hex, no
 *   dark-mode counterpart. Those are statically decidable contract violations.
 */
const NEUTRAL_FAMILIES = ["slate", "gray", "zinc", "neutral", "stone"];
const BRAND_FAMILIES = ["blue", "violet"];
const OFF_PALETTE_FAMILIES = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "indigo",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

const ALL_FAMILIES = [
  ...NEUTRAL_FAMILIES,
  ...BRAND_FAMILIES,
  ...OFF_PALETTE_FAMILIES,
];

/** Tailwind utility prefixes that take a palette color. */
const COLOR_PREFIXES = [
  "bg",
  "text",
  "border",
  "border-x",
  "border-y",
  "border-t",
  "border-r",
  "border-b",
  "border-l",
  "from",
  "via",
  "to",
  "ring",
  "ring-offset",
  "fill",
  "stroke",
  "decoration",
  "outline",
  "divide",
  "placeholder",
  "caret",
  "accent",
  "shadow",
];

const SHADES = "(?:50|100|200|300|400|500|600|700|800|900|950)";

/**
 * Matches a Tailwind palette class anywhere in a string, tolerating variant
 * prefixes (`dark:`, `hover:`, `md:`) and opacity suffixes (`/20`). The
 * boundaries stop `my-bg-red-500` and `bg-red-500-foo` from matching.
 */
function buildPalettePattern(families) {
  return new RegExp(
    `(?<![-\\w])(?:${COLOR_PREFIXES.join("|")})-(?:${families.join("|")})-${SHADES}(?![-\\w])`,
    "g",
  );
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow hard-coded colors — raw hex/rgb/hsl values and off-palette Tailwind palette classes. Use tokens from app/globals.css, or the DESIGN.md brand accents.",
    },
    messages: {
      noHardcodedColor:
        "Hard-coded color detected ({{value}}). Use Tailwind design tokens (e.g. bg-background, text-foreground, text-muted-foreground, bg-destructive) from app/globals.css — see .ai/skills/design-system/SKILL.md and DESIGN.md. Never use inline hex, rgb() or literal hsl() in className. Brand accents are the raw utilities blue-600/violet-600, scoped to AI affordances and marketing CTAs (DESIGN.md § Brand accent).",
      noOffPaletteClass:
        "Off-palette Tailwind color detected ({{value}}). This hue is not in DESIGN.md — it has no token and no dark-mode counterpart, so it silently breaks the visual contract (Constitution §XVI). Use a semantic token (text-foreground, text-muted-foreground, bg-muted, bg-destructive for destructive intent) or the DESIGN.md brand accents blue-600/violet-600 if the surface is genuinely an AI affordance or a marketing CTA. If the hue is deliberate, add it to DESIGN.md with both modes first — see .ai/skills/design-md/SKILL.md.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowPaletteFamilies: {
            type: "array",
            items: { enum: ALL_FAMILIES },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    if (
      context.filename.includes(`${path.sep}eslint-rules${path.sep}`) ||
      context.filename.includes(`${path.sep}lib${path.sep}design-tokens.ts`)
    ) {
      return {};
    }

    const { allowPaletteFamilies = [] } = context.options[0] ?? {};
    const checkedFamilies = OFF_PALETTE_FAMILIES.filter(
      (family) => !allowPaletteFamilies.includes(family),
    );

    const hexPattern = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;
    const rgbPattern = /\brgb\s*\(/;
    // `hsl(var(--border))` is the token-wiring pattern in tailwind.config.ts —
    // only literal channel values are hard-coded.
    const hslPattern = /\bhsla?\s*\(\s*(?!var\()/;
    const palettePattern = checkedFamilies.length
      ? buildPalettePattern(checkedFamilies)
      : null;

    function truncate(value) {
      return value.length > 40 ? `${value.slice(0, 40)}...` : value;
    }

    function checkStringValue(node, value) {
      if (!value || typeof value !== "string") return;

      if (
        hexPattern.test(value) ||
        rgbPattern.test(value) ||
        hslPattern.test(value)
      ) {
        context.report({
          node,
          messageId: "noHardcodedColor",
          data: { value: truncate(value) },
        });
      }

      if (!palettePattern) return;

      palettePattern.lastIndex = 0;
      const offenders = [...new Set(value.match(palettePattern) ?? [])];

      if (offenders.length) {
        context.report({
          node,
          messageId: "noOffPaletteClass",
          data: { value: truncate(offenders.join(" ")) },
        });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === "string") {
          checkStringValue(node, node.value);
        }
      },
      TemplateElement(node) {
        checkStringValue(node, node.value.raw);
      },
    };
  },
};

export default rule;
