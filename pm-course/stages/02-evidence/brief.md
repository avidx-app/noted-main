# stage 3 · Evidence operations

One claim, six sources that could have disagreed, and a decision with a verb on it.

You produce **`evidence-map.md`**. Run 1 fills sections 1 to 4, run 2 fills 5 to 7.

|          |                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------- |
| Runs     | 3 · one claim, six sources (35 min) · 4 · score it, then decide (25 min)                                  |
| Surface  | Claude Cowork, with your fork as a source                                                                 |
| Check it | `npm run course -- 2`                                                                                     |
| You need | The seeded cohort — `npm run seed:convex` and `npm run seed:amplitude`. See [the README](../../README.md) |

## Start by looking at your own data

```bash
npm run data
```

Per-persona counts out of your own Convex, then the four questions the cohort was built to answer. One
of them is answerable from Convex only — no Amplitude event sees it, because publish intent is not
instrumented. That is the pattern behind the top-ranked pain in the research, so anyone working from
charts alone misses the most important thing in the dataset.

## The six sources

All six ship with the fork. No connectors, no logins you do not own.

| #   | Source                            | Answers                                                                       |
| --- | --------------------------------- | ----------------------------------------------------------------------------- |
| 1   | The running product               | What actually happens when you try                                            |
| 2   | `team-os/`                        | What the team wrote down — PRDs, personas, pain landscape, interviews         |
| 3   | `team-os/research/conversations/` | What was said before anybody wrote it up — Slack, Linear, pre-decision Notion |
| 4   | The merge history                 | What shipped, and when, and what did not                                      |
| 5   | The code                          | What the system does today                                                    |
| 6   | Your Amplitude project            | How often, across the seeded cohort                                           |

Read [`team-os/research/conversations/CLAUDE.md`](https://github.com/avidx-app/noted-main/blob/main/team-os/research/conversations/CLAUDE.md)
before you quote anything from source 3. It tells you something about itself that changes how much
weight it carries.

## Run 3 — one claim, six sources

Thirty-five minutes. **Write sections 1 and 2 before you search.** That is not a suggestion; it is the
only part of the method that cannot be recovered afterwards. Once you have seen the answer you will
not be able to reconstruct what you would have accepted as disproof.

1. **State the claim** from your stage 1 observation. One sentence, and it has to be capable of being
   false. "Onboarding could be better" is not a claim.
2. **Write what would change your mind.** Name the evidence, not the feeling. If you cannot describe
   the finding that would make you abandon the claim, you are going to find agreement.
3. **Then run all six.** Fill the table as you go — one row per source, what it says, what kind of
   knowing it is, and whether it could have disagreed with the others.
4. **Keep the contradictions.** Do not let the agent reconcile two sources into one clean paragraph.
   If two things cannot both be true, that is section 4 and it is the most valuable part of the map.

### Prompt for run 3

```
I am testing one claim about this product. Here it is, and here is what would
change my mind: <paste both>

Check it against six sources, separately, and report them separately:
1. team-os/ — what the team wrote down
2. team-os/research/conversations/ — Slack, Linear, and Notion pages
3. the git merge history
4. the code
5. the running product (I will do this one)
6. Amplitude (I will do this one)

For each: quote it, give me the file path, and label it verified fact,
interpretation, contradiction, or unknown.

Do NOT reconcile them. If two sources disagree, report both and say they
disagree. Do not produce a summary paragraph. I want the disagreements
preserved, especially any place where a document and the code say different
things.
```

The last paragraph is load-bearing. Without it you get one fluent narrative in which everything
agrees, because that is what a summary is for.

### The two moves that separate a good map from a fast one

**Ask which source settles it.** Most claims about a product have one source that is decisive and five
that are commentary. For anything about what the system _can_ do, that source is the code — and it is
the one an evidence sweep is least likely to open, because reading a PRD feels like research and
reading a query feels like engineering. The checker will fail a map that never cites a file under
`convex/`, `lib/`, `app/` or `components/`.

**Ask of every agreeing pair: could this one have contradicted the other?** If not, you have one
source counted twice. Some of what you are about to read was authored together and cannot corroborate
itself. The repo says which parts, on the face of the folders. That is what the last column is for,
and the checker verifies it against what noted declares about itself.

## Run 4 — score it, then decide

Twenty-five minutes.

5. **Name what you could not answer.** Every claim the evidence cannot reach is a finding. A map with
   no unknowns has not been honest about the seeded data.
6. **Score the assumptions.** `priority = uncertainty × consequence`, each 1 to 5. Uncertainty is how
   weak, indirect, contradictory or simulated the evidence is — seeded data scores 5. Consequence is
   how much the answer changes the cohort, the solution, the metric or the trust boundary.
7. **Decide, with one of six verbs:** _proceed · revise · narrow · pivot · stop · investigate_.
   Attach the owner and **the artifact that must change**. `investigate` only counts if you name the
   missing evidence and the decision it blocks.

The arithmetic in step 6 is not scientific. It exists to stop a minor unknown and a bet-invalidating
assumption getting the same afternoon.

## The template

Copy this into `evidence-map.md`.

```markdown
# Evidence map — <topic>

**By:** <you> · **Date:** <date>

## 1. The claim I am testing

## 2. What would change my mind

(written before searching)

## 3. The evidence

| Source | What it says | Kind           | Could it have disagreed? |
| ------ | ------------ | -------------- | ------------------------ |
|        |              | fact           |                          |
|        |              | interpretation |                          |
|        |              |                |                          |
|        |              |                |                          |

## 4. Contradictions I am keeping

(two sources that cannot both be true. Name both files.)

## 5. What I could not answer

## 6. Priority

| Assumption | Uncertainty | Consequence | Score |
| ---------- | ----------- | ----------- | ----- |
|            |             |             |       |
|            |             |             |       |

## 7. The decision

**Verb:** (proceed · revise · narrow · pivot · stop · investigate)

**Owner:**

**Artifact that must change:**
```

## What the checker does

```bash
npm run course -- 2
```

It re-derives, rather than recognizing. Name a contradiction it knows and it goes and checks whether
that contradiction actually holds in your tree — reading the query, the schema, the merge history, or
the transcript, as appropriate. Two checks are worth knowing about in advance, because they are the
act:

- **Independence.** If a row claims a source could have disagreed, and every file that row cites is
  part of what noted declares as authored-together, it fails and says which row.
- **Consulted the code.** A map with no code path in it fails, whatever else is in the table.

Then it prints four things it cannot check. Those are the four things this act is about.
