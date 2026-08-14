/**
 * Stage 4 checker — grades a prototype contract against the diff it describes.
 *
 *   node scripts/check.mjs 3 --file ~/noted-work/prototype-contract.md --repo ../noted-main
 *
 * Acts 1 and 2 check a document against the repo as it is. This one checks a
 * document against work the attendee just did, and the failure it exists to catch
 * is specific: an agent asked to describe what it built will describe what it
 * *meant* to build. Files it touched in passing go unmentioned, and a boundary
 * with a hole in it is worse than no boundary, because someone will trust it.
 *
 * So the central check is coverage. Every file in the diff has to be accounted
 * for somewhere in the contract. Not justified — accounted for.
 */

import {
  citedPaths,
  findSection,
  isPlaceholder,
  sections,
} from "../../lib/artifact.mjs";
import { changedFiles, exists, BASE, read } from "../../lib/repo-facts.mjs";

/** Files a contract never needs to mention. Noise, not behavior. */
const IGNORED = [
  /^package-lock\.json$/,
  /^\.env/,
  /^\.DS_Store$/,
  /^node_modules\//,
  /^\.next\//,
  /^team-os\/research\/conversations\//, // read in stage 2, not changed by this one
  // Course scaffolding is not part of anybody's prototype. A learner who fixes a
  // typo in a brief should not have to account for it in their boundary.
  /^pm-course\//,
];

const pass = (name, detail) => ({ ok: true, name, detail });
const fail = (name, detail) => ({ ok: false, name, detail });
const note = (name, detail) => ({ ok: null, name, detail });

/**
 * Claims this checker can settle against the tree rather than take on trust.
 */
export const KNOWN = [
  {
    id: "nothing-persisted-but-convex-changed",
    appliesWhen: (text) =>
      /nothing is (persisted|saved|written)|no document is created|not persisted/i.test(
        text,
      ),
    verify(repo, diff) {
      const convex = diff.filter((f) => f.startsWith("convex/"));
      return {
        holds: convex.length === 0,
        detail: convex.length
          ? `the contract says nothing is persisted, and the diff changes ${convex.join(", ")}`
          : "nothing in the diff touches convex/, so the claim stands",
      };
    },
  },
  {
    id: "design-contract-applies",
    appliesWhen: (_text, diff) =>
      diff.some((f) => /^(components|app)\//.test(f)),
    verify(repo, diff, text) {
      const cited = /DESIGN\.md/.test(text);
      return {
        holds: cited,
        detail: cited
          ? "the contract names DESIGN.md, which constitution §XVI makes binding on anything under components/ or app/"
          : "the diff touches components/ or app/ and the contract never mentions DESIGN.md — §XVI makes it a binding contract, not a style guide",
      };
    },
  },
  {
    id: "no-test-for-new-logic",
    appliesWhen: (_text, diff) =>
      diff.some((f) => /^lib\/.*\.ts$/.test(f) && !/\.test\./.test(f)),
    verify(repo, diff) {
      const logic = diff.filter(
        (f) => /^lib\/.*\.ts$/.test(f) && !/\.test\./.test(f),
      );
      const tests = diff.filter((f) => /\.test\./.test(f));
      return {
        holds: tests.length > 0,
        detail: tests.length
          ? `new logic in ${logic.join(", ")} comes with ${tests.join(", ")}`
          : `${logic.join(", ")} adds extractable logic with no test — the unit-testing skill makes that a requirement, and a prototype is where it is most tempting to skip`,
      };
    },
  },
];

export function check({ text, repo }) {
  const checked = [];
  const secs = sections(text);
  const diff = changedFiles(repo).filter(
    (f) => !IGNORED.some((re) => re.test(f)),
  );

  /* ---- 1. Structure -------------------------------------------------- */
  const wanted = [
    {
      key: "question",
      words: ["learning", "question"],
      label: "The learning question",
    },
    { key: "stop", words: ["stop", "condition"], label: "The stop condition" },
    { key: "real", words: ["real"], label: "What is real" },
    { key: "hardcoded", words: ["hard", "coded"], label: "What is hard-coded" },
    { key: "simulated", words: ["simulated"], label: "What is simulated" },
    {
      key: "unconnected",
      words: ["not", "connected"],
      label: "What is not connected",
    },
    {
      key: "exclusions",
      words: ["did", "not", "build"],
      label: "What I deliberately did not build",
    },
    {
      key: "interrogation",
      words: ["agent"],
      label: "What the agent did not tell me",
    },
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
      : pass("Structure", "all eight sections present"),
  );

  /* ---- 2. A question, and a way to stop ------------------------------ */
  if (found.question) {
    const body = found.question.body.trim();
    checked.push(
      isPlaceholder(body)
        ? fail(
            "Learning question",
            "empty — a prototype with no question is a demo",
          )
        : !body.includes("?")
          ? fail(
              "Learning question",
              "not phrased as a question. If you cannot ask it, you cannot answer it",
            )
          : pass("Learning question", "asked"),
    );
  }

  if (found.stop) {
    checked.push(
      isPlaceholder(found.stop.body)
        ? fail("Stop condition", "empty")
        : /\b(if|when|unless|once)\b/i.test(found.stop.body)
          ? pass("Stop condition", "conditional on a result")
          : fail(
              "Stop condition",
              "names no result that would end this — a date is not a stop condition",
            ),
    );
  }

  /* ---- 3. The four boundaries are all filled -------------------------- */
  const boundaries = [
    ["real", "What is real"],
    ["hardcoded", "What is hard-coded"],
    ["simulated", "What is simulated"],
    ["unconnected", "What is not connected"],
  ];
  const empty = boundaries
    .filter(([k]) => found[k] && isPlaceholder(found[k].body))
    .map(([, l]) => l);
  checked.push(
    empty.length
      ? fail(
          "Four boundaries",
          `${empty.join("; ")} left empty — an empty boundary reads as "none of this applies"`,
        )
      : pass("Four boundaries", "all four described"),
  );

  /* ---- 4. Cited paths resolve ---------------------------------------- */
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
        : fail(
            "Paths cited",
            "no file paths at all — a boundary that names no files cannot be checked by anyone",
          ),
  );

  /* ---- 5. Coverage: does the contract account for the diff? ---------- */
  if (!diff.length) {
    checked.push(
      fail(
        "Covers the diff",
        `nothing has changed since ${BASE} — build the thing before describing it`,
      ),
    );
  } else {
    const mentioned = new Set(cited);
    // A directory in the contract covers the files under it. That is a
    // deliberate loosening with a known cost: a contract saying "I moved them
    // to `lib/`" in passing then covers everything under lib/. The
    // alternative — demanding every file by name — fails honest contracts on
    // wide diffs, and lab diffs are small enough that the loophole is narrow.
    // If it ever bites, tighten this before tightening anything else here.
    const covers = (file) =>
      [...mentioned].some(
        (m) =>
          file === m ||
          (m.endsWith("/") && file.startsWith(m)) ||
          file.startsWith(m + "/"),
      );
    const unaccounted = diff.filter((f) => !covers(f));

    checked.push(
      unaccounted.length
        ? fail(
            "Covers the diff",
            `${unaccounted.length} of ${diff.length} changed files are not mentioned anywhere: ${unaccounted.slice(0, 4).join(", ")}${unaccounted.length > 4 ? ", …" : ""}`,
          )
        : pass(
            "Covers the diff",
            `all ${diff.length} changed files accounted for`,
          ),
    );
  }

  /* ---- 6. Exclusions, and the interrogation --------------------------- */
  if (found.exclusions) {
    checked.push(
      isPlaceholder(found.exclusions.body)
        ? fail(
            "Exclusions",
            "empty — what you left out is the part that makes this a prototype",
          )
        : pass("Exclusions", "named"),
    );
  }

  if (found.interrogation) {
    checked.push(
      isPlaceholder(found.interrogation.body)
        ? fail(
            "Interrogation",
            "empty — this is the section where you compare what the agent said it did against the diff",
          )
        : pass("Interrogation", "written"),
    );
  }

  /* ---- 7. Re-derived claims ------------------------------------------ */
  const applicable = KNOWN.filter((k) => k.appliesWhen(text, diff));
  if (!applicable.length) {
    checked.push(
      note(
        "Re-derived",
        "no claim in this contract is one the checker can settle from the tree",
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
      "Whether the learning question is worth an afternoon, or just answerable.",
      "Whether a thing you called simulated is one a participant would read as real.",
      "Whether the interrogation found the agent's shortcuts, or repeated its summary back.",
      "Whether you would actually stop if the stop condition fired.",
    ],
  };
}

export const meta = {
  stage: 4,
  name: "Prototype contract",
  artifact: "prototype-contract.md",
};

/** Exposed so the test can build a fixture from the same source as the checker. */
export { IGNORED };

/** Read the exemplar noted already ships, for the brief to point at. */
export function exemplar(repo) {
  return read(repo, "team-os/product/prds/growth/prototype-boundary.md");
}
