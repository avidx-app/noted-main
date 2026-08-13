/**
 * Stage 6 checker — grades a delivery record against the repo's own rules.
 *
 *   node scripts/check.mjs 4 --file ~/noted-work/delivery-record.md --repo ../noted-main
 *
 * The bar is the one this workshop's README already commits to: **does a pull
 * request from that room state what it did not verify?** Everything else here is
 * scaffolding around that question.
 *
 * Two things make this more than a form. Constitution principles cited in the
 * record are checked against the constitution — §XVIII does not exist, and a
 * record that invokes it has invoked a rule nobody wrote. And commands claimed as
 * evidence of a passing gate are checked against `package.json`, because
 * "I ran the tests" is a claim about a script that either exists or does not.
 */

import {
  citedPaths,
  findSection,
  isPlaceholder,
  isVagueOnly,
  sections,
} from "../../lib/artifact.mjs";
import {
  changedFiles,
  constitutionPrinciples,
  currentBranch,
  exists,
  npmScripts,
  BASE,
  read,
  tableRows,
} from "../../lib/repo-facts.mjs";

/** The verdicts `/noted-review` actually emits, plus the BLOCK variant in use. */
const VERDICT =
  /(✅|❌|🛑|⚠️)|\b(ready to merge|block|issues? to fix|approve)\b/i;

const pass = (name, detail) => ({ ok: true, name, detail });
const fail = (name, detail) => ({ ok: false, name, detail });
const note = (name, detail) => ({ ok: null, name, detail });

export const KNOWN = [
  {
    id: "principles-that-exist",
    appliesWhen: (text) => /§\s*[IVXL]+/.test(text),
    verify(repo, _diff, text) {
      const real = constitutionPrinciples(repo);
      const cited = [...text.matchAll(/§\s*([IVXL]+)\b/g)].map((m) => m[1]);
      const unknown = [...new Set(cited)].filter((c) => !real.includes(c));
      return {
        holds: unknown.length === 0,
        detail: unknown.length
          ? `cites §${unknown.join(", §")}, which the constitution does not contain — it has ${real.length} principles, I to ${real[real.length - 1]}`
          : `all ${new Set(cited).size} cited principles exist in the constitution`,
      };
    },
  },
  {
    id: "gate-commands-exist",
    appliesWhen: (text) => /npm run [a-z:]+/.test(text),
    verify(repo, _diff, text) {
      const scripts = npmScripts(repo);
      const cited = [
        ...new Set([...text.matchAll(/npm run ([a-z:]+)/g)].map((m) => m[1])),
      ];
      const unknown = cited.filter((c) => !scripts.includes(c));
      return {
        holds: unknown.length === 0,
        detail: unknown.length
          ? `claims to have run ${unknown.map((c) => `npm run ${c}`).join(", ")}, which package.json does not define`
          : `${cited.length} named command(s) all exist in package.json`,
      };
    },
  },
  {
    id: "ship-log-row-added",
    appliesWhen: (text) => /ship[- ]?log/i.test(text),
    verify(repo, diff) {
      const touched = diff.filter((f) => /ship-log\.md$/.test(f));
      if (!touched.length) {
        return {
          holds: false,
          detail:
            "the record mentions the ship log and the diff does not touch one — the entry is the last step of the slice, not a nice-to-have",
        };
      }
      const rows = tableRows(read(repo, touched[0]) ?? "");
      return {
        holds: rows.length > 0,
        detail: rows.length
          ? `${touched[0]} now has ${rows.length} entr${rows.length === 1 ? "y" : "ies"}`
          : `${touched[0]} was changed but still has no entries`,
      };
    },
  },
  {
    id: "tests-for-new-logic",
    appliesWhen: (_text, diff) =>
      diff.some(
        (f) => /^(lib|convex)\/.*\.tsx?$/.test(f) && !/\.test\./.test(f),
      ),
    verify(repo, diff) {
      const logic = diff.filter(
        (f) => /^(lib|convex)\/.*\.tsx?$/.test(f) && !/\.test\./.test(f),
      );
      const tests = diff.filter((f) => /\.test\./.test(f));
      return {
        holds: tests.length > 0,
        detail: tests.length
          ? `${logic.length} logic file(s) shipped with ${tests.join(", ")}`
          : `${logic.join(", ")} changed with no test in the diff — constitution §IX puts the quality gate before merge`,
      };
    },
  },
];

export function check({ text, repo }) {
  const checked = [];
  const secs = sections(text);
  const diff = changedFiles(repo).filter(
    (f) => !/^package-lock\.json$|^\.env|^pm-course\//.test(f),
  );

  /* ---- 1. Structure -------------------------------------------------- */
  const wanted = [
    { key: "slice", words: ["slice"], label: "The slice" },
    {
      key: "constitution",
      words: ["constitution"],
      label: "Constitution check",
    },
    { key: "verified", words: ["verified"], label: "What I verified, and how" },
    {
      key: "unverified",
      words: ["not", "verify"],
      label: "What I did not verify",
    },
    {
      key: "review",
      words: ["review"],
      label: "The review verdict, and what I did about it",
    },
    { key: "shiplog", words: ["ship", "log"], label: "The ship-log entry" },
    { key: "pr", words: ["pull", "request"], label: "The pull request" },
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
      ? fail("Structure", `missing ${missing.length}: ${missing.join("; ")}`)
      : pass("Structure", "all seven sections present"),
  );

  /* ---- 2. The bar this whole workshop is measured against ------------ */
  if (found.unverified) {
    const body = found.unverified.body;
    checked.push(
      isPlaceholder(body)
        ? fail(
            "What you did not verify",
            'empty. This is the one thing the workshop is assessed on — "everything works" is not a verification record',
          )
        : /\bnothing\b|\bn\/a\b|\ball verified\b/i.test(body.trim())
          ? fail(
              "What you did not verify",
              "claims there is nothing. There is always something — a path you did not exercise, a key you do not have, a browser you did not open",
            )
          : pass("What you did not verify", "stated"),
    );
  }

  /* ---- 3. The slice, and what actually changed ----------------------- */
  if (found.slice) {
    checked.push(
      isPlaceholder(found.slice.body)
        ? fail("The slice", "empty")
        : pass("The slice", "described"),
    );
  }

  checked.push(
    diff.length
      ? pass("Diff", `${diff.length} file(s) changed since ${BASE}`)
      : fail(
          "Diff",
          `nothing has changed since ${BASE} — there is no slice to record`,
        ),
  );

  const branch = currentBranch(repo);
  checked.push(
    !branch
      ? note("Branch", "could not read the current branch")
      : /^(main|staging)$/.test(branch)
        ? fail(
            "Branch",
            `working directly on ${branch} — the flow is feature → staging → main`,
          )
        : pass("Branch", branch),
  );

  /* ---- 4. Cited paths ------------------------------------------------ */
  const cited = citedPaths(text);
  const broken = cited.filter((p) => !exists(repo, p));
  checked.push(
    broken.length
      ? fail(
          "Paths cited",
          `${broken.length} do not exist: ${broken.join(", ")}`,
        )
      : cited.length
        ? pass("Paths cited", `${cited.length} of ${cited.length} exist`)
        : fail("Paths cited", "no file paths — name what you changed"),
  );

  /* ---- 5. Verification, and the review ------------------------------- */
  if (found.verified) {
    checked.push(
      isPlaceholder(found.verified.body)
        ? fail("What you verified", "empty")
        : isVagueOnly(found.verified.body)
          ? fail("What you verified", "no specifics")
          : /npm run|node |visited|clicked|opened/.test(found.verified.body)
            ? pass("What you verified", "names how")
            : fail(
                "What you verified",
                "says what, not how — name the command or the click",
              ),
    );
  }

  if (found.review) {
    const body = found.review.body;
    checked.push(
      isPlaceholder(body)
        ? fail(
            "Review verdict",
            "empty — run /noted-review and paste what it said",
          )
        : !VERDICT.test(body)
          ? fail("Review verdict", "no verdict recorded")
          : /\b(fixed|addressed|left|declined|disagree|deliberately|not fixed)\b/i.test(
                body,
              )
            ? pass("Review verdict", "recorded, with what you did about it")
            : fail(
                "Review verdict",
                "a verdict with no response. A finding you disagree with is a legitimate outcome — say so and why",
              ),
    );
  }

  /* ---- 6. Re-derived ------------------------------------------------- */
  const applicable = KNOWN.filter((k) => k.appliesWhen(text, diff));
  if (!applicable.length) {
    checked.push(
      note(
        "Re-derived",
        "nothing in this record is a claim the checker can settle from the tree",
      ),
    );
  } else {
    for (const k of applicable) {
      const { holds, detail } = k.verify(repo, diff, text);
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
      "Whether the slice is genuinely the smallest thing that delivers value, or the smallest thing you could finish.",
      "Whether your Constitution Check read the principles or pattern-matched the numbers.",
      "Whether the ship-log entry is legible to someone who does not read code.",
      "Whether a reviewer who did not write this would reach the same verdict.",
    ],
  };
}

export const meta = {
  stage: 6,
  name: "Ship",
  artifact: "delivery-record.md",
};
