"use client";

import { ArrowRight } from "lucide-react";

const features = [
  {
    title: "Write and organize",
    subtitle: "Your thoughts, your way",
    description:
      "A powerful block-based editor that adapts to how you think. Create documents, take notes, and build your personal knowledge base—all in one place.",
    highlights: ["Block-based editor", "Nested pages", "Custom icons"],
    mockup: (
      <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
        {/* Document with toolbar - matches toolbar.tsx */}
        <div className="p-6">
          {/* Icon */}
          <div className="mb-2 text-5xl">📝</div>
          {/* Title - matches the 5xl bold style */}
          <div className="mb-4 text-4xl font-bold text-[#3F3F3F] dark:text-[#CFCFCF]">
            Meeting Notes
          </div>
          {/* Add icon / Add cover buttons - matches toolbar.tsx */}
          <div className="mb-4 flex gap-2">
            <button className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground">
              <span>😊</span> Add icon
            </button>
            <button className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground">
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Add cover
            </button>
          </div>
          {/* Editor blocks */}
          <div className="space-y-2 text-neutral-600 dark:text-neutral-400">
            <div className="flex items-start gap-2">
              <span className="text-neutral-400">•</span>
              <span>Discuss Q4 roadmap priorities</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-neutral-400">•</span>
              <span>Review team feedback</span>
            </div>
            <div className="mt-3 rounded-md border-l-4 border-amber-400 bg-amber-50 p-2 text-sm dark:bg-amber-900/20">
              💡 Action item: Follow up with design team
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Find anything instantly",
    subtitle: "Search that just works",
    description:
      "Never lose a thought again. Press ⌘K to quickly search and find any document in seconds, no matter how large your workspace grows.",
    highlights: ["⌘K shortcut", "Instant results", "Document icons"],
    mockup: (
      <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
        {/* Search Command Dialog - matches search-command.tsx */}
        <div className="border-b border-neutral-100 p-4 dark:border-neutral-700">
          <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3">
            <svg
              className="h-5 w-5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-neutral-500">Search John&apos;s Noted..</span>
          </div>
        </div>
        {/* Results - matches CommandItem with document icons */}
        <div className="p-2">
          <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">
            Documents
          </div>
          {[
            { icon: "📋", title: "Project Roadmap" },
            { icon: "📚", title: "Reading List" },
            { icon: "💡", title: "Ideas & Inspiration" },
            { icon: "📝", title: "Meeting Notes" },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${i === 0 ? "bg-primary/5" : "hover:bg-primary/5"}`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm text-neutral-700 dark:text-neutral-200">
                {item.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Share with the world",
    subtitle: "Publish in one click",
    description:
      "Turn any document into a public page. Share your notes, guides, or portfolio with a simple link—no coding required.",
    highlights: ["Public pages", "Shareable links", "Real-time updates"],
    mockup: (
      <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
        {/* Publish UI */}
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                My Portfolio
              </span>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              Live
            </span>
          </div>

          <div className="mb-4 rounded-lg border bg-muted/50 p-4">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              Public URL
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <code className="block w-full max-w-full overflow-x-auto rounded bg-background px-3 py-2 text-sm font-mono break-all">
                wellnoted.dev/preview/abc123
              </code>
              <button className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white sm:w-auto">
                Copy
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>Anyone with the link can view</span>
          </div>
        </div>
      </div>
    ),
  },
];

export const Features = () => {
  return (
    <section className="w-full py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`flex flex-col items-center gap-10 py-16 md:gap-14 lg:flex-row lg:gap-20 ${
              index % 2 === 1 ? "lg:flex-row-reverse" : ""
            } ${index !== features.length - 1 ? "border-b border-neutral-100 dark:border-neutral-800" : ""}`}
          >
            {/* Text Content */}
            <div className="flex-1 space-y-5 sm:space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {feature.subtitle}
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl dark:text-white">
                  {feature.title}
                </h2>
              </div>
              <p className="text-base leading-relaxed text-neutral-600 sm:text-lg dark:text-neutral-400">
                {feature.description}
              </p>
              <div className="flex flex-wrap gap-3">
                {feature.highlights.map((highlight, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-neutral-100 px-4 py-1.5 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
              <a
                href="#"
                className="inline-flex items-center gap-2 text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <span className="font-medium">Learn more</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Mockup */}
            <div className="flex-1 w-full max-w-xl sm:max-w-2xl lg:max-w-none">{feature.mockup}</div>
          </div>
        ))}
      </div>
    </section>
  );
};
