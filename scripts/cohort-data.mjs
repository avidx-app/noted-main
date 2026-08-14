#!/usr/bin/env node
/**
 * cohort-data — what your seeded data says, and the questions it was built for.
 *
 *   npm run data              summary from your Convex, plus the questions
 *   npm run data -- --check   just verify the setup, no queries
 *
 * The cohort in `scripts/fixtures/` was generated to plant specific patterns, and
 * each one ships with the question a new PM should be able to answer from it. This
 * prints the questions and the raw counts. It does not print the answers — those
 * are in the fixture and reading them instead of querying defeats the exercise.
 *
 * Everything it touches is yours: your Convex deployment, your Amplitude project.
 * There is no shared instance, deliberately. Forty people's fixtures in one
 * project makes every funnel meaningless, and a shared key is a key to rotate.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  ANSWERABLE_FROM,
  cohortQuestions,
  OWN_CREDENTIALS,
  relevantEvents,
} from "../pm-course/lib/cohort-questions.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const checkOnly = process.argv.includes("--check");

const G = "\x1b[32m",
  R = "\x1b[31m",
  D = "\x1b[2m",
  Y = "\x1b[33m",
  B = "\x1b[1m",
  O = "\x1b[0m";

/** Read .env.local without a dependency. Values are never printed. */
function env() {
  const file = path.join(repoRoot, ".env.local");
  const out = { ...process.env };
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}

/** Is this value real, or still the placeholder from .env.example? */
function looksReal(value) {
  if (!value) return false;
  return !/replace_me|your-deployment-name|your-subdomain|pk_test_replace|sk_test_replace/i.test(
    value,
  );
}

function credentials() {
  const e = env();
  console.log(`\n${B}Your own credentials${O}`);
  let missing = 0;
  for (const [key, why] of OWN_CREDENTIALS) {
    const ok = looksReal(e[key]);
    if (!ok) missing++;
    console.log(
      `  ${ok ? `${G}✓${O}` : `${R}✗${O}`} ${key.padEnd(42)} ${D}${why}${O}`,
    );
  }
  if (missing) {
    console.log(
      `\n  ${Y}${missing} not set.${O} ${D}Copy .env.example to .env.local and fill in your own.` +
        `\n  Never paste a key from a walkthrough, a screenshot, or a teammate.${O}`,
    );
  }
  return missing === 0;
}

function deploy() {
  const e = env();
  console.log(`\n${B}Your deploy${O}`);
  const url = e.RENDER_EXTERNAL_URL || e.NEXT_PUBLIC_APP_URL || null;
  if (url) {
    console.log(`  ${G}✓${O} ${url}`);
  } else {
    console.log(
      `  ${Y}·${O} no deploy URL in .env.local. ${D}Stage 7 verifies on a real deploy —` +
        `\n    see DEPLOYMENT.md, then set NEXT_PUBLIC_APP_URL so this can report it.${O}`,
    );
  }
}

function convexSummary() {
  console.log(`\n${B}Your Convex${O}`);
  try {
    const raw = execFileSync(
      "npx",
      ["convex", "run", "cohortSampleSeed:summary"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const json = JSON.parse(raw.slice(raw.indexOf("{")));
    const rate = json.documents
      ? Math.round((json.publishedDocuments / json.documents) * 100)
      : 0;
    console.log(
      `  ${json.users} seeded users · ${json.documents} documents · ${json.publishedDocuments} published (${rate}%)`,
    );
    console.log(
      `  ${json.coworkerMessages} Coworker messages · ${json.files} files · ${json.squadAgents} Squad agents`,
    );

    // The per-user rows are what the questions are answered from.
    const byPersona = {};
    for (const row of json.chatToPublish ?? []) {
      const p = (byPersona[row.persona] ??= {
        users: 0,
        messages: 0,
        published: 0,
        silent: 0,
      });
      p.users++;
      p.messages += row.messages;
      p.published += row.publishedDocuments;
      if (row.messages > 0 && row.publishedDocuments === 0) p.silent++;
    }
    console.log(
      `\n  ${D}persona            users  msgs  published  used AI, never published${O}`,
    );
    for (const [persona, p] of Object.entries(byPersona)) {
      console.log(
        `  ${persona.padEnd(18)} ${String(p.users).padStart(5)} ${String(p.messages).padStart(5)} ${String(p.published).padStart(10)} ${String(p.silent).padStart(24)}`,
      );
    }
    return true;
  } catch (error) {
    const msg = String(error.stderr || error.message).split("\n")[0];
    console.log(`  ${R}✗${O} could not query: ${D}${msg}${O}`);
    console.log(
      `  ${D}Run \`npm run seed:convex\` first — the summary lives in the seed module,` +
        `\n  so it does not exist until the cohort has been seeded into your project.${O}`,
    );
    return false;
  }
}

function amplitude() {
  const e = env();
  const ready =
    looksReal(e.NEXT_PUBLIC_AMPLITUDE_API_KEY) &&
    looksReal(e.AMPLITUDE_API_KEY);
  console.log(`\n${B}Your Amplitude${O}`);
  if (!ready) {
    console.log(
      `  ${R}✗${O} keys not set. ${D}Two of the six evidence sources are Amplitude-shaped,` +
        `\n    so without this you are doing stage 2 with four.${O}`,
    );
  } else {
    console.log(
      `  ${G}✓${O} keys set. ${D}Run \`npm run seed:amplitude\` to send the cohort.${O}`,
    );
  }
  const events = relevantEvents(repoRoot);
  if (events.length) {
    console.log(`\n  ${D}Events that bear on the questions below:${O}`);
    for (const ev of events) console.log(`    ${D}·${O} ${ev}`);
  }
  console.log(
    `\n  ${Y}Worth knowing before you trust a chart:${O} ${D}this data is a fixture you replayed` +
      `\n  into a real product. It looks like independent behavioral evidence and it is not.` +
      `\n  See pm-course/onboarding/what-is-real.md.${O}`,
  );
}

function questions() {
  const qs = cohortQuestions(repoRoot);
  if (!qs.length) return;
  console.log(`\n${B}What this cohort was built to let you answer${O}`);
  for (const q of qs) {
    const from = ANSWERABLE_FROM[q.name];
    console.log(`\n  ${q.question}`);
    console.log(
      `  ${D}${from ? `answerable from: ${from.join(" and ")}` : "answerable from Convex"}${O}`,
    );
  }
  console.log(
    `\n  ${D}The fixture also records what pattern each question should surface. Deliberately` +
      `\n  not printed — querying your own data is the stage, and reading the answer is not.${O}`,
  );
}

const credsOk = credentials();
deploy();
if (!checkOnly) {
  if (credsOk) convexSummary();
  else
    console.log(
      `\n${D}Skipping the Convex query until the credentials above are set.${O}`,
    );
  amplitude();
}
questions();
console.log("");
