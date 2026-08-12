---
name: create-pr
description: Codex-compatible mirror of `/create-pr`. Use when the user asks for `/create-pr`, `$create-pr`, or wants the repo's PR creation workflow targeting `staging`. Read `.ai/commands/create-pr.md` and follow it as the source of truth.
summary: Open PR to `staging`
---

# Create PR

When invoked, read [../../commands/create-pr.md](../../commands/create-pr.md) and execute that workflow as written.

## Rules

- Treat the command file as canonical.
- In Codex, invoke this workflow with `$create-pr`.
- If the command file and this skill ever drift, update this skill to match the command.
