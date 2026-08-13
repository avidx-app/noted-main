import test from "node:test";
import assert from "node:assert/strict";

import { pathsOn, DECLARED_ABSENT, GENERATED, PATHISH } from "./doc-links.mjs";

test("finds a markdown link target", () => {
  assert.deepEqual(pathsOn("see [personas](personas.md)", "team-os/research"), [
    "team-os/research/personas.md",
  ]);
});

test("finds a repo-absolute path anywhere on the line", () => {
  assert.deepEqual(pathsOn("[x](team-os/CONTRIBUTING.md)", "anything/else"), [
    "team-os/CONTRIBUTING.md",
  ]);
});

test("finds a bare YAML value", () => {
  assert.deepEqual(
    pathsOn("  ship_log: team-os/features/ai-features/ship-log.md", "team-os"),
    ["team-os/features/ai-features/ship-log.md"],
  );
});

test("percent-decodes, because route-group parens must be encoded in a link", () => {
  // The renderer ends a link at the first `)`, so `app/(main)/x.tsx` has to be
  // written encoded. Comparing it raw reports a false break.
  assert.deepEqual(
    pathsOn("[p](../../app/%28main%29/page.tsx)", "team-os/product"),
    ["app/(main)/page.tsx"],
  );
});

test("ignores prose in backticks", () => {
  // `foo.tsx` in a naming example is not a claim that a file exists. Treating
  // it as one produced 89 findings of which most were noise.
  assert.deepEqual(
    pathsOn("name files like `coworker-message.tsx`", "team-os"),
    [],
  );
});

test("ignores external URLs", () => {
  assert.deepEqual(pathsOn("[docs](https://example.com/a.md)", "team-os"), []);
});

test("ignores anchors and globs", () => {
  assert.deepEqual(
    pathsOn("[a](#section) and [b](team-os/**/*.md)", "team-os"),
    [],
  );
});

test("ignores placeholders", () => {
  assert.deepEqual(
    pathsOn("[x](team-os/features/<slug>/index.md)", "team-os"),
    [],
  );
});

test("does not escape the repo via ..", () => {
  assert.deepEqual(
    pathsOn("[up](../../../../../etc/passwd.md)", "team-os"),
    [],
  );
});

test("skips generated symlinks, which are gitignored and prove nothing", () => {
  assert.deepEqual(pathsOn("[c](CLAUDE.md) [d](.claude/skills)", ""), []);
});

test("strips trailing punctuation that belongs to the sentence", () => {
  assert.deepEqual(pathsOn("read [it](team-os/vision.md).", ""), [
    "team-os/vision.md",
  ]);
});

test("normalises a trailing slash so a directory matches once", () => {
  assert.deepEqual(pathsOn("[dir](team-os/research/)", ""), [
    "team-os/research",
  ]);
});

test("DECLARED_ABSENT accepts every way the repo says not-yet", () => {
  for (const line of [
    "| `rfcs/` | Design proposals | Not created yet |",
    "dossier: null",
    "`[NEED: interview transcripts]`",
    "status: planned",
    "See [pricing.md](pricing.md) if/when we add it.",
    "This file does not exist.",
  ]) {
    assert.ok(
      DECLARED_ABSENT.test(line),
      `should be treated as declared absent: ${line}`,
    );
  }
});

test("DECLARED_ABSENT does not excuse an ordinary assertion", () => {
  // The whole check collapses if a plain row looks like a declared gap.
  assert.equal(
    DECLARED_ABSENT.test("| [metrics.md](metrics.md) | Metric definitions |"),
    false,
  );
});

test("PATHISH accepts real file shapes and rejects identifiers", () => {
  for (const ok of ["a.md", "b.yaml", "c.tsx", "d.mjs", "dir/"]) {
    assert.ok(PATHISH.test(ok), ok);
  }
  for (const no of ["useQuery", "npm run test", "NOT-123"]) {
    assert.equal(PATHISH.test(no), false, no);
  }
});

test("GENERATED matches the symlink roots and not lookalikes", () => {
  assert.ok(GENERATED.test(".claude/skills"));
  assert.ok(GENERATED.test("AGENTS.md"));
  assert.equal(GENERATED.test("team-os/CLAUDE.md"), false);
});
