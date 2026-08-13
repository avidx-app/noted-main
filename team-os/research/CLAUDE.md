# Research

Market, competitor, and customer research — both what the world outside Noted is doing, and what
people say about using it.

## Doc index

| Path                                   | What it is                                                                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [personas.md](personas.md)             | Five relationships people have with the product, synthesised from the interviews                                                        |
| [pain-landscape.md](pain-landscape.md) | What hurts, ranked by independent mentions and what it gates                                                                            |
| [interviews/](interviews/)             | Customer conversation transcripts. **All currently constructed** — read [interviews/CLAUDE.md](interviews/CLAUDE.md) before quoting one |
| [conversations/](conversations/)       | Where decisions were actually made — Slack threads, Linear issues, pre-decision Notion pages. **All constructed**, and two claims in them are wrong about how Noted works. Read [conversations/CLAUDE.md](conversations/CLAUDE.md) first |
| [market-pulse/](market-pulse/)         | Weekly/monthly pulses on the note-taking + AI-native editor space                                                                       |
| [competitors/](competitors/)           | One folder per competitor: product teardown, pricing, positioning                                                                       |
| `deep-dives/`                          | Multi-day research threads on a specific question (e.g., "what's the TAM of AI-native notes in 2026?")                                  |
| `signals/`                             | Raw signals worth tracking (funding announcements, launches, pricing changes) before they become pulses                                 |

## Market pulse cadence

Run `/market-scan` (weekly or biweekly) to generate a new pulse in `market-pulse/YYYY-MM-DD-pulse.md`. The skill asks what to cover, pulls signals from `signals/`, and drafts a structured report.

## Competitor folders

Each competitor has:

```
competitors/<slug>/
├── CLAUDE.md           what to care about for this competitor
├── tldr.md             30-second read: what they are, target user, key differentiator
├── pricing.md          current pricing and how it's evolved
├── teardown.md         our take: what's smart, what's weak, implications for us
└── signals.md          recent moves worth tracking
```

Start simple — `tldr.md` is enough on day one. Expand when a competitor gets relevant.

## Current priority competitors

_(Populate as we decide who to track. Notion, Obsidian, Craft, Mem, and any AI-native editors are obvious candidates.)_
