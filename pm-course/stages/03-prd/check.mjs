/**
 * Stage 3 checker — reads a PRD against the repo's own template and events.
 *
 *   npm run course -- 3 --file pm-course/my-work/prd.md
 *
 * Nothing here is a house style invented for the course. The required sections
 * are read out of `team-os/templates/prd.md`, and the metrics a PRD is allowed to
 * name are read out of `lib/analytics.ts`. Change the template and this follows;
 * hardcoding either would have made the checker the third place the truth lives.
 *
 * The check that matters most is the one about baselines. `analytics/metrics/`
 * warns that the one baseline available for the in-flight bet comes from
 * `scripts/fixtures/` — a PRD that sets a target against it without saying so has
 * quietly turned a fixture into a commitment, and every downstream argument
 * inherits that.
 */

import {
  citedPaths,
  findSection,
  isPlaceholder,
  isVagueOnly,
  sections,
} from "../../lib/artifact.mjs";
import { exists, read } from "../../lib/repo-facts.mjs";

/** How the template asks an assumption to be labelled. */
const VALIDATION =
  /\b(validated|partially validated|pending validation|unvalidated)\b/i;

/** Numbers that look like a metric baseline or target. */
const FIGURE = /\b\d{1,3}(?:[–-]\d{1,3})?\s?%|\b\d+(?:\.\d+)?\s?(?:x|×)\b/;

const pass = (name, detail) => ({ ok: true, name, detail });
const fail = (name, detail) => ({ ok: false, name, detail });
const note = (name, detail) => ({ ok: null, name, detail });

/** Section headings the repo's own PRD template requires, in its own words. */
export function templateSections(repo) {
  const t = read(repo, "team-os/templates/prd.md");
  if (t === null) return [];
  return [...t.matchAll(/^#\s+(.+)$/gm)]
    .map((m) => m[1].replace(/[:\s]+$/, "").trim())
    .filter((h) => !/^Hand off/i.test(h));
}

/** Event names this product actually emits, from the typed helpers. */
export function knownEvents(repo) {
  const src = read(repo, "lib/analytics.ts") ?? "";
  return [
    ...src.matchAll(/(?:trackPageEvent|logAmplitudeEvent)\("([^"]+)"/g),
  ].map((m) => m[1]);
}

export const KNOWN = [
  {
    id: "seeded-baseline-declared",
    appliesWhen: (text) => FIGURE.test(text),
    verify(repo, text) {
      const metrics = read(
        repo,
        "team-os/analytics/metrics/growth/ai-first-onboarding-metrics.md",
      );
      if (metrics === null) {
        return { holds: true, detail: "no growth metrics file to contradict" };
      }
      // The one figure the repo explicitly flags as coming from a fixture.
      const SEEDED = /92[–-]96\s?%/;
      if (!SEEDED.test(text)) {
        return {
          holds: true,
          detail: "no figure in this PRD is one the repo flags as seeded",
        };
      }
      // Scoped to the section that cites it, not the whole document. The brief
      // asks for the provenance on the line where the number is used, and a
      // caveat six sections away is not something a reader of that line sees.
      const citing = sections(text).filter((sec) => SEEDED.test(sec.body));
      const declared = citing.some((sec) =>
        /seed|fixture|not production|constructed/i.test(sec.body),
      );
      return {
        holds: declared,
        detail: declared
          ? `the 92–96% figure is cited in "${citing[0].heading || "the preamble"}" and its seeded provenance is stated there`
          : `cites the 92–96% baseline in "${citing[0].heading || "the preamble"}" without saying there that it comes from scripts/fixtures/ — the metrics file calls treating it as real the single most likely way to misread this`,
      };
    },
  },
  {
    id: "events-exist-or-are-flagged",
    appliesWhen: (text) => /\bevent\b|Amplitude|track/i.test(text),
    verify(repo, text) {
      const known = knownEvents(repo);
      if (!known.length)
        return { holds: true, detail: "could not read lib/analytics.ts" };
      // Quoted or backticked Title Case strings are how this repo names events.
      const named = [
        ...text.matchAll(/[`"]([A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+){1,4})[`"]/g),
      ].map((m) => m[1]);
      const unknown = [...new Set(named)].filter(
        (n) =>
          !known.includes(n) &&
          /\b(Created|Sent|Opened|Triggered|Published|Shown|Submitted|Skipped|Clicked|Visited|Copied|Changed|Updated|Tested|Archived|Restored|Deleted|Unpublished|In)\b/.test(
            n,
          ),
      );
      const flagged = /\[NEEDS? INSTRUMENTATION/i.test(text);
      return {
        holds: unknown.length === 0 || flagged,
        detail: unknown.length
          ? `names ${unknown.join(", ")}, which lib/analytics.ts does not emit, and carries no [NEEDS INSTRUMENTATION] marker`
          : `every event named exists among the ${known.length} this product emits`,
      };
    },
  },
];

export function check({ text, repo }) {
  const checked = [];
  const secs = sections(text);

  /* ---- 1. The template's own sections ------------------------------- */
  const required = templateSections(repo);
  const missing = required.filter(
    (h) => !findSection(secs, ...h.toLowerCase().split(/\s+/)),
  );
  checked.push(
    !required.length
      ? note("Template", "could not read team-os/templates/prd.md")
      : missing.length
        ? fail(
            "Template sections",
            `missing ${missing.length} of ${required.length} the repo's template requires: ${missing.join("; ")}`,
          )
        : pass("Template sections", `all ${required.length} present`),
  );

  /* ---- 2. Assumptions, each with a validation status ----------------- */
  const assumptions =
    findSection(secs, "key", "assumptions") ?? findSection(secs, "assumptions");
  if (assumptions) {
    // Group by bullet, not by line. An assumption wraps across lines, and reading
    // only the first one made the status invisible the moment prettier re-wrapped
    // the reference — which failed the checker against its own worked example.
    const bullets = assumptions.body
      .split(/\n(?=\s*[-*]\s)/)
      .map((b) => b.trim())
      .filter((b) => /^[-*]\s/.test(b));
    // Strip emphasis before testing. Prettier normalises `*pending validation.*`
    // to `_pending validation._`, and `_` is a word character — so the leading
    // \b never matched and three of four labelled assumptions read as unlabelled.
    // Second time markdown normalisation has broken a checker; both times it
    // failed the reference against itself, which is how it surfaced.
    const labelled = bullets.filter((b) =>
      VALIDATION.test(b.replace(/[_*]/g, "")),
    );
    checked.push(
      bullets.length < 2
        ? fail(
            "Assumptions",
            `${bullets.length} listed — a PRD resting on one assumption is hiding the others`,
          )
        : labelled.length < bullets.length
          ? fail(
              "Assumption status",
              `${bullets.length - labelled.length} of ${bullets.length} carry no validation status. The template asks for validated / partially validated / pending validation`,
            )
          : pass(
              "Assumption status",
              `${bullets.length} assumptions, every one labelled`,
            ),
    );
  }

  /* ---- 3. Cited paths resolve --------------------------------------- */
  const cited = citedPaths(text);
  const broken = cited.filter((p) => !exists(repo, p));
  checked.push(
    !cited.length
      ? fail(
          "Evidence cited",
          "no repo paths at all. A PRD that names no source is an opinion with headings",
        )
      : broken.length
        ? fail(
            "Evidence cited",
            `${broken.length} of ${cited.length} do not exist: ${broken.join(", ")}`,
          )
        : pass("Evidence cited", `${cited.length} of ${cited.length} exist`),
  );

  /* ---- 4. It has to descend from the evidence map -------------------- */
  const grounded =
    /evidence-map|02-evidence/.test(text) ||
    cited.some((p) => p.startsWith("team-os/research/"));
  checked.push(
    grounded
      ? pass(
          "Descends from stage 2",
          "cites the evidence map or the research it rests on",
        )
      : fail(
          "Descends from stage 2",
          "nothing links this back to your evidence map or to team-os/research/. The chain is the course",
        ),
  );

  /* ---- 5. Objectives carry a measurable outcome ---------------------- */
  const objectives = findSection(secs, "objectives");
  if (objectives) {
    checked.push(
      isPlaceholder(objectives.body)
        ? fail("Objectives", "empty")
        : !FIGURE.test(objectives.body) &&
            !/metric|rate|share|per cent|percent/i.test(objectives.body)
          ? fail(
              "Objectives",
              "names no metric. An objective nobody can read out is a wish",
            )
          : pass("Objectives", "names something measurable"),
    );
  }

  /* ---- 6. Experiment design, and whether it can read out ------------- */
  const experiment = findSection(secs, "experiment", "design");
  if (experiment) {
    checked.push(
      isPlaceholder(experiment.body)
        ? fail(
            "Experiment design",
            "empty — say plainly if there is no experiment, and why",
          )
        : isVagueOnly(experiment.body)
          ? fail("Experiment design", "no specifics")
          : pass("Experiment design", "described"),
    );
  }

  /* ---- 7. Re-derived against the repo -------------------------------- */
  const applicable = KNOWN.filter((k) => k.appliesWhen(text));
  if (!applicable.length) {
    checked.push(
      note(
        "Re-derived",
        "nothing here is a claim the checker can settle from the tree",
      ),
    );
  } else {
    for (const k of applicable) {
      const { holds, detail } = k.verify(repo, text);
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
      "Whether the problem is worth solving, or just well described.",
      "Whether the near-term scope is the smallest thing that tests the bet.",
      "Whether an assumption you marked validated is validated by evidence that could have disagreed.",
      "Whether you would abandon this if the experiment read out flat.",
    ],
  };
}

export const meta = {
  stage: 3,
  name: "PRD",
  artifact: "prd.md",
};
