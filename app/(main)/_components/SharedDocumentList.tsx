"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { FileIcon, Users } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Item } from "./Item";
import { DocumentList } from "./DocumentList";

export const SharedDocumentList = () => {
    const params = useParams();
    const router = useRouter();
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const onExpand = (documentId: string) => {
        setExpanded((prevExpanded) => ({
            ...prevExpanded,
            [documentId]: !prevExpanded[documentId],
        }));
    };

    const sharedDocuments = useQuery(api.pageShares.getSharedPages);

    const onRedirect = (documentId: string) => {
        router.push(`/documents/${documentId}`);
    };

    if (sharedDocuments === undefined) {
        return (
            <>
                <Item.Skeleton level={0} />
            </>
        );
    }

    if (sharedDocuments === null || sharedDocuments.length === 0) {
        return null;
    }

    return (
        <>
            <div className="mt-4">
                <div className="pl-3 py-1 mt-2 text-xs font-medium text-muted-foreground/60 flex items-center gap-x-2">
                    Shared
                </div>
                {sharedDocuments.map((document: any) => (
                    <div key={document._id}>
                        <Item
                            id={document._id}
                            onClick={() => onRedirect(document._id)}
                            label={document.title}
                            icon={FileIcon}
                            documentIcon={document.icon}
                            active={params.documentId === document._id}
                            level={0}
                            onExpand={() => onExpand(document._id)}
                            expanded={expanded[document._id]}
                            role={document.sharedRole}
                        />
                        {expanded[document._id] && (
                            <DocumentList parentDocumentId={document._id} level={1} />
                        )}
                    </div>
                ))}
            </div>
        </>
    );
};
