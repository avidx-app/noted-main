"use client";

import { ChevronRight, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Scaffold } from "@/lib/onboarding-scaffolds";

// ─── Screen: Result ───────────────────────────────────────────────────────────
export function ResultScreen({
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
