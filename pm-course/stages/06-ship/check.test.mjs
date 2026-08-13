/**
 * Stage 6's checker, tested against a fixture repo with a real diff.
 *
 * The section this act is assessed on is "What I did not verify", so it gets
 * three tests: filled passes, empty fails, and "nothing" fails. That third one
 * matters most — it is the plausible-looking answer.
 */

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { check } from "./check.mjs";
import { makeFixture, removeFixture } from "../../lib/fixture-repo.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

/** The Stage 4 diff, plus the team-os reflex the reference record describes. */
const CHANGED = [
  "app/(main)/_components/publish.tsx",
  "lib/share-copy.ts",
  "lib/share-copy.test.ts",
  "lib/analytics.ts",
  "team-os/features/publish-to-web/ship-log.md",
  "team-os/feature-index.yaml",
];

const REPO = makeFixture({ changed: CHANGED });
after(() => removeFixture(REPO));

const reference = () =>
  fs.readFileSync(path.join(here, "expected", "delivery-record.md"), "utf8");
const byName = (r, n) => r.checked.find((c) => c.name.startsWith(n));
const failures = (r) =>
  r.checked.filter((c) => c.ok === false).map((c) => c.name);

/** Swap one section's body, keeping the rest of the record intact. */
function withSection(heading, body) {
  return reference().replace(
    new RegExp(`(## ${heading}\\n\\n)[\\s\\S]*?(\\n## )`),
    `$1${body}\n$2`,
  );
}

test("the reference record passes against the diff it describes", () => {
  assert.deepEqual(failures(check({ text: reference(), repo: REPO })), []);
});

test("an empty 'did not verify' fails — it is the whole bar", () => {
  const res = check({
    text: withSection("What I did not verify", "(there is always something)"),
    repo: REPO,
  });
  assert.equal(byName(res, "What you did not verify").ok, false);
});

test("'nothing' fails, because there is always something", () => {
  for (const answer of ["Nothing.", "N/A", "All verified."]) {
    const res = check({
      text: withSection("What I did not verify", answer),
      repo: REPO,
    });
    assert.equal(
      byName(res, "What you did not verify").ok,
      false,
      `"${answer}" should fail`,
    );
  }
});

test("a principle the constitution does not have is caught", () => {
  // The fixture has seventeen, I to XVII. §XVIII is a rule nobody wrote.
  const text = reference().replace(
    "§XVI — Visual identity contract",
    "§XVIII — Visual identity contract",
  );
  const res = check({ text, repo: REPO });
  const c = byName(res, "Re-derived · principles-that-exist");
  assert.ok(c);
  assert.equal(c.ok, false);
  assert.match(c.detail, /XVIII/);
});

test("a gate command package.json does not define is caught", () => {
  const text = reference().replace(
    "npm run lint:check",
    "npm run verify:everything",
  );
  const res = check({ text, repo: REPO });
  const c = byName(res, "Re-derived · gate-commands-exist");
  assert.ok(c);
  assert.equal(c.ok, false);
  assert.match(c.detail, /verify:everything/);
});

test("mentioning the ship log without touching one is caught", () => {
  const noLog = makeFixture({
    changed: CHANGED.filter((f) => !f.includes("ship-log")),
  });
  try {
    const res = check({ text: reference(), repo: noLog });
    const c = byName(res, "Re-derived · ship-log-row-added");
    assert.ok(c);
    assert.equal(c.ok, false);
  } finally {
    removeFixture(noLog);
  }
});

test("a ship log changed but still empty is caught", () => {
  const placeholder = makeFixture({ changed: CHANGED, shipLogRow: false });
  try {
    const res = check({ text: reference(), repo: placeholder });
    const c = byName(res, "Re-derived · ship-log-row-added");
    assert.equal(c.ok, false);
    assert.match(c.detail, /still has no entries/);
  } finally {
    removeFixture(placeholder);
  }
});

test("logic changed with no test in the diff is named", () => {
  const noTest = makeFixture({
    changed: CHANGED.filter((f) => !f.includes(".test.")),
  });
  try {
    const res = check({ text: reference(), repo: noTest });
    const c = byName(res, "Re-derived · tests-for-new-logic");
    assert.ok(c);
    assert.equal(c.ok, false);
    assert.match(c.detail, /IX/);
  } finally {
    removeFixture(noTest);
  }
});

test("a verdict with no response fails", () => {
  const res = check({
    text: withSection(
      "The review verdict, and what I did about it",
      "`/noted-review` returned ❌ 3 issues.",
    ),
    repo: REPO,
  });
  assert.equal(byName(res, "Review verdict").ok, false);
});

test("verified-without-a-method fails", () => {
  const res = check({
    text: withSection(
      "What I verified, and how",
      "Everything works as expected.",
    ),
    repo: REPO,
  });
  assert.equal(byName(res, "What you verified").ok, false);
});

test("working on main or staging fails", () => {
  const onMain = makeFixture({ changed: CHANGED });
  try {
    // Move back to the branch the baseline was committed on.
    execFileSync("git", ["-C", onMain, "checkout", "-q", "main"], {
      stdio: "ignore",
    });
    const res = check({ text: reference(), repo: onMain });
    assert.equal(byName(res, "Branch").ok, false);
    assert.match(byName(res, "Branch").detail, /main/);
  } finally {
    removeFixture(onMain);
  }
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
    "The slice",
    "What you verified",
    "What you did not verify",
    "Review verdict",
  ]) {
    assert.ok(
      failed.includes(name),
      `${name} should fail on the blank template: ${failed.join(", ")}`,
    );
  }
});
