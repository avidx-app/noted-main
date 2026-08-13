---
type: slack-thread
provenance: constructed
channel: "#product"
date: 2026-04-29
participants: [Sarah, Hana, Priya]
subject: what do we do next
---

# #product — what do we do next

> **Constructed thread.** This conversation did not happen. It comes from the Vibe PM @ Noted
> simulation and exists so the discovery workflow has a conversational record to work on. Realistic,
> not real. One claim in it is wrong; see [`../CLAUDE.md`](../CLAUDE.md).

**Sarah** · 09:12

> Pain landscape is done, eleven transcripts in. Top of the list is not close: seven of eleven
> describe the same shape. They draft, they get to something worth showing, they want one person to
> read it, and the only control we have is a switch that puts it on the public internet.
>
> Second is the Squad asking for a provider key before it does anything, five of eleven.
>
> I think we do the draft review bridge.

**Hana** · 09:31

> Before we commit — do we know what "one person reads it" costs us? Because right now a document is
> readable by exactly one identity, the owner. Convex gates every read behind
> `ctx.auth.getUserIdentity()`. If a reviewer has to open a doc, the reviewer needs an account, and
> if the reviewer needs an account we are building the whole permissions model: invitations, roles,
> a members table, the lot.

**Sarah** · 09:34

> That's the thing Carlos said in almost those words — "you're asking me to join your product to do
> you a favour."

**Hana** · 09:36

> Right, so it's circular. The fix for "the reviewer shouldn't need an account" is the feature that
> requires accounts. That's not a two-week thing.

**Priya** · 09:52

> For what it's worth this is the number one thing I hear on calls, and it is the thing Mia went
> quiet about. But I'd also say — nobody has ever asked me for *comments*. They ask to send it to
> someone. The commenting is our idea.

**Sarah** · 10:05

> Noted. So the options are a big permissions build for the most-raised pain, or the onboarding thing
> for the second-most-raised pain, which we can prototype in a week and actually measure.

**Hana** · 10:07

> Onboarding also has the advantage that we can put a number on it. We have `Document Created`.
> We have no instrumentation at all on publishing intent, so we'd be shipping the review bridge
> blind and then arguing about whether it worked.

**Sarah** · 10:19

> Alright. Onboarding first, on the basis that it's measurable and it's a week rather than a quarter.
> I'll write the PRD. Draft review goes in the backlog with the permissions model as the blocker.
>
> Flagging that I'm not comfortable with this — we are working the second pain because the first one
> is expensive, and that is a resourcing decision dressed up as a discovery decision. If onboarding
> reads out flat we come straight back to this.

**Priya** · 10:24

> 👍

**Hana** · 10:25

> 👍

---

_Thread ended. No decision doc was written. `NOT-141` was created the following week to hold the
draft-review scope, and cancelled on 6 May._
