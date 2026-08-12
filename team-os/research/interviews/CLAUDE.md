# Interviews

Eleven transcripts: six PM-led discovery interviews recorded by Sarah, five customer-facing calls
recorded by Priya. April 2026.

## Provenance — read this first

**These conversations are constructed.** They come from the Vibe PM @ Noted simulation and were
written so the discovery workflow has evidence to practise on. No customer said any of it.

That does not make them useless — they are internally consistent, they describe the product as it
actually exists today, and the friction they name is real friction in the current build. It makes
them usable for **one thing only**: exercising the workflow. Never quote a line from this folder in
anything a customer, an investor, or a public artifact will read, and never cite one as proof that
demand exists.

Every file states this on its face and carries `provenance: constructed` in its frontmatter. If a
real interview ever lands here, it must carry `provenance: real` and the transcripts must be
separated — a folder where you cannot tell the two apart is worse than no folder, because the whole
value of a quote is that someone said it.

The repo rule this implements is in [`.ai/INSTRUCTIONS.md`](../../../.ai/INSTRUCTIONS.md): never
fabricate data, quotes, or metrics. Constructed evidence is allowed when it is labelled; unlabelled
is fabrication regardless of intent.

## Sarah — discovery interviews

Deeper research conversations about how people work with the live surfaces: AI Settings, `/Ask AI`,
Coworker Chat, Squad Agents, publish-to-web.

| Date       | Person | Segment          |
| ---------- | ------ | ---------------- |
| 2026-04-14 | Devon  | solo creator     |
| 2026-04-18 | Anya   | team lead        |
| 2026-04-22 | Kai    | power user       |
| 2026-04-24 | Rina   | agency ops lead  |
| 2026-04-25 | Jordan | student          |
| 2026-04-26 | Marcus | founder operator |

## Priya — customer calls

Adoption, objections, expansion pressure, and the language support hears.

| Date       | Person | Theme                                     |
| ---------- | ------ | ----------------------------------------- |
| 2026-04-08 | Mia    | publish friction / draft review gap       |
| 2026-04-13 | Renee  | chat-to-publish gap                       |
| 2026-04-16 | Carlos | permissions / team adoption blocker       |
| 2026-04-21 | Nora   | model attribution / power-user ergonomics |
| 2026-04-24 | Ethan  | Squad-agent onboarding cliff              |

## How these line up with the behavioural data

Four of the call themes match insight ids planted in the seeded cohort (`scripts/fixtures/`, printed
by `npm run seed:convex`): `chat_to_publish_gap`, `squad_agent_onboarding_cliff`,
`draft_review_pressure`, `power_user_publish_rate`.

That correspondence is the point. Qualitative evidence explains _why_; the seeded behavioural data
shows _how often_. Neither settles a question alone, and agreement between them is not
confirmation — they were built together, so of course they agree. Real triangulation needs sources
that could have disagreed.

## Using these well

- **Quote, do not paraphrase.** The exact words are the evidence; a paraphrase is already an
  interpretation.
- **Separate what someone said from what they did.** These are all stated preference. Nobody was
  observed. Behaviour outranks opinion, and there is no behaviour in this folder.
- **Two interviews are not a pattern.** Eleven conversations across seven segments will support
  almost any story if you go looking for one.
- **Preserve contradictions.** Where two people want opposite things, that is the finding.

## Known gap

The earlier export included a seventh Sarah interview, **Lena — daily note-taker**, which the
"start here" list still names. It is not in this folder.

`[NEED: Lena — daily note-taker transcript]`
