---
description: Validate branch, run quality checks, review code, and commit changes. Optionally links to a Linear ticket (e.g. NOT-123).
summary: Pre-commit quality gate
---

<!--
Adapted from heatseeker-next/.ai/commands/commit.md
Noted-specific adjustments:
- HST → NOT (Linear prefix)
- pnpm → npm scripts; npm run type:check (not pnpm run check-types)
- Branch target: staging (not main) — noted's flow is feature → staging → main
- Linear team: Noted (not Heatseeker)
- Dropped heatseeker-only skill refs (api-endpoints, dal-layer, monorepo-structure, service-layer); kept universal ones
- Single-app structure — no apps/* directory iteration
-->

## User Input

```text
$ARGUMENTS
```

## Overview

Automated commit workflow that validates the working branch, runs pre-commit quality checks, reviews code against project standards, and commits when everything passes.

> **Branch flow reminder**: noted-main flows `feature/* → staging → main`. This command targets `staging` for PRs and uses `staging...HEAD` for diff scope.

## Outline

### 1. Parse Arguments

- If `$ARGUMENTS` is non-empty, treat it as a **Linear ticket identifier** (case-insensitive, expected format `NOT-<number>`, e.g. `NOT-123`).
- Normalize to uppercase (`not-123` → `NOT-123`).
- If the value does not match `NOT-\d+`, **STOP**:
  > "Invalid ticket identifier `<value>`. Expected format: `NOT-<number>` (e.g. `NOT-123`)."

### 2. Validate Linear Ticket (if provided)

- Use the Linear MCP to fetch the issue. If MCP is unavailable, **warn but don't block** — proceed without the verification step (note: this is a deliberate departure from heatseeker, since MCP may not be wired up).
- If the ticket **does not exist**, **STOP**:
  > "Linear ticket `<identifier>` was not found. Verify the ID and try again."
- If it exists, store **ID**, **title**, **identifier** for later.

### 3. Determine Current Branch

`git branch --show-current`.

#### Case A — On `main` or `staging` WITH a ticket parameter

**STOP**:

> "You're on `<branch>` with a ticket parameter (`<identifier>`). Direct commits to integration branches aren't allowed.
> Switch to or create a feature branch first, then re-run `/commit`."

#### Case B — On `main` or `staging` WITHOUT a ticket parameter

The user has uncommitted work on an integration branch that needs a proper feature branch.

1. **Show staged/unstaged changes**: `git status` and `git diff --stat`.
2. **Create a new Linear ticket** (best-effort — if MCP unavailable, ask the user for a ticket ID instead):
   - Team: `Noted`
   - Title: ask user (or infer from diff if obvious)
   - State: `In Progress`
   - Assignee: `me`
3. Derive branch name:
   - Format: `feature/<ticket-identifier-lowercase>-<slugified-title>`
   - Example: `feature/not-456-add-presence-indicator`
   - Slugify: lowercase, spaces → hyphens, strip non-alphanumeric except hyphens, max 60 chars
4. **Create the branch** based on the current integration branch (current changes carry over):
   ```bash
   git checkout -b <branch-name>
   ```
5. Confirm:
   > "Created Linear ticket `<identifier>` and switched to branch `<branch-name>`. Proceeding."
6. Continue to **Step 4**.

#### Case C — On a feature/bugfix/hotfix branch

Proceed to **Step 4**.

### 4. Validate Branch Naming

**Quick check**: if branch contains `not-` (case-insensitive), it's valid — extract the ticket ID and skip to Step 5.

Otherwise, the branch must match:

- `feature/<ticket-id>-<description>`
- `bugfix/<ticket-id>-<description>`
- `hotfix/<ticket-id>-<description>`

Where `<ticket-id>` is a lowercase Linear identifier like `not-123`.

If the branch name doesn't match and **no ticket parameter was provided**:

1. Auto-create a Linear ticket and rename branch (same as Case B in Step 3, but using `git stash` + `git checkout -b` + `git stash pop`).

If the branch name doesn't match and **a ticket parameter WAS provided**, **STOP**:

> "Branch `<current-branch>` doesn't follow the naming convention. Expected: `feature/not-123-add-user-auth`.
> Want me to rename it? Provide the correct branch name."

If user provides a name: `git branch -m <new-name>`. Re-validate. STOP if still wrong.

If a ticket parameter was provided in Step 1, also verify the branch's ticket ID matches the parameter. Warn if they differ.

### 5. Run Pre-Commit Quality Checks

Sequentially. Report after each.

#### 5a. Prettier (changed TypeScript files only)

Collect changed `.ts`/`.tsx` files (staged, unstaged, untracked, **and full branch diff vs `staging`**):

```bash
CHANGED_TS_FILES=$( ( \
  git diff --name-only HEAD -- '*.ts' '*.tsx'; \
  git diff --cached --name-only -- '*.ts' '*.tsx'; \
  git ls-files --others --exclude-standard -- '*.ts' '*.tsx'; \
  git diff --name-only staging...HEAD -- '*.ts' '*.tsx' \
  ) | sort -u )
```

> **Why include `staging...HEAD`?** CI checks all files changed on the branch, not just the current commit. Without this, files committed with bad formatting in earlier commits slip through.

If empty: report "Prettier: ✓ No changed TypeScript files" and move on.

Otherwise, **check** without modifying:

```bash
echo "$CHANGED_TS_FILES" | xargs npx prettier --check --ignore-path .prettierignore
```

If pass (exit 0): report "Prettier: ✓ No issues" and move on.

If fail (exit 1): auto-fix only the changed files:

```bash
echo "$CHANGED_TS_FILES" | xargs npx prettier --write --ignore-path .prettierignore
git add -u
```

Report: "Prettier: ✓ Formatting issues fixed and staged."

#### 5b. ESLint guardrail loop (changed files only)

Reuse `CHANGED_TS_FILES`. If empty: skip with note.

Run the **eslint-self-heal loop** (see `.ai/skills/eslint-self-heal/SKILL.md`):

```bash
echo "$CHANGED_TS_FILES" | xargs npx eslint --fix
echo "$CHANGED_TS_FILES" | xargs npx eslint
```

If pass: report "ESLint: ✓ No issues on changed files".

If fail after `--fix`:

1. Read each error — messages link to skills (`design-system`, `typescript-patterns`, `eslint-self-heal`).
2. Apply the matching fix recipe (hex → token, inline style → Tailwind, `any` → proper type).
3. Re-run `echo "$CHANGED_TS_FILES" | xargs npx eslint` until clean on changed files.
4. Stage fixes: `git add -u`.

If errors remain on **unchanged legacy files** outside the diff, note them but do not block — only changed files must be clean.

If errors remain on **changed files** after the loop, list them and collect for Step 6.

#### 5c. TypeScript type check

```bash
npm run type:check
```

List type errors clearly. **Do not stop** — collect for Step 6.

#### 5d. Unit tests

```bash
npm run test
```

List failures clearly. **Do not stop** — collect for Step 6.

### 6. Quality Check Summary

Present:

```
| Check       | Status | Issues |
|-------------|--------|--------|
| Prettier    | ✓ PASS | 0      |
| ESLint      | ✗ FAIL | 3      |
| TypeScript  | ✓ PASS | 0      |
| Unit Tests  | ✗ FAIL | 1      |
```

If any check failed:

- For ESLint / guardrail failures: follow [eslint-self-heal](../skills/eslint-self-heal/SKILL.md) — fix code, re-run lint, loop until changed files are clean.
- For other failures: suggest fixes referencing relevant skills (`error-handling`, `derived-state`, `typescript-patterns`, etc.).
- Ask: "Fix these automatically? (yes/no)"
- If yes: apply fixes, re-run failing checks, **loop until pass or blocked**, update summary.
- If no: **STOP** — fix manually and re-run `/commit`.

### 7. Code Review

Review staged + unstaged changes (`git diff`, `git diff --cached`) against:

- **Derived state** (`derived-state`): no `useEffect` + `setState` for derived values
- **Effect-to-event** (`effect-to-event`): side effects in handlers, not effects
- **Error handling** (`error-handling`): conventional `throw new Error("...")` vocabulary; auth → existence → ownership → validation order in Convex handlers
- **TypeScript patterns** (`typescript-patterns`): no `any`, proper type narrowing, branded `Doc<>`/`Id<>` types
- **ESLint guardrails** (`eslint-self-heal`): no hard-coded hex/rgb, no inline styles, fix loop until changed files are clean
- **File naming** (`file-naming`): kebab-case files, PascalCase component exports, camelCase Convex modules
- **Code quality checklist** (`code-quality-checklist`): coverage on touched files, no commented-out code, no `TODO` without `NOT-XXXX`
- **Unit testing** (`unit-testing`): tests earn their keep, Clerk + Convex mocked at top, factories for domain objects

Report:

```
## Code Review

### Issues Found
- **[severity]** file:line — description (reference: skill-name)

### Suggestions
- description

### Verdict: PASS / NEEDS CHANGES
```

If NEEDS CHANGES: present, ask if user wants you to fix. If yes: apply, re-run Step 5, re-review. If no: **STOP**.

### 8. Commit

If all checks pass and verdict is **PASS**:

1. Stage all: `git add -A`.
2. Analyze full branch diff:
   - `git diff staging...HEAD --stat`
   - `git diff --cached --stat`
   - `git diff --cached`
3. Generate commit message:

   **Subject** (≤72 chars):
   - Conventional commit format: `type(scope): description`
   - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`, `perf`
   - Scope: primary area (e.g., `documents`, `ai`, `editor`, `auth`)
   - Imperative mood, no period
   - Append Linear ticket: `feat(documents): add presence indicator [NOT-123]`

   **Body** (after blank line, wrap at 72):
   - 2–5 bullets summarizing what + why
   - High-level files/areas (e.g., "convex/, components/, hooks/")
   - Note breaking changes prefixed `BREAKING CHANGE:`

   **Example**:

   ```
   feat(documents): add presence indicator [NOT-123]

   - Add presence table + by_doc index in convex/schema.ts
   - New query/mutation in convex/presence.ts (auth + ownership)
   - usePresence hook + PresenceIndicator component
   - Document Viewed event added in app/(main)/(routes)/documents/[documentId]/
   ```

4. Show proposed message. Use `AskQuestion`: **"Yes, commit"** / **"No, I want to edit"**.
5. Commit with HEREDOC to preserve formatting:

   ```bash
   git commit -m "$(cat <<'EOF'
   <subject line>

   <body bullets>
   EOF
   )"
   ```

6. Verify with `git status`. Report: "Committed on `<branch>`."

### 9. Push

After successful commit, ask via `AskQuestion`: **"Yes, push to remote"** / **"No, stay local"**.

- No: report "Local only. Run `git push` when ready." **STOP**.
- Yes: `git push -u origin HEAD`. On failure, report and **STOP**. On success, report and proceed to Step 10.

### 10. Create Pull Request (target: `staging`)

Check for an open PR for this branch:

```bash
gh pr view --json url,state 2>/dev/null
```

#### Case A — Open PR exists

Report URL: "PR already open: `<url>`". **STOP**.

#### Case B — No open PR

Ask via `AskQuestion`: **"Yes, create a PR"** / **"No, skip PR"**.

- No: "No PR. Run `gh pr create --base staging` later." **STOP**.
- Yes:
  - **Title**: commit subject without `[NOT-xxx]` suffix
  - **Body** template (populate from commit + Linear ticket):

    ```markdown
    ## Summary

    <2-4 bullets from commit body>

    ## Linear Ticket

    Closes <NOT-XXX> — <ticket title>

    ## Test Plan

    - [ ] Verify <primary change>
    - [ ] Check for regressions in <affected area>
    ```

  - Show proposed PR. `AskQuestion`: **"Looks good, create it"** / **"I want to edit"**.
  - Create with `gh` (target `staging`):

    ```bash
    gh pr create --base staging --title "<title>" --body "$(cat <<'EOF'
    <body>
    EOF
    )"
    ```

  - Report new PR URL.

## Behavior Rules

- Never force-push.
- Never push or create PRs without explicit confirmation.
- Never modify git config.
- If any step fails unexpectedly, report clearly and stop.
- Show what's happening at each major step.
- When creating Linear tickets: team `Noted`, state `In Progress`, assignee `me`.
- Linear MCP unavailable: warn, don't block — fall back to asking the user for ticket info.
