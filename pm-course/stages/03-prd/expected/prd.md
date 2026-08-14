# Hand off: Draft sharing framing PRD (Existing feature)

> **One good answer, not the answer.** Yours will follow from your own evidence map and may argue for
> something else entirely. What matters is that every claim below can be traced to a source, and that the
> ones that cannot say so.

**TL;DR:** Rename the sharing action and make it reversible in place, to test whether the friction is the
word rather than the wall — measured by whether share-control opens convert to shares.

## Context

- **What is the problem to be solved? How critical is it?**
  Users draft, reach something worth showing, want one reader, and stop. It is the top-ranked pain in
  `team-os/research/pain-landscape.md` at seven of eleven transcripts, and it gates the review step that
  the same landscape says people actually want.
- **What is the proposed solution?**
  - **Near-term**: this PRD. Keep the existing public-read path; change the control's label and copy, and
    surface un-sharing in the same popover.
  - **Long-term**: per-recipient sharing and comments, which needs a schema change — `convex/schema.ts`
    carries one sharing field, `isPublished: v.boolean()`.
  - This PRD executes **the near-term framing change only**.
- **What is the customer value?**
  A drafter can let one person read something without the action feeling permanent, and can undo it
  without going to look for how.
- **What is the business value?**
  It is the cheapest available test of the highest-ranked pain, and the result either justifies the
  permissions work or removes it from the roadmap.
- **Previous attempts?**
  `team-os/research/conversations/linear/NOT-141-comment-only-share-link.md` — scoped at three weeks,
  cancelled in May. It was cancelled on the premise that a reviewer needs an account to read a document,
  and `convex/documents.ts` disproves that: `getById` returns a published document before it checks for
  an identity.

## Key assumptions:

- **The stopping happens at the rate the research implies** — _pending validation._ Seven of eleven
  transcripts, all constructed (`team-os/research/interviews/CLAUDE.md`). No behavioral signal exists,
  because publish intent is not instrumented.
- **The friction is the word rather than the access** — _partially validated._ One transcript says it
  directly: Mia, in `team-os/research/interviews/2026-04-08-mia-publish-friction-draft-review-gap.md`,
  says publish "already feels like a state change" and that she could send a link and chooses not to.
  One voice, constructed, and the only source that distinguishes the two framings.
- **Unauthenticated read already works** — _validated._ `convex/documents.ts` and
  `app/(public)/(routes)/preview/[documentId]/page.tsx`. Code, not a document, so this one could have
  disagreed and did not.
- **Nobody is asking for comments** — _pending validation._ One CS note in a constructed corpus. Enough
  to stop me sizing comments as a requirement, not enough to drop them.

## Objectives

Of users who open the sharing control on an unshared document, increase the share of those who go on to
share it. Directional only — no target, because there is no baseline: nothing today records opening the
control.

**Not** the second-document rate. The metrics file
`team-os/analytics/metrics/growth/ai-first-onboarding-metrics.md` puts that at **92–96%, from
`scripts/fixtures/` rather than production**, and says treating it as real is the single most likely way
to misread an experiment here. A target against it would be a target against a fixture.

## Design scope:

Copy and one affordance, inside the existing popover. No new surface, no new component. `DESIGN.md` is
binding under §XVI, so tokens only.

## Eng scope:

One module for the strings and the state decision, consumed by
`app/(main)/_components/publish.tsx`. One new analytics helper in `lib/analytics.ts`. No table, no
migration, no dependency. Days.

## Data scope:

- `Share Control Opened` — **[NEEDS INSTRUMENTATION]**. This PRD adds it.
- `Document Published` — exists.
- Missing, and worth naming: a dismissal event. Without it, someone who opens the control, reads the
  copy and backs out produces an open and nothing else — which is the behavior the whole bet is about.
  That is a second slice and this PRD does not deliver it.

## Ops scope:

None. No support surface, no migration, no rollout gate. Reversible by reverting the copy.

## Experiment design:

**No experiment.** Stated plainly rather than dressed up: there is no baseline for the metric that
matters, and this product does not have the volume to read out a lift on a 92–96% ceiling anyway.

What this delivers instead is the instrumentation and a qualitative read: five people using the changed
flow, watched. If the framing change is going to fail, it will fail visibly at that scale.

The experiment becomes possible after the dismissal event exists and a real baseline accumulates. Saying
so now is the point — `team-os/analytics/metrics/growth/ai-first-onboarding-metrics.md` files its own verdict as **not ready to run**, and
that was the right call rather than an embarrassment.

## Launch plan

1. Ship behind no flag. It is a copy change and reverting is one commit.
2. Watch `Share Control Opened` against `Document Published` for two weeks.
3. **Stop condition:** if people share and immediately un-share, or ask unprompted who else can see it,
   the framing has made the action feel smaller than it is. That is worse than the hesitation and it means
   revert, not iterate.
4. Then decide whether per-recipient sharing is worth the schema change, with a real signal for the first
   time.
