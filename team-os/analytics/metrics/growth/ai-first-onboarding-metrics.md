---
type: metrics
feature: ai-first-onboarding
prd: team-os/product/prds/growth/ai-first-onboarding-prd.md
status: not-yet-measurable
owner: raziiabraham
last_updated: 2026-08-13
---

# Metrics — AI-first onboarding

Status is `not-yet-measurable` on purpose. Three of the four metrics below need events that do not
exist, and the baseline for the primary metric comes from seeded data. Filing this now, honestly, is
the point: the PRD asks for a 50/50 experiment, and this is the document that says the experiment
cannot read out yet.

Events that exist today are the seventeen in [`lib/analytics.ts`](../../../../lib/analytics.ts).
Anything not in that file is marked `[NEEDS INSTRUMENTATION]`.

## Primary

**Second document within 7 days** — of users whose first document is created in week _w_, the share
who create a second document within 7 days of the first.

- **Source:** `Document Created` (exists). Cross-check against the Convex `documents` table by
  `userId` and `_creationTime`.
- **Baseline:** 92–96%. **Seeded, not production.** It comes from `scripts/fixtures/`, which was
  generated to support the `power_user_publish_rate` and `chat_to_publish_gap` questions — not to
  reproduce a real activation curve. Treating it as a real baseline is the single most likely way to
  misread this experiment.
- **Target:** `[NEED: target from product]`
- **The problem with this metric:** at a 92–96% baseline there is at most 4–8 points of headroom, so
  a meaningful lift needs a sample this product does not have. It is the PRD's primary metric because
  it is the one measurable today, which is not the same as it being the right one. See the readiness
  verdict below.

## Secondary

**First-session AI activation** — share of new users who trigger any AI surface in their first
session.

- **Source:** `Coworker Message Sent` (exists) covers the Coworker panel only. In-editor `/Ask AI`
  emits nothing. `[NEEDS INSTRUMENTATION: In-Editor AI Triggered]`
- **Why it matters:** it moves faster than the primary metric and is not near a ceiling, so it is the
  better read on whether intent-first framing works.

**Onboarding completion** — of users shown the intent prompt, the share who answer and land in a
created document.

- `[NEEDS INSTRUMENTATION: Onboarding Intent Prompt Shown, Onboarding Intent Submitted, Onboarding Starter Document Created]`
- Cannot be computed at all today. The prototype emits nothing.

## Guardrails

| Guardrail                                         | Source                                       | Status                         |
| ------------------------------------------------- | -------------------------------------------- | ------------------------------ |
| First-document creation rate does not fall        | `Document Created`                           | Measurable                     |
| Time to first editable document does not increase | first `Document Created` minus session start | `[NEED: acceptable threshold]` |
| Skip rate does not indicate confusion             | `Onboarding Intent Skipped`                  | `[NEEDS INSTRUMENTATION]`      |
| Support contacts tagged onboarding do not rise    | support tagging                              | No support tagging exists      |

## Anti-metric

**Onboarding completion rate going up while first-session AI activation stays flat.**

If more people finish the intent prompt but no more of them go on to use AI, the prompt has become a
form to get past rather than a way in — and because completion is the easiest number to move, it is
the one most likely to be quoted as success. A rising completion rate with flat activation should be
read as the prompt teaching compliance, not value.

Second-order: **starter documents created going up while second-document rate stays flat** means the
feature manufactures first documents rather than habits. The primary metric would not catch it,
because the starter document _is_ the first document.

## Readiness verdict

**Not ready to run.** In order:

1. Add the five onboarding events and `In-Editor AI Triggered`. Without them, three of four metrics
   are uncomputable and the funnel in the PRD's data scope cannot be built.
2. Verify `Document Created` fires from every creation path — sidebar, empty state, and the
   onboarding path. The PRD raises this as an open question and it is still open.
3. Replace the seeded baseline with a real one, or change the primary metric. A target set against
   92–96% seeded data is a target against a number that describes a fixture.
4. Only then size the sample. Given the ceiling problem, expect first-session AI activation to be
   the metric that actually decides this.
