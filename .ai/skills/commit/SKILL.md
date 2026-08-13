---
name: commit
description: Codex-compatible mirror of `/commit`. Use when the user asks for `/commit`, `$commit`, or wants the repo's commit workflow with validation, review, and commit steps. Read `.ai/commands/commit.md` and follow it as the source of truth.
summary: Pre-commit quality gate
---

# Commit

When invoked, read [../../commands/commit.md](../../commands/commit.md) and execute that workflow as written.

## Rules

- Treat the command file as canonical.
- In Codex, invoke this workflow with `$commit`.
- If the command file and this skill ever drift, update this skill to match the command.
