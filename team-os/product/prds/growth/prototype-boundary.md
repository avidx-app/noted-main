---
type: prototype-boundary
feature: ai-first-onboarding
status: current
owner: raziiabraham
last_updated: 2026-08-13
---

# Prototype boundary — `/documents/start`

What the AI-first onboarding prototype actually does, and what it only appears to do.

This exists because a prototype is a research instrument, and an instrument you cannot describe the
limits of produces evidence you cannot trust. Every claim below is checkable against
[`app/(main)/(routes)/documents/start/page.tsx`](../../../../app/%28main%29/%28routes%29/documents/start/page.tsx).

None of this is a defect. The prototype was built to find out whether people understand the offer
and want the thing — and for that question, the shortcuts below are the correct shortcuts. They only
become a problem when someone reads the route as a working feature.

## What is real

- The **interaction shape**: three screens — prompt, generating, result — and the transitions
  between them. A participant experiences the real pacing and the real decision points.
- The **copy**: heading, sub-copy, example prompts, and button labels are the actual proposed
  wording, so comprehension findings are about the real language.
- The **skip path**: skipping genuinely returns the user to `/documents`.
- The **visual treatment**: built from shadcn primitives and design tokens, so it looks like Noted
  rather than like a mockup.

## What is hard-coded

- **The five scaffolds.** `SCAFFOLDS` is a literal map of five titles and their section headings,
  plus a `default`. A participant whose job does not fall into meeting / launch / study / interview
  / brainstorm gets "Starter Document — Overview, Key Points, Next Steps, Notes".
- **The example prompts.** `EXAMPLE_PROMPTS` are fixed and were written to match the five scaffolds,
  which means a participant who clicks one is on a rail that always produces a good result.

## What is simulated

- **Scaffold selection is keyword matching, not comprehension.** `detectScaffold` runs five
  regexes over the lowercased text. "I'm preparing for an interview" matches `interview`. So does
  "I need to hire someone", which gets an interview _prep_ plan. No model is involved.
- **Generation is a timer.** `setTimeout(() => setScreen("result"), 1800)`. The 1.8 seconds is a
  guess at what generation would feel like, and it is identical for every input. Whatever the
  generating screen teaches about patience is a property of that number, not of the product.
- **The result is not generated content.** The result screen renders section headings from the
  hard-coded scaffold. It is an outline of an outline.

## What is not connected

- **No document is created.** Nothing is written to the `documents` table. The user's answer is
  never persisted anywhere.
- **"Open in editor" does not open the document.** `handleOpenEditor` routes to `/documents`. There
  is no created document to open.
- **The route is not wired to the zero-document entry point.** `/documents/start` is reachable only
  by typing the URL. A real new user never sees it. There is no eligibility check for "signed in
  with zero documents".
- **The `work-intent-onboarding` flag does not exist.** The PRD specifies it; no code reads it.
- **None of the analytics exist.** The PRD names five events —
  `Onboarding Intent Prompt Shown`, `Onboarding Intent Submitted`, `Onboarding Intent Skipped`,
  `Onboarding Starter Document Created`, and the in-editor AI triggers. None are in
  `lib/analytics.ts`. Running the prototype produces no data.

## What this can and cannot tell you

**It can test:** whether people understand what is being asked, whether they know what to type,
whether being asked intent first reads as helpful or obstructive, whether the proposed section
headings match the job they had in mind, and what they expect "Open in editor" to do.

**It cannot test:** whether generated content would be good, whether the flow lifts second-document
rate, whether keyword routing is accurate enough, how failures feel, or anything at all about
mobile.

**Reading behaviour off this prototype is the specific trap.** A participant who completes the flow
has completed a flow that always works, in 1.8 seconds, with an answer chosen from five. The real
version would sometimes be slow, sometimes be wrong, and sometimes fail. Observed enthusiasm here is
evidence about the _offer_, not about the _product_.

## Before this becomes a feature

The gap between this route and the PRD is, in rough order: eligibility check, real generation, real
document creation, real navigation, the feature flag, and the five events. The instrumentation has
to land **before** the experiment, not with it — the PRD's own data-scope section asks whether
`Document Created` fires from every path, and that question is still open.
