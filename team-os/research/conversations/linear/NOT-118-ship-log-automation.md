---
type: linear-issue
provenance: constructed
identifier: NOT-118
title: Automate ship-log entries from merged PRs
status: Backlog
created: 2026-02-11
assignee: null
labels: [team-os, chore]
---

# NOT-118 — Automate ship-log entries from merged PRs

> **Constructed issue.** This ticket was never open in a real tracker. It comes from the Vibe PM @
> Noted simulation. See [`../CLAUDE.md`](../CLAUDE.md).

**Status:** Backlog since 2026-02-11 · **Unassigned**

## Description

`team-os/features/*/ship-log.md` asks engineering to add a row after any merge that touches a
feature's code paths. Nobody does, because it is a manual step after the satisfying part is over.

Proposal: derive the row from the merged pull request. The information is all there — merge date,
author, title, the files touched, and `feature-index.yaml` already maps paths to features.

## Comments

**Hana** · 2026-02-11

> Worth doing and not this sprint. The honest reason the log is empty is that writing "what changed
> for the user" is a different skill from writing a commit message, and a bot cannot do the
> translation. It can do everything else.

**Sarah** · 2026-03-02

> Bumping. We are past fifty merged PRs with an empty log.

**Hana** · 2026-04-19

> Still worth doing, still not this sprint. `/ship-log` exists as a command, which makes it a
> one-liner for anyone who remembers.

## What this explains

The empty ship log is not an oversight anybody was unaware of. It has been a known, unassigned ticket
since February, and the reason it stays open is that the hard part of the task — saying what changed
for a user, rather than what changed in the code — is the part automation does not help with.

Count the merge history against the log yourself:

```bash
git log --merges --format=%s | grep -c "Merge pull request #"
```

[`../../../INTENTIONAL-GAPS.md`](../../../INTENTIONAL-GAPS.md) records the gap as deliberate.
Both things are true: it is deliberate now, and it started as a ticket nobody picked up.
