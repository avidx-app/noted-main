---
type: onboarding
provenance: real
---

# What is real in here, and what is not

The one page in `pm-course/` that is not in character. Read it once, then go back to the simulation.

Noted is a **real product** in a **real repository** with a **real workflow**. The people are invented
and most of the evidence is constructed. That combination is deliberate, and knowing which is which is
the difference between practicing product judgment and rehearsing a fiction.

## Real — lean on it, and it settles arguments

|                       |                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **The product**       | It runs. Whatever it does is what it does                                                                                           |
| **The code**          | `convex/`, `lib/`, `app/`, `components/`, `hooks/`                                                                                  |
| **The merge history** | What shipped, when, and what was closed without merging                                                                             |
| **The workflow**      | The constitution, `.ai/commands/`, the ESLint rules, CI, the quality gate                                                           |
| **The deploy**        | Render, staging and production, per [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md)                                                    |
| **The gaps**          | `[NEED: ...]` markers, the empty ship logs, and [`INTENTIONAL-GAPS.md`](../../team-os/INTENTIONAL-GAPS.md) — all genuinely unfilled |

**None of that was authored to agree with anything.** The code was written to make the product work, and
the history records what actually happened. So when a document and the code disagree, the code wins, and
the disagreement is usually the most interesting thing you will find that day.

## Constructed — usable for practice, not as proof

|                                                         | Says so at                                                                  |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| Eleven interview transcripts                            | [`interviews/CLAUDE.md`](../../team-os/research/interviews/CLAUDE.md)       |
| Slack threads, Linear issues, pre-decision Notion pages | [`conversations/CLAUDE.md`](../../team-os/research/conversations/CLAUDE.md) |
| Five personas and the ranked pain landscape             | derived from those transcripts                                              |
| The seeded cohort — and therefore your Amplitude data   | `scripts/fixtures/`                                                         |
| Sarah, Hana, Priya, and every customer name             | this folder                                                                 |

Every one of those files carries `provenance: constructed` in its frontmatter and repeats it on its
face. That is not decoration. It means:

- **Valid** for exercising the workflow, for practicing triangulation, for drafting a PRD that has to
  cite something.
- **Invalid** as evidence that demand exists. Never quote a line from it in anything a customer, an
  investor, or a public artifact will read.

## The trap, stated plainly

The constructed material was written **by one author, to be internally consistent.** So it agrees with
itself, and agreement between two parts of it is not corroboration — it is one source counted twice.

| Could genuinely have disagreed | Authored together, so could not                            |
| ------------------------------ | ---------------------------------------------------------- |
| The running product            | `team-os/research/` — personas, pain landscape, interviews |
| The code                       | The conversation record — Slack, Linear, Notion            |
| The merge history              | The seeded cohort, and so Amplitude                        |

**Amplitude is the sharpest case.** It arrives through a real analytics product, with real charts, and
it is a fixture you replayed into it yourself during setup. It looks more independent than anything else
you have, and it is not.

Only three of those six can contradict something. If you find agreement across all six and conclude the
evidence is strong, you have walked into the thing this course exists to teach — and you will have done
it honestly, which is why the labels are here rather than hidden.

## Two claims in the repo are false on purpose

Recorded in [`INTENTIONAL-GAPS.md`](../../team-os/INTENTIONAL-GAPS.md), with a table of what is actually
true. Both are engineering claims made in Slack that nobody checked against the code, and one of them
propagated into a research artifact where it reads like analysis.

They are not errors to report. They are the exercise. Finding them takes about ten minutes with
`convex/documents.ts` open, and never finding them is what happens if you trust documents over code.

## If you are wondering whether to break frame

Don't, except here. Inside the simulation, act like a colleague: cite the provenance the way a careful
person at a company with constructed research would, and let the workflow refuse you when the grounding
is not there. That is not pretending — it is the actual professional behavior, practiced on material
that cannot hurt anyone.

The one thing that would be pretending is treating a constructed transcript as market proof. That is
the line, and it is the same line the repo draws for itself.
