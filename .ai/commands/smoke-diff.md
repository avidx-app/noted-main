---
description: Smoke-test the diff on the current branch by proving the change actually WORKS, not just that the repo still compiles. Reads the branch diff, surfaces changed exports as probe targets, has you write one targeted behavioural probe, then runs that probe FIRST plus the baseline gates (format, lint, types, related tests, design) and reports pass/fail.
summary: Prove the diff works, probe first
allowed-tools: Read, Write, Edit, Bash(npm run smoke:*), Bash(node scripts/smoke-diff.mjs:*), Bash(git diff:*), Bash(git status:*), Bash(npx jest:*)
---

## User Input

```text
$ARGUMENTS
```

# /smoke-diff

Prove the change on your branch **actually works**.

The quality gates in §IX — format, lint, types, the existing tests — tell you the repo still compiles.
They say nothing about whether the thing you just built behaves correctly. A function with inverted
logic passes all four cleanly. So this command puts a **targeted behavioural probe first** and runs the
baselines underneath as a regression net.

Everything is driven by `scripts/smoke-diff.mjs`, which is committed. A workflow that only works on its
author's laptop is not a repo convention.

## The workflow — follow it in order

### 1. See what changed, and what to probe

```bash
npm run smoke -- plan
```

Prints the changed files and, critically, the **probe targets**: the exported symbols in changed source
under `lib/`, `convex/`, `hooks/`, `components/` and `app/`. It also prints where each probe would live.

Diffs against `staging` by default, because that is what `/create-pr` targets. Use `--base <ref>` for
anything else — `--base workshop-v1` if you are working from a workshop tag.

### 2. Write ONE targeted probe

Read the diff, work out what the change is supposed to do, then write a probe that **calls the changed
code with representative inputs and asserts the intended behaviour** — including the edge case the change
was for.

```
<dir>/__smoke__/<name>.smoke-diff.test.ts
```

The `.smoke-diff.test.` suffix is reserved: the driver detects it as the probe and `clean` removes it
later. Jest provides `describe`/`it`/`expect` as globals here, and `@/` resolves — so a probe can import
the real module without ceremony.

```ts
import { shareCopy } from "@/lib/share-copy";

describe("shareCopy (targeted smoke)", () => {
  it("has nothing to undo before anything is shared", () => {
    expect(shareCopy(false).undo).toBeNull();
  });
});
```

A probe is not a placeholder. Assert the behaviour the change was _for_. For a Convex handler, exercise
the pure logic it delegates to; for a component, render it and assert what a user would see. If the
change only makes sense against a running app, start dev per `feature-workflow` and probe the route.

Iterate on just the probe while writing it:

```bash
npm run smoke -- probe lib/__smoke__/share-copy.smoke-diff.test.ts
```

### 3. Run the full smoke, and report

```bash
npm run smoke -- run
```

In order: the **targeted probe**, then format on changed files, lint on changed files, `tsc --noEmit`,
Jest `--findRelatedTests` on the changed files, and `design:lint` if the diff touches `components/` or
`app/` (§XVI). Report the summary to the author, verbatim.

**If no probe exists, `run` says so and does not pretend.** Passing baselines with no probe is reported
as exactly that: the gates are green and nothing has been shown to work.

### 4. Clean up — only after the author has read the report

```bash
npm run smoke -- clean
```

Removes untracked `*.smoke-diff.test.*` files and any `__smoke__/` directories left empty. It only ever
deletes untracked files carrying the reserved suffix, so a real test is never at risk.

## Where this sits

Run it **before** `/noted-review`. The review reads your diff against the skills and the constitution;
this tells you whether the diff does what you think. A review of code that does not work is a review of
the wrong question.

Then `/create-pr`, and record the probe in the PR description — a probe you wrote and deleted is still
evidence, and it belongs in the "what I verified" half of the description alongside what you did not.

## Gotchas

- **Baselines passing is not the change working.** That is the entire premise. Do not skip step 2 and
  report a green `run` as success — the output will call you out and the author should too.
- **One probe, not a suite.** You are proving a change, not building coverage. Coverage is the
  `unit-testing` skill's job and belongs in real test files.
- **The probe is untracked on purpose.** If the behaviour deserves a permanent test, write one in
  `<name>.test.ts` and say so — then the probe was a draft of something worth keeping.
- **A docs-only diff has nothing to probe.** `plan` says so and `run` falls back to format alone. That
  is correct, not a failure.
