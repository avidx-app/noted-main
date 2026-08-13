import { readFile } from "node:fs/promises";

export async function readExpandedConvexFixture(fixturePath) {
  const raw = await readFile(fixturePath, "utf8");
  const fixture = JSON.parse(raw);
  return fixture.generatedPlan ? expandGeneratedFixture(fixture) : fixture;
}

export function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(random, values) {
  return values[Math.floor(random() * values.length)];
}

export function intBetween(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

function slugPersona(persona) {
  return persona.replace(/_users?$/, "").replace(/_risk$/, "");
}

function personaConfig(persona) {
  const configs = {
    power_users: {
      documents: [8, 14],
      messageCount: [45, 120],
      publishRate: 0.32,
      archiveRate: 0.04,
      fileRate: 0.38,
      squadAgentRate: 0.8,
      bytes: [1_200_000, 7_500_000],
      providers: ["anthropic", "openai"],
      models: ["claude-sonnet-4-5", "gpt-5.1"],
    },
    casual_users: {
      documents: [2, 6],
      messageCount: [8, 45],
      publishRate: 0.1,
      archiveRate: 0.09,
      fileRate: 0.18,
      squadAgentRate: 0.18,
      bytes: [120_000, 2_800_000],
      providers: ["openai", "google", "anthropic"],
      models: ["gpt-5.1-mini", "gemini-3-pro", "claude-haiku-4-5"],
    },
    churned_users: {
      documents: [3, 8],
      messageCount: [55, 140],
      publishRate: 0.03,
      archiveRate: 0.22,
      fileRate: 0.08,
      squadAgentRate: 0.08,
      bytes: [500_000, 5_000_000],
      providers: ["anthropic", "openai"],
      models: ["claude-haiku-4-5", "gpt-5.1-mini"],
    },
    trial_users: {
      documents: [1, 4],
      messageCount: [2, 22],
      publishRate: 0.16,
      archiveRate: 0.04,
      fileRate: 0.12,
      squadAgentRate: 0.04,
      bytes: [30_000, 900_000],
      providers: ["openai", "google"],
      models: ["gpt-5.1-mini", "gemini-3-pro"],
    },
  };

  return configs[persona] ?? configs.casual_users;
}

function buildContent(title, persona, state) {
  return JSON.stringify([
    {
      type: "paragraph",
      content: `${title}. Synthetic ${persona} sample. State: ${state}.`,
    },
  ]);
}

function expandGeneratedFixture(fixture) {
  const plan = fixture.generatedPlan;
  const random = mulberry32(plan.seed ?? 20260518);
  const users = [];
  const documents = [];
  const files = [];
  const coworkerMessages = [];
  const squadAgents = [];
  const titlePool = [
    "Launch notes",
    "Draft strategy memo",
    "Meeting notes",
    "Research scratchpad",
    "Client update",
    "Campaign brief",
    "Founder narrative",
    "Product review notes",
    "Team planning doc",
    "Public changelog draft",
    "Workshop outline",
    "Hiring scorecard",
    "Customer synthesis",
    "Pricing notes",
  ];

  for (const [persona, count] of Object.entries(plan.personaCounts)) {
    const config = personaConfig(persona);
    const slug = slugPersona(persona);

    for (let index = 1; index <= count; index += 1) {
      const userId = `cohort_${slug}_${String(index).padStart(2, "0")}`;
      users.push({
        userId,
        persona,
        aiProvider: pick(random, config.providers),
        aiModel: pick(random, config.models),
        bytesUsed: intBetween(random, config.bytes[0], config.bytes[1]),
      });

      const docCount = intBetween(
        random,
        config.documents[0],
        config.documents[1],
      );
      let publishedForUser = 0;

      for (let docIndex = 1; docIndex <= docCount; docIndex += 1) {
        const baseTitle = pick(random, titlePool);
        const isPublished = random() < config.publishRate;
        const isArchived = random() < config.archiveRate;
        if (isPublished) publishedForUser += 1;

        const title = `${baseTitle} ${docIndex}`;
        const seedKey = `${userId}:doc:${docIndex}`;
        documents.push({
          seedKey,
          title,
          userId,
          isArchived,
          isPublished,
          icon: isPublished ? "globe" : undefined,
          content: buildContent(
            title,
            persona,
            isPublished ? "published" : isArchived ? "archived" : "draft",
          ),
        });

        if (random() < config.fileRate) {
          const fileType = pick(random, [
            ["image/png", "cover.png", 245_760],
            ["application/pdf", "source.pdf", 1_835_008],
            ["text/csv", "export.csv", 82_944],
          ]);
          files.push({
            name: `${slug}-${index}-${docIndex}-${fileType[1]}`,
            type: fileType[0],
            url: `https://example.com/cohort-sample/${slug}-${index}-${docIndex}-${fileType[1]}`,
            userId,
            size: intBetween(
              random,
              Math.floor(fileType[2] * 0.6),
              Math.floor(fileType[2] * 1.4),
            ),
            documentSeedKey: seedKey,
            checksum: `cohort-sample-${slug}-${index}-${docIndex}`,
          });
        }
      }

      const baseMessages = intBetween(
        random,
        config.messageCount[0],
        config.messageCount[1],
      );
      const gapBoost =
        publishedForUser === 0 &&
        (persona === "churned_users" || persona === "casual_users")
          ? intBetween(random, 15, 40)
          : 0;
      coworkerMessages.push({
        userId,
        role: "user",
        count: baseMessages + gapBoost,
      });

      if (random() < config.squadAgentRate) {
        const instructionsDocSeedTitle = `Squad Agent Instructions ${userId}`;
        documents.push({
          seedKey: `${userId}:agent-instructions`,
          title: instructionsDocSeedTitle,
          userId,
          isArchived: false,
          isPublished: false,
          content:
            "You are a synthetic cohort sample Squad agent. Help with review, editing, and synthesis.",
        });
        squadAgents.push({
          userId,
          name: pick(random, [
            "Editor Coach",
            "Research Synthesizer",
            "Launch Reviewer",
            "Skeptical PM",
          ]),
          description:
            "Synthetic sample agent for Week 3 and Week 4 data exploration",
          icon: pick(random, [
            "pencil",
            "magnifying-glass",
            "rocket",
            "test-tube",
          ]),
          instructionsDocSeedTitle,
        });
      }
    }
  }

  return {
    users,
    documents,
    files,
    coworkerMessages,
    squadAgents,
    insights: fixture.insights ?? [],
    notes: fixture.notes ?? [],
  };
}
