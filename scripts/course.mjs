#!/usr/bin/env node
/**
 * course — run one pm-course stage's checker against what you wrote.
 *
 *   npm run course -- 1
 *   npm run course -- 1 --file pm-course/my-work/orientation-map.md
 *   npm run course -- 1 --expected      run it against the reference answer
 *
 * Exit code is 1 if any mechanical check failed. It is not a grade. Read the
 * second list — the things no script can check are what the stage is about.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/** Stages that have a checker. The rest say so in their brief. */
export const STAGES = {
  1: { dir: "pm-course/stages/01-day-one", artifact: "orientation-map.md" },
};

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? null : process.argv[i + 1];
}

const G = "\x1b[32m",
  R = "\x1b[31m",
  D = "\x1b[2m",
  Y = "\x1b[33m",
  O = "\x1b[0m";
const mark = (ok) =>
  ok === null ? `${Y}·${O}` : ok ? `${G}✓${O}` : `${R}✗${O}`;

async function main() {
  const stage = process.argv[2];
  const spec = STAGES[stage];

  if (!spec) {
    console.error(
      `Usage: npm run course -- <stage> [--file <path>] [--expected]`,
    );
    console.error(`Stages with a checker: ${Object.keys(STAGES).join(", ")}`);
    console.error(
      `The others are specified in pm-course/CLAUDE.md and not built yet.`,
    );
    process.exit(2);
  }

  const file = process.argv.includes("--expected")
    ? path.join(repoRoot, spec.dir, "expected", spec.artifact)
    : path.resolve(
        repoRoot,
        arg("--file") ?? path.join("pm-course/my-work", spec.artifact),
      );

  if (!fs.existsSync(file)) {
    console.error(`${R}✗${O} no artifact at ${path.relative(repoRoot, file)}`);
    console.error(
      `  Write it, or point at it with --file. The template is in ${spec.dir}/brief.md`,
    );
    process.exit(2);
  }

  const { check, meta } = await import(
    path.join(repoRoot, spec.dir, "check.mjs")
  );
  const { checked, unchecked } = check({
    text: fs.readFileSync(file, "utf8"),
    repo: repoRoot,
  });

  console.log(`\nStage ${meta.stage} · ${meta.name} — ${path.basename(file)}`);

  const width = Math.max(...checked.map((c) => c.name.length));
  console.log(`\nChecked mechanically`);
  for (const c of checked) {
    console.log(`  ${mark(c.ok)} ${c.name.padEnd(width)}  ${D}${c.detail}${O}`);
  }

  // Most people take this course alone, so the second list cannot assume a
  // colleague. The reference answer is the substitute: written, then compared.
  console.log(`\nNot checked — read these against your own artifact`);
  for (const u of unchecked) console.log(`  ${D}·${O} ${u}`);
  console.log(
    `\n  ${D}On your own? Answer them, then open ${path.join(spec.dir, "expected", spec.artifact)}`,
  );
  console.log(
    `  ${D}and compare the reasoning rather than the conclusions.${O}`,
  );

  const failed = checked.filter((c) => c.ok === false);
  console.log(
    failed.length
      ? `\n${R}${failed.length} check${failed.length === 1 ? "" : "s"} failed.${O} Fix those, then get a human to read the four above.\n`
      : `\n${G}Mechanical checks pass.${O} That is the floor, not the bar — the four above are the stage.\n`,
  );

  process.exit(failed.length ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
