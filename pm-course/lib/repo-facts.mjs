/**
 * repo-facts — derive facts about this repo from this repo, never from memory.
 *
 * Every stage checker needs to answer questions like "does that file exist?" and
 * "how many pull requests were actually merged?". The tempting shortcut is to
 * write the answer into the brief and compare against it. That shortcut is what
 * the course argues against, and it has bitten before: three separate files said
 * "78 merged PRs" because someone read the highest pull request number instead of
 * counting the merged ones.
 *
 * So the checkers ask the tree. Everything here is offline and deterministic —
 * `git log` and files on disk. No network, no `gh`, no credentials.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

/**
 * What a learner's work is measured against.
 *
 * `main` rather than a tag: the course lives in the repo it is about, and a
 * learner branches off main like anyone else here would.
 */
export const BASE = "main";

/** Run git in the repo. Returns "" rather than throwing — callers decide. */
function git(repo, args) {
  try {
    return execFileSync("git", ["-C", repo, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Distinct pull requests merged into this history.
 *
 * Counted from merge-commit subjects, so it is whatever the tree itself can
 * prove. `git log --merges` on the pinned tag gives 77; the highest PR number is
 * 82, and five were closed without merging. Those two numbers are not the same
 * number and one of them is not a count.
 */
export function mergedPrs(repo, ref = "HEAD") {
  const log = git(repo, ["log", ref, "--merges", "--format=%s"]);
  if (!log) return null;
  const seen = new Set();
  for (const m of log.matchAll(/Merge pull request #(\d+)/g)) seen.add(m[1]);
  return seen.size;
}

/**
 * Did pull request `n` ever merge into this history?
 *
 * Offline, from merge-commit subjects — no `gh`, no network, no credentials. A
 * tracker saying "Done" and a pull request having merged are different facts, and
 * Stage 2 turns on one case where they disagree.
 */
export function mergedPr(repo, n, ref = "HEAD") {
  const log = git(repo, ["log", ref, "--merges", "--format=%s"]);
  return new RegExp(`Merge pull request #${n}\\b`).test(log);
}

/**
 * Files the attendee has changed since the pinned tag.
 *
 * Acts 3 and 4 grade a claim against a diff, which is the only way to catch the
 * failure they are about: an agent describing a prototype's boundary from what it
 * meant to do rather than from what it wrote. Includes uncommitted work, because
 * an attendee mid-lab has plenty.
 */
export function changedFiles(repo, base = BASE) {
  const committed = git(repo, ["diff", "--name-only", `${base}...HEAD`]);
  // -uall: list untracked files individually. Without it git collapses a new
  // directory to "hooks/", so a prototype that adds three files in a new folder
  // reports as one entry — and a contract mentioning the folder covers all of
  // them without naming any.
  const working = git(repo, ["status", "--porcelain", "-uall"]);
  const files = new Set(committed ? committed.split("\n").filter(Boolean) : []);
  for (const line of working ? working.split("\n") : []) {
    // Strip the two-character status field, not a fixed three characters.
    // `git()` trims its output, so the first porcelain line has already lost
    // the leading space of an unstaged " M path" — and slicing three ate the
    // first letter of the path. That is the worst possible bug in a checker:
    // the coverage check passed while under-reporting the diff.
    const p = line
      .replace(/^[ MADRCU?!]{1,2}\s+/, "")
      .split(" -> ")
      .pop();
    if (p) files.add(p);
  }
  return [...files];
}

/** The branch the attendee is working on. */
export function currentBranch(repo) {
  return git(repo, ["rev-parse", "--abbrev-ref", "HEAD"]) || null;
}

/** Roman numerals of the principles the constitution actually has. */
export function constitutionPrinciples(repo) {
  const src = read(repo, "team-os/engineering/constitution.md") ?? "";
  return [...src.matchAll(/^## ([IVXL]+)\.\s/gm)].map((m) => m[1]);
}

/** npm script names, so a record can be checked against commands that exist. */
export function npmScripts(repo) {
  const pkg = read(repo, "package.json");
  if (!pkg) return [];
  try {
    return Object.keys(JSON.parse(pkg).scripts ?? {});
  } catch {
    return [];
  }
}

/**
 * Which parts of noted were authored for the simulation, and so could not have
 * disagreed with each other. Everything else — the code, the history, the
 * running product — is the independent set.
 */
export const CONSTRUCTED = ["team-os/research/", "scripts/fixtures/"];

/** True if a repo-relative path is part of the authored-together set. */
export function isConstructed(p) {
  return CONSTRUCTED.some((prefix) => p.startsWith(prefix));
}

/** Absolute path inside the repo, with markdown percent-encoding undone. */
export function repoPath(repo, p) {
  let decoded = p;
  try {
    decoded = decodeURIComponent(p);
  } catch {
    /* a stray % is not an encoding — use it as written */
  }
  return path.join(repo, decoded);
}

/** Does this repo-relative path exist? Directories count. */
export function exists(repo, p) {
  return fs.existsSync(repoPath(repo, p));
}

/** Read a repo-relative file, or null. */
export function read(repo, p) {
  const full = repoPath(repo, p);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
  return fs.readFileSync(full, "utf8");
}

/** Flat YAML frontmatter as a map. Values only, no nesting — that is all we need. */
export function frontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---/.exec(text ?? "");
  if (!m) return {};
  /** @type {Record<string,string>} */
  const out = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([a-z_-]+):\s*(.*)$/i.exec(line.trim());
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}

/**
 * Data rows in the first markdown table, minus header and separator.
 *
 * A row whose cells are all em-dashes or italic asides is a placeholder, not an
 * entry — that is exactly the shape of noted's empty ship log, and counting it
 * as one would hide the thing Stage 1 is looking for.
 */
export function tableRows(text) {
  const lines = (text ?? "").split("\n");
  const start = lines.findIndex((l) => /^\s*\|.*\|\s*$/.test(l));
  if (start === -1) return [];

  const rows = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (!/^\s*\|.*\|\s*$/.test(line)) break;
    const cells = line
      .trim()
      .slice(1, -1)
      .split("|")
      .map((c) => c.trim());
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // separator
    rows.push(cells);
  }

  const [, ...body] = rows; // drop the header
  // Emphasis is matched in both markdown spellings on purpose. Prettier
  // normalises `*aside*` to `_aside_`, and this check only knew the asterisk
  // form — so running prettier over team-os/ turned the empty ship log into a
  // one-entry ship log and the stage 1 checker started failing against its own
  // reference answer. Third time markdown normalisation has broken a checker
  // here, and the third time the fix is to accept both forms rather than to
  // assume which one is on disk.
  const placeholder = (c) =>
    c === "" || c === "—" || c === "-" || /^([*_]{1,2}).*\1$/.test(c);
  return body.filter((cells) => !cells.every(placeholder));
}

/** Count `[NEED: ...]` and `[NEEDS ...]` markers — the repo's own word for a gap. */
export function needMarkers(text) {
  return [...(text ?? "").matchAll(/\[NEEDS?\b[^\]]*\]/g)].map((m) => m[0]);
}
