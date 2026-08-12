---
description: Define primary, secondary, guardrail, and anti-metrics for a Noted feature
summary: Define primary, secondary, guardrail, and anti-metrics
argument-hint: "[area/feature, e.g. ai-features/ai-squad]"
---

# /metrics-define

Produce a metric definition at `team-os/analytics/metrics/<area>/<feature>-metrics.md`.

Metric definitions are a **launch-gate requirement** — a feature is not ready to ship without one
(`team-os/engineering/constitution.md` §IX, `team-os/analytics/CLAUDE.md`).

## Instructions

1. If the user passed an argument, interpret it as `area/feature` (e.g. `ai-features/ai-squad`).
   If only a free-form name is given, ask which area it belongs to: `ai-features`, `editor`,
   `collaboration`, `paywall`, `growth`.
2. Invoke the `metrics-definer` skill. It will ask for the goal, the acceptable time-to-learn, and
   what event data already exists — do not skip those questions.
3. Ground every metric in something that actually emits today. The two sources of truth are
   `lib/analytics.ts` (the typed `track*` helpers, which are the complete list of Amplitude events
   Noted sends) and `convex/schema.ts` (tables and indexes). If a metric needs an event that does
   not exist yet, mark it `[NEEDS INSTRUMENTATION]` and name the helper that would have to be
   added — do not quietly assume it is there.
4. Save to `team-os/analytics/metrics/<area>/<feature>-metrics.md`.
5. Add the metric file to the feature's dossier `index.md` under its linked-artifacts list, and to
   `team-os/feature-index.yaml` if the feature has an entry.
6. Tell the user which metrics are measurable today and which are blocked on instrumentation.

## Rules

- **Anti-metrics are mandatory.** A definition without one is not finished.
- **Every metric names its source** — a specific Amplitude event, a Convex table, or a field.
  "Engagement" is not a metric.
- **Every metric has a baseline, or says `N/A (new feature)` explicitly.** A target without a
  baseline is a wish.
- Never invent a number. If the baseline is unknown, write `[NEED: data from X]` and say who would
  pull it.
