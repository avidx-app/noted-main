/**
 * A throwaway git repo shaped like noted, with a diff against `workshop-v1`.
 *
 * Acts 3 and 4 grade a document against work the attendee just did, so their
 * checkers need a tree with uncommitted changes in it. Building that prototype in
 * the real noted checkout is not an option — it is the exercise, and shipping it
 * would delete the lab.
 *
 * So the tests get a fixture: real git, real tag, real diff, and just enough of
 * noted's shape (a constitution with seventeen principles, a package.json with
 * the gate scripts) for the re-derivations to have something to read.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROMAN = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
  "XVII",
];

const SCRIPTS = [
  "dev",
  "lint:check",
  "type:check",
  "test",
  "design:lint",
  "format:check",
  "ci:local",
];

function git(dir, args) {
  execFileSync("git", ["-C", dir, ...args], { stdio: "ignore" });
}

function write(dir, rel, body) {
  const full = path.join(dir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, body);
}

/**
 * Create the fixture and return its path.
 *
 * @param {{ changed?: string[], shipLogRow?: boolean, bundle?: string, bundleGaps?: boolean }} opts
 *   `changed` — files to modify after the tag, becoming the diff.
 *   `shipLogRow` — give the new ship log a real entry rather than a placeholder.
 *   `bundle` — slug for a learner spec bundle under specs/, for stage 5.
 *   `bundleGaps` — leave [NEEDS CLARIFICATION] in it and no ticked boxes.
 */
export function makeFixture({
  changed = [],
  shipLogRow = true,
  bundle = null,
  bundleGaps = false,
} = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "noted-fixture-"));

  // ── The tagged baseline ────────────────────────────────────────────────
  write(
    dir,
    "team-os/engineering/constitution.md",
    `# Constitution\n\n${ROMAN.map((r, i) => `## ${r}. Principle ${i + 1}\n\nText.\n`).join("\n")}`,
  );
  write(
    dir,
    "package.json",
    JSON.stringify(
      {
        name: "fixture",
        scripts: Object.fromEntries(SCRIPTS.map((s) => [s, "true"])),
      },
      null,
      2,
    ),
  );
  write(dir, "DESIGN.md", "# Design\n");
  write(
    dir,
    "app/(main)/_components/publish.tsx",
    "export const Publish = () => null;\n",
  );
  write(dir, "lib/analytics.ts", "export const track = () => {};\n");
  write(dir, "convex/documents.ts", "export const getById = 1;\n");
  write(
    dir,
    "team-os/feature-index.yaml",
    "publish-to-web:\n  dossier: null\n",
  );
  write(
    dir,
    "team-os/product/prds/growth/prototype-boundary.md",
    "# Prototype boundary\n",
  );
  // The research Phase 0 grounds against. Stage 5 requires a spec record to cite
  // at least one path that resolves, so these have to exist for that check to be
  // exercised rather than skipped.
  write(dir, "team-os/research/personas.md", "# Personas\n");
  write(dir, "team-os/research/pain-landscape.md", "# Pain landscape\n");
  write(
    dir,
    "team-os/research/interviews/2026-04-08-mia-publish-friction-draft-review-gap.md",
    "---\nprovenance: constructed\n---\n\n# Mia\n",
  );
  write(dir, "team-os/research/interviews/CLAUDE.md", "# Interviews\n");
  // The exemplar spec bundle. Stage 5 reads the required shape out of this rather
  // than from a list, so the fixture has to carry it for that check to mean
  // anything — and its absence made the check silently pass on an empty set.
  for (const f of ["spec.md", "plan.md", "tasks.md"]) {
    write(dir, `specs/EXP-1-in-editor-ai-triggered/${f}`, `# ${f}\n`);
  }
  write(
    dir,
    "specs/EXP-1-in-editor-ai-triggered/checklists/requirements.md",
    "# Requirements\n\n- [x] Done\n",
  );
  write(
    dir,
    "team-os/research/conversations/linear/NOT-118-ship-log-automation.md",
    "# NOT-118\n",
  );

  git(dir, ["init", "-q", "-b", "main"]);
  git(dir, ["config", "user.email", "fixture@example.com"]);
  git(dir, ["config", "user.name", "Fixture"]);
  git(dir, ["add", "-A"]);
  git(dir, ["-c", "commit.gpgsign=false", "commit", "-q", "-m", "baseline"]);
  git(dir, ["tag", "workshop-v1"]);
  git(dir, ["checkout", "-q", "-b", "feat/share-framing"]);

  // ── The diff ───────────────────────────────────────────────────────────
  for (const rel of changed) {
    const isShipLog = /ship-log\.md$/.test(rel);
    write(
      dir,
      rel,
      isShipLog
        ? [
            "# Ship log",
            "",
            "| Date | PR | Author | What changed for the user | Deploy |",
            "|---|---|---|---|---|",
            shipLogRow
              ? "| 2026-08-13 | #90 | you | Sharing a draft no longer says Publish | 🚧 staging |"
              : "| — | — | — | *(No entries yet.)* | — |",
            "",
          ].join("\n")
        : `// changed by the fixture\nexport const changed = true;\n`,
    );
  }

  if (bundle) {
    for (const f of ["spec.md", "plan.md", "tasks.md"]) {
      write(
        dir,
        `specs/${bundle}/${f}`,
        bundleGaps
          ? `# ${f}\n\n[NEEDS CLARIFICATION: who decides]\n`
          : `# ${f}\n`,
      );
    }
    write(
      dir,
      `specs/${bundle}/checklists/requirements.md`,
      bundleGaps
        ? "# Requirements\n\n- [ ] Not done\n"
        : "# Requirements\n\n- [x] Done\n",
    );
  }

  return dir;
}

/** Remove a fixture. Safe to call on a path that is already gone. */
export function removeFixture(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}
