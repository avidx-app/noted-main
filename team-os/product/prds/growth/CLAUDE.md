# PRDs — Growth

| File                                                     | Stage               | Summary                                                                                                                                                       |
| -------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ai-first-onboarding-prd.md](ai-first-onboarding-prd.md) | 2 — Planning Review | Ask new users what they are working on before creating a blank document, then generate a structured starter doc. A prototype exists; the experiment does not. |

## Current state of onboarding in Noted

Live today: a new signed-in user with zero documents sees the empty state and a **Create a note**
button. That is the whole first-run experience. There is no intent capture, no template picker, and
no onboarding-specific instrumentation.

A prototype of the proposed flow exists at
[`app/(main)/(routes)/documents/start/page.tsx`](../../../../app/%28main%29/%28routes%29/documents/start/page.tsx).
**It is a prototype, not a feature.** Read
[prototype-boundary.md](prototype-boundary.md) before reasoning about it or citing it as evidence —
most of what it appears to do is simulated, and the PRD describes analytics and flag behavior that
is not implemented.

## Grounding

The bet rests on interview evidence — Jordan, Ethan and Lena all describe AI as valuable once it is
attached to a concrete job, and fuzzy when it is not. Those transcripts are not yet in this repo.

`[NEED: interview transcripts imported to team-os/research/interviews/ with provenance stated]`

Until they are, the PRD's assumption rows citing them are **partially validated by sources a reader
cannot open**, which is exactly the condition `feature-workflow` Phase 0 exists to catch. Do not
promote this PRD past Stage 2 on the strength of quotes nobody can check.

The behavioral half is available today: `scripts/fixtures/` seeds a synthetic cohort, and
`npm run seed:convex` prints the four insights it supports. The 92–96% second-document baseline in
the PRD comes from that seed — it is **seeded, not production truth**, and the PRD says so.
