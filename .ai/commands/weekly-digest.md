---
description: Roll up the week's shipped PRs, new PRDs, and market signals into a team update
summary: Team weekly digest
argument-hint: "[week ending YYYY-MM-DD, optional]"
---

# /weekly-digest

Draft a weekly update for the team + stakeholders by aggregating what actually happened.

## Instructions

1. Determine the week range. Default: the last 7 days. If the user passed a date, use the week ending on that date.
2. Gather in parallel where possible:
   - **Ship log entries** across all `team-os/features/*/ship-log.md` in the range
   - **New or updated PRDs** in `team-os/product/prds/**` modified in the range
   - **Market pulses or new signals** in `team-os/research/market-pulse/` and `team-os/research/signals/`
   - **New or updated feature status files** in `team-os/features/*/status.md`
   - **New retros** in `team-os/team/retros/`
   - Recent merges: `gh pr list --state merged --search "merged:>=YYYY-MM-DD"` if access is available
3. Draft the digest:
   - **Shipped this week** — 1-line per entry, grouped by feature, with PR links
   - **In flight** — 1-line per PRD or dossier that changed, with status
   - **Market signals** — top 3 with 1-line implications
   - **Needs a decision / a human** — anything flagged `[NEED: ...]` in files touched this week
4. Save to `team-os/team/weekly-updates/YYYY-MM-DD.md`.
5. Present to the user for edit. Keep under 500 words unless asked for more.
