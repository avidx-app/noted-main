---
type: linear-issue
provenance: constructed
identifier: NOT-141
title: Comment-only share link for a single reviewer
status: Cancelled
created: 2026-05-01
closed: 2026-05-06
assignee: Hana
labels: [collaboration, discovery]
---

# NOT-141 — Comment-only share link for a single reviewer

> **Constructed issue.** This ticket was never open in a real tracker. It comes from the Vibe PM @
> Noted simulation. See [`../CLAUDE.md`](../CLAUDE.md).

**Status:** Cancelled · **Closed** 2026-05-06 · **Assignee:** Hana

## Description

Seven of eleven April transcripts describe the same gap: a user drafts, reaches something worth
showing, wants exactly one person to read it, and the only available control publishes the document
to the public web.

Smallest slice that resolves it:

- A draft can be shared with one named recipient.
- The recipient can read it and leave a comment.
- The recipient does not have to create an account. **This is the constraint that matters** — Carlos
  was explicit that being asked to join the product to do someone a favour is the reason he does not.
- The owner can revoke.

Out of scope: teams, roles, real-time collaboration, presence, anything resembling the
`team-collaboration` PRD.

## Comments

**Hana** · 2026-05-04

> Scoped in `#engineering`. Needs a `shares` table, a `comments` table, and an unauthenticated read
> path, because every document read currently goes through `getUserIdentity()`. Three weeks, and the
> security review on the read path is the part I would not want to rush.

**Sarah** · 2026-05-06

> Cancelling for this cycle. The recipient cannot read a document without an account, so there is no
> two-day version, and onboarding is a week and measurable. Revisit when we build the members table
> for teams.
>
> Recording that this is a sequencing decision, not a judgement that the pain is small. It is the
> most-raised pain in the landscape.

## Why this one is worth reading twice

The scope is nearly right. The constraint at the top — *the recipient does not have to create an
account* — is the correct constraint, taken straight from a transcript.

It was cancelled on the claim that meeting that constraint requires new infrastructure. Open
[`convex/documents.ts`](../../../../convex/documents.ts) before you accept that.
