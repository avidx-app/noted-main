import { RuleTester } from "eslint";
import noHardcodedColor from "./no-hardcoded-color.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-hardcoded-color", noHardcodedColor, {
  valid: [
    'const x = "bg-background text-foreground";',
    'const t = "text-muted-foreground";',
    '<div className="rounded-md border" />',
    // Brand accents are raw utilities on purpose — DESIGN.md § Brand accent
    // says they are deliberately outside the shadcn token system. Whether a
    // given use is an AI/marketing surface is a /noted-review judgement.
    '<div className="bg-blue-600 hover:bg-blue-700" />',
    '<h1 className="bg-gradient-to-r from-blue-600 to-violet-600" />',
    // Neutral families share the shell's hue — documented limit, not enforced.
    '<div className="bg-neutral-100 text-slate-700 dark:bg-zinc-900" />',
    // Token wiring in tailwind.config.ts reads a CSS custom property.
    'const c = "hsl(var(--border))";',
    // Palette-shaped strings that are not palette classes.
    'const s = "my-bg-red-500";',
    'const s = "bg-red-500-foo";',
    'const s = "bg-sky-42";',
    // Exempted family under options.
    {
      code: '<div className="text-rose-500" />',
      options: [{ allowPaletteFamilies: ["rose"] }],
    },
  ],
  invalid: [
    {
      code: 'const x = "text-[#3F3F3F]";',
      errors: [{ messageId: "noHardcodedColor" }],
    },
    {
      code: '<div className="dark:bg-[#1F1F1F]" />',
      errors: [{ messageId: "noHardcodedColor" }],
    },
    {
      code: 'const x = "color: rgb(63, 63, 63)";',
      errors: [{ messageId: "noHardcodedColor" }],
    },
    {
      // Constitution §XVI bans literal hsl() too, not only hex/rgb.
      code: 'const x = "background: hsl(217 91% 60%)";',
      errors: [{ messageId: "noHardcodedColor" }],
    },
    {
      // The regression this rule was widened for: publish.tsx's sky-500.
      code: '<Globe className="ml-2 h-4 w-4 text-sky-500" />',
      errors: [{ messageId: "noOffPaletteClass" }],
    },
    {
      code: '<p className="text-xs font-medium text-sky-500">live</p>',
      errors: [{ messageId: "noOffPaletteClass" }],
    },
    {
      // Variant prefixes and opacity suffixes must not hide a violation.
      code: '<div className="dark:bg-emerald-900 hover:text-amber-600/80" />',
      errors: [{ messageId: "noOffPaletteClass" }],
    },
    {
      // Non-`bg`/`text` prefixes count too.
      code: '<div className="border-t-rose-400 fill-orange-500 ring-teal-300" />',
      errors: [{ messageId: "noOffPaletteClass" }],
    },
    {
      code: "const c = `bg-indigo-500 ${extra}`;",
      errors: [{ messageId: "noOffPaletteClass" }],
    },
    {
      // Red maps to the documented `destructive` token, so it is still flagged.
      code: '<div className="bg-red-500" />',
      errors: [{ messageId: "noOffPaletteClass" }],
    },
    {
      // An allowlist covers only the families it names.
      code: '<div className="text-rose-500 text-emerald-500" />',
      options: [{ allowPaletteFamilies: ["rose"] }],
      errors: [{ messageId: "noOffPaletteClass" }],
    },
    {
      // Hex and off-palette class in one string report separately.
      code: '<div className="bg-[#EF4444] text-sky-500" />',
      errors: [
        { messageId: "noHardcodedColor" },
        { messageId: "noOffPaletteClass" },
      ],
    },
  ],
});
