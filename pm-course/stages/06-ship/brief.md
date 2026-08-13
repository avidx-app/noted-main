# stage 5 · Delivery slice

Take the prototype through the repo's own workflow, and open a real pull request.

You produce **`delivery-record.md`** and a pull request into `staging`.

|          |                                                                    |
| -------- | ------------------------------------------------------------------ |
| Runs     | 7 · through the workflow (40 min) · 8 · review, ship, log (25 min) |
| Surface  | Claude Code, in your fork                                          |
| Check it | `npm run course -- 6`                                              |

## Start by reading a pull request that got this right, and one that did not

Open [PR #81](https://github.com/avidx-app/noted-main/pull/81) in noted. Before you scroll to the
diff, read the description.

It ran `/noted-review` on itself and pasted the verdict: **🛑 BLOCK — 5 issues to fix before merge**,
against its own author's work. Three were fixed. Two were left standing with reasons. And it ends with
two lines that are the reason this act exists:

> `[ ] Not verified: that In-Editor AI Triggered actually reaches Amplitude. Needs a project and a key; verified by unit test and SDK contract only.`
>
> `[ ] Not verified: the no-MCP fallback paths described in .ai/INSTRUCTIONS.md.`

Unticked boxes, on a merged pull request, describing what its author could not confirm.

In the same description it names the counter-example: a pull request in a cohort fork that **merged
carrying its own 🛑 BLOCK verdict** and two unticked checklist items, with nobody noticing. Same tool,
same repo, same verdict. One PR treated the verdict as information and one treated it as paperwork.

**Ten minutes on this, in the room, before anybody runs anything.** The question to answer out loud:
what would have had to be true for that other PR to stop?

## Run 7 — through the workflow

Forty minutes. Use the repo's commands. They are the point — this repo has opinions and the commands
are where they live.

```
/feature-workflow      the phases, in order. Phase 0 will ask for user grounding — you have it now
                       from stage 3, so cite it rather than skipping it
git diff workshop-v1   read your own diff before anyone else does
/grill-me              hard questions on the plan, before the review
/noted-review          the compliance review. Read the verdict, do not skip to the end
```

Two things will happen and both are the lesson.

**Phase 0 will demand customer evidence.** For most features in this repo those inputs are `[NEED:
...]` markers. You have real ones — your stage 3 evidence map. Cite it, and cite its provenance
honestly: the research it rests on is constructed, and that is a limit on the claim, not a reason to
omit it.

**`/noted-review` will find things.** It reviews against `.ai/skills/` and the constitution's
seventeen principles. Expect a verdict that is not ✅. That is the normal outcome and the interesting
one.

You do not have to fix everything. You have to **record what you did about each finding** — fixed,
or left standing with a reason. "I disagree with this finding because X" is a legitimate and often
correct outcome. Silence is not.

## Run 8 — review, ship, log

Twenty-five minutes.

```
/create-pr             opens the PR into staging, not main
/ship-log <PR>         adds the row a non-engineer can read
```

The ship log is the step everyone skips, and noted's is empty next to a merge history that is not —
see [`NOT-118`](https://github.com/avidx-app/noted-main/blob/main/team-os/research/conversations/linear/NOT-118-ship-log-automation.md),
open and unassigned since February. The reason it stays open is that the hard part — saying what
changed _for a user_ rather than what changed in the code — is the part automation does not help with.
Write one row. Notice that it is harder than the commit message was.

Then the quality gate, which constitution §IX puts before merge:

```bash
npm run lint:check && npm run type:check && npm run test && npm run design:lint
```

## The template

```markdown
# Delivery record — <the slice>

**By:** <you> · **Date:** <date> · **Branch:** <branch> · **PR:** <url>

## The slice

(one sentence. What can a user now do that they could not before?)

## Constitution check

| Principle | Applies because | Pass? |
| --------- | --------------- | ----- |
| §         |                 |       |
| §         |                 |       |

## What I verified, and how

(name the command or the click. "Works" is not a method.)

## What I did not verify

(there is always something. A path you did not exercise, a key you do not have,
a browser you did not open, a state you could not reach.)

## The review verdict, and what I did about it

(paste the verdict. Then per finding: fixed, or left standing and why.)

## The ship-log entry

(the row you added, and which file it went in.)

## The pull request

(url, base branch, and anything a reviewer should read first.)
```

## What the checker does

```bash
npm run course -- 6
```

**The section it cares most about is "What I did not verify".** Leave it empty, or write "nothing", and
it fails. That is not pedantry: it is the standard this workshop is assessed against four weeks later,
and it is the one thing PR #81 does that the cohort PR did not.

The rest is re-derived rather than accepted. Cite `§XVIII` and it will tell you the constitution has
seventeen principles. Claim `npm run verify` and it will tell you `package.json` does not define it.
Mention the ship log without touching one in the diff and it will say so. Change logic under `lib/` or
`convex/` with no test and it will name the file, because §IX puts the gate before the merge.

It also checks you are not on `main` or `staging`.

Then four things it cannot check — including whether a reviewer who did not write this would reach the
same verdict. Trade records with your neighbour for that one.
