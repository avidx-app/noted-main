---
description: Get a one-shot answer about a feature's current state, talking points, and recent ships
summary: Feature status from dossier + ship log
argument-hint: "[feature slug or name]"
---

# /feature-status

Give a non-engineer a complete, cite-backed answer about where a feature stands.

## Instructions

1. If the user passed an argument, use it as the feature query. Otherwise ask which feature.
2. Invoke the `feature-status` skill — it will:
   - Resolve to a feature in `team-os/feature-index.yaml`
   - Read `features/<slug>/status.md`, `customer-talking-points.md`, `faq.md`, `ship-log.md` as needed
   - Produce a formatted status message with sources and a staleness warning if applicable
3. If the feature has no dossier, offer to scaffold one from `team-os/templates/feature-dossier/`.
4. Output should fit in a Slack message unless the user asked for depth.
