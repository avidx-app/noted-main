import { test } from "node:test";
import assert from "node:assert/strict";
import {
  frontmatter,
  needMarkers,
  repoPath,
  tableRows,
} from "./repo-facts.mjs";

test("frontmatter reads flat keys and strips quotes", () => {
  const fm = frontmatter(
    '---\ntype: metrics\nstatus: "partially-measurable"\n---\n\n# Title',
  );
  assert.equal(fm.type, "metrics");
  assert.equal(fm.status, "partially-measurable");
});

test("frontmatter is empty when there is none", () => {
  assert.deepEqual(frontmatter("# Just a heading"), {});
});

test("tableRows drops the header and the separator", () => {
  const rows = tableRows(
    ["| A | B |", "| --- | --- |", "| 1 | 2 |", "| 3 | 4 |"].join("\n"),
  );
  assert.deepEqual(rows, [
    ["1", "2"],
    ["3", "4"],
  ]);
});

test("tableRows does not count a placeholder row as an entry", () => {
  // This is exactly the shape of noted's empty ship log. Counting its
  // "(No entries yet…)" row as an entry would hide the thing Stage 1 looks for.
  const shipLog = [
    "| Date | PR | Author | What changed | Deploy |",
    "|---|---|---|---|---|",
    "| — | — | — | *(No entries yet.)* | — |",
  ].join("\n");
  assert.deepEqual(tableRows(shipLog), []);
});

test("tableRows stops at the end of the first table", () => {
  const rows = tableRows(
    "| A |\n| --- |\n| 1 |\n\nprose\n\n| B |\n| --- |\n| 2 |",
  );
  assert.deepEqual(rows, [["1"]]);
});

test("needMarkers finds both NEED and NEEDS forms", () => {
  const found = needMarkers(
    "a `[NEED: cohort]` and `[NEEDS INSTRUMENTATION: X, Y]` here",
  );
  assert.deepEqual(found, ["[NEED: cohort]", "[NEEDS INSTRUMENTATION: X, Y]"]);
});

test("repoPath undoes markdown percent-encoding", () => {
  assert.match(
    repoPath("/repo", "app/%28main%29/page.tsx"),
    /app\/\(main\)\/page\.tsx$/,
  );
});

test("repoPath survives a stray percent sign", () => {
  assert.match(
    repoPath("/repo", "docs/100%-coverage.md"),
    /100%-coverage\.md$/,
  );
});
