"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SKELETON_WIDTH_CLASSES } from "@/lib/onboarding-scaffolds";

// ─── Screen: Generating ───────────────────────────────────────────────────────
export function GeneratingScreen({ intent }: { intent: string }) {
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
