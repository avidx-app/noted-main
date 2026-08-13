---
description: Validate DESIGN.md against the design.md spec — WCAG contrast, broken token references, orphaned tokens, structural correctness. Wraps `npx @google/design.md lint DESIGN.md` and surfaces findings in the standard PR-review format. Read-only.
summary: Run design.md linter
allowed-tools: Read, Grep, Bash(npx:*), Bash(npm:*)
---

## User Input

```text
$ARGUMENTS
```

## Overview

> **Read-only.** This command runs the linter and reports findings. It does not edit `DESIGN.md`, doesn't fix issues automatically, doesn't post comments anywhere. The deliverable is the report text — the author reads it and decides what to fix.

`/design-lint` validates `DESIGN.md` against the [design.md spec](https://github.com/google-labs-code/design.md). It runs seven rules:

| Rule | Severity | What it checks |
|---|---|---|
| `broken-ref` | error | Token references like `{colors.primary}` that don't resolve |
| `missing-primary` | warning | A `primary` color is missing — agents auto-generate one |
| `contrast-ratio` | warning | Component `backgroundColor`/`textColor` pairs below WCAG AA (4.5:1) |
| `orphaned-tokens` | warning | Color tokens defined but never referenced by any component |
| `missing-typography` | warning | Colors defined but no typography tokens |
| `missing-sections` | info | Optional sections (spacing, rounded) absent when other tokens exist |
| `section-order` | warning | Sections out of canonical order |
| `token-summary` | info | How many tokens are defined per section |

## Outline

### 1. Run the linter

```bash
npm run design:lint
```

(Equivalent to `npx @google/design.md lint DESIGN.md --format json`.)

If the command exits 1, that means at least one **error** was found. Warnings alone exit 0.

### 2. Parse the output

The output is JSON with this shape:

```json
{
  "findings": [
    {
      "severity": "error" | "warning" | "info",
      "path": "components.button-primary",
      "message": "..."
    }
  ],
  "summary": { "errors": 0, "warnings": 24, "infos": 1 }
}
```

### 3. Filter expected warnings

DESIGN.md's "Known lint warnings" section documents three intentional warning categories that should NOT be flagged in this report:

1. **Orphan dark-mode tokens** — any `colors.*-dark` listed under orphaned-tokens.
2. **Orphan core shadcn tokens** — `popover`, `popover-foreground`, `accent`, `accent-foreground`, `border`, `input`, `ring`, `muted-foreground` listed under orphaned-tokens.
3. **`button-destructive` contrast 3.61:1** — matches shadcn's default; tracked as a known gap.

Filter these out before producing the report. Anything else is a real finding.

### 4. Emit the report

**This is the FIRST and ONLY user-facing output.** Step 1–3 are silent.

```
# DESIGN.md Lint

Tokens: <N> colors · <N> typography · <N> rounded · <N> spacing · <N> components

**Verdict:** ✅ Clean.
```

OR (when there are real findings):

```
# DESIGN.md Lint

Tokens: <N> colors · <N> typography · <N> rounded · <N> spacing · <N> components

**Verdict:** ❌ <N> issue(s) to fix — see below.

| Severity | Path | Issue |
|---|---|---|
| error | components.foo | <message> |
| warning | colors.bar | <message> |

## Things to fix

- `<path>` — <message>. Fix: <one-line action, referencing DESIGN.md or the underlying source files (app/globals.css, tailwind.config.ts, components/ui/<file>.tsx)>.
```

### 5. Special-case: clean run

If after filtering expected warnings there are zero remaining issues, emit:

```
# DESIGN.md Lint

Tokens: <N> colors · <N> typography · <N> rounded · <N> spacing · <N> components

**Verdict:** ✅ Clean.
```

Stop after the verdict line. No "Things to fix" section, no closing remarks.

## Behavior Rules

- **Read-only.** Don't edit DESIGN.md. Don't run formatters or other CLIs. Don't post comments anywhere.
- **Filter expected warnings.** Document the categories that should be ignored (above) and don't surface them as findings.
- **Reference the source files in fixes.** A bad token reference points to the relevant section of DESIGN.md AND the file in code that uses the (now broken) token.
- **No editorial commentary.** No "Looks great!" or "Nice work" or "Hope this helps." The verdict + scorecard + Things-to-fix is the deliverable.
- **Use the report format above exactly.** No additional sections.
