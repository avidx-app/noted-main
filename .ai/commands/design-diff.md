---
description: Compare DESIGN.md against an earlier version (a git ref or another file) to detect token-level visual identity changes — what was added, removed, or modified across colors, typography, radii, spacing, components. Wraps `npx @google/design.md diff`. Read-only.
summary: Compare UI against DESIGN.md
allowed-tools: Read, Bash(npx:*), Bash(git show:*), Bash(git rev-parse:*)
---

## User Input

```text
$ARGUMENTS
```

## Overview

> **Read-only.** Reports what changed; doesn't modify anything.

`/design-diff` compares two versions of `DESIGN.md` and surfaces token-level changes. Useful for:

- **Pre-merge review.** What's the visual identity delta in this PR?
- **Release notes.** What design tokens shifted between v1.0 and v1.1 of the design system?
- **Audit trails.** When did we add the brand-violet token? Why?

## Outline

### 1. Determine the comparison

`$ARGUMENTS` may be:

- **Empty** — compare current `DESIGN.md` against `DESIGN.md` on `staging` (the default base for noted's branch flow). Equivalent to "what does this PR change?"
- **A git ref** (e.g., `main`, `staging`, `v1.0`, a commit SHA) — compare current `DESIGN.md` against that ref's version.
- **A path** to another DESIGN.md file — compare current against that file.

If a ref is provided, materialize the historical version to a temp file:

```bash
git show <ref>:DESIGN.md > /tmp/design-md-before.md
```

If the ref doesn't have a DESIGN.md (e.g., comparing against a pre-Wave-1.5 commit), report that the file is new in the current branch and stop — there's nothing to diff.

### 2. Run the diff

```bash
npx @google/design.md diff <before> <after>
```

Output is JSON like:

```json
{
  "tokens": {
    "colors": { "added": ["accent-2"], "removed": [], "modified": ["tertiary"] },
    "typography": { "added": [], "removed": [], "modified": [] },
    "rounded": { "added": [], "removed": [], "modified": [] },
    "spacing": { "added": [], "removed": [], "modified": [] },
    "components": { "added": ["button-cta-secondary"], "removed": [], "modified": [] }
  },
  "regression": false
}
```

`regression: true` means the "after" file has more errors or warnings than the "before" file. That's a finding.

### 3. Emit the report

**This is the FIRST and ONLY user-facing output.**

For a clean diff with no changes:

```
# DESIGN.md Diff

Comparing: <before-ref-or-path> → <after-ref-or-path>

**Verdict:** ✅ No design-token changes.
```

For a diff with changes:

```
# DESIGN.md Diff

Comparing: <before-ref-or-path> → <after-ref-or-path>

**Verdict:** <✅ Clean delta | ⚠️ Regression detected>

## Tokens added

### Colors
- `<token>`: `<value>`

### Typography
- `<token>`: <summary>

### Components
- `<component>`: <summary of properties>

## Tokens removed

### Colors
- `<token>` (was: `<value>`)

## Tokens modified

### Colors
- `<token>`: `<old>` → `<new>`

## Regression

If `regression: true`, list the new errors/warnings introduced. Otherwise omit this section.
```

### 4. Special-case: empty diff

If `tokens.colors.added`, `removed`, `modified`, and the same for typography/rounded/spacing/components are all empty arrays, emit the "✅ No design-token changes" verdict and stop. Don't write empty section headers.

## Behavior Rules

- **Read-only.** Don't edit files. Don't run formatters. Don't post comments.
- **No editorial commentary.** No "Looks great!" / "Hope this helps" / "These changes seem fine."
- **Default base is `staging`.** Same as `/noted-review`'s default — matches noted's branch flow.
- **Skip empty sections.** If no tokens were added in a category, don't emit the heading.
- **Surface regressions.** When `regression: true`, list the new errors/warnings introduced in the "after" file.
