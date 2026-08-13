---
description: Scaffold a new hand-off PRD using team-os conventions
summary: Draft a new PRD
argument-hint: "[area/slug or free-form feature name]"
---

# /prd-new

Scaffold a new hand-off PRD in `team-os/product/prds/<area>/<slug>-prd.md`.

## Instructions

1. If the user passed an argument, interpret it as `area/slug` (e.g., `ai-features/ai-templates`). If only a free-form name is given, ask which area it belongs to: `ai-features`, `editor`, `collaboration`, `paywall`, `growth`.
2. Invoke the `prd-writer` skill — it will ask clarifying questions first and use the hand-off template at `team-os/templates/prd.md`.
3. Save the draft at `team-os/product/prds/<area>/<slug>-prd.md`.
4. Append a line to the "PRDs" row in `team-os/feature-index.yaml` under the matching feature if one exists; otherwise add a new feature entry with `status: planned`.
5. Tell the user: the path of the new file, the next question to answer, and who to tag for review.

Do not write a full PRD without clarifying questions. Don't skip that step.
