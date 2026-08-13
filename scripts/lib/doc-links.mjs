import path from "node:path";

/**
 * doc-links — the pure decisions behind `scripts/check-doc-links.mjs`.
 *
 * Extracted so they can be tested. The check gates CI and the pre-commit hook,
 * and a false negative in it is invisible by construction: the check passes,
 * the map is still wrong, and nobody finds out until an agent follows a dead
 * link. That is exactly the class of bug worth pinning with tests.
 */

/** Prefixes that mean "a path inside this repo" rather than prose. */
export const REPO_PREFIXES = [
  "team-os/",
  "app/",
  "convex/",
  "components/",
  "hooks/",
  "lib/",
  "scripts/",
  ".ai/",
  ".github/",
  ".specify/",
  "eslint-rules/",
  "docs/",
  "specs/",
];

/**
 * A line that says "this does not exist yet" is telling the truth, so allow it.
 * The point of the check is to catch maps that assert, not maps that promise.
 */
export const DECLARED_ABSENT =
  /\bnot (?:created |written |built )?yet\b|\bnull\b|\[NEED:|\bplanned\b|\bdoes not exist\b|\bnone yet\b|\bif\/when\b|\bwhen we add\b/i;

/** Looks like a path we could resolve, rather than prose or an identifier. */
export const PATHISH = /\/$|\.(md|ya?ml|tsx?|mjs|cjs|js|json|py|sh)$/;

/**
 * Generated symlinks. sync-ai materializes these from `.ai/` and .gitignore
 * excludes them, so they are absent in a fresh clone and present locally —
 * either way their existence says nothing about whether a map is accurate.
 */
export const GENERATED =
  /^(\.claude|\.cursor|\.agents|CLAUDE\.md|AGENTS\.md)(\/|$)/;

/**
 * Candidate paths on one line: markdown link targets and bare YAML values.
 * Anchors, URLs and globs are not our business.
 *
 * A reference is repo-relative when it starts with a known top-level directory,
 * and otherwise resolved against the directory of the map it appears in.
 */
export function pathsOn(line, mapDir) {
  const found = new Set();

  const add = (raw, { relative }) => {
    if (!raw) return;
    let value = raw.trim().replace(/[),.;:]+$/, "");
    if (!value || value.includes("://") || value.startsWith("#")) return;
    if (value.includes("*") || value.includes("<") || value.includes("$"))
      return;
    if (/\s/.test(value)) return;
    value = value.split("#")[0].replace(/^\.\//, "");
    // Route-group directories put parentheses in paths, and a markdown link has
    // to percent-encode those or the renderer ends the link at the first `)`.
    try {
      value = decodeURIComponent(value);
    } catch {
      // Malformed escape — compare it raw rather than throwing.
    }
    if (!value || GENERATED.test(value)) return;

    if (REPO_PREFIXES.some((prefix) => value.startsWith(prefix))) {
      found.add(value.replace(/\/$/, ""));
      return;
    }
    if (!relative || !PATHISH.test(value)) return;

    const resolved = path.normalize(path.join(mapDir, value));
    if (resolved.startsWith("..") || GENERATED.test(resolved)) return;
    found.add(resolved.replace(/\/$/, ""));
  };

  // A markdown link is a promise that clicking it lands somewhere. That is the
  // only claim we police in prose: a backticked `metrics/` in a table is
  // describing a shape as often as it is pointing at a file, and telling those
  // apart needs more configuration than the check is worth.
  for (const m of line.matchAll(/\]\(([^)]+)\)/g))
    add(m[1], { relative: true });

  // Bare YAML values, e.g. `ship_log: team-os/features/x/ship-log.md`.
  for (const m of line.matchAll(
    /^\s*-?\s*[a-z_]*:\s*([A-Za-z0-9._/()[\]-]+)\s*$/gim,
  ))
    add(m[1], { relative: false });

  return [...found];
}
