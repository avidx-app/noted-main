---
description: "Not a command. Planned, never built — read this to find what replaced it."
summary: Tombstone — never built, points at prd-writer and /noted-review
---

# /pm-review — does not exist

This file is a tombstone. `/pm-review` was named in `/feature-workflow` before it was written, and
it was never written. It is kept as a document rather than deleted because the name appears in the
workflow's history and in older drafts, and a reader who searches for it deserves an answer rather
than silence.

## Why it was not built

Two commands already cover what it was meant to do, and neither wanted a third overlapping with it:

| What `/pm-review` was for | What does it now |
| --- | --- |
| Red-teaming a draft spec or PRD before anyone builds it | The `prd-writer` skill's red-team mode, or `/grill-me` when you want to be questioned rather than handed a critique |
| Reviewing a diff against the team's own rules | `/noted-review` — architecture-doc compliance, skills compliance, ticket alignment, binary verdict |

The split turned out to be the useful boundary: one command challenges a *document* before the work
exists, the other challenges a *diff* after it does. A single `/pm-review` doing both would have had
to guess which one you meant.

## If you came here from an error

- Reviewing a spec or PRD → invoke the `prd-writer` skill and ask for its red-team mode, or run
  `/grill-me`.
- Reviewing staged changes or a PR → run `/noted-review`.

## If this decision reverses

A real `/pm-review` would only earn its place by doing something neither of the above does — for
example, reviewing a spec *against the evidence that justifies it* (personas, pain landscape,
interview quotes) rather than against its own internal consistency. That is a different job, and it
would need `team-os/research/` to be populated for the feature in question before it could run.
