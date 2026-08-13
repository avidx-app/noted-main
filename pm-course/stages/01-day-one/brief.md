# Stage 1 · Day one

Use the product, then read the repository, and come back with your own read of the room.

You produce **`pm-course/my-work/orientation-map.md`**, and one pull request that adds you to the roster.

|             |                                                                                    |
| ----------- | ---------------------------------------------------------------------------------- |
| Before this | The product runs locally and is deployed. See [`../../README.md`](../../README.md) |
| Roughly     | 90 minutes, of which the first 20 have the repo closed                             |
| Check it    | `npm run course -- 1`                                                              |

## The order matters more than anything else in this stage

**Twenty minutes on the running product with the repository closed.** Sign in. Create a document. Type
something real, not "test". Use `/Ask AI` inside the editor. Open the Coworker panel. Try to publish,
and try to send it to one person.

Then write down **one broken or confusing moment, in your own words**, before you read anyone else's
description of this product.

This is the only input to the whole course that nobody can give you. After a week in the repo you will
never see the product fresh again, and every observation you make will be shaped by someone else's
framing of it. Sarah asks for it in [`welcome.md`](../../onboarding/welcome.md) for exactly that reason.

Do not ask an agent to do this part. There is nothing for it to do.

## Then read the navigation files, not the code

In this order:

| Read                                                                  | Because                                                      |
| --------------------------------------------------------------------- | ------------------------------------------------------------ |
| [`README.md`](../../../README.md)                                     | What the team says the product is                            |
| [`CLAUDE.md`](../../../CLAUDE.md)                                     | The agent's entry point — a symlink to `.ai/INSTRUCTIONS.md` |
| [`team-os/CLAUDE.md`](../../../team-os/CLAUDE.md)                     | The map of the knowledge base                                |
| [`team-os/feature-index.yaml`](../../../team-os/feature-index.yaml)   | Feature → dossier, code paths, owner, status                 |
| [`team-os/INTENTIONAL-GAPS.md`](../../../team-os/INTENTIONAL-GAPS.md) | Which empty things are empty on purpose                      |

### The prompt

Paste this once your own observation is written down — not before.

```
You are helping me orient in a codebase I have never seen. I am a new product
manager here. Do not read application code yet.

Read these and nothing else: README.md, CLAUDE.md, team-os/CLAUDE.md,
team-os/feature-index.yaml, team-os/INTENTIONAL-GAPS.md.

Then answer, in a table, with a file path for each answer:
1. What does this product do today?
2. What did the team intend to build?
3. What has actually shipped?
4. Why were the main choices made?
5. Who is it for?

Label each answer: fact (someone can open it and see it), interpretation
(plausible, unproven), or unknown (the repo does not say).

Do not fill an unknown with a guess. If a question has no answer in these files,
say so and name the file where it should have been.
```

The last two sentences are the whole prompt. Without them you get five confident rows, and the empty
ones are where this stage lives.

## Find one place the repo disagrees with itself

There are several. They are not bugs — they are the difference between what a team wrote down and what
it did.

A contradiction qualifies when **two documents cannot both be describing the same product**, and you can
name both files. "The docs are incomplete" is not one. "This file says the feature is in design, and
this route exists" is.

```
Find places where this repository contradicts itself. A contradiction is two
documents that cannot both be true about the same product — not a gap, not a TODO.

For each candidate: the two file paths, what each one actually says, quoted, and
whether one is stale or both are accurate and describe different moments.

Do not reconcile them into a single narrative. If two sources disagree, keep the
disagreement. Rank by what a new joiner would get wrong believing only one.
```

Then **check the top candidate yourself, in the files.** An agent asked for contradictions will find
some, and at least one will be a paraphrase that sounds like a conflict. This is the five minutes of
the stage where you learn the most.

## Your first pull request

Add yourself to [`team-os/ROSTER.md`](../../../team-os/ROSTER.md). Branch off `main`, two lines, commit,
push, open the PR, merge it.

**Do this by hand, with no agent at all.** The point is to feel the branch, the review and the merge
while the stakes are nothing — and to notice that a two-line change is cheaper to make yourself than to
delegate. That judgment is most of what separates useful delegation from expensive delegation.

## The artifact

Copy this into `pm-course/my-work/orientation-map.md`.

```markdown
# Orientation map — noted

**By:** <you> · **Date:** <date> · **Minutes in the product before I read anything:** <n>

## 1. What I saw before I read anything

(one broken or confusing moment, in your own words)

## 2. What the repo says it is

| Question               | Where it is answered | What it says | Trust          |
| ---------------------- | -------------------- | ------------ | -------------- |
| What does it do today? | ``                   |              | fact           |
| What did we intend?    | ``                   |              | interpretation |
| What shipped?          | ``                   |              | unknown        |
| Why this choice?       | ``                   |              |                |
| Who is it for?         | ``                   |              |                |

## 3. The contradiction

**Between:** `path/one` and `path/two`

**What each says:**

**Verdict:** (A is wrong · B is wrong · both are right, and the gap is the finding)

**Why it matters:**

## 4. What I could not determine

## 5. What I would check next
```

Then the three things Sarah asked for that the map does not cover — one thing working well, one
question about why the team works this way, and one metric, as a single sentence: _"Noted is working if
**\_\_** goes up, because **\_\_**."_ Put them at the bottom.

## What the checker does

```bash
npm run course -- 1
```

It **re-derives your contradiction** rather than taking your word for it. Claim the ship log is empty
next to the merged pull requests and it counts both — merge commits from `git log`, rows from the file.
Every path you cite has to resolve. Then it prints four things it cannot check, which are the four
things this stage is actually about.

A contradiction it does not recognise is not a failure. It passes with a note asking for a human to
confirm it, because finding a new one is the better outcome — and on your own, that human is you an
hour later, with `convex/` open.

Then do the four unchecked questions in writing before you open
[`expected/orientation-map.md`](expected/orientation-map.md). See
[the README](../../README.md) for why that order matters.
