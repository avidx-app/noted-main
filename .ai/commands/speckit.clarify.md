---
description: Identify underspecified areas in the current feature spec by asking up to 5 highly targeted clarification questions and encoding answers back into the spec.
summary: Speckit clarify phase
handoffs:
    - label: Build Technical Plan
      agent: speckit.plan
      prompt: Create a plan for the spec. I am building with...
---

<!--
Adapted from heatseeker-next/.ai/commands/speckit.clarify.md — universal
spec-clarification workflow, no noted-specific changes needed.
-->

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

Goal: detect and reduce ambiguity or missing decision points in the active feature specification and record clarifications directly in the spec file.

This workflow is expected to run BEFORE `/speckit.plan`. If the user is exploratory and explicitly skipping clarification, proceed but warn that downstream rework risk increases.

### Steps

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` once. Parse `FEATURE_DIR`, `FEATURE_SPEC` (and optionally `IMPL_PLAN`, `TASKS`).

2. Load the spec. Run a structured ambiguity & coverage scan using this taxonomy. Mark each: Clear / Partial / Missing.

    **Functional Scope & Behavior**: core user goals, out-of-scope declarations, role/persona differentiation
    **Domain & Data Model**: entities, attributes, relationships, identity rules, lifecycle, scale assumptions
    **Interaction & UX Flow**: critical journeys, error/empty/loading states, accessibility/localization
    **Non-Functional**: performance, scalability, reliability, observability, security, privacy, compliance
    **Integration & Dependencies**: external services/APIs, import/export, protocols
    **Edge Cases & Failure Handling**: negative scenarios, rate limiting, conflict resolution
    **Constraints & Tradeoffs**: technical constraints, rejected alternatives
    **Terminology & Consistency**: glossary terms, deprecated synonyms
    **Completion Signals**: acceptance criteria testability, Definition of Done
    **Misc / Placeholders**: TODOs, ambiguous adjectives ("robust", "intuitive") lacking quantification

    For Partial/Missing categories, add a candidate question — unless it would not change implementation/validation strategy, or is better deferred to planning.

3. Generate (internally) a prioritized queue (max 5 questions). Constraints:
    - Maximum 5 total per session.
    - Each answerable with EITHER 2–5 mutually exclusive options OR a one-word/short-phrase answer (≤5 words).
    - Only ask if the answer materially impacts architecture, data modeling, task decomposition, test design, UX, ops, or compliance.
    - Cover highest-impact unresolved categories first.
    - Exclude already-answered, trivial stylistic, or pure plan-level questions.
    - Favor clarifications that reduce downstream rework.
    - If >5 categories unresolved, pick top 5 by Impact × Uncertainty.

4. **Sequential questioning loop** (interactive — one question at a time):

    **For multiple-choice**:
    - Analyze options. Determine the **most suitable** based on best practices, common patterns, risk, and explicit project goals visible in the spec.
    - Present recommendation prominently: `**Recommended:** Option [X] — <reasoning in 1–2 sentences>`
    - Render options as a table:

        | Option | Description |
        | ------ | ----------- |
        | A | <Option A> |
        | B | <Option B> |
        | C | <Option C> (up to 5) |
        | Short | Provide a different short answer (≤5 words) |

    - End with: `Reply with the option letter, "yes"/"recommended" to accept the recommendation, or your own short answer.`

    **For short-answer**:
    - Provide a suggested answer with brief reasoning: `**Suggested:** <answer> — <reasoning>`
    - Format hint: `Short answer (≤5 words). Reply "yes"/"suggested" to accept or provide your own.`

    After each answer:
    - If user says "yes"/"recommended"/"suggested", use the recommendation.
    - Otherwise validate the answer maps to an option or fits ≤5 words.
    - If ambiguous, ask for disambiguation (doesn't count as new question).
    - Record in working memory; advance to next question.

    Stop when:
    - All critical ambiguities resolved early.
    - User signals "done"/"good"/"no more".
    - You reach 5 asked questions.

    Never reveal future queued questions.

5. **Integration after each answer**:
    - On first integrated answer: ensure `## Clarifications` section exists; create `### Session YYYY-MM-DD` subheading.
    - Append: `- Q: <question> → A: <final answer>`.
    - Apply to the appropriate section(s):
        - Functional → Functional Requirements
        - User/role → User Stories or Actors
        - Data → Key Entities (preserve order, note added constraints concisely)
        - Non-functional → Success Criteria / Quality Attributes (convert vague terms to metrics)
        - Edge case → Edge Cases section (or create it)
        - Terminology → normalize across the spec; retain original only if necessary as `(formerly "X")`
    - If a clarification invalidates an earlier ambiguous statement, replace it; leave no contradictory text.
    - Save the spec after each integration (atomic overwrite).
    - Preserve formatting; don't reorder unrelated sections.

6. **Validation** (after each write + final pass):
    - Exactly one bullet per accepted answer (no duplicates).
    - Total asked ≤ 5.
    - Updated sections contain no lingering vague placeholders the new answer was meant to resolve.
    - No contradictory earlier statements remain.
    - Markdown structure valid; only allowed new headings: `## Clarifications`, `### Session YYYY-MM-DD`.
    - Terminology consistency.

7. Write back to `FEATURE_SPEC`.

8. **Report completion**:
    - Number of questions asked & answered.
    - Updated spec path.
    - Sections touched.
    - Coverage summary: each category as Resolved / Deferred / Clear / Outstanding.
    - If Outstanding/Deferred remain, recommend whether to proceed to `/speckit.plan` or run `/speckit.clarify` again post-plan.
    - Suggested next command.

## Behavior rules

- If no meaningful ambiguities found, respond: "No critical ambiguities detected worth formal clarification." Suggest proceeding.
- If spec file missing, instruct user to run `/speckit.specify` first.
- Never exceed 5 total asked questions (retries don't count).
- Avoid speculative tech-stack questions unless absence blocks functional clarity.
- Respect early termination ("stop", "done", "proceed").
- If quota reached with unresolved high-impact categories, flag explicitly under Deferred with rationale.

Context: $ARGUMENTS
