import { test } from "node:test";
import assert from "node:assert/strict";
import {
  exportedSymbols,
  formattable,
  isProbe,
  needsDesignLint,
  parseChanged,
  probePathFor,
  probeTargets,
  PROBE_SUFFIX,
} from "./smoke-diff.mjs";

test("parseChanged merges committed and working-tree changes", () => {
  const files = parseChanged("lib/a.ts\nlib/b.ts", " M lib/b.ts\n?? lib/c.ts");
  assert.deepEqual(files, ["lib/a.ts", "lib/b.ts", "lib/c.ts"]);
});

test("parseChanged strips the status field without eating the path", () => {
  // The status field is two characters, not three. `git()` trims its output, so
  // the first porcelain line has already lost the leading space of " M path" —
  // slicing a fixed three would drop the first letter of the filename.
  assert.deepEqual(parseChanged("", "M  lib/analytics.ts"), [
    "lib/analytics.ts",
  ]);
  assert.deepEqual(parseChanged("", " M lib/analytics.ts"), [
    "lib/analytics.ts",
  ]);
});

test("parseChanged follows a rename to its destination", () => {
  assert.deepEqual(parseChanged("", "R  lib/old.ts -> lib/new.ts"), [
    "lib/new.ts",
  ]);
});

test("isProbe only matches the reserved suffix", () => {
  assert.equal(isProbe(`lib/__smoke__/x${PROBE_SUFFIX}ts`), true);
  assert.equal(
    isProbe("lib/x.test.ts"),
    false,
    "a real test is not a probe — clean must never delete it",
  );
});

test("probeTargets keeps changed source and drops everything else", () => {
  const targets = probeTargets([
    "lib/share-copy.ts",
    "app/(main)/_components/publish.tsx",
    "convex/documents.ts",
    "lib/share-copy.test.ts",
    "convex/_generated/api.d.ts",
    "team-os/research/personas.md",
    "package.json",
    `lib/__smoke__/x${PROBE_SUFFIX}ts`,
  ]);
  assert.deepEqual(targets, [
    "lib/share-copy.ts",
    "app/(main)/_components/publish.tsx",
    "convex/documents.ts",
  ]);
});

test("probeTargets skips generated Convex output", () => {
  // Probing the generated client tests the code generator, not the change.
  assert.deepEqual(probeTargets(["convex/_generated/api.js"]), []);
});

test("exportedSymbols finds the shapes this repo actually writes", () => {
  const src = [
    "export const shareCopy = (x) => x;",
    "export function detectScaffold() {}",
    "export async function seed() {}",
    "export class Thing {}",
    "export interface ShareCopy {}",
    "export type ShareState = string;",
  ].join("\n");
  assert.deepEqual(exportedSymbols(src).sort(), [
    "ShareCopy",
    "ShareState",
    "Thing",
    "detectScaffold",
    "seed",
    "shareCopy",
  ]);
});

test("exportedSymbols reports a default export, and its local name for the reader", () => {
  // `default` is what an importer binds; `Page` is what tells a reader which
  // thing changed. Sorted, because the function promises a set and not an order.
  assert.deepEqual(
    exportedSymbols("export default function Page() {}").sort(),
    ["Page", "default"],
  );
});

test("exportedSymbols reads a re-export list, aliases included", () => {
  assert.deepEqual(exportedSymbols("export { a, b as c };").sort(), ["a", "c"]);
});

test("exportedSymbols ignores an import that mentions export", () => {
  assert.deepEqual(exportedSymbols('import { thing } from "./exports";'), []);
});

test("needsDesignLint fires on the surfaces DESIGN.md binds", () => {
  // Constitution §XVI makes DESIGN.md binding on components/ and app/, so a diff
  // touching either has to face design:lint before it is called done.
  assert.equal(needsDesignLint(["components/editor.tsx"]), true);
  assert.equal(needsDesignLint(["app/(main)/_components/publish.tsx"]), true);
  assert.equal(
    needsDesignLint(["lib/share-copy.ts", "convex/documents.ts"]),
    false,
  );
});

test("formattable keeps what prettier understands", () => {
  assert.deepEqual(
    formattable(["lib/a.ts", "README.md", "x.png", "app/globals.css"]),
    ["lib/a.ts", "README.md", "app/globals.css"],
  );
});

test("probePathFor puts the probe beside its target, under __smoke__", () => {
  assert.equal(
    probePathFor("lib/share-copy.ts"),
    `lib/__smoke__/share-copy${PROBE_SUFFIX}ts`,
  );
  assert.equal(
    probePathFor("app/(main)/_components/publish.tsx"),
    `app/(main)/_components/__smoke__/publish${PROBE_SUFFIX}ts`,
  );
});
