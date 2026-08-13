---
type: prd
feature: ai-features
stage: 6 # Impact Review
status: retrospective
owner: raziiabraham
last_updated: 2026-08-13
note: Written after the fact. Records what shipped against a Dec 2025 spec that largely did not.
---

# PRD: AI Features

**Author:** raziiabraham
**Date (first draft):** 2025-12-26 (as `specs/01-ai-features.md`, migrated into this retrospective on 2026-04-18; see git history before 2026-04-18 for the original)
**Date (retrospective rewrite):** 2026-04-18
**Status:** **Stage 6 — Impact Review** (all sub-features shipped to `main`)
**Feature index entry:** [`ai-features` in team-os/feature-index.yaml](../../../feature-index.yaml)
**Current-state dossier:** [`team-os/features/ai-features/`](../../../features/ai-features/)

> This PRD is a retrospective. The _current state_ of AI features lives in the dossier. Read [dossier/index.md](../../../features/ai-features/index.md) for how things actually work today. This file exists to capture intent, trade-offs, and what the original plan got wrong.

---

## 1. Hypothesis (original)

We believed that shipping AI deeply integrated into the Blocknote editor — with a BYOK model so users pay nothing to Noted for the AI layer — would drive higher page-creation rates and differentiate Noted from Notion AI's paid add-on.

## 2. Problem (original)

- **Who:** individuals and small teams already using Notion-style editors who pay $10/user/month for Notion AI and feel the economics don't match their usage.
- **How bad:** anecdotally large — Notion AI has been cited as "the feature I'd use if I didn't have to pay for it again on top of my plan".
- **Current workarounds:** paste text into ChatGPT / Claude / Gemini, copy back into Notion. Pure friction.
- **What happens if we don't solve it:** we'd be just another Notion clone, with no reason for anyone to switch.

## 3. Strategic fit (original)

- **Why this, why now:** the AI SDK ecosystem matured in 2025 (Vercel AI SDK, Blocknote `xl-ai` extension, multi-provider support). Building an AI editor is significantly cheaper than it was 18 months ago.
- **Why BYOK:** zero upstream cost exposure + privacy story + no markup vs. competitors.
- **Why multi-provider:** users know the landscape. Locking to one provider is a weaker story than "pick the model you like best today".
- **Alternatives considered:** a hosted AI key (we pay, users pay per use). Rejected for MVP because it added billing complexity before we had any paying users.

## 4. Solution (what actually shipped)

Rather than restate the full design, see [`team-os/features/ai-features/index.md`](../../../features/ai-features/index.md) for the current architecture, file paths, and line-level code references.

Summary of shipped sub-features:

1. **AI Settings** — encrypted key storage for OpenAI, Anthropic, Google. Model picker with 25+ models. Test-connection flow.
2. **In-Editor AI ("Ask AI")** — `/` slash menu command. Streaming inline generation with Accept / Reject / Retry.
3. **Coworker Chat** — floating bottom-right panel. Multi-agent, file upload, resizable sidebar.
4. **Squad Agents** — user-created agents backed by instruction documents. Workspace tools for read / write / edit / list / search.

## 5. Non-goals (how scope held up)

We held the line on most of these:

- ❌ No inline auto-complete (still true).
- ❌ No one-click "create page with AI" home-screen CTA (still true).
- ❌ No external tool integrations (MCP, Slack, Linear) (still true).
- ❌ No shared hosted AI key (still true; BYOK only).

## 6. What the original spec got wrong

See [`team-os/features/ai-features/index.md#gaps-vs-the-original-spec`](../../../features/ai-features/index.md) for the detailed table. High-level:

- **"Advanced slash commands" (`/ai write`, `/ai summarize`, etc.)** — didn't ship as separate items. One general "Ask AI" with free-form prompts replaced them and turned out to be enough.
- **Create Page with AI from the home screen** — didn't ship. Squad agents can create pages via tools instead.
- **Anthropic / Google support** — the spec marked these as planned; they shipped.
- **Agent "four-outputs" framework (feeds / collections / briefings / creative)** — didn't ship and likely never will. See [ai-agent-prd.md](ai-agent-prd.md) for the pivot note.

## 7. Success metrics

**Current state of measurement: we do not currently instrument AI usage.** Metric definitions exist in intent but no Convex event or dashboard backs them. This is a gap.

Proposed instrumentation (Stage 6 follow-up):

| Metric                                                                         | Type        | Source                                                   |
| ------------------------------------------------------------------------------ | ----------- | -------------------------------------------------------- |
| % of active users who have configured at least one provider key                | Primary     | `aiSettings` table, indexed `by_user`                    |
| 7-day AI Squad activation (≥3 messages in 7 days of first open)                | Primary     | `coworkerMessages`, filter role='user' & agentId != null |
| Convex function error rate for `/api/ai/chat` and `/api/ai/coworker`           | Guardrail   | Convex Dashboard                                         |
| Messages-per-active-user trending **up** while completion rate trends **down** | Anti-metric | Same table                                               |

These are now defined properly in
[`team-os/analytics/metrics/ai-features/ai-squad-metrics.md`](../../../analytics/metrics/ai-features/ai-squad-metrics.md),
which records what is measurable from `lib/analytics.ts` today and what is still blocked on
instrumentation. Use [`/metrics-define`](../../../../.ai/commands/metrics-define.md) when scoping
metrics for a new feature.

## 8. Open questions

- Should we add a **hosted AI option** so users don't have to bring a key? Opens metering + billing. Only worth building if BYOK first-run friction shows up in support tickets.
- Should we build **evals** for prompt/model regressions? Not worth it until we have more than one user depending on consistent output.
- Is the **"Summary heading auto-extracted as agent description"** convention intuitive, or does it trip users up? No data yet.

## 9. Lessons learned

- **Ship the primitive, then listen.** We shipped BYOK + one AI entry point, resisted the urge to build "15 slash commands" from the spec. Turned out users wanted one good general entry, not 15 special ones.
- **Vendor-switch was cheap.** `createAIModel()` isolates the provider choice in one place. Adding Anthropic and Google after OpenAI took little effort. That investment paid off.
- **The agent "four-outputs" framework was over-designed.** We wrote a lot of spec, then shipped something much simpler that serves the same use cases. See [ai-agent-prd.md](ai-agent-prd.md) for the deeper retrospective.

---

_Historical source: `specs/01-ai-features.md` (removed 2026-04-18; see git history for the original Dec 2025 version). Superseded by this PRD + the dossier._
