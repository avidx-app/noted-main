# Evidence map — the draft review gap

**By:** reference answer · **Date:** 2026-08-13 · **Claim taken from:** my Stage 1 observation

One good answer, not the answer. Yours will start from your own Stage 1 observation and may well reach
a different verb — what matters is that the verb follows from the table.

## The claim I am testing

Noted's users draft, reach something worth showing, want exactly one person to read it, and stop —
and the reason they stop is that they cannot give a single reader access without publishing to the
public web.

Stated that way it is two claims stacked: that the stopping happens, and that access is why. The
second is the one everything downstream depends on, and it is the one nobody had checked.

## What would change my mind

- **On the behaviour:** if published-document counts tracked draft counts closely, the stopping is
  not happening at the rate the research implies.
- **On the cause:** if an unauthenticated visitor can already read a published document, then access
  is not the blocker and the cause is something else — most likely what publishing _means_, not who
  can reach it. That is checkable in the code in five minutes and it would move the whole decision.
- **On the demand:** if no source describes wanting to _comment_ as opposed to wanting to _send_,
  then the expensive half of every proposal so far is our invention.

Written before searching. The second one turned out to be the entire exercise.

## The evidence

| Source                                                                            | What it says                                                                                                                                                                                                                                           | Kind                       | Could it have disagreed?                                                                 |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- | ---------------------------------------------------------------------------------------- |
| The running product                                                               | Publish is a single toggle. A document is private to me, or on the public web at a preview URL. There is no third state                                                                                                                                | fact                       | Yes — nobody authored the app to agree with the docs                                     |
| `convex/documents.ts`                                                             | **`getById` returns any published, non-archived document before it checks for an identity.** An unauthenticated reader can already open one. `app/(public)/(routes)/preview/[documentId]/page.tsx` is that path in production, with `editable={false}` | fact                       | Yes                                                                                      |
| `convex/schema.ts`                                                                | `documents` carries exactly one sharing field, `isPublished: v.boolean()`. No shares table, no comments table                                                                                                                                          | fact                       | Yes                                                                                      |
| `team-os/research/pain-landscape.md`                                              | Ranks this pain first, 7 of 11 transcripts, and says any solution requiring the reviewer to sign up does not solve it                                                                                                                                  | interpretation             | No — authored with the interviews it summarises                                          |
| `team-os/research/conversations/slack/2026-05-04-engineering-share-link-scope.md` | Scopes the fix at three weeks because "every read goes through `getUserIdentity()`, so the recipient has to be a Clerk user"                                                                                                                           | contradiction              | No — authored with the research                                                          |
| `team-os/research/interviews/2026-04-08-mia-publish-friction-draft-review-gap.md` | Mia: publish "already feels like a state change"; "even if I technically only send the link to one person, the action itself feels too final"                                                                                                          | fact (about what she said) | No                                                                                       |
| Amplitude, my own project                                                         | Publish events are sparse relative to document creation                                                                                                                                                                                                | interpretation             | **No** — my events came from `npm run seed:amplitude`, which replays `scripts/fixtures/` |
| The merge history                                                                 | `NOT-152` records status Done; PR #79 never appears as a merge commit                                                                                                                                                                                  | fact                       | Yes                                                                                      |

Four of those eight could have contradicted the others. The four that could not were written
together, and their agreement is not corroboration — it is one author being consistent.

**Amplitude is the one I nearly got wrong.** It arrives through a real analytics product, with real
charts, and it is a fixture I replayed into it myself an hour earlier. If I had counted it as
behavioural confirmation I would have had three "independent" sources all restating one.

## Contradictions I am keeping

**The blocker named in `team-os/research/conversations/slack/2026-05-04-engineering-share-link-scope.md`
does not exist in `convex/documents.ts`.**

The thread says a reviewer needs an account to read a document at all, and prices the fix at three
weeks on that basis. The query returns a published, non-archived document to a caller with no
identity — the public preview route does exactly that, today, in production.

So `NOT-141` was cancelled on a premise that twenty lines of code disprove. And the premise did not
stay in Slack: `team-os/research/pain-landscape.md` reconstructs the reason as "Pain 1 needs a
permissions model nobody has designed", which is the same wrong claim with the confidence of a
research artifact. I cannot tell from the repo whether anyone ever opened the file.

I am not averaging these. The code wins on what the system does; the thread is an accurate record of
what the team believed. Both are true statements about different things, and the gap between them is
the finding.

**Second, and it changes what to build.** The relay in
`team-os/research/conversations/slack/2026-04-14-customer-love-mia-again.md` turns Mia's words into
"cannot share a draft with a single reviewer without making it public". Mia said the opposite about
access — she _can_ send it — and located the problem in what publishing means. One framing points at
a permissions model; the other points at a word on a button and a way to un-say it.

What makes this worth a section rather than a footnote is where the reformulation went. It did
**not** reach `team-os/research/pain-landscape.md`, which kept the framing exactly — "the vocabulary
is part of the pain, not decoration on it", and what people want is "comment-only, one or two
readers, no account for the reviewer". The landscape is the most faithful document in the repo on
this point.

It survived in the thread instead. And
`team-os/research/conversations/linear/NOT-141-comment-only-share-link.md` was scoped from the
thread two weeks later — as an access problem, at three weeks, then cancelled. So the correct
artifact already existed, in the repo, describing the cheaper thing, and the decision was made from
the chat anyway.

Nobody lied. Someone paraphrased, someone said "close enough", and nobody re-read the document that
had it right.

## What I could not answer

- **Whether the stopping actually happens at the claimed rate.** Every number available to me is
  seeded. The one real signal that would settle it — publish-intent, distinct from `Document
Published` — does not exist as an event.
- **Whether anyone wants comments.** One CS note says customers ask to _send_, never to _comment_.
  That is one voice in a constructed corpus. It is enough to stop me sizing comments as a
  requirement, not enough to drop them.
- **Whether the wrong premise was ever checked.** The repo records the belief and the cancellation.
  It does not record anybody opening `convex/documents.ts`, and the absence of a record is not
  evidence of absence.

## Priority

| Assumption                                            | Uncertainty | Consequence | Score |
| ----------------------------------------------------- | ----------- | ----------- | ----- |
| Access is the blocker                                 | 1           | 5           | 5     |
| The stopping happens at the rate the research implies | 5           | 4           | 20    |
| Users want comments, not just to send                 | 4           | 4           | 16    |
| A permissions model is a prerequisite                 | 1           | 5           | 5     |

The first and last score low on uncertainty now — not because they were always obvious, but because
reading the code resolved them in one sitting. That is the shape of a cheap check on a high-consequence
assumption, and it had been sitting unmade for three months.

The genuine unknown is the second row, and it is unresolvable from this repo. It needs an event.

## The decision

**Narrow.** Not the team-collaboration permissions model, and not park it either.

The smallest slice that tests the real claim: keep the existing public-read path, change what the
action is called and make it visibly reversible, and add the one event that tells us whether the
hesitation is real. Framing, not infrastructure. Days, not three weeks — and the option was priced at
three weeks only because of the premise the code disproves.

- **Owner:** whoever picks up `NOT-141` when it is reopened.
- **Artifact that must change:** `team-os/research/pain-landscape.md` — the sentence attributing the
  delay to an undesigned permissions model is wrong, and it is currently the most authoritative
  statement of it in the repo. The `[NEED: decision recorded on why onboarding precedes draft review]`
  marker underneath it should be filled from the 6 May thread at the same time.
- **Also:** `team-os/product/prds/collaboration/team-collaboration-prd.md` sizes this as if the
  question were open. It is not open; it was decided on 6 May, on a false premise, and neither half of
  that has reached the PRD.

**What I am not claiming.** That the framing fix will work. Mia is one constructed transcript, and the
evidence that people hesitate at the word rather than the wall is a single quote. This is a decision
about what to test next, at a cost of days, and it is reversible — which is the only reason it is
defensible on evidence this thin.
