---
name: file-naming
description: File and directory naming conventions for noted-main — kebab-case files (e.g., `coworker-message.tsx`), camelCase Convex modules (e.g., `aiSettings.ts`), kebab-case directories, and PascalCase component exports. Use when creating any new TypeScript file, React component, hook, test, or directory; when asked "how should I name this file"; or when reviewing a PR for naming consistency. Applies implicitly whenever creating new files as part of any feature implementation.
summary: kebab-case files, PascalCase exports
---

<!--
Adapted from heatseeker-next/.ai/skills/file-naming/SKILL.md
MAJOR adaptation: heatseeker uses camelCase.dot.separated.ts (e.g.,
`get.experiment.dal.ts`); noted uses kebab-case throughout, with one
exception (Convex modules under convex/ are camelCase to match the
generated api object). Examples grounded in real noted files.
-->

# File Naming

Two rules cover ~95% of cases:

1. **Files and directories: kebab-case.** `coworker-message.tsx`, `cover-image-modal.tsx`, `use-search.tsx`, `_components/`, `(routes)/`.
2. **Component exports: PascalCase.** A file named `coworker-message.tsx` exports `CoworkerMessage`.

The exception: **`convex/<name>.ts` is camelCase**, because Convex's generated API surface uses the file name verbatim (`api.aiSettings.getSettings`, `api.coworkerMessages.getMessages`). Switching that to kebab-case would force ugly bracket access at every call site.

## File-name patterns

| What | File name | Export name | Real example |
|---|---|---|---|
| React component | `kebab-case.tsx` | `PascalCase` | `coworker-message.tsx` → `CoworkerMessage` |
| shadcn primitive (`components/ui/`) | `kebab-case.tsx` | `PascalCase` | `alert-dialog.tsx` → `AlertDialog` |
| Custom hook | `use-<thing>.tsx` or `use-<thing>.ts` | `useThing` | `use-search.tsx` → `useSearch` |
| Convex handler module | `camelCase.ts` | per-handler | `aiSettings.ts`, `coworkerMessages.ts` |
| Convex action module | `<domain>Actions.ts` (camelCase + `"use node"`) | per-handler | `aiSettingsActions.ts` |
| Util / library code | `kebab-case.ts` | named exports | `lib/analytics.ts`, `lib/ai-models.ts` |
| Pure helper colocated with a component | `<feature>.utils.ts` | named exports | `coworker-panel.utils.ts` |
| Test (colocated) | `<source>.test.ts(x)` | n/a | `button.test.tsx`, `analytics.test.ts` |
| Next.js special files | reserved names — don't rename | n/a | `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts` |

## Directory-name patterns

```
components/                     # kebab-case for everything
├── ui/                         # shadcn primitives
├── coworker/                   # feature folder — ALL kebab-case
│   ├── coworker-chat.tsx
│   ├── coworker-message.tsx
│   └── coworker-floating-chat.tsx
├── modals/
└── providers/

hooks/                          # all hooks live flat here
├── use-search.tsx
├── use-cover-image.tsx
└── use-search.test.ts

app/                            # Next.js App Router
├── (landing)/                  # parenthesized = route group, kebab inside
│   ├── _components/            # underscore = private subtree
│   ├── features/
│   │   └── ai-writing/
│   └── page.tsx
├── (main)/(routes)/documents/[documentId]/page.tsx
└── api/<route>/route.ts

convex/                         # camelCase files (Convex generated API)
├── documents.ts
├── aiSettings.ts
├── aiSettingsActions.ts
├── coworkerMessages.ts
└── schema.ts

lib/                            # kebab-case
├── analytics.ts
├── ai-models.ts
├── utils.ts
└── agent/
    ├── prompts/squad-prompts.ts
    └── tools/workspace.ts
```

## Naming a new file — the decision tree

```
Is the file under convex/?
  └─ YES → camelCase.ts (matches the table/domain noun, plural)
           e.g., a new "comments" feature → convex/comments.ts

Is the file a React component?
  └─ YES → kebab-case.tsx, PascalCase export
           e.g., the AI suggestion banner → components/ai-suggestion-banner.tsx
                 export const AiSuggestionBanner = ...

Is the file a custom hook?
  └─ YES → hooks/use-<thing>.tsx, useThing export
           e.g., a hook for current document → hooks/use-current-document.tsx
                 export const useCurrentDocument = ...

Is the file a Next.js special file?
  └─ YES → use the reserved name literally (page.tsx, layout.tsx, etc.)

Is the file a colocated util?
  └─ YES → <feature>.utils.ts next to the component
           e.g., coworker-panel.utils.ts

Is the file a colocated test?
  └─ YES → <source>.test.ts (or .test.tsx for components)

Otherwise (shared lib code):
  └─ kebab-case.ts in lib/
     e.g., lib/analytics.ts, lib/ai-models.ts
```

## What to put in `<feature>.utils.ts` vs `lib/`

- **`<feature>.utils.ts` next to the component** — if only one component (or a tightly scoped pair) uses it. e.g., `coworker-panel.utils.ts` exports formatters used only by the coworker panel.
- **`lib/<thing>.ts`** — if reused across two or more unrelated features, or it's an app-wide concern. e.g., `lib/analytics.ts`, `lib/utils.ts` (the `cn()` helper).

## Component file structure (when a component grows)

```
components/coworker/
├── coworker-panel.tsx            # main entry point
├── coworker-message.tsx          # extracted subcomponent
├── coworker-empty-state.tsx
├── coworker-skeleton.tsx
├── coworker-input.tsx
├── coworker-panel.utils.ts       # pure helpers (parsers, formatters)
├── coworker-panel.utils.test.ts
└── coworker-message.test.tsx
```

There is **no `index.tsx` barrel** in noted's component folders — each consumer imports the specific file. Barrels add re-exports without adding anything else and are easy to drift out of sync.

## Anti-patterns

```
❌ camelCase or PascalCase for non-Convex files
   components/CoworkerMessage.tsx
   components/coworkerMessage.tsx
✅ kebab-case
   components/coworker-message.tsx

❌ snake_case anywhere
   components/coworker_message.tsx
   convex/ai_settings.ts

❌ kebab-case for a Convex module — breaks the generated API surface
   convex/ai-settings.ts        // api['ai-settings'] — gross
✅ camelCase
   convex/aiSettings.ts         // api.aiSettings.getSettings

❌ heatseeker-style camelCase.dot.separated for noted
   components/coworker.message.tsx
   convex/get.settings.ts
✅ kebab-case (or camelCase under convex/)

❌ a lib file pretending to be a component file
   components/format-document-title.ts
✅ pure helpers go in lib/
   lib/format-document-title.ts

❌ tests in a separate __tests__/ folder
   components/__tests__/coworker-message.test.tsx
✅ colocated next to the source
   components/coworker/coworker-message.test.tsx

❌ hook file outside hooks/
   components/use-search.tsx
✅ all custom hooks live in hooks/
   hooks/use-search.tsx
```

## Quick reference card

| Folder | File pattern |
|---|---|
| `app/**` | Next.js conventions (`page.tsx`, `layout.tsx`, etc.); private subtrees `_components/`, `_lib/` |
| `components/**` | kebab-case `.tsx`; PascalCase exports |
| `components/ui/**` | shadcn primitives — kebab-case `.tsx`; do not modify the existing variants |
| `convex/**` | camelCase `.ts`; `<domain>Actions.ts` for `"use node"` files |
| `hooks/**` | `use-<thing>.tsx` (or `.ts`); `useThing` export |
| `lib/**` | kebab-case `.ts`; named exports |
| Tests | `<source>.test.ts(x)` colocated next to source |

## Checklist for a new file

- [ ] Filename matches the convention for its folder (kebab-case everywhere except `convex/`)
- [ ] If it's a component, the export name is PascalCase and matches the file (`coworker-message.tsx` → `CoworkerMessage`)
- [ ] If it's a hook, file is `use-<thing>` and the export is `useThing`
- [ ] If it's a Convex module, file is camelCase and matches the table or domain noun
- [ ] Tests are colocated as `<source>.test.ts(x)`, never in a separate `__tests__/`
- [ ] No barrel `index.ts(x)` was added — consumers import the specific file
