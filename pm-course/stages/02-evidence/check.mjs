/**
 * Stage 2 checker — reads an evidence map, and checks the two things that matter.
 *
 *   npm run course -- 2 --file ~/noted-work/evidence-map.md --repo ../noted-main
 *
 * Stage 1 asks whether the cited files exist. Stage 2 asks something harder and more
 * mechanical than it sounds:
 *
 *   1. Did you consult the source that settles the claim? For the claim this act
 *      is built around, that source is the code, and a map that never opens it
 *      has run six searches and learned nothing decisive.
 *   2. Are the sources you called independent actually independent? noted says in
 *      its own files which parts were authored together. A map claiming
 *      corroboration between two of them is claiming one source twice.
 *
 * Both are re-derived from the tree. Nothing here matches on keywords alone.
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
  isConstructed,
  mergedPr,
  read,
  tableRows,
} from "../../lib/repo-facts.mjs";

/** The five kinds of knowing, from the deck. */
const KINDS = ["fact", "interpretation", "contradiction", "unknown"];

/** The six decision verbs. Discovery that ends in a summary has not ended. */
const VERBS = ["proceed", "revise", "narrow", "pivot", "stop", "investigate"];

/** Cells that claim a source could have contradicted the others. */
const CLAIMS_INDEPENDENT = /^(yes|y|independent|could have)/i;

/**
 * What this repo can settle for you, re-derived rather than recognized.
 *
 * `match` decides whether the map is talking about it; `verify` goes and looks.
 */
export const KNOWN = [
  {
    id: "unauthenticated-read-already-works",
    match:
      /unauth|(needs?|requires?|without) an account|not authenticated|no identity|getById|public (read|preview)|anonymous/i,
    verify(repo) {
      const src = read(repo, "convex/documents.ts");
      if (src === null)
        return { holds: false, detail: "convex/documents.ts not found" };
      const q = /export const getById[\s\S]*?\n\}\);/.exec(src)?.[0] ?? "";
      const idx = q.indexOf("isPublished");
      const auth = q.indexOf("Not authenticated");
      return {
        holds: idx !== -1 && auth !== -1 && idx < auth,
        detail:
          "getById returns a published, non-archived document before it checks for an identity — an unauthenticated reader can already open one, and app/(public)/(routes)/preview/[documentId]/ is that path in production",
      };
    },
  },
  {
    id: "no-sharing-granularity",
    match:
      /granular|one person|single reviewer|shares table|schema|per-recipient|comment/i,
    verify(repo) {
      const src = read(repo, "convex/schema.ts");
      if (src === null)
        return { holds: false, detail: "convex/schema.ts not found" };
      const hasBoolean = /isPublished:\s*v\.boolean\(\)/.test(src);
      const hasShares =
        /^\s+(shares|comments|documentShares):\s*defineTable/m.test(src);
      return {
        holds: hasBoolean && !hasShares,
        detail:
          "documents carries one sharing field, isPublished: v.boolean(), and there is no shares or comments table — so the real gap is per-recipient granularity and comments, not authentication",
      };
    },
  },
  {
    id: "ticket-done-pr-never-merged",
    match: /NOT-152|#79|closed unmerged|never merged|merge history/i,
    verify(repo) {
      const issue = read(
        repo,
        "team-os/research/conversations/linear/NOT-152-ai-first-onboarding-prototype.md",
      );
      if (issue === null) return { holds: false, detail: "NOT-152 not found" };
      const done = /status:\s*Done/i.test(issue);
      const merged = mergedPr(repo, 79);
      return {
        holds: done && !merged,
        detail:
          "NOT-152 records status: Done; pull request #79 never appears as a merge commit in this history",
      };
    },
  },
  {
    id: "quote-changed-shape-in-the-relay",
    match: /Mia|quote|relay|too final|state change|reformulat/i,
    verify(repo) {
      const t = read(
        repo,
        "team-os/research/interviews/2026-04-08-mia-publish-friction-draft-review-gap.md",
      );
      const s = read(
        repo,
        "team-os/research/conversations/slack/2026-04-14-customer-love-mia-again.md",
      );
      if (t === null || s === null)
        return { holds: false, detail: "transcript or relay thread not found" };
      return {
        holds: /too final/i.test(t) && /without making it public/i.test(s),
        detail:
          'the transcript has Mia saying she can send a link to one person and that publish "feels too final"; the relay records "cannot share a draft with a single reviewer without making it public" — a different claim, and the one that reached the PRD',
      };
    },
  },
  {
    id: "decision-never-reached-the-artifact",
    match:
      /pain-landscape|NEED|unrecorded|not written down|never reached|sequencing/i,
    verify(repo) {
      const pl = read(repo, "team-os/research/pain-landscape.md");
      const th = read(
        repo,
        "team-os/research/conversations/slack/2026-05-06-product-closing-not-141.md",
      );
      if (pl === null || th === null)
        return {
          holds: false,
          detail: "pain landscape or closing thread not found",
        };
      return {
        holds: /\[NEED: decision recorded/i.test(pl) && th.length > 0,
        detail:
          "pain-landscape.md still carries [NEED: decision recorded on why onboarding precedes draft review] while the 6 May thread contains the reason",
      };
    },
  },
];

const pass = (name, detail) => ({ ok: true, name, detail });
const fail = (name, detail) => ({ ok: false, name, detail });
const note = (name, detail) => ({ ok: null, name, detail });

/** Paths in the map that are code, i.e. the part nobody authored to agree. */
function codePaths(paths) {
  return paths.filter((p) => /^(convex|lib|app|components|hooks)\//.test(p));
}

export function check({ text, repo }) {
  const checked = [];
  const secs = sections(text);

  /* ---- 1. Structure ------------------------------------------------- */
  const wanted = [
    { key: "claim", words: ["claim"], label: "The claim I am testing" },
    {
      key: "falsify",
      words: ["change", "mind"],
      label: "What would change my mind",
    },
    { key: "evidence", words: ["evidence"], label: "The evidence" },
    {
      key: "contradictions",
      words: ["contradiction"],
      label: "Contradictions I am keeping",
    },
    {
      key: "unknown",
      words: ["could", "not", "answer"],
      label: "What I could not answer",
    },
    { key: "priority", words: ["priority"], label: "Priority" },
    { key: "decision", words: ["decision"], label: "The decision" },
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

  /* ---- 2. A claim, and a way to be wrong ----------------------------- */
  if (found.claim) {
    checked.push(
      isPlaceholder(found.claim.body)
        ? fail("Claim", "empty")
        : found.claim.body.trim().endsWith("?")
          ? fail(
              "Claim",
              "that is a question — a claim is something that can turn out to be false",
            )
          : pass("Claim", "stated"),
    );
  }

  if (found.falsify) {
    checked.push(
      isPlaceholder(found.falsify.body)
        ? fail(
            "Falsification",
            "empty — without this you will search until you find agreement",
          )
        : isVagueOnly(found.falsify.body)
          ? fail("Falsification", "names no specific evidence")
          : pass("Falsification", "names what would break the claim"),
    );
  }

  /* ---- 3. The evidence table ---------------------------------------- */
  const allPaths = citedPaths(text);
  const broken = allPaths.filter((p) => !exists(repo, p));
  checked.push(
    broken.length
      ? fail(
          "Paths cited",
          `${broken.length} of ${allPaths.length} do not exist: ${broken.join(", ")}`,
        )
      : pass(
          "Paths cited",
          `${allPaths.length} of ${allPaths.length} exist in the repo`,
        ),
  );

  if (found.evidence) {
    const rows = tableRows(found.evidence.body);
    checked.push(
      rows.length < 4
        ? fail(
            "Sources",
            `${rows.length} rows — the exercise is one claim across at least four sources`,
          )
        : pass("Sources", `${rows.length} sources`),
    );

    // Match a kind as a word, not as the whole cell. "fact (about what she
    // said)" is a *better* label than "fact" — it separates "she said this"
    // from "this is true" — and an exact-match check failed it, which would
    // train people to drop the qualifier.
    const kindRe = new RegExp(`\\b(${KINDS.join("|")})\\b`, "i");
    const unlabelled = rows.filter(
      (cells) => !cells.some((c) => kindRe.test(c)),
    );
    checked.push(
      rows.length && unlabelled.length
        ? fail(
            "Kind labels",
            `${unlabelled.length} of ${rows.length} rows carry no label from ${KINDS.join(" / ")}`,
          )
        : rows.length
          ? pass("Kind labels", `${rows.length} rows, every one labeled`)
          : note("Kind labels", "no rows to label"),
    );

    /* ---- 4. Independence, which is the point of the act ------------ */
    const overclaimed = [];
    let judged = 0;
    for (const cells of rows) {
      const claimsIndependent = cells.some((c) =>
        CLAIMS_INDEPENDENT.test(c.trim()),
      );
      const paths = citedPaths(cells.join(" | ")).filter((p) =>
        exists(repo, p),
      );
      if (!paths.length) continue;
      judged++;
      if (claimsIndependent && paths.every(isConstructed)) {
        overclaimed.push(paths[0]);
      }
    }

    checked.push(
      judged === 0
        ? fail(
            "Independence",
            "no row cites a path, so nothing can be checked — name the file each source is",
          )
        : overclaimed.length
          ? fail(
              "Independence",
              `${overclaimed.length} row(s) claim a source could have disagreed when noted says it was authored with the others: ${overclaimed.join(", ")}`,
            )
          : pass("Independence", `${judged} rows judged, none overclaimed`),
    );

    /* ---- 5. Did you open the code? --------------------------------- */
    const code = codePaths(allPaths);
    checked.push(
      code.length
        ? pass("Consulted the code", code.slice(0, 2).join(", "))
        : fail(
            "Consulted the code",
            "no path under convex/, lib/, app/ or components/ — the code is the only source here that was not authored to agree, and for this claim it is the one that settles it",
          ),
    );
  }

  /* ---- 6. Contradictions kept, not averaged -------------------------- */
  if (found.contradictions) {
    const paths = citedPaths(found.contradictions.body).filter((p) =>
      exists(repo, p),
    );
    checked.push(
      isPlaceholder(found.contradictions.body)
        ? fail(
            "Contradictions",
            "empty — if six sources all agreed, one of them is not a source",
          )
        : paths.length < 2
          ? fail(
              "Contradictions",
              `${paths.length} existing path(s) — name both sides`,
            )
          : pass("Contradictions", `${paths.slice(0, 2).join(" vs ")}`),
    );

    const hits = KNOWN.filter((k) => k.match.test(found.contradictions.body));
    if (!hits.length) {
      checked.push(
        note(
          "Re-derived",
          `nothing here matches the ${KNOWN.length} this checker can settle — that may mean you found something better. A human has to confirm it.`,
        ),
      );
    } else {
      for (const k of hits) {
        const { holds, detail } = k.verify(repo);
        checked.push(
          holds
            ? pass(`Re-derived · ${k.id}`, detail)
            : fail(
                `Re-derived · ${k.id}`,
                `does not hold against this tree: ${detail}`,
              ),
        );
      }
    }
  }

  /* ---- 7. An honest gap ---------------------------------------------- */
  if (found.unknown) {
    checked.push(
      isPlaceholder(found.unknown.body)
        ? fail(
            "Unknowns",
            "empty — name what the evidence cannot answer rather than filling it",
          )
        : pass("Unknowns", "named"),
    );
  }

  /* ---- 8. Priority, scored ------------------------------------------- */
  if (found.priority) {
    const rows = tableRows(found.priority.body);
    const scored = rows.filter(
      (cells) => cells.filter((c) => /^[1-5]$/.test(c.trim())).length >= 2,
    );
    checked.push(
      scored.length < 2
        ? fail(
            "Priority",
            `${scored.length} row(s) scored — score at least two assumptions on uncertainty and consequence, 1 to 5`,
          )
        : pass("Priority", `${scored.length} assumptions scored`),
    );
  }

  /* ---- 9. A verb, and something that changes ------------------------- */
  if (found.decision) {
    const body = found.decision.body.toLowerCase();
    const verbs = VERBS.filter((v) => new RegExp(`\\b${v}\\b`).test(body));
    checked.push(
      verbs.length === 0
        ? fail("Decision verb", `none of ${VERBS.join(" / ")}`)
        : verbs.length > 2
          ? fail(
              "Decision verb",
              `${verbs.length} verbs mentioned — decide which one it is`,
            )
          : pass("Decision verb", verbs.join(" / ")),
    );

    const targets = citedPaths(found.decision.body).filter((p) =>
      exists(repo, p),
    );
    checked.push(
      targets.length
        ? pass("Artifact to update", targets[0])
        : fail(
            "Artifact to update",
            "no existing file named — a decision without an update leaves the next person to reconstruct it from chat",
          ),
    );

    if (/\binvestigate\b/.test(body)) {
      checked.push(
        /\?|missing|would tell us|do not know|unknown/.test(body)
          ? pass("Investigate qualifies", "names the missing evidence")
          : fail(
              "Investigate qualifies",
              "investigate only counts when you name the missing evidence and the decision it blocks",
            ),
      );
    }
  }

  return {
    checked,
    unchecked: [
      "Whether the claim you chose is the one worth testing, or the one easiest to answer.",
      "Whether you wrote the falsification before you searched, or after you knew the answer.",
      "Whether a contradiction you kept is genuinely irreconcilable, or you stopped reading too early.",
      "Whether the decision follows from the evidence, or from what you wanted to do on Monday.",
    ],
  };
}

export const meta = {
  stage: 2,
  name: "Evidence",
  artifact: "evidence-map.md",
};
