import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ANSWERABLE_FROM,
  cohortQuestions,
  OWN_CREDENTIALS,
  relevantEvents,
} from "./cohort-questions.mjs";

const REPO = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

test("every planted insight surfaces a question", () => {
  const qs = cohortQuestions(REPO);
  assert.equal(qs.length, 4, "the fixture plants four");
  for (const q of qs)
    assert.match(q.question, /\?$/, `${q.name} should ask something`);
});

test("the expected pattern never leaves the fixture", () => {
  // Printing it would hand over the finding, which is the whole exercise.
  const serialised = JSON.stringify(cohortQuestions(REPO));
  assert.ok(!/expectedPattern/.test(serialised));
  assert.ok(!/meaningful minority|Power users own more/.test(serialised));
});

test("every question is mapped to the sources that can answer it", () => {
  for (const q of cohortQuestions(REPO)) {
    assert.ok(ANSWERABLE_FROM[q.name], `${q.name} has no source mapping`);
  }
});

test("draft-review pressure is Convex-only, and that is the point", () => {
  // The top-ranked pain in the landscape is invisible in Amplitude, because no
  // publish-intent event exists. A learner who works only from charts misses it.
  assert.deepEqual(ANSWERABLE_FROM.draft_review_pressure, ["Convex"]);
});

test("the events named are ones this product actually emits", () => {
  const events = relevantEvents(REPO);
  assert.ok(events.includes("Document Published"), events.join(", "));
  assert.ok(events.includes("Coworker Message Sent"));
  assert.ok(
    !events.includes("Onboarding Intent Submitted"),
    "an unbuilt event must not appear",
  );
});

test("every credential in the list is one .env.example actually defines", () => {
  const example = fs.readFileSync(path.join(REPO, ".env.example"), "utf8");
  for (const [key] of OWN_CREDENTIALS) {
    assert.match(
      example,
      new RegExp(`^${key}=`, "m"),
      `${key} is not in .env.example`,
    );
  }
});
