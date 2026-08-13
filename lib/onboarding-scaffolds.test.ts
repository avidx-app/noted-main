import { detectScaffold, SCAFFOLDS } from "@/lib/onboarding-scaffolds";

describe("detectScaffold", () => {
  it("routes the five example prompts the prototype offers", () => {
    // These are the exact strings in EXAMPLE_PROMPTS. A participant who
    // clicks one is on a rail, and the rail has to actually work.
    expect(detectScaffold("I need to summarize lecture notes")).toBe(
      SCAFFOLDS.meeting,
    );
    expect(detectScaffold("I'm drafting a launch brief")).toBe(
      SCAFFOLDS.launch,
    );
    expect(detectScaffold("I'm preparing for an interview")).toBe(
      SCAFFOLDS.interview,
    );
    expect(detectScaffold("I need to organize meeting notes")).toBe(
      SCAFFOLDS.meeting,
    );
    expect(detectScaffold("I'm brainstorming a product idea")).toBe(
      SCAFFOLDS.brainstorm,
    );
  });

  it("falls back rather than failing on an unmatched intent", () => {
    expect(detectScaffold("planning my wedding")).toBe(SCAFFOLDS.default);
    expect(detectScaffold("")).toBe(SCAFFOLDS.default);
  });

  it("is case-insensitive", () => {
    expect(detectScaffold("LAUNCH BRIEF")).toBe(SCAFFOLDS.launch);
  });

  // The two known mis-routes, pinned so a future change to the regex order is
  // a deliberate decision rather than a surprise. Both are recorded in
  // team-os/product/prds/growth/prototype-boundary.md.
  it("mis-routes hiring to interview prep — known, documented", () => {
    expect(detectScaffold("I need to hire someone")).toBe(SCAFFOLDS.interview);
  });

  it("mis-routes study notes to meeting notes — known, documented", () => {
    // "notes" is matched by the meeting branch, which is tested first, so
    // "study" never gets a chance despite being the more specific word.
    expect(detectScaffold("my study notes")).toBe(SCAFFOLDS.meeting);
  });

  it("every scaffold has a title and at least four sections", () => {
    for (const [key, scaffold] of Object.entries(SCAFFOLDS)) {
      expect(scaffold.title).toBeTruthy();
      expect(scaffold.sections.length).toBeGreaterThanOrEqual(4);
      expect(new Set(scaffold.sections).size).toBe(scaffold.sections.length);
      expect(key).toBeTruthy();
    }
  });

  it("is reachable for every named scaffold except the fallback", () => {
    // A scaffold nobody can route to is dead weight in a prototype whose
    // whole purpose is to show people a plausible result.
    const reachable = new Set(
      [
        "organize meeting notes",
        "draft a launch brief",
        "revise for my exam",
        "prepare for an interview",
        "brainstorm a startup idea",
      ].map((intent) => detectScaffold(intent).title),
    );

    for (const key of Object.keys(SCAFFOLDS)) {
      if (key === "default") continue;
      expect(reachable).toContain(SCAFFOLDS[key].title);
    }
  });
});
