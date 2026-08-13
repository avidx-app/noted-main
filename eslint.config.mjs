import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import notedPlugin from "./eslint-rules/noted/index.js";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "convex/_generated/**",
      "coverage/**",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      react: reactPlugin,
      "react-hooks": hooksPlugin,
      "@typescript-eslint": tsPlugin,
      noted: notedPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "react/no-unknown-property": "off",
      "react-hooks/set-state-in-effect": "off",
      // Ratchet to "error" after legacy `any` cleanup (see typescript-patterns skill).
      "@typescript-eslint/no-explicit-any": [
        "warn",
        {
          fixToUnknown: false,
          ignoreRestArgs: false,
        },
      ],
      // Custom rules with AI-friendly messages — warn on legacy code, error on new violations in CI once cleaned up.
      // no-hardcoded-color is at "error": hex/rgb/hsl debt is fully cleaned up, and
      // off-palette hues are exempted per-path below rather than tolerated everywhere.
      "noted/no-hardcoded-color": "error",
      "noted/no-inline-style": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/*.test.{js,jsx}", "**/jest.setup.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      // Class strings in tests are fixtures for cn()/clsx, not styling.
      "noted/no-hardcoded-color": ["error", { allowPaletteFamilies: ["red"] }],
    },
  },
  {
    files: ["components/ui/**/*.{ts,tsx}"],
    rules: {
      "noted/no-hardcoded-color": "off",
      "noted/no-inline-style": "off",
    },
  },

  // ---------------------------------------------------------------------------
  // Off-palette hue debt (ratchets to zero — do not add families to these lists).
  //
  // DESIGN.md documents a neutral shell plus blue/violet brand accents. Every
  // family listed below is a hue that appears nowhere in the contract, so it has
  // no token and no dark-mode counterpart. These are pre-existing uses that
  // predate the palette check; each entry is debt with a known fix, not a
  // sanctioned exception. New files get no exemption.
  // ---------------------------------------------------------------------------
  {
    // Marketing surfaces: emerald/amber "check" and "callout" chips inside the
    // feature-page mockups, the gradient hero variant, and the fake macOS
    // traffic lights in the window chrome mockup. Needs either a documented
    // status-color pair in DESIGN.md or a neutral rework.
    files: ["app/(landing)/**/*.{ts,tsx}"],
    rules: {
      "noted/no-hardcoded-color": [
        "error",
        {
          allowPaletteFamilies: [
            "amber",
            "emerald",
            "green",
            "indigo",
            "pink",
            "purple",
            "red",
            "yellow",
          ],
        },
      ],
    },
  },
  {
    // In-product status colors with no token: archived-banner rose, Coworker
    // presence dots (yellow/green), Coworker "thinking" spark (orange), the
    // confirm-modal red that should be `bg-destructive`, and the settings-modal
    // "connected" green. `bg-destructive` covers some of these today.
    files: [
      "app/(main)/_components/banner.tsx",
      "app/(main)/_components/coworker-card.tsx",
      "components/coworker/**/*.{ts,tsx}",
      "components/modals/**/*.{ts,tsx}",
      "components/single-image-dropzone.tsx",
    ],
    rules: {
      "noted/no-hardcoded-color": [
        "error",
        {
          allowPaletteFamilies: ["green", "orange", "red", "rose", "yellow"],
        },
      ],
    },
  },
];

export default eslintConfig;
