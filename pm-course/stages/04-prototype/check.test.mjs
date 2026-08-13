/**
 * Stage 4's checker, tested against a fixture repo with a real diff.
 *
 * The reference contract describes four changed files, so the fixture changes
 * exactly those four. The coverage check is the one that matters, so it gets both
 * directions: all four accounted for passes, and removing one mention fails with
 * the file named.
 */

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { check } from "./check.mjs";
import { makeFixture, removeFixture } from "../../lib/fixture-repo.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

/** Exactly the files the reference contract accounts for. */
const CHANGED = [
  "app/(main)/_components/publish.tsx",
  "lib/share-copy.ts",
  "lib/share-copy.test.ts",
  "lib/analytics.ts",
];

const REPO = makeFixture({ changed: CHANGED });
after(() => removeFixture(REPO));

const reference = () =>
  fs.readFileSync(path.join(here, "expected", "prototype-contract.md"), "utf8");
const byName = (r, n) => r.checked.find((c) => c.name.startsWith(n));
const failures = (r) =>
  r.checked.filter((c) => c.ok === false).map((c) => c.name);

test("the reference contract passes against the diff it describes", () => {
  assert.deepEqual(failures(check({ text: reference(), repo: REPO })), []);
});

test("a changed file mentioned nowhere fails, and is named", () => {
  // The realistic case: the agent touched something the contract never knew
  // about, in a directory the contract never mentions. This is what a boundary
  // written from an agent's own summary looks like.
  const extra = makeFixture({ changed: [...CHANGED, "hooks/use-share.ts"] });
  try {
    const res = check({ text: reference(), repo: extra });
    assert.equal(byName(res, "Covers the diff").ok, false);
    assert.match(byName(res, "Covers the diff").detail, /hooks\/use-share\.ts/);
  } finally {
    removeFixture(extra);
  }
});

test("a directory citation covers the files under it — a known, chosen limit", () => {
  // The reference mentions `lib/` in passing, which covers lib/analytics.ts
  // even with its own line removed. Asserted so the loophole cannot close by
  // accident and surprise someone whose honest contract starts failing.
  const text = reference().replaceAll(
    "`lib/analytics.ts`",
    "the analytics module",
  );
  const res = check({ text, repo: REPO });
  assert.equal(byName(res, "Covers the diff").ok, true);
});

test("no diff at all fails — build it before describing it", () => {
  const clean = makeFixture({ changed: [] });
  try {
    const res = check({ text: reference(), repo: clean });
    assert.equal(byName(res, "Covers the diff").ok, false);
    assert.match(byName(res, "Covers the diff").detail, /nothing has changed/);
  } finally {
    removeFixture(clean);
  }
});

test("claiming nothing is persisted while convex/ changed is caught", () => {
  const withConvex = makeFixture({
    changed: [...CHANGED, "convex/documents.ts"],
  });
  try {
    const text = reference().replace(
      "## What is not connected",
      "## What is not connected\n\nNothing is persisted by this prototype. `convex/documents.ts`\n",
    );
    const res = check({ text, repo: withConvex });
    const c = byName(res, "Re-derived · nothing-persisted");
    assert.ok(c, "the persistence claim should have been re-derived");
    assert.equal(c.ok, false);
    assert.match(c.detail, /convex\/documents\.ts/);
  } finally {
    removeFixture(withConvex);
  }
});

test("touching app/ without naming DESIGN.md fails on §XVI", () => {
  const text = reference().replaceAll("DESIGN.md", "the design tokens");
  const res = check({ text, repo: REPO });
  const c = byName(res, "Re-derived · design-contract-applies");
  assert.ok(c);
  assert.equal(c.ok, false);
  assert.match(c.detail, /XVI/);
});

test("new logic under lib/ with no test is named", () => {
  const noTest = makeFixture({
    changed: CHANGED.filter((f) => !f.includes(".test.")),
  });
  try {
    const text = reference().replaceAll(
      "lib/share-copy.test.ts",
      "lib/share-copy.ts",
    );
    const res = check({ text, repo: noTest });
    const c = byName(res, "Re-derived · no-test-for-new-logic");
    assert.ok(c);
    assert.equal(c.ok, false);
  } finally {
    removeFixture(noTest);
  }
});

/**
 * Replace a whole section's body. Matching exact prose broke the moment prettier
 * re-wrapped the reference, and the test then passed an unmodified document —
 * asserting nothing while looking green.
 */
function withSection(heading, body) {
  const text = reference();
  const re = new RegExp(`(## ${heading}\\n\\n)[\\s\\S]*?(\\n## )`);
  if (!re.test(text))
    throw new Error(`section "${heading}" not found in the reference`);
  return text.replace(re, `$1${body}\n$2`);
}

test("a learning statement is not a learning question", () => {
  const res = check({
    text: withSection(
      "The learning question",
      "We want to learn whether the framing helps.",
    ),
    repo: REPO,
  });
  assert.equal(byName(res, "Learning question").ok, false);
});

test("a date is not a stop condition", () => {
  const res = check({
    text: withSection("The stop condition", "End of the sprint, 2026-08-20."),
    repo: REPO,
  });
  assert.equal(byName(res, "Stop condition").ok, false);
});

test("the untouched template fails on the sections that matter", () => {
  const brief = fs.readFileSync(path.join(here, "brief.md"), "utf8");
  const template = /```markdown\n([\s\S]*?)```/.exec(brief)?.[1];
  assert.ok(
    template,
    "brief.md no longer contains a ```markdown template block",
  );

  const failed = failures(check({ text: template, repo: REPO }));
  for (const name of [
    "Four boundaries",
    "Exclusions",
    "Interrogation",
    "Covers the diff",
  ]) {
    assert.ok(
      failed.includes(name),
      `${name} should fail on the blank template: ${failed.join(", ")}`,
    );
  }
});
