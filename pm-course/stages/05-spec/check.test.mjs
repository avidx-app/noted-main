/**
 * Stage 5's checker, tested against a fixture with a real spec bundle.
 *
 * The exemplar-shape check is the one that matters: the required files are read
 * out of `specs/EXP-1-in-editor-ai-triggered/` rather than listed here, so a
 * bundle is judged against the only finished one this repo has.
 */

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { check, exemplarFiles, learnerBundles } from "./check.mjs";
import { makeFixture, removeFixture } from "../../lib/fixture-repo.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = makeFixture({ bundle: "NOT-201-share-framing" });
after(() => removeFixture(REPO));

const reference = () =>
  fs.readFileSync(path.join(here, "expected", "spec-record.md"), "utf8");
const byName = (r, n) => r.checked.find((c) => c.name.startsWith(n));
const failures = (r) =>
  r.checked.filter((c) => c.ok === false).map((c) => c.name);

test("the required shape is read from the exemplar, not from a list", () => {
  assert.deepEqual(exemplarFiles(REPO), [
    "checklists/requirements.md",
    "plan.md",
    "spec.md",
    "tasks.md",
  ]);
});

test("the exemplar is not counted as the learner's bundle", () => {
  // Otherwise the stage passes for everyone the moment they clone the repo.
  assert.deepEqual(learnerBundles(REPO), ["specs/NOT-201-share-framing"]);
});

test("the reference record passes against a complete bundle", () => {
  assert.deepEqual(failures(check({ text: reference(), repo: REPO })), []);
});

test("no bundle at all fails, and says why", () => {
  const bare = makeFixture();
  try {
    const res = check({ text: reference(), repo: bare });
    assert.equal(byName(res, "The bundle").ok, false);
    assert.match(
      byName(res, "The bundle").detail,
      /cannot pass before one exists/,
    );
  } finally {
    removeFixture(bare);
  }
});

test("a bundle missing a file is caught against the exemplar's shape", () => {
  const partial = makeFixture({ bundle: "NOT-202-partial" });
  try {
    fs.rmSync(path.join(partial, "specs/NOT-202-partial/tasks.md"));
    const res = check({ text: reference(), repo: partial });
    const c = res.checked.find((x) => x.name.startsWith("Shape"));
    assert.equal(c.ok, false);
    assert.match(c.detail, /tasks\.md/);
  } finally {
    removeFixture(partial);
  }
});

test("an unresolved clarification marker and an unticked gate are both caught", () => {
  const gappy = makeFixture({ bundle: "NOT-203-gappy", bundleGaps: true });
  try {
    const res = check({ text: reference(), repo: gappy });
    const clar = byName(res, "Re-derived · no-unresolved-clarifications");
    const list = byName(res, "Re-derived · checklist-actually-ticked");
    assert.equal(clar.ok, false, "NEEDS CLARIFICATION should fail");
    assert.equal(list.ok, false, "an unticked checklist should fail");
    assert.match(list.detail, /a gate nobody passed is not a gate/);
  } finally {
    removeFixture(gappy);
  }
});

test("grounding with no provenance fails, because the research is constructed", () => {
  const text = reference().replace(
    /\*\*What the grounding rests on\.\*\*[\s\S]*?\n\n/,
    "",
  );
  const res = check({ text, repo: REPO });
  assert.equal(byName(res, "Provenance stated").ok, false);
});

test("'nothing changed' from clarify fails; arguing against it does not", () => {
  const res = check({
    text: reference().replace(
      /(## What clarify changed\n\n)[\s\S]*?(\n## )/,
      "$1Nothing changed.\n$2",
    ),
    repo: REPO,
  });
  assert.equal(byName(res, "What clarify changed").ok, false);

  // The reference's own section contains the word "nothing" while arguing the
  // opposite. An unanchored match failed it, which is why this pair exists.
  assert.equal(
    byName(check({ text: reference(), repo: REPO }), "What clarify changed").ok,
    true,
  );
});
