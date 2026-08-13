---
type: linear-issue
provenance: constructed
identifier: NOT-152
title: AI-first onboarding prototype
status: Done
created: 2026-05-07
closed: 2026-05-20
assignee: Hana
labels: [growth, prototype]
---

# NOT-152 — AI-first onboarding prototype

> **Constructed issue.** This ticket was never open in a real tracker. It comes from the Vibe PM @
> Noted simulation. The pull requests it references are real and can be checked.
> See [`../CLAUDE.md`](../CLAUDE.md).

**Status:** Done · **Closed** 2026-05-20 · **Assignee:** Hana

## Description

Ask a new user what they are trying to write, then put them into a document with a structure that
matches. Tests one thing: whether intent-first framing is understood and wanted.

Explicitly a research instrument, not a feature. No eligibility check, no flag, no generation, no
instrumentation. Boundary written up separately before anyone demos it.

## Comments

**Sarah** · 2026-05-07

> Chosen over [NOT-141](NOT-141-comment-only-share-link.md) because it is a week and it is
> measurable. See `#product` 29 April.

**Hana** · 2026-05-14

> Prototype up. Five scaffolds, keyword-matched. Generation is a 1.8 second timer. Nothing is
> persisted and "Open in editor" goes to `/documents`, because there is no document.

**Sarah** · 2026-05-20

> Closing. The route is in the tree and the boundary doc is written.

## Cross-check this one against the merge history

The ticket says Done. What landed, and when, is a separate question the tracker cannot answer:

```bash
gh pr list --state all --search "onboarding"
```

**PR #79, `feat: add AI-first onboarding prototype`, was closed without merging.** The route reached
`main` later, by a different path, alongside the research layer it should have had from the start —
which is also when
[`prototype-boundary.md`](../../../product/prds/growth/prototype-boundary.md) and
[`ai-first-onboarding-metrics.md`](../../../analytics/metrics/growth/ai-first-onboarding-metrics.md)
were written.

A closed ticket and a merged pull request are different facts. One of them is in a tracker somebody
maintains, and the other is in the history.
