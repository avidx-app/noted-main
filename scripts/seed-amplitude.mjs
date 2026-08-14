#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  intBetween,
  mulberry32,
  pick,
  readExpandedConvexFixture,
} from "./cohort-fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(__dirname, "fixtures/cohort-sample-data.json");
const planPath = path.resolve(__dirname, "fixtures/amplitude-plan.json");
const analyticsPath = path.resolve(__dirname, "../lib/analytics.ts");
const endpoint =
  process.env.AMPLITUDE_ENDPOINT ?? "https://api2.amplitude.com/2/httpapi";
const apiKey = process.env.AMPLITUDE_API_KEY;
const dayMs = 24 * 60 * 60 * 1000;
const minuteMs = 60 * 1000;

// The window ends on a fixed date rather than "today" so the stream is
// reproducible: regenerating next month must not shift every timestamp.
const defaultAnchor = "2026-01-30";

// A session is a run of events with no gap longer than this, which is the
// convention Amplitude itself uses.
const sessionGapMs = 30 * minuteMs;

// Not every event a product sends arrives in the warehouse. A slice of users
// run a blocker or strict privacy mode and are close to invisible to analytics
// while remaining fully active in the product database; everyone else loses an
// occasional beacon when a tab closes before it flushes. Modeling this is the
// point: a seed that reconciles perfectly with the product tables teaches a
// reconciliation that no real product ever gets.
const blockedUserShare = 0.12;
const blockedUserLoss = 0.9;
const baselineLoss = 0.03;

function parseArgs(argv) {
  const options = {
    apply: false,
    out: "",
    days: undefined,
    users: undefined,
    anchor: defaultAnchor,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--apply") {
      options.apply = true;
    } else if (arg === "--out") {
      options.out = path.resolve(argv[index + 1]);
      index += 1;
    } else if (arg === "--days") {
      options.days = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg === "--users") {
      options.users = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg === "--anchor") {
      options.anchor = argv[index + 1];
      index += 1;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(options.anchor)) {
        throw new Error(`--anchor expects YYYY-MM-DD, got: ${options.anchor}`);
      }
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  npm run seed:amplitude:plan
  AMPLITUDE_API_KEY=... npm run seed:amplitude
  npm run seed:amplitude:plan -- --out /tmp/noted-amplitude-events.json

Options:
  --out FILE       write the generated stream to FILE
  --days N         window length in days (default: plan.windowDays)
  --users N        cap the cohort size
  --anchor DATE    last day of the window, YYYY-MM-DD (default: ${defaultAnchor})

Default mode generates a dry-run event stream only.
Set AMPLITUDE_API_KEY and pass --apply to send events to your Amplitude project.

The stream is deterministic: it derives from plan.seed and from --anchor, never
from the wall clock, so regenerating it later reproduces it exactly.
`);
}

async function readEventCatalog() {
  const raw = await readFile(analyticsPath, "utf8");
  const matches = [...raw.matchAll(/trackPageEvent\("([^"]+)"/g)];
  return new Set(matches.map((match) => match[1]));
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  );
}

function indexByUser(rows) {
  const byUser = new Map();
  for (const row of rows) {
    const rowsForUser = byUser.get(row.userId) ?? [];
    rowsForUser.push(row);
    byUser.set(row.userId, rowsForUser);
  }
  return byUser;
}

function windowStartUtc(anchor, windowDays) {
  const [year, month, day] = anchor.split("-").map(Number);
  return Date.UTC(year, month - 1, day) - (windowDays - 1) * dayMs;
}

// Noted is a work tool, so usage tracks the working week. A flat stream is the
// fastest way to make seeded data look seeded: real day-over-day charts dip
// every weekend, and the first of January barely registers.
function dayWeight(dayStartMs) {
  const date = new Date(dayStartMs);
  if (date.getUTCMonth() === 0 && date.getUTCDate() === 1) return 0.15;
  const weekday = date.getUTCDay();
  if (weekday === 0) return 0.34;
  if (weekday === 6) return 0.42;
  if (weekday === 1) return 1.08;
  return 1;
}

// Move an event off a quiet day onto the next busier one, so the weekly shape
// emerges from where events land rather than from a post-hoc filter.
function shiftToWorkingDay(dayIndex, maxDay, windowStart, random) {
  let candidate = Math.max(0, Math.min(maxDay, dayIndex));
  for (let step = 0; step < 7 && candidate < maxDay; step += 1) {
    if (random() <= dayWeight(windowStart + candidate * dayMs))
      return candidate;
    candidate += 1;
  }
  return candidate;
}

function dayStartFor(windowStart, dayIndex) {
  return windowStart + dayIndex * dayMs;
}

// Working hours, with a mid-morning and mid-afternoon bias rather than a flat
// draw across the day.
function sampleWorkingTime(windowStart, dayIndex, random) {
  const hour = pick(
    random,
    [9, 9, 10, 10, 11, 11, 12, 13, 14, 14, 15, 15, 16, 17, 18, 20],
  );
  return (
    dayStartFor(windowStart, dayIndex) +
    hour * 60 * minuteMs +
    intBetween(random, 0, 59) * minuteMs
  );
}

// Amplitude groups events into sessions by inactivity gap. Assigning real
// session ids after the fact keeps events-per-session honest, which matters
// because a stream where every event is its own session cannot be read as one.
function assignSessions(events) {
  const byUser = new Map();
  for (const event of events) {
    const list = byUser.get(event.user_id) ?? [];
    list.push(event);
    byUser.set(event.user_id, list);
  }

  for (const list of byUser.values()) {
    list.sort((left, right) => left.time - right.time);
    let sessionStart = null;
    let previous = null;
    for (const event of list) {
      if (previous === null || event.time - previous > sessionGapMs)
        sessionStart = event.time;
      event.session_id = sessionStart;
      previous = event.time;
    }
  }
}

// Which users analytics can barely see. Drawn from its own stream so that
// adding an event type later does not change who is affected.
function blockedUsers(users, seed) {
  const random = mulberry32(seed);
  const blocked = new Set();
  for (const user of users) {
    if (random() < blockedUserShare) blocked.add(user.userId);
  }
  return blocked;
}

function applyDelivery(events, blocked, seed) {
  const random = mulberry32(seed);
  return events.filter((event) => {
    const loss = blocked.has(event.user_id) ? blockedUserLoss : baselineLoss;
    return random() >= loss;
  });
}

// Trials expire, and a trial cohort still active on day 30 is the clearest sign
// that a seed was built without thinking about lifecycle. Everyone else runs to
// the end of the window — including the churn-risk cohort, whose label is a
// judgment somebody recorded rather than a behavior anybody observed.
function lastActiveDay(persona, signupDay, windowDays, random) {
  if (persona === "trial_users") {
    return Math.min(windowDays - 1, signupDay + intBetween(random, 10, 15));
  }
  return windowDays - 1;
}

function personaDimensions(persona) {
  const dimensions = {
    power_users: ["activated", "pro", "low"],
    casual_users: ["evaluating", "free", "medium"],
    churned_users: ["at_risk", "free", "high"],
    trial_users: ["trial", "trial", "unknown"],
  };

  return dimensions[persona] ?? dimensions.casual_users;
}

function eventProperties(user, context, eventName, extra = {}) {
  const [lifecycleStage, planTier, riskSegment] = personaDimensions(
    user.persona,
  );
  return compactObject({
    cohort: "cohort_1_sample",
    environment: "course_seed",
    source: "noted_main_seed_script",
    persona: user.persona,
    convex_user_id: user.userId,
    lifecycle_stage: lifecycleStage,
    risk_segment: riskSegment,
    plan_tier: planTier,
    activation_status: context.activationStatus,
    feature_area: context.featureArea,
    funnel_stage: context.funnelStage,
    seeded_document_count: context.documentCount,
    seeded_published_document_count: context.publishedDocumentCount,
    seeded_coworker_message_count: context.messageCount,
    event_name: eventName,
    ...extra,
  });
}

function makeEvent(eventName, time, user, eventPropertiesForEvent) {
  return {
    user_id: user.userId,
    event_type: eventName,
    time,
    session_id: null, // assigned by assignSessions() once the stream is complete
    platform: "Web",
    app_version: "cohort-seed-1",
    event_properties: eventPropertiesForEvent,
  };
}

function activationStatus(documentCount, publishedDocumentCount, messageCount) {
  if (publishedDocumentCount > 0) return "published";
  if (messageCount >= 50) return "chat_active_no_publish";
  if (documentCount > 0) return "created_not_published";
  return "new";
}

function generateEvents(plan, fixture, eventCatalog, options) {
  // One knob controls both halves of the cohort: the Convex fixture expands from
  // plan.seed, and the stream derives from it, so the two can never drift apart
  // through an unrelated edit.
  const baseSeed = plan.seed ?? 20260518;
  const random = mulberry32(baseSeed + 1);
  const windowDays = options.days ?? plan.windowDays;
  const windowStart = windowStartUtc(
    options.anchor ?? defaultAnchor,
    windowDays,
  );
  const users = fixture.users.slice(0, options.users ?? plan.userCountTarget);
  const documentsByUser = indexByUser(fixture.documents);
  const messagesByUser = new Map(
    fixture.coworkerMessages.map((bucket) => [bucket.userId, bucket.count]),
  );
  const events = [];

  const push = (
    eventName,
    day,
    user,
    context,
    extra = {},
    maxDay = windowDays - 1,
  ) => {
    if (!eventCatalog.has(eventName)) return;
    const dayIndex = shiftToWorkingDay(day, maxDay, windowStart, random);
    const time = sampleWorkingTime(windowStart, dayIndex, random);
    events.push(
      makeEvent(
        eventName,
        time,
        user,
        eventProperties(user, context, eventName, extra),
      ),
    );
  };

  // Emit an event at an exact moment, for the follow-on actions that happen
  // seconds after the one before them rather than on their own day.
  const pushAt = (eventName, time, user, context, extra = {}) => {
    if (!eventCatalog.has(eventName)) return;
    events.push(
      makeEvent(
        eventName,
        time,
        user,
        eventProperties(user, context, eventName, extra),
      ),
    );
  };

  for (const [userIndex, user] of users.entries()) {
    const documents = documentsByUser.get(user.userId) ?? [];
    const publishedDocuments = documents.filter(
      (document) => document.isPublished,
    );
    const messageCount = messagesByUser.get(user.userId) ?? 0;
    const signupDay = Math.min(
      windowDays - 1,
      intBetween(random, 0, 8) + (userIndex % 4),
    );
    const finalDay = lastActiveDay(user.persona, signupDay, windowDays, random);
    const baseContext = {
      documentCount: documents.length,
      publishedDocumentCount: publishedDocuments.length,
      messageCount,
      activationStatus: activationStatus(
        documents.length,
        publishedDocuments.length,
        messageCount,
      ),
    };

    const featureIndex = intBetween(random, 0, 5);
    const landingProps = {
      feature_name: [
        "AI Writing",
        "Editor",
        "Files",
        "Publish",
        "Search",
        "Squad",
      ][featureIndex],
      page_path: [
        "/features/ai-writing",
        "/features/editor",
        "/features/files",
        "/features/publish",
        "/features/search",
        "/features/squad",
      ][featureIndex],
    };
    const landingDay = shiftToWorkingDay(
      Math.max(0, signupDay - 1),
      finalDay,
      windowStart,
      random,
    );
    const landingAt = sampleWorkingTime(windowStart, landingDay, random);
    pushAt(
      "Landing Feature Page Visited",
      landingAt,
      user,
      { ...baseContext, featureArea: "acquisition", funnelStage: "visitor" },
      landingProps,
    );

    // A page that is read and never acted on is not how landing pages behave.
    // The gap between the visit and the click is the acquisition step itself.
    if (random() < 0.44) {
      pushAt(
        "Landing Feature Clicked",
        landingAt + intBetween(random, 6, 190) * 1000,
        user,
        { ...baseContext, featureArea: "acquisition", funnelStage: "visitor" },
        landingProps,
      );
    }

    if (user.persona === "trial_users" || random() < 0.22) {
      push(
        "Hiring Vibe PMs Page Visited",
        Math.max(0, signupDay - 1),
        user,
        { ...baseContext, featureArea: "acquisition", funnelStage: "visitor" },
        { page_path: "/hiring-vibe-pms" },
      );
    }

    push(
      "User Logged In",
      signupDay,
      user,
      { ...baseContext, featureArea: "auth", funnelStage: "signup" },
      { auth_surface: "clerk" },
    );

    // Provider tests fail sometimes — a wrong key, a rate limit, a provider
    // outage. Setup that always succeeds is the least believable part of a seed.
    const providerTestPassed = random() >= 0.16;
    push(
      "AI Provider Tested",
      signupDay,
      user,
      { ...baseContext, featureArea: "ai_settings", funnelStage: "setup" },
      { ai_provider: user.aiProvider, success: providerTestPassed },
    );

    push(
      "AI Settings Updated",
      signupDay,
      user,
      { ...baseContext, featureArea: "ai_settings", funnelStage: "setup" },
      {
        ai_provider: user.aiProvider,
        ai_model: user.aiModel,
        model_changed: random() < 0.38,
      },
    );

    for (const [docIndex, document] of documents.entries()) {
      const eventDay = Math.min(finalDay, signupDay + 1 + (docIndex % 12));
      const documentProps = {
        document_id: document.seedKey,
        document_seed_key: document.seedKey,
        document_join_key: `${user.userId}:${document.title}`,
        document_title: document.title,
        is_published: document.isPublished,
        is_archived: document.isArchived,
      };

      push(
        "Document Created",
        eventDay,
        user,
        { ...baseContext, featureArea: "documents", funnelStage: "create" },
        documentProps,
        finalDay,
      );

      if (document.isPublished) {
        const publishDayIndex = shiftToWorkingDay(
          Math.min(finalDay, eventDay + 1),
          finalDay,
          windowStart,
          random,
        );
        const publishedAt = sampleWorkingTime(
          windowStart,
          publishDayIndex,
          random,
        );
        pushAt(
          "Document Published",
          publishedAt,
          user,
          { ...baseContext, featureArea: "documents", funnelStage: "publish" },
          documentProps,
        );

        // Publishing and sharing are different steps, and the gap between them
        // is a real drop-off rather than a rounding error.
        if (random() < 0.62) {
          pushAt(
            "Public Link Copied",
            publishedAt + intBetween(random, 4, 220) * 1000,
            user,
            { ...baseContext, featureArea: "documents", funnelStage: "share" },
            documentProps,
          );
        }
      }

      // A withdrawn document looks identical to one never published in the
      // tables, because isPublished is a flag with no history. The events keep
      // the history the flag discards, which is the whole reason both views
      // exist. Only non-archived drafts qualify: an archived one was abandoned,
      // not retracted.
      if (!document.isPublished && !document.isArchived && random() < 0.022) {
        const shownDay = shiftToWorkingDay(
          Math.min(finalDay, eventDay + 1),
          finalDay,
          windowStart,
          random,
        );
        const shownAt = sampleWorkingTime(windowStart, shownDay, random);
        pushAt(
          "Document Published",
          shownAt,
          user,
          { ...baseContext, featureArea: "documents", funnelStage: "publish" },
          documentProps,
        );
        const pulledDay = shiftToWorkingDay(
          Math.min(finalDay, shownDay + intBetween(random, 1, 6)),
          finalDay,
          windowStart,
          random,
        );
        pushAt(
          "Document Unpublished",
          sampleWorkingTime(windowStart, pulledDay, random),
          user,
          { ...baseContext, featureArea: "documents", funnelStage: "retract" },
          documentProps,
        );
      }

      if (document.isArchived) {
        push(
          "Document Archived",
          Math.min(finalDay, eventDay + intBetween(random, 2, 9)),
          user,
          { ...baseContext, featureArea: "documents", funnelStage: "abandon" },
          documentProps,
          finalDay,
        );
      }
    }

    // Every message the product recorded gets an event. Nobody sends them one
    // per day, though: a user opens Coworker and goes back and forth for a
    // while, so messages arrive in sittings and a session holds several.
    // Pick the days this user actually opens Coworker, letting the weekly shape
    // fall out of dayWeight, then spread their whole message count across those
    // sittings. Allocating rather than capping is what keeps the stream faithful
    // to the product tables: a heavy user's messages get denser, not truncated.
    const firstMessageDay = Math.min(finalDay, signupDay + 2);
    const sittingDays = [];
    for (let day = firstMessageDay; day <= finalDay; day += 1) {
      if (random() < dayWeight(dayStartFor(windowStart, day)) * 0.55)
        sittingDays.push(day);
    }
    if (messageCount > 0 && sittingDays.length === 0)
      sittingDays.push(firstMessageDay);

    const weights = sittingDays.map(() => 0.5 + random());
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let cumulativeWeight = 0;
    let sequence = 0;

    for (const [sittingIndex, day] of sittingDays.entries()) {
      cumulativeWeight += weights[sittingIndex];
      const target = Math.round(
        (cumulativeWeight / totalWeight) * messageCount,
      );
      const burst = target - sequence;
      if (burst <= 0) continue;

      let moment = sampleWorkingTime(windowStart, day, random);
      for (let index = 0; index < burst; index += 1) {
        sequence += 1;
        pushAt(
          "Coworker Message Sent",
          moment,
          user,
          { ...baseContext, featureArea: "coworker", funnelStage: "assist" },
          {
            ai_provider: user.aiProvider,
            message_length_bucket: pick(random, ["<100", "100-500", "500+"]),
            message_sequence: sequence,
          },
        );
        moment += intBetween(random, 1, 9) * minuteMs;
      }
    }

    // Nobody signing out across 30 days is not a quiet signal, it is a missing
    // one. Shared machines and password managers both produce explicit logouts.
    if (random() < 0.46) {
      const logouts = intBetween(random, 1, 3);
      for (let index = 0; index < logouts; index += 1) {
        push(
          "User Logged Out",
          Math.min(finalDay, signupDay + 2 + intBetween(random, 0, 20)),
          user,
          { ...baseContext, featureArea: "auth", funnelStage: "signup" },
          { auth_surface: "clerk" },
          finalDay,
        );
      }
    }
  }

  const delivered = applyDelivery(
    events,
    blockedUsers(users, baseSeed + 2),
    baseSeed + 3,
  );
  assignSessions(delivered);
  return delivered.sort((left, right) => left.time - right.time);
}

async function postEvents(events) {
  if (!apiKey) {
    throw new Error("AMPLITUDE_API_KEY is required when applying the seed.");
  }

  for (let index = 0; index < events.length; index += 500) {
    const batch = events.slice(index, index + 500);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, events: batch }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Amplitude batch failed (${response.status}): ${body}`);
    }
  }
}

function printSummary(plan, events, options) {
  const byType = new Map();
  for (const event of events) {
    byType.set(event.event_type, (byType.get(event.event_type) ?? 0) + 1);
  }

  const days = new Set();
  const sessions = new Set();
  for (const event of events) {
    days.add(new Date(event.time).toISOString().slice(0, 10));
    sessions.add(`${event.user_id}:${event.session_id}`);
  }
  const sorted = [...days].sort();

  console.log("# Amplitude seed plan");
  console.log(`Cohort: ${plan.cohortName}`);
  console.log(`Seed: ${(plan.seed ?? 20260518) + 1} (derived from plan.seed)`);
  console.log(
    `Window: ${sorted[0]} .. ${sorted[sorted.length - 1]} (anchor ${options.anchor})`,
  );
  console.log(`Events: ${events.length}`);
  console.log(
    `Users seen: ${new Set(events.map((event) => event.user_id)).size}`,
  );
  console.log(`Sessions: ${sessions.size}`);
  console.log(
    `Events per session: ${(events.length / sessions.size).toFixed(2)}`,
  );
  console.log("");
  for (const [eventType, count] of [...byType.entries()].sort()) {
    console.log(`- ${eventType}: ${count}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const [planRaw, fixture, eventCatalog] = await Promise.all([
    readFile(planPath, "utf8").then(JSON.parse),
    readExpandedConvexFixture(fixturePath),
    readEventCatalog(),
  ]);
  const events = generateEvents(planRaw, fixture, eventCatalog, options);

  printSummary(planRaw, events, options);

  if (options.out) {
    await writeFile(options.out, JSON.stringify(events, null, 2), "utf8");
    console.log("");
    console.log(`Wrote ${options.out}`);
  }

  if (!options.apply) {
    console.log("");
    console.log(
      "Dry run only. Set AMPLITUDE_API_KEY and run npm run seed:amplitude to apply.",
    );
    return;
  }

  await postEvents(events);
  console.log("");
  console.log(`Sent ${events.length} events to Amplitude.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
