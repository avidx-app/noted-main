/**
 * artifact — read the thing an attendee wrote, without pretending to grade it.
 *
 * These helpers pull structure out of a markdown artifact: which sections exist,
 * which files it cites, whether a section is still the template. That is the
 * honest limit of what a script can know about a discovery document. It can
 * check that a cited file exists; it cannot check that the citation supports the
 * claim. Every checker built on this says which is which, out loud.
 */

/** Headings we treat as section starts, in the artifacts these labs ask for. */
const HEADING = /^(#{2,3})\s+(.*?)\s*$/;

/** Normalize a heading for matching: lowercase, no numbering, no punctuation. */
export function slugHeading(text) {
  return text
    .toLowerCase()
    .replace(/^\d+[.)]\s*/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Split markdown into `{ heading, slug, body }` sections at `##`/`###`.
 * Content before the first heading is returned under the slug `""`.
 */
export function sections(md) {
  const out = [];
  let current = { heading: "", slug: "", body: [] };

  for (const line of (md ?? "").split("\n")) {
    const m = HEADING.exec(line);
    if (m) {
      out.push({ ...current, body: current.body.join("\n").trim() });
      current = { heading: m[2], slug: slugHeading(m[2]), body: [] };
      continue;
    }
    current.body.push(line);
  }
  out.push({ ...current, body: current.body.join("\n").trim() });

  return out.filter((s, i) => i === 0 || s.heading !== "");
}

/** Find a section whose slug contains every word in `words`. */
export function findSection(secs, ...words) {
  return secs.find((s) => words.every((w) => s.slug.includes(w))) ?? null;
}

const EXT = /\.(md|mjs|js|ts|tsx|yaml|yml|json|css|html|sh)$/i;

/**
 * Repo-relative paths cited in the text — from backticks and from markdown
 * link targets. A citation is a claim that a file says something, so a path that
 * does not resolve is the one failure mode worth being strict about.
 */
export function citedPaths(text) {
  const found = new Set();
  const add = (raw) => {
    const p = raw
      .trim()
      .replace(/^\.\//, "")
      .replace(/[.,;:)]+$/, "");
    if (!p || /\s/.test(p)) return;
    if (/^[a-z]+:\/\//i.test(p) || p.startsWith("#") || p.startsWith("mailto:"))
      return;
    // A leading slash means a route in the running app — `/documents/start` —
    // not a file. Citing one is fine and common; resolving it against the
    // repo root would fail every time and teach nothing.
    if (p.startsWith("/")) return;
    // A citation has to be precise enough to open: a file extension, or a
    // trailing slash for a directory. Without this, `feat/share-framing` —
    // a branch name, which every Stage 4 contract carries — resolves as a
    // missing file and fails the map.
    if (!EXT.test(p) && !p.endsWith("/")) return;
    found.add(p);
  };

  for (const m of (text ?? "").matchAll(/`([^`\n]+)`/g)) add(m[1]);
  for (const m of (text ?? "").matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) add(m[1]);

  return [...found];
}

/**
 * Is this section still the template?
 *
 * The brief's placeholders are parenthetical instructions and `<angle>` slots.
 * A section that is empty, or entirely made of those, has not been filled in —
 * and "the attendee left it blank" is a different result from "the attendee
 * answered badly", which is not ours to judge.
 */
export function isPlaceholder(body) {
  // A parenthetical spanning several lines is still one instruction. Checking
  // line by line missed these, and the blank Stage 6 template passed the section
  // the whole act is assessed on.
  const whole = (body ?? "").trim();
  if (whole.startsWith("(") && whole.endsWith(")")) return true;

  const meaningful = (body ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^\(.*\)$/.test(l))
    .filter(
      (l) => !/^[|>-]/.test(l) || /[a-z]{3}/i.test(l.replace(/<[^>]*>/g, "")),
    )
    .map((l) =>
      l
        .replace(/<[^>]+>/g, "")
        .replace(/[|_*`—–-]/g, "")
        .trim(),
    )
    .filter(Boolean);

  return meaningful.join(" ").length < 20;
}

/** Words that look like a next step but name no evidence and no decision. */
export const VAGUE_NEXT_STEPS = [
  "talk to more users",
  "talk to users",
  "do more research",
  "more research",
  "ask the team",
  "look into it",
  "investigate further",
  "gather more data",
];

/** True if the text offers nothing beyond one of the vague phrases above. */
export function isVagueOnly(text) {
  const t = (text ?? "")
    .toLowerCase()
    .replace(/[^a-z ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return true;
  for (const phrase of VAGUE_NEXT_STEPS) {
    if (t === phrase) return true;
    if (t.startsWith(phrase) && t.length < phrase.length + 12) return true;
  }
  return false;
}
