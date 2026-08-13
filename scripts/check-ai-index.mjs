#!/usr/bin/env node
/**
 * check-ai-index — regenerate the skill and command tables in
 * .ai/CONTRIBUTING.md from the assets themselves.
 *
 * Every skill and command carries its own one-line `summary:` in frontmatter.
 * This collects them, so "what does this repo give an agent?" has exactly one
 * always-current answer and adding a skill cannot leave the index behind.
 *
 *   node scripts/check-ai-index.mjs            rewrite the tables
 *   node scripts/check-ai-index.mjs --check    exit 1 if they are out of date
 *
 * Do not hand-edit between the auto markers — change the asset's frontmatter
 * and regenerate. Output is run through Prettier before it is written, so the
 * generated tables are byte-identical to what `npm run format:check` expects
 * and the two can never disagree.
 */

import fs from "node:fs";
import path from "node:path";

import prettier from "prettier";

import {
  readSkills,
  readCommands,
  tableText,
  replaceBlock,
  repoRoot,
} from "./lib/ai-assets.mjs";

const CONTRIBUTING = path.join(repoRoot, ".ai", "CONTRIBUTING.md");
const check = process.argv.includes("--check");

/** Render a minimal markdown table. Prettier does the alignment afterwards. */
function renderTable(headers, rows) {
  const line = (cells) => `| ${cells.join(" | ")} |`;
  return [
    line(headers),
    line(headers.map(() => "---")),
    ...rows.map(line),
  ].join("\n");
}

function build() {
  const skills = readSkills();
  const commands = readCommands();

  const problems = [];
  for (const skill of skills) {
    if (!skill.exists) problems.push(`skill ${skill.slug} has no SKILL.md`);
    else if (!tableText(skill))
      problems.push(`skill ${skill.slug} has no summary or description`);
    else if (skill.name && skill.name !== skill.slug)
      problems.push(
        `skill ${skill.slug} declares name: ${skill.name} — directory and name must match`,
      );
  }
  for (const command of commands) {
    if (!tableText(command))
      problems.push(`command /${command.slug} has no summary or description`);
  }

  return {
    problems,
    skillsTable: renderTable(
      ["Skill", "Purpose"],
      skills.map((s) => [`\`${s.slug}\``, tableText(s)]),
    ),
    commandsTable: renderTable(
      ["Command", "Purpose"],
      commands.map((c) => [`\`/${c.slug}\``, tableText(c)]),
    ),
    counts: { skills: skills.length, commands: commands.length },
  };
}

async function main() {
  const { problems, skillsTable, commandsTable, counts } = build();

  if (problems.length) {
    for (const problem of problems) console.error(`[ai-index] ${problem}`);
    process.exit(1);
  }

  const before = fs.readFileSync(CONTRIBUTING, "utf8");
  let after = replaceBlock(before, "skills", skillsTable);
  after = replaceBlock(after, "commands", commandsTable);

  // Format with the repo's own Prettier config so the generated file is exactly
  // what `format:check` wants. Without this the two fight: we write a table,
  // Prettier realigns it, and the next --check reports drift that is not real.
  const config = await prettier.resolveConfig(CONTRIBUTING);
  after = await prettier.format(after, {
    ...config,
    filepath: CONTRIBUTING,
  });

  if (before === after) {
    console.log(
      `[ai-index] up to date — ${counts.skills} skills, ${counts.commands} commands`,
    );
    return;
  }

  if (check) {
    console.error(
      "[ai-index] .ai/CONTRIBUTING.md is out of date. Run `npm run check:index` to regenerate.",
    );
    process.exit(1);
  }

  fs.writeFileSync(CONTRIBUTING, after);
  console.log(
    `[ai-index] rewrote .ai/CONTRIBUTING.md — ${counts.skills} skills, ${counts.commands} commands`,
  );
}

await main();
