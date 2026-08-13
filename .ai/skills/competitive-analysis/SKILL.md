---
name: competitive-analysis
description: Teardown a competitor's product decisions with specific, evidence-backed insights
summary: Competitor teardown
---

<!--
Adapted from aakashg/pm-claude-code-setup (MIT License, © 2026 Aakash Gupta).
Original: https://github.com/aakashg/pm-claude-code-setup/blob/main/.claude/skills/competitive-analysis/SKILL.md
Noted adjustments: save-path guidance, link to team-os/research/competitors/.
-->

# Competitive Analysis

## Trigger

Activate on "analyze competitor", "competitive analysis", "compare us to [company]", "teardown [product]".

## Behavior

### Step 1: Get context

Ask:
1. Which competitor?
2. Which product or feature to analyze?
3. Which angle of Noted to compare against? (AI, editor, collab, pricing)

### Step 2: Analyze

**What they built**
- Core functionality
- Target user
- Key differentiator

**What's smart**
- 3 decisions they nailed and why

**What's weak**
- 3 gaps or missed opportunities

**Implications for Noted**
- What to copy
- What to avoid
- Where to differentiate

### Step 3: Save

Save the output to `team-os/research/competitors/<slug>/teardown.md`. If the competitor folder doesn't exist yet, create it with at minimum a `tldr.md` alongside.

Add a row for this competitor to `team-os/research/competitors/CLAUDE.md` if not already listed.

## Examples

**Bad analysis (vague, no evidence):**
```
What's smart:
- Good product
- Nice onboarding
- Growing fast

What's weak:
- Missing features
- Could be cheaper
```

**Good analysis (specific, actionable):**
```
What's smart:
1. Freemium with usage-based upgrade trigger — free users hit the 5-project
   limit around week 3, right when switching cost is highest. Conversion
   to paid: ~8% (industry avg: 3–5%).
2. API-first architecture — 400+ marketplace integrations. Creates lock-in
   that UX improvements can't match.
3. AI summarization isn't better than ours, but they embedded it in the
   daily workflow (auto-summary after every meeting) instead of making it
   a standalone feature.

What's weak:
1. Enterprise pricing is opaque — requires "contact sales" for teams >50.
   Mid-market buyers (Noted's sweet spot) hate this. Opportunity: transparent
   pricing up to 200 seats would win deals they lose.
2. Mobile is read-only for most features — 34% of App Store reviews mention
   this. Their mobile MAU/DAU ratio is 0.3 vs. 0.6 on desktop.
3. No audit trail for compliance — dealbreaker for fintech and healthcare.
```

## Rules

- Be specific. "Great UX" is useless. Name the interaction and why it works.
- Flag unknowns with `[NEED: more info on X]`.
- Analyze product decisions, not visual design opinions.
- Include numbers: pricing, conversion rates, market share, review counts. Data beats opinion.
