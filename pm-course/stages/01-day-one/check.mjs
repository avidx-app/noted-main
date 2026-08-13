/**
 * Stage 1 checker — reads an orientation map, and re-derives its claims.
 *
 * Run it through the front door:
 *
 *   npm run course -- 1 --file pm-course/my-work/orientation-map.md
 *
 * What makes this more than a linter: when the map names a contradiction, the
 * checker goes and looks. Every entry in KNOWN below carries a `verify()` that
 * re-derives the claim from the noted tree, so the result is "you said the ship
 * log is empty next to 77 merged PRs; I counted, and it is" rather than "you
 * used the words ship log".
 *
 * Finding a contradiction that is not in KNOWN is a better outcome, not a worse
 * one. Those pass with a note asking a human to confirm, because a checker that
 * only accepts the answers it was told about teaches attendees to guess the
 * teacher rather than read the repo.
 */

import {
  citedPaths,
  findSection,
  isPlaceholder,
  isVagueOnly,
  sections,
} from "../../lib/artifact.mjs";
import {
  exists,
  mergedPrs,
  needMarkers,
  read,
  tableRows,
} from "../../lib/repo-facts.mjs";

/** Trust labels the map is allowed to use. Anything else is a made-up scale. */
const TRUST = ["fact", "interpretation", "unknown"];

/** The three verdicts Act 1 accepts. "Both are right" is the interesting one. */
const VERDICTS = [
  {
    re: /\bboth\b.*\bright\b|\bneither\b.*\bwrong\b|\bthe (gap|disagreement) is the finding\b/i,
    label: "both are right — the gap is the finding",
  },
  {
    re: /\bis (out of date|stale|wrong|inaccurate|incorrect)\b|\bwrong\b/i,
    label: "one document is wrong",
  },
];

/**
 * Contradictions that are really in the pinned tree.
 *
 * Each `verify` returns `{ holds, detail }` derived from the repo, so this list
 * cannot rot silently: if someone repairs one in noted, the check starts failing
 * against the reference solution and we find out.
 */
export const KNOWN = [
  {
    id: "ship-log-empty",
    match: /ship[- ]?log/i,
    verify(repo) {
      const log = read(repo, "team-os/features/ai-features/ship-log.md");
      if (log === null)
        return { holds: false, detail: "ship-log.md not found" };
      const rows = tableRows(log).length;
      const prs = mergedPrs(repo);
      return {
        holds: rows === 0 && (prs ?? 0) > 0,
        detail: `ship log has ${rows} entries; ${prs ?? "?"} pull requests merged in this history`,
      };
    },
  },
  {
    id: "phase-0-mandatory-but-unmet",
    match: /phase ?0|feature[- ]workflow|user grounding|no quote/i,
    verify(repo) {
      const skill = read(repo, ".ai/skills/feature-workflow/SKILL.md");
      if (skill === null)
        return { holds: false, detail: "feature-workflow SKILL.md not found" };
      const mandatory = /MANDATORY|Non-negotiable/.test(skill);
      const needs = needMarkers(skill);
      return {
        holds: mandatory && needs.length > 0,
        detail: `Phase 0 is marked mandatory and still carries ${needs.length} unmet ${needs.length === 1 ? "input" : "inputs"}: ${needs.join(", ")}`,
      };
    },
  },
  {
    id: "primary-metric-seeded",
    match: /seeded|fixture|baseline|92[–-]96|primary metric/i,
    verify(repo) {
      const m = read(
        repo,
        "team-os/analytics/metrics/growth/ai-first-onboarding-metrics.md",
      );
      if (m === null)
        return { holds: false, detail: "growth metrics file not found" };
      const seeded = /Seeded, not production/i.test(m);
      const ceiling = /92[–-]96%/.test(m);
      return {
        holds: seeded && ceiling,
        detail:
          "the primary metric's 92–96% baseline is labelled seeded, and the PRD asks for a 50/50 experiment against it",
      };
    },
  },
  {
    id: "prototype-reads-as-feature",
    match: /prototype|\/documents\/start|in-design|onboarding route/i,
    verify(repo) {
      const route = exists(
        repo,
        "app/(main)/(routes)/documents/start/page.tsx",
      );
      const index = read(repo, "team-os/feature-index.yaml") ?? "";
      const inDesign = /ai-first-onboarding:[\s\S]*?status: in-design/.test(
        index,
      );
      return {
        holds: route && inDesign,
        detail:
          "a reachable route exists at /documents/start while feature-index.yaml records the feature as in-design with nothing shipped",
      };
    },
  },
];

/** One check result. `ok: null` means "recorded, not judged". */
const pass = (name, detail) => ({ ok: true, name, detail });
const fail = (name, detail) => ({ ok: false, name, detail });
const note = (name, detail) => ({ ok: null, name, detail });

/**
 * @param {{ text: string, repo: string }} input
 * @returns {{ checked: Array, unchecked: string[] }}
 */
export function check({ text, repo }) {
  const checked = [];
  const secs = sections(text);

  /* ---- 1. Structure ------------------------------------------------- */
  const wanted = [
    {
      key: "observation",
      words: ["saw", "before"],
      label: "What I saw before I read anything",
    },
    { key: "repo", words: ["repo", "says"], label: "What the repo says it is" },
    {
      key: "contradiction",
      words: ["contradiction"],
      label: "The contradiction",
    },
    {
      key: "undetermined",
      words: ["could", "not", "determine"],
      label: "What I could not determine",
    },
    { key: "next", words: ["check", "next"], label: "What I would check next" },
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
      : pass("Structure", "all five sections present"),
  );

  /* ---- 2. The first-run observation ---------------------------------- */
  if (found.observation) {
    checked.push(
      isPlaceholder(found.observation.body)
        ? fail(
            "First-run observation",
            "still the template — this is the one input nobody else can give you",
          )
        : pass("First-run observation", "written"),
    );
  }

  /* ---- 3. Every cited path resolves ---------------------------------- */
  const cited = citedPaths(text);
  const broken = cited.filter((p) => !exists(repo, p));
  checked.push(
    cited.length === 0
      ? fail(
          "Paths cited",
          "no repo paths cited at all — an orientation map that names no files is a summary",
        )
      : broken.length
        ? fail(
            "Paths cited",
            `${broken.length} of ${cited.length} do not exist: ${broken.join(", ")}`,
          )
        : pass(
            "Paths cited",
            `${cited.length} of ${cited.length} exist in the repo`,
          ),
  );

  /* ---- 4. Trust labels ----------------------------------------------- */
  if (found.repo) {
    const rows = tableRows(found.repo.body);
    const labelled = rows.filter((cells) =>
      cells.some((c) => TRUST.includes(c.toLowerCase().replace(/[^a-z]/g, ""))),
    );
    checked.push(
      rows.length < 3
        ? fail(
            "Repo table",
            `${rows.length} rows — fill at least three of the five questions`,
          )
        : labelled.length < rows.length
          ? fail(
              "Trust labels",
              `${rows.length - labelled.length} of ${rows.length} rows carry no label from ${TRUST.join(" / ")}`,
            )
          : pass("Trust labels", `${rows.length} rows, every one labelled`),
    );
  }

  /* ---- 5. The contradiction, re-derived ------------------------------ */
  if (found.contradiction) {
    const body = found.contradiction.body;
    const paths = citedPaths(body).filter((p) => exists(repo, p));

    checked.push(
      paths.length < 2
        ? fail(
            "Two sources",
            `${paths.length} existing path${paths.length === 1 ? "" : "s"} cited — a contradiction needs two documents that disagree`,
          )
        : pass(
            "Two sources",
            `${paths.slice(0, 2).join(" vs ")}${paths.length > 2 ? ` (+${paths.length - 2} more cited)` : ""}`,
          ),
    );

    // Read the verdict line only. Scanning the whole section lets prose
    // elsewhere satisfy the check, and the blank template — which lists all
    // three options on one line — passed until this was narrowed.
    const line =
      /^.*\*\*verdict:?\*\*.*$|^verdict:.*$/im.exec(body)?.[0] ?? null;
    const matched = line ? VERDICTS.filter((v) => v.re.test(line)) : [];
    checked.push(
      line === null
        ? fail("Verdict", "no **Verdict:** line")
        : matched.length > 1
          ? fail("Verdict", "the options are still all three — pick one")
          : matched.length === 1
            ? pass("Verdict", matched[0].label)
            : fail(
                "Verdict",
                "a verdict line, but not one of: A is wrong / B is wrong / both are right",
              ),
    );

    const hits = KNOWN.filter((k) => k.match.test(body));
    if (!hits.length) {
      checked.push(
        note(
          "Contradiction",
          `not one of the ${KNOWN.length} this checker knows about — that may well mean you found a new one. A human has to confirm it.`,
        ),
      );
    } else {
      for (const k of hits) {
        const { holds, detail } = k.verify(repo);
        checked.push(
          holds
            ? pass(
                `Re-derived · ${k.id}`,
                detail + (k.note ? ` — ${k.note}` : ""),
              )
            : fail(
                `Re-derived · ${k.id}`,
                `does not hold against this tree: ${detail}`,
              ),
        );
      }
    }
  }

  /* ---- 6. An honest gap ---------------------------------------------- */
  if (found.undetermined) {
    checked.push(
      isPlaceholder(found.undetermined.body)
        ? fail(
            "Undetermined",
            "empty — every question the repo cannot answer is a finding, so name one",
          )
        : pass("Undetermined", "named"),
    );
  }

  /* ---- 7. A next step that names evidence ----------------------------- */
  if (found.next) {
    checked.push(
      isPlaceholder(found.next.body)
        ? fail("Next check", "empty")
        : isVagueOnly(found.next.body)
          ? fail(
              "Next check",
              "names no specific evidence — 'talk to more users' is not a next step",
            )
          : pass("Next check", "names something specific"),
    );
  }

  return {
    checked,
    unchecked: [
      "Whether the moment in section 1 is genuinely yours, or one you read about first.",
      "Whether the contradiction you named is the most useful one available.",
      "Whether your trust labels are honest — a script can see the word 'fact', not whether it is one.",
      "Whether the next check you named would actually change a decision.",
    ],
  };
}

export const meta = {
  stage: 1,
  name: "Day one",
  artifact: "orientation-map.md",
};
