"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { detectScaffold, SCAFFOLDS } from "@/lib/onboarding-scaffolds";
import { PromptScreen } from "./_components/prompt-screen";
import { GeneratingScreen } from "./_components/generating-screen";
import { ResultScreen } from "./_components/result-screen";

/** The prototype is a three-step state machine and nothing else. */
type Screen = "prompt" | "generating" | "result";

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
