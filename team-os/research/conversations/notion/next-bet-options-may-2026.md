---
type: notion-page
provenance: constructed
title: Next bet — options
author: Sarah
date: 2026-05-01
last_edited: 2026-05-01
status: never-moved-to-team-os
---

# Next bet — options

> **Constructed page.** This document was never in a real Notion workspace. It comes from the Vibe PM
> @ Noted simulation. See [`../CLAUDE.md`](../CLAUDE.md).

Written 1 May, the day after the `#product` thread, and never edited again. This is the working
version — the one where the reasoning is still visible.

## The three candidates

| | Pain | Evidence | Cost | Measurable today |
| --- | --- | --- | --- | --- |
| **A · Draft review bridge** | 1 — no step between private draft and public page | 7 of 11 | ~3 weeks | No |
| **B · AI-first onboarding** | 2's sibling — value before configuration | 5 of 11 | ~1 week | Partly |
| **C · Squad key-free trial** | 2 — Squad asks for config before it gives value | 5 of 11 | ~2 weeks | No |

## How I actually decided

Honestly: on the last column.

A is the biggest finding and I cannot tell whether it worked. We have no publishing-intent
instrumentation at all — the only publish event is `Document Published`, which fires after the
decision I care about. So shipping A means shipping it and then having an argument about vibes.

B is the one where a number moves. `Document Created` exists. That is a thin reason to pick a feature
and it is the reason.

C is interesting and I am dropping it because A and B both beat it on evidence.

## What I am uneasy about

Three things, written down so I cannot pretend later that I did not know.

1. **I am choosing by measurability, not by size of pain.** That is defensible once. It is not
   defensible as a pattern, because it systematically favours whatever is already instrumented, and
   what is already instrumented is whatever we happened to build first.
2. **B's primary metric has a ceiling.** Second-document-within-7-days sits at 92–96% in the seeded
   data. Even if that number were real there is almost no headroom, so a lift will not be visible at
   our volume. I am picking the measurable option and its measurement may not work either.
3. **Nobody asked for comments.** Priya was clear — customers ask to *send it to someone*. The
   commenting half of A is our invention, and A's cost estimate is mostly the commenting half. So A
   may be much cheaper than three weeks if we cut the part nobody requested.

Point 3 is the one I should chase and I am not going to this week.

## What happened to this page

Nothing. It was not moved into `team-os/`, so the reasoning above is not in the repo, and
[`../../pain-landscape.md`](../../pain-landscape.md) later reconstructed the decision as "Pain 1 needs
a permissions model nobody has designed" — which is a reason, and not this one.
