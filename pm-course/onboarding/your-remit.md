---
type: onboarding
provenance: constructed
---

# Your remit

> **Constructed.** The people below are invented. What they own maps onto real files, and those files
> are real. See [`what-is-real.md`](what-is-real.md).

## You

**Product manager, Noted.** First one. You own the decision about what gets built next and the
evidence behind it. Nobody will stop you from shipping something badly reasoned — the constitution
guards the code, not the thinking.

Concretely, you own:

- **The PRDs** in [`team-os/product/prds/`](../../team-os/product/prds/). Five exist. Two describe
  things that are live, three describe things that are not.
- **The research layer** in [`team-os/research/`](../../team-os/research/). Personas, the pain
  landscape, the interview library, the conversation record.
- **The metric definitions** in [`team-os/analytics/metrics/`](../../team-os/analytics/metrics/).
  Two feature areas have them. The rest do not.
- **Whether a feature is ready to build**, which in this repo means whether `feature-workflow` Phase 0
  can complete without a `[NEED: ...]` marker.

You do **not** own the constitution, the ESLint rules, or the review command. If one of them blocks
you, the answer is a conversation, not an exemption.

## Who to ask

|                                             |                                                                                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Sarah** — product and research, half-time | Wrote most of `team-os/research/`. Made the May sequencing decision you have been asked to audit                                          |
| **Hana** — engineering                      | Owns the constitution and the commands. Priced the draft-review option at three weeks, on a premise worth checking                        |
| **Priya** — customer-facing                 | Recorded five of the eleven interviews. The person most likely to know what a customer actually said, as opposed to what got written down |
| **`@avidx-app`** — code owner               | Required reviewer on everything outside `team-os/`. See [`ROSTER.md`](../../team-os/ROSTER.md)                                            |

In practice you ask your agent, and it answers from the repo. That is the point of the repo being
written the way it is.

## What you inherited mid-flight

**AI-first onboarding.** A bet in flight, not a feature.
[`feature-index.yaml`](../../team-os/feature-index.yaml) records it as `in-design` with nothing
shipped. There is a [PRD](../../team-os/product/prds/growth/ai-first-onboarding-prd.md), a prototype
route, a [prototype boundary](../../team-os/product/prds/growth/prototype-boundary.md), and a
[metrics file](../../team-os/analytics/metrics/growth/ai-first-onboarding-metrics.md) whose own
readiness verdict is **not ready to run**.

Read the boundary before you show the prototype to anyone. One of its five example prompts does not do
what it says, and that is written down.

**A decision to audit.** In May the team chose onboarding over the draft-review problem. The pain
landscape ranks draft-review first, seven of eleven transcripts. The reasoning behind the choice is in
the repo and it is not in the artifacts where you would expect to find it.

**An empty ship log.** [`INTENTIONAL-GAPS.md`](../../team-os/INTENTIONAL-GAPS.md) explains why, and
`NOT-118` has been open since February. Reconstructing it is a genuine exercise; doing so silently is
not.

## The two habits you are being hired for

1. **Read the diff before asking for review** — including when the diff is a document.
2. **State what you did not verify** — every time.

Everything else in this course is machinery around those two.

## Where your work goes

`pm-course/my-work/`, which is gitignored. Seven artifacts, one per stage, each the input to the next.
Keeping them out of the tree means the pull request you open in stage 6 contains a slice and not your
notes.

Start at [`../stages/01-day-one/brief.md`](../stages/01-day-one/brief.md).
