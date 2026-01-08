"use client";

import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { useShareModal } from "@/hooks/use-share-modal";
import { Globe } from "lucide-react";

interface ShareButtonProps {
    documentId: Id<"documents">;
    isPublished?: boolean;
}

export const ShareButton = ({ documentId, isPublished }: ShareButtonProps) => {
    const shareModal = useShareModal();

    return (
        <Button
            size="sm"
            variant="ghost"
            onClick={() => shareModal.onOpen(documentId)}
        >
            Share
            {isPublished && <Globe className="ml-2 h-4 w-4 text-sky-500" />}
        </Button>
    );
};
