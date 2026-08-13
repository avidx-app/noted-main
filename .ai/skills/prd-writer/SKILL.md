---
name: prd-writer
description: Draft or refine a Noted PRD using the team-standard hand-off format with context, assumptions, scope, metrics, experiment design, and launch plan
summary: PRD structure
---

<!--
Adapted from aakashg/pm-claude-code-setup (MIT License, © 2026 Aakash Gupta).
Original: https://github.com/aakashg/pm-claude-code-setup/blob/main/.claude/skills/prd-writer/SKILL.md
Noted-specific adjustments: stage defaults, file paths, AI-feature guidance tuned to our stack.
-->

# PRD Writer

## Trigger

Activate on "write a PRD", "create a PRD", "draft a PRD", "PRD for [feature]", "spec out [feature]", "one-pager for [feature]", or when the user asks for a product hand-off.

## Context

The PRD isn't dead. The bad PRD is dead. Modern PRDs are lighter, sharper, example-heavy.

Core philosophy:

- **Think crisp, not complete.** Teammates crave clarity. Aim for a hand-off doc that can drive review without a meeting.
- **PRDs are for alignment, not dictation.** They drive discussion and decisions.
- **Nail the "why" and the "what," not the "how."**
- **Metrics and experiment design are part of the PRD, not add-ons.**
- **You don't write a PRD once.** Living document that evolves through stages.

## Behavior

### Step 1: Clarify before writing

Ask 3–5 clarifying questions before generating anything. Common gaps:

- Who specifically has this problem? (Not "users" — job title, use case, segment)
- What data do we have? (usage, support, revenue impact, customer quotes)
- Is this an existing feature change or a new feature?
- What is the primary metric, baseline, target, and timeframe?
- Is this an experiment, a feature-flagged rollout, or a direct launch?
- Who is eligible, when are they bucketed, and what is the decision criteria?
- Are there technical, data, design, or ops constraints already known?

For Noted specifically, also ask:

- Which product area: AI features, editor, collaboration, paywall, growth?
- Does this depend on Convex schema changes? Clerk auth changes? Blocknote extension?
- What Amplitude events, flags, dashboards, or sample data should be referenced?

Do NOT proceed until the user answers. Don't force a full PRD on an idea that needs discovery.

### Step 2: Determine PRD stage

| Stage               | When                               | Shape                                                   |
| ------------------- | ---------------------------------- | ------------------------------------------------------- |
| 1. Team Kickoff     | Exploring with design + eng        | Speclet — hypothesis + 2–3 open questions. A paragraph. |
| 2. Planning Review  | Presenting to leadership           | 1-pager: problem, strategic fit, data, initial approach |
| 3. XFN Kickoff      | Bringing in support, growth, legal | Expanded doc with cross-functional asks                 |
| 4. Solution Review  | Staking a position on the solution | Full PRD with flows, edge cases                         |
| 5. Launch Readiness | Engineering handoff                | Concrete specs, metrics, rollout                        |
| 6. Impact Review    | Post-launch learning               | Results link at top, what worked / didn't               |

Default to Stage 4 unless user specifies. Regardless of stage, use the hand-off format in `team-os/templates/prd.md`; for early stages, leave unknowns as `[NEED: owner/source]` instead of inventing details.

### Step 3: Generate the PRD

Every section earns its place. If a section doesn't drive a decision or prevent a mistake, cut it.

Use the template at `team-os/templates/prd.md` as the skeleton. The required format is:

**Header**

- `# Hand off: [Feature Name] PRD ([Existing feature | New feature])`
- TL;DR aside with the primary product bet and target metric.
- Slack, Designs, and Dashboard asides. Use `[add link]` when missing.

**Context**

- What problem is being solved and how critical it is.
- Proposed solution, split near-term vs long-term when useful.
- Customer value.
- Business value.
- Previous attempts and what happened.

**Key assumptions**

- Bullet assumptions with validation status.
- Mark each as validated, partially validated, or pending validation.
- Name the owner/source for pending validation.

**Objectives**

- Primary metric with target, baseline, source, and timeframe.
- Check metrics and guardrails.
- If metrics are missing, write `[NEED: baseline/source]`.

**Design scope**

- Customer segment.
- User goals.
- Customer experience.
- Impacted devices/surfaces.
- Include a Mermaid flowchart when the flow has multiple states or decision points.

**Eng scope**

- Customer-visible flow changes.
- Logic/data/model changes.
- New paths/events that need to be logged.
- Feature flag key and fallback when applicable.
- For AI features in Noted: model provider(s), Convex tables, streaming vs one-shot behavior, 15–25 input/output examples, edge cases, rejection criteria.

**Data scope**

- Data coverage, quality, accuracy, dashboard, and analysis questions.
- Explicitly call out what must be answered before experiment readout.

**Ops scope**

- Customer Success, Ops, Sales, Legal, or Support changes.
- Process changes and proactive responses.

**Experiment design**

- What are we trying to learn?
- Eligibility.
- Bucketing moment and ratio.
- Primary metric.
- Check metrics and guardrails.
- Sample size needed and confidence level.
- Expected runtime.
- Decision criteria for rollout, rollback, or iteration.
- If this is not an A/B experiment, state the rollout learning plan instead of deleting the section.

**Launch plan**

- Dates or placeholders for internal testing, demo, launch, readout, and decision.
- Owner per milestone when known.

### Step 4: Self-check against stage

**Planning:**

- [ ] Problem with segment?
- [ ] Current state documented?
- [ ] Primary metric, check metrics, and guardrails identified?
- [ ] Qualitative evidence?
- [ ] Key assumptions separated from validated facts?

**Solution Review:**

- [ ] Edge cases identified?
- [ ] Experiment or rollout plan decided?
- [ ] XFN requirements (legal, support, marketing) specified?
- [ ] Tracking events defined?
- [ ] Dashboard or readout plan linked?

**Launch Readiness:**

- [ ] Engineering concerns addressed?
- [ ] Design complete?
- [ ] Tasks created?
- [ ] Support brief + FAQ ready?
- [ ] QA plan?
- [ ] Decision criteria written before launch?

### Step 5: Review offer

After generating, offer:

- "Want me to review this as an engineer, designer, or skeptic?"
- "Want me to tighten this into a 1-pager for leadership?"
- "Want me to pressure-test the experiment design or metric definitions?"

## Anti-patterns

- **Fancy structure, empty content.** Filler like "Ensuring alignment with legal standards" instead of naming the legal risk.
- **Delegating your thinking.** "Design will explore the optimal layout" instead of describing the flow yourself.
- **No customer evidence.** Zero quotes, zero tickets, zero data = vibes.
- **Hiding controversial decisions.** If A vs B was a close call, say so and explain why you chose.
- **Metrics without baselines.** A metric without a baseline is a wish.
- **Experiment theater.** Running an experiment without eligibility, sample size, decision criteria, or guardrails.
- **Ending at launch.** Add Stage 6 results after launch closes the loop.
- **Over-specifying the "how".** Engineers and designers are creative problem solvers. Obsess over the "why" and "what."
- **Writing for every audience at once.** Be stage-appropriate.

## Rules

- **Think crisp, not complete.** Under 2 pages unless user asks for more.
- **Flag missing info** with `[NEED: data from X]`. Never fabricate data, customer quotes, or metrics.
- **Use specific numbers.** Not "improve engagement" — "increase 7-day activation from 23% to 35%."
- **Assumptions go early.** Separate facts, validated assumptions, and pending validation.
- **Experiment design is required.** If there is no A/B test, write the rollout learning plan and decision criteria.
- **For AI features**: include a behavior section with input/output examples, edge cases, and rejection criteria.
- **A strong PRD aligns the team without a meeting.** If reading it still needs a 30-minute walkthrough, it's not done.
- **Save PRDs to `team-os/product/prds/<area>/<slug>-prd.md`.** Link from the feature dossier if the feature is live.
