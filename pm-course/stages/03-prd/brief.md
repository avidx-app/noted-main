# Stage 3 · The PRD

Turn a decision into a specification somebody else could build from.

You produce **`pm-course/my-work/prd.md`**, using the repo's own template and its own command.

|             |                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------- |
| Before this | Your evidence map, ending in a verb                                                         |
| Check it    | `npm run course -- 3`                                                                       |
| Use         | `/prd-new`, and the [`prd-writer`](../../../.ai/skills/prd-writer/SKILL.md) skill behind it |

## Start from the template, not from a blank page

[`team-os/templates/prd.md`](../../../team-os/templates/prd.md) is the hand-off format this team uses.
Nine sections: context, key assumptions, objectives, design scope, eng scope, data scope, ops scope,
experiment design, launch plan. The checker reads that file to know what you need, so if the template
changes the requirement follows it — and the template is the only place the shape is defined.

Two of those sections do the work and the rest are scaffolding around them.

**Key assumptions.** Every one carries a validation status: _validated_, _partially validated_, or
_pending validation_, with the source. This is where your evidence map earns its keep — an assumption
you marked validated has to be validated by something that could have disagreed. Most of yours will be
_pending_, and a PRD that admits that is stronger than one that does not.

**Experiment design.** How you would know. If the honest answer is that you cannot know yet, say so and
say what is missing. [`ai-first-onboarding-metrics.md`](../../../team-os/analytics/metrics/growth/ai-first-onboarding-metrics.md)
is the worked example: its own readiness verdict is **not ready to run**, and filing it that way was the
right call.

## The trap in this stage

The one baseline available for the in-flight bet is **92–96%, and it comes from `scripts/fixtures/`.**
The metrics file says treating it as real is "the single most likely way to misread this experiment".

If you cite it, say where it came from. The checker looks for that specifically, because a target set
against a fixture turns seeded data into a commitment, and every argument downstream inherits it
without knowing.

Same rule for events: name one that `lib/analytics.ts` does not emit and either mark it
`[NEEDS INSTRUMENTATION]` or do not claim you can measure it.

## The prompt

```
Draft a PRD using team-os/templates/prd.md as the format. My decision and the
evidence behind it are in <paste your evidence map>.

Rules:
- Every key assumption gets a validation status and a source path.
- Do not upgrade "pending validation" to "validated" because it reads better.
- If a metric needs an event this product does not emit, mark it
  [NEEDS INSTRUMENTATION] rather than assuming it.
- If a number came from scripts/fixtures/, say so on the line where you use it.
- Where the evidence cannot support a claim, write the claim smaller.
```

The last rule is the one worth watching. An agent asked for a PRD will produce confident scope; asked
to write the claim smaller, it produces scope you can defend.

## The artifact

Copy [`team-os/templates/prd.md`](../../../team-os/templates/prd.md) into
`pm-course/my-work/prd.md` and fill it in. Keep the section headings — the checker matches on them.

## What the checker does

```bash
npm run course -- 3
```

Sections from the template. Assumptions each labeled. Every cited path resolves. Something links back
to your evidence map or to `team-os/research/`, because a PRD with no ancestry is an opinion with
headings. Then two re-derivations against the tree: the seeded baseline, and whether the events you
name are ones this product emits.
