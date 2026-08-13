# Team OS — Noted

Shared knowledge base for the Noted team. Everyone reads from here. Everyone contributes. Engineers log what they ship. Product writes PRDs. Leadership tracks the market. Customer service finds answers without tapping an engineer on the shoulder.

## The first place to look

**Looking for a specific feature?** → [`feature-index.yaml`](feature-index.yaml) maps every feature to its dossier, code paths, and owners.

**Asking "what's shipped / what's in flight / what's the customer talking point?"** → [`features/<slug>/`](features/) has a dossier per feature: status, FAQ, talking points, index.

## Doc index

| Path | What it is | Who it's for |
|---|---|---|
| [features/](features/) | Per-feature dossiers — status, customer talking points, FAQ, linked artifacts | Everyone (first stop for CS + leadership) |
| [feature-index.yaml](feature-index.yaml) | Master map: feature → dossier, code, owners, ship-log | Claude (and anyone scanning quickly) |
| [product/](product/) | PRDs, roadmap, vision, competitive positioning | PM + anyone writing/reviewing a feature |
| [engineering/](engineering/) | RFCs, architecture decisions, runbooks, bug investigations | Engineering |
| [design/](design/) | UX principles, flows, component decisions | Design + PM |
| [analytics/](analytics/) | Metric definitions, dashboards, experiments, investigations | PM + leadership + CS |
| [research/](research/) | Market pulses, competitor tracking, deep-dive research threads | PM + leadership |
| [support/](support/) | Top issues, FAQ, feedback log | Customer service + PM |
| [growth/](growth/) | Landing, onboarding, pricing experiments | PM + growth |
| [team/](team/) | Onboarding, rituals, retros, weekly updates, [Claude playbook](team/claude-playbook.md) | Everyone (especially new hires) |
| [templates/](templates/) | Starting points for new PRDs, dossiers, pulses, ship-log entries | Everyone |
| [ROSTER.md](ROSTER.md) | Who's on the team, GitHub/Slack handles | Everyone |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to add or update content (non-engineers welcome) | Everyone |

## Navigation tips for Claude

- If a query is about a specific feature, go straight to `features/<slug>/CLAUDE.md`. Don't open every folder.
- If a query is ambiguous ("what's happening with X?"), check `feature-index.yaml` first to find the right dossier.
- If a query is about a *decision* (why did we choose X?), look in `product/` (if product-driven), `engineering/` (if technical), or the feature dossier's `index.md`. If none of them say **why**, try [`research/conversations/`](research/conversations/) — several decisions are recorded only in the thread that made them.
- If a query is about *the market*, go to `research/`.
- Customer interviews live in [`research/interviews/`](research/interviews/); the internal record — Slack, Linear, pre-decision Notion pages — is in [`research/conversations/`](research/conversations/). **Everything in both folders is constructed**, and each folder's `CLAUDE.md` says so on its face. Never quote either as evidence that demand exists.
