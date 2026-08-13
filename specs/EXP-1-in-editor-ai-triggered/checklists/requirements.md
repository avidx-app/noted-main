# Requirements checklist — EXP-1

"Unit tests for English." This validates the quality of the spec, not the implementation.

## Content Quality

- [x] No implementation detail in the user story itself
- [x] Written so a non-engineer can judge whether it is the right thing to build
- [x] Every mandatory section is filled
- [x] No `[NEEDS CLARIFICATION]` markers remain

## Requirement Completeness

- [x] Each functional requirement is testable
- [x] Success criteria are measurable and do not restate the requirements
- [x] Out-of-scope is explicit, and says why for each item
- [x] Edge cases name a real failure mode rather than "handle errors gracefully"
- [x] The event contract states which properties are required
- [x] Privacy boundary stated explicitly (FR-004)

## Feature Readiness

- [x] The deviation from constitution §VIII is recorded in Complexity Tracking rather than waved through
- [x] The metric this unblocks is named, and the file that tracks it is updated in the same change
- [x] Implementation deltas recorded — including the two bugs the tests caught
- [x] What was NOT verified is stated: no observed delivery to Amplitude
