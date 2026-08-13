---
description: Generate a new market pulse for the note-taking + AI-editor space
summary: Market scan workflow
argument-hint: "[period: weekly | biweekly | monthly]"
---

# /market-scan

Produce a structured pulse in `team-os/research/market-pulse/YYYY-MM-DD-pulse.md`.

## Instructions

1. Invoke the `market-pulse` skill.
2. If no period was provided, ask. Default to time since the last pulse in `team-os/research/market-pulse/`.
3. Use WebFetch/WebSearch to gather signals (Anthropic / OpenAI / Google releases; competitor blogs; pricing pages; press releases). Cite URLs for every non-obvious claim.
4. Save to `team-os/research/market-pulse/YYYY-MM-DD-pulse.md`.
5. If any signal suggests a PRD-worthy opportunity, surface it at the end of the pulse.
