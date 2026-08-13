/**
 * Stage 5 checker — reads a spec record, and checks the bundle it describes.
 *
 *   npm run course -- 5 --file pm-course/my-work/spec-record.md
 *
 * The artifact here is unusual: the real output is a directory under `specs/`, and
 * `spec-record.md` is your account of producing it. So this checker looks at both,
 * and the bundle is what it trusts.
 *
 * The shape it requires is read from the one completed bundle this repo already
 * has, `specs/EXP-1-in-editor-ai-triggered/` — not from a list written here. That
 * bundle exists because the pipeline had never once run to completion, and it is
 * the only honest answer to "what does finished look like".
 */

import {
  citedPaths,
  findSection,
  isPlaceholder,
  sections,
} from "../../lib/artifact.mjs";
import { exists, read } from "../../lib/repo-facts.mjs";
import fs from "node:fs";
import path from "node:path";

/** The bundle the repo ships as its worked example. */
const EXEMPLAR = "specs/EXP-1-in-editor-ai-triggered";

const pass = (name, detail) => ({ ok: true, name, detail });
const fail = (name, detail) => ({ ok: false, name, detail });
const note = (name, detail) => ({ ok: null, name, detail });

/** Files the exemplar bundle contains, so the requirement is not invented here. */
export function exemplarFiles(repo) {
  const dir = path.join(repo, EXEMPLAR);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const walk = (d, prefix = "") => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(path.join(d, e.name), `${prefix}${e.name}/`);
      else if (e.name.endsWith(".md")) out.push(`${prefix}${e.name}`);
    }
  };
  walk(dir);
  return out.sort();
}

/** Spec bundles in the tree, excluding the exemplar. */
export function learnerBundles(repo) {
  const dir = path.join(repo, "specs");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && `specs/${e.name}` !== EXEMPLAR)
    .map((e) => `specs/${e.name}`);
}

export const KNOWN = [
  {
    id: "no-unresolved-clarifications",
    appliesWhen: (_text, bundles) => bundles.length > 0,
    verify(repo, _text, bundles) {
      const offenders = [];
      for (const b of bundles) {
        for (const f of exemplarFiles(repo)) {
          const src = read(repo, `${b}/${f}`);
          if (src && /\[NEEDS? CLARIFICATION/i.test(src))
            offenders.push(`${b}/${f}`);
        }
      }
      return {
        holds: offenders.length === 0,
        detail: offenders.length
          ? `${offenders.join(", ")} still carries [NEEDS CLARIFICATION] — /speckit.clarify exists so the spec does not reach implement with open questions`
          : "no [NEEDS CLARIFICATION] markers left in the bundle",
      };
    },
  },
  {
    id: "checklist-actually-ticked",
    appliesWhen: (_text, bundles) => bundles.length > 0,
    verify(repo, _text, bundles) {
      for (const b of bundles) {
        const src = read(repo, `${b}/checklists/requirements.md`);
        if (src === null) continue;
        const boxes = [...src.matchAll(/^\s*-\s*\[( |x|X)\]/gm)];
        const ticked = boxes.filter((m) => m[1].toLowerCase() === "x").length;
        if (!boxes.length) continue;
        return {
          holds: ticked > 0,
          detail:
            ticked > 0
              ? `${b}/checklists/requirements.md has ${ticked} of ${boxes.length} boxes ticked`
              : `${b}/checklists/requirements.md has ${boxes.length} boxes and none ticked — a gate nobody passed is not a gate`,
        };
      }
      return {
        holds: true,
        detail: "no requirements checklist in the bundle to check",
      };
    },
  },
];

export function check({ text, repo }) {
  const checked = [];
  const secs = sections(text);
  const bundles = learnerBundles(repo);
  const required = exemplarFiles(repo);

  /* ---- 1. There is a bundle ------------------------------------------ */
  checked.push(
    !bundles.length
      ? fail(
          "The bundle",
          `nothing under specs/ except ${EXEMPLAR}. Run /speckit.specify and the chain after it — this stage grades a bundle, so it cannot pass before one exists`,
        )
      : bundles.length > 1
        ? note(
            "The bundle",
            `${bundles.length} found: ${bundles.join(", ")} — checking all of them`,
          )
        : pass("The bundle", bundles[0]),
  );

  /* ---- 2. It has the shape the exemplar has -------------------------- */
  if (bundles.length && required.length) {
    for (const b of bundles) {
      const absent = required.filter((f) => !exists(repo, `${b}/${f}`));
      checked.push(
        absent.length
          ? fail(
              `Shape · ${b}`,
              `missing ${absent.join(", ")} — ${EXEMPLAR} has ${required.length} file(s) and is the only finished bundle here`,
            )
          : pass(`Shape · ${b}`, `all ${required.length} file(s) present`),
      );
    }
  }

  /* ---- 3. The record itself ------------------------------------------ */
  const wanted = [
    { key: "slice", words: ["slice"], label: "The slice this spec covers" },
    // These match the headings in this stage's own template. They did not, at
    // first — "grounding" and "clarified" appear nowhere in it — which would have
    // failed every learner on a structure check the brief told them to satisfy.
    {
      key: "phase0",
      words: ["phase", "0"],
      label: "How Phase 0 was satisfied",
    },
    {
      key: "clarified",
      words: ["clarify", "changed"],
      label: "What clarify changed",
    },
    {
      key: "constitution",
      words: ["constitution"],
      label: "Constitution check",
    },
    { key: "open", words: ["still", "open"], label: "What is still open" },
  ];
  const found = {};
  const missing = [];
  for (const w of wanted) {
    const s = findSection(secs, ...w.words);
    if (s) found[w.key] = s;
    else missing.push(w.label);
  }
  checked.push(
    missing.length
      ? fail(
          "Record structure",
          `missing ${missing.length}: ${missing.join("; ")}`,
        )
      : pass("Record structure", "all five sections present"),
  );

  /* ---- 4. Phase 0 was satisfied, not skipped ------------------------- */
  if (found.phase0) {
    const body = found.phase0.body;
    const paths = citedPaths(body).filter((p) => exists(repo, p));
    checked.push(
      isPlaceholder(body)
        ? fail(
            "Phase 0 grounding",
            "empty — feature-workflow will not start without it, so say how you satisfied it",
          )
        : !paths.length
          ? fail(
              "Phase 0 grounding",
              "cites no existing file. Phase 0 wants a persona, a pain and a quote from a transcript, each with a path",
            )
          : pass("Phase 0 grounding", paths.slice(0, 2).join(", ")),
    );
    checked.push(
      /construct|provenance|not real|simulat/i.test(body)
        ? pass("Provenance stated", "says what the grounding rests on")
        : fail(
            "Provenance stated",
            "the research here is constructed, and a spec grounded on it has to say so. See pm-course/onboarding/what-is-real.md",
          ),
    );
  }

  /* ---- 5. Clarify did something -------------------------------------- */
  if (found.clarified) {
    checked.push(
      isPlaceholder(found.clarified.body)
        ? fail("What clarify changed", "empty")
        : // Anchored, because a section arguing *against* answering "nothing"
          // contains the word and should not be failed for it.
          /^\s*(nothing|n\/a|none|no change)\b/i.test(
              found.clarified.body.trim(),
            )
          ? fail(
              "What clarify changed",
              "claims nothing changed. A spec written without a single open question was written by somebody who was not looking",
            )
          : pass("What clarify changed", "recorded"),
    );
  }

  /* ---- 6. Still open ------------------------------------------------- */
  if (found.open) {
    checked.push(
      isPlaceholder(found.open.body)
        ? fail("Still open", "empty — name what the spec does not settle")
        : pass("Still open", "named"),
    );
  }

  /* ---- 7. Re-derived from the bundle --------------------------------- */
  const applicable = KNOWN.filter((k) => k.appliesWhen(text, bundles));
  if (!applicable.length) {
    checked.push(note("Re-derived", "no bundle to check yet"));
  } else {
    for (const k of applicable) {
      const { holds, detail } = k.verify(repo, text, bundles);
      checked.push(
        holds
          ? pass(`Re-derived · ${k.id}`, detail)
          : fail(`Re-derived · ${k.id}`, detail),
      );
    }
  }

  return {
    checked,
    unchecked: [
      "Whether the spec describes the slice your PRD argued for, or a different one that was easier.",
      "Whether the success criteria could be read out by somebody who did not write them.",
      "Whether a ticked checklist box was ticked because the requirement is met.",
      "Whether the tasks are ordered so that stopping halfway leaves something coherent.",
    ],
  };
}

export const meta = {
  stage: 5,
  name: "Spec",
  artifact: "spec-record.md",
};
