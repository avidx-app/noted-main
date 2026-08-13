import test from "node:test";
import assert from "node:assert/strict";

import { parseFrontmatter, tableText, replaceBlock } from "./ai-assets.mjs";

test("parses flat frontmatter", () => {
  const parsed = parseFrontmatter(
    [
      "---",
      "name: prd-new",
      "summary: Draft a new PRD",
      "---",
      "",
      "# body",
    ].join("\n"),
  );
  assert.deepEqual(parsed, { name: "prd-new", summary: "Draft a new PRD" });
});

test("strips surrounding quotes", () => {
  const parsed = parseFrontmatter(
    ["---", 'description: "Not a command."', "---"].join("\n"),
  );
  assert.equal(parsed.description, "Not a command.");
});

test("keeps colons inside a value", () => {
  // Descriptions routinely read `Use when: ...`, and splitting on the last
  // colon would silently truncate half the trigger surface.
  const parsed = parseFrontmatter(
    ["---", "description: CRITICAL: derive during render", "---"].join("\n"),
  );
  assert.equal(parsed.description, "CRITICAL: derive during render");
});

test("returns nothing when there is no frontmatter", () => {
  assert.deepEqual(parseFrontmatter("# Just a heading\n"), {});
});

test("returns nothing when the frontmatter is unterminated", () => {
  assert.deepEqual(parseFrontmatter("---\nname: x\n"), {});
});

test("ignores comments and blank lines", () => {
  const parsed = parseFrontmatter(
    ["---", "# a comment", "", "name: x", "---"].join("\n"),
  );
  assert.deepEqual(parsed, { name: "x" });
});

test("tableText prefers summary over description", () => {
  assert.equal(
    tableText({ summary: "Short", description: "A very long trigger surface" }),
    "Short",
  );
});

test("tableText falls back to description, then to empty", () => {
  assert.equal(tableText({ description: "Only this" }), "Only this");
  assert.equal(tableText({}), "");
});

test("replaceBlock swaps only what is between the markers", () => {
  const doc = [
    "before",
    "<!-- auto:skills:start -->",
    "stale",
    "<!-- auto:skills:end -->",
    "after",
  ].join("\n");

  assert.equal(
    replaceBlock(doc, "skills", "fresh"),
    [
      "before",
      "<!-- auto:skills:start -->",
      "fresh",
      "<!-- auto:skills:end -->",
      "after",
    ].join("\n"),
  );
});

test("replaceBlock is idempotent", () => {
  const doc = "<!-- auto:x:start -->\nsame\n<!-- auto:x:end -->";
  assert.equal(replaceBlock(replaceBlock(doc, "x", "same"), "x", "same"), doc);
});

test("replaceBlock throws when a marker is missing", () => {
  // Silently skipping generation is exactly how a generated table goes stale
  // while every check still reports green.
  assert.throws(
    () => replaceBlock("no markers here", "skills", "x"),
    /missing or malformed/,
  );
});

test("replaceBlock throws when the markers are inverted", () => {
  const doc = "<!-- auto:x:end -->\n<!-- auto:x:start -->";
  assert.throws(() => replaceBlock(doc, "x", "y"), /missing or malformed/);
});
