"use client";

import { Sparkles, ArrowRight, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EXAMPLE_PROMPTS } from "@/lib/onboarding-scaffolds";

// ─── Screen: Prompt ───────────────────────────────────────────────────────────
export function PromptScreen({
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
