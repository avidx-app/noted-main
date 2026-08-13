---
type: onboarding
provenance: constructed
from: Sarah
date: 2026-08-14
---

# Welcome — read this first

> **Constructed.** Sarah is not a real colleague and this note was not sent to you. It is the frame
> for the simulation; see [`what-is-real.md`](what-is-real.md) for what in this repo is and is not
> real. Everything the note asks you to do is real work on a real repo.

---

Hey — glad you're here, and sorry I can't do this in person.

You're the first product manager Noted has hired. Up to now it's been me doing product half-time
alongside research, Hana on engineering, and Priya talking to customers. That worked at ten customers.
It is not working now, which is why you exist.

Here's what you're walking into, honestly.

**The delivery side is in good shape.** There's a constitution with seventeen numbered principles,
commands for the whole workflow, a review that runs against both, and a merge history you can read.
Engineering has been disciplined about this and you should not try to improve it in your first month.
Use it as written and you'll find it mostly protects you.

**The discovery side is thinner than it looks.** There's a research folder, a pain landscape, personas.
Read the provenance on all of it before you lean on any of it. And the process demands customer
evidence before anything gets built — which is right, and which we do not consistently have.

**One thing in flight.** We're mid-bet on AI-first onboarding: ask a new user what they're writing,
put them in a document shaped for it. There's a PRD, a prototype at `/documents/start`, and a metrics
file. The prototype is a research instrument and not a feature, and somebody wrote down exactly which
parts of it are fake — read that before you demo it to anyone.

**One thing I got wrong, probably.** In May we chose onboarding over the draft-review problem, and the
draft-review problem is the one customers raise most. My reasoning is in the repo somewhere. I'd like
you to find it and tell me whether it holds up. Genuinely — I am not asking rhetorically, and "it does
not hold up" is the answer I half expect.

## What I want from your first week

Not a strategy. Not a roadmap. Four things:

1. **One thing that looks broken or confusing.** In your own words, from using the product, before you
   read anyone else's description of it. This one matters most and it is the one you cannot get back
   later — after a week of reading the repo, you will never see it fresh again.
2. **One thing that seems to be working**, and might be worth doing more of. New people only ever
   report problems. The bright spots are harder to see and more useful.
3. **One question** about why the product or the team works the way it does.
4. **One metric** you think should matter. One sentence: _"Noted is working if **\_\_** goes up, because
   **\_\_**."_

Then open a pull request adding yourself to [`team-os/ROSTER.md`](../../team-os/ROSTER.md). Do it by
hand, without an agent. It's a two-line change and the point is to feel how the branch, the review and
the merge work while the stakes are nothing.

## How we work with agents here

They're peers, not autocomplete. The repo is written for them as much as for you — every folder has a
`CLAUDE.md`, the workflow is in `.ai/commands/`, and the review is a file that a human and a machine
run identically.

Two habits, and they are the whole job:

- **Read the diff before you ask anyone to review it.** Including when the diff is a document.
- **Say what you did not verify.** Every time. It is the only thing I will consistently check.

The second one is not modesty. An artifact that states its own limits can be built on. One that
doesn't has to be re-derived by whoever comes next, and that person is usually you in six weeks.

Ask me anything. Start with [`your-remit.md`](your-remit.md), then
[`../stages/01-day-one/brief.md`](../stages/01-day-one/brief.md).

— Sarah
