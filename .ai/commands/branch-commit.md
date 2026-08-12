---
description: Infer a branch name and Conventional Commit from the diff, then branch and commit
summary: Branch + commit workflow
---

# /branch-commit

Looks at the local diff, infers a branch name and commit message, then branches, stages, and commits — no questions asked.

## Instructions

1. Run `git status --short` and `git diff HEAD` to understand what changed.
2. If the working tree is clean, tell the user and stop.
3. From the diff, infer:
   - **Branch name** — kebab-case, prefixed with `feat/`, `fix/`, `chore/`, or `docs/`. Should describe what changed (e.g. `feat/team-os`, `fix/auth-redirect`, `docs/claude-playbook`).
   - **Commit message** — Conventional Commits format: `type: short description`. One line, under 72 chars. Capture the *why*, not just the *what*.
4. Run in sequence:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b <inferred-branch-name>
   git add -A
   git commit -m "<inferred-message>\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
   ```
5. Report: branch name, commit hash, and file count changed.

## Notes

- Never ask the user for input — infer everything from the diff.
- Warn before committing if `.env` or credential files appear in the staging area.
- Never force-push or amend existing commits.
