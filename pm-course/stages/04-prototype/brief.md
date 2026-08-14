# stage 4 · Prototype contract

Build one narrow thing, then make the agent tell you what it faked.

You produce **`prototype-contract.md`**, and a diff. The contract is the deliverable; the code is
evidence that you had something to write a contract about.

|          |                                                                   |
| -------- | ----------------------------------------------------------------- |
| Runs     | 5 · build the narrow thing (35 min) · 6 · interrogate it (20 min) |
| Surface  | Claude Code, in your fork                                         |
| Branch   | `feat/<something>` off `workshop-v1`. Not `main`, not `staging`   |
| Check it | `npm run course -- 4`                                             |

## What you are building

stage 3 ended in a verb. If you followed the reference answer, that verb was **narrow**: keep the
existing public-read path, change what the share action is _called_, and make it visibly reversible.

That is your prototype. It is deliberately small, and smallness is the lesson — the version that
costs three weeks was priced on a premise the code disproves, and the version that tests the same
question costs an afternoon.

If your stage 3 decision was different, build that instead. The contract is what is being assessed, not
the feature.

**Read the exemplar first.**
[`team-os/product/prds/growth/prototype-boundary.md`](https://github.com/avidx-app/noted-main/blob/main/team-os/product/prds/growth/prototype-boundary.md)
is a prototype boundary already written for this repo, for the `/documents/start` route. It is the
shape you are copying, including the part where it admits one of the prototype's own five example
prompts does not do what it says.

## The constraint that makes this hard

`DESIGN.md` is a **binding contract**, not a style guide — constitution §XVI. Anything you build under
`components/` or `app/` has to hold to it, and `npm run design:lint` says whether it does.

This matters more than it sounds. An agent asked to build a share dialog will produce something that
looks plausible and uses colors that are not in the palette. The design gate is the first place
in this workshop where the repo says no to an agent, and watching that happen is worth more than the
feature.

```bash
npm run design:lint
npm run lint:check && npm run type:check
```

## Run 5 — build it

Thirty-five minutes. Do not aim to finish. Aim to have something a person could click, and to know
exactly what it is not.

### Prompt for run 5

```
I want a narrow prototype, not a feature. Read DESIGN.md and treat it as binding —
constitution §XVI. Read team-os/product/prds/growth/prototype-boundary.md for the
house style of describing a prototype's limits.

Build: <your one narrow thing>

Constraints:
- Reuse what exists. Do not add a table, a migration, or a dependency.
- Do not build anything I did not ask for, even if it seems obviously needed.
- Where you take a shortcut, take it — but keep a list.

When you are done, before I look at the diff, tell me:
1. Every file you changed, and why.
2. Everything that only appears to work.
3. Anything you added that I did not ask for.
4. What a person clicking this would reasonably assume, that is not true.
```

Question 4 is the one worth the airfare. The others describe the code; that one describes what a
research participant will believe, which is what a prototype is for.

## Run 6 — interrogate it

Twenty minutes. **Read the diff yourself**, then compare it against what the agent told you.

```bash
git diff workshop-v1 --stat
git diff workshop-v1
```

The agent's list will be incomplete. Not because it lied — because it described what it set out to
build, and the diff records what it actually wrote. Files touched in passing, a prop threaded through
three components, an import added and unused, a default changed. These are exactly the things that
turn a "the prototype does not persist anything" claim into a false one.

Then fill the four boundaries. Every changed file goes somewhere:

| Boundary          | Means                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------- |
| **Real**          | A participant experiences the actual thing. Findings about it are valid                     |
| **Hard-coded**    | Works for the cases someone chose in advance, and only those                                |
| **Simulated**     | Looks like behavior, is a timer or a fixture. Whatever it teaches is a property of the fake |
| **Not connected** | Appears to do something and does nothing                                                    |

Then the two that make it a contract rather than a description: a **learning question** — the one
thing this exists to find out — and a **stop condition**, a result that would end the experiment
rather than a date.

## The template

```markdown
# Prototype contract — <what you built>

**By:** <you> · **Date:** <date> · **Branch:** <branch> · **Diff:** `git diff workshop-v1`

## The learning question

(one question, ending in a question mark. What do you not know that this will tell you?)

## The stop condition

(a result that ends this. "If <x> happens, we stop." Not a date.)

## What is real

## What is hard-coded

## What is simulated

## What is not connected

## What I deliberately did not build

## What the agent did not tell me

(what you found in the diff that was not in its list)
```

## What the checker does

```bash
npm run course -- 4
```

It reads your actual diff against `workshop-v1` and checks that **every changed file is accounted for
somewhere in the contract**. Not justified — mentioned. A boundary with a hole in it is worse than no
boundary, because somebody will trust it.

It also settles claims against the tree rather than taking them: say nothing is persisted while the
diff changes `convex/`, and it will say so. Touch `components/` or `app/` without mentioning
`DESIGN.md`, and it will point at §XVI. Add logic under `lib/` with no test, and it will name the
file.

Then four things it cannot check — including whether something you called simulated is one a
participant would read as real. That one is the whole act.
