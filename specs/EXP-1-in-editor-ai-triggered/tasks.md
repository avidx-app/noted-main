# Tasks: In-editor AI activation is measurable

**Explore ID**: `EXP-1` · **Status**: complete

**Tests**: Unit tests required and written. The mapping logic is pure and is the part most likely to
break silently when BlockNote renames an item, so it is tested directly rather than through the
component.

## Phase 1: Setup

- [x] T001 Confirm `mode` exists in `AmplitudeEventProperties` and matches the intended union — `lib/analytics.ts`

## Phase 2: Foundational

- [x] T002 Add `trackInEditorAiTriggered` helper following the existing `track[Subject][PastVerb]` convention — `lib/analytics.ts`

## Phase 3: User Story 1 — Product can see who used AI in the editor (P1) 🎯 MVP

### Client layer

- [x] T003 Create `aiModeFromTitle` — map an item title to `ask` | `edit` | `continue` — `lib/in-editor-ai-tracking.ts`
- [x] T004 Create `withAiTracking` — wrap items without mutating them, track before delegating — `lib/in-editor-ai-tracking.ts`
- [x] T005 Thread `documentId` into `SlashMenuWithAI` and add it to the `getMenuItems` dependency array — `components/editor.tsx`
- [x] T006 Wrap `getAISlashMenuItems(editor)` at the call site — `components/editor.tsx`

### Tests & instrumentation

- [x] T007 Unit tests for `aiModeFromTitle`, including the unrecognised-title fallback — `lib/in-editor-ai-tracking.test.ts`
- [x] T008 Unit tests for `withAiTracking`: event shape, delegation, throwing handler, no mutation, missing handler, absent document — `lib/in-editor-ai-tracking.test.ts`

## Final phase: Polish & cross-cutting

- [x] T009 Drop one `[NEEDS INSTRUMENTATION]` marker — `team-os/analytics/metrics/growth/ai-first-onboarding-metrics.md`
- [x] T010 Full gate: `npm run ci:local`

## Dependencies

T002 blocks T004. T003 blocks T004. T005 blocks T006. T004 and T006 block T009.

## Not done

- `In-Editor AI Suggestion Accepted` / `Rejected`. Needs BlockNote's apply/reject lifecycle; separate slice.
- A real end-to-end check that the event reaches Amplitude. Requires a project and a key, so it is
  verified by unit test and by reading the SDK contract, not observed.
