#!/usr/bin/env node
/**
 * install-git-hooks — keep the agent layer fresh across branch switches.
 *
 * `.claude/`, `.cursor/`, `.agents/`, `CLAUDE.md` and `AGENTS.md` are gitignored
 * symlinks materialized from `.ai/` by scripts/sync-ai.mjs. Because they are not
 * tracked, git will not update them when you change branches — so a branch that
 * adds, renames or removes a skill leaves you pointing at the previous branch's
 * agent config until someone remembers to re-run `npm run sync-ai`. Nobody
 * remembers.
 *
 * This installs two hooks that re-run sync-ai for you:
 *   - post-checkout, only on an actual branch switch (git passes $3 = 1)
 *   - post-merge, after a merge or a pull brings new .ai/ content in
 *
 * We write hooks directly into .git/hooks rather than adding a hook manager,
 * because the repo does not otherwise need one. Run automatically via the
 * postinstall hook in package.json, or manually with `npm run install-hooks`.
 *
 * Idempotent, and deliberately conservative: a hook we did not write is never
 * overwritten. Every hook we write carries the marker below so we can tell.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const MARKER = "# managed-by: scripts/install-git-hooks.mjs";

/** @type {Array<{ name: string; body: string }>} */
const hooks = [
  {
    name: "post-checkout",
    // $1 previous HEAD, $2 new HEAD, $3 is 1 for a branch checkout and 0 for a
    // file checkout. Only a branch switch can change what .ai/ contains.
    body: [
      'if [ "$3" = "1" ]; then',
      '  node "$(git rev-parse --show-toplevel)/scripts/sync-ai.mjs" >/dev/null 2>&1 || true',
      "fi",
    ].join("\n"),
  },
  {
    name: "post-merge",
    body: 'node "$(git rev-parse --show-toplevel)/scripts/sync-ai.mjs" >/dev/null 2>&1 || true',
  },
  {
    // Deliberately only the drift checks. They are the two things a human
    // cannot notice going wrong: a generated table nobody regenerated, and a
    // map pointing at a file that moved. Format, lint, types and tests are
    // slow, already run in CI, and already run by /commit — putting them here
    // buys little and trains people to reach for --no-verify.
    name: "pre-commit",
    body: [
      'root="$(git rev-parse --show-toplevel)"',
      'node "$root/scripts/check-ai-index.mjs" --check || exit 1',
      'node "$root/scripts/check-doc-links.mjs" --check || exit 1',
    ].join("\n"),
  },
];

function hooksDir() {
  // Honour core.hooksPath and worktrees rather than assuming .git/hooks — the
  // repo's own /worktree command creates worktrees, where .git is a file.
  const gitPath = path.join(repoRoot, ".git");
  if (!fs.existsSync(gitPath)) return null;

  let gitDir = gitPath;
  if (fs.statSync(gitPath).isFile()) {
    const pointer = fs.readFileSync(gitPath, "utf8").trim();
    const match = pointer.match(/^gitdir:\s*(.+)$/);
    if (!match) return null;
    gitDir = path.resolve(repoRoot, match[1]);
  }

  return path.join(gitDir, "hooks");
}

function installOne(dir, { name, body }) {
  const target = path.join(dir, name);
  const contents = `#!/bin/sh\n${MARKER}\n${body}\n`;

  if (fs.existsSync(target)) {
    const existing = fs.readFileSync(target, "utf8");
    if (existing === contents) return;
    if (!existing.includes(MARKER)) {
      console.warn(
        `[install-git-hooks] skip ${name} — a hook we did not write is already there`,
      );
      return;
    }
  }

  fs.writeFileSync(target, contents, { mode: 0o755 });
  console.log(`[install-git-hooks] installed ${name}`);
}

function main() {
  const dir = hooksDir();
  if (!dir) {
    // Not a git checkout (a tarball, a Docker build context, a CI cache warm).
    // Nothing to install and nothing to complain about.
    return;
  }

  fs.mkdirSync(dir, { recursive: true });
  for (const hook of hooks) {
    installOne(dir, hook);
  }
}

main();
