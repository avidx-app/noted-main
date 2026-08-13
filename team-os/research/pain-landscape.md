---
type: pain-landscape
status: current
owner: raziiabraham
last_updated: 2026-08-13
evidence: team-os/research/interviews/
---

# Pain landscape

What hurts, ranked by how many independent transcripts raise it unprompted and how much of the
product's value it gates.

Same provenance caveat as everything in this folder: the evidence is
[eleven constructed transcripts](interviews/CLAUDE.md). Ranking constructed evidence tells you what
the simulation contains, not what the market wants.

| #   | Pain                                               | Raised by                                     | Gates                                       |
| --- | -------------------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| 1   | No step between private draft and public page      | Devon, Mia, Renee, Marcus, Anya, Carlos, Rina | Publishing, team expansion, recommendation  |
| 2   | Squad asks for configuration before it gives value | Ethan, Jordan, Devon, Marcus, Nora            | Activation into the differentiated feature  |
| 3   | The reviewer has to be recruited into the product  | Rina, Devon, Carlos                           | Any review step that assumes accounts       |
| 4   | AI makes weak work sound finished                  | Devon, Marcus                                 | Trust in the output, willingness to publish |
| 5   | Model and prompt attribution is opaque             | Kai, Nora                                     | Power-user retention                        |

---

## 1. There is no step between private and public

Seven of eleven. The single dominant finding.

Noted has exactly two states: private, and published to the web. The work people actually do has
three — draft, reviewed, public — and the product asks them to jump the middle one.

> "The emotional sequence matters. Draft. Review. Public. Not draft then public." — Devon

The vocabulary is part of the pain, not decoration on it. "Publish" tells both the writer and the
reader that the thing is finished; Rina reports the format overriding an explicit verbal _"ignore
the roughness."_

**Why this is easy to misread.** The behavioural signature is high AI usage and low publish rate,
which reads as "publish isn't valuable" or "users abandon."

> "Low publish doesn't mean low intent. It means the product is solving the first half of the
> workflow really well and then leaving me alone for the moment that requires judgment." — Devon

Devon's own instrumentation suggestion is the useful one: look for people who use AI, create a
document, revise it several times, and then stop short of publish. That pattern is unresolved
intent, not abandonment — and `chat_to_publish_gap` in `scripts/fixtures/` plants exactly it.

**What people want is narrower than "collaboration."** Comment-only, one or two readers, no account
for the reviewer, and the document staying a document. Every request for real-time editing,
presence, or workspace management in this set was volunteered by the interviewer and declined by the
customer.

## 2. Configuration before value

Five of eleven, and the one place two people independently reached the same phrase.

Squad agents ask the user to design a reusable system before they have evidence they need one.

> "The setup cost comes before the proof of need." — Devon

Everyone who described this also said the feature was obviously powerful. That is what makes it an
onboarding cliff rather than a rejection: the value is legible and the entry cost is front-loaded.
The requested fix is consistently examples rather than capability — Ethan's _"starter templates. Real
examples"_, not more configurability.

**Relevance to the current bet.** This is the blank-box problem, and the AI-first onboarding PRD
proposes fixing its sibling — the blank _document_ — with the same move: replace an empty input with
a concrete starting point. Worth noting that the evidence supports the _diagnosis_ transferring;
whether the treatment does is untested.

## 3. The reviewer is a non-user

Three of eleven, and structurally important out of proportion to that count: this pain is felt by
someone who will never appear in the product's analytics.

> "If the product asks me to recruit people into a platform just to react to one draft, I will fall
> back to something simpler." — Devon

Rina prefers comment-only access, which inverts the usual permission ladder. Comment-only is the
premium experience here, not the restricted one.

Any solution to Pain 1 that requires the reviewer to sign up does not solve Pain 1.

## 4. Fluency without conviction

Two of eleven, but both articulate about it, and it explains _why_ Pain 1 has such a grip.

> "AI can make mediocre ideas sound coherent enough that you stop interrogating them." — Devon

The reviewer is not an approver. Devon's word is _falsification layer_ — the human step exists to
catch what fluent output hides. Marcus's version is tone and implication carrying weight he cannot
check himself.

This is a strength report as much as a complaint: it is the pain of a product that got someone to a
draft fast enough that judgement became the bottleneck.

## 5. Attribution is opaque

Two of eleven, both Persona 04. Real, and deliberately ranked last.

Kai and Nora want to know which model and which prompt path produced a result. Devon, asked directly
to compare this against the review bridge, called it _"nerd garnish."_

Listed here so it is not lost, and ranked here so it is not mistaken for a growth blocker. The
people who ask for it most clearly are the people already retained.

---

## What is missing from this landscape

- **Churn.** No transcript is from someone who left, so no pain that causes leaving is represented.
- **Behaviour.** All stated preference. The seeded cohort provides frequency for four of these
  themes, but it was authored alongside the interviews and so cannot corroborate them.
- **Cost, pricing, and performance.** Nobody raised any of the three. That is more likely a property
  of who was interviewed than evidence that they do not matter.
- **Mobile.** Never mentioned by anyone.

## The decision this landscape supports

Pain 1 is the one worth resolving next on this evidence: most-raised, gates the most, and named
independently by the drafter, the reviewer and the buyer.

It is **not** what the current in-flight bet addresses.
[`ai-first-onboarding-prd.md`](../product/prds/growth/ai-first-onboarding-prd.md) targets Pain 2's
sibling at the front of the funnel. That is a defensible choice — it is smaller, it is testable, and
Pain 1 needs a permissions model nobody has designed. But it should be a stated choice rather than
an implied one, and the PRD does not currently say why the second-ranked pain is being worked before
the first.

`[NEED: decision recorded on why onboarding precedes draft review]`
