---
type: personas
status: current
owner: raziiabraham
last_updated: 2026-08-13
evidence: team-os/research/interviews/
---

# Personas

Five relationships people have with Noted. Not job titles — the same person can be two of these in
one week, and two people with the same title are often different personas here.

**Every persona below is synthesized from the eleven transcripts in
[`interviews/`](interviews/), which are constructed for a simulation.** They are internally
consistent and describe the product as it actually is, but nobody real said any of it. Grounding a
feature in these is legitimate practice and illegitimate proof. Read
[`interviews/CLAUDE.md`](interviews/CLAUDE.md) before citing one.

Behavioral sizing is **absent on purpose**. The seeded cohort in `scripts/fixtures/` can tell you
how often a behavior occurs in a fixture, not in the product. Every persona below therefore carries
`[NEED: real population size]`, and none of them should be used to argue that a segment is big.

---

## 01 — The Drafter

**Relationship:** comes to Noted to think, and leaves before the work becomes public.

The dominant pattern in the set — Devon, Marcus, Renee and Mia are all this, across four different
jobs. High Coworker and `/Ask AI` usage, regular document creation, almost no publishing.

They are not failing to publish. They are stopping at a step the product does not have.

> "Publish doesn't feel private, even if technically I can control who gets the link. Publish feels
> like 'this is now a thing.'" — Devon, 2026-04-14

> "There is no middle state. Right now I choose between secrecy and overexposure." — Mia, 2026-04-08

> "It goes from 'help me think' to 'this is what I believe.' That jump is bigger than the UI makes
> it feel." — Marcus, 2026-04-26

**What they do instead:** copy the draft into Google Docs, Slack or email and ask one person for a
reaction. Devon: _"the whole reasoning trail is in Noted"_ — Marcus's version of the same complaint.

**What it costs:** Devon estimates roughly one in five promising drafts cools off rather than
surviving the tool transfer. That loss happens before any public artifact exists, so nothing in the
product can see it.

**What they explicitly do not want:** real-time collaboration, presence, workspace member
management. Devon was asked about each and said no to all three.

`[NEED: real population size]`

## 02 — The Reviewer

**Relationship:** never drafts in Noted. Gets pulled in when someone else's draft is nearly ready.

Rina is the clearest case. She is not a user by any usage metric, and she is the person Persona 01
is blocked on.

> "I am usually not starting the document. I am the person someone pings when the document is almost
> ready and they want me to catch the obvious problem before a client sees it." — Rina, 2026-04-24

> "Publish feels finished. Even if they say 'ignore the roughness,' the format tells my brain this is
> a thing I should judge as close to final." — Rina

**The counter-intuitive part:** she does not want edit access.

> "I actually prefer not having it. If I can edit, I start fixing sentences. If I can only comment, I
> stay at the level they asked for." — Rina

Comment-only is not a lesser permission tier here. It is the feature — it protects the writer's
ownership and stops the reviewer becoming a bottleneck, which Rina raises specifically about junior
staff.

**Design consequence:** this persona will not create an account to react to one draft. Any review
step that begins with a signup recruits nobody.

`[NEED: real population size]`

## 03 — The Newcomer

**Relationship:** got value from AI in the first session, then hit a wall at anything requiring setup.

Jordan and Ethan. `/Ask AI` and Coworker land immediately. Squad agents do not.

> "This expects me to know what system I want before I even know what is possible." — Ethan,
> 2026-04-24

> "It just felt like configuration before value." — Ethan

> "Right now it feels like configuration before job." — Jordan, 2026-04-25

Two people reached nearly the same phrase independently, which is the strongest signal in the set.

**Not a rejection of Squad.** Both understood it was powerful. Ethan asked for starter templates —
_"'research-notes helper' or 'presentation outline coach' instead of a blank box asking me to invent
a system."_

**Why this persona matters to the onboarding bet:** the blank-box problem Ethan describes for Squad
is the same shape as the blank-document problem
[`ai-first-onboarding-prd.md`](../product/prds/growth/ai-first-onboarding-prd.md) proposes to fix.
The PRD cites Jordan and Ethan for exactly this. Note the direction of the evidence: they describe
the problem, not the solution. Neither was asked whether being prompted for intent first would help.

`[NEED: real population size]`

## 04 — The Tinkerer

**Relationship:** uses the settings pages on purpose. Chooses providers and models deliberately.

Kai and Nora. They validate that BYOK and explicit model control are real differentiation rather
than technical garnish — and they are also the persona most likely to be over-served.

> "The product asks me to design my own process too early." — Nora, 2026-04-21

Their friction is attribution and setup cost, not AI quality.

**The trap:** this persona is articulate, engaged, and files the most specific requests, which makes
their asks feel like the roadmap. Devon, who is not this persona, called model choice _"nerd
garnish — nice, but not the point"_ and rated both model controls and Squad improvements as minor
next to the review bridge. A roadmap built from the loudest feedback builds for Persona 04.

`[NEED: real population size]`

## 05 — The Expander

**Relationship:** already sold, trying to bring a team in, blocked by a missing step.

Anya and Carlos. The important nuance is that neither is asking for a collaboration platform.

> "The product is not missing interest. It is missing the next verb." — Anya, 2026-04-18

> "This is the smallest normal team case. If you cannot serve this, you stay a solo drafting tool."
> — Carlos, 2026-04-16

**Design consequence:** "team collaboration" is too broad a name for what this persona needs.
Devon put it directly: the umbrella is _"true directionally, but it covers too many possible
solutions."_

`[NEED: real population size]`

---

## What the set does not contain

- **Anyone who churned.** Every transcript is an active user. The reasons people leave are absent
  entirely, and no persona here can speak to them.
- **Any observed behavior.** All eleven are stated preference. Nobody was watched using the product.
- **Any team already collaborating in Noted.** Persona 05 is aspiration, not practice.
- **A daily note-taker.** The source set names a Lena — daily note-taker interview that was not in
  the export. `[NEED: Lena — daily note-taker transcript]`

## How to use these

Pick one persona per feature. `feature-workflow` Phase 0 asks you to, and the reason is visible
above: Persona 01 and Persona 04 want opposite things from the same roadmap. A feature "for
everyone" resolves that conflict by ignoring it.

Then find the quote. If you cannot cite a line from
[`interviews/`](interviews/) that a persona actually said, you are grounding on a summary of a
summary — which is the failure mode Phase 0's stop rule exists to catch.
