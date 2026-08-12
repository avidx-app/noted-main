---
name: launch-checklist
description: Risk-scaled pre/launch/post checklist for shipping a Noted feature
summary: Pre/post launch checklist
---

<!--
Adapted from aakashg/pm-claude-code-setup (MIT License, © 2026 Aakash Gupta).
Original: https://github.com/aakashg/pm-claude-code-setup/blob/main/.claude/skills/launch-checklist/SKILL.md
Noted adjustments: feature-dossier + ship-log integration, Convex-specific items.
-->

# Launch Checklist

## Trigger

Activate on "launch checklist", "pre-launch check", "ready to launch?", "launch prep", "what do I need before shipping X?".

## Behavior

### Step 1: Get context

Ask:
1. What's launching?
2. Launch date (and day of week)?
3. How many users affected?
4. Risk level: low / medium / high?

### Step 2: Generate checklist (scaled to risk)

**Pre-launch**
- [ ] Feature complete and QA'd
- [ ] Rollback plan documented and tested
- [ ] Success metrics defined with baselines (see `team-os/analytics/metrics/`)
- [ ] Feature dossier exists at `team-os/features/<slug>/` with status + talking points + FAQ
- [ ] Support briefed (FAQ + macros updated in `team-os/support/`)
- [ ] Release notes drafted
- [ ] Feature flag configured (if gradual rollout)
- [ ] For Convex schema changes: migration tested locally, staging, production rollback verified
- [ ] For AI-model changes: eval suite run, cost/latency checked across OpenAI, Anthropic, Google as applicable

**Launch day**
- [ ] Deploy during low-traffic window (not Friday)
- [ ] Verify metrics instrumentation is emitting
- [ ] Monitor error rates in Convex + Next.js for 2 hours
- [ ] Send internal launch comms (who's on-call, rollback command, monitoring link)
- [ ] Publish release notes
- [ ] Append entry to `team-os/features/<slug>/ship-log.md` (use `/ship-log`)

**Post-launch (48 hours)**
- [ ] Primary metric vs baseline — is it moving?
- [ ] Guardrail metrics holding?
- [ ] Support tickets for new issues reviewed
- [ ] Initial results shared with team

**Post-launch (1 week)**
- [ ] Full metrics review
- [ ] Ship-or-iterate decision
- [ ] `team-os/features/<slug>/status.md` updated with learnings
- [ ] If significant regression: retro doc in `team-os/team/retros/`

## Risk scaling

| Level | When | What to add |
|---|---|---|
| **Low** | Config, copy, small UI tweak | Deploy, monitor 30 min, done |
| **Medium** | New feature behind flag, migration with rollback | Full checklist above. 2-hour monitoring |
| **High** | Pricing change, auth flow, data migration, public API | Everything + staged rollout (1% → 10% → 50% → 100%), war-room channel, 24-hour monitoring |

## Good vs bad checklist items

**Bad:** "Make sure everything works"
**Good:** "Verify sign-up flow end-to-end in staging (email → Clerk verification → first doc creation in Convex). Test with Gmail, Outlook, and corporate SSO."

**Bad:** "Tell the team"
**Good:** "Post in #launches: what shipped, who's on-call, rollback command, monitoring dashboard link."

**Bad:** "Watch metrics"
**Good:** "Monitor error rate in Convex Dashboard for 2 hours post-deploy. Baseline: 0.3%. Alert: 0.5%. Rollback: 1.0%."

## Rules

- Higher risk = more items. Scale.
- Every item has an owner and a time (not "soon").
- Never launch on Friday afternoon.
- If rollback takes >5 minutes, add more testing time.
- Every item is verifiable — someone can confirm it, not just feel it.
