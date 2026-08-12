---
name: market-pulse
description: Produce a structured market pulse for the note-taking + AI-editor space
summary: Market pulse for note-taking + AI space
---

# Market Pulse

## Trigger

Activate on "market scan", "market pulse", "what's happening in the market", "competitor moves this week", "news scan for [space]".

Noted does not currently run structured customer calls — the primary outward-looking intelligence comes from scanning the market. This skill produces a consistent, scannable pulse so pulses can be compared over time.

## Behavior

### Step 1: Get scope

Ask:
1. Period — weekly, biweekly, monthly? (If vague, default to the time since the last pulse in `team-os/research/market-pulse/`.)
2. Focus area(s) — note-taking apps, AI-editor platforms, Anthropic/OpenAI/Google releases, pricing moves, specific competitor?
3. Any signals already captured in `team-os/research/signals/` to fold in?

### Step 2: Gather

- Read the existing `team-os/research/competitors/<slug>/tldr.md` files to ground yourself in who we care about.
- Read `team-os/research/signals/` if it exists — these are raw observations waiting to be synthesized.
- Use WebFetch/WebSearch to pull fresh signals: competitor blog posts, press releases, changelog entries, recent funding news, relevant AI-platform releases.
- Do NOT fabricate. If a signal isn't verifiable from a source, flag it `[NEED: verify against X]`.

### Step 3: Draft the pulse

Use `team-os/templates/market-pulse.md` as the shape. Sections:

1. **Headline** — 1–2 sentences of what mattered most this period
2. **Competitor moves** — bullet list grouped by competitor. Link each to the source. Add a one-line "so what for Noted?" per bullet
3. **Platform shifts** — Anthropic / OpenAI / Google releases that affect our AI layer (model upgrades, price changes, new capabilities, deprecations)
4. **Signals worth tracking** — not yet stories but noteworthy (e.g., "X VC firm has invested in three note-taking startups in Q1")
5. **Implications for Noted** — honest prioritized take: copy / avoid / differentiate / ignore

### Step 4: Save and link

- Save to `team-os/research/market-pulse/YYYY-MM-DD-pulse.md`
- If any signal in the pulse changes a competitor's positioning, update that competitor's `teardown.md` or `pricing.md` too
- If any signal suggests a new PRD-worthy opportunity, flag it explicitly at the bottom

## Anti-patterns

- **Press-release dumps** — copying Tech­Crunch is not analysis.
- **Everything matters** — if everything is important, nothing is. Rank.
- **No "so what"** — a signal without an implication for Noted is trivia.

## Rules

- Keep pulses under 1000 words. Compression is the product.
- Cite every non-obvious claim with a URL.
- End with an "implications for Noted" section. If that section is empty, the pulse was a waste.
