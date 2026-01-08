"use client";

import { useCallback, useMemo, useEffect, useRef, useState } from "react";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { filterSuggestionItems } from "@blocknote/core/extensions";
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  DefaultReactSuggestionItem,
  useDictionary,
  FormattingToolbar,
  FormattingToolbarController,
  getFormattingToolbarItems,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import {
  AIExtension,
  getAISlashMenuItems,
  AIMenuController,
  AIToolbarButton,
} from "@blocknote/xl-ai";
import { en as aiEn } from "@blocknote/xl-ai/locales";
import { useTheme } from "next-themes";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useAuth } from "@clerk/clerk-react";
import { ServerSideTransport } from "@/lib/serverSideTransport";
import { useTrackedUpload } from "@/hooks/useTrackedUpload";
import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";

import "@blocknote/core/style.css";
import "@blocknote/mantine/style.css";
import "@blocknote/xl-ai/style.css";

import { Id } from "@/convex/_generated/dataModel";
import { useFilePicker } from "@/hooks/use-file-picker";
import { ImageIcon, Loader } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface EditorProps {
  editable?: boolean;
  documentId: Id<"documents">;
  initialLegacyContent?: string; // For migration from old content format
}

/**
 * Slash menu component with AI integration.
 * Uses built-in BlockNote AI items that integrate with AIMenuController.
 */
const SlashMenuWithAI = ({
  editor,
  hasAiConfig,
}: {
  editor: BlockNoteEditor;
  hasAiConfig: boolean;
}) => {
  const dictionary = useDictionary();

  // Inject AI dictionary into editor when context is available
  useEffect(() => {
    if (dictionary && editor) {
      (editor as any).dictionary = {
        ...(editor as any).dictionary,
        ...dictionary,
        ai: aiEn,
      };
    }
  }, [dictionary, editor]);

  const { onOpen } = useFilePicker();

  const getMenuItems = useCallback(
    async (query: string): Promise<DefaultReactSuggestionItem[]> => {
      const defaultItems = getDefaultReactSlashMenuItems(editor);

      // Only get AI items if AI extension is actually installed on the editor
      // The synced editor from useBlockNoteSync doesn't have AI extension
      let aiItems: DefaultReactSuggestionItem[] = [];
      if (hasAiConfig) {
        try {
          aiItems = getAISlashMenuItems(editor);
        } catch {
          // AI extension not available on this editor instance
        }
      }

      const insertImageFromLibrary: DefaultReactSuggestionItem = {
        title: "File from Library",
        onItemClick: () => {
          onOpen((url) => {
            if (editor) {
              const currentBlock = editor.getTextCursorPosition().block;
              editor.insertBlocks(
                [
                  {
                    type: "image",
                    props: { url },
                  },
                ],
                currentBlock,
                "after"
              );
            }
          });
        },
        aliases: ["library", "files", "upload", "media"],
        group: "Files",
        icon: <ImageIcon size={18} />,
      };

      // Use BlockNote's built-in filter function
      return filterSuggestionItems([...aiItems, insertImageFromLibrary, ...defaultItems], query);
    },
    [editor, hasAiConfig, onOpen],
  );

  return (
    <SuggestionMenuController
      triggerCharacter="/"
      getItems={getMenuItems}
    />
  );
};

/**
 * BlockNote Editor with real-time collaboration via Convex.
 * Uses @convex-dev/prosemirror-sync for collaborative editing.
 */
const Editor = ({
  editable = true,
  documentId,
  initialLegacyContent,
}: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const { isAuthenticated } = useConvexAuth();
  const { getToken } = useAuth();
  const { uploadFile, deleteFile } = useTrackedUpload();

  // Reactive query: UI updates immediately when settings change
  const aiSettings = useQuery(
    api.aiSettings.getSettings,
    isAuthenticated ? {} : "skip"
  );
  const hasAiConfig = !!aiSettings;

  // File upload handler with storage limit tracking
  const handleUpload = useCallback(async (file: File) => {
    const res = await uploadFile(file, { documentId });
    return res.url;
  }, [uploadFile, documentId]);

  // Transport for AI requests (sends to our API route)
  const aiTransport = useMemo(() => {
    return new ServerSideTransport(async () => {
      const token = await getToken({ template: "convex" });
      if (!token) throw new Error("Not authenticated");
      return token;
    });
  }, [getToken]);

  // Use the collaborative sync hook
  // Note: useBlockNoteSync creates and manages the editor internally
  const sync = useBlockNoteSync<BlockNoteEditor>(api.editorSync, documentId);

  // Inject AI extension into the synced editor
  useEffect(() => {
    if (sync.editor && hasAiConfig) {
      // AI extension is typically added at creation time
      // For now, AI features may be limited in collab mode until BlockNote supports dynamic extensions
    }
  }, [sync.editor, hasAiConfig, aiTransport]);

  // Track file URLs to handle deletions
  const previousUrlsRef = useRef<Set<string>>(new Set());

  // Helper to get all file URLs from the editor (images, videos, etc)
  const getEditorFileUrls = useCallback((currentEditor: BlockNoteEditor) => {
    const urls = new Set<string>();
    currentEditor.forEachBlock((block) => {
      // Check for various media types that store files
      if (
        ["image", "video", "audio", "file"].includes(block.type) &&
        (block.props as any).url
      ) {
        urls.add((block.props as any).url);
      }
      return true;
    });
    return urls;
  }, []);

  // Initialize previous URLs when editor is ready
  useEffect(() => {
    if (sync.editor) {
      previousUrlsRef.current = getEditorFileUrls(sync.editor);
    }
  }, [sync.editor, getEditorFileUrls]);

  // Handle file deletion tracking on editor changes
  const handleEditorChange = useCallback(() => {
    if (!sync.editor) return;

    // Check for deleted files
    const currentUrls = getEditorFileUrls(sync.editor);

    previousUrlsRef.current.forEach((url) => {
      if (!currentUrls.has(url)) {
        deleteFile(url, documentId);
      }
    });

    previousUrlsRef.current = currentUrls;
    // Note: sync component handles saving automatically, no need to call onChange
  }, [sync.editor, deleteFile, getEditorFileUrls, documentId]);

  // Track if component is mounted to prevent premature editor access
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Loading state
  if (sync.isLoading || !isMounted) {
    return (
      <div className="pl-[54px] space-y-4 pt-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  // Document doesn't exist in sync system yet - need to create/migrate
  if (!sync.editor) {
    // Auto-migrate from legacy content if available
    if (initialLegacyContent) {
      // Convert BlockNote JSON to ProseMirror format for sync
      // For now, create empty doc - user may need to copy content manually
      sync.create({ type: "doc", content: [] });
    }

    return (
      <div className="pl-[54px] pt-4 text-muted-foreground">
        <p>Setting up collaborative editing...</p>
        <button
          onClick={() => sync.create({ type: "doc", content: [] })}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Create new document
        </button>
      </div>
    );
  }

  // Note: AI features are disabled for synced editor because useBlockNoteSync
  // creates the editor internally without the AI extension.
  // TODO: Wait for BlockNote to support dynamic extension injection or
  // for prosemirror-sync to support editor customization.
  const syncedAiEnabled = false; // Disable AI for synced editor

  return (
    <div>
      <BlockNoteView
        editable={editable}
        editor={sync.editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        onChange={handleEditorChange}
        slashMenu={false}
        formattingToolbar={false}
      >
        <SlashMenuWithAI editor={sync.editor} hasAiConfig={syncedAiEnabled} />
        <FormattingToolbarWithAI hasAiConfig={syncedAiEnabled} />
        {syncedAiEnabled && <AIMenuController />}
      </BlockNoteView>
    </div>
  );
};

function FormattingToolbarWithAI({ hasAiConfig }: { hasAiConfig: boolean }) {
  return (
    <FormattingToolbarController
      formattingToolbar={() => (
        <FormattingToolbar>
          {getFormattingToolbarItems()}
          {hasAiConfig && <AIToolbarButton />}
        </FormattingToolbar>
      )}
    />
  );
}

export default Editor;
