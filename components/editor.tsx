"use client";

import { useCallback, useMemo, useEffect, useRef } from "react";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { filterSuggestionItems } from "@blocknote/core/extensions";
import {
  useCreateBlockNote,
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
import { BRAND_BLUE_SURFACE_HEX } from "@/lib/design-tokens";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useAuth } from "@clerk/clerk-react";
import { ServerSideTransport } from "@/lib/server-side-transport";
import { useTrackedUpload } from "@/hooks/use-tracked-upload";

import "@blocknote/core/style.css";
import "@blocknote/mantine/style.css";
import "@blocknote/xl-ai/style.css";

import { Id } from "@/convex/_generated/dataModel";
import { useFilePicker } from "@/hooks/use-file-picker";
import { withAiTracking } from "@/lib/in-editor-ai-tracking";
import { ImageIcon } from "lucide-react";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
  documentId?: Id<"documents">;
}

/**
 * Slash menu component with AI integration.
 * Uses built-in BlockNote AI items that integrate with AIMenuController.
 */
const SlashMenuWithAI = ({
  editor,
  hasAiConfig,
  documentId,
}: {
  editor: BlockNoteEditor;
  hasAiConfig: boolean;
  documentId?: Id<"documents">;
}) => {
  const dictionary = useDictionary();

  // Inject AI dictionary into editor when context is available
  useEffect(() => {
    if (dictionary && editor) {
      // eslint-disable-next-line react-hooks/immutability
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
      // Wrap the AI items so choosing one is measurable. Without this, "used
      // AI" only ever means the Coworker panel and `/Ask AI` is invisible in
      // every activation funnel.
      const aiItems = hasAiConfig
        ? withAiTracking(getAISlashMenuItems(editor), { documentId })
        : [];

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
    [editor, hasAiConfig, onOpen, documentId],
  );

  return (
    <SuggestionMenuController
      triggerCharacter="/"
      getItems={getMenuItems}
    />
  );
};

/**
 * BlockNote Editor with AI integration.
 * Uses BlockNote xl-ai with server-side API key management via Convex.
 */
const Editor = ({
  onChange,
  initialContent,
  editable,
  documentId,
}: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const { isAuthenticated } = useConvexAuth();
  const { getToken } = useAuth();
  const { uploadFile, deleteFile } = useTrackedUpload();

  const agent = useQuery(
    api.squadAgents.findByDocId,
    isAuthenticated && documentId ? { documentId } : "skip"
  );

  // File upload handler with storage limit tracking
  const handleUpload = async (file: File) => {
    const res = await uploadFile(file, { documentId });
    return res.url;
  };

  // Transport for AI requests (sends to our API route)
  const aiSettings = useQuery(
    api.aiSettings.getSettings,
    isAuthenticated ? {} : "skip"
  );
  const hasAiConfig = !!aiSettings;

  const aiTransport = useMemo(() => {
    return new ServerSideTransport(async () => {
      const token = await getToken({ template: "convex" });
      if (!token) throw new Error("Not authenticated");
      return token;
    });
  }, [getToken]);

  // Create editor with AI extension
  const editor = useCreateBlockNote({
    initialContent: initialContent
      ? (() => {
        try {
          return JSON.parse(initialContent) as PartialBlock[];
        } catch (e) {
          return undefined;
        }
      })()
      : undefined,
    uploadFile: handleUpload,
    extensions: [
      AIExtension({
        transport: aiTransport as any, // Cast to any to avoid ai SDK version mismatch
        agentCursor: { name: "AI", color: BRAND_BLUE_SURFACE_HEX },
      }),
    ],
  });

  // Handle fallback for non-JSON content (e.g. Markdown/HTML from AI)
  useEffect(() => {
    if (editor && initialContent) {
      try {
        JSON.parse(initialContent);
      } catch (e) {
        // Parsing failed, try to load as Markdown/HTML
        const blocks = editor.tryParseMarkdownToBlocks(initialContent);
        editor.replaceBlocks(editor.document, blocks);
      }
    }
  }, [editor, initialContent]);

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
    if (editor) {
      previousUrlsRef.current = getEditorFileUrls(editor);
    }
  }, [editor, getEditorFileUrls]);

  // Debounce updates to avoid spamming the database
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleEditorChange = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      // Check for deleted files
      const currentUrls = getEditorFileUrls(editor);

      previousUrlsRef.current.forEach((url) => {
        if (!currentUrls.has(url)) {
          deleteFile(url, documentId);
        }
      });

      previousUrlsRef.current = currentUrls;
      const contentStr = JSON.stringify(editor.document, null, 2);
      onChange(contentStr);

      saveTimerRef.current = null; // Clear timer ref when done
    }, 1000);
  }, [editor, onChange, deleteFile, getEditorFileUrls, documentId]);

  // Safe Silent Refresh: Update editor if initialContent changes externally (e.g. AI tool)
  // and we don't have pending local changes.
  useEffect(() => {
    if (editor && initialContent && !saveTimerRef.current) {
      try {
        const currentContent = JSON.stringify(editor.document, null, 2); // Match format used in onChange

        // If content differs significantly, update
        if (currentContent !== initialContent) {
          const blocks = JSON.parse(initialContent);
          editor.replaceBlocks(editor.document, blocks);
        }
      } catch (e) {
        // Ignore parsing errors or if content isn't blocks
      }
    }
  }, [initialContent, editor]);

  return (
    <div>
      <div className="-ml-[54px]">
        <BlockNoteView
          editable={editable}
          editor={editor}
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          onChange={handleEditorChange}
          slashMenu={false}
          formattingToolbar={false}
        >
          <SlashMenuWithAI
            editor={editor}
            hasAiConfig={hasAiConfig}
            documentId={documentId}
          />
          <FormattingToolbarWithAI hasAiConfig={hasAiConfig} />
          {hasAiConfig && <AIMenuController />}
        </BlockNoteView>
      </div>
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
