---
name: user-research
description: Synthesize raw research notes into ranked, evidence-backed insights
summary: Synthesize research into insights
---

<!--
Adapted from aakashg/pm-claude-code-setup (MIT License, © 2026 Aakash Gupta).
Original: https://github.com/aakashg/pm-claude-code-setup/blob/main/.claude/skills/user-research/SKILL.md
Noted adjustments: save-path to team-os/research/deep-dives/, feedback-log integration.
-->

# User Research Synthesizer

## Trigger

Activate on "synthesize research", "analyze interviews", "research findings", "interview synthesis", "what patterns do you see in this feedback".

## Behavior

### Step 1: Get input

Ask:
1. Paste the research notes, interview transcripts, or feedback log entries — or point to a file path
2. What was the research question?
3. How many participants / sources?

### Step 2: Synthesize

**Key findings** (ranked by evidence strength)
For each:
- Finding (1 sentence)
- Evidence (how many participants, quotes)
- Confidence: High / Medium / Low
- Product implication

**Themes**

| Theme | Frequency | Representative quote | Implication |
|---|---|---|---|

**Surprises**
- What contradicted our assumptions

**Gaps**
- Questions not answered, segments not covered

**Recommended actions**
- Prioritized list with supporting evidence

### Step 3: Save

Save synthesis to `team-os/research/deep-dives/YYYY-MM-DD-<slug>.md`.

If the raw inputs came from the support feedback log, also update `team-os/support/top-issues.md` with any new patterns ranked highly.

## Examples

**Bad (no evidence, no confidence):**
```
Key findings:
- Users like the product
- Onboarding could be better
- Some people want more features
```

**Good:**
```
Key findings (ranked by evidence strength):

1. Users abandon onboarding at the "connect integrations" step
   Evidence: 7 of 10 participants hesitated or failed here. 4 said variants
   of "I don't want to give access to my data yet."
   Confidence: HIGH
   Implication: Move integrations to post-activation. Let users see value
   before asking for trust.

2. Power users create personal workarounds for batch editing
   Evidence: 3 of 10 (all daily users) showed custom keyboard shortcuts or
   browser extensions they built themselves.
   Confidence: MEDIUM (small sample of power users)
   Implication: Batch editing is a retention lever for the heaviest users.
   Worth exploring, but validate with usage data first.

Surprises:
- 6 of 10 didn't know search exists. It's behind Cmd+K with no visible entry
  point. Contradicts our assumption that search is well-adopted.

Gaps:
- No enterprise participants (>500 employees). Findings may not generalize.
- Pricing sensitivity wasn't explored — all participants were on free plans.
```

## Rules

- **Use actual quotes**, never paraphrases. Quotes are evidence. Paraphrases are interpretation.
- **Findings from 1–2 participants are signals, not conclusions.** Label them accordingly.
- **Distinguish said vs. did.** Behavior always outranks stated preference.
- **Every finding requires a confidence level AND a product implication.** A finding without "so what" is trivia.
