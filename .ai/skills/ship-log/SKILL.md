---
name: ship-log
description: Log a shipped PR to the right feature's ship-log.md so non-engineers can see what's live
summary: Append ship-log entry
---

# Ship Log

## Trigger

Activate on "log this ship", "ship-log", "just merged a PR", "update the ship log", "record this merge", "/ship-log".

Purpose: close the loop for customer service, leadership, and anyone else who asks "is X live yet?". When engineering merges, this skill updates the feature dossier so the answer is at rest in the repo — not in Slack.

## Behavior

### Step 1: Identify the PR and the feature

Ask (or infer from context):
1. PR number or URL? (If the user just merged, you can call `gh pr view --json number,title,mergedAt,url,author,body,baseRefName` to fetch.)
2. Which feature in `team-os/feature-index.yaml` does this belong to? If ambiguous, list candidates.
3. If the feature has no dossier folder yet: offer to scaffold one from `team-os/templates/feature-dossier/`.

### Step 2: Gather metadata

For the PR, capture:
- Number + title + URL
- Merged date (ISO)
- Author (GitHub handle)
- Target branch (staging vs main — in Noted, "live" usually means merged to `main`)
- A one-sentence "what changed for the user" (ask the user if the PR description doesn't make it obvious)
- Optional: test coverage delta if easy to run (`npm run test:coverage` pre/post — but do NOT run blindly; ask if this matters)
- Optional: deploy status

### Step 3: Append to ship-log

Open `team-os/features/<slug>/ship-log.md` (create it from `team-os/templates/ship-log-entry.md` if missing).

Append a new row to the table at the top:

```markdown
| Date (merged) | PR | Author | What changed for the user | Deploy status |
|---|---|---|---|---|
| 2026-04-17 | [#43](https://github.com/avidx-app/noted/pull/43) | @raziiabraham | Added Anthropic provider support to AI settings modal | ✅ prod |
```

Newest at top. Keep "What changed for the user" written for a non-engineer audience — no implementation details.

### Step 4: Update status.md if the change moved the needle

If the PR materially changed the feature's state (moved from beta to GA, flipped a flag to 100%, fixed a high-impact known issue), edit `team-os/features/<slug>/status.md` accordingly. Add a brief "last change" note.

If the PR resolved something in the status file's "Known issues" list, remove it from that list.

### Step 5: Flag follow-ups

If the PR introduces a new user-visible capability, check whether:
- `customer-talking-points.md` needs a new line — prompt the user
- `faq.md` needs a new entry — prompt the user
- `team-os/analytics/metrics/` needs instrumentation — prompt the user

Don't silently update these — customer-facing copy needs a human.

## Rules

- **Never invent what the PR did.** Read the PR body. Ask the user if unclear.
- **Write for the reader, not the committer.** "What changed for the user" should be understandable by someone who never opens GitHub.
- **One PR, one entry.** Don't batch a weekly digest here — that's what `/weekly-digest` is for.
- **If the feature dossier doesn't exist, ask before creating.** A new dossier needs a status, talking points, and an owner — those take a minute of judgment.
