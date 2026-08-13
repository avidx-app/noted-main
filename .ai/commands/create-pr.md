---
description: Open a pull request targeting `staging` using the repo PR template
summary: Open PR to `staging`
---

# /create-pr

Creates a pull request targeting `staging` (not `main`).

## Instructions

1. Check for uncommitted changes with `git status --short`. If any exist, stage and commit them with a message describing what changed and why.
2. Push the current branch to the remote with `git push -u origin <branch>`.
3. Check if a PR already exists for this branch with `gh pr list --head <branch> --json url`. If one exists, push any new commits and report the existing URL — do not create a duplicate.
4. If no PR exists, create one with:

   ```bash
   gh pr create --base staging --title "..." --body "..."
   ```

   - Title: short summary of the change (under 70 chars), Conventional Commits prefix (`feat:`, `fix:`, `chore:`, `docs:`).
   - Body: use the repo PR template (`.github/pull_request_template.md`). Include summary, `Closes NOT-XXXX`, `/noted-review` verdict, and test plan.

5. Report the PR URL wrapped in a `<pr-created>` tag on its own line:
   ```
   <pr-created>https://github.com/owner/repo/pull/123</pr-created>
   ```

## Notes

- Always target `--base staging`. Never open PRs directly to `main`.
- Branch flow for this repo: feature branch → `staging` → `main`.
