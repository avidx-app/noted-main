---
description: Create a git worktree with a Linear ticket, descriptive branch, and open it in a new editor window.
summary: Git worktree helper
---

<!--
Adapted from heatseeker-next/.ai/commands/worktree.md
Noted-specific adjustments:
- HST → NOT (Linear prefix)
- Heatseeker team → Noted
- Branch base: staging (not main) — noted's flow is feature → staging → main
- Worktree path prefix: noted- (not hs-)
- Single-app — copy root .env files only, no apps/* iteration
-->

## User Input

```text
$ARGUMENTS
```

## Overview

Creates a self-contained git worktree for a new task. Handles Linear ticket creation, branch naming, worktree setup in a sibling directory (never nested), and opens the result in a fresh editor window.

> **Branch flow reminder**: noted-main flows `feature/* → staging → main`. New worktrees branch from `staging`, not `main`.

## Outline

### 1. Validate Arguments

`$ARGUMENTS` is the **purpose / intent** of the worktree (e.g., "fix archive recursion bug", "add presence indicators").

- If `$ARGUMENTS` is empty or blank, **STOP**:
    > "A purpose is required. Re-run with a description of what this worktree is for.
    > Example: `/worktree fix archive recursion bug`"
- Otherwise store as `PURPOSE`.

### 2. Create a Linear Ticket

Use Linear MCP `create_issue`:

| Field        | Value                                          |
| ------------ | ---------------------------------------------- |
| **title**    | Concise sentence-case title derived from `PURPOSE` |
| **team**     | `Noted`                                        |
| **state**    | `In Progress`                                  |
| **assignee** | `me`                                           |

Examples: "fix archive recursion bug" → "Fix archive recursion bug"

After creation, store the **identifier** (e.g., `NOT-456`) and **title**.

If MCP is unavailable, **warn but don't block** — fall back to asking the user for an existing ticket ID. (Departure from heatseeker.)

If ticket creation fails for other reasons, **STOP** and report.

### 3. Derive Branch Name

Format: `feature/<ticket-identifier-lowercase>-<slugified-title>`

Slugify:
- Lowercase
- Spaces and underscores → hyphens
- Strip non-alphanumeric except hyphens
- Collapse consecutive hyphens
- Trim leading/trailing hyphens
- Max 60 chars (truncate at word boundary if possible)

Example: ticket `NOT-456` with title "Fix archive recursion bug" → `feature/not-456-fix-archive-recursion-bug`

### 4. Determine Worktree Path

Worktree **must be a sibling of the current project** — never nested.

1. Get git root:

    ```bash
    git rev-parse --show-toplevel
    ```

2. Worktree path:

    ```
    <parent-of-git-root>/noted-<ticket-identifier-lowercase>-<slug>
    ```

    Example: if repo root is `/Users/me/code/noted-main`, worktree path:

    ```
    /Users/me/code/noted-not-456-fix-archive-recursion-bug
    ```

3. If target dir already exists, **STOP**:
    > "Directory `<path>` already exists. Remove it or choose a different purpose."

### 5. Create the Worktree

Fetch latest `staging`:

```bash
git fetch origin staging
```

Create worktree based on `origin/staging`:

```bash
git worktree add -b <branch-name> <worktree-path> origin/staging
```

This creates both the worktree directory and the new branch in one command, always starting from `staging` regardless of which branch is currently checked out.

- If branch already exists: **STOP** — "Branch `<branch-name>` already exists. Resolve before retrying."
- Other failure: report and **STOP**.

Confirm:
> "Worktree created:
> - **Ticket:** `<identifier>` — <title>
> - **Branch:** `<branch-name>`
> - **Path:** `<worktree-path>`"

### 6. Copy Configuration Files

Copy root `.env` files from the main repo so the worktree boots with the same env:

```bash
cp <git-root>/.env* <worktree-path>/ 2>/dev/null || true
```

(Single-app — no apps/* iteration needed.)

If you also use `.npmrc`, `.prettierrc` overrides, etc., they're already tracked in git and propagate via the branch. Don't copy tracked files.

After copy, run `npm install` in the worktree (this also runs `sync-ai` via postinstall, materializing the symlinks):

```bash
cd <worktree-path> && npm install
```

### 7. Open in a New Editor Window

Try Cursor first; fall back to VS Code:

```bash
if command -v cursor >/dev/null 2>&1; then
  cursor <worktree-path>
elif command -v code >/dev/null 2>&1; then
  code <worktree-path>
else
  echo "Neither cursor nor code is on PATH. Open <worktree-path> manually."
fi
```

Report:
> "Opened `<worktree-path>` in a new window. Happy coding!"

## Behavior Rules

- **Never nest worktrees** — sibling of the main repo, never inside it.
- Never modify git config.
- If a step fails unexpectedly, report clearly and stop.
- Show what's happening at each major step.
- Linear: team `Noted`, state `In Progress`, assignee `me`.
- Linear MCP unavailable: warn, don't block — ask for an existing ticket ID instead.
