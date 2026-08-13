/**
 * The questions the seeded cohort was built to answer, without the answers.
 *
 * `scripts/fixtures/cohort-sample-data.json` carries both a `studentQuestion` and
 * an `expectedPattern` for each planted insight. Printing the pattern would hand
 * over the finding, so only the question travels — the point of the stage is
 * querying your own data to answer it.
 */

import fs from "node:fs";
import path from "node:path";

const FIXTURE = "scripts/fixtures/cohort-sample-data.json";

/** `{ name, question }` per planted insight. Never the expected pattern. */
export function cohortQuestions(repo) {
  const file = path.join(repo, FIXTURE);
  if (!fs.existsSync(file)) return [];
  const fixture = JSON.parse(fs.readFileSync(file, "utf8"));
  return (fixture.insights ?? [])
    .filter((i) => i.studentQuestion)
    .map((i) => ({ name: i.name, question: i.studentQuestion }));
}

/**
 * Which of the six evidence sources a question can actually be answered from.
 *
 * Every one of these is answerable from Convex, and three are *also* visible in
 * Amplitude — which is the interesting part, because the Amplitude view looks like
 * independent behavioural evidence and is the same fixture replayed.
 */
export const ANSWERABLE_FROM = {
  chat_to_publish_gap: ["Convex", "Amplitude"],
  power_user_publish_rate: ["Convex", "Amplitude"],
  squad_agent_onboarding_cliff: ["Convex"],
  // Convex only, and that is the finding. This is the pattern behind the
  // top-ranked pain in the landscape, and nothing in Amplitude sees it — there is
  // no publish-intent event, so the behaviour the research cares most about is
  // invisible in the analytics half of the evidence.
  draft_review_pressure: ["Convex"],
};

/** Amplitude events that bear on the cohort questions, from the real helpers. */
export function relevantEvents(repo) {
  const src = path.join(repo, "lib/analytics.ts");
  if (!fs.existsSync(src)) return [];
  const text = fs.readFileSync(src, "utf8");
  const all = [...text.matchAll(/trackPageEvent\("([^"]+)"/g)].map((m) => m[1]);
  return all.filter((e) =>
    /Document|Coworker|Published|Public Link|In-Editor/.test(e),
  );
}

/** Env vars that have to be the learner's own, and what breaks without each. */
export const OWN_CREDENTIALS = [
  [
    "CONVEX_DEPLOYMENT",
    "your own Convex project — the cohort is seeded into it",
  ],
  ["NEXT_PUBLIC_CONVEX_URL", "the same project, read from the browser"],
  ["CLERK_SECRET_KEY", "your own Clerk app; sign-in is per-deployment"],
  ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "the browser half of that app"],
  ["EDGE_STORE_ACCESS_KEY", "your own EdgeStore project — cover images"],
  ["EDGE_STORE_SECRET_KEY", "the server half of it"],
  ["ENCRYPTION_KEY", "encrypts the AI provider key you paste into Settings"],
  [
    "NEXT_PUBLIC_AMPLITUDE_API_KEY",
    "your own Amplitude project, read from the browser",
  ],
  [
    "AMPLITUDE_API_KEY",
    "the same project, used by seed:amplitude to send the cohort",
  ],
];
