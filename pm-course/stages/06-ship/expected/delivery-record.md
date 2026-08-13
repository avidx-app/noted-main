# Delivery record — the share framing

**By:** reference answer · **Date:** 2026-08-13 · **Branch:** `feat/share-framing` · **PR:** into `staging`

One good answer, not the answer. It carries the Act 3 prototype through the repo's own workflow, and
the sections that matter are the two nobody wants to write.

## The slice

A user opening the sharing control now sees it called _Share a link_, with the visibility consequence
stated and the undo in the same popover — so the decision to make a draft readable can be reversed
without going to look for how.

## Constitution check

| Principle                                    | Applies because                                         | Pass?                                                                                        |
| -------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| §IV — TypeScript strict, no `any`            | New module under `lib/`                                 | Pass                                                                                         |
| §IX — Quality gates pass before merge        | Any merge                                               | Pass — commands below                                                                        |
| §X — File naming                             | New files `lib/share-copy.ts`, `lib/share-copy.test.ts` | Pass, kebab-case                                                                             |
| §XIV — team-os reflex                        | This changes a user-visible surface                     | **Pass, after a correction — see below**                                                     |
| §XV — Analytics: track decisions, not clicks | Added one event                                         | Partial. It records an open, which is a click. The decision I care about is the one after it |
| §XVI — Visual identity contract              | Touches `app/`                                          | Pass — `design:lint` clean                                                                   |

**§XIV is the one worth reading.** The reflex says a user-visible change updates `team-os/`. I went to
add a ship-log row and there was nowhere to put it: `publish-to-web` is `dossier: null` in
`team-os/feature-index.yaml`, with an inline note saying it is worth one "once team-collab v1 starts".
So the feature I just shipped into is the one feature with no dossier and no ship log, and the reflex is
unsatisfiable as written.

I created the dossier and the ship log, and updated `team-os/feature-index.yaml` so it no longer says `null`.
That is scope I did not plan and it is the correct scope — the alternative was a slice that silently
skipped the step the constitution makes mandatory.

**§XV is a partial and I am not claiming otherwise.** The event fires on popover open. Someone who reads
the copy and backs out — the behaviour the whole bet is about — produces an open and nothing else. The
honest fix is a second event on dismissal, and it is not in this PR.

## What I verified, and how

- `npm run lint:check && npm run type:check && npm run test && npm run design:lint` — all clean.
- `npm run test` covers the new label logic in `lib/share-copy.test.ts`, including the
  never-published and previously-published cases.
- Clicked it: opened the popover on an unpublished document, shared, confirmed the preview URL loads
  **in a logged-out browser window**, then used the new undo and confirmed the URL stops resolving.
  That last step is the one that would have caught it if I had broken the mechanism underneath.
- Read my own diff against `workshop-v1` before running `/noted-review`, which is how I found the
  fourth changed file the agent had not mentioned.

## What I did not verify

- **That the new event reaches Amplitude.** Verified by unit test and by the SDK contract only. I have a
  key locally; I have not seen the event in a dashboard. So the funnel this was meant to make measurable
  is not confirmed to exist.
- **Any browser other than Chrome.** The popover is a shadcn primitive and is probably fine, and
  "probably fine" is what this line is for.
- **Mobile.** Not opened once. Nobody in the research mentioned mobile either, which is a property of
  who was interviewed rather than evidence it does not matter.
- **That the copy is understood.** This is the whole point of the prototype and it cannot be verified by
  shipping it. It needs someone reading it who did not write it.
- **The un-share path under concurrent access.** If a recipient has the page open when the owner
  un-shares, I do not know what they see. Reactive query, so probably an error state; I did not try it.

## The review verdict, and what I did about it

`/noted-review` returned **❌ 3 issues to fix before merge.**

1. **Event name records a click, not a decision (§XV).** _Left standing, with a reason._ Renaming it
   does not change what it measures. The real fix is a dismissal event, which is a second slice, and
   pretending a rename addressed the finding would be worse than recording the gap. Noted above and in
   the metrics file.
2. **No ship-log entry.** _Fixed_, and it turned into the §XIV correction above — the finding was right
   and the cause was deeper than the finding said.
3. **`SHARE_COPY` exported without a consumer.** _Fixed._ Unexported. It was the agent's addition, not
   mine, and an accidental public interface is the kind of thing that is load-bearing in six weeks.

Finding 1 is the one I want on the record as a disagreement rather than a miss. The review was correct
that the principle is not satisfied. It was not correct that this PR could satisfy it.

## The ship-log entry

Added to `team-os/features/publish-to-web/ship-log.md`, which this PR creates:

> `| 2026-08-13 | #90 | me | Sharing a draft no longer says "Publish", explains who can see it, and can be undone from the same place | 🚧 staging |`

Harder to write than the commit message, which is the point of
[`NOT-118`](https://github.com/avidx-app/noted-main/blob/main/team-os/research/conversations/linear/NOT-118-ship-log-automation.md).
My first attempt said "refactored share copy into a module", which is true and tells a non-engineer
nothing.

## The pull request

Into `staging`, never `main`. Read in this order: the description, then
`team-os/feature-index.yaml` to see why the scope grew, then the diff.

No `Closes NOT-XXXX`, and §VIII makes that a non-negotiable. I do not have a Linear ticket and cannot
create one in this repo's tracker, so the PR states that in the description rather than leaving the box
mysteriously unticked. An unmeetable requirement recorded as unmet is a different thing from one quietly
ignored — which is exactly what
[PR #81](https://github.com/avidx-app/noted-main/pull/81) did with its two unverified lines, and exactly
what the cohort PR it names did not.
