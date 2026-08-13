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
import { REPO_PREFIXES, DECLARED_ABSENT, pathsOn } from "./lib/doc-links.mjs";

const check = process.argv.includes("--check");

/**
 * Files whose links we police: the agent instructions, and everything in the
 * Team OS. Originally only the CLAUDE.md indexes were checked, which missed a
 * PRD linking to a metrics file that had never been written — the documents
 * people actually read cross-reference each other far more than the indexes do.
 */
const MAPS = [
  ".ai/INSTRUCTIONS.md",
  ".ai/CONTRIBUTING.md",
  // pm-course/ is checked for the same reason team-os/ is, and more urgently: a
  // new hire following a dead link on their first morning concludes the repo is
  // rotten, and they are not wrong. Its briefs cross-reference the Team OS
  // heavily, so it is the folder most likely to break when something moves.
  ...["team-os", "pm-course"].flatMap((dir) =>
    walk(path.join(repoRoot, dir))
      .filter((f) => /\.(md|ya?ml)$/.test(f))
      .map((f) => path.relative(repoRoot, f)),
  ),
];

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
