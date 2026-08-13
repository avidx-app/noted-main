# Intentional gaps

Some parts of this Team OS are empty on purpose. This file records which ones, why, and what would
have to be true before filling them.

Read it before you "helpfully" populate a stub. Two of the gaps below are load-bearing: they are
what a reader learns from, and backfilling them with plausible-sounding content destroys the lesson
and replaces real evidence with fiction.

The governing rule is in [`../.ai/INSTRUCTIONS.md`](../.ai/INSTRUCTIONS.md): **never fabricate data,
quotes, or metrics.** An empty file that says so is worth more than a full one that guesses.

## The two that matter

### Ship logs are empty, and the merge history is not

`team-os/features/*/ship-log.md` is empty except where explicitly backfilled and labelled as such.

**Why:** the history is real and recoverable from git. Reconstructing it is a genuine exercise —
`gh pr list --state merged` plus the diff tells you what shipped; the dossier tells you what the
team thought it was shipping; the difference between those two is the interesting part.

This heading used to state a count. It said 78, which was the highest pull request number rather
than a count of the merged ones — five had been closed unmerged. Count it when you need it:

```bash
git log --merges --format=%s | grep -c "Merge pull request #"
```

A number in prose is a number nobody re-derives. That is the whole argument of §XVII, and this file
was breaking it.

**Before filling:** if you backfill, say so in the file, and say which PRs you read. A ship log that
silently reconstructs history reads exactly like one written contemporaneously, and it is not.

### Two claims in `research/conversations/` are wrong, and must stay wrong

[`research/conversations/`](research/conversations/) holds the constructed internal record — Slack
threads, Linear issues, pre-decision Notion pages. Two engineering claims in it are false, and both
are settled in twenty lines of [`../convex/documents.ts`](../convex/documents.ts):

| Claim | Where | Why it is false |
| ----- | ----- | --------------- |
| A reviewer needs an account to read a document at all | `slack/2026-04-29-…`, `slack/2026-05-04-…`, `linear/NOT-141-…` | `getById` returns any published, non-archived document to an unauthenticated caller. `app/(public)/(routes)/preview/[documentId]/` is that path in production, with `editable={false}` |
| Therefore the draft-review option needs a permissions model first | `slack/2026-05-06-…`, and inherited by [`research/pain-landscape.md`](research/pain-landscape.md) | Unauthenticated read already exists. What is missing is per-recipient granularity — `documents` has one boolean, `isPublished` — and any comment primitive at all |

**Why:** this is the single most useful thing this repo can teach. A claim entered the record in chat,
nobody opened the code, an option was cancelled on it, and the claim was then laundered into a
research artifact that reads like analysis. Anyone who triangulates across the conversation record and
the code finds it in ten minutes. Anyone who trusts `team-os/` never does.

Correcting the threads would delete the lesson and leave a repo where every document agrees with every
other document — which is not what any repo looks like.

**Before "fixing" either:** don't. If the surrounding product code changes so the claims become
accidentally true, update this table and the note in
[`research/conversations/CLAUDE.md`](research/conversations/CLAUDE.md) rather than the threads. The
threads are a record of what people believed.

**Also deliberate:** the `[NEED: decision recorded on why onboarding precedes draft review]` marker in
`pain-landscape.md` stays unfilled even though `slack/2026-05-06-product-closing-not-141.md` contains
the answer. The gap between "the decision was made" and "the decision reached the artifact" is the
thing being shown.

### `feature-workflow` Phase 0 is a specified empty socket

[`../.ai/skills/feature-workflow/SKILL.md`](../.ai/skills/feature-workflow/SKILL.md) makes user
grounding mandatory and stops the workflow without it — personas, pain landscape, behavioural
cohorts, and a real customer quote. For most features those inputs do not exist yet, and the
`[NEED: ...]` placeholders are deliberately left visible.

**Why:** the gap between "our process demands customer evidence" and "we have none for this feature"
is the most useful thing this repo can show a reader. Hiding it with invented personas would make
the process look complete and teach the opposite of what it should.

**Before filling:** ground it in something real. The seeded cohort in `scripts/fixtures/` supports
behavioural claims; interview evidence belongs in `team-os/research/` with its provenance stated.
Fill it per feature, not globally.

## Directories that are shape, not content

These are named in the nested `CLAUDE.md` doc indexes because they describe where a thing will go
when it exists. They are marked _not created yet_ in those indexes, and the doc-link checker accepts
that marking. Create one when there is real work to put in it — not before.

| Path                                      | Fill it when                                                 |
| ----------------------------------------- | ------------------------------------------------------------ |
| `team-os/engineering/rfcs/`               | A cross-cutting design needs a decision recorded before code |
| `team-os/engineering/adr/`                | A choice needs to outlive the PR that made it                |
| `team-os/engineering/runbooks/`           | Something breaks twice the same way                          |
| `team-os/engineering/bug-investigations/` | A bug takes more than one sitting to understand              |
| `team-os/engineering/plans/`              | A feature needs a plan lighter than an RFC                   |
| `team-os/design/principles.md`            | Design decisions start needing a shared reason               |
| `team-os/design/component-decisions.md`   | A second person has to choose between shadcn pieces          |
| `team-os/design/flows/`                   | A flow is complex enough that prose stops working            |
| `team-os/analytics/experiments/`          | The first experiment reads out                               |
| `team-os/analytics/investigations/`       | A metric moves and nobody knows why                          |
| `team-os/analytics/dashboards.md`         | A dashboard exists that people actually open                 |
| `team-os/support/top-issues.md`           | Support volume exists to rank                                |
| `team-os/support/faq.md`                  | The same question is asked a third time                      |
| `team-os/support/feedback-log/`           | Raw feedback arrives somewhere other than a person's head    |
| `team-os/support/macros.md`               | A reply is written twice                                     |
| `team-os/growth/landing-page-notes.md`    | A copy test runs                                             |
| `team-os/growth/onboarding-funnel.md`     | Activation is instrumented end to end                        |
| `team-os/growth/pricing-experiments.md`   | Pricing is real, which requires revenue                      |
| `team-os/growth/referral-program.md`      | If we ever build one                                         |
| `team-os/product/roadmap.md`              | There is more than one bet in flight to sequence             |
| `team-os/research/deep-dives/`            | A question needs more than a pulse                           |
| `team-os/research/signals/`               | Signals arrive faster than pulses are written                |
| `team-os/team/onboarding.md`              | Someone joins                                                |
| `team-os/team/retros/`                    | A retro happens                                              |
| `team-os/team/weekly-updates/`            | A weekly update is written                                   |

## Features with no dossier

`team-os/feature-index.yaml` records `dossier: null` for `core-editor`, `publish-to-web`,
`team-collaboration` and `paywall-subscription`, each with an inline reason. That file is the
authority; do not create a dossier without updating it.

## How this is enforced

`npm run check:links` fails if a doc index points at something that does not exist and is not either
marked absent in the row or listed here. Adding a path to this file is a deliberate act, which is
the point — the register only works if putting something in it is a decision somebody made.
