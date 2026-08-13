---
name: event-tracking
description: Amplitude event tracking conventions for noted-main — major user-facing features and key interactions must have analytics events. Use when building new features, pages, or significant UI flows. Also use when adding primary CTAs, form submissions, feature activations, or destructive actions. Applies implicitly whenever creating or modifying major UI features — analytics coverage on key actions is always required, even if not directly requested.
summary: Amplitude event conventions
---

<!--
Adapted from heatseeker-next/.ai/skills/amplitude-analytics/SKILL.md
Noted-specific adjustments:
- Examples re-grounded in noted's surface (Document Created, AI Settings
  Updated, Coworker Message Sent, Squad Agent Used, etc.)
- Convenience helpers expected at lib/analytics.ts (does not yet exist —
  this skill defines the convention; first call site should create the file)
- No workspace_id auto-enrichment (noted is single-tenant per Clerk user);
  identity comes from Clerk's userId via the Amplitude SDK
- Removed chat-core / ChatAnalyticsCallbacks reference (noted-specific
  AI surface differs)

NOTE: Wiring Amplitude into noted itself is a Wave 2 PR. This skill
defines the convention so that first wiring PR can install the SDK +
lib/analytics.ts and then immediately follow these rules.
-->

# Event Tracking — Amplitude

**Rule: Track decisions and outcomes, not every click.** Major features and key user interactions must have Amplitude events — but don't over-instrument trivial UI.

> **Status**: this skill defines the convention. The first PR to install Amplitude in `noted-main` (Wave 2 of the Vibe PM course adaptation) will create `lib/analytics.ts` with the `trackPageEvent` / `logAmplitudeEvent` helpers described below. Until then, the call sites referenced here are aspirational — they describe what the conventions WILL be once the SDK is wired up.

## What to track vs. what to skip

### DO track (meaningful user intent)

| Category | Examples for noted |
|---|---|
| **Page views** on key pages | `Documents Page Viewed`, `Settings Page Viewed`, `Public Document Viewed` |
| **Primary CTAs & feature activations** | `Document Created`, `Document Published`, `AI Settings Updated`, `Coworker Conversation Started` |
| **Feature adoption moments** | `AI Inline Suggestion Accepted`, `Cover Image Added`, `Squad Agent Created`, `Document Icon Set` |
| **Form submissions** (start + completion) | `Onboarding Completed`, `AI Provider Configured` |
| **Destructive actions** | `Document Archived`, `Document Restored`, `Document Permanently Deleted`, `Squad Agent Deleted` |
| **Sharing & collaboration** | `Document Published To Web`, `Document Unpublished`, `Public Link Copied` |
| **AI flow events** | `AI Chat Message Sent`, `AI Provider Tested`, `Squad Agent Used`, `In-Editor AI Triggered` |
| **Errors that block the user** | `Document Save Failed`, `AI Provider Connection Failed`, `File Upload Failed` |
| **Navigation between major sections** | `Sidebar Document Selected`, `Settings Tab Switched` |

### DON'T track (noise)

- Every button, toggle, or checkbox interaction
- Hover, focus, blur, scroll events
- Intermediate form field changes (track the submission, not each keystroke)
- Sidebar expand/collapse
- Tooltip views
- Minor UI state changes (modal open/close that's purely transient)
- Editor keystrokes (track `Document Saved` on auto-save, not every typed character)

**Rule of thumb**: if you wouldn't build a dashboard chart from the event, don't track it.

## Core utilities (target shape)

| Import | From | Purpose |
|---|---|---|
| `logAmplitudeEvent` | `@/lib/analytics` | Track any event (auto-enriches with user, page props) |
| `trackPageEvent` | `@/lib/analytics` | Track page-scoped events (auto-adds `page_name`) |
| `AmplitudeEventProperties` | `@/lib/analytics` | Type for event properties |
| `isAmplitudeDisabled` | `@/lib/analytics` | Check if SDK is initialized (for conditional analytics-side-effects) |

You do NOT need to manually pass `user_id`, page URL, or timestamp — `logAmplitudeEvent` handles all of that automatically once the SDK is wired up alongside Clerk's `useUser`.

**Local/preview environments**: when `NEXT_PUBLIC_AMPLITUDE_API_KEY` is not set, the SDK is not initialized and all events are silently dropped. No console warnings, no network requests. Use `isAmplitudeDisabled()` if you need to skip analytics-related side effects (e.g., a "share-after-track" flow).

## How to add a new event

### Step 1: Add a convenience tracking function in `lib/analytics.ts`

```typescript
// Document Published
export const trackDocumentPublished = (
    properties: Required<Pick<AmplitudeEventProperties, 'document_id' | 'document_title'>>,
) => trackPageEvent('Document Published', properties);
```

- Event string: `[Subject] [Past Tense Verb]` in Title Case (e.g., `Document Published`, not `Publish Document` or `document published`).
- Function name: `track[Subject][PastVerb]` (e.g., `trackDocumentPublished`).
- Prefer a single event with discriminating properties over multiple events for variants of the same action. Example: one `Sharing Toggled` event with `{ enabled: boolean }` instead of `Document Published` + `Document Unpublished`.
- Use `trackPageEvent` for page-scoped events (most events).
- Use `logAmplitudeEvent` directly only when you need full control.
- Always type required properties with `Required<Pick<AmplitudeEventProperties, ...>>`.

### Step 2: If new properties are needed, extend `AmplitudeEventProperties`

In `lib/analytics.ts`, add the new property to the interface:

```typescript
export interface AmplitudeEventProperties {
    // ... existing properties

    /** Convex document ID */
    document_id?: string;
    /** Plain-text document title at time of event */
    document_title?: string;
    /** AI provider in use (openai | anthropic | google) */
    ai_provider?: string;
    /** Squad agent ID, when relevant */
    squad_agent_id?: string;
    /** New property — describe what this tracks */
    new_property?: string;
}
```

### Step 3: Call the tracking function from the event handler

```typescript
import { trackDocumentPublished } from '@/lib/analytics';

async function handlePublish() {
    // Business logic first
    await publishMutation({ id: doc._id });
    toast.success('Published');

    // Track the event — fire and forget (no await in handlers)
    trackDocumentPublished({
        document_id: doc._id,
        document_title: doc.title,
    });
}
```

## Rules

1. **Track in event handlers, not in `useEffect`.** Analytics calls go in `onClick`, `onSubmit`, `onChange`, mutation `onSuccess`, etc. — never in effects that sync state. See the `effect-to-event` skill for the broader pattern.

2. **Fire and forget.** Do not `await` tracking calls in UI handlers — they must never block the user interaction.

3. **Use existing convenience functions** before creating new ones. Check `lib/analytics.ts` for what already exists.

4. **Event naming convention**: `[Subject] [Past Tense Verb]` in **Title Case** — e.g., `Document Created`, `AI Provider Tested`, `Coworker Conversation Started`, `Squad Agent Deleted`. Function names follow `track[Subject][PastVerb]` — e.g., `trackDocumentCreated`, `trackAIProviderTested`.

5. **Always include identifying context.** Pass relevant IDs so events can be joined in Amplitude:
    - `document_id` for document-related events
    - `ai_provider` for AI-flow events
    - `squad_agent_id` for squad-agent events
    - `parent_document_id` when an action involves the document hierarchy
    - Any other domain-specific identifier

6. **Do NOT manually pass** `user_id`, `page_url`, `page_path`, `page_title`, `timestamp`, or environment metadata — these are auto-enriched.

7. **Do NOT track sensitive content.** Never put document body text, AI conversation contents, file contents, or PII into event properties. Track that the action happened and which artifact it happened on (by ID); never the artifact's contents.

8. **Server-side events** (from Convex actions or Next.js API routes) use a separate server-side Amplitude HTTP API call rather than the browser SDK. The convention is the same — same naming, same property shapes — but the wiring goes through a server-side helper that the Wave 2 PR will install.

## Noted-specific event catalog (seed list)

This is the working list of events to track. The Wave 2 wiring PR populates `lib/analytics.ts` with convenience functions for each. Add to this list as new features land.

### Documents

- `Document Created` — `{ document_id, parent_document_id? }`
- `Document Renamed` — `{ document_id, old_title_length, new_title_length }` (length, never content)
- `Document Saved` — `{ document_id }` (fired on auto-save batch, not every keystroke)
- `Document Archived` — `{ document_id, has_children: boolean }`
- `Document Restored` — `{ document_id }`
- `Document Permanently Deleted` — `{ document_id }`
- `Document Published` — `{ document_id, document_title }`
- `Document Unpublished` — `{ document_id }`
- `Public Link Copied` — `{ document_id }`
- `Cover Image Added` — `{ document_id }`
- `Cover Image Removed` — `{ document_id }`
- `Document Icon Set` — `{ document_id }`

### AI features

- `AI Settings Updated` — `{ ai_provider, model_changed: boolean }`
- `AI Provider Tested` — `{ ai_provider, success: boolean }`
- `AI Provider Connection Failed` — `{ ai_provider, error_category }` (category, not raw error message)
- `In-Editor AI Triggered` — `{ document_id, ai_provider, mode }` (mode = `ask` | `edit` | `continue`)
- `In-Editor AI Suggestion Accepted` — `{ document_id, ai_provider }`
- `In-Editor AI Suggestion Rejected` — `{ document_id, ai_provider }`
- `Coworker Conversation Started` — `{ document_id?, ai_provider }`
- `Coworker Message Sent` — `{ ai_provider, message_length_bucket }` (bucket = `<100` | `100-500` | `500+`)
- `Squad Agent Created` — `{ squad_agent_id }`
- `Squad Agent Used` — `{ squad_agent_id, document_id? }`
- `Squad Agent Deleted` — `{ squad_agent_id }`

### Files

- `File Uploaded` — `{ document_id, file_size_bucket, mime_category }` (size = `<1mb` | `1-10mb` | `10mb+`; mime = `image` | `pdf` | `other`)
- `File Upload Failed` — `{ document_id, error_category }`
- `File Deleted` — `{ document_id }`

### Onboarding & navigation

- `Onboarding Completed` — `{}`
- `Documents Page Viewed` — `{}`
- `Settings Page Viewed` — `{}`
- `Public Document Viewed` — `{ document_id }`

### Errors that block the user

- `Document Save Failed` — `{ document_id, error_category }`
- `Sign Up Rejected` — `{ reason_category }`

## Anti-patterns

```typescript
// BAD: tracking in useEffect
useEffect(() => {
    if (isOpen) {
        logAmplitudeEvent('Modal Opened', {});
    }
}, [isOpen]);

// GOOD: track in the handler that triggers the state change
function handleOpenModal() {
    setIsOpen(true);
    logAmplitudeEvent('Coworker Conversation Started', { document_id });
}
```

```typescript
// BAD: passing user/page context manually
logAmplitudeEvent('Document Published', {
    user_id: user.id,        // Auto-enriched — don't pass
    page_url: window.location.href, // Auto-enriched — don't pass
});

// GOOD: only pass domain-specific properties
logAmplitudeEvent('Document Published', {
    document_id: doc._id,
    document_title: doc.title,
});
```

```typescript
// BAD: untyped event with inline string, wrong casing
logAmplitudeEvent('document published', { id: '123' });

// BAD: imperative / non-past-tense
logAmplitudeEvent('Publish Document', { document_id });

// BAD: tracking sensitive content
logAmplitudeEvent('Document Saved', {
    document_id,
    body: doc.content, // NEVER. Don't put document content into events.
});

// BAD: multiple events for the same action with different states
trackDocumentPublished(props);
trackDocumentUnpublished(props);

// GOOD: single event with discriminating properties
logAmplitudeEvent('Sharing Toggled', { document_id, enabled: true });
```

```typescript
// BAD: over-instrumenting trivial UI
logAmplitudeEvent('Tooltip Hovered', {});
logAmplitudeEvent('Sidebar Collapsed', {});
logAmplitudeEvent('Editor Keystroke', { char: 'a' });

// GOOD: track the meaningful outcome
logAmplitudeEvent('Document Saved', { document_id });
```

## Checklist for new features

Before marking a feature complete, verify:

- [ ] Key page has a page view event
- [ ] Primary CTAs / feature activations are tracked
- [ ] Form submissions are tracked (with success/failure where relevant)
- [ ] Destructive actions (delete, archive, unpublish) are tracked
- [ ] Sharing actions are tracked
- [ ] AI flow events tracked with `ai_provider` property where relevant
- [ ] Convenience tracking function added to `lib/analytics.ts`
- [ ] New properties (if any) added to `AmplitudeEventProperties` interface
- [ ] Events fire from event handlers, not `useEffect`
- [ ] No sensitive content (document text, AI conversation, PII) in properties
- [ ] Domain-specific IDs included in properties
