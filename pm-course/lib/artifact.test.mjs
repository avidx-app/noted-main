import { test } from "node:test";
import assert from "node:assert/strict";
import {
  citedPaths,
  findSection,
  isPlaceholder,
  isVagueOnly,
  sections,
  slugHeading,
} from "./artifact.mjs";

test("slugHeading strips numbering and punctuation", () => {
  assert.equal(slugHeading("3. The contradiction"), "the contradiction");
  assert.equal(
    slugHeading("What I *could not* determine"),
    "what i could not determine",
  );
});

test("sections splits at ## and keeps the preamble", () => {
  const secs = sections("intro line\n\n## One\nbody one\n\n## Two\nbody two");
  assert.equal(secs[0].slug, "");
  assert.equal(secs[0].body, "intro line");
  assert.deepEqual(
    secs.slice(1).map((s) => s.slug),
    ["one", "two"],
  );
  assert.equal(secs[1].body, "body one");
});

test("findSection matches on every word, in any order", () => {
  const secs = sections("## 4. What I could not determine\nnothing");
  assert.ok(findSection(secs, "could", "not", "determine"));
  assert.equal(findSection(secs, "contradiction"), null);
});

test("citedPaths finds backticked paths and link targets", () => {
  const paths = citedPaths(
    "see `team-os/CLAUDE.md` and [x](team-os/feature-index.yaml)",
  );
  assert.deepEqual(paths.sort(), [
    "team-os/CLAUDE.md",
    "team-os/feature-index.yaml",
  ]);
});

test("citedPaths skips URLs, anchors and app routes", () => {
  // A leading slash is a route in the running app, not a file on disk. This
  // was a real miss: the reference answer cited `/documents/start` and the
  // checker failed it as a broken path.
  const paths = citedPaths(
    "`/documents/start` and `/documents` and <https://example.com/a/b> and [y](#anchor)",
  );
  assert.deepEqual(paths, []);
});

test("citedPaths keeps route-group parentheses intact", () => {
  assert.deepEqual(
    citedPaths("`app/(main)/(routes)/documents/start/page.tsx`"),
    ["app/(main)/(routes)/documents/start/page.tsx"],
  );
});

test("citedPaths ignores prose in backticks", () => {
  assert.deepEqual(
    citedPaths("the `default` scaffold and `status: in-design`"),
    [],
  );
});

test("isPlaceholder is true for an unfilled template section", () => {
  assert.equal(isPlaceholder(""), true);
  assert.equal(
    isPlaceholder("(one broken or confusing moment, in your own words)"),
    true,
  );
  assert.equal(isPlaceholder("<your answer here>"), true);
});

test("isPlaceholder does not try to recognize template wording", () => {
  // "**Between:** `path/one` and `path/two`" left untouched is a placeholder,
  // but not one this function can see — it is a sentence with words in it.
  // It gets caught a layer up, because `path/one` does not resolve in the
  // repo. Teaching this helper the template's own strings would make it lie
  // about what it knows.
  assert.equal(isPlaceholder("**Between:** `path/one` and `path/two`"), false);
});

test("isPlaceholder is false once something real is written", () => {
  assert.equal(
    isPlaceholder(
      "I could not find a way to share a draft with one person without publishing it.",
    ),
    false,
  );
});

test("isVagueOnly catches the non-answers, not the real ones", () => {
  assert.equal(isVagueOnly("Talk to more users."), true);
  assert.equal(isVagueOnly("do more research"), true);
  assert.equal(isVagueOnly(""), true);
  assert.equal(
    isVagueOnly(
      "Instrument the Publish popover open, and compare it against Document Published.",
    ),
    false,
  );
});
