# Stage 5 · The spec

Take the PRD through `feature-workflow` and the speckit chain until a bundle exists.

You produce a directory under **`specs/`**, and **`pm-course/my-work/spec-record.md`** — your account
of producing it.

|             |                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| Before this | A PRD, and a prototype you can describe the limits of                                                  |
| Check it    | `npm run course -- 5`                                                                                  |
| Use         | `/feature-workflow`, then `/speckit.specify` → `/speckit.clarify` → `/speckit.plan` → `/speckit.tasks` |

## Phase 0 will stop you, and that is the feature

[`feature-workflow`](../../../.ai/skills/feature-workflow/SKILL.md) makes user grounding mandatory and
refuses to proceed without it: a persona, a pain, and a real quote copied from a transcript rather than
from a summary. For most features in this repo those inputs are `[NEED: ...]` markers.

**You have them.** Your evidence map and your PRD are exactly what Phase 0 is asking for. Cite them,
with paths — and cite the provenance, because the research they rest on is constructed. A spec grounded
on constructed evidence is valid for building; it is not proof the feature is wanted, and the record
should say which.

Do not skip Phase 0 because you know the answer. The point of a gate you can pass is finding out what
it feels like to pass it honestly.

## What finished looks like

[`specs/EXP-1-in-editor-ai-triggered/`](../../../specs/EXP-1-in-editor-ai-triggered/spec.md) is the one
completed bundle in this repo. It exists because the pipeline had never run to completion before, and it
is the only honest answer to what "done" means here. The checker reads that directory to know what files
your bundle needs, rather than trusting a list.

Two things about it worth copying:

- **`checklists/requirements.md` is actually ticked.** A gate nobody passed is not a gate.
- **No `[NEEDS CLARIFICATION]` markers survive.** That is what `/speckit.clarify` is for, and running it
  is how you find the questions you did not know you had.

## The artifact

```markdown
# Spec record — <the slice>

**By:** <you> · **Date:** <date> · **Bundle:** `specs/<slug>/`

## The slice this spec covers

(one sentence. Narrower than the PRD, on purpose.)

## How Phase 0 was satisfied

(persona, pain, and the quote — with paths. And what the grounding rests on.)

## What clarify changed

(the questions it surfaced, and what you decided. "Nothing" is not an answer.)

## Constitution check

| Principle | Applies because | How the spec handles it |
| --------- | --------------- | ----------------------- |

## What is still open

(what the spec does not settle, and who has to settle it.)
```

## What the checker does

```bash
npm run course -- 5
```

It checks the **bundle**, not just the record: that one exists, that it has the same files as the
exemplar, that no `[NEEDS CLARIFICATION]` survived, and that the requirements checklist has boxes ticked.
Then the record: that Phase 0 was satisfied with real paths, that the provenance is stated, and that
clarify changed something.
