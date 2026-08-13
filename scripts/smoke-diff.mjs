#!/usr/bin/env node
/**
 * smoke-diff — prove the change on this branch actually works.
 *
 *   npm run smoke -- plan            what changed, and what to probe
 *   npm run smoke -- probe <file>    run one probe, fast
 *   npm run smoke -- run             probe first, then the baseline gates
 *   npm run smoke -- clean           remove the probes (after you have read the report)
 *
 * `--base <ref>` diffs against something other than `staging`.
 *
 * The order is the point. A targeted probe runs before format, lint, types and
 * the related tests, because those four can all pass while the feature is wrong.
 * See `.ai/commands/smoke-diff.md` for the workflow this driver serves.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  exportedSymbols,
  formattable,
  isProbe,
  needsDesignLint,
  parseChanged,
  probePathFor,
  probeTargets,
  PROBE_SUFFIX,
} from "./lib/smoke-diff.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const argv = process.argv.slice(2);
const cmd = argv[0] ?? "plan";
const base = argv.includes("--base")
  ? argv[argv.indexOf("--base") + 1]
  : "staging";

const G = "\x1b[32m",
  R = "\x1b[31m",
  D = "\x1b[2m",
  Y = "\x1b[33m",
  O = "\x1b[0m";

function git(args) {
  try {
    return execFileSync("git", ["-C", repoRoot, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

/** Everything changed against `base`, committed and not. */
function changed() {
  const ref = git(["rev-parse", "--verify", base]).trim();
  if (!ref) {
    console.error(`${R}✗${O} no ref called ${base}. Pass --base <ref>.`);
    process.exit(2);
  }
  return parseChanged(
    git(["diff", "--name-only", `${base}...HEAD`]),
    git(["status", "--porcelain", "-uall"]),
  ).filter((f) => fs.existsSync(path.join(repoRoot, f)));
}

/** Probes anywhere in the tree, changed or not — a probe is always untracked. */
function probes() {
  return git(["status", "--porcelain", "-uall"])
    .split("\n")
    .map((l) => l.replace(/^[ MADRCU?!]{1,2}\s+/, "").trim())
    .filter((p) => p && isProbe(p));
}

function plan() {
  const files = changed();
  const targets = probeTargets(files);
  const found = probes();

  console.log(`\nsmoke-diff · against ${base}\n`);
  console.log(`changed files ... ${files.length}`);
  for (const f of files) console.log(`   ${D}${f}${O}`);

  console.log(
    `\nprobe(s) ........ ${found.length ? found.join(", ") : `${Y}(none yet — write one, that is the actual smoke test)${O}`}`,
  );

  if (!targets.length) {
    console.log(
      `\n${D}Nothing to probe: the diff is entirely outside lib/, convex/, hooks/, components/ and app/.\nOnly the baseline gates will run.${O}\n`,
    );
    return;
  }

  console.log(`\nprobe targets (changed exports to exercise):`);
  for (const t of targets) {
    const src = fs.readFileSync(path.join(repoRoot, t), "utf8");
    const names = exportedSymbols(src);
    console.log(`   ${t}`);
    for (const n of names) console.log(`      → ${n}`);
    if (!names.length)
      console.log(`      ${D}(no exports — probe it through its consumer)${O}`);
    console.log(`      ${D}probe would live at ${probePathFor(t)}${O}`);
  }
  console.log("");
}

/** Run a command, stream it, and report. */
function step(label, bin, args) {
  process.stdout.write(`──▶ ${label} `);
  const res = spawnSync(bin, args, { cwd: repoRoot, encoding: "utf8" });
  const ok = res.status === 0;
  console.log(ok ? `${G}✅${O}` : `${R}❌${O}`);
  if (!ok) {
    const out = `${res.stdout ?? ""}${res.stderr ?? ""}`.trim();
    if (out) console.log(out.split("\n").slice(-25).join("\n"));
  }
  return ok;
}

function run() {
  const files = changed();
  const found = probes();
  const results = [];

  console.log(
    `\nsmoke-diff · ${files.length} changed file(s) against ${base}\n`,
  );

  if (found.length) {
    results.push([
      "TARGETED probe — does the change actually work?",
      step("TARGETED probe", "npx", [
        "jest",
        "--testPathPatterns",
        "smoke-diff\\.test",
        "--silent",
      ]),
    ]);
  } else {
    console.log(
      `${Y}·${O} TARGETED probe — none written. ${D}The baselines below cannot tell you the change works.${O}`,
    );
    results.push(["TARGETED probe — not written", null]);
  }

  const fmt = formattable(files);
  if (fmt.length)
    results.push([
      "baseline: format",
      step("baseline: format ", "npx", ["prettier", "--check", ...fmt]),
    ]);

  const lintable = files.filter((f) => /\.(ts|tsx|mjs|js)$/.test(f));
  if (lintable.length)
    results.push([
      "baseline: lint",
      step("baseline: lint   ", "npx", ["eslint", ...lintable]),
    ]);

  results.push([
    "baseline: types",
    step("baseline: types  ", "npx", ["tsc", "--noEmit"]),
  ]);

  const related = files.filter((f) => /\.(ts|tsx)$/.test(f) && !isProbe(f));
  if (related.length) {
    results.push([
      "baseline: related tests",
      step("baseline: related", "npx", [
        "jest",
        "--findRelatedTests",
        ...related,
        "--passWithNoTests",
        "--silent",
      ]),
    ]);
  }

  if (needsDesignLint(files)) {
    results.push([
      "baseline: design",
      step("baseline: design ", "npm", ["run", "design:lint"]),
    ]);
  }

  const failed = results.filter(([, ok]) => ok === false);
  const skipped = results.filter(([, ok]) => ok === null);
  console.log(
    `\n   pass=${results.filter(([, ok]) => ok).length} fail=${failed.length}` +
      `   RESULT: ${failed.length ? `${R}FAIL${O}` : `${G}PASS${O}`}`,
  );
  if (skipped.length && !failed.length) {
    console.log(
      `${Y}   Passing baselines are not evidence the feature works. Write a probe.${O}`,
    );
  }
  console.log("");
  process.exit(failed.length ? 1 : 0);
}

function clean() {
  const found = probes();
  if (!found.length) {
    console.log("smoke-diff: no probes to remove");
    return;
  }
  for (const p of found) {
    fs.rmSync(path.join(repoRoot, p), { force: true });
    console.log(`removed ${p}`);
    const dir = path.dirname(path.join(repoRoot, p));
    if (
      dir.endsWith("__smoke__") &&
      fs.existsSync(dir) &&
      !fs.readdirSync(dir).length
    ) {
      fs.rmdirSync(dir);
      console.log(`removed ${path.relative(repoRoot, dir)}/`);
    }
  }
}

switch (cmd) {
  case "plan":
    plan();
    break;
  case "probe": {
    const file = argv[1];
    if (!file) {
      console.error("usage: npm run smoke -- probe <file>");
      process.exit(2);
    }
    process.exit(
      spawnSync("npx", ["jest", file], { cwd: repoRoot, stdio: "inherit" })
        .status ?? 1,
    );
  }
  case "run":
    run();
    break;
  case "clean":
    clean();
    break;
  default:
    console.error(
      `unknown subcommand "${cmd}". Try: plan | probe <file> | run | clean`,
    );
    process.exit(2);
}
