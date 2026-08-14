/**
 * Stage 2's checker, tested.
 *
 * The independence check is the one that matters, so it gets both directions: a
 * row that correctly marks a constructed source as dependent passes, and the same
 * row claiming independence fails. Those two tests are the act, expressed as
 * assertions.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { check, KNOWN } from "./check.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const NOTED = path.resolve(here, "../../..");
const have = fs.existsSync(path.join(NOTED, "team-os"));

/** A map that passes, against the real tree. Overrides let each test break one thing. */
function goodMap(o = {}) {
  const v = {
    claim:
      "Users cannot give one reader access to a draft without publishing it publicly.",
    falsify:
      "If an unauthenticated visitor can already read a published document, access is not the blocker.",
    evidence: [
      "| Source | What it says | Kind | Could it have disagreed? |",
      "| --- | --- | --- | --- |",
      "| The code | `convex/documents.ts` returns published docs with no identity | fact | Yes |",
      "| The schema | `convex/schema.ts` has one sharing boolean | fact | Yes |",
      "| Research | `team-os/research/pain-landscape.md` ranks it first | interpretation | No — authored with the interviews |",
      "| Threads | `team-os/research/conversations/slack/2026-05-04-engineering-share-link-scope.md` prices it at three weeks | contradiction | No |",
    ].join("\n"),
    contradictions: [
      "The thread says a reviewer needs an account to read a document at all.",
      "`convex/documents.ts` disproves it, and",
      "`team-os/research/conversations/slack/2026-05-04-engineering-share-link-scope.md` is where it was said.",
    ].join(" "),
    unknown:
      "Whether the stopping happens at the claimed rate. Every number available is seeded.",
    priority: [
      "| Assumption | Uncertainty | Consequence | Score |",
      "| --- | --- | --- | --- |",
      "| Access is the blocker | 1 | 5 | 5 |",
      "| The behavior is real | 5 | 4 | 20 |",
    ].join("\n"),
    decision: [
      "**Verb:** narrow",
      "",
      "**Artifact that must change:** `team-os/research/pain-landscape.md`",
    ].join("\n"),
    ...o,
  };

  return [
    "# Evidence map",
    "",
    "## 1. The claim I am testing",
    "",
    v.claim,
    "",
    "## 2. What would change my mind",
    "",
    v.falsify,
    "",
    "## 3. The evidence",
    "",
    v.evidence,
    "",
    "## 4. Contradictions I am keeping",
    "",
    v.contradictions,
    "",
    "## 5. What I could not answer",
    "",
    v.unknown,
    "",
    "## 6. Priority",
    "",
    v.priority,
    "",
    "## 7. The decision",
    "",
    v.decision,
    "",
  ].join("\n");
}

const byName = (r, n) => r.checked.find((c) => c.name.startsWith(n));
const failures = (r) =>
  r.checked.filter((c) => c.ok === false).map((c) => c.name);
const skipWithout = (t) => {
  if (have) return false;
  t.skip(`no noted checkout at ${NOTED}`);
  return true;
};

test("a well-formed map passes every mechanical check", (t) => {
  if (skipWithout(t)) return;
  assert.deepEqual(failures(check({ text: goodMap(), repo: NOTED })), []);
});

test("claiming independence for an authored-together source fails", (t) => {
  if (skipWithout(t)) return;
  // The row is unchanged except that "No" becomes "Yes". That single word is
  // the difference between four sources and two, and it is the whole act.
  const evidence = goodMap()
    .split("\n")
    .map((l) =>
      l.includes("pain-landscape.md")
        ? l.replace("| No — authored with the interviews |", "| Yes |")
        : l,
    )
    .join("\n");
  const res = check({ text: evidence, repo: NOTED });
  assert.equal(byName(res, "Independence").ok, false);
  assert.match(byName(res, "Independence").detail, /pain-landscape\.md/);
});

test("a map that never opens the code fails, however full the table", (t) => {
  if (skipWithout(t)) return;
  // The check scans the whole document, not just the table — citing the code
  // anywhere counts as having opened it. So this fixture has to be clean of
  // code paths throughout, which is the point: it is a map built entirely from
  // what people wrote about the product.
  const evidence = [
    "| Source | What it says | Kind | Could it have disagreed? |",
    "| --- | --- | --- | --- |",
    "| Research | `team-os/research/pain-landscape.md` ranks it first | interpretation | No |",
    "| Personas | `team-os/research/personas.md` names the Reviewer | interpretation | No |",
    "| Interviews | `team-os/research/interviews/` has eleven | fact | No |",
    "| Threads | `team-os/research/conversations/` has the decision | fact | No |",
  ].join("\n");
  const contradictions = [
    "`team-os/research/pain-landscape.md` ranks the pain first, while",
    "`team-os/product/prds/growth/ai-first-onboarding-prd.md` works a different one.",
  ].join(" ");
  const res = check({
    text: goodMap({ evidence, contradictions }),
    repo: NOTED,
  });
  assert.equal(byName(res, "Consulted the code").ok, false);
  assert.equal(
    byName(res, "Contradictions").ok,
    true,
    "the map is otherwise well-formed",
  );
});

test("a question is not a claim", (t) => {
  if (skipWithout(t)) return;
  const res = check({
    text: goodMap({ claim: "Can users share a draft with one person?" }),
    repo: NOTED,
  });
  assert.equal(byName(res, "Claim").ok, false);
});

test("no falsification fails — that is how you find agreement", (t) => {
  if (skipWithout(t)) return;
  const res = check({
    text: goodMap({ falsify: "Talk to more users." }),
    repo: NOTED,
  });
  assert.equal(byName(res, "Falsification").ok, false);
});

test("a summary with no contradiction fails", (t) => {
  if (skipWithout(t)) return;
  const res = check({
    text: goodMap({
      contradictions: "Everything broadly lines up and points the same way.",
    }),
    repo: NOTED,
  });
  assert.equal(byName(res, "Contradictions").ok, false);
});

test("a decision with no verb fails", (t) => {
  if (skipWithout(t)) return;
  const res = check({
    text: goodMap({
      decision:
        "We should probably look into this further. `team-os/research/personas.md`",
    }),
    repo: NOTED,
  });
  assert.equal(byName(res, "Decision verb").ok, false);
});

test("a verb with no artifact to update fails", (t) => {
  if (skipWithout(t)) return;
  const res = check({
    text: goodMap({ decision: "**Verb:** narrow" }),
    repo: NOTED,
  });
  assert.equal(byName(res, "Artifact to update").ok, false);
});

test("investigate needs the missing evidence named", (t) => {
  if (skipWithout(t)) return;
  const vague = check({
    text: goodMap({
      decision: "**Verb:** investigate. `team-os/research/pain-landscape.md`",
    }),
    repo: NOTED,
  });
  assert.equal(byName(vague, "Investigate qualifies").ok, false);

  const named = check({
    text: goodMap({
      decision:
        "**Verb:** investigate — we do not know whether publish intent is real, and the missing event blocks the sizing decision. `team-os/research/pain-landscape.md`",
    }),
    repo: NOTED,
  });
  assert.equal(byName(named, "Investigate qualifies").ok, true);
});

test("unscored priority rows fail", (t) => {
  if (skipWithout(t)) return;
  const priority = [
    "| Assumption | Uncertainty | Consequence | Score |",
    "| --- | --- | --- | --- |",
    "| Access is the blocker | high | high | ? |",
  ].join("\n");
  const res = check({ text: goodMap({ priority }), repo: NOTED });
  assert.equal(byName(res, "Priority").ok, false);
});

test("the untouched template fails on the sections that matter", (t) => {
  if (skipWithout(t)) return;
  const brief = fs.readFileSync(path.join(here, "brief.md"), "utf8");
  const template = /```markdown\n([\s\S]*?)```/.exec(brief)?.[1];
  assert.ok(
    template,
    "brief.md no longer contains a ```markdown template block",
  );

  const failed = failures(check({ text: template, repo: NOTED }));
  for (const name of [
    "Claim",
    "Falsification",
    "Contradictions",
    "Unknowns",
    "Priority",
  ]) {
    assert.ok(
      failed.includes(name),
      `${name} should fail on the blank template: ${failed.join(", ")}`,
    );
  }
});

test("the reference answer passes, and its contradiction is re-derived", (t) => {
  if (skipWithout(t)) return;
  const text = fs.readFileSync(
    path.join(here, "expected", "evidence-map.md"),
    "utf8",
  );
  const res = check({ text, repo: NOTED });
  assert.deepEqual(failures(res), []);
  // Specifically the one the whole storyline turns on.
  const settled = res.checked.find(
    (c) => c.name === "Re-derived · unauthenticated-read-already-works",
  );
  assert.ok(
    settled,
    "the reference should trigger the unauthenticated-read re-derivation",
  );
  assert.equal(settled.ok, true);
});

test("every known contradiction still holds in the real tree", (t) => {
  if (skipWithout(t)) return;
  for (const k of KNOWN) {
    const { holds, detail } = k.verify(NOTED);
    assert.ok(holds, `${k.id} no longer holds: ${detail}`);
  }
});
