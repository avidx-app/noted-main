# Contributing to the Team OS

Welcome. This is the part of the repo where **anyone on the team** — not just engineers — can read, write, and update knowledge. No git jargon required to get started. Read this once, then just do it.

## What goes in `team-os/`

- PRDs and product specs → [`product/prds/`](product/prds/)
- Feature dossiers (status, FAQ, talking points for CS) → [`features/<slug>/`](features/)
- Competitor teardowns and market pulses → [`research/`](research/)
- Metric definitions and experiment results → [`analytics/`](analytics/)
- Top support issues and FAQs → [`support/`](support/)
- Onboarding docs, retros, weekly updates → [`team/`](team/)

## What does **not** belong here

- Code (that's in `app/`, `components/`, `convex/`, `hooks/`, `lib/`).
- Secrets, API keys, personal identifying info about customers.
- Full raw call transcripts (if we ever record them). Store structured summaries instead.

## How to edit (no terminal required)

1. Find the file on [github.com/avidx-app/noted](https://github.com) (or whatever the repo URL is).
2. Click the pencil icon ("Edit this file").
3. Make your changes in the web editor.
4. At the bottom, under "Commit changes": pick **"Create a new branch for this commit and start a pull request."** Give the branch a short name like `update-ai-faq`.
5. Click **"Propose changes"** then **"Create pull request"**.
6. Add a one-sentence description of what you changed. Hit submit.
7. Any teammate can approve and merge `team-os/**` PRs.

## How to edit (in your editor)

1. Pull `main`: `git pull origin main`
2. Create a branch: `git checkout -b yourname/short-description`
3. Edit with your favorite editor. If you use Claude Code, just ask — skills like `/prd-new` will scaffold a file for you.
4. Commit and push: `git add team-os/… && git commit -m "…" && git push -u origin HEAD`
5. Open a PR on GitHub.

## Using Claude to help you write

Open Claude Code in this repo and ask naturally. Good examples:

- *"Write a PRD for the new AI templates feature. It's targeting power users. Primary metric is templates-created-per-week."*
- *"What's the current status of the AI Squad feature? I need to reply to a customer."*
- *"Help me synthesize these five research notes into a single market pulse."*
- *"A customer asked: 'Can Noted summarize a doc for me?' Draft a reply."*

Claude will use the skills in `.claude/skills/` to write in our team style. You don't need to memorize the folder layout — Claude navigates for you.

## Conventions worth following

- **File naming**: lowercase, kebab-case (e.g., `ai-squad-status.md`, not `AI Squad Status.md`).
- **Dates in filenames**: ISO format, `YYYY-MM-DD` (e.g., `2026-04-17-notion-pricing-change.md`).
- **Frontmatter** (optional but helpful): at the top of any note, add:
  ```yaml
  ---
  type: prd | market-pulse | competitor | feature-status | experiment | research
  feature: ai-features | team-collab | paywall | editor | null
  date: 2026-04-17
  author: your-github-handle
  ---
  ```
  Frontmatter makes cross-feature queries fast.
- **Prefer summaries over dumps.** A 500-token structured summary beats a 10,000-token transcript every time. Link raw sources at the bottom.
- **Never fabricate.** If you don't have a number, write `[NEED: data from X]`. Future-you will thank you.

## When something ships

If you're an engineer and you just merged a feature-bearing PR, append a line to the feature's `ship-log.md`. Or run `/ship-log` in Claude Code and answer the prompts — it will write the entry for you. This is what lets customer service and leadership answer *"is X live yet?"* without pinging you.

## Questions?

Ping anyone in [ROSTER.md](ROSTER.md). Or open an issue tagged `team-os` and propose a change.
