export const Heroes = () => {
  return (
    <div className="relative mt-12 w-full max-w-6xl px-4 sm:px-6">
      {/* Main Hero Image Container - App Preview */}
      <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-800">
        {/* Browser-like header */}
        <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div className="ml-4 flex-1 rounded-md bg-neutral-100 px-4 py-1.5 text-xs text-neutral-500 dark:bg-neutral-800">
            wellnoted.dev
          </div>
        </div>

        {/* App Preview */}
        <div className="flex min-h-[420px] flex-col lg:flex-row">
          {/* Sidebar - matches actual Navigation.tsx */}
          <div className="w-full border-b border-neutral-200 bg-secondary p-3 lg:w-64 lg:border-b-0 lg:border-r dark:border-neutral-700">
            {/* User Item */}
            <div className="mb-3 flex items-center gap-2 rounded-md px-2 py-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-neutral-300 text-xs font-medium dark:bg-neutral-600">
                J
              </div>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                John&apos;s Noted
              </span>
            </div>

            {/* Menu Items */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-primary/5">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>Search</span>
                <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground dark:bg-neutral-700">
                  ⌘K
                </kbd>
              </div>
              <div className="flex items-center gap-2 rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-primary/5">
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
                    d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>New page</span>
              </div>
            </div>

            {/* Document List */}
            <div className="mt-4 space-y-0.5">
              <div className="flex items-center gap-1 rounded-md bg-primary/5 px-2 py-1 text-sm text-primary">
                <svg
                  className="h-4 w-4 text-muted-foreground/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                <span className="text-lg">🚀</span>
                <span>Project Tracker</span>
              </div>
              <div className="flex items-center gap-1 rounded-md py-1 pl-6 pr-2 text-sm text-muted-foreground hover:bg-primary/5">
                <svg
                  className="h-4 w-4 text-muted-foreground/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="text-lg">📋</span>
                <span>Tasks</span>
              </div>
              <div className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-primary/5">
                <svg
                  className="h-4 w-4 text-muted-foreground/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="text-lg">📝</span>
                <span>Meeting Notes</span>
              </div>
              <div className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-primary/5">
                <svg
                  className="h-4 w-4 text-muted-foreground/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="text-lg">💡</span>
                <span>Ideas</span>
              </div>
            </div>

            {/* Trash */}
            <div className="mt-4">
              <div className="flex items-center gap-2 rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-primary/5">
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>Trash</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {/* Cover Image */}
            <div className="h-24 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 sm:h-28" />

            {/* Document Content */}
            <div className="px-6 py-8 sm:px-10 lg:px-16">
              {/* Icon */}
              <div className="mb-2 text-left text-5xl sm:text-6xl">🚀</div>

              {/* Title - left aligned */}
              <h1 className="mb-6 text-left text-3xl font-bold text-[#3F3F3F] sm:text-4xl dark:text-[#CFCFCF]">
                Project Tracker
              </h1>

              {/* Realistic content - paragraph text, left aligned */}
              <div className="space-y-4 text-left text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                <p>
                  Track all your projects in one place. Use this page to manage
                  tasks, deadlines, and team collaboration.
                </p>

                {/* Table - matches BlockNote/Mantine table styling */}
                <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-800">
                      <tr>
                        <th className="border-b border-neutral-200 px-4 py-2.5 font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
                          Task
                        </th>
                        <th className="border-b border-neutral-200 px-4 py-2.5 font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
                          Status
                        </th>
                        <th className="border-b border-neutral-200 px-4 py-2.5 font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
                          Due
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-neutral-100 dark:border-neutral-700">
                        <td className="px-4 py-2.5">Design landing page</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Done
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-neutral-500">Dec 1</td>
                      </tr>
                      <tr className="border-b border-neutral-100 dark:border-neutral-700">
                        <td className="px-4 py-2.5">Build API endpoints</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            In Progress
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-neutral-500">Dec 5</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">Write documentation</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
                            Not Started
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-neutral-500">Dec 10</td>
                      </tr>
                    </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
