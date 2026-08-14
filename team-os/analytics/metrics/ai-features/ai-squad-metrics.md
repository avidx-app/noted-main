---
type: metrics
feature: ai-features
prd: team-os/product/prds/ai-features/ai-features-prd.md
status: partially-measurable
owner: raziiabraham
last_updated: 2026-08-13
---

# Metrics — AI features

The AI features shipped before instrumentation did. The Stage 6 retrospective says so plainly:
_"we do not currently instrument AI usage"_. This file records what can be measured now, what still
cannot, and what the numbers would and would not mean.

Events that exist are the ones in [`lib/analytics.ts`](../../../../lib/analytics.ts). Anything else
is `[NEEDS INSTRUMENTATION]`.

## Primary

**Provider configuration rate** — share of active users who have configured at least one AI provider
key.

- **Source:** the `aiSettings` Convex table, indexed `by_user`. Also `AI Settings Updated` for the
  moment of change.
- **Baseline:** `[NEED: query against production Convex]`
- **Why it is the primary:** BYOK is the product's differentiator and its first gate. A user with no
  key cannot experience the thing that makes Noted different from a plain editor.
- **Known weakness:** it measures a setup step, not value. Someone can configure a key and never use
  AI again. Pair it with the activation metric below rather than reading it alone.

**7-day AI Squad activation** — of users who open the Coworker panel, the share who send at least
three messages to any squad agent within 7 days.

- **Source:** `coworkerMessages`, filtered `role='user'` and `agentId != null`, grouped by user and
  week cohort. `Coworker Message Sent` covers the event side.
- **Baseline:** `[NEED: query against production Convex]`
- **Why three messages:** one message is a trial, two is a retry. Three is the first count that
  suggests a loop rather than a look. That threshold is a judgment, not a finding — if it is ever
  used to make a real decision, test its sensitivity first.

## Secondary

**AI surface split** — `In-Editor AI Triggered` versus `Coworker Message Sent`, per user per session.

- **Source:** both events exist. `In-Editor AI Triggered` was added by
  [`specs/EXP-1-in-editor-ai-triggered/`](../../../../specs/EXP-1-in-editor-ai-triggered/spec.md).
- **Why it matters:** the two surfaces do different jobs, and customers describe the split
  unprompted — `/Ask AI` for a known local operation, Coworker for "I don't know what I think yet".
  Merging them into "used AI" throws away the most actionable thing the data can say.
- **Forward-only:** no history exists before the event shipped.

**Provider mix** — which of OpenAI, Anthropic and Google users actually pick.

- **Source:** `AI Settings Updated` with `ai_provider`, plus the `aiSettings` table.
- **Why it matters:** multi-provider support was a real engineering investment. If everyone picks the
  default, that investment bought a story rather than a capability.

## Guardrails

| Guardrail                                    | Source                                                          | Status                                                      |
| -------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| Convex function error rate for the AI routes | Convex dashboard                                                | Available, outside Amplitude                                |
| Provider test failures                       | `AI Provider Tested` with `success: false` and `error_category` | Measurable                                                  |
| AI spend per active user                     | —                                                               | Not applicable: BYOK, the user pays their provider directly |
| Support contacts about AI                    | support tagging                                                 | No support tagging exists                                   |

## Anti-metric

**Messages per active squad user rising while completion rate falls.**

More messages looks like engagement and can equally mean people re-asking because the first answer
was wrong. The retrospective already names this one. It cannot be evaluated today, because there is
no completion or outcome event to divide by — so the anti-metric is currently
**unwatchable**, which is worth stating rather than listing it as though it were monitored.

`[NEEDS INSTRUMENTATION: an AI outcome event — accepted, rejected, or retried]`

Second-order: **provider configuration rate rising while activation stays flat** would mean onboarding
has got better at pushing people through a setup step without making the step worth taking.

## What these numbers cannot tell you

Nothing here distinguishes a user who got something useful from one who got something plausible. The
transcripts raise this directly — _"AI can make mediocre ideas sound coherent enough that you stop
interrogating them"_ — and no event in this repo can see the difference. Any claim that AI is
"working" based on the metrics above is a claim about usage, not about value.
