---
name: metrics-define
description: Codex-compatible mirror of `/metrics-define`. Use when the user asks for `/metrics-define`, `$metrics-define`, or wants the repo's metric-definition workflow. Read `.ai/commands/metrics-define.md` and follow it as the source of truth.
summary: Define primary, secondary, guardrail, and anti-metrics
---

# Metrics Define

When invoked, read [../../commands/metrics-define.md](../../commands/metrics-define.md) and execute
that workflow as written.

## Rules

- Treat the command file as canonical.
- In Codex, invoke this workflow with `$metrics-define`.
- If the command file and this skill ever drift, update this skill to match the command.
- Not to be confused with the `metrics-definer` skill, which is the underlying structure this
  command invokes. `metrics-definer` defines the artifact; `/metrics-define` runs the workflow that
  produces and files it.
