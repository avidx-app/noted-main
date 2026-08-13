# Verification record — the draft sharing framing

> **One good answer, not the answer.** The point is the shape and the level of specificity, and
> particularly the fourth section.

**By:** reference answer · **Date:** 2026-08-14 · **PR:** #90 · **Staging:** https://noted-staging-ref.onrender.com

## What shipped

The sharing control is called _Share_ rather than _Publish_, says who can see the document, and lets you
stop sharing from the same place you started.

## Verified locally

- `npm run lint:check && npm run type:check && npm run test && npm run design:lint` — clean.
- `npm run smoke -- run` — with a probe at `lib/__smoke__/share-copy.smoke-diff.test.ts` asserting the
  undo is absent before anything is shared and present after. Probe first, then the baselines. Without
  the probe the run reports green gates and nothing shown to work, which is what it should say.
- Clicked it: opened the control on an unshared document, shared, opened the preview URL **in a
  logged-out window**, then used the undo and confirmed the URL stopped resolving. That last step is the
  one that would have caught a broken mechanism underneath.

## Verified on staging

Opened the deployed URL, signed in as a second Clerk user rather than my own account, created a
document, shared it, and opened the preview link in a private window.

Three things differed from local, and all three are the reason this section exists:

- **Cold start.** The free tier had spun down, so the first load took about forty seconds. A first-time
  user meets that before they meet any of my copy, and no amount of local testing shows it.
- **The Amplitude event landed in the wrong project.** `NEXT_PUBLIC_AMPLITUDE_API_KEY` on the Render
  service still pointed at my development project, so `Share Control Opened` was arriving where nobody
  would look for it. Fixed the environment variable and redeployed. This is the class of bug that only
  exists in deployment.
- **Convex is a different deployment**, so the seeded cohort is not there. Staging looked emptier than
  local, which is correct and briefly alarming.

Confirmed after the fix: Convex shows the document with `isPublished: true`, and Amplitude Live shows
`Share Control Opened` followed by `Document Published`.

## What I did not verify

- **That the undo is visible to someone who did not just share.** I always tested it seconds after
  sharing. The state a week later, in a document I had forgotten about, is the state that matters and I
  did not reach it.
- **Any browser except Chrome**, and nothing on mobile. Nobody in the research mentioned mobile either,
  which is a property of who was interviewed rather than evidence it does not matter.
- **The concurrent case.** If a reader has the preview open when the owner stops sharing, I do not know
  what they see. Reactive query, so probably an error state, and probably is doing a lot of work there.
- **Whether the copy is understood.** This is the whole point of the change and shipping it cannot
  verify it. It needs somebody reading the words who did not write them.
- **That the dismissal behaviour is captured.** It is not — there is no dismissal event. So the specific
  behaviour the bet is about is still invisible, by design, and named here so nobody reads the
  instrumentation as complete.

## What I will watch

`Share Control Opened` against `Document Published`, weekly, for a month. If opens climb and shares do
not, the framing removed the hesitation about opening the control and not about the decision behind it —
which is a smaller finding than it looks and would point at the dismissal event as the next slice.

I will also watch for the stop condition: shares followed quickly by un-shares, or anyone asking who else
can see it. Either means the words made the action feel smaller than it is, and the answer is revert
rather than iterate.
