# Implementation Plan: In-editor AI activation is measurable

**Explore ID**: `EXP-1` · **Status**: Implemented · **Created**: 2026-08-13

## Summary

Wrap the AI slash-menu items returned by `@blocknote/xl-ai` so choosing one emits
`In-Editor AI Triggered`, then call the original handler. One new analytics helper, one pure module
holding the wrapping logic, one call site.

## Technical Context

The AI items are produced by `getAISlashMenuItems(editor)` — third-party objects with their own
`onItemClick`. We do not control them and should not fork them. Wrapping is the smallest change that
makes the surface measurable.

`lib/analytics.ts` already declares `mode?: string` in `AmplitudeEventProperties`, documented as
"In-editor AI mode (`ask` | `edit` | `continue`)". The property was anticipated when the analytics
module was written; the event was never added. This slice finishes that thought rather than
introducing a new concept.

## Constitution Check

_GATE: must pass before Phase 0 research. Re-checked after design._

| Principle                           | Status | Note                                                                                                            |
| ----------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| §IV No `any`                        | ✅     | `TrackableSuggestionItem` is a structural interface; generic `<T extends ...>` preserves the caller's item type |
| §VII Testing                        | ✅     | Logic lives in a pure module with 11 unit tests; no BlockNote mount required                                    |
| §VIII Linear linkage                | ⚠️     | **Deviation.** No ticket. Explore path used. Recorded in Complexity Tracking                                    |
| §X React anti-patterns              | ✅     | No new effects. Wrapping happens inside the existing `useCallback`                                              |
| §XIII AI surface conventions        | ✅     | No prompt, selection, or generated text in properties                                                           |
| §XV Analytics: decisions not clicks | ✅     | Invoking an AI action is an activation decision, not a UI click. `mode` is coarse by design                     |

## Complexity Tracking

| Deviation                  | Why                                                                                         | Simpler alternative rejected because                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No Linear ticket (§VIII)   | Work originated from a metrics gap found while making the repo teachable, not from a ticket | Creating a ticket retroactively to satisfy the check would make the linkage decorative. The explore path exists for exactly this, and `/noted-review` should report ticket alignment as skipped |
| Wrapping third-party items | We do not own `getAISlashMenuItems`                                                         | Forking the AI item list would put us permanently behind BlockNote's releases for the sake of one event                                                                                         |

## Project Structure

### Documentation (this feature)

```
specs/EXP-1-in-editor-ai-triggered/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/requirements.md
```

### Source Code

```
lib/analytics.ts                     + trackInEditorAiTriggered
lib/in-editor-ai-tracking.ts         new — aiModeFromTitle, withAiTracking
lib/in-editor-ai-tracking.test.ts    new — 11 tests
components/editor.tsx                wrap aiItems, thread documentId into SlashMenuWithAI
```

## Phases

### Phase 0 — Outline & research

- Confirmed `mode` already exists in `AmplitudeEventProperties` with the intended union documented.
- Confirmed AI items are third-party and carry `title` + `onItemClick`.
- Confirmed `trackPageEvent` no-ops when Amplitude is disabled, so no call-site guard is needed.

### Phase 1 — Design & contracts

Event contract:

```ts
"In-Editor AI Triggered": {
  mode: "ask" | "edit" | "continue";   // required
  document_id?: string;                 // when the editor is bound to a document
  page_name?: string;                   // added by trackPageEvent
}
```

`mode` is derived from the item title by stem matching. This is a lossy mapping and deliberately so:
the question it answers is "did the user ask something or change something", and BlockNote's exact
item list is not a stable contract.

### Phase 2 — Tasks

See `tasks.md`.

## Implementation deltas

Where the built version differs from the plan as first drafted:

- **Mode detection tests edit before continue.** The first version tested `continue` first with a
  `write` alternative, which classified "Rewrite selection" as `continue` because `write` is a
  substring of `rewrite`. Caught by the unit test, not by review.
- **Stems, not whole words.** `shorten` did not match BlockNote's "Make shorter". The patterns are
  now stems (`short`, `long`, `simplif`).
- **`documentId` threaded through `SlashMenuWithAI`.** Not in the first draft — the component did not
  previously receive it, and the `useCallback` dependency array had to gain it too.
