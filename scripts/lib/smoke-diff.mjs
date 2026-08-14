/**
 * smoke-diff — the pure decisions, so they can be tested without a git repo.
 *
 * The baseline gates tell you the repo still compiles. They say nothing about
 * whether the thing you just built behaves correctly, and that gap is where real
 * bugs live: a function with inverted logic passes format, lint and type checks
 * cleanly. So the driver puts a targeted behavioral probe first and runs the
 * baselines underneath as a regression net.
 *
 * Ported from a heatseeker-next personal skill. Two deliberate differences: the
 * driver is committed here rather than gitignored, because a workflow that only
 * works on the author's laptop is not a repo convention; and there is one package
 * rather than a pnpm workspace, so "affected" means the changed files themselves.
 */

/** Reserved suffix. `clean` only ever deletes untracked files matching this. */
export const PROBE_SUFFIX = ".smoke-diff.test.";

/** Directories whose changes are worth probing. Everything else is docs or config. */
const SOURCE = /^(lib|convex|hooks|components|app)\//;

/** Parse `git diff --name-only` / `git status --porcelain` into paths. */
export function parseChanged(diffOut = "", statusOut = "") {
  const files = new Set(
    diffOut
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
  );
  for (const line of statusOut.split("\n")) {
    if (!line.trim()) continue;
    // Strip the two-character status field rather than a fixed three, because a
    // trimmed first line has already lost the leading space of " M path".
    const p = line
      .replace(/^[ MADRCU?!]{1,2}\s+/, "")
      .split(" -> ")
      .pop();
    if (p) files.add(p.trim());
  }
  return [...files].sort();
}

/** Is this a smoke probe? */
export function isProbe(p) {
  return p.includes(PROBE_SUFFIX);
}

/**
 * Changed source files worth writing a probe against.
 *
 * Excludes tests, type declarations, and generated Convex output — probing
 * `convex/_generated` tests the code generator, not the change.
 */
export function probeTargets(files) {
  return files.filter(
    (f) =>
      SOURCE.test(f) &&
      /\.tsx?$/.test(f) &&
      !isProbe(f) &&
      !/\.test\.|\.d\.ts$/.test(f) &&
      !f.startsWith("convex/_generated/"),
  );
}

/**
 * Exported symbols in a source file — the things a probe can actually call.
 *
 * Deliberately a regex rather than a parser: it needs to be approximately right
 * on a changed file, and a wrong guess costs a reader two seconds. `export
 * default` is reported as `default` because that is what the importer writes.
 */
export function exportedSymbols(source = "") {
  const names = new Set();
  const patterns = [
    /^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm,
    /^export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm,
    /^export\s+class\s+([A-Za-z_$][\w$]*)/gm,
    /^export\s+(?:type|interface|enum)\s+([A-Za-z_$][\w$]*)/gm,
  ];
  for (const re of patterns) {
    for (const m of source.matchAll(re)) names.add(m[1]);
  }
  if (/^export\s+default\b/m.test(source)) {
    names.add("default");
    // A default export's local name is not what an importer binds, but it is what
    // tells a reader which thing changed — "default (OnboardingStartPage)" beats
    // "default" when a page and a component both appear in the same plan.
    const local =
      /^export\s+default\s+(?:async\s+)?(?:function|class)\s+([A-Za-z_$][\w$]*)/m.exec(
        source,
      );
    if (local) names.add(local[1]);
  }
  for (const m of source.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    for (const part of m[1].split(",")) {
      const name = part
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name) names.add(name);
    }
  }
  return [...names];
}

/** Does this diff touch a surface DESIGN.md is binding on? Constitution §XVI. */
export function needsDesignLint(files) {
  return files.some((f) => /^(components|app)\//.test(f) && /\.tsx$/.test(f));
}

/** Files prettier should check — only the ones that changed, and only formats it knows. */
export function formattable(files) {
  return files.filter((f) => /\.(ts|tsx|js|jsx|mjs|json|md|css)$/.test(f));
}

/** Where a probe for this target belongs. */
export function probePathFor(target) {
  const dir = target.slice(0, target.lastIndexOf("/"));
  const base = target.slice(target.lastIndexOf("/") + 1).replace(/\.tsx?$/, "");
  return `${dir}/__smoke__/${base}${PROBE_SUFFIX}ts`;
}
