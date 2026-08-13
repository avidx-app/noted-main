---
description: Create or update the feature specification from a Linear ticket and/or natural language feature description. Supports explore mode (--explore) for spec drafting without a Linear ticket.
summary: Speckit specify phase
handoffs:
    - label: Build Technical Plan
      agent: speckit.plan
      prompt: Create a plan for the spec. I am building with...
    - label: Clarify Spec Requirements
      agent: speckit.clarify
      prompt: Clarify specification requirements
      send: true
---

<!--
Adapted from heatseeker-next/.ai/commands/speckit.specify.md
Noted-specific adjustments:
- HST- → NOT- (Linear team prefix)
- Linear URL: linear.app/heatseeker → linear.app/avidx-app
- Removed Linear-document-sync as a hard requirement (warn-only on failure)
- Skips Step 4.5 (existing Linear spec doc) until the team adopts that workflow
-->

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

The text the user typed after `/speckit.specify` is the feature description, optionally including a Linear ticket ID or the `--explore` flag. Assume it's available even if `$ARGUMENTS` appears literally below. Do not ask the user to repeat it unless they sent an empty command.

### Step 0: Determine Mode (Explore vs. Ticket-Linked)

1. Check if `$ARGUMENTS` contains the `--explore` flag.
2. Check if `$ARGUMENTS` contains a Linear ticket ID (pattern `NOT-[0-9]+`, case-insensitive, also in Linear URLs).
3. Determine mode:
    - **`--explore` present**: → Explore mode. Remove the flag from the description text. Skip Steps 0.5, 1, 2, and 6.5.
    - **Ticket ID found (no `--explore`)**: → Ticket-linked mode. Proceed with all steps.
    - **Neither**: ask the user:

        ```
        No Linear ticket ID found in your input.
        Would you like to proceed in explore mode (no Linear ticket required)?
        (yes → explore mode / or provide a ticket ID like NOT-1234)
        ```

        Wait for the user before proceeding.

For explore mode, set `IS_EXPLORE = true` and skip to Step 3.

### Step 0.5: Linear MCP connectivity check (ticket-linked only)

> Skip if `IS_EXPLORE = true`.

Try a Linear MCP call. If unavailable, **warn but do not block** — fall back to using the description text from `$ARGUMENTS` as the feature context. Display:

```
WARNING: Linear MCP server is not connected.
Continuing with the description from your input. To enable Linear sync,
configure the MCP server and re-run /speckit.sync later.
```

### Step 1: Parse input and extract ticket ID (ticket-linked only)

> Skip if `IS_EXPLORE = true`.

1. Parse `$ARGUMENTS` for a Linear ticket ID:
    - Look for pattern `NOT-[0-9]+` (case-insensitive)
    - Also accept Linear URLs like `https://linear.app/avidx-app/issue/NOT-XXXX/...` — extract the ticket ID
    - Normalize to uppercase (`not-1234` → `NOT-1234`)
    - If none found: ERROR "Linear ticket ID required. Format: NOT-XXXX (e.g., NOT-1234)"
2. Separate the ticket ID from the rest of the description text.

### Step 2: Fetch Linear ticket details (ticket-linked only)

> Skip if `IS_EXPLORE = true`.

1. **Try**: Linear MCP `get_issue` with the ticket ID.
2. **If succeeds**: extract title, description, labels, type/category. Use as primary context. Merge any extra text from `$ARGUMENTS` as supplementary context.
3. **If fails**: warn and fall back to the description from `$ARGUMENTS`. If no extra description was provided either: ERROR "No feature description available."

### Step 3: Determine branch type

- **Ticket-linked mode**:
    1. Auto-detect from labels (if fetched in Step 2):
        - `hot` label → suggest `hotfix/`
        - `bug` label or type → suggest `bugfix/`
        - Otherwise → suggest `feature/`
    2. Confirm with the user (yes / or specify: feature, hotfix, bugfix).
    3. If no labels available: default to `feature/` and confirm.

- **Explore mode**: branch type is always `explore`. No confirmation needed.

### Step 4: Generate short name and create branch

1. Generate a concise short name (2–4 words) using action-noun format. Examples:
    - "Add presence indicators to documents" → `document-presence`
    - "Inline comments on documents" → `inline-comments`
    - "Fix recursive archive on shared docs" → `fix-archive-recursion`

2. Check for existing branches/specs (ticket-linked):
    - `git fetch --all --prune`
    - `git branch | grep "NOT-XXXX"`
    - `ls specs/ | grep "NOT-XXXX"`
    - If found: ask whether to reuse or create new.

3. Create branch + spec directory:

    **Ticket-linked**:
    ```bash
    .specify/scripts/bash/create-new-feature.sh --json --ticket-id "NOT-XXXX" --branch-type "<type>" --short-name "<short-name>" "<feature description>"
    ```

    **Explore**:
    ```bash
    .specify/scripts/bash/create-new-feature.sh --json --explore --short-name "<short-name>" "<feature description>"
    ```

    Run only once per feature. Parse the JSON for `IS_EXPLORE`, `EXPLORE_ID`, `TICKET_ID`, `BRANCH_TYPE`, `BRANCH_NAME`, `SPEC_DIR_NAME`, `SPEC_FILE`.

### Step 5: Write the specification

1. Load `.specify/templates/spec-template.md`.

2. Execution flow:
    1. Parse feature context (from Linear + user description, or user description in explore mode). If empty: ERROR.
    2. Extract key concepts (actors, actions, data, constraints).
    3. For unclear aspects:
        - Make informed guesses based on context and noted's product norms.
        - Only mark `[NEEDS CLARIFICATION: question]` when the choice materially impacts scope or UX, or no reasonable default exists.
        - **Maximum 3 markers.** Prioritize: scope > security/privacy > UX > technical details.
    4. Fill User Scenarios & Testing. If no clear flow: ERROR.
    5. Generate Functional Requirements — each must be testable.
    6. Define Success Criteria — measurable, technology-agnostic, user/business framed.
    7. Identify Key Entities (if data involved).

3. Write to SPEC_FILE.

### Step 6: Specification quality validation

a. **Create spec quality checklist** at `FEATURE_DIR/checklists/requirements.md`:

    ```markdown
    # Specification Quality Checklist: [FEATURE NAME]

    **Purpose**: Validate specification completeness and quality before proceeding to planning
    **Created**: [DATE]
    **Feature**: [Link to spec.md]
    **Linear Ticket**: [NOT-XXXX](link) or "Explore mode — no ticket linked"

    ## Content Quality

    - [ ] No implementation details (frameworks, APIs, schema details)
    - [ ] Focused on user value and business needs
    - [ ] Written for non-technical stakeholders
    - [ ] All mandatory sections completed

    ## Requirement Completeness

    - [ ] No [NEEDS CLARIFICATION] markers remain
    - [ ] Requirements are testable and unambiguous
    - [ ] Success criteria are measurable
    - [ ] Success criteria are technology-agnostic
    - [ ] Acceptance scenarios are defined
    - [ ] Edge cases are identified
    - [ ] Scope is clearly bounded
    - [ ] Dependencies and assumptions identified

    ## Feature Readiness

    - [ ] All functional requirements have clear acceptance criteria
    - [ ] User scenarios cover primary flows
    - [ ] Feature meets measurable outcomes defined in Success Criteria
    - [ ] No implementation details leak into specification
    ```

b. Run validation against each item.

c. Handle results:
    - All pass → mark complete, proceed to Step 7.
    - Failures (excluding `[NEEDS CLARIFICATION]`) → list, update spec, re-validate (max 3 iterations). After 3, document remaining issues and warn.
    - `[NEEDS CLARIFICATION]` markers (max 3) → present each as a question with 3 suggested answers in a markdown table. Wait for user response. Update spec. Re-validate.

### Step 6.5: Sync spec to Linear (ticket-linked only)

> Skip if `IS_EXPLORE = true`. **Best-effort, do not block on failure.**

1. Read final spec content.
2. Search for existing `[NOT-XXXX] spec` document via `list_documents(query: "NOT-XXXX")`.
3. If exists: `update_document(id, content)`. If not: `create_document(title: "[NOT-XXXX] spec", content, issue: "NOT-XXXX")`.
4. Report: `✓ Synced spec to Linear as [NOT-XXXX] spec`
5. On MCP failure: `⚠️ Could not sync spec to Linear. Run /speckit.sync later to retry.`

### Step 7: Report completion

Report:
- Linear ticket ID and link (or Explore ID for explore mode)
- Branch name and type
- Spec file path
- Checklist results
- Readiness for next phase (`/speckit.clarify` or `/speckit.plan`)

For explore mode, also display:

```
💡 This is an explore spec. To link it to a Linear ticket:
   /speckit.link EXP-N NOT-XXXX   ← link to an existing ticket
   /speckit.link EXP-N             ← create a new ticket and link
```

(`speckit.link` is in Wave 3 of the course adaptation; the message stands as a placeholder for now.)

## Quick Guidelines

- Focus on **WHAT** users need and **WHY**. Avoid implementation details (no Convex schema, no React components, no Clerk specifics in the spec).
- Written for business stakeholders (PMs, designers, leadership), not just engineers.
- Mandatory sections: complete every one.
- Optional sections: include only when relevant; remove (don't leave "N/A").
- DO NOT embed checklists inside the spec — that's `/speckit.checklist`'s job.

## For AI generation

- Make informed guesses; don't ask about defaults.
- Document assumptions in an Assumptions section.
- Maximum 3 `[NEEDS CLARIFICATION]` markers. Prioritize scope > security/privacy > UX > technical details.
- Think like a tester: every vague requirement should fail "testable and unambiguous."
- For noted specifically: scope ambiguities tend to be (a) does this need to support multi-user real-time, (b) does this affect published documents, (c) does this run inside the editor or outside.

## Success criteria guidelines

Must be:
1. **Measurable** (specific metrics: time, %, count, rate)
2. **Technology-agnostic** (no Convex, React, Clerk references)
3. **User-focused** (user/business outcomes, not internal mechanics)
4. **Verifiable** without implementation details

**Good**: "Users see a collaborator's presence within 2 seconds of them joining."
**Bad**: "Convex `presence` query returns within 200ms." (technology-specific)
