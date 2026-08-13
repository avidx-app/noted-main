---
type: prd
feature: ai-features
stage: 6 # Impact Review
status: retrospective
owner: raziiabraham
last_updated: 2026-08-13
note: The four-outputs pivot. Records a scope decision and why the original framing did not survive the code.
---

# PRD: AI Agent — The Four-Outputs Pivot

**Author:** raziiabraham
**Date (first draft):** 2025-12-26 (as `specs/04-ai-agent.md`, migrated into this retrospective on 2026-04-18; see git history before 2026-04-18 for the original)
**Date (retrospective rewrite):** 2026-04-18
**Status:** **Stage 6 — Impact Review** (original framework not built; simpler alternative shipped)
**Feature index entry:** [`ai-features` in team-os/feature-index.yaml](../../../feature-index.yaml)
**Current-state dossier:** [`team-os/features/ai-features/`](../../../features/ai-features/)

> This is a short retrospective on a scope pivot. The original spec described a "four-outputs" agent framework tied to an Adology MCP integration. That vision was not built. What shipped is a simpler workspace-tool agent loop. This PRD captures the _why_.

---

## Original plan (as of Dec 2025)

The spec described:

- An agent framework with **four output types**: feeds, collections, briefings, creative outputs.
- Integration with **Adology MCP** as an external tool source.
- A `ToolLoopAgent` from the AI SDK orchestrating long-running workflows.

## What actually shipped

- A simple agent loop using `streamText` + `stepCountIs(5)` (same behavior as `ToolLoopAgent`, different API surface).
- **Workspace-only tools**: read, write, edit, list, search documents. No external tool integrations.
- **No four-outputs distinction**. Agents just answer in the chat panel; if they need to produce a document, they use the `write` tool.
- **No Adology MCP**. The code has no MCP client wiring.

See [`team-os/features/ai-features/index.md#sub-feature-4-squad-agents`](../../../features/ai-features/index.md) for current implementation details.

## Why the pivot

1. **The four-outputs abstraction was over-designed for the actual user need.** Users just wanted "an agent I can chat with that can touch my docs." A single output type (a chat message, optionally producing documents as a side effect) covers that without a taxonomy.
2. **Adology MCP never materialized as a production dependency.** Building around a not-yet-real external system would have blocked shipping.
3. **Workspace-only tools were enough to prove the loop.** Agents that read and write your docs are meaningfully useful. External tools (Slack, Linear, etc.) are a "nice to have when someone asks."

## What this decision costs us

- **No "briefing" or "feed" experience.** If a user wanted an agent that produces a daily digest automatically, that's not native today. They'd write a doc and ask an agent to fill it.
- **No cross-system automations.** Because we skipped MCP, an agent can't (say) summarize a Linear issue or post to Slack. Manual today.

## When we'd revisit

- If users actively ask for external-tool integrations in support tickets or interviews. Log in [`team-os/support/feedback-log/`](../../../support/) when this comes up.
- If we decide to pursue "Noted-as-an-AI-workspace" (beyond note-taking) as a positioning angle. Not current strategy — see [`team-os/product/positioning.md`](../../positioning.md).

## Lessons

- **Frameworks are expensive.** The four-outputs taxonomy was conceptual scaffolding that didn't survive contact with the code. When in doubt, ship the primitive and let taxonomies emerge.
- **External dependencies are a tax on shipping.** Planning a product around an MCP integration that didn't exist delayed the agent work. Better pattern: ship with internal-only tools, add external integrations once user demand is proven.

---

_Historical source: `specs/04-ai-agent.md` (removed 2026-04-18; see git history for the original Dec 2025 version). Superseded by this retrospective + the current dossier._
