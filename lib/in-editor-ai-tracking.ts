/**
 * Instrumentation for the in-editor AI slash-menu items.
 *
 * The AI items come from `getAISlashMenuItems()` in `@blocknote/xl-ai`, so we
 * do not own their click handlers. This wraps each one, emits
 * `In-Editor AI Triggered`, and then calls the original — the tracking is
 * additive and cannot change what the item does.
 *
 * Kept out of the component so it can be tested without mounting BlockNote.
 */

import { trackInEditorAiTriggered } from "@/lib/analytics";

/**
 * The slice of a BlockNote suggestion item we touch. Deliberately structural
 * rather than importing `DefaultReactSuggestionItem`: we only need a title and
 * a click handler, and this keeps the helper testable with a plain object.
 */
export interface TrackableSuggestionItem {
    title: string;
    onItemClick?: () => void;
}

/**
 * Map an AI menu item's title to a coarse `mode`.
 *
 * Deliberately coarse. The point is to tell "asked a question" apart from
 * "rewrote a selection", not to mirror BlockNote's item list — that list is
 * theirs and changes between versions, and an unrecognised item should still
 * produce a usable event rather than nothing.
 */
export function aiModeFromTitle(title: string): string {
    const normalized = title.toLowerCase();

    // Edit is tested first, and `write` is anchored: "Rewrite selection"
    // contains "write", so a looser check classified rewriting as generation.
    // Stems rather than whole words: BlockNote ships "Make shorter", not
    // "Shorten", and the two should not classify differently.
    if (/rewrite|edit|fix|short|long|translate|simplif|tone|summar|improve/.test(normalized))
        return "edit";
    if (/continue|\bwrite\b|\bdraft\b|compose/.test(normalized)) return "continue";
    return "ask";
}

/**
 * Wrap AI suggestion items so invoking one emits `In-Editor AI Triggered`.
 *
 * Returns new item objects; the originals are not mutated. Items with no
 * `onItemClick` are still wrapped, because the user selecting one is the thing
 * being measured regardless of whether it does anything.
 */
export function withAiTracking<T extends TrackableSuggestionItem>(
    items: T[],
    context: { documentId?: string } = {},
): T[] {
    return items.map((item) => ({
        ...item,
        onItemClick: () => {
            trackInEditorAiTriggered({
                mode: aiModeFromTitle(item.title),
                document_id: context.documentId,
            });
            item.onItemClick?.();
        },
    }));
}
