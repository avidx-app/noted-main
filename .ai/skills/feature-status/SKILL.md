---
name: feature-status
description: Answer "what's the status of feature X" using the feature dossier + ship log + code
summary: Feature status from dossier + ship log
---

# Feature Status

## Trigger

Activate on "what's the status of [feature]", "is [feature] live?", "what's happening with [feature]", "can I tell a customer about [feature]", "update me on [feature]".

This skill exists because non-engineers (customer service, sales, leadership) frequently need a *one-shot* answer about a feature without interrupting an engineer. The full truth lives across the dossier, ship log, and code.

## Behavior

### Step 1: Resolve the feature

1. Open `team-os/feature-index.yaml` and find the matching feature slug. If the user's phrasing is ambiguous, list the closest matches and ask.
2. If the feature is not in the index: search `team-os/features/` for a folder. If still nothing: tell the user this feature isn't tracked yet and offer to scaffold a dossier.

### Step 2: Load the right context — in this order

Stop as soon as you have a confident, citation-backed answer. Don't burn tokens.

1. `team-os/features/<slug>/status.md` — should have rollout state, known issues
2. `team-os/features/<slug>/customer-talking-points.md` — if the user is asking to talk to a customer
3. `team-os/features/<slug>/faq.md` — if the question matches a known FAQ
4. `team-os/features/<slug>/ship-log.md` — for recent PRs and merge dates
5. `team-os/features/<slug>/index.md` — deeper background if the status isn't enough
6. Code paths from `feature-index.yaml` — only if the above are stale or missing

### Step 3: Answer

Format:

```
**Status:** <live | beta | rolling-out-NN% | planned | paused>
**Shipped last:** <date + PR link from ship-log>
**Known issues:** <bullet list or "none">

<1–2 paragraph plain-English summary of where it is and what's next>

**If customer-facing talking points were asked for:** <copy from customer-talking-points.md, don't paraphrase>

**Sources:**
- team-os/features/<slug>/status.md (last updated <date>)
- team-os/features/<slug>/ship-log.md
```

### Step 4: Flag staleness

If `status.md` is older than 2 weeks or the last ship-log entry is older than 4 weeks, include a line:

> ⚠️ This dossier hasn't been updated recently. Verify with <owner from feature-index.yaml> before promising anything to a customer.

### Step 5: If nothing is documented

If there is no dossier and the question is important enough to need one:

1. Say: "No dossier exists for this feature yet. I can scaffold one from `team-os/templates/feature-dossier/` — want me to?"
2. If they say yes: create the folder and pre-fill what you can from code + any existing PRD in `team-os/product/prds/`.

## Rules

- **Never fabricate status.** If `status.md` doesn't say "50% rollout", don't claim it. Read, quote, cite.
- **Direct customer-facing language goes through `customer-talking-points.md` verbatim.** Don't invent marketing copy on the fly.
- **Stale beats missing.** A dossier last-updated 6 weeks ago is still better than nothing — flag it, use it, update it.
- **The answer should fit in a Slack message.** If it's longer than ~150 words, the user probably asked for more depth — in which case, fine. Otherwise, compress.
