---
name: smoke-diff
description: Codex-compatible mirror of `/smoke-diff`. Use when the user asks for `/smoke-diff`, `$smoke-diff`, "smoke test my diff", "does my change work", or wants the diff proved before review. Read `.ai/commands/smoke-diff.md` and follow it as the source of truth.
summary: Prove the diff works, probe first
---

# Smoke Diff

When invoked, read [../../commands/smoke-diff.md](../../commands/smoke-diff.md) and execute that workflow as written.

## Rules

- Treat the command file as canonical.
- Write exactly one targeted probe, and write it before running the baselines.
- Never report a green baseline run as evidence the change works when no probe exists.
- In Codex, invoke this workflow with `$smoke-diff`.
- If the command file and this skill ever drift, update this skill to match the command.
