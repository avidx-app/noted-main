---
description: Quiz the user with tough questions about their PR (scaled to PR size) to verify they truly understand the code changes — especially useful for LLM-generated code.
summary: Hard questions on a proposal
---

<!--
Adapted from heatseeker-next/.ai/commands/grill-me.md
Noted-specific adjustments:
- Diff base: `main...HEAD` → `staging...HEAD` (noted's branch flow)
- Question categories tweaked to call out Convex auth/ownership patterns
  and BlockNote extension subtleties as common probing areas
- Removed monorepo-specific guidance (no apps/packages spread)
-->

## User Input

```text
$ARGUMENTS
```

## Overview

Generates a set of pointed, short-answer questions about the inner workings of the current PR — **minimum 5, scaled up based on PR size**. The goal: verify the developer genuinely understands the code, not just that they can describe what it does at a surface level.

This is particularly valuable when code is LLM-generated. **If you can't explain it, you shouldn't ship it.**

> **Branch flow reminder**: noted-main flows `feature/* → staging → main`. The PR diff for grilling is computed against `staging`, not `main`.

## Outline

### 1. Gather the PR Diff

```bash
git diff staging...HEAD     # branch changes vs staging
git diff HEAD                # uncommitted changes
git status                   # any untracked files
```

If the diff is very large, use the Read tool to load full file contents for context.

If the diff is empty (no changes vs `staging`), **STOP**: "No changes found on this branch. There's nothing to grill you on."

### 2. Analyze the Changes

Study the diff deeply. Understand:

- **What** was added/modified/removed
- **Why** specific patterns, data structures, or control flow were chosen
- **How** the pieces connect — function call chains, data flow, state transitions
- **Where** edge cases, failure modes, or implicit assumptions exist
- **Which** existing systems are affected

For noted specifically, watch for these high-leakage areas:

- **Convex handlers**: did the auth → existence → ownership → validation order shift? Is `ctx.auth.getUserIdentity()` checked before any data access? Are filters using indexes (`.withIndex(...)`) or naive `.filter(...)` chains?
- **Convex schema additions**: are new tables indexed correctly? Are `userId` fields present + indexed for user-scoped tables?
- **React components with `useEffect`**: is anything syncing props/state into state? Is interaction logic in effects?
- **BlockNote extensions**: do new editor extensions handle the empty-document and partial-content cases?
- **EdgeStore integration**: are file uploads bounded by user storage quota?
- **AI tool definitions**: do new tools in `lib/agent/tools/` validate input via Zod and handle provider failures?

Focus on the non-obvious: internal mechanisms, subtle dependencies, error paths, boundary conditions, architectural choices.

### 3. Determine Question Count

Scale based on `git diff staging...HEAD --stat`:

| PR Size         | Lines Changed | Files Changed | Question Count  |
| --------------- | ------------- | ------------- | --------------- |
| **Small**       | < 100 lines   | 1–3 files     | 5 questions     |
| **Medium**      | 100–300 lines | 4–8 files     | 6–8 questions   |
| **Large**       | 300–800 lines | 8–15 files    | 8–12 questions  |
| **Extra Large** | 800+ lines    | 15+ files     | 12–15 questions |

Adjust upward when:
- New architectural patterns are introduced (new Convex tables/indexes, new hooks, new BlockNote extensions, new AI tools)
- Complex logic present (recursion, state machines, multi-step async flows, AI provider fan-out)
- Multiple distinct features bundled in one PR

Adjust downward when:
- Many lines are tests, types, or boilerplate
- Changes are repetitive (same pattern applied N times)

### 4. Generate Questions

Each question should:
- Require a **short but specific** answer (1–3 sentences)
- Target the **inner workings** — not what, but how/why
- Be **impossible to answer** by reading the PR title or commit message
- Cover **different aspects** of the changes (don't cluster around one file)

**Question categories** (mix broadly):

| Category         | Example angle for noted                                              |
| ---------------- | -------------------------------------------------------------------- |
| **Mechanism**    | "How does `archive`'s recursion work — what stops the loop?"         |
| **Decision**     | "Why is this a Convex `action` instead of a `mutation`?"             |
| **Failure mode** | "What happens if `ctx.auth.getUserIdentity()` returns null mid-flow?" |
| **Data flow**    | "Trace a published-document fetch from URL to render."               |
| **Side effect**  | "What existing query subscriptions does this mutation invalidate?"   |
| **Edge case**    | "What if a parent document is archived while a child is open?"       |
| **Dependency**   | "What does this code assume about Clerk identity shape?"             |
| **Concurrency**  | "What if two clients write to the same field at once via Convex?"    |
| **Performance**  | "Where could this query become a bottleneck at 10k documents?"       |
| **Rollback**     | "If this Convex schema change breaks staging, what's the fix path?"  |

**Rules for good questions**:
- Never ask "What does this PR do?" — too easy
- Never ask about syntax — ask about semantics and intent
- Reference specific functions, variables, or patterns from the diff
- For larger sets, vary difficulty — mix mechanism questions with harder failure-mode and edge-case questions
- No two questions should be answerable with the same explanation

### 5. Begin the Grilling — Turn-by-Turn

Questions are presented **one at a time**. The user answers each before seeing the next.

**5a. Show preamble (once)**:

> **You're about to merge this PR. Let's make sure you actually understand it.**
>
> This PR earned **N questions** based on its size. You'll get them one at a time. Answer each in 1–3 sentences. Be specific — vague answers don't count.
>
> Let's go.

**5b. Question loop** (repeat for each question):

1. **Present** with number and category:

    > **Question K/N** `[Category]`
    >
    > [question text]

2. **Wait for response.** Don't show next question, hints, or correct answer until user replies.

3. **Evaluate immediately**:
    - ✅ **Correct** — clear understanding
    - ⚠️ **Partial** — right direction, missing details or imprecise
    - ❌ **Incorrect** — wrong understanding or guess

4. **Show evaluation** with:
    - Verdict + label
    - Brief explanation of correct answer (or what was missing)
    - Code reference (file + line or function name)
    - Running score:

    > **Result:** ✅ Correct
    >
    > [Explanation or full answer]
    >
    > _Reference: `convex/documents.ts` — `archive` (line 42)_
    >
    > **Running score: 2/3** (1 ✅, 1 ⚠️, 1 ❌)

5. **Immediately present next question** after evaluation. Keep pace up.

6. **After final question's evaluation**, proceed to Step 6.

### 6. Final Verdict

**6a. Score**:
**Score = (correct + 0.5 × partial) / total × 100%**

**6b. Results table**:

> | #   | Category  | Verdict      |
> | --- | --------- | ------------ |
> | 1   | Mechanism | ✅ Correct   |
> | 2   | Data flow | ⚠️ Partial   |
> | 3   | Edge case | ❌ Incorrect |

**6c. Verdict tier**:

| Score  | Verdict                | Message                                                                                      |
| ------ | ---------------------- | -------------------------------------------------------------------------------------------- |
| ≥ 90%  | 🟢 **Ship it**         | "You clearly understand this code. Merge with confidence."                                   |
| 60–89% | 🟡 **Review the gaps** | "You mostly get it, but review the areas you missed before merging."                         |
| < 60%  | 🔴 **Do not merge**    | "You don't understand enough of this code to own it. Study the flagged areas and try again." |

Display score as fraction (7/10) and percentage (70%).

Closing note:

> If this code was LLM-generated, the bar is the same: **if you can't explain it, you can't debug it, and you shouldn't ship it.**

### 7. Retry on Failure (🔴 only)

If user scores **< 60%**:

1. **Explain what to study** — list specific files, functions, concepts they got wrong/partial. Concrete pointers.

2. **Tell them they must retake**:
    > You scored **X%** — below 60%. Study the areas above and retake the test.
    >
    > Reply **"ready"** when you want a new set of questions.

3. **Wait** for "ready" or affirmative.

4. **Generate new question set**:
    - Same count as original
    - **At least 50% must target failed/partial areas** from the previous attempt
    - Remaining questions cover other areas to ensure they didn't forget
    - **Never reuse** the exact same question — rephrase, different angle, deeper into the same area

5. **Run new set** through the same Step 5–6 flow.

6. **Repeat** until score ≥ 60%. Note attempt number in preamble:
    > **Attempt 2** — Let's see if you've closed the gaps. Same rules: one question at a time, 1–3 sentences each.

    No max retries. If user asks to stop, respect that but remind:
    > You're free to stop, but your score is **X%**. You haven't demonstrated sufficient understanding to safely own this code in production.

## Behavior Rules

- Never reveal correct answers before user responds.
- Be fair but firm — don't be lenient on vague answers.
- Reference specific code from the diff in questions and evaluations.
- If `$ARGUMENTS` is provided, treat as additional context about which area to focus on.
- Keep questions concise.
- Evaluate honestly — goal is to help, not trick.
