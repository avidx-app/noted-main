/**
 * ai-assets — read the `.ai/` source of truth.
 *
 * Everything that indexes skills and commands (the CONTRIBUTING tables, the
 * drift checks) reads them through here, so there is exactly one parser and one
 * definition of what a well-formed asset looks like.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, "..", "..");

const SKILLS_DIR = path.join(repoRoot, ".ai", "skills");
const COMMANDS_DIR = path.join(repoRoot, ".ai", "commands");

/**
 * Parse YAML frontmatter. Deliberately minimal: we only support the flat
 * `key: value` shape our assets actually use, with optional quoting. A real
 * YAML parser would be a dependency for no benefit — and if an asset ever needs
 * nested frontmatter, that is a signal worth failing loudly on rather than
 * silently half-parsing.
 */
export function parseFrontmatter(source) {
  if (!source.startsWith("---\n")) return {};
  const end = source.indexOf("\n---", 3);
  if (end === -1) return {};

  const block = source.slice(4, end);
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of block.split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

/** Every skill in `.ai/skills/`, sorted by name. */
export function readSkills() {
  if (!fs.existsSync(SKILLS_DIR)) return [];

  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const file = path.join(SKILLS_DIR, entry.name, "SKILL.md");
      const exists = fs.existsSync(file);
      const front = exists
        ? parseFrontmatter(fs.readFileSync(file, "utf8"))
        : {};
      return {
        slug: entry.name,
        file: path.relative(repoRoot, file),
        exists,
        name: front.name ?? "",
        description: front.description ?? "",
        summary: front.summary ?? "",
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Every command in `.ai/commands/`, sorted by name. */
export function readCommands() {
  if (!fs.existsSync(COMMANDS_DIR)) return [];

  return fs
    .readdirSync(COMMANDS_DIR)
    .filter((entry) => entry.endsWith(".md"))
    .map((entry) => {
      const file = path.join(COMMANDS_DIR, entry);
      const front = parseFrontmatter(fs.readFileSync(file, "utf8"));
      return {
        slug: entry.replace(/\.md$/, ""),
        file: path.relative(repoRoot, file),
        description: front.description ?? "",
        summary: front.summary ?? "",
        handoffs: front.handoffs ?? "",
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * The one-line text an index table shows for an asset. `summary` exists for
 * exactly this: skill `description` fields are trigger surfaces written for the
 * model and run long, which makes them useless in a table a human scans.
 */
export function tableText(asset) {
  return asset.summary || asset.description || "";
}

/**
 * Replace the content between `<!-- auto:<id>:start -->` and
 * `<!-- auto:<id>:end -->`. Returns the new document, or throws if the markers
 * are missing — a silently-skipped generation is how indexes rot.
 */
export function replaceBlock(doc, id, body) {
  const start = `<!-- auto:${id}:start -->`;
  const end = `<!-- auto:${id}:end -->`;
  const startAt = doc.indexOf(start);
  const endAt = doc.indexOf(end);

  if (startAt === -1 || endAt === -1 || endAt < startAt) {
    throw new Error(`missing or malformed auto:${id} markers`);
  }

  return (
    doc.slice(0, startAt + start.length) + "\n" + body + "\n" + doc.slice(endAt)
  );
}
