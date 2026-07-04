"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, SkipForward, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Mock document scaffolds keyed by detected intent ────────────────────────
const SCAFFOLDS: Record<string, { title: string; sections: string[] }> = {
  meeting: {
    title: "Meeting Notes",
    sections: ["Attendees", "Agenda", "Key Decisions", "Action Items", "Next Steps"],
  },
  launch: {
    title: "Launch Brief",
    sections: ["Goal & Hypothesis", "Target Audience", "Key Messages", "Timeline", "Success Metrics"],
  },
  study: {
    title: "Study Guide",
    sections: ["Core Concepts", "Key Terms", "Practice Questions", "Summary", "Resources"],
  },
  interview: {
    title: "Interview Prep Plan",
    sections: ["Role Context", "Key Themes", "Likely Questions", "Your Stories (STAR)", "Questions to Ask"],
  },
  brainstorm: {
    title: "Product Idea Canvas",
    sections: ["Problem Statement", "Target Audience", "Assumptions to Test", "Early Solutions", "Next Steps"],
  },
  default: {
    title: "Starter Document",
    sections: ["Overview", "Key Points", "Next Steps", "Notes"],
  },
};

function detectScaffold(intent: string) {
  const lower = intent.toLowerCase();
  if (/meeting|notes|standup|sync/.test(lower)) return SCAFFOLDS.meeting;
  if (/launch|brief|campaign|announce/.test(lower)) return SCAFFOLDS.launch;
  if (/study|lecture|exam|course|learn/.test(lower)) return SCAFFOLDS.study;
  if (/interview|prep|job|hire/.test(lower)) return SCAFFOLDS.interview;
  if (/brainstorm|idea|product|startup/.test(lower)) return SCAFFOLDS.brainstorm;
  return SCAFFOLDS.default;
}

// ─── Screens ─────────────────────────────────────────────────────────────────
type Screen = "prompt" | "generating" | "result";

const EXAMPLE_PROMPTS = [
  "I need to summarize lecture notes",
  "I'm drafting a launch brief",
  "I'm preparing for an interview",
  "I need to organize meeting notes",
  "I'm brainstorming a product idea",
];

const SKELETON_WIDTH_CLASSES = ["w-4/5", "w-3/5", "w-[90%]", "w-[55%]", "w-[70%]"];

// ─── Component ───────────────────────────────────────────────────────────────
export default function OnboardingStartPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("prompt");
  const [intent, setIntent] = useState("");
  const [scaffold, setScaffold] = useState(SCAFFOLDS.default);

  const handleSubmit = () => {
    if (!intent.trim()) return;
    const detected = detectScaffold(intent);
    setScaffold(detected);
    setScreen("generating");

    // Simulate AI generation delay
    setTimeout(() => setScreen("result"), 1800);
  };

  const handleSkip = () => router.push("/documents");

  const handleOpenEditor = () => {
    // In production this would navigate to the created document.
    // For the prototype we just go to the documents area.
    router.push("/documents");
  };

  return (
    <div className="flex min-h-[calc(100vh-48px)] flex-col items-center justify-center px-4">
      {screen === "prompt" && (
        <PromptScreen
          intent={intent}
          onIntentChange={setIntent}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
        />
      )}
      {screen === "generating" && (
        <GeneratingScreen intent={intent} />
      )}
      {screen === "result" && (
        <ResultScreen
          intent={intent}
          scaffold={scaffold}
          onOpen={handleOpenEditor}
          onReset={() => setScreen("prompt")}
        />
      )}
    </div>
  );
}

// ─── Screen: Prompt ───────────────────────────────────────────────────────────
function PromptScreen({
  intent,
  onIntentChange,
  onSubmit,
  onSkip,
}: {
  intent: string;
  onIntentChange: (v: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="w-full max-w-xl space-y-6">
      {/* Brand badge */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
          <Sparkles className="h-3.5 w-3.5" />
          AI-powered start
        </span>
      </div>

      {/* Heading */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">What are you working on?</h1>
        <p className="text-sm text-muted-foreground">
          Describe it in plain language — Noted will create a structured starter document for you.
        </p>
      </div>

      {/* Input */}
      <Textarea
        value={intent}
        onChange={(e) => onIntentChange(e.target.value)}
        placeholder="e.g. I need to prepare for a job interview next week"
        className="min-h-[100px] resize-none text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
        }}
        autoFocus
      />

      {/* Example prompts */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => onIntentChange(p)}
              className="rounded-sm border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onSkip}
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <SkipForward className="h-3.5 w-3.5" />
          Skip and start blank
        </button>

        <Button
          onClick={onSubmit}
          disabled={!intent.trim()}
          className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
        >
          Create my starter doc
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        ⌘ + Enter to submit
      </p>
    </div>
  );
}

// ─── Screen: Generating ───────────────────────────────────────────────────────
function GeneratingScreen({ intent }: { intent: string }) {
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
      {/* Animated pulse ring */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-20 dark:bg-blue-500" />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
          <Sparkles className="h-5 w-5" />
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Creating your starter document…</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Based on: <span className="italic text-foreground">&ldquo;{intent}&rdquo;</span>
        </p>
      </div>

      {/* Skeleton preview */}
      <div className="w-full space-y-3 rounded-lg border border-border bg-muted/30 p-5">
        {SKELETON_WIDTH_CLASSES.map((widthClass) => (
          <div
            key={widthClass}
            className={cn("h-3 animate-pulse rounded-sm bg-muted", widthClass)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Screen: Result ───────────────────────────────────────────────────────────
function ResultScreen({
  intent,
  scaffold,
  onOpen,
  onReset,
}: {
  intent: string;
  scaffold: { title: string; sections: string[] };
  onOpen: () => void;
  onReset: () => void;
}) {
  return (
    <div className="w-full max-w-xl space-y-5">
      {/* Badge */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground">
          Document ready
        </span>
      </div>

      <div className="space-y-1 text-center">
        <h2 className="text-xl font-semibold">{scaffold.title}</h2>
        <p className="text-sm text-muted-foreground">
          Structured from: <span className="italic">&ldquo;{intent}&rdquo;</span>
        </p>
      </div>

      {/* Document preview card */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{scaffold.title}</span>
        </div>
        <div className="space-y-3">
          {scaffold.sections.map((section, i) => (
            <div key={section} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium">{section}</span>
              </div>
              <div
                className={cn(
                  "ml-5 h-2.5 animate-none rounded-sm bg-muted",
                  i % 2 === 0 ? "w-3/4" : "w-1/2",
                )}
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Each section is ready to fill in — or use{" "}
          <span className="font-medium text-blue-600 dark:text-blue-400">/Ask AI</span> inside the editor.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={onOpen}
          className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          Open in editor
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
          Start over with a different description
        </Button>
      </div>
    </div>
  );
}
