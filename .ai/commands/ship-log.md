---
description: Log a merged PR to the right feature's ship-log.md so non-engineers see what's live
summary: Append ship-log entry
argument-hint: "[PR number or URL]"
---

# /ship-log

Close the loop on engineering work: record a merged PR in the feature dossier so CS + leadership can see what shipped without asking an engineer.

## Instructions

1. Invoke the `ship-log` skill.
2. If the user passed a PR number or URL, fetch it via `gh pr view --json number,title,mergedAt,url,author,body,baseRefName`. Otherwise ask.
3. Resolve which feature in `team-os/feature-index.yaml` this belongs to — ask if ambiguous.
4. Append to `team-os/features/<slug>/ship-log.md`.
5. Offer to update `status.md`, `customer-talking-points.md`, and `faq.md` if the change was user-visible.
