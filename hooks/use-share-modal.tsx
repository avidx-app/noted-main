import { create } from "zustand";
import { Id } from "@/convex/_generated/dataModel";

interface ShareModalStore {
    isOpen: boolean;
    documentId: Id<"documents"> | null;
    onOpen: (documentId: Id<"documents">) => void;
    onClose: () => void;
}

export const useShareModal = create<ShareModalStore>((set) => ({
    isOpen: false,
    documentId: null,
    onOpen: (documentId) => set({ isOpen: true, documentId }),
    onClose: () => set({ isOpen: false, documentId: null }),
}));
