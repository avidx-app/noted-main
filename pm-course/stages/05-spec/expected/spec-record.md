# Spec record — the draft sharing framing

> **One good answer, not the answer.** The bundle is the real output; this is the account of producing it.

**By:** reference answer · **Date:** 2026-08-14 · **Bundle:** `specs/EXP-1-in-editor-ai-triggered/`

> **Note for a learner:** the bundle named above is the repo's own exemplar rather than one I created,
> because this reference ships with the repo and cannot leave a second bundle in `specs/` without
> confusing the next person. Yours will name your own directory, and the checker will look at it.

## The slice this spec covers

Change what the sharing control is called, state who can see the document, and surface un-sharing in the
same popover. No schema change, no comments, no per-recipient anything.

Narrower than the PRD, on purpose: the PRD argues for testing the framing, and this is the smallest thing
that does it.

## How Phase 0 was satisfied

`feature-workflow` Phase 0 demands a persona, a pain and a real quote, and refuses to start without them.

- **Persona:** 01 The Drafter, from `team-os/research/personas.md` — comes to think, leaves before
  publishing. High AI use, near-zero publish. This change is aimed squarely at the leaving.
- **Pain:** #1 in `team-os/research/pain-landscape.md`, no step between private draft and public page,
  seven of eleven transcripts.
- **Quote**, copied from the transcript rather than from the summary, per the skill's own instruction:
  Mia, in `team-os/research/interviews/2026-04-08-mia-publish-friction-draft-review-gap.md` —
  publish "already feels like a state change", and "even if I technically only send the link to one
  person, the action itself feels too final."

**What the grounding rests on.** All three are constructed, and say so on their face — see
`team-os/research/interviews/CLAUDE.md` and `pm-course/onboarding/what-is-real.md`. That makes them valid
for specifying this work and invalid as evidence anyone wants it. The spec is buildable; the bet is
unproven, and those are different claims.

`[NEED: Amplitude behavioral cohort per persona]` is still open in Phase 0 and this spec does not close
it. No claim here rests on how many Drafters there are.

## What clarify changed

Three questions I did not have before running `/speckit.clarify`, and they changed the spec:

1. **What does the control say on a document that is already shared?** The first draft only specified the
   unshared state. Now both, and the shared state is where the undo lives — which is most of the point.
2. **Does un-sharing need a confirmation?** Decided no. A confirmation would reintroduce the finality the
   change exists to remove, and un-sharing is itself reversible.
3. **Is the copy the same for a document that has been shared before?** No, and this is where I took the
   cheap option deliberately: one variant, stated as a limit in the prototype boundary rather than
   handled. A returning sharer sees copy written for a first-timer.

"Nothing changed" would have meant I wrote the spec without looking hard at it. All three of these were
invisible to me until asked.

## Constitution check

| Principle                                    | Applies because         | How the spec handles it                                                                                                                                |
| -------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| §IV — TypeScript strict, no `any`            | New module under `lib/` | Typed return shape, no assertions                                                                                                                      |
| §IX — Quality gates before merge             | Any merge               | Gate plus `/smoke-diff` with a probe, in the tasks                                                                                                     |
| §X — File naming                             | New files               | kebab-case, co-located test                                                                                                                            |
| §XIV — team-os reflex                        | User-visible change     | The tasks include the ship-log entry, and creating the dossier `feature-index.yaml` records as absent                                                  |
| §XV — Analytics: track decisions, not clicks | One new event           | **Partial, and stated.** It records an open, which is a click. The decision is the one after it, and the event that would capture it is a second slice |
| §XVI — Visual identity contract              | Touches `app/`          | Tokens only; `design:lint` in the gate                                                                                                                 |

§XV is a partial rather than a pass, and writing it that way in the spec is the point. A Constitution
Check that returns all passes on a real change has usually been pattern-matched against the numbers.

## What is still open

- **The dismissal event.** Without it the specific behavior the bet is about — open, read, back out — is
  invisible. Named in the PRD, absent from this spec, and it needs its own slice.
- **The returning-sharer copy.** One variant ships. Whether that costs anything is unknown.
- **Who decides the stop condition has fired.** The PRD names the condition; nothing here names the person
  who calls it or when they look. That is a gap in the spec and not in the product.
