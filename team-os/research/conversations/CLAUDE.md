# Conversations

Where decisions actually got made. Slack threads, Linear issues, and the Notion pages that came
before the tidy version.

## Provenance — read this first

**These conversations are constructed.** They come from the Vibe PM @ Noted simulation, written so
the discovery workflow has a conversational record to work on. Nobody said any of it, and no ticket
here was ever open in a real tracker.

They are written to be **realistic about a specific thing**: what a decision looks like before
anybody writes it up. That means they contain arguments that were never resolved, estimates nobody
checked, and at least one confident claim that is simply wrong. That is not sloppiness in the
simulation — it is the property being simulated.

Every file carries `provenance: constructed` in its frontmatter and repeats it on its face, so a
quote lifted out of context still carries its label.

## What this folder is not

**It is not independent corroboration of anything in [`../`](../).** The personas, the pain
landscape, the interviews, the seeded cohort in `scripts/fixtures/` and this folder were all authored
together, to be internally consistent. They could not have disagreed with each other.

Three sources in this repo could have, and did not have their content authored: **the running
product**, **the code**, and **the merge history**. When something here and something in `team-os/`
agree, you have one source. When something here disagrees with the code, the code wins — and the
disagreement is the most interesting thing in the repo.

## Index

| File | What it is | Read it for |
| --- | --- | --- |
| [`slack/2026-04-14-customer-love-mia-again.md`](slack/2026-04-14-customer-love-mia-again.md) | CS relays a customer call | How a quote changes shape between the transcript and the PRD |
| [`slack/2026-04-29-product-what-do-we-do-next.md`](slack/2026-04-29-product-what-do-we-do-next.md) | The sequencing argument | The decision `pain-landscape.md` says is unrecorded |
| [`slack/2026-05-04-engineering-share-link-scope.md`](slack/2026-05-04-engineering-share-link-scope.md) | Scoping a comment-only link | An estimate built on a premise nobody opened the code to check |
| [`slack/2026-05-06-product-closing-not-141.md`](slack/2026-05-06-product-closing-not-141.md) | Killing the small option | What a decision looks like when it never reaches an artifact |
| [`linear/NOT-141-comment-only-share-link.md`](linear/NOT-141-comment-only-share-link.md) | Cancelled | The scope that was nearly right |
| [`linear/NOT-152-ai-first-onboarding-prototype.md`](linear/NOT-152-ai-first-onboarding-prototype.md) | Done | Cross-check against the merge history — the first attempt did not land |
| [`linear/NOT-118-ship-log-automation.md`](linear/NOT-118-ship-log-automation.md) | Backlog since February | Why `ship-log.md` is empty |
| [`notion/next-bet-options-may-2026.md`](notion/next-bet-options-may-2026.md) | Options memo, 1 May | The criterion that actually decided it |
| [`notion/draft-review-bridge-early-thinking.md`](notion/draft-review-bridge-early-thinking.md) | Pre-decision notes | The idea that was right and got dropped anyway |

## The one thing to check before quoting any of it

Open the code. Two claims in this folder are wrong about how Noted works, and both are settled in
under five minutes by reading [`convex/documents.ts`](../../../convex/documents.ts) and
[`convex/schema.ts`](../../../convex/schema.ts). They are wrong on purpose, they are wrong the way
real engineering claims in real Slack threads are wrong, and one of them propagated into
[`../pain-landscape.md`](../pain-landscape.md) — which is what happens when a landscape is written
from a thread instead of from the repo.
