/**
 * Stage 3's checker, tested against the real tree.
 *
 * It reads the required sections out of `team-os/templates/prd.md` and the
 * allowed events out of `lib/analytics.ts`, so these tests run against the repo
 * rather than a fixture — the whole point is that the checker follows those two
 * files rather than a list somebody typed.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { check, knownEvents, templateSections } from "./check.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "../../..");

const reference = () =>
  fs.readFileSync(path.join(here, "expected", "prd.md"), "utf8");
const byName = (r, n) => r.checked.find((c) => c.name.startsWith(n));
const failures = (r) =>
  r.checked.filter((c) => c.ok === false).map((c) => c.name);

/** Swap one section's body, keeping the rest intact. */
function withSection(heading, body) {
  const text = reference();
  const re = new RegExp(`(## ${heading}[:]?\\n\\n)[\\s\\S]*?(\\n## )`);
  if (!re.test(text)) throw new Error(`section "${heading}" not found`);
  return text.replace(re, `$1${body}\n$2`);
}

test("the required sections come from the repo's own template", () => {
  const s = templateSections(REPO);
  assert.ok(s.includes("Context"), s.join(", "));
  assert.ok(s.includes("Key assumptions"), s.join(", "));
  assert.ok(s.includes("Experiment design"), s.join(", "));
  assert.ok(
    !s.some((h) => /^Hand off/i.test(h)),
    "the title row is not a section",
  );
});

test("the allowed events come from lib/analytics.ts", () => {
  const e = knownEvents(REPO);
  assert.ok(e.includes("Document Created"), "a real event should be listed");
  assert.ok(e.includes("In-Editor AI Triggered"));
  assert.ok(
    !e.includes("Onboarding Intent Submitted"),
    "an unbuilt event should not be",
  );
});

test("the reference PRD passes", () => {
  assert.deepEqual(failures(check({ text: reference(), repo: REPO })), []);
});

test("an assumption with no validation status fails", () => {
  const res = check({
    text: withSection(
      "Key assumptions",
      "- **The stopping happens** — seven of eleven transcripts.\n- **Access is the blocker** — probably.",
    ),
    repo: REPO,
  });
  assert.equal(byName(res, "Assumption status").ok, false);
});

test("a PRD with no ancestry fails", () => {
  // Strip every research citation and the evidence-map reference.
  const text = reference()
    .replaceAll("team-os/research/", "notes/")
    .replaceAll("evidence map", "thinking");
  const res = check({ text, repo: REPO });
  assert.equal(byName(res, "Descends from stage 2").ok, false);
});

test("citing the seeded baseline without saying so is caught", () => {
  const text = withSection(
    "Objectives",
    "Raise the second-document rate from its 92–96% baseline to 98%.",
  );
  const res = check({ text, repo: REPO });
  const c = byName(res, "Re-derived · seeded-baseline-declared");
  assert.ok(c, "the seeded-baseline check should have applied");
  assert.equal(c.ok, false);
  assert.match(c.detail, /scripts\/fixtures/);
});

test("the reference does cite that baseline, and does say where it came from", () => {
  const c = byName(
    check({ text: reference(), repo: REPO }),
    "Re-derived · seeded-baseline-declared",
  );
  assert.equal(c.ok, true);
});

test("naming an event this product does not emit is caught", () => {
  const text = withSection(
    "Data scope",
    "Measured by `Share Link Created`, which fires on every share.",
  );
  const res = check({ text, repo: REPO });
  const c = byName(res, "Re-derived · events-exist-or-are-flagged");
  assert.equal(c.ok, false);
  assert.match(c.detail, /Share Link Created/);
});

test("the same event marked NEEDS INSTRUMENTATION passes", () => {
  const text = withSection(
    "Data scope",
    "`Share Link Created` — **[NEEDS INSTRUMENTATION]**. This PRD adds it.",
  );
  const c = byName(
    check({ text, repo: REPO }),
    "Re-derived · events-exist-or-are-flagged",
  );
  assert.equal(c.ok, true);
});
