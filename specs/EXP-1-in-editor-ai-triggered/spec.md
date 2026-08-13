# Feature Specification: In-editor AI activation is measurable

**Linear Ticket**: none — `--explore` path (see Notes)
**Explore ID**: `EXP-1`
**Feature Branch**: `feat/workshop-v1-discovery-layer`
**Created**: 2026-08-13
**Status**: Implemented
**Input**: "The metrics file for AI-first onboarding lists first-session AI activation as a secondary metric and marks it [NEEDS INSTRUMENTATION]. Make it measurable."

## Notes on the explore path

There is no Linear ticket. Constitution §VIII requires ticket linkage for feature work, and
`/speckit.specify --explore` is the documented path for work that starts before a ticket exists —
it produces an `EXP-N` id and an `explore/` branch.

This bundle deviates from that in one respect and it should be visible rather than buried: the work
landed on an existing branch (`feat/workshop-v1-discovery-layer`) rather than its own `explore/EXP-1-*`
branch, because it is part of a larger repo-readiness change. A reviewer should treat the missing
ticket as a real gap, not a satisfied requirement. Ticket alignment in `/noted-review` will
correctly report as skipped.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Product can see who used AI in the editor (Priority: P1)

As the PM deciding whether intent-first onboarding works, I need to know whether a new user used AI
in their first session — including the `/Ask AI` surface, not only the Coworker panel.

**Why this priority**: it is the only story here. Without it, "first-session AI activation" cannot be
computed at all, and it is the leading indicator the onboarding experiment depends on because the
primary metric sits at a 92–96% seeded ceiling.

**Independent Test**: trigger an AI slash-menu item in the editor and confirm an
`In-Editor AI Triggered` event is emitted with a `mode` and, when in a document, a `document_id`.

**Acceptance Scenarios**:

1. **Given** a user with AI configured, **When** they choose "Ask AI" from the slash menu, **Then**
   `In-Editor AI Triggered` fires with `mode: "ask"` and the AI action still runs.
2. **Given** a user with AI configured, **When** they choose a rewrite item, **Then** the event fires
   with `mode: "edit"`.
3. **Given** a user with **no** AI configured, **When** they open the slash menu, **Then** no AI items
   appear and no event fires.
4. **Given** analytics is disabled (no API key), **When** any AI item is chosen, **Then** the action
   runs normally and nothing is sent.

### Edge Cases

- **BlockNote adds or renames an AI item.** The list belongs to `@blocknote/xl-ai` and changes between
  versions. An unrecognised title must still emit an event, classified `ask`, rather than emitting
  nothing.
- **The underlying handler throws.** Tracking happens before delegation, so a broken editor action
  still reports that the user tried.
- **No document in scope.** `document_id` is omitted rather than faked.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Choosing any AI slash-menu item MUST emit `In-Editor AI Triggered`.
- **FR-002**: The event MUST carry `mode`, one of `ask` | `edit` | `continue`.
- **FR-003**: The event MUST carry `document_id` when the editor is bound to a document.
- **FR-004**: The event MUST NOT carry the prompt, the selection, or any generated text
  (constitution §XIII — conversation contents are never logged or tracked).
- **FR-005**: Wrapping MUST NOT change what an AI item does, and MUST NOT mutate the item objects
  returned by `getAISlashMenuItems`.
- **FR-006**: When no AI configuration exists, no AI items and therefore no events.

### Key Entities

- **`In-Editor AI Triggered`** — Amplitude event. Properties: `mode` (required), `document_id`
  (optional), `page_name` (added by `trackPageEvent`).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: First-session AI activation can be computed from Amplitude alone, combining
  `In-Editor AI Triggered` and `Coworker Message Sent`.
- **SC-002**: The two AI surfaces can be compared rather than merged, so "AI is working" can be
  attributed to a surface.
- **SC-003**: `team-os/analytics/metrics/growth/ai-first-onboarding-metrics.md` drops one of its three
  `[NEEDS INSTRUMENTATION]` markers.

### Out of scope

- The four onboarding events (`Onboarding Intent *`). They describe a feature that does not exist.
- Backfill. This is forward-only; there is no history for this event.
- `In-Editor AI Suggestion Accepted` / `Rejected`. Acceptance requires hooking BlockNote's
  apply/reject lifecycle, which is a larger change and a separate slice.
