/**
 * Stage 7's checker, tested against the real tree.
 *
 * The bar gets three tests, because it is the one thing this course is assessed
 * on and "Nothing" is the plausible wrong answer rather than an obvious one.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { check } from "./check.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "../../..");

const reference = () =>
  fs.readFileSync(
    path.join(here, "expected", "verification-record.md"),
    "utf8",
  );
const byName = (r, n) => r.checked.find((c) => c.name.startsWith(n));
const failures = (r) =>
  r.checked.filter((c) => c.ok === false).map((c) => c.name);

function withSection(heading, body) {
  const text = reference();
  const re = new RegExp(`(## ${heading}\\n\\n)[\\s\\S]*?(\\n## |$)`);
  if (!re.test(text)) throw new Error(`section "${heading}" not found`);
  return text.replace(re, `$1${body}\n$2`);
}

test("the reference record passes", () => {
  assert.deepEqual(failures(check({ text: reference(), repo: REPO })), []);
});

test("an empty unverified section fails — it is the whole bar", () => {
  const res = check({
    text: withSection("What I did not verify", "(there is always something.)"),
    repo: REPO,
  });
  assert.equal(byName(res, "What you did not verify").ok, false);
});

test("'nothing' fails, in each of the forms people write it", () => {
  for (const answer of [
    "Nothing.",
    "N/A",
    "None — all verified.",
    "All verified.",
  ]) {
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

test("localhost is not a staging verification", () => {
  const text = reference()
    .replaceAll(
      "https://noted-staging-ref.onrender.com",
      "http://localhost:3000",
    )
    .replaceAll("noted-staging-ref.onrender.com", "localhost:3000");
  const res = check({ text, repo: REPO });
  assert.equal(byName(res, "Verified on staging").ok, false);
});

test("a staging pass that noticed nothing different is recorded, not failed", () => {
  // Sometimes true, usually means only one environment was really checked. So it
  // is a note rather than a failure — the checker flags it and moves on.
  const res = check({
    text: withSection(
      "Verified on staging",
      "Opened https://noted-staging-ref.onrender.com, signed in, shared a document. Behaved as expected.",
    ),
    repo: REPO,
  });
  assert.equal(byName(res, "Staging is not local").ok, null);
});

test("claiming a command package.json does not define is caught", () => {
  const text = reference().replace("npm run lint:check", "npm run verify:all");
  const res = check({ text, repo: REPO });
  const c = byName(res, "Re-derived · gate-commands-exist");
  assert.equal(c.ok, false);
  assert.match(c.detail, /verify:all/);
});

test("mentioning smoke-diff without a probe is caught", () => {
  const text = withSection(
    "Verified locally",
    "Ran `npm run smoke -- run` and the gate, then clicked through the flow.",
  );
  const res = check({ text, repo: REPO });
  const c = byName(res, "Re-derived · smoke-diff-was-run");
  assert.equal(c.ok, false);
  assert.match(c.detail, /nothing has been shown to work/);
});

test("a deleted probe path is not treated as a broken citation", () => {
  // `npm run smoke -- clean` removes probes by design, so a record citing one is
  // citing a file that correctly no longer exists.
  const c = byName(check({ text: reference(), repo: REPO }), "Paths cited");
  assert.notEqual(c.ok, false);
});
