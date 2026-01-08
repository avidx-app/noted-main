"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { Cover } from "@/components/cover";
import { Toolbar } from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";

interface DocumentIdPageProps {
  params: {
    documentId: Id<"documents">;
  };
}

const DocumentIdPage = ({ params }: DocumentIdPageProps) => {
  const Editor = useMemo(
    () => dynamic(() => import("@/components/editor"), { ssr: false }),
    [],
  );

  const document = useQuery(api.documents.getById, {
    documentId: params.documentId,
  });

  if (document === undefined) {
    return (
      <div>
        <Cover.Skeleton />
        <div className="mx-auto mt-10 md:max-w-3xl lg:max-w-4xl">
          <div className="space-y-4 pl-8 pt-4">
            <Skeleton className="h-14 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      </div>
    );
  }

  if (document === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 dark:bg-[#1F1F1F]">
        <Image
          src="/empty-pages-v3.svg"
          height="300"
          width="300"
          alt="Not found"
          className="dark:hidden"
        />
        <Image
          src="/empty-pages-v3-dark.svg"
          height="300"
          width="300"
          alt="Not found"
          className="hidden dark:block"
        />
        <h2 className="text-xl font-medium">Page not found</h2>
        <div className="text-muted-foreground text-sm text-center max-w-xs">
          This page may have been deleted or your access was removed.
        </div>
        <Button asChild>
          <Link href="/documents">Go back</Link>
        </Button>
      </div>
    );
  }

  const isReadOnly = (document as any).currentUserRole === "can_view";

  return (
    <div className="pb-40">
      <Cover url={document.coverImage} />
      <div className="mx-auto md:max-w-3xl lg:max-w-4xl">
        <Toolbar initialData={document} preview={isReadOnly} />
        <Editor
          documentId={params.documentId}
          editable={!isReadOnly}
          initialLegacyContent={document.content}
        />
      </div>
    </div>
  );
};
export default DocumentIdPage;
