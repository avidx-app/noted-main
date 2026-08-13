/**
 * Starter-document scaffolds for the AI-first onboarding prototype.
 *
 * **This is prototype logic, not product logic.** Scaffold selection is keyword
 * matching, not comprehension — no model is involved. See
 * `team-os/product/prds/growth/prototype-boundary.md` for what the prototype
 * can and cannot tell you, and read that before citing anything it produces.
 *
 * Extracted from the page so the routing can be tested: it decides what every
 * research participant sees, and a mis-route silently changes the result they
 * react to. The sibling helper `lib/in-editor-ai-tracking.ts` shipped with two
 * substring bugs of exactly this kind, both caught only by its tests.
 */

export interface Scaffold {
  title: string;
  sections: string[];
}

export const SCAFFOLDS: Record<string, Scaffold> = {
  meeting: {
    title: "Meeting Notes",
    sections: [
      "Attendees",
      "Agenda",
      "Key Decisions",
      "Action Items",
      "Next Steps",
    ],
  },
  launch: {
    title: "Launch Brief",
    sections: [
      "Goal & Hypothesis",
      "Target Audience",
      "Key Messages",
      "Timeline",
      "Success Metrics",
    ],
  },
  study: {
    title: "Study Guide",
    sections: [
      "Core Concepts",
      "Key Terms",
      "Practice Questions",
      "Summary",
      "Resources",
    ],
  },
  interview: {
    title: "Interview Prep Plan",
    sections: [
      "Role Context",
      "Key Themes",
      "Likely Questions",
      "Your Stories (STAR)",
      "Questions to Ask",
    ],
  },
  brainstorm: {
    title: "Product Idea Canvas",
    sections: [
      "Problem Statement",
      "Target Audience",
      "Assumptions to Test",
      "Early Solutions",
      "Next Steps",
    ],
  },
  default: {
    title: "Starter Document",
    sections: ["Overview", "Key Points", "Next Steps", "Notes"],
  },
};

/**
 * Pick a scaffold from what the user typed.
 *
 * First match wins, so the order is load-bearing. Known ambiguities, kept
 * rather than fixed because the prototype's job is to find out whether the
 * offer makes sense, not to route perfectly:
 *
 * - "I need to hire someone" routes to interview *prep*, which is the wrong
 *   side of a hiring conversation.
 * - "notes" is broad enough that "study notes" reaches `meeting` before
 *   `study` ever gets a chance.
 *
 * Both are recorded in the prototype boundary. A participant who hits one is
 * evidence about the routing, not about the idea — do not read it as either.
 */
export function detectScaffold(intent: string): Scaffold {
  const lower = intent.toLowerCase();
  if (/meeting|notes|standup|sync/.test(lower)) return SCAFFOLDS.meeting;
  if (/launch|brief|campaign|announce/.test(lower)) return SCAFFOLDS.launch;
  if (/study|lecture|exam|course|learn/.test(lower)) return SCAFFOLDS.study;
  if (/interview|prep|job|hire/.test(lower)) return SCAFFOLDS.interview;
  if (/brainstorm|idea|product|startup/.test(lower))
    return SCAFFOLDS.brainstorm;
  return SCAFFOLDS.default;
}

/**
 * The prompts offered as one-click examples.
 *
 * Written to match the scaffolds above, which means a participant who clicks
 * one is on a rail — useful for showing the idea, useless as evidence that
 * routing works for arbitrary input.
 *
 * Note the first one does not do what it looks like: "lecture notes" matches
 * `notes` in the meeting branch, so it returns Meeting Notes rather than a
 * Study Guide. Pinned by test, recorded in the prototype boundary.
 */
export const EXAMPLE_PROMPTS = [
  "I need to summarize lecture notes",
  "I'm drafting a launch brief",
  "I'm preparing for an interview",
  "I need to organize meeting notes",
  "I'm brainstorming a product idea",
];

/** Skeleton bar widths for the simulated generating state. */
export const SKELETON_WIDTH_CLASSES = [
  "w-4/5",
  "w-3/5",
  "w-[90%]",
  "w-[55%]",
  "w-[70%]",
];
