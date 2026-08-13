---
name: metrics-definer
description: Define primary, secondary, guardrail, and anti-metrics for a Noted feature
summary: Primary/secondary/guardrail metrics
---

<!--
Adapted from aakashg/pm-claude-code-setup (MIT License, © 2026 Aakash Gupta).
Original: https://github.com/aakashg/pm-claude-code-setup/blob/main/.claude/skills/metrics-definer/SKILL.md
Noted adjustments: save-path to team-os/analytics/metrics/, Convex event source guidance.
-->

# Metrics Definer

## Trigger

Activate on "define metrics", "what should I measure", "success metrics for [feature]", "KPIs for [initiative]".

## Behavior

### Step 1: Get context

Ask:
1. What feature or initiative?
2. What's the goal — activation, retention, conversion, revenue?
3. What event data do we already emit? (Check `convex/schema.ts` + any analytics integrations.)
4. What's an acceptable baseline time-to-learn — 1 week, 1 month, 1 quarter?

### Step 2: Define

**Primary metric**
- Name, exact definition, measurement method (which Convex table, which event, which query), target, timeframe

**Secondary metrics (2–3)**
- Name, definition, why it matters (supports or contextualizes primary)

**Guardrail metrics (2–3)**
- What should NOT get worse. Current baseline + acceptable range.

**Leading indicators**
- What to measure in week 1 that predicts long-term success

**Anti-metrics**
- What going UP would actually be bad (e.g., session length going up because users can't find what they want)

### Step 3: Save

Save to `team-os/analytics/metrics/<area>/<feature>-metrics.md`. Add a row to the area's index if there is one.

## Examples

**Bad (vague, unmeasurable):**
```
Primary: Engagement
Secondary: User satisfaction
Guardrail: Performance
```

**Good (precise, measurable):**
```
Primary metric:
- Name: 7-day AI-Squad activation rate
- Definition: % of users who send at least 3 messages to any squad agent
  within 7 days of first opening the coworker panel
- Measurement: Convex table `coworkerMessages`, filtered by role='user' and
  agentId != null, grouped by userId + week cohort. Query to live in
  team-os/analytics/queries/ai-features/squad-activation.md.
- Baseline: N/A (new feature)
- Target: 25% within 90 days of launch
- Timeframe: measured weekly, evaluated at 90 days

Guardrails:
- Convex function error rate stays under 1% for /api/ai/coworker
- AI spend per active user stays under $X/month
- Support tickets tagged "ai-squad" stay below 15/week

Anti-metric:
- Messages per active squad user going UP could be bad if it means users
  are retrying failed requests. Cross-reference with completion rate.
```

## Rules

- Every metric has a precise definition. "Engagement" without specifics is not a metric.
- Flag metrics needing new instrumentation with `[NEEDS INSTRUMENTATION]` — for Noted, that usually means a new Convex event or field.
- Always name the data source: a Convex table, a specific event, a specific field.
- **Anti-metrics are mandatory.** If you cannot identify one, you have not thought hard enough about perverse incentives.
