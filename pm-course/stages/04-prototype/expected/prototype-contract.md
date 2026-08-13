# Prototype contract — the share framing, not the share model

**By:** reference answer · **Date:** 2026-08-13 · **Branch:** `feat/share-framing` · **Diff:** `git diff workshop-v1`

One good answer, not the answer. It follows the reference Stage 2 decision — **narrow** — so the thing
built is the cheapest test of that decision, and the contract is honest about how little it is.

Four files changed:

| File                                 | What happened to it                        |
| ------------------------------------ | ------------------------------------------ |
| `app/(main)/_components/publish.tsx` | The popover's copy and the undo affordance |
| `lib/share-copy.ts`                  | New. The strings, and the label logic      |
| `lib/share-copy.test.ts`             | New. Tests for the label logic             |
| `lib/analytics.ts`                   | One new event helper                       |

## The learning question

When the same action is called _Share a link_ rather than _Publish_, and the popover shows how to
undo it, do people who were hesitating go through with it?

That is one question and it is answerable in an afternoon. It is not "is the framing better", which is
not answerable at all.

## The stop condition

If people go through with it and then immediately undo — or if they ask, unprompted, who else can see
it — the framing has made the action feel _smaller than it is_, and we stop. That failure is worse than
the hesitation we were trying to remove, because it means somebody published something to the public
web believing they had not.

Stopping means reverting the copy, not iterating on it.

## What is real

- **The publish mechanism underneath.** Untouched. The document genuinely becomes readable at the
  preview URL, by anyone, exactly as before. Nothing about who can see what has changed, which is why
  this is safe to put in front of someone and also why the stop condition above matters.
- **The undo.** Unpublishing already existed; this surfaces it in the same popover rather than
  requiring the user to find it again. It really unpublishes.
- **The copy.** The strings in `lib/share-copy.ts` are the actual proposed wording, so comprehension
  findings are about the real language.
- **The visual treatment.** Built from existing primitives and tokens. `npm run design:lint` passes,
  which matters because §XVI makes `DESIGN.md` binding rather than advisory.

## What is hard-coded

- **The wording itself**, obviously — but worth stating, because there is exactly one variant. This
  tests _a_ framing, not the framing. A negative result does not clear the whole idea.
- **The visibility explainer.** One sentence, the same sentence every time, regardless of whether the
  document has ever been published before. A user who published this document last week sees copy
  written for someone who has not.

## What is simulated

Nothing, and that is the interesting part of this contract.

There is no timer, no fixture, no placeholder generation. Every behaviour a participant can trigger is
the real behaviour. I am stating it explicitly rather than leaving the section empty, because an empty
heading reads as "not applicable" and here it is a finding: this prototype is cheap _and_ faithful,
which is unusual, and it is only true because the decision was to change framing rather than build a
mechanism.

Compare
[`team-os/product/prds/growth/prototype-boundary.md`](https://github.com/avidx-app/noted-main/blob/main/team-os/product/prds/growth/prototype-boundary.md),
where generation is `setTimeout(…, 1800)` and the result screen is an outline of an outline. That
prototype could not answer a question about whether the output was any good. This one can answer its
question directly, because there is no fake in the path.

## What is not connected

- **The new event is not instrumented end to end.** `lib/analytics.ts` gains one helper and it fires
  into Amplitude only if a key is present. I have a key locally and I have not confirmed the event
  lands in a dashboard, so the funnel this was supposed to make measurable does not exist yet.
- **Nothing is recorded about hesitation.** The event fires when the popover opens. If someone opens
  it, reads the copy, and closes it — the exact behaviour the whole claim is about — that produces one
  open event and no signal that they backed out. **This is the gap that matters** and I noticed it
  writing this section rather than while building.
- **No notification.** Nobody is told a link was shared, because there is no recipient — the model is
  still one boolean.

## What I deliberately did not build

- **A `shares` table, recipients, capabilities, revocation.** The Stage 2 evidence says the auth blocker
  is not real, but "not blocked" is not "worth building". This tests whether the cheap thing is enough
  before anyone commits to the expensive thing.
- **Comments.** One CS note in a constructed corpus says customers ask to _send_, never to _comment_.
  Thin evidence, and enough to stop me sizing comments as a requirement.
- **An unlisted or noindex state.** Genuinely tempting, genuinely a mechanism change, and it would have
  made this untestable in an afternoon.
- **A second copy variant.** An A/B needs a sample this product does not have.

## What the agent did not tell me

It listed three files. The diff has four.

**`lib/analytics.ts` was missing from its list.** It added the event helper because I asked for the
event, then described its work as "the copy and the undo" — accurate about intent, incomplete about the
diff. If I had written this contract from its summary, the contract would have claimed no analytics
change while the diff contained one, and the first person to read both would have stopped trusting the
document.

Two more things I found by reading the diff rather than the summary:

- It **exported `SHARE_COPY` alongside the helper**, which I did not ask for and which makes the strings
  importable from anywhere. Harmless now, and the kind of accidental public interface that is load-bearing
  in six weeks.
- Its first version put the copy strings **inline in the component**. It moved them to `lib/` when asked,
  which is what made the test possible — the logic was untestable until it stopped living inside JSX.
  Worth noticing that the testability came from a refactor I requested, not from how it built it.

What it got right, and I want on the record: asked what a person clicking this would wrongly assume, it
said _that only the recipient can see it_. That is the stop condition above. I would not have written
that section without the question, and the question is in the brief because an agent will answer it
better than it will volunteer it.
