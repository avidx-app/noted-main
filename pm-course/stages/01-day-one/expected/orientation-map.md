# Orientation map — noted @ workshop-v1

**By:** reference answer · **Date:** 2026-08-13 · **Minutes in the product before I read anything:** 18

This is one good answer, not the answer. It is here so you can see the shape and the level of
specificity expected — and so the checker has something to test itself against. Yours will name a
different moment in section 1, and it may well name a better contradiction in section 3.

## 1. What I saw before I read anything

I wrote a short document, then went looking for a way to send it to one person for comment. There
isn't one. The only sharing control is a **Publish** toggle that puts the document on the public web
at a preview URL. So the choice is: keep it private, or publish it to everyone. Nothing in between.

I noticed this because I hesitated before clicking Publish on a half-finished draft — and then
didn't. The thing I wanted was "let one person read this and not the internet", and I couldn't find
it because it isn't there.

Second, smaller: `/Ask AI` in the editor did nothing until I opened settings and pasted my own
provider key. The empty state didn't tell me that; I found it by clicking around.

## 2. What the repo says it is

| Question               | Where it is answered                       | What it says                                                                                                                                                                             | Trust          |
| ---------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| What does it do today? | `README.md`, and the running app           | An AI-native note-taking app: documents in a hierarchy, a BlockNote editor, in-editor AI, a Coworker chat panel, publish-to-web                                                          | fact           |
| What did we intend?    | `team-os/product/prds/`                    | Five PRDs. Two describe things that are live; three describe things that are planned or in design                                                                                        | interpretation |
| What shipped?          | `team-os/features/ai-features/ship-log.md` | Nothing. The log has no entries, and says engineering backfills "from this point forward"                                                                                                | fact           |
| Why this choice?       | `team-os/engineering/constitution.md`      | Seventeen numbered principles, versioned and ratified. Genuinely answers "why" for engineering choices, and not at all for product ones                                                  | interpretation |
| Who is it for?         | `team-os/research/personas.md`             | Five personas by relationship to the product — Drafter, Reviewer, Newcomer, Tinkerer, Expander. Sourced from `team-os/research/interviews/`, which are labeled `provenance: constructed` | unknown        |

The last row is the one to be careful about. There is a full research layer, it is internally
consistent, and it describes friction I hit myself in section 1 — and every transcript in it says on
its face that no customer said any of it. It is evidence about the workflow, not about demand. I
have labeled it `unknown` rather than `interpretation` because "who is this for" is precisely the
question constructed research cannot answer.

## 3. The contradiction

**Between:** `team-os/feature-index.yaml` and `app/(main)/(routes)/documents/start/page.tsx`

**What each says:** The feature index records `ai-first-onboarding` with `status: in-design`, and
the comment above it is explicit — "A bet in flight, not a feature… there is no eligibility check,
no flag, no generation, and no instrumentation." But the route exists, it renders, and it is not a
sketch: three screens, real proposed copy, five example prompts, a working skip path. Anyone who
opens it in a browser sees a finished-looking onboarding flow for a feature the index says has not
been built.

**Verdict:** Both are right, and the gap is the finding. The index is accurately describing what has
shipped to users, which is nothing. The route is accurately a prototype. Neither document is stale.
What is missing is any signal _at the route itself_ that it is an instrument rather than a product.

**Why it matters:** Someone who finds `/documents/start` first — a new engineer, a designer, anyone
demoing — reads it as evidence that onboarding works. It does not. Typing "I need to summarize
lecture notes" returns a Meeting Notes scaffold, because selection is five regexes over lowercased
text and `notes` matches the meeting branch first. That string is one of the five example prompts
the prototype itself offers. The generating screen is `setTimeout(…, 1800)`. No document is created,
and "Open in editor" routes to `/documents` because there is nothing to open.

The repo does resolve this, in `team-os/product/prds/growth/prototype-boundary.md`, which lists what
is real, hard-coded, simulated and not connected. That document is excellent and nothing links to it
from the route. So the contradiction is not that the team was careless — it is that the resolution
lives one hop away from where anyone will hit the problem.

**A candidate I rejected.** The agent's first suggestion was that
`team-os/features/ai-features/ship-log.md` contradicts `team-os/INTENTIONAL-GAPS.md`: the ship log
says "do not try to reconstruct history", and the gaps register calls reconstructing it "a genuine
exercise". Both quotes are accurate and it is not a contradiction — the register's next paragraph
says that if you backfill you must say so and name the PRs you read. So the instruction is _do not
silently reconstruct_, and the exercise is _reconstruct and label it_. Those are compatible, and the
distinction between them is the entire point.

Worth writing down because it is the failure mode in the other direction. Stage 1 rewards finding
contradictions, so an agent asked for them will promote near-misses, and a rule plus its stated
exception reads exactly like a rule being broken. I nearly took it.

## 4. What I could not determine

- **Why publish-to-web is the only sharing primitive.** It is the gap I hit in section 1 and it is
  the top-ranked pain in `team-os/research/pain-landscape.md`, at 7 of 11 transcripts. I cannot tell
  from the repo whether it was a considered trade-off or simply the first thing built. There is no
  RFC and no ADR — `team-os/INTENTIONAL-GAPS.md` confirms both directories are deliberately empty —
  and `team-os/product/prds/collaboration/team-collaboration-prd.md` describes the fix without ever
  saying why it wasn't the original design.
- **How many people any persona covers.** Every persona is qualitative. `feature-workflow`'s Phase 0
  says so itself, in a `[NEED: Amplitude behavioral cohort per persona]` marker. So no claim in this
  map about how _common_ anything is can be supported from this repo.
- **Whether `Document Created` fires from every creation path.** The growth metrics file raises this
  as an open question and it stays open, which means the one baseline that is measurable today may
  not be counting everything.

## 5. What I would check next

**Instrument the moment I got stuck.** The claim I care about is the one from section 1: that people
draft, reach the point of wanting one reader, and stop. Two events would test it — a share intent
that fires when the Publish popover is opened, and the existing `Document Published`. If openings
substantially exceed publishes, the hesitation is real and measurable; if they track each other, my
experience was idiosyncratic and pain #1 is over-ranked. The event does not exist today, so this is
an instrumentation ticket before it is a research question.

**Decision it changes:** whether team collaboration is the next bet or whether a comment-only link
is a smaller slice that resolves the same pain. `team-os/product/prds/collaboration/team-collaboration-prd.md`
is currently sized as the former.

Not: talk to more users. Every transcript in this repo is constructed, so more of them cannot raise
my confidence about demand — only real ones or real behavior can, and behavior is cheaper here.
