import { aiModeFromTitle, withAiTracking } from "@/lib/in-editor-ai-tracking";
import { trackInEditorAiTriggered } from "@/lib/analytics";

jest.mock("@/lib/analytics", () => ({
    trackInEditorAiTriggered: jest.fn(),
}));

const mockTrack = trackInEditorAiTriggered as jest.Mock;

beforeEach(() => {
    mockTrack.mockClear();
});

describe("aiModeFromTitle", () => {
    it("reads a question as ask", () => {
        expect(aiModeFromTitle("Ask AI")).toBe("ask");
    });

    it("reads a rewrite as edit", () => {
        expect(aiModeFromTitle("Rewrite selection")).toBe("edit");
        expect(aiModeFromTitle("Make shorter")).toBe("edit");
    });

    it("reads generation as continue", () => {
        expect(aiModeFromTitle("Continue writing")).toBe("continue");
    });

    it("is case-insensitive", () => {
        expect(aiModeFromTitle("TRANSLATE TO FRENCH")).toBe("edit");
    });

    it("falls back to ask for an item it does not recognize", () => {
        // BlockNote owns this list and changes it between versions. An unknown
        // item should still produce a usable event rather than nothing.
        expect(aiModeFromTitle("Summon a wizard")).toBe("ask");
    });
});

describe("withAiTracking", () => {
    it("emits the event with the derived mode and document id", () => {
        const [wrapped] = withAiTracking([{ title: "Ask AI", onItemClick: jest.fn() }], {
            documentId: "doc_123",
        });

        wrapped.onItemClick?.();

        expect(mockTrack).toHaveBeenCalledWith({
            mode: "ask",
            document_id: "doc_123",
        });
    });

    it("still calls the original handler", () => {
        const original = jest.fn();
        const [wrapped] = withAiTracking([{ title: "Continue writing", onItemClick: original }]);

        wrapped.onItemClick?.();

        expect(original).toHaveBeenCalledTimes(1);
    });

    it("tracks before delegating, so a throwing handler still reports the trigger", () => {
        const boom = jest.fn(() => {
            throw new Error("editor blew up");
        });
        const [wrapped] = withAiTracking([{ title: "Ask AI", onItemClick: boom }]);

        expect(() => wrapped.onItemClick?.()).toThrow("editor blew up");
        expect(mockTrack).toHaveBeenCalledTimes(1);
    });

    it("does not mutate the items it was given", () => {
        const original = jest.fn();
        const items = [{ title: "Ask AI", onItemClick: original }];

        withAiTracking(items);

        expect(items[0].onItemClick).toBe(original);
    });

    it("wraps an item with no handler rather than dropping it", () => {
        const [wrapped] = withAiTracking([{ title: "Ask AI" }]);

        expect(() => wrapped.onItemClick?.()).not.toThrow();
        expect(mockTrack).toHaveBeenCalledTimes(1);
    });

    it("omits document_id when there is no document in scope", () => {
        const [wrapped] = withAiTracking([{ title: "Ask AI" }]);

        wrapped.onItemClick?.();

        expect(mockTrack).toHaveBeenCalledWith({
            mode: "ask",
            document_id: undefined,
        });
    });
});
