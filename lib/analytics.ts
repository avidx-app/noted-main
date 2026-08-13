/**
 * Amplitude analytics for noted.
 *
 * The SDK is initialized once (at app boot) by AmplitudeProvider, and the
 * Clerk identity is set whenever it changes. Everything else in the app
 * just calls one of the convenience track* helpers below.
 *
 * If `NEXT_PUBLIC_AMPLITUDE_API_KEY` is not set (local dev, preview, CI),
 * the SDK is never initialized and every event call is silently dropped —
 * no console warnings, no network requests. Use `isAmplitudeDisabled()`
 * if you need to gate analytics-related side effects on whether tracking
 * is actually enabled.
 *
 * Conventions are documented in `.ai/skills/event-tracking/SKILL.md`.
 */

import * as amplitude from "@amplitude/analytics-browser";

/**
 * Properties any noted event can carry.
 *
 * Add new fields here when introducing a new event. Keep names snake_case
 * to match the Amplitude convention. Never put document text, AI
 * conversation contents, file contents, or PII into these fields.
 */
export interface AmplitudeEventProperties {
    /** Convex document ID. */
    document_id?: string;
    /** Plain-text document title at time of event. */
    document_title?: string;
    /** Convex parent document ID, when the action involves the hierarchy. */
    parent_document_id?: string;
    /** Whether the archived/restored doc had any children. */
    has_children?: boolean;

    /** AI provider in use (`openai` | `anthropic` | `google`). */
    ai_provider?: string;
    /** Model name within the provider. */
    ai_model?: string;
    /** Whether the active model changed in this update. */
    model_changed?: boolean;
    /** Outcome of an external connectivity check. */
    success?: boolean;
    /** Coarse-grained category of an error (NOT the raw message). */
    error_category?: string;
    /** Bucketed length of a chat message (`<100` | `100-500` | `500+`). */
    message_length_bucket?: string;
    /** In-editor AI mode (`ask` | `edit` | `continue`). */
    mode?: string;

    /** Squad agent ID, when relevant. */
    squad_agent_id?: string;

    /** File MIME category (`image` | `pdf` | `other`). */
    mime_category?: string;
    /** File size bucket (`<1mb` | `1-10mb` | `10mb+`). */
    file_size_bucket?: string;

    /** Page name for page-scoped events — auto-set by `trackPageEvent`. */
    page_name?: string;

    /** Generic toggle outcome — used for `Sharing Toggled`-style events. */
    enabled?: boolean;
    /** User-selected theme preference (`light` | `dark` | `system`). */
    theme?: string;
    /** Landing feature slug or display name. */
    feature_name?: string;
    /** Link or CTA destination path/URL. */
    destination_path?: string;
    /** CTA label, when tracking a specific button/link. */
    cta_label?: string;
    /** Explicit route path for page visit events. */
    page_path?: string;
    /** Feature flag key that influenced the surfaced experience. */
    feature_flag_key?: string;
    /** Variant served for the flagged experience. */
    feature_flag_variant?: string;
}

const AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

let initialized = false;

/**
 * Initialize the Amplitude SDK. Idempotent — safe to call multiple times.
 * Called once from `AmplitudeProvider` at app boot.
 */
export function initAmplitude(): void {
    if (initialized) return;
    if (typeof window === "undefined") return;
    if (!AMPLITUDE_API_KEY) return;

    amplitude.init(AMPLITUDE_API_KEY, {
        autocapture: {
            attribution: true,
            pageViews: true,
            sessions: true,
            elementInteractions: false,
        },
        defaultTracking: false,
        logLevel: amplitude.Types.LogLevel.None,
    });

    initialized = true;
}

/**
 * Set the Amplitude user ID to the Clerk user ID. Called by
 * `AmplitudeProvider` whenever the Clerk identity changes.
 */
export function identifyAmplitudeUser(
    userId: string | null | undefined,
    traits?: { email?: string; firstName?: string },
): void {
    if (isAmplitudeDisabled()) return;

    if (!userId) {
        amplitude.reset();
        return;
    }

    amplitude.setUserId(userId);

    if (traits) {
        const identify = new amplitude.Identify();
        if (traits.email) identify.set("email_domain", traits.email.split("@")[1] ?? "");
        if (traits.firstName) identify.set("first_name", traits.firstName);
        amplitude.identify(identify);
    }
}

/**
 * `true` when the SDK is not initialized (no API key, server-side render,
 * etc.) — events are being silently dropped. Useful for skipping
 * analytics-related side effects.
 */
export function isAmplitudeDisabled(): boolean {
    return !initialized;
}

/**
 * Track an event. Most callers should use one of the convenience track*
 * helpers below instead — reach for this directly only when no helper
 * fits.
 */
export function logAmplitudeEvent(
    eventName: string,
    properties: AmplitudeEventProperties = {},
): void {
    if (isAmplitudeDisabled()) return;
    amplitude.track(eventName, properties as Record<string, unknown>);
}

/**
 * Track a page-scoped event. Auto-adds `page_name` from `document.title`
 * at call time so dashboards can group events by page without each call
 * site having to pass it.
 */
export function trackPageEvent(
    eventName: string,
    properties: AmplitudeEventProperties = {},
): void {
    if (isAmplitudeDisabled()) return;
    const pageName =
        typeof document !== "undefined" ? document.title : undefined;
    logAmplitudeEvent(eventName, { ...properties, page_name: pageName });
}

/* ============================================================
 * Convenience track* helpers — add a new one whenever introducing
 * a new event. Names follow `track[Subject][PastVerb]`.
 * ============================================================ */

/** Document hierarchy: a new doc was created (root or child). */
export const trackDocumentCreated = (
    properties: Required<Pick<AmplitudeEventProperties, "document_id">> &
        Pick<AmplitudeEventProperties, "parent_document_id">,
) => trackPageEvent("Document Created", properties);

/** Document hierarchy: a doc was moved to trash (archived). */
export const trackDocumentArchived = (
    properties: Required<Pick<AmplitudeEventProperties, "document_id">> &
        Pick<AmplitudeEventProperties, "has_children">,
) => trackPageEvent("Document Archived", properties);

/** Document hierarchy: a doc was restored from trash. */
export const trackDocumentRestored = (
    properties: Required<Pick<AmplitudeEventProperties, "document_id">>,
) => trackPageEvent("Document Restored", properties);

/** Document hierarchy: a doc was permanently deleted from trash. */
export const trackDocumentPermanentlyDeleted = (
    properties: Required<Pick<AmplitudeEventProperties, "document_id">>,
) => trackPageEvent("Document Permanently Deleted", properties);

/** Sharing: a doc was published to the public web. */
export const trackDocumentPublished = (
    properties: Required<
        Pick<AmplitudeEventProperties, "document_id" | "document_title">
    >,
) => trackPageEvent("Document Published", properties);

/** Sharing: a published doc was unpublished. */
export const trackDocumentUnpublished = (
    properties: Required<Pick<AmplitudeEventProperties, "document_id">>,
) => trackPageEvent("Document Unpublished", properties);

/** Sharing: the public preview link was copied to clipboard. */
export const trackPublicLinkCopied = (
    properties: Required<Pick<AmplitudeEventProperties, "document_id">>,
) => trackPageEvent("Public Link Copied", properties);

/** AI flow: the user sent a message to the floating coworker chat. */
export const trackCoworkerMessageSent = (
    properties: Required<
        Pick<AmplitudeEventProperties, "ai_provider" | "message_length_bucket">
    > &
        Pick<AmplitudeEventProperties, "squad_agent_id" | "document_id">,
) => trackPageEvent("Coworker Message Sent", properties);

/** AI flow: the user tested an API key against a provider. */
export const trackAIProviderTested = (
    properties: Required<
        Pick<AmplitudeEventProperties, "ai_provider" | "success">
    > &
        Pick<AmplitudeEventProperties, "error_category">,
) => trackPageEvent("AI Provider Tested", properties);

/** AI flow: the active provider/model was updated in settings. */
export const trackAISettingsUpdated = (
    properties: Required<Pick<AmplitudeEventProperties, "ai_provider">> &
        Pick<AmplitudeEventProperties, "ai_model" | "model_changed">,
) => trackPageEvent("AI Settings Updated", properties);

/**
 * AI flow: the user invoked an in-editor AI action from the slash menu.
 *
 * This is the counterpart to `trackCoworkerMessageSent`. Without it, "used AI"
 * means "used the Coworker panel", and the `/Ask AI` surface — which several
 * customers describe as the faster path to value — is invisible in every
 * activation funnel. `mode` distinguishes the BlockNote AI items so the two
 * surfaces can be compared rather than merged.
 *
 * Never pass the prompt, the selection, or any generated text.
 */
export const trackInEditorAiTriggered = (
    properties: Required<Pick<AmplitudeEventProperties, "mode">> &
        Pick<AmplitudeEventProperties, "document_id">,
) => trackPageEvent("In-Editor AI Triggered", properties);

/** Auth: a signed-out visitor became a signed-in user. */
export const trackUserLoggedIn = () => trackPageEvent("User Logged In");

/** Auth: a signed-in user signed out. */
export const trackUserLoggedOut = () => trackPageEvent("User Logged Out");

/** Appearance: the user selected a theme option. */
export const trackThemeChanged = (
    properties: Required<Pick<AmplitudeEventProperties, "theme">>,
) => trackPageEvent("Theme Changed", properties);

/** Landing: a user clicked a feature CTA from the landing page. */
export const trackLandingFeatureClicked = (
    properties: Required<
        Pick<AmplitudeEventProperties, "feature_name" | "destination_path">
    >,
) => trackPageEvent("Landing Feature Clicked", properties);

/** Landing: a user viewed a dedicated feature page. */
export const trackLandingFeaturePageVisited = (
    properties: Required<
        Pick<AmplitudeEventProperties, "feature_name" | "page_path">
    >,
) => trackPageEvent("Landing Feature Page Visited", properties);

/** Landing: a user viewed the Vibe PM hiring page. */
export const trackHiringVibePmsPageVisited = (
    properties: Required<Pick<AmplitudeEventProperties, "page_path">> &
        Pick<AmplitudeEventProperties, "feature_flag_key" | "feature_flag_variant">,
) => trackPageEvent("Hiring Vibe PMs Page Visited", properties);

/** Landing: a user clicked a CTA on the Vibe PM hiring page. */
export const trackHiringVibePmsCtaClicked = (
    properties: Required<
        Pick<AmplitudeEventProperties, "cta_label" | "destination_path">
    >,
) => trackPageEvent("Hiring Vibe PMs CTA Clicked", properties);
