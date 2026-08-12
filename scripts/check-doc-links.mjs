#!/usr/bin/env node
/**
 * check-doc-links — every path our maps claim exists must actually exist.
 *
 * The Team OS is a set of navigation maps: team-os/feature-index.yaml, the
 * nested CLAUDE.md doc indexes, and the doc index in .ai/INSTRUCTIONS.md. Their
 * whole value is that an agent trusts them instead of opening every folder. A
 * map that points at a file nobody ever wrote is worse than no map, because it
 * costs a read and returns nothing.
 *
 *   node scripts/check-doc-links.mjs           report
 *   node scripts/check-doc-links.mjs --check   exit 1 if anything is broken
 *
 * Intentionally-empty sockets are legal, but they must be declared rather than
 * implied: mark the row `Not created yet`, `Not yet`, `null`, or `[NEED: ...]`,
 * or list the path in team-os/INTENTIONAL-GAPS.md. See that file for why some
 * gaps are deliberate.
 */

import fs from "node:fs";
import path from "node:path";

import { repoRoot } from "./lib/ai-assets.mjs";

const check = process.argv.includes("--check");

/** Files whose links we police. */
const MAPS = [
  ".ai/INSTRUCTIONS.md",
  ".ai/CONTRIBUTING.md",
  "team-os/feature-index.yaml",
  ...walk(path.join(repoRoot, "team-os"))
    .filter((f) => path.basename(f) === "CLAUDE.md")
    .map((f) => path.relative(repoRoot, f)),
];

/** Prefixes that mean "a path inside this repo" rather than prose. */
const REPO_PREFIXES = [
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

/** A row that says "this does not exist yet" is telling the truth, so allow it. */
const DECLARED_ABSENT =
  /\bnot (?:created |written |built )?yet\b|\bnull\b|\[NEED:|\bplanned\b|\bdoes not exist\b|\bnone yet\b/i;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() ? [full] : [];
  });
}

function gapRegister() {
  const file = path.join(repoRoot, "team-os", "INTENTIONAL-GAPS.md");
  if (!fs.existsSync(file)) return new Set();
  const text = fs.readFileSync(file, "utf8");
  return new Set(
    [...text.matchAll(/`([^`]+)`/g)]
      .map((m) => m[1].trim().replace(/^\.\//, ""))
      .filter((p) => REPO_PREFIXES.some((prefix) => p.startsWith(prefix))),
  );
}

/** Looks like a path we could resolve, rather than prose or an identifier. */
const PATHISH = /\/$|\.(md|ya?ml|tsx?|mjs|cjs|js|json|py|sh)$/;

/**
 * Generated symlinks. sync-ai materializes these from `.ai/` and .gitignore
 * excludes them, so they are absent in a fresh clone and present locally —
 * either way their existence says nothing about whether a map is accurate.
 */
const GENERATED = /^(\.claude|\.cursor|\.agents|CLAUDE\.md|AGENTS\.md)(\/|$)/;

/**
 * Candidate paths on one line: markdown link targets and bare YAML values.
 * Anchors, URLs and globs are not our business.
 *
 * A reference is repo-relative when it starts with a known top-level directory,
 * and otherwise resolved against the directory of the map it appears in.
 */
function pathsOn(line, mapDir) {
  const found = new Set();

  const add = (raw, { relative }) => {
    if (!raw) return;
    let value = raw.trim().replace(/[),.;:]+$/, "");
    if (!value || value.includes("://") || value.startsWith("#")) return;
    if (value.includes("*") || value.includes("<") || value.includes("$")) return;
    if (/\s/.test(value)) return;
    value = value.split("#")[0].replace(/^\.\//, "");
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
  for (const m of line.matchAll(/\]\(([^)]+)\)/g)) add(m[1], { relative: true });

  // Bare YAML values, e.g. `ship_log: team-os/features/x/ship-log.md`.
  for (const m of line.matchAll(/^\s*-?\s*[a-z_]*:\s*([A-Za-z0-9._/()[\]-]+)\s*$/gim))
    add(m[1], { relative: false });

  return [...found];
}

function main() {
  const allowed = gapRegister();
  const broken = [];
  let checked = 0;

  for (const map of MAPS) {
    const file = path.join(repoRoot, map);
    if (!fs.existsSync(file)) continue;

    // `.ai/INSTRUCTIONS.md` is surfaced as root CLAUDE.md and AGENTS.md via
    // symlink, so a reader follows its relative links from the repo root, not
    // from `.ai/`. Resolve it that way or every root-level link reads broken.
    const mapDir =
      map === ".ai/INSTRUCTIONS.md" || path.dirname(map) === "."
        ? ""
        : path.dirname(map);

    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (line.trimStart().startsWith("<!--")) return;
      for (const candidate of pathsOn(line, mapDir)) {
        checked++;
        if (fs.existsSync(path.join(repoRoot, candidate))) continue;
        if (DECLARED_ABSENT.test(line)) continue;
        if (allowed.has(candidate)) continue;
        broken.push({ map, line: index + 1, candidate, text: line.trim() });
      }
    });
  }

  if (!broken.length) {
    console.log(
      `[doc-links] ${checked} referenced paths across ${MAPS.length} maps — all resolve`,
    );
    return;
  }

  console.error(`[doc-links] ${broken.length} broken reference(s):\n`);
  for (const b of broken) {
    console.error(`  ${b.map}:${b.line}  ->  ${b.candidate}`);
    console.error(`    ${b.text.slice(0, 120)}`);
  }
  console.error(
    "\nEither create the file, mark the row as not-yet-created, or record it in team-os/INTENTIONAL-GAPS.md.",
  );
  if (check) process.exit(1);
}

main();
