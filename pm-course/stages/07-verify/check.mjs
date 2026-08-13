/**
 * Stage 7 checker — the last stage, and the narrowest bar in the course.
 *
 *   npm run course -- 7 --file pm-course/my-work/verification-record.md
 *
 * Everything before this produced a document. This one asks whether the thing you
 * shipped actually works, in two places that behave differently: your machine, and
 * a real deploy where the environment variables are somebody else's problem and the
 * free tier spins down after fifteen minutes.
 *
 * The bar is one question, and it is the only thing in this course worth checking
 * four weeks later: **does the record say what you did not verify?** Empty fails.
 * "Nothing" fails, because that is the plausible answer rather than the true one.
 */

import {
  citedPaths,
  findSection,
  isPlaceholder,
  isVagueOnly,
  sections,
} from "../../lib/artifact.mjs";
import { exists, mergedPr, npmScripts, read } from "../../lib/repo-facts.mjs";

/** A URL that looks like a Render deploy rather than localhost. */
const DEPLOY_URL =
  /https?:\/\/[a-z0-9-]+\.onrender\.com\b|https?:\/\/(?!localhost)[a-z0-9.-]+\.[a-z]{2,}/i;

const pass = (name, detail) => ({ ok: true, name, detail });
const fail = (name, detail) => ({ ok: false, name, detail });
const note = (name, detail) => ({ ok: null, name, detail });

export const KNOWN = [
  {
    id: "gate-commands-exist",
    appliesWhen: (text) => /npm run [a-z:]+/.test(text),
    verify(repo, text) {
      const scripts = npmScripts(repo);
      const cited = [
        ...new Set([...text.matchAll(/npm run ([a-z:]+)/g)].map((m) => m[1])),
      ];
      const unknown = cited.filter((c) => !scripts.includes(c));
      return {
        holds: unknown.length === 0,
        detail: unknown.length
          ? `claims to have run ${unknown.map((c) => `npm run ${c}`).join(", ")}, which package.json does not define`
          : `${cited.length} named command(s) all exist`,
      };
    },
  },
  {
    id: "the-pr-actually-merged",
    appliesWhen: (text) => /#\d{1,4}\b/.test(text),
    verify(repo, text) {
      const nums = [
        ...new Set([...text.matchAll(/#(\d{1,4})\b/g)].map((m) => m[1])),
      ];
      const claimedMerged = /merged/i.test(text);
      const merged = nums.filter((n) => mergedPr(repo, n));
      if (!claimedMerged) {
        return {
          holds: true,
          detail: `references ${nums.map((n) => `#${n}`).join(", ")} without claiming a merge`,
        };
      }
      return {
        holds: merged.length > 0,
        detail: merged.length
          ? `#${merged.join(", #")} appears as a merge commit in this history`
          : `says merged, and none of ${nums.map((n) => `#${n}`).join(", ")} appears as a merge commit here. Fetch the branch you merged into, or say it is still open`,
      };
    },
  },
  {
    id: "smoke-diff-was-run",
    appliesWhen: (text) => /smoke/i.test(text),
    verify(repo, text) {
      const has = exists(repo, "scripts/smoke-diff.mjs");
      if (!has)
        return { holds: true, detail: "this tree has no smoke-diff to run" };
      const probed = /probe/i.test(text);
      return {
        holds: probed,
        detail: probed
          ? "mentions the probe, not just the command"
          : "mentions smoke-diff without mentioning a probe. `run` with no probe reports that the gates are green and nothing has been shown to work",
      };
    },
  },
];

export function check({ text, repo }) {
  const checked = [];
  const secs = sections(text);

  /* ---- 1. Structure -------------------------------------------------- */
  const wanted = [
    { key: "shipped", words: ["what", "shipped"], label: "What shipped" },
    { key: "local", words: ["locally"], label: "Verified locally" },
    { key: "staging", words: ["staging"], label: "Verified on staging" },
    {
      key: "unverified",
      words: ["not", "verify"],
      label: "What I did not verify",
    },
    { key: "next", words: ["watch"], label: "What I will watch" },
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

  /* ---- 2. The bar ---------------------------------------------------- */
  if (found.unverified) {
    const body = found.unverified.body;
    checked.push(
      isPlaceholder(body)
        ? fail(
            "What you did not verify",
            "empty. This is the one thing the course is assessed on, and it is the last chance to write it",
          )
        : /^\s*(nothing|n\/a|none|all verified)\b/i.test(body.trim())
          ? fail(
              "What you did not verify",
              "claims there is nothing. There is always something — a browser you did not open, a state you could not reach, a user who is not you",
            )
          : pass("What you did not verify", "stated"),
    );
  }

  /* ---- 3. Two environments, and they are different ------------------- */
  if (found.local) {
    checked.push(
      isPlaceholder(found.local.body)
        ? fail("Verified locally", "empty")
        : isVagueOnly(found.local.body) ||
            !/npm run|clicked|opened|signed in|created/i.test(found.local.body)
          ? fail(
              "Verified locally",
              "says what, not how — name the command or the click",
            )
          : pass("Verified locally", "names how"),
    );
  }

  if (found.staging) {
    const body = found.staging.body;
    // The URL is a fact about the whole record and the header is its natural
    // home, so accept it anywhere. What has to be in this section is the doing.
    const hasUrl = DEPLOY_URL.test(text);
    checked.push(
      isPlaceholder(body)
        ? fail(
            "Verified on staging",
            "empty. A change that works on your machine and nowhere else has not shipped",
          )
        : !hasUrl
          ? fail(
              "Verified on staging",
              "no deploy URL. Name the address you actually opened — localhost does not count here",
            )
          : pass("Verified on staging", "names a deployed URL"),
    );

    // The point of two environments is that they differ. A record where both
    // behaved identically has usually only checked one of them.
    checked.push(
      /differ|different|did not|failed|missing|slower|cold start|spun down|env|environment variable/i.test(
        body,
      )
        ? pass(
            "Staging is not local",
            "notices something the local run did not show",
          )
        : note(
            "Staging is not local",
            "reports staging behaving exactly like local. Sometimes true — and worth a second look, since the env vars, the cold start and the data are all different",
          ),
    );
  }

  /* ---- 4. Cited paths ------------------------------------------------ */
  // A probe is deleted by `npm run smoke -- clean`, which is the documented end of
  // that workflow. So a record citing one is citing a file that correctly no
  // longer exists, and failing it would punish having followed the command.
  const cited = citedPaths(text).filter(
    (p) => !p.includes(".smoke-diff.test."),
  );
  const broken = cited.filter((p) => !exists(repo, p));
  checked.push(
    broken.length
      ? fail(
          "Paths cited",
          `${broken.length} do not exist: ${broken.join(", ")}`,
        )
      : cited.length
        ? pass("Paths cited", `${cited.length} of ${cited.length} exist`)
        : note(
            "Paths cited",
            "no file paths — acceptable here, since this stage is about behaviour",
          ),
  );

  /* ---- 5. What happens next ------------------------------------------ */
  if (found.next) {
    checked.push(
      isPlaceholder(found.next.body)
        ? fail(
            "What you will watch",
            "empty — a release nobody watches is a release nobody learns from",
          )
        : isVagueOnly(found.next.body)
          ? fail("What you will watch", "names no signal")
          : pass("What you will watch", "names a signal"),
    );
  }

  /* ---- 6. Re-derived ------------------------------------------------- */
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
      "Whether you verified the behaviour the PRD cared about, or the behaviour that was easy to check.",
      "Whether a signal you named will actually move if the bet is right.",
      "Whether the thing you did not verify is the thing most likely to be broken.",
      "Whether, four weeks from now, this record would let somebody else pick the work up.",
    ],
  };
}

export const meta = {
  stage: 7,
  name: "Verify",
  artifact: "verification-record.md",
};
